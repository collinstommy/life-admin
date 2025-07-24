// Basic AI Coach TypeScript interfaces

export interface BasicUserProfile {
  profileText: string;
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatRequest {
  message: string;
  profileText: string;
}

export interface ChatResponse {
  message: string;
  success: boolean;
  error?: string;
}

export interface BasicCoachState {
  profile: BasicUserProfile | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}