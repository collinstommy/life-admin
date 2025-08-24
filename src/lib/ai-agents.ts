import { generateText, tool } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import { expenses } from '../db/schema';

interface TaskResult {
  success: boolean;
  message: string;
  data?: any;
}


// Expense tools for AI SDK  
export function createExpenseTools(db: any, geminiApiKey: string) {
  const drizzleDb = drizzle(db);
  
  return {
    addExpense: tool({
      description: 'Add an expense with automatic categorization',
      inputSchema: z.object({
        amount: z.number().positive().describe('Amount in euros'),
        description: z.string().min(1).describe('Description of the expense'),
        category: z.enum(['entertainment', 'house_maintenance', 'furniture', 'car', 'house_decoration', 'garden', 'travel', 'groceries', 'other']).describe('Expense category')
      }),
      execute: async ({ amount, description, category }: { 
        amount: number; 
        description: string; 
        category: 'entertainment' | 'house_maintenance' | 'furniture' | 'car' | 'house_decoration' | 'garden' | 'travel' | 'groceries' | 'other';
      }) => {
        try {
          console.log('Tool called with params:', { amount, description, category });
          
          // Validate inputs
          if (!amount || !description || !category) {
            return 'Error: Missing required parameters. Please specify amount, description, and category.';
          }
          
          // Convert euros to cents
          const amountInCents = Math.round(amount * 100);
          
          // Insert expense
          const now = Date.now();
          await drizzleDb.insert(expenses).values({
            amount: amountInCents,
            currency: 'EUR',
            description,
            category: category as any,
            createdAt: now,
            updatedAt: now
          }).returning().get();
          
          console.log(`Added expense: €${amount} for "${description}" (${category})`);
          
          return `Added €${amount} expense for "${description}" (category: ${category})`;
        } catch (error) {
          console.error('Error adding expense:', error);
          return 'Sorry, I couldn\'t add that expense. Please try again.';
        }
      }
    })
  };
}

// Main Voice Task Agent for Expenses
export class ExpenseTaskAgent {
  private tools: ReturnType<typeof createExpenseTools>;
  private geminiApiKey: string;
  private google: any;
  
  constructor(db: any, geminiApiKey: string) {
    this.geminiApiKey = geminiApiKey;
    this.google = createGoogleGenerativeAI({
      apiKey: geminiApiKey,
    });
    this.tools = createExpenseTools(db, geminiApiKey);
  }
  
  async processMessage(message: string): Promise<TaskResult> {
    try {
      const result = await generateText({
        model: this.google('gemini-2.5-flash'),
        tools: this.tools,
        system: `You are an expense tracking assistant. 

        Extract the amount, description, AND category from the user's message and use the addExpense tool.

        Available categories: entertainment, house_maintenance, furniture, car, house_decoration, garden, travel, groceries, other

        Examples:
        "Add 50 euro for groceries" → addExpense(amount=50, description="groceries", category="groceries") 
        "200 euro expense for car repair" → addExpense(amount=200, description="car repair", category="car")
        "Add 25 euro for Netflix" → addExpense(amount=25, description="Netflix", category="entertainment")
        "Bought a couch for 800 euros" → addExpense(amount=800, description="couch", category="furniture")
        "Paid 120 euro for garden plants" → addExpense(amount=120, description="garden plants", category="garden")

        ALWAYS determine the most appropriate category from the list above. Choose "other" only if no category clearly fits.`,
        prompt: message
      });

      
      const { text, toolCalls, steps } = result;

      if (toolCalls.length > 0) {
        console.log('AI response text:', text);
        console.log('Tool calls:', toolCalls);
        console.log('Steps:', steps);
        
        // Get the tool results from the steps
        const allToolResults = steps?.flatMap(step => step.toolResults || []) || [];
        console.log('Tool results from steps:', allToolResults);
        
        // Use the first tool result if available and it's a string
        if (allToolResults.length > 0) {
          const firstToolResult = allToolResults[0].output;
          console.log('First tool result:', firstToolResult);
          
          if (firstToolResult && typeof firstToolResult === 'string') {
            return {
              success: true,
              message: firstToolResult
            };
          }
        }
        
        // Fallback: Use AI's response text if available
        if (text && text.trim()) {
          return {
            success: true,
            message: text
          };
        }
        
        // Final fallback: create a generic success message
        return {
          success: true,
          message: 'Perfect! Your expense has been added and categorized automatically.'
        };
      } else {
        // No tool was called - ask for clarification or provide help
        return { 
          success: false, 
          message: text || "I can help you add expenses! Try saying something like 'Add 50 euro for groceries' or 'Add 200 euro expense for car repair'."
        };
      }
    } catch (error) {
      console.error('Error processing message:', error);
      return { 
        success: false, 
        message: 'Sorry, I encountered an error. Please try again.' 
      };
    }
  }
}