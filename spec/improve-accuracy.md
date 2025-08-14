# AI JSON Generation Accuracy Improvements

## Problem Analysis

The health data extraction from transcript to JSON has reliability issues, particularly during edit operations. While transcript creation is reliable, the conversion from text to structured JSON sometimes produces inconsistent or invalid results.

## Root Causes Identified

1. **Inconsistent JSON parsing** - AI responses sometimes include markdown fences or malformed JSON
2. **Lack of validation** - No schema validation after AI response generation
3. **Complex merge logic** - Edit operations require understanding context and intent
4. **Temperature settings** - Current 0.1 temperature may still allow too much variation
5. **Limited error handling** - Single-pass processing with minimal fallback options

## Improvement Strategies

### 1. JSON Schema Validation & Auto-Correction
**Priority: HIGH | Effort: LOW**

- Add strict Zod schema validation after AI response
- Implement auto-correction for common field issues (missing fields, wrong types)
- Fallback to default values for invalid/missing required fields
- Return validation errors with specific field information

```typescript
// Example implementation
const healthDataSchema = z.object({
  date: z.string().nullable(),
  screenTimeHours: z.number().nullable(),
  workouts: z.array(workoutSchema),
  // ... other fields
});

function validateAndCorrect(data: unknown): StructuredHealthData {
  const result = healthDataSchema.safeParse(data);
  if (!result.success) {
    // Apply corrections and defaults
    return applyDefaults(data);
  }
  return result.data;
}
```

### 2. Response Parsing Enhancements
**Priority: HIGH | Effort: LOW**

- Implement more robust JSON extraction (handle multiple JSON blocks)
- Add fallback parsing strategies for malformed responses
- Progressive JSON repair for common issues
- Better handling of markdown fences and extra text

```typescript
function extractAndParseJSON(text: string): any {
  // Try multiple extraction strategies
  const strategies = [
    () => JSON.parse(text), // Direct parse
    () => JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}'), // Regex extraction
    () => JSON.parse(text.replace(/^```json\n?|\n?```$/g, '')), // Remove markdown
    () => repairAndParse(text) // Progressive repair
  ];
  
  for (const strategy of strategies) {
    try {
      return strategy();
    } catch (e) {
      continue;
    }
  }
  throw new Error('All parsing strategies failed');
}
```

### 3. AI Model Configuration Improvements
**Priority: HIGH | Effort: LOW**

- Decrease temperature to 0.05 for more deterministic outputs
- Ensure consistent use of `responseMimeType: "application/json"`
- Add explicit stop sequences to prevent over-generation
- Use structured generation parameters where available

### 4. Prompt Engineering Enhancements
**Priority: MEDIUM | Effort: MEDIUM**

- Add JSON schema directly in prompts
- Include negative examples (what NOT to do)
- Use structured prompting with field-by-field instructions
- Add explicit format constraints and validation rules

```typescript
const improvedPrompt = `
CRITICAL: You must respond with ONLY valid JSON. No explanations, no markdown fences.

Schema (follow exactly):
{
  "date": "YYYY-MM-DD" | null,
  "workouts": [{"type": string, "durationMinutes": number, ...}],
  ...
}

Invalid examples to avoid:
- Multiple JSON objects
- JSON with comments
- Markdown code blocks
- Extra explanatory text

Valid response format:
{"date": null, "workouts": [], ...}
`;
```

### 5. Retry Mechanisms with Smart Prompts
**Priority: MEDIUM | Effort: MEDIUM**

- Implement smart retry with prompt modifications
- Add exponential backoff for API failures
- Use different model variants as fallbacks
- Include validation errors in retry prompts

```typescript
async function extractWithRetry(transcript: string, maxRetries = 3): Promise<StructuredHealthData> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await extractHealthData(transcript);
      return validateAndCorrect(result);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      // Modify prompt based on error type
      const enhancedPrompt = addErrorContext(transcript, error);
      await delay(Math.pow(2, attempt) * 1000); // Exponential backoff
    }
  }
}
```

### 6. Edit-Specific Validation & Context
**Priority: MEDIUM | Effort: MEDIUM**

- Pre-validate original data before merging
- Use more explicit merge operation keywords in prompts
- Implement field-level confidence scoring
- Add rollback capability if merge fails validation

```typescript
function validateMergeOperation(
  original: StructuredHealthData, 
  update: string, 
  result: StructuredHealthData
): boolean {
  // Validate that merge makes logical sense
  // Check for data loss or corruption
  // Verify operation intent was understood
  return isValidMerge(original, update, result);
}
```

### 7. Multi-Pass AI Processing
**Priority: LOW | Effort: HIGH**

- First pass: Extract raw data with loose validation
- Second pass: Clean and validate the extracted data  
- Third pass: Final consistency check and correction
- Use different prompts optimized for each pass

### 8. Comprehensive Data Validation Pipeline
**Priority: LOW | Effort: HIGH**

- Implement detailed Zod schemas for all health data types
- Add field-level validation with specific error messages
- Create data sanitization functions for common issues
- Build validation reporting and debugging tools

## Implementation Priority

### Phase 1: Immediate Wins (Week 1)
1. JSON Schema Validation with Zod
2. Enhanced Response Parsing
3. AI Model Configuration tuning

### Phase 2: Medium-term Improvements (Week 2-3)  
4. Prompt Engineering enhancements
5. Retry Mechanisms
6. Edit-specific validation

### Phase 3: Long-term Enhancements (Month 2)
7. Multi-pass processing
8. Comprehensive validation pipeline

## Success Metrics

- **Accuracy**: >95% valid JSON responses
- **Edit Success Rate**: >90% successful merge operations
- **Error Recovery**: <5% unrecoverable failures
- **Response Time**: <3 seconds average processing time

## Technical Considerations

- Maintain backward compatibility with existing data
- Ensure graceful degradation when AI services are unavailable
- Add comprehensive logging for debugging and monitoring
- Consider caching successful patterns for future optimization