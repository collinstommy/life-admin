// Custom Agent Solution - Voice Task System
// Based on the design from design.md

interface Intent {
  action: string;
  confidence: number;
  parameters: Record<string, any>;
  domain: string;
}

interface TaskResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

abstract class TaskExecutor {
  abstract domain: string;
  abstract execute(intent: Intent): Promise<TaskResult>;
  abstract validate(intent: Intent): boolean;
}

// Expense Task Executor Implementation
class ExpenseTaskExecutor extends TaskExecutor {
  domain = "expense";
  
  async execute(intent: Intent): Promise<TaskResult> {
    if (!this.validate(intent)) {
      return {
        success: false,
        message: "Missing required parameters",
        error: "Validation failed"
      };
    }

    try {
      switch(intent.action) {
        case "add":
          return await this.addExpense(intent.parameters);
        case "create_list":
          return await this.createList(intent.parameters);
        case "search":
          return await this.searchExpenses(intent.parameters);
        default:
          return {
            success: false,
            message: `Unknown action: ${intent.action}`,
            error: "Unsupported action"
          };
      }
    } catch (error) {
      return {
        success: false,
        message: "Task execution failed",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  
  validate(intent: Intent): boolean {
    switch(intent.action) {
      case "add":
        return !!(intent.parameters.amount && intent.parameters.listName);
      case "create_list":
        return !!(intent.parameters.listName);
      case "search":
        return !!(intent.parameters.listName);
      default:
        return false;
    }
  }
  
}

// Intent Classification Service
class IntentClassifier {
  async classify(transcript: string): Promise<Intent> {
    const prompt = `
Analyze this voice command and extract:
- action: (add, create_list, search, etc.)
- domain: (expense, book, list)  
- parameters: (amount, name, description, etc.)
- confidence: 0-1

Input: "${transcript}"
Return JSON format:
{
  "action": "string",
  "confidence": 0.95,
  "parameters": {},
  "domain": "expense"
}
    `.trim();
    
    // Simulate Gemini API call
    const mockResponse = this.mockIntentClassification(transcript);
    return mockResponse;
  }
  
}

// Task Router
class TaskRouter {
  private executors: Map<string, TaskExecutor> = new Map();
  
  constructor() {
    this.executors.set("expense", new ExpenseTaskExecutor());
  }
  
  async route(intent: Intent): Promise<TaskResult> {
    const executor = this.executors.get(intent.domain);
    if (!executor) {
      return {
        success: false,
        message: `Unknown domain: ${intent.domain}`,
        error: "No executor found"
      };
    }
    
    return await executor.execute(intent);
  }
}

// Main Voice Task Processor
class VoiceTaskProcessor {
  private classifier = new IntentClassifier();
  private router = new TaskRouter();
  
  async process(transcript: string): Promise<TaskResult> {
    try {
      // 1. Classify intent
      const intent = await this.classifier.classify(transcript);
      
      // 2. Check confidence
      if (intent.confidence < 0.8) {
        return {
          success: false,
          message: "I'm not sure what you want me to do. Can you rephrase that?",
          error: "Low confidence"
        };
      }
      
      // 3. Route and execute
      return await this.router.route(intent);
      
    } catch (error) {
      return {
        success: false,
        message: "Failed to process voice command",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
}

// Usage example
async function exampleUsage() {
  const processor = new VoiceTaskProcessor();
  
  console.log("=== Custom Agent Examples ===");
  
  const examples = [
    "Add expense to grocery list. 50 dollars for milk and bread",
    "Create a new expense list called vacation",
    "Search expenses in house list"
  ];
  
  for (const transcript of examples) {
    console.log(`\nInput: "${transcript}"`);
    const result = await processor.process(transcript);
    console.log(`Result: ${result.message}`);
  }
}

export { VoiceTaskProcessor, Intent, TaskResult, TaskExecutor, ExpenseTaskExecutor };