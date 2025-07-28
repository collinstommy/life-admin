# Voice Task System Design

## Architecture: AI-Powered Intent Classification

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

### 1. AI Intent System

**Intent Interface**
```typescript
interface Intent {
  action: string;        // add, create, search, etc.
  confidence: number;    // 0-1 confidence score
  parameters: Record<string, any>;  // extracted parameters
  domain: string;        // expense, book, list, etc.
}
```

**Intent Classification**
```typescript
async function classifyIntent(transcript: string): Promise<Intent> {
  const prompt = `
Analyze this voice command and extract:
- action: (add, create, search, etc.)
- domain: (expense, book, list)  
- parameters: (amount, name, description, etc.)
- confidence: 0-1

Input: "${transcript}"
Return JSON format.
`;
  
  return await callGeminiAPI(prompt);
}
```

### 2. Task Execution Framework

**Abstract Task Executor**
```typescript
abstract class TaskExecutor {
  abstract domain: string;
  abstract execute(intent: Intent): Promise<TaskResult>;
  abstract validate(intent: Intent): boolean;
}
```

**Expense Task Implementation**
```typescript
class ExpenseTaskExecutor extends TaskExecutor {
  domain = "expense";
  
  async execute(intent: Intent): Promise<TaskResult> {
    switch(intent.action) {
      case "add":
        return await this.addExpense(intent.parameters);
      case "create_list":
        return await this.createList(intent.parameters);
    }
  }
  
  validate(intent: Intent): boolean {
    // Validate required parameters for expense operations
    if (intent.action === "add") {
      return intent.parameters.amount && intent.parameters.listName;
    }
    return true;
  }
}
```

### 3. Database Schema

**Task Tracking**
```sql
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY,
  voice_input TEXT,
  intent_json TEXT,
  status TEXT, -- pending, completed, failed
  result_json TEXT,
  created_at INTEGER,
  updated_at INTEGER
);
```

**Expense Domain Tables**
```sql
CREATE TABLE expense_lists (
  id INTEGER PRIMARY KEY,
  name TEXT UNIQUE,
  user_context TEXT, -- JSON for user preferences/mappings
  created_at INTEGER,
  updated_at INTEGER
);

CREATE TABLE expenses (
  id INTEGER PRIMARY KEY,
  list_id INTEGER REFERENCES expense_lists(id),
  amount REAL,
  currency TEXT,
  description TEXT,
  created_at INTEGER,
  updated_at INTEGER
);
```

**Future Domain Tables**
```sql
-- Books domain (for future implementation)
CREATE TABLE book_lists (
  id INTEGER PRIMARY KEY,
  name TEXT UNIQUE,
  list_type TEXT, -- hardcover, kindle, wishlist, etc.
  created_at INTEGER
);

CREATE TABLE books (
  id INTEGER PRIMARY KEY,
  list_id INTEGER REFERENCES book_lists(id),
  title TEXT,
  author TEXT,
  isbn TEXT,
  external_id TEXT, -- API reference
  status TEXT, -- to_read, reading, completed
  created_at INTEGER
);
```

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