import { AppContext } from "../types";
import { StructuredHealthData } from "./ai";

export interface JudgeResult {
  score: number;           // 0-100 overall accuracy score
  passed: boolean;         // Overall pass/fail (score >= 80)
  analysis: {
    completeness: number;   // 0-100 - Were all updates applied?
    accuracy: number;       // 0-100 - Are changes semantically correct?
    preservation: number;   // 0-100 - Was existing data preserved?
    schema: number;         // 0-100 - Is output structure valid?
  };
  issues: string[];        // Specific problems found
  explanation: string;     // Detailed reasoning
}

interface GeminiJudgeResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

/**
 * Uses AI to judge the accuracy of a merge operation
 * @param ctx Hono context with API key
 * @param originalData Original health data before merge
 * @param updateTranscript The update text that was applied
 * @param resultData The merged result data
 * @returns JudgeResult with detailed analysis
 */
export async function judgeHealthDataMerge(
  ctx: AppContext,
  originalData: StructuredHealthData,
  updateTranscript: string,
  resultData: StructuredHealthData
): Promise<JudgeResult> {
  const apiKey = ctx.env.GEMINI_API_KEY;

  // Fallback for missing API key
  if (!apiKey) {
    console.warn("GEMINI_API_KEY not available for judge, using basic validation");
    return basicValidation(originalData, updateTranscript, resultData);
  }

  try {
    console.log("=== AI JUDGE DEBUG START ===");
    console.log("Judge evaluating merge accuracy...");
    console.log("Judge - Original date:", originalData.date);
    console.log("Judge - Result date:", resultData.date);
    console.log("Judge - Update transcript:", JSON.stringify(updateTranscript));
    console.log("Judge - Date changed:", originalData.date !== resultData.date);

    const modelId = "gemini-2.5-pro"; // Use most advanced model for judging
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

    const judgePrompt = generateJudgePrompt(originalData, updateTranscript, resultData);
    console.log("Judge prompt (first 500 chars):", judgePrompt.substring(0, 500));

    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [{ text: judgePrompt }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1, // Low temperature for consistent evaluation
      },
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Judge API error:", errorText);
      return basicValidation(originalData, updateTranscript, resultData);
    }

    const data = (await response.json()) as GeminiJudgeResponse;
    const text = data.candidates[0]?.content?.parts[0]?.text;

    if (!text) {
      console.error("Empty response from AI Judge");
      return basicValidation(originalData, updateTranscript, resultData);
    }

    console.log("Judge raw response (first 500 chars):", text.substring(0, 500));

    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Could not extract JSON from judge response:", text);
      return basicValidation(originalData, updateTranscript, resultData);
    }

    const judgeResult = JSON.parse(jsonMatch[0]) as JudgeResult;
    console.log("AI Judge evaluation completed, score:", judgeResult.score);
    console.log("Judge result breakdown:", {
      completeness: judgeResult.analysis.completeness,
      accuracy: judgeResult.analysis.accuracy,
      preservation: judgeResult.analysis.preservation,
      schema: judgeResult.analysis.schema,
      issues: judgeResult.issues,
      explanation: judgeResult.explanation.substring(0, 200) + "..."
    });
    console.log("=== AI JUDGE DEBUG END ===");
    
    return judgeResult;

  } catch (error) {
    console.error("Error in AI Judge:", error);
    return basicValidation(originalData, updateTranscript, resultData);
  }
}

/**
 * Generates the prompt for the AI judge
 */
function generateJudgePrompt(
  originalData: StructuredHealthData,
  updateTranscript: string,
  resultData: StructuredHealthData
): string {
  return `You are an expert evaluator of health data merge operations. Your task is to judge how accurately an AI system merged an update into existing health data.

ORIGINAL HEALTH DATA:
${JSON.stringify(originalData, null, 2)}

UPDATE TRANSCRIPT:
"${updateTranscript}"

MERGED RESULT:
${JSON.stringify(resultData, null, 2)}

Evaluate the merge operation on these criteria:

1. COMPLETENESS (0-100): Were ALL updates from the transcript properly applied?
   - Check if every piece of information in the update was incorporated
   - Look for missing additions, corrections, or modifications

2. ACCURACY (0-100): Are the changes semantically correct and logical?
   - Do corrections properly replace old values?
   - Are additions placed in correct categories?
   - Are measurements, times, and quantities accurate?

3. PRESERVATION (0-100): Was existing data properly preserved?
   - Is unrelated original data unchanged?
   - Were existing entries maintained when they should be?
   - No unintended data loss or corruption?

4. SCHEMA (0-100): Is the output structure valid and consistent?
   - Proper JSON schema compliance
   - Correct data types (numbers, strings, arrays)
   - Required fields present

Judge these specific scenarios:
- "I also had..." → Should ADD to existing data
- "Actually..." / "Change my..." → Should REPLACE/UPDATE existing data  
- "I forgot to mention..." → Should ADD new information
- Multiple changes → Should handle each change appropriately

Respond with ONLY this JSON format:
{
  "score": <overall_score_0_to_100>,
  "passed": <true_if_score_80_or_higher>,
  "analysis": {
    "completeness": <0_to_100>,
    "accuracy": <0_to_100>, 
    "preservation": <0_to_100>,
    "schema": <0_to_100>
  },
  "issues": [
    "<specific_issue_1>",
    "<specific_issue_2>"
  ],
  "explanation": "<detailed_reasoning_for_scores>"
}

Be thorough but concise. Focus on specific, actionable feedback.`;
}

/**
 * Basic validation fallback when AI judge is unavailable
 */
function basicValidation(
  originalData: StructuredHealthData,
  updateTranscript: string,
  resultData: StructuredHealthData
): JudgeResult {
  const issues: string[] = [];
  
  // Basic checks
  if (!resultData) {
    issues.push("Result data is null or undefined");
    return {
      score: 0,
      passed: false,
      analysis: { completeness: 0, accuracy: 0, preservation: 0, schema: 0 },
      issues,
      explanation: "Merge operation failed - no result data returned"
    };
  }

  // Check if data changed at all
  const dataChanged = JSON.stringify(originalData) !== JSON.stringify(resultData);
  if (!dataChanged && updateTranscript.trim().length > 0) {
    issues.push("No changes detected despite update transcript");
  }

  // Basic schema validation
  const hasRequiredFields = resultData.hasOwnProperty('workouts') && 
                           resultData.hasOwnProperty('meals') &&
                           resultData.hasOwnProperty('sleep');
  
  if (!hasRequiredFields) {
    issues.push("Missing required fields in result");
  }

  const basicScore = dataChanged && hasRequiredFields ? 60 : 20;
  
  return {
    score: basicScore,
    passed: basicScore >= 80,
    analysis: {
      completeness: dataChanged ? 60 : 20,
      accuracy: 60,
      preservation: hasRequiredFields ? 80 : 40,
      schema: hasRequiredFields ? 90 : 30
    },
    issues,
    explanation: "Basic validation used (AI judge unavailable). Limited accuracy assessment."
  };
}