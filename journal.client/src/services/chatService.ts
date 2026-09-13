import { API_BASE_URL } from '../config/api';

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
}

export interface ChatSession {
    id: string;
    userId: string;
    messages: ChatMessage[];
    createdAt: string;
    lastMessageAt: string;
    title: string;
    isActive: boolean;
}

export interface ChatRequest {
    message: string;
    sessionId?: string;
}

export interface CrisisResource {
    name: string;
    phoneNumber: string;
    textNumber: string;
    description: string;
    url: string;
    isAvailable24_7: boolean;
}

export interface ChatResponse {
    sessionId: string;
    message: string;
    timestamp: string;
    isCrisisDetected?: boolean;
    crisisReason?: string;
    crisisResources?: CrisisResource[];
}

const getAuthHeaders = (token?: string) => {
    const authToken = token || localStorage.getItem('token') || '';
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
};

export const chatService = {
    async sendMessage(token: string, request: ChatRequest): Promise<ChatResponse> {
        const response = await fetch(`${API_BASE_URL}/chat/message`, {
            method: 'POST',
            headers: getAuthHeaders(token),
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to send message: ${error}`);
        }

        return response.json();
    },

    async getSession(token: string, sessionId: string): Promise<ChatSession> {
        const response = await fetch(`${API_BASE_URL}/chat/session/${sessionId}`, {
            headers: getAuthHeaders(token),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to get session: ${error}`);
        }

        return response.json();
    },

    async getSessions(token: string): Promise<ChatSession[]> {
        const response = await fetch(`${API_BASE_URL}/chat/sessions`, {
            headers: getAuthHeaders(token),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to get sessions: ${error}`);
        }

        return response.json();
    },

    async deleteSession(token: string, sessionId: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/chat/session/${sessionId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(token),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to delete session: ${error}`);
        }
    },
};
