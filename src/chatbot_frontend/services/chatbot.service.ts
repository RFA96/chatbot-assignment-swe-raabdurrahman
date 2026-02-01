import { apiClient } from '@/lib/api-client';
import type {
  ChatResponse,
  CreateSessionResponse,
  ChatSessionsResponse,
  SessionHistoryResponse,
  DeleteSessionResponse,
} from '@/types/api';

/**
 * Chatbot service for AI shopping assistant
 */
export const chatbotService = {
  /**
   * Send a message to the chatbot
   */
  async sendMessage(message: string, sessionId?: string): Promise<ChatResponse> {
    return apiClient.post<ChatResponse>('/chatbot/chat', {
      message,
      session_id: sessionId,
    });
  },

  /**
   * Create a new chat session
   */
  async createSession(): Promise<CreateSessionResponse> {
    return apiClient.post<CreateSessionResponse>('/chatbot/chat/sessions');
  },

  /**
   * Get customer's chat sessions (requires authentication)
   */
  async getSessions(limit: number = 10): Promise<ChatSessionsResponse> {
    return apiClient.get<ChatSessionsResponse>('/chatbot/chat/sessions', { limit });
  },

  /**
   * Get chat history for a specific session
   */
  async getSessionHistory(sessionId: string): Promise<SessionHistoryResponse> {
    return apiClient.get<SessionHistoryResponse>(`/chatbot/chat/sessions/${sessionId}`);
  },

  /**
   * Delete a chat session and all its messages
   */
  async deleteSession(sessionId: string): Promise<DeleteSessionResponse> {
    return apiClient.delete<DeleteSessionResponse>(`/chatbot/chat/sessions/${sessionId}`);
  },
};
