import { ChatRequest, ChatResponse } from '../types/basic-coach';

export class BasicCoachClient {
  private static readonly API_BASE = '/api/basic-coach';

  static async sendMessage(message: string, profileText: string): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.API_BASE}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          profileText,
        } as ChatRequest),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as ChatResponse;
      return data;
    } catch (error) {
      console.error('Failed to send message:', error);
      return {
        message: 'Sorry, I encountered an error. Please try again.',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}