import { BasicUserProfile, ChatMessage } from '../types/basic-coach';

const STORAGE_KEYS = {
  PROFILE: 'basic-coach-profile',
  MESSAGES: 'basic-coach-messages',
} as const;

export class BasicCoachStorage {
  static saveProfile(profile: BasicUserProfile): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  }

  static loadProfile(): BasicUserProfile | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (!stored) return null;
      
      const profile = JSON.parse(stored) as BasicUserProfile;
      return profile;
    } catch (error) {
      console.error('Failed to load profile:', error);
      return null;
    }
  }

  static saveMessages(messages: ChatMessage[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to save messages:', error);
    }
  }

  static loadMessages(): ChatMessage[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (!stored) return [];
      
      const messages = JSON.parse(stored) as ChatMessage[];
      return messages;
    } catch (error) {
      console.error('Failed to load messages:', error);
      return [];
    }
  }

  static clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.PROFILE);
      localStorage.removeItem(STORAGE_KEYS.MESSAGES);
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }
}