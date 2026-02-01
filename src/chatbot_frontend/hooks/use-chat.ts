'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useChatStore } from '@/stores/chat-store';
import { useCartStore } from '@/stores/cart-store';
import { useAuthStore } from '@/stores/auth-store';
import { chatbotService } from '@/services/chatbot.service';
import { cartService } from '@/services/cart.service';
import { defaultQuickReplies } from '@/components/features/chat/quick-replies';
import type { MessageContent, QuickReplyOption, ChatMessage } from '@/types/chat';
import type { ChatProduct, ChatSession } from '@/types/api';

export function useChat() {
  const {
    messages,
    isLoading,
    isTyping,
    suggestedReplies,
    sessionId,
    sessions,
    isLoadingSessions,
    isLoadingHistory,
    addMessage,
    setLoading,
    setTyping,
    setError,
    setSuggestedReplies,
    clearMessages,
    setSessionId,
    setSessions,
    setLoadingSessions,
    setLoadingHistory,
    setMessages,
    startNewSession,
  } = useChatStore();

  const { updateItemCount } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const isInitialized = useRef(false);
  const lastUserMessageRef = useRef<string | null>(null);

  // Load sessions on mount if authenticated
  useEffect(() => {
    if (isAuthenticated && !isInitialized.current) {
      isInitialized.current = true;
      loadSessions();
    }
  }, [isAuthenticated]);

  // Load user's chat sessions
  const loadSessions = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoadingSessions(true);
    try {
      const response = await chatbotService.getSessions(20);
      setSessions(response?.sessions || []);
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  }, [isAuthenticated, setLoadingSessions, setSessions]);

  // Load history for a specific session
  const loadSessionHistory = useCallback(
    async (targetSessionId: string) => {
      setLoadingHistory(true);
      try {
        const response = await chatbotService.getSessionHistory(targetSessionId);

        // Convert API messages to ChatMessage format
        const chatMessages: ChatMessage[] = (response?.messages || []).map((msg, index) => ({
          id: `${targetSessionId}-${index}`,
          role: msg.role === 'model' ? 'assistant' : 'user',
          content: [{ type: 'text', text: msg.content }],
          timestamp: msg.created_at,
        }));

        setMessages(chatMessages);
        setSessionId(targetSessionId);
      } catch (error) {
        console.error('Failed to load session history:', error);
        setError('Failed to load chat history');
      } finally {
        setLoadingHistory(false);
      }
    },
    [setLoadingHistory, setMessages, setSessionId, setError]
  );

  // Switch to a different session
  const switchSession = useCallback(
    async (session: ChatSession) => {
      if (session.session_id === sessionId) return;
      await loadSessionHistory(session.session_id);
    },
    [sessionId, loadSessionHistory]
  );

  // Extract product IDs mentioned in the response text
  const extractProductIdsFromText = (text: string): number[] => {
    // Match patterns like "Product ID: 123" or "(Product ID: 123)"
    const idMatches = text.match(/Product ID[:\s]+(\d+)/gi) || [];
    const ids = idMatches.map((match) => {
      const num = match.match(/\d+/);
      return num ? parseInt(num[0], 10) : 0;
    }).filter((id) => id > 0);

    return [...new Set(ids)]; // Remove duplicates
  };

  // Check if response text indicates cart context
  const isCartContext = (text: string): boolean => {
    const lowerText = text.toLowerCase();
    return (
      lowerText.includes('in your cart') ||
      lowerText.includes('your cart') ||
      lowerText.includes("here's what's in your cart") ||
      lowerText.includes('cart contains') ||
      lowerText.includes('items in cart')
    );
  };

  // Create products content from API response
  const createProductContent = (
    products: ChatProduct[],
    responseText?: string
  ): MessageContent[] => {
    if (!products || products.length === 0) return [];

    // If we have response text, filter products to only show those mentioned
    let filteredProducts = products;
    if (responseText) {
      const mentionedIds = extractProductIdsFromText(responseText);
      if (mentionedIds.length > 0) {
        filteredProducts = products.filter((p) =>
          mentionedIds.includes(p.product_id)
        );
        // Fallback to all products if no matches found
        if (filteredProducts.length === 0) {
          filteredProducts = products;
        }
      }
    }

    // Convert ChatProduct to Product format for display
    // Note: ProductCard component generates image URLs from product_id
    const formattedProducts = filteredProducts.map((p) => ({
      product_id: p.product_id,
      product_name: p.product_name,
      product_brand: p.product_brand,
      retail_price: p.retail_price,
      department: p.department,
      product_category_id: '',
      created_at: new Date().toISOString(),
    }));

    // Check if this is showing cart items (don't show "Add to Cart" button)
    const isCartView = responseText ? isCartContext(responseText) : false;

    return [
      {
        type: 'product_list',
        products: formattedProducts,
        title: isCartView ? 'Items in your cart' : 'Products for you',
        showAddToCart: !isCartView,
      },
    ];
  };

  // Send a user message and get bot response
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      // Save last user message for retry
      lastUserMessageRef.current = text;

      // Add user message
      addMessage('user', [{ type: 'text', text }]);
      setLoading(true);
      setTyping(true);

      try {
        // Send to chatbot API
        const response = await chatbotService.sendMessage(text, sessionId || undefined);

        // Update session ID if this is a new session
        if (!sessionId && response.session_id) {
          setSessionId(response.session_id);
        }

        setTyping(false);

        // Build response content
        const content: MessageContent[] = [];

        // Add text response
        if (response.response) {
          content.push({ type: 'text', text: response.response });
        }

        // Add products if available (filter to only show products mentioned in response)
        if (response.products && response.products.length > 0) {
          content.push(...createProductContent(response.products, response.response));
        }

        // Add bot response
        if (content.length > 0) {
          addMessage('assistant', content);
        }

        // Update suggested replies based on response
        updateSuggestedReplies(response.response, response.products);

        // Refresh sessions list if authenticated
        if (isAuthenticated) {
          loadSessions();
        }
      } catch (error) {
        setTyping(false);
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        addMessage('assistant', [
          { type: 'error', message: errorMessage },
        ]);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [sessionId, addMessage, setLoading, setTyping, setError, setSessionId, isAuthenticated, loadSessions]
  );

  // Update suggested replies based on context
  const updateSuggestedReplies = (response: string, products?: ChatProduct[]) => {
    const lowerResponse = response.toLowerCase();
    const newReplies: QuickReplyOption[] = [];

    // If products were returned, suggest adding to cart
    if (products && products.length > 0) {
      newReplies.push({
        id: 'more-products',
        label: 'Show more',
        action: { type: 'send_message', message: 'Show me more products' },
      });
      newReplies.push({
        id: 'view-cart',
        label: 'View Cart',
        action: { type: 'view_cart' },
      });
    }

    // Context-based suggestions
    if (lowerResponse.includes('cart') || lowerResponse.includes('added')) {
      newReplies.push({
        id: 'checkout',
        label: 'Checkout',
        action: { type: 'send_message', message: 'I want to checkout' },
      });
      newReplies.push({
        id: 'continue-shopping',
        label: 'Continue Shopping',
        action: { type: 'send_message', message: 'Show me more products' },
      });
    }

    if (lowerResponse.includes('voucher') || lowerResponse.includes('discount')) {
      newReplies.push({
        id: 'apply-voucher',
        label: 'Apply Voucher',
        action: { type: 'send_message', message: 'What vouchers are available?' },
      });
    }

    // Default suggestions if none matched
    if (newReplies.length === 0) {
      setSuggestedReplies(defaultQuickReplies);
    } else {
      setSuggestedReplies(newReplies);
    }
  };

  // Handle quick reply actions
  const handleQuickReply = useCallback(
    async (option: QuickReplyOption) => {
      switch (option.action.type) {
        case 'send_message':
          await sendMessage(option.action.message);
          break;

        case 'view_cart':
          await sendMessage('Show me my cart');
          break;

        case 'add_to_cart':
          await handleAddToCart(option.action.productId);
          break;

        case 'view_product':
          await sendMessage(`Show me details for product ${option.action.productId}`);
          break;

        case 'apply_voucher':
          await sendMessage(`Apply voucher ${option.action.code}`);
          break;

        case 'checkout':
          await sendMessage('I want to checkout');
          break;

        case 'navigate':
          // Navigation would be handled by the page component
          break;
      }
    },
    [sendMessage]
  );

  // Add to cart
  const handleAddToCart = useCallback(
    async (productId: number) => {
      setLoading(true);

      try {
        await cartService.addToCart(productId);
        const countResponse = await cartService.getCartCount();
        updateItemCount(countResponse.count);

        addMessage('assistant', [
          {
            type: 'text',
            text: `Great choice! The item has been added to your cart. You now have ${countResponse.count} items in your cart.`,
          },
        ]);

        setSuggestedReplies([
          { id: 'view-cart', label: 'View Cart', action: { type: 'view_cart' } },
          { id: 'checkout', label: 'Checkout', action: { type: 'send_message', message: 'I want to checkout' } },
          { id: 'continue', label: 'Continue Shopping', action: { type: 'send_message', message: 'Show me more products' } },
        ]);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to add item';
        addMessage('assistant', [
          { type: 'error', message: errorMessage },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [addMessage, setLoading, updateItemCount, setSuggestedReplies]
  );

  // Handle view product - send message to chatbot
  const handleViewProduct = useCallback(
    async (productId: number) => {
      await sendMessage(`Tell me more about product ${productId}`);
    },
    [sendMessage]
  );

  // Start a new chat session
  const handleStartNewSession = useCallback(() => {
    startNewSession();
    setSuggestedReplies(defaultQuickReplies);
  }, [startNewSession, setSuggestedReplies]);

  // Clear messages and start fresh
  const handleClearMessages = useCallback(() => {
    clearMessages();
    setSuggestedReplies(defaultQuickReplies);
  }, [clearMessages, setSuggestedReplies]);

  // Retry last failed message
  const handleRetry = useCallback(() => {
    if (lastUserMessageRef.current) {
      // Remove the last error message from the messages
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant' &&
          lastMessage.content.some(c => c.type === 'error')) {
        // The sendMessage will add a new user message, so we don't need to remove anything
        // Just resend the last message
        sendMessage(lastUserMessageRef.current);
      }
    }
  }, [messages, sendMessage]);

  // Delete a chat session
  const deleteSession = useCallback(
    async (targetSessionId: string) => {
      try {
        await chatbotService.deleteSession(targetSessionId);

        // Remove from local sessions list
        setSessions((sessions || []).filter((s) => s.session_id !== targetSessionId));

        // If the deleted session was the current one, start a new session
        if (targetSessionId === sessionId) {
          startNewSession();
          setSuggestedReplies(defaultQuickReplies);
        }

        return true;
      } catch (error) {
        console.error('Failed to delete session:', error);
        return false;
      }
    },
    [sessions, sessionId, setSessions, startNewSession, setSuggestedReplies]
  );

  return {
    // State
    messages,
    isLoading,
    isTyping,
    suggestedReplies: suggestedReplies.length > 0 ? suggestedReplies : defaultQuickReplies,
    sessionId,
    sessions,
    isLoadingSessions,
    isLoadingHistory,
    isAuthenticated,

    // Actions
    sendMessage,
    handleQuickReply,
    handleAddToCart,
    handleViewProduct,
    handleRetry,
    clearMessages: handleClearMessages,
    startNewSession: handleStartNewSession,
    loadSessions,
    loadSessionHistory,
    switchSession,
    deleteSession,
  };
}
