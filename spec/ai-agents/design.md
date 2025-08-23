# Voice Task System Design

## Task Executor Requirements

### What Are These Task Executors?

These are **Task Executors** - specialized components that handle specific domains of user requests. They're not autonomous AI agents, but rather focused modules that process structured intents and perform domain-specific operations. Each executor is responsible for understanding its domain's requirements, validating inputs, and executing the requested actions.

### 1. Expense List Task Executor

**Domain**: Financial expense tracking  
**Primary Actions**: Add expenses with automatic categorization

**Example Inputs**:
- "Add expense 200 euro for shower door"
- "Add 500 euro expense for car repair"
- "Add 200 for groceries"


**Requirements**:
- **Currency Handling**: User input in euros → store as cents in database → display as euros (multiply by 100)
- **Category Classification**: AI should automatically categorize expenses using these predefined categories:
  - entertainment
  - house maintenance  
  - furniture
  - car
  - house decoration
  - garden
  - travel
  - groceries
  - other
- **Single Expense List**: All expenses go to one list, differentiated by category
- **Required Parameters**: 
  - Amount (convert euro input to cents)
  - Description/item name
  - Category (auto-determined by AI from description)
- **Validation**: 
  - Amount must be positive number
  - Description cannot be empty
  - Category must match one of predefined options, default to "other" if not specified
- **Error Handling**:
  - Invalid amount: "I need a valid amount"


### 2. Book List Task Executor  

**Domain**: Reading list management via Hardcover API
**Primary Actions**: Search and add books to reading list

**Example Inputs**:
- "Add \"To Kill a Mockingbird\" to my reading list"
- "Add the book Dune by Frank Herbert to my list"

**Requirements**:
- **Book Search Flow**:
  - Extract book title/author from user input
  - Search Hardcover API for matching books
  - Handle search results:
    - **1 match**: Automatically add to list with confirmation
    - **Multiple matches**: Present options, ask user to choose
    - **No matches**: "I couldn't find that book. Can you provide more details like the author or full title?"
- **Third-Party Integration**: Add books directly to Hardcover app via API (no local storage)
- **Required Parameters**:
  - Book identifier (title, author, or both)
- **API Integration**:
  - Use existing Hardcover API endpoints
  - Books are stored in Hardcover, not in our local database
  - Handle API rate limits and errors gracefully
- **Validation**:
  - Book title cannot be empty
  - Valid Hardcover API response required for successful addition

### 3. General List Task Executor

**Domain**: Arbitrary text-based lists (shopping, tasks, notes)
**Primary Actions**: Add text items to named lists

**Example Inputs**:
- "Add milk to my shopping list"
- "Add fix shed door to my DIY list"
- "Create a new list called project ideas"


**Requirements**:
- **List Types**: Support any user-defined list name (shopping, DIY, tasks, etc.)
- **Item Storage**: Store raw text string as provided by user
- **List Management**:
  - Auto-create lists if they don't exist
  - Support multiple list types simultaneously
- **Routing Logic**: 
  - **Critical**: If input contains "expense", "cost", "euro", "money" → route to Expense Agent instead
  - If input contains "book", "reading", "hardcover" → route to Book Task Executor instead
  - Otherwise process as general list item
- **Required Parameters**:
  - Item text/description
  - List name (extract from context: "shopping list", "DIY list")
- **Examples**:
  - "add milk to my shopping list" → list: "shopping", item: "milk"
  - "add fix shed door to my DIY list" → list: "DIY", item: "fix shed door"
- **Validation**:
  - Item text cannot be empty
  - List name must be extractable from input

**Cross-Executor Routing**:
- Expense keywords → Expense Task Executor
- Book/reading keywords → Book Task Executor  
- Everything else → General List Task Executor

### Overview
Uses AI for intent recognition and parameter extraction, with structured approach and simple retry logic. This design provides a good balance of flexibility and implementation complexity while reusing existing Gemini infrastructure.

### Architecture Diagram
```
Voice Input
    ↓
Transcription (Gemini)
    ↓
Intent Classifier (AI) ──→ Confidence Score
    ↓                          ↓
Parameter Extractor (AI)   < 0.8? → Clarification Request
    ↓
Task Router
    ↓
┌─────────────────┐
│  Task Executors │
├─────────────────┤
│ • ExpenseTask   │
│ • BookTask      │ 
│ • ListTask      │
└─────────────────┘
    ↓
Response Generator
```

## Technical Components

### 1. AI SDK Tools System

**Task Executor Tools**
```typescript
import { generateText, tool } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

const expenseTools = {
  addExpense: tool({
    description: 'Add an expense with automatic categorization',
    parameters: z.object({
      amount: z.number().positive(),
      description: z.string().min(1),
      category: z.enum(['entertainment', 'house_maintenance', 'furniture', 'car', 'house_decoration', 'garden', 'travel', 'groceries', 'other']).optional()
    }),
    execute: async ({ amount, description, category }) => {
      // Convert euros to cents, categorize if needed
      const amountInCents = Math.round(amount * 100);
      const finalCategory = category || await categorizeExpense(description);
      return { success: true, message: `Added ${amount}€ expense for ${description}`, category: finalCategory };
    }
  })
};

const bookTools = {
  addBook: tool({
    description: 'Search and add a book to Hardcover reading list',
    parameters: z.object({
      title: z.string().min(3),
      author: z.string().optional()
    }),
    execute: async ({ title, author }) => {
      // Search Hardcover API and add book
      return { success: true, message: `Added "${title}" to your reading list` };
    }
  })
};

const listTools = {
  addToList: tool({
    description: 'Add item to a general list',
    parameters: z.object({
      listName: z.string().min(3),
      item: z.string().min(3)
    }),
    execute: async ({ listName, item }) => {
      // Add item to specified list
      return { success: true, message: `Added "${item}" to your ${listName} list` };
    }
  }),
  
  createList: tool({
    description: 'Create a new general list',
    parameters: z.object({
      listName: z.string().min(3)
    }),
    execute: async ({ listName }) => {
      // Create new list
      return { success: true, message: `Created new list called "${listName}"` };
    }
  })
};
```

### 2. Voice Agent Implementation

**Main Voice Agent**
```typescript
class VoiceTaskAgent {
  private allTools = { ...expenseTools, ...bookTools, ...listTools };
  
  async processVoiceCommand(transcript: string): Promise<TaskResult> {
    const { text, toolCalls } = await generateText({
      model: google('gemini-pro'),
      tools: this.allTools,
      system: `You are a voice assistant that helps with:
        - Expense tracking with automatic categorization (entertainment, house_maintenance, furniture, car, house_decoration, garden, travel, groceries, other)
        - Adding books to Hardcover reading list via API
        - Managing general lists (shopping, DIY, tasks, etc.)
        
        Route requests appropriately:
        - Expense keywords (expense, cost, euro, money) → use addExpense tool
        - Book keywords (book, reading, hardcover) → use addBook tool  
        - Everything else → use addToList tool`,
      prompt: transcript
    });

    if (toolCalls.length === 0) {
      return { success: false, message: "I didn't understand that. Can you rephrase?" };
    }

    // Execute the first tool call
    const result = await toolCalls[0].execute();
    return result;
  }
}
```

### 3. Database Schema (Drizzle)

```typescript
import { integer, text, sqliteTable } from 'drizzle-orm/sqlite-core';

// Task Tracking
export const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey(),
  userMessage: text('user_message'),
  intentJson: text('intent_json'),
  status: text('status').$type<'pending' | 'completed' | 'failed'>(),
  resultJson: text('result_json'),
  createdAt: integer('created_at'),
  updatedAt: integer('updated_at')
});

// Expense Domain
export const expenseLists = sqliteTable('expense_lists', {
  id: integer('id').primaryKey(),
  name: text('name').unique(),
  createdAt: integer('created_at'),
  updatedAt: integer('updated_at')
});

export const expenses = sqliteTable('expenses', {
  id: integer('id').primaryKey(),
  listId: integer('list_id').references(() => expenseLists.id),
  amount: integer('amount'), // stored in cents
  currency: text('currency'),
  description: text('description'),
  category: text('category').$type<'entertainment' | 'house_maintenance' | 'furniture' | 'car' | 'house_decoration' | 'garden' | 'travel' | 'groceries' | 'other'>(),
  createdAt: integer('created_at'),
  updatedAt: integer('updated_at')
});

// General Lists
export const lists = sqliteTable('lists', {
  id: integer('id').primaryKey(),
  name: text('name'),
  createdAt: integer('created_at'),
  updatedAt: integer('updated_at')
});

export const listItems = sqliteTable('list_items', {
  id: integer('id').primaryKey(),
  listId: integer('list_id').references(() => lists.id),
  item: text('item'),
  createdAt: integer('created_at'),
  updatedAt: integer('updated_at')
});
```

**Notes:**
- Books: No local storage - uses Hardcover API directly


### 4. Retry Logic

**Simple Retry Implementation**
```typescript
interface TaskResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

async function executeWithRetry(intent: Intent, maxRetries = 2): Promise<TaskResult> {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const result = await executeTask(intent);
      
      // Log successful execution
      await logTaskExecution(intent, result, 'completed');
      
      return result;
    } catch (error) {
      console.log(`Task execution attempt ${i + 1} failed:`, error);
      
      if (i === maxRetries) {
        const failureResult = {
          success: false,
          message: "Task failed after retries",
          error: error.message
        };
        
        await logTaskExecution(intent, failureResult, 'failed');
        return failureResult;
      }
      
      // Simple backoff before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

## API Endpoints

### Voice Task Processing
```typescript
// Main endpoint for voice task processing
app.post("/api/voice-task", zValidator('json', voiceTaskSchema), async (c) => {
  const { transcript } = c.req.valid('json');
  
  try {
    // 1. Classify intent using AI
    const intent = await classifyIntent(transcript);
    
    // 2. Check confidence threshold
    if (intent.confidence < 0.8) {
      return c.json({
        success: false,
        message: "I'm not sure what you want me to do. Can you rephrase that?",
        clarificationNeeded: true
      });
    }
    
    // 3. Execute task with retry
    const result = await executeWithRetry(intent);
    
    return c.json({
      success: result.success,
      message: result.message,
      data: result.data,
      intent: intent
    });
    
  } catch (error) {
    return c.json({
      success: false,
      message: "Failed to process voice command",
      error: error.message
    }, 500);
  }
});
```

### Task Management Endpoints
```typescript
// Get task history
app.get("/api/tasks", async (c) => {
  const tasks = await getAllTasks(c as AppContext);
  return c.json(tasks);
});

// Get specific task details
app.get("/api/tasks/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const task = await getTaskById(c as AppContext, id);
  return c.json(task);
});

// Retry failed task
app.post("/api/tasks/:id/retry", async (c) => {
  const id = parseInt(c.req.param("id"));
  const task = await getTaskById(c as AppContext, id);
  
  if (task && task.status === 'failed') {
    const intent = JSON.parse(task.intent_json);
    const result = await executeWithRetry(intent);
    return c.json(result);
  }
  
  return c.json({ error: "Task not found or not retryable" }, 400);
});
```

## Implementation Plan

### Phase 1: Core Infrastructure
1. **Database Schema Setup**
   - Create task tracking tables
   - Set up expense domain tables
   - Add Drizzle ORM schemas and relations

2. **AI Intent System**
   - Implement intent classification with Gemini
   - Create parameter extraction prompts
   - Add confidence scoring logic

3. **Task Execution Framework**
   - Build abstract TaskExecutor class
   - Implement ExpenseTaskExecutor
   - Add basic retry logic

### Phase 2: Expense Feature Implementation
1. **Expense Operations**
   - Add expense to existing list
   - Create new expense lists
   - Validate list existence and parameters

2. **API Endpoints**
   - Voice task processing endpoint
   - Task history and management endpoints
   - Integration with existing auth system

3. **Frontend Integration**
   - Add voice task recording component
   - Display task results and history
   - Handle clarification requests

### Phase 3: Testing & Refinement
1. **Test Voice Commands**
   - Test various expense-related phrases
   - Validate parameter extraction accuracy
   - Test error scenarios and retries

2. **UI Polish**
   - Improve voice feedback
   - Add task status indicators
   - Handle loading states

### Phase 4: Future Extensibility
1. **Book Task Executor**
   - Implement book search API integration
   - Add book list management
   - Test reading list commands

2. **Additional Domains**
   - Framework ready for new task types
   - Easy addition of new executors
   - Extensible intent classification

## Example Usage Flows

### Adding an Expense
```
User: "Add expense to house list. 200 euro for shower door"
↓
System: Transcribes → "Add expense to house list. 200 euro for shower door"
↓
AI Intent Classification:
{
  "action": "add",
  "domain": "expense", 
  "confidence": 0.95,
  "parameters": {
    "listName": "house",
    "amount": 200,
    "currency": "euro",
    "description": "shower door"
  }
}
↓
ExpenseTaskExecutor.execute():
- Validate house list exists
- Create expense record
- Return success confirmation
↓
Response: "Added 200 euro expense for shower door to your house list"
```

### Creating a List
```
User: "Create a new expense list called 'vacation'"
↓
AI Intent Classification:
{
  "action": "create_list",
  "domain": "expense",
  "confidence": 0.92,
  "parameters": {
    "listName": "vacation"
  }
}
↓
ExpenseTaskExecutor.execute():
- Check if list already exists
- Create new expense_list record
- Return success confirmation
↓
Response: "Created new expense list called 'vacation'"
```

## Benefits of This Design

1. **Flexible Natural Language Processing**: AI handles variations in phrasing
2. **Extensible Architecture**: Easy to add new domains and task types
3. **Reuses Existing Infrastructure**: Leverages current Gemini integration
4. **Simple Error Handling**: Basic retry logic with user feedback
5. **Clear Separation of Concerns**: Intent classification → Task execution → Response
6. **Database Integration**: Proper tracking and history of all tasks
7. **Confidence-Based Clarification**: Asks for clarification when uncertain

This design provides a solid foundation for the voice task system while maintaining reasonable complexity and leveraging the existing codebase effectively.