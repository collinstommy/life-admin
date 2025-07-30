// AI SDK Agent Solution - Voice Task System
// Using @ai-sdk/google and structured tool calling

import { generateText, tool, CoreMessage } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

// Database schema types
const expenseSchema = z.object({
  id: z.number(),
  listName: z.string(),
  amount: z.number(),
  currency: z.string(),
  description: z.string(),
  createdAt: z.date()
});

// Tool definitions for expense operations
const expenseTools = {
  addExpense: tool({
    description: 'Add an expense to a specific list',
    parameters: z.object({
      amount: z.number().describe('The expense amount'),
      currency: z.string().default('USD').describe('Currency code'),
      listName: z.string().describe('Name of the expense list'),
      description: z.string().describe('Description of the expense')
    }),
    execute: async ({ amount, currency, listName, description }) => {
      // Simulate database operation
      console.log(`AI SDK: Adding ${amount} ${currency} to ${listName} for ${description}`);
      
      return {
        success: true,
        message: `Added ${amount} ${currency} to ${listName} for ${description}`,
        expense: {
          id: Math.floor(Math.random() * 1000),
          amount,
          currency,
          listName,
          description,
          createdAt: new Date()
        }
      };
    }
  }),
  
  createExpenseList: tool({
    description: 'Create a new expense list',
    parameters: z.object({
      listName: z.string().describe('Name for the new expense list')
    }),
    execute: async ({ listName }) => {
      console.log(`AI SDK: Creating new list: ${listName}`);
      
      return {
        success: true,
        message: `Created new expense list called '${listName}'`,
        list: {
          id: Math.floor(Math.random() * 1000),
          name: listName,
          createdAt: new Date()
        }
      };
    }
  }),
  
  searchExpenses: tool({
    description: 'Search expenses in a specific list',
    parameters: z.object({
      listName: z.string().describe('Name of the expense list to search'),
      limit: z.number().default(10).describe('Maximum number of results')
    }),
    execute: async ({ listName, limit }) => {
      console.log(`AI SDK: Searching expenses in ${listName}`);
      
      return {
        success: true,
        message: `Found 3 expenses in ${listName}`,
        expenses: [
          { amount: 25, description: "Groceries", date: new Date('2024-01-15') },
          { amount: 50, description: "Dinner", date: new Date('2024-01-14') },
          { amount: 15, description: "Coffee", date: new Date('2024-01-13') }
        ].slice(0, limit)
      };
    }
  })
};

// AI SDK Agent Configuration
class VoiceAIAgent {
  private systemPrompt = `
You are a helpful voice assistant for expense tracking and management.

Your role is to:
1. Understand natural language voice commands about expenses
2. Extract precise amounts, currencies, and descriptions
3. Use the appropriate tools to perform actions
4. Provide clear, conversational responses

Guidelines:
- Extract exact amounts and currencies from the command
- Identify the target list name accurately
- Create descriptive summaries for expenses
- Ask for clarification if information is missing
- Be conversational but precise

Example commands you should handle:
- "Add 50 dollars to grocery list for milk and bread"
- "Create a new expense list called vacation"
- "Search expenses in my house list"
- "Add 25 euro expense to weekend list for dinner"
  `.trim();

  async processVoiceCommand(transcript: string): Promise<{
    success: boolean;
    message: string;
    data?: any;
    toolUsed?: string;
  }> {
    try {
      const { text, toolCalls } = await generateText({
        model: google('gemini-pro'),
        tools: expenseTools,
        system: this.systemPrompt,
        prompt: transcript,
        maxTokens: 500,
        temperature: 0.1
      });

      if (toolCalls.length === 0) {
        return {
          success: false,
          message: "I didn't understand what you want me to do. Can you rephrase that?",
          data: null
        };
      }

      // Execute the first tool call
      const toolCall = toolCalls[0];
      const result = await toolCall.execute();
      
      return {
        success: result.success,
        message: result.message,
        data: result,
        toolUsed: toolCall.toolName
      };

    } catch (error) {
      return {
        success: false,
        message: "Sorry, I encountered an error processing your request",
        data: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async processWithStreaming(transcript: string) {
    const { textStream, toolCalls } = await generateText({
      model: google('gemini-pro'),
      tools: expenseTools,
      system: this.systemPrompt,
      prompt: transcript,
      maxTokens: 500,
      temperature: 0.1
    });

    // For streaming responses
    return { textStream, toolCalls };
  }
}

// Advanced agent with conversation history
class ConversationalVoiceAgent {
  private messages: CoreMessage[] = [];
  private systemPrompt = `
You are an intelligent expense tracking assistant. You can:
- Add expenses to lists with natural language
- Create new expense lists
- Search and summarize expenses
- Handle complex, multi-turn conversations

Always be helpful and precise with amounts and details.
  `.trim();

  async processWithHistory(transcript: string) {
    this.messages.push({ role: 'user', content: transcript });
    
    try {
      const { text, toolCalls } = await generateText({
        model: google('gemini-pro'),
        tools: expenseTools,
        system: this.systemPrompt,
        messages: this.messages,
        maxTokens: 1000
      });

      this.messages.push({ role: 'assistant', content: text });

      if (toolCalls.length > 0) {
        const results = await Promise.all(
          toolCalls.map(tc => tc.execute())
        );
        
        return {
          success: true,
          message: text,
          toolResults: results,
          toolCount: toolCalls.length
        };
      }

      return {
        success: true,
        message: text,
        toolResults: [],
        toolCount: 0
      };

    } catch (error) {
      return {
        success: false,
        message: "Error processing request",
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  clearHistory() {
    this.messages = [];
  }
}


// Error handling utilities
class VoiceAgentError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'VoiceAgentError';
  }
}

// Export for usage
export { 
  VoiceAIAgent, 
  ConversationalVoiceAgent, 
  VoiceAgentError,
  expenseTools 
};