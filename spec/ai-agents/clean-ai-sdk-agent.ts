import { generateText, tool } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

const expenseTools = {
  addExpense: tool({
    description: 'Add an expense to a specific list',
    parameters: z.object({
      amount: z.number(),
      currency: z.string().default('USD'),
      listName: z.string(),
      description: z.string()
    }),
    execute: async ({ amount, currency, listName, description }) => {
      return { success: true, message: "Expense added" };
    }
  }),
  
  createExpenseList: tool({
    description: 'Create a new expense list',
    parameters: z.object({
      listName: z.string()
    }),
    execute: async ({ listName }) => {
      return { success: true, message: "List created" };
    }
  }),
  
  searchExpenses: tool({
    description: 'Search expenses in a specific list',
    parameters: z.object({
      listName: z.string(),
      limit: z.number().default(10)
    }),
    execute: async ({ listName, limit }) => {
      return { success: true, message: "Expenses found" };
    }
  })
};

class VoiceAIAgent {
  private systemPrompt = `You are a voice assistant for expense tracking`;

  async processVoiceCommand(transcript: string) {
    const { text, toolCalls } = await generateText({
      model: google('gemini-pro'),
      tools: expenseTools,
      system: this.systemPrompt,
      prompt: transcript
    });

    if (toolCalls.length === 0) {
      return { success: false, message: "No action understood" };
    }

    const result = await toolCalls[0].execute();
    return { success: result.success, message: result.message };
  }
}

class ConversationalVoiceAgent {
  private messages: any[] = [];
  private systemPrompt = `You are an expense tracking assistant`;

  async processWithHistory(transcript: string) {
    this.messages.push({ role: 'user', content: transcript });
    
    const { text, toolCalls } = await generateText({
      model: google('gemini-pro'),
      tools: expenseTools,
      system: this.systemPrompt,
      messages: this.messages
    });

    this.messages.push({ role: 'assistant', content: text });
    return { success: true, message: text };
  }
}

class VoiceAgentError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}

export { VoiceAIAgent, ConversationalVoiceAgent, VoiceAgentError, expenseTools };