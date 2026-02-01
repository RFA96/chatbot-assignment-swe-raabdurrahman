import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '@/lib/utils';
import type {
  ChatMessage,
  ChatState,
  QuickReplyOption,
  MessageContent,
} from '@/types/chat';
import type { ChatSession } from '@/types/api';

interface ChatStore extends ChatState {
  // Session management
  sessionId: string | null;
  sessions: ChatSession[];
  isLoadingSessions: boolean;
  isLoadingHistory: boolean;

  // Actions
  addMessage: (role: ChatMessage['role'], content: MessageContent[]) => string;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  deleteMessage: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setTyping: (typing: boolean) => void;
  setError: (error: string | null) => void;
  setSuggestedReplies: (replies: QuickReplyOption[]) => void;
  clearMessages: () => void;
  reset: () => void;

  // Session actions
  setSessionId: (sessionId: string | null) => void;
  setSessions: (sessions: ChatSession[]) => void;
  setLoadingSessions: (loading: boolean) => void;
  setLoadingHistory: (loading: boolean) => void;
  setMessages: (messages: ChatMessage[]) => void;
  startNewSession: () => void;
}

const initialState: ChatState & {
  sessionId: string | null;
  sessions: ChatSession[];
  isLoadingSessions: boolean;
  isLoadingHistory: boolean;
} = {
  messages: [],
  isLoading: false,
  isTyping: false,
  error: null,
  conversationId: generateId(),
  suggestedReplies: [],
  sessionId: null,
  sessions: [],
  isLoadingSessions: false,
  isLoadingHistory: false,
};

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      ...initialState,

      addMessage: (role, content) => {
        const id = generateId();
        const message: ChatMessage = {
          id,
          role,
          content,
          timestamp: new Date().toISOString(),
        };

        set((state) => ({
          messages: [...state.messages, message],
        }));

        return id;
      },

      updateMessage: (id, updates) => {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === id ? { ...msg, ...updates } : msg
          ),
        }));
      },

      deleteMessage: (id) => {
        set((state) => ({
          messages: state.messages.filter((msg) => msg.id !== id),
        }));
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setTyping: (typing) => set({ isTyping: typing }),
      setError: (error) => set({ error }),
      setSuggestedReplies: (replies) => set({ suggestedReplies: replies }),

      clearMessages: () =>
        set({
          messages: [],
          conversationId: generateId(),
          sessionId: null,
        }),

      reset: () => set(initialState),

      // Session actions
      setSessionId: (sessionId) => set({ sessionId }),
      setSessions: (sessions) => set({ sessions }),
      setLoadingSessions: (loading) => set({ isLoadingSessions: loading }),
      setLoadingHistory: (loading) => set({ isLoadingHistory: loading }),
      setMessages: (messages) => set({ messages }),
      startNewSession: () =>
        set({
          messages: [],
          sessionId: null,
          conversationId: generateId(),
          suggestedReplies: [],
        }),
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        messages: state.messages.slice(-50), // Keep last 50 messages
        conversationId: state.conversationId,
        sessionId: state.sessionId,
      }),
    }
  )
);
