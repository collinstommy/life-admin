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
          "This is a health log recording in English about daily activities, meals, exercise, and wellbeing. Pay special attention to workout and food terms that might be mispronounced or unclear. Common exercise terms include: running, jogging, walking, yoga, pilates, HIIT, weightlifting, swimming, biking, cycling, cardio, strength training, etc. Common food items include: burrito, quiche, curry, sushi, quinoa, granola, chia seeds, kombucha, açaí, kimchi, falafel, couscous, tahini, edamame, etc. Focus on transcribing these terms correctly even if pronounced unclearly. Common measurement terms include: hours, minutes, kilometers, liters, kilograms, grams, etc. If you hear something that sounds like a mispronounced version of common exercise terms (e.g., 'em-run', 'm-ron'), correct it to the most likely exercise type (e.g., 'run').",
        response_format: "text",
        temperature: 0.1, // Lower temperature for more factual, less creative outputs
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
5. CRITICAL: Correct common transcription errors, especially for food items, exercise types, and health terms:
   - Food items: Correct phonetic approximations to the likely food name
   - Exercise types: Normalize workout names to common exercise categories
   - Measurements: Fix units and values that may have been transcribed incorrectly
   - Numbers: Convert spoken numbers to digits (e.g., "eight" → 8)
   - Exercise term examples:
     - "m-ron", "em run", "iron-man", "marathon" → use appropriate type based on context:
       - If it's a 5K or similar short distance, use "run"
       - If it's a triathlon-type event, use "triathlon"
       - If it's a marathon, use "marathon"
     - "weight lifting", "waited exercise" → "weightlifting"
     - "high intensity", "high intense", "hit", "h.i.i.t." → "HIIT"
     - "pit-lattes", "pie-latees" → "pilates"
     - "yohga", "yogga" → "yoga"
   - Food item examples:
     - "breito", "berrito", "burito" → "burrito"
     - "keish", "keysh", "quich" → "quiche"
     - "quinua", "keen-wah" → "quinoa"
     - "masa man", "massman" → "massaman"
     - "sush", "soosh" → "sushi"
     - "kimch", "kimchi", "kim chi" → "kimchi"
     - "yohg", "yoghurt" → "yogurt"
     - "grow-nola", "grow nuts", "gran-ola" → "granola"
     - "flex", "flax" → "flaxseed"
     - "came-cha", "come-bu-ka" → "kombucha"
     - "ah-sigh", "acai" → "açaí"

6. Clean up voice recognition errors and grammar issues to produce concise, accurate data:
   - Remove filler words (like "um", "uh", "I had", "I ate") where appropriate
   - Fix obvious measurement abbreviations (e.g., "gms" → "g", "kilometers" → "km")
   - Fix grammatical errors while preserving meaning
   - Remove unnecessary articles and prepositions that don't add clarity
   - For example: "I had homemade massman curry with tofu with a brown rice" → "homemade massaman curry with tofu and brown rice"
   - For example: "I 30 gms of chocolate" → "30g chocolate"

7. CRITICAL: Remove all subjective descriptors and qualitative adjectives. Keep only factual, measurable information:
   - "2 delicious cups of coffee" → "2 cups of coffee"
   - "fantastic breakfast with eggs" → "breakfast with eggs"
   - "amazing dinner" → "dinner"

8. For meals, include only objective facts and quantities, not subjective assessments:
   - Include: specific foods, preparations, quantities, times
   - Exclude: taste descriptions, personal preferences, emotions about the food

9. CRITICAL FOR MEALS: Create ONLY ONE entry per meal type (Breakfast, Lunch, Dinner, Snacks, Coffee):
   - If multiple items are mentioned for a single meal type, combine them into one entry
   - Example: "For dinner I had sushi and salad" → ONE entry: {"type": "Dinner", "notes": "sushi and salad"}
   - Example: "For dinner I had sushi. I also had salad for dinner" → ONE entry: {"type": "Dinner", "notes": "sushi and salad"}
   - Example: "Dinner was sushi rolls and veggie gyoza" → ONE entry: {"type": "Dinner", "notes": "sushi rolls and veggie gyoza"}
   - Never create multiple entries with the same meal type
   - For repeated items in the same meal, include them only once: "sushi, sushi rolls" → just "sushi rolls"

10. General notes about the day should go in the "notes" field, not in any other field.

11. DO NOT add or invent any fields that are not in the schema above.

12. Use abbreviations for standard measurements (g instead of grams, kg instead of kilograms, km instead of kilometers) for consistency.

13. When processing "No pain" or similar phrases indicating absence, set the painDiscomfort field to null rather than creating an object with null values.

14. For workout intensity, map descriptive terms to numerical values:
    - "low" or "light" → 3
    - "medium" → 5
    - "moderate" → 6
    - "high" → 8
    - "intense" → 9
    - "very high" or "very intense" → 10

Example 1:
If the transcript says "I commuted 5 kilometers to the office each way", record that as:
"type": "commute", "distanceKm": 10, "notes": "commuted to and from the office"

Example 2:
For this transcript: "Exercise was a 5K M-RON, as well as a 45-minute yoga class of medium intensity. For breakfast, I had overnight oats with berries. For lunch, I had keish with salad. For dinner, I had black bean breito with a side of roast potato. Sleep was eight hours. No pain or discomfort."

Convert to this format:
{
  "date": "2023-06-15", // Current date if not specified
  "screenTimeHours": null, // Not mentioned
  "workouts": [
    {
      "type": "run",
      "durationMinutes": null,
      "distanceKm": 5,
      "intensity": null,
      "notes": "5K run"
    },
    {
      "type": "yoga",
      "durationMinutes": 45,
      "intensity": 5,
      "notes": "medium intensity"
    }
  ],
  "meals": [
    {
      "type": "Breakfast",
      "notes": "overnight oats with berries"
    },
    {
      "type": "Lunch",
      "notes": "quiche with salad"
    },
    {
      "type": "Dinner",
      "notes": "black bean burrito with roast potato"
    }
  ],
  "waterIntakeLiters": null, // Not mentioned
  "painDiscomfort": null, // "No pain or discomfort" mentioned
  "sleep": {
    "hours": 8,
    "quality": null
  },
  "energyLevel": null,
  "mood": {
    "rating": null,
    "notes": null
  },
  "weightKg": null,
  "otherActivities": null,
  "notes": null
}

Example 3:
For this transcript: "For breakfast, I had overnight oats. For lunch, I had a spiced burrito with wedges and salad. For dinner, I had sushi, sushi rolls and veggie gimbap. I also had a salad with dinner. Dinner was from a takeaway."

Convert to this format:
{
  "date": "2023-06-15", // Current date if not specified
  "screenTimeHours": null, // Not mentioned
  "meals": [
    {
      "type": "Breakfast",
      "notes": "overnight oats"
    },
    {
      "type": "Lunch",
      "notes": "spiced burrito with wedges and salad"
    },
    {
      "type": "Dinner",
      "notes": "sushi rolls, veggie gimbap and salad from takeaway"
    }
  ],
  "waterIntakeLiters": null, // Not mentioned
  "painDiscomfort": null,
  "sleep": {
    "hours": null,
    "quality": null
  },
  "energyLevel": null,
  "mood": {
    "rating": null,
    "notes": null
  },
  "weightKg": null,
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
        temperature: 0.1, // Lower temperature for more deterministic corrections
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
