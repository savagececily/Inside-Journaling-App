import apiClient from '../api/client';
import {
  ChatRequest,
  ChatResponse,
  ChatSession,
} from '../../types/api';

export const chatService = {
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await apiClient.post<ChatResponse>('/chat/message', request);
    return response.data;
  },

  async getSession(sessionId: string): Promise<ChatSession> {
    const response = await apiClient.get<ChatSession>(`/chat/session/${sessionId}`);
    return response.data;
  },

  async getSessions(): Promise<ChatSession[]> {
    const response = await apiClient.get<ChatSession[]>('/chat/sessions');
    return response.data;
  },

  async deleteSession(sessionId: string): Promise<void> {
    await apiClient.delete(`/chat/session/${sessionId}`);
  },
};

export default chatService;
