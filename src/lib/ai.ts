import { AppContext } from "../types";

interface StructuredHealthData {
  date: string;
  screenTimeHours: number | null;
  workouts: Array<{
    type: string;
    durationMinutes: number;
    distanceKm?: number;
    intensity: number;
    notes?: string;
  }>;
  meals: Array<{
    type: string;
    notes: string;
  }>;
  waterIntakeLiters: number | null;
  painDiscomfort?: {
    location: string | null;
    intensity: number | null;
    notes: string | null;
  };
  sleep: {
    hours: number | null;
    quality: number | null;
  };
  energyLevel: number | null;
  mood: {
    rating: number | null;
    notes: string | null;
  };
  weightKg: number | null;
  otherActivities: string | null;
  notes: string | null;
}

/**
 * Transcribes audio using Cloudflare Whisper
 * @param ctx Hono context with AI binding
 * @param audioData Audio data as ArrayBuffer
 * @returns Transcription text
 */
export async function transcribeAudio(
  ctx: AppContext,
  audioData: ArrayBuffer,
): Promise<string> {
  try {
    console.log(
      "Transcribing audio with Whisper API, size:",
      audioData.byteLength,
    );

    const input = {
      audio: Array.from(new Uint8Array(audioData)),
      // Add specific parameters to improve transcription quality
      parameters: {
        language: "en", // Explicitly set English as the language
        prompt:
          "This is a health log recording. It may include information about meals, workouts, sleep, and general health metrics.",
        response_format: "text",
        temperature: 0.2, // Lower temperature for more factual, less creative outputs
      },
    };

    console.log(
      "Sending transcription request with parameters:",
      JSON.stringify({
        language: input.parameters.language,
        prompt_length: input.parameters.prompt.length,
        temperature: input.parameters.temperature,
      }),
    );

    // @ts-expect-error - Cloudflare AI API
    const response = await ctx.env.AI.run("@cf/openai/whisper", input);

    if (!response || !response.text) {
      console.warn("Transcription failed to produce text");
      return "Audio transcription failed. Please try recording again with clearer audio.";
    }

    console.log("Transcription successful, length:", response.text.length);
    console.log(
      "First 100 chars of transcript:",
      response.text.substring(0, 100),
    );

    return response.text;
  } catch (error) {
    console.error("Error in transcribeAudio:", error);
    throw new Error(
      `Transcription failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * The prompt template for extracting structured data from transcript
 */
const HEALTH_DATA_PROMPT = `
Convert the following health log transcript into a structured JSON format:

[TRANSCRIPT]

Format it exactly according to this schema:
{
  "date": "YYYY-MM-DD",
  "screenTimeHours": number or null,
  "workouts": [
    {
      "type": "string",
      "durationMinutes": number,
      "distanceKm": number,
      "intensity": number (1-10),
      "notes": "string"
    }
  ],
  "meals": [
    {
      "type": "Breakfast|Lunch|Dinner|Snacks|Coffee",
      "notes": "string"
    }
  ],
  "waterIntakeLiters": number or null,
  "painDiscomfort": {
    "location": "string" or null,
    "intensity": number (1-10) or null,
    "notes": "string" or null
  },
  "sleep": {
    "hours": number or null,
    "quality": number (1-10) or null
  },
  "energyLevel": number (1-10) or null,
  "mood": {
    "rating": number (1-10) or null,
    "notes": "string" or null
  },
  "weightKg": number or null,
  "otherActivities": "string" or null,
  "notes": "string" or null
}

Follow these specific instructions:
1. Make sure all fields match the exact format. Use null for missing values.
2. If the date is mentioned in the transcript, use that date. Otherwise, use the current date.
3. IMPORTANT: Only extract information that is explicitly mentioned in the transcript. Do not invent or add details.
4. For commutes described as "each way" or "to and from", double the distance to represent the total distance traveled.
5. Clean up voice recognition errors and grammar issues to produce concise, accurate data:
   - Remove filler words (like "um", "uh", "I had", "I ate") where appropriate
   - Fix obvious measurement abbreviations (e.g., "gms" → "g", "kilometers" → "km")
   - Fix grammatical errors while preserving meaning
   - Remove unnecessary articles and prepositions that don't add clarity
   - For example: "I had homemade massman curry with tofu with a brown rice" → "homemade massman curry with tofu and brown rice"
   - For example: "I 30 gms of chocolate" → "30g chocolate"
6. CRITICAL: Remove all subjective descriptors and qualitative adjectives. Keep only factual, measurable information:
   - "2 delicious cups of coffee" → "2 cups of coffee"
   - "fantastic breakfast with eggs" → "breakfast with eggs"
   - "amazing dinner" → "dinner"
7. For meals, include only objective facts and quantities, not subjective assessments:
   - Include: specific foods, preparations, quantities, times
   - Exclude: taste descriptions, personal preferences, emotions about the food
8. General notes about the day should go in the "notes" field, not in any other field.
9. DO NOT add or invent any fields that are not in the schema above.
10. When the voice recognition clearly misinterpreted words, use your best judgment to correct the meaning based on context.
11. Use abbreviations for standard measurements (g instead of grams, kg instead of kilograms, km instead of kilometers) for consistency.

Example 1:
If the transcript says "I commuted 5 kilometers to the office each way", record that as:
"type": "commute", "distanceKm": 10, "notes": "commuted to and from the office"

Example 2:
For this transcript: "For breakfast I had overnight oats with one tablespoon of granola, for lunch, bean burrito, wish, salad. The salad was a root vegetable salad. Dinner was homemade massman curry with tofu with a brown rice. First snacks, I 30 gms of chocolate, I two cups of coffee. No painter to some for today. Sleep was eight hours, seven out of 10 rating. Energy levels and eight out of 10, mood and eight. My weight today was 82 kg."

Convert to this format:
{
  "date": "2023-06-15", // Current date if not specified
  "screenTimeHours": null, // Not mentioned
  "meals": [
    {
      "type": "Breakfast",
      "notes": "overnight oats with 1 tbsp granola"
    },
    {
      "type": "Lunch",
      "notes": "bean burrito with root vegetable salad"
    },
    {
      "type": "Dinner",
      "notes": "massman curry with tofu and brown rice"
    },
    {
      "type": "Snacks",
      "notes": "30g chocolate"
    },
    {
      "type": "Coffee",
      "notes": "2 cups"
    }
  ],
  "waterIntakeLiters": null, // Not mentioned
  "painDiscomfort": null, // "No painter to some" was likely "No pain or discomfort"
  "sleep": {
    "hours": 8,
    "quality": 7
  },
  "energyLevel": 8,
  "mood": {
    "rating": 8,
    "notes": null
  },
  "weightKg": 82,
  "otherActivities": null,
  "notes": null
}
`;

// Define the expected response type from Gemini API
interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

/**
 * Extracts structured health data from transcript using Gemini API directly
 * @param ctx Hono context with API key in environment variables
 * @param transcript Transcript text from audio
 * @returns Structured health data
 */
export async function extractHealthData(
  ctx: AppContext,
  transcript: string,
): Promise<StructuredHealthData> {
  const apiKey = ctx.env.GEMINI_API_KEY;

  // If API key is missing, return mock data for testing
  if (!apiKey) {
    console.warn(
      "GEMINI_API_KEY environment variable is not set, using mock data",
    );

    // Return a mock response based on the transcript
    return {
      date: new Date().toISOString().split("T")[0],
      screenTimeHours: 3.5,
      workouts: [
        {
          type: "Yoga",
          durationMinutes: 45,
          intensity: 7,
          notes: "Regular session",
        },
        {
          type: "Walking",
          durationMinutes: 30,
          distanceKm: 2,
          intensity: 3,
          notes: "Casual walk",
        },
      ],
      meals: [
        {
          type: "Breakfast",
          notes: "Oatmeal with berries",
        },
        {
          type: "Lunch",
          notes: "Quinoa salad",
        },
        {
          type: "Dinner",
          notes: "Grilled vegetables",
        },
      ],
      waterIntakeLiters: 2.5,
      painDiscomfort: {
        location: null,
        intensity: null,
        notes: null,
      },
      sleep: {
        hours: 7.5,
        quality: 8,
      },
      energyLevel: 7,
      mood: {
        rating: 8,
        notes: "Feeling good",
      },
      weightKg: null,
      otherActivities: null,
      notes: null,
    };
  }

  try {
    console.log(
      "Making request to Gemini API with transcript:",
      transcript.substring(0, 100) + "...",
    );

    const modelId = "gemini-2.0-flash";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: HEALTH_DATA_PROMPT.replace("[TRANSCRIPT]", transcript),
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "text/plain",
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
      console.error("Gemini API error response:", errorText);
      throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as GeminiResponse;
    console.log("Gemini API response received");

    // Extract the text from the response
    const text = data.candidates[0]?.content?.parts[0]?.text;
    if (!text) {
      throw new Error("Empty or invalid response from Gemini API");
    }

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Could not extract JSON from response:", text);
      throw new Error("Could not extract JSON from AI response");
    }

    const jsonString = jsonMatch[0];

    try {
      return JSON.parse(jsonString) as StructuredHealthData;
    } catch (parseError) {
      console.error("Error parsing JSON:", jsonString);
      throw new Error(
        `Failed to parse JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
      );
    }
  } catch (error: unknown) {
    console.error("Error processing with Gemini API:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to process health data: ${errorMessage}`);
  }
}

export { StructuredHealthData };
