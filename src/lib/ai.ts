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

// Define response type for Gemini File API upload
interface GeminiFileUploadResponse {
  file: {
    name: string; // e.g., "files/rf0cy6f9171t"
    uri: string; // e.g., "https://generativelanguage.googleapis.com/v1beta/files/rf0cy6f9171t"
    mimeType: string;
    createTime: string; // ISO 8601 format
    updateTime: string; // ISO 8601 format
    expirationTime: string; // ISO 8601 format
    sha256Hash: string; // Base64 encoded hash
    sizeBytes: string; // String representation of number
    displayName: string;
  };
}

// Define response type for Gemini generateContent API
interface GeminiGenerateContentResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
      role: string;
    };
    finishReason: string;
    index: number;
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  promptFeedback?: {
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  };
}

/**
 * Transcribes audio using the Gemini API via direct REST calls.
 * @param ctx Hono context with AI binding and GEMINI_API_KEY
 * @param audioData Audio data as ArrayBuffer
 * @param mimeType The MIME type of the audio data (e.g., 'audio/mp3', 'audio/wav')
 * @returns Transcription text
 */
export async function transcribeAudio(
  ctx: AppContext,
  audioData: ArrayBuffer,
  mimeType: string = "audio/mpeg", // Default to MP3, make sure this matches your input
): Promise<string> {
  const apiKey = ctx.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY environment variable is not set.");
    throw new Error("Transcription service is not configured.");
  }

  try {
    console.log(
      `Starting Gemini audio transcription. Audio size: ${audioData.byteLength} bytes, MIME type: ${mimeType}`,
    );

    // === 1. Upload the audio file using Gemini Files API ===
    const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`;
    const displayName = `audio-upload-${Date.now()}`;

    // Step 1.1: Initial request to get the upload URL
    console.log("Requesting Gemini file upload URL...");
    const initialUploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": audioData.byteLength.toString(),
        "X-Goog-Upload-Header-Content-Type": mimeType,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        file: { display_name: displayName },
      }),
    });

    if (!initialUploadResponse.ok) {
      const errorText = await initialUploadResponse.text();
      console.error(
        "Gemini file upload initial request failed:",
        initialUploadResponse.status,
        errorText,
      );
      throw new Error(
        `Gemini file upload initiation failed: ${initialUploadResponse.status} ${errorText}`,
      );
    }

    const googUploadUrl =
      initialUploadResponse.headers.get("x-goog-upload-url");
    if (!googUploadUrl) {
      console.error("Missing x-goog-upload-url header in Gemini response.");
      throw new Error("Failed to get Gemini file upload URL.");
    }
    console.log("Obtained Gemini file upload URL.");

    // Step 1.2: Upload the actual audio bytes
    console.log("Uploading audio bytes to Gemini...");
    const uploadResponse = await fetch(googUploadUrl, {
      method: "POST",
      headers: {
        "Content-Length": audioData.byteLength.toString(),
        "X-Goog-Upload-Offset": "0",
        "X-Goog-Upload-Command": "upload, finalize",
      },
      body: audioData, // Send ArrayBuffer directly
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error(
        "Gemini file upload failed:",
        uploadResponse.status,
        errorText,
      );
      throw new Error(
        `Gemini file upload failed: ${uploadResponse.status} ${errorText}`,
      );
    }

    const uploadResult =
      (await uploadResponse.json()) as GeminiFileUploadResponse;
    const fileUri = uploadResult.file.uri;
    const fileName = uploadResult.file.name; // e.g., "files/..."
    console.log(
      `Audio file uploaded successfully. URI: ${fileUri}, Name: ${fileName}`,
    );

    // === 2. Generate content (transcribe) using the uploaded file ===
    const modelId = "gemini-2.0-flash"; // Or choose another suitable model
    const generateContentUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

    // Detailed transcription prompt, similar to the previous Whisper one
    const transcriptionPrompt =
      "This is a health log recording in English about daily activities, meals, exercise, and wellbeing. Pay special attention to workout and food terms that might be mispronounced or unclear. Common exercise terms include: running, jogging, walking, yoga, pilates, HIIT, weightlifting, swimming, biking, cycling, cardio, strength training, etc. Common food items include: burrito, quiche, curry, sushi, quinoa, granola, chia seeds, kombucha, açaí, kimchi, falafel, couscous, tahini, edamame, etc. Focus on transcribing these terms correctly even if pronounced unclearly. Common measurement terms include: hours, minutes, kilometers, liters, kilograms, grams, etc. If you hear something that sounds like a mispronounced version of common exercise terms (e.g., 'em-run', 'm-ron'), correct it to the most likely exercise type (e.g., 'run').";
    // TODO: Consider adding more specific prompting if needed, similar to the previous Whisper prompt.

    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            { text: transcriptionPrompt },
            { fileData: { mimeType: mimeType, fileUri: fileUri } },
          ],
        },
      ],
      // Optional: Add generationConfig if needed (e.g., temperature)
      generationConfig: {
        temperature: 0.1, // Lower temperature for more factual transcription
      },
    };

    console.log("Sending transcription request to Gemini API...");
    const generateResponse = await fetch(generateContentUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      console.error(
        "Gemini generateContent (transcription) failed:",
        generateResponse.status,
        errorText,
      );
      // Attempt to delete the uploaded file if transcription fails
      try {
        await deleteGeminiFile(apiKey, fileName);
      } catch (deleteError) {
        console.warn(
          "Failed to delete uploaded Gemini file after error:",
          deleteError,
        );
      }
      throw new Error(
        `Gemini transcription request failed: ${generateResponse.status} ${errorText}`,
      );
    }

    const generateResult =
      (await generateResponse.json()) as GeminiGenerateContentResponse;

    // Extract the transcription text
    const transcript =
      generateResult.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!transcript) {
      console.warn("Gemini transcription result was empty or invalid.");
      // Attempt to delete the uploaded file
      try {
        await deleteGeminiFile(apiKey, fileName);
      } catch (deleteError) {
        console.warn(
          "Failed to delete uploaded Gemini file after empty result:",
          deleteError,
        );
      }
      return "Audio transcription failed or returned empty.";
    }

    console.log("Gemini transcription successful, length:", transcript.length);
    console.log("First 100 chars of transcript:", transcript.substring(0, 100));

    // Clean up the uploaded file (optional, files expire automatically after 2 days)
    try {
      console.log(`Attempting to delete uploaded file: ${fileName}`);
      await deleteGeminiFile(apiKey, fileName);
      console.log(`Successfully deleted uploaded file: ${fileName}`);
    } catch (deleteError) {
      console.warn("Failed to delete uploaded Gemini file:", deleteError);
      // Don't throw an error here, as transcription was successful
    }

    return transcript;
  } catch (error) {
    console.error("Error in transcribeAudio with Gemini:", error);
    throw new Error(
      `Transcription failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Deletes a file uploaded via the Gemini Files API.
 * @param apiKey Your Gemini API Key
 * @param fileName The name of the file (e.g., "files/...")
 */
async function deleteGeminiFile(
  apiKey: string,
  fileName: string,
): Promise<void> {
  const deleteUrl = `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${apiKey}`;
  const response = await fetch(deleteUrl, { method: "DELETE" });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `Failed to delete Gemini file ${fileName}: ${response.status} ${errorText}`,
    );
    // Throwing an error might be too strict if deletion is just cleanup
    // Consider just logging the warning based on context
    // throw new Error(`Failed to delete Gemini file ${fileName}: ${response.status} ${errorText}`);
  } else {
    console.log(`Successfully initiated deletion for file ${fileName}`);
  }
  // Note: The API might return 200 OK even if deletion happens asynchronously or fails silently later.
}

/**
 * The prompt template for extracting structured data from transcript
 */
const HEALTH_DATA_PROMPT = `Convert the following health log transcript into a structured JSON format:

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
  5. **Commute Handling**:
     - Identify mentions of "commute" or "commuting" as a workout.
     - Place commute activities in the workouts array, NOT in otherActivities.
     - If specific details (duration, distance, intensity) are mentioned for the commute, use them.
     - If details are missing, use these defaults: 'type': "bike", 'durationMinutes': 25, 'distanceKm': 6, 'intensity': 5, 'notes': "commute".
  6. CRITICAL: Correct common transcription errors, especially for food items, exercise types, and health terms:
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

    7. Clean up voice recognition errors and grammar issues to produce concise, accurate data:
      - Remove filler words (like "um", "uh", "I had", "I ate") where appropriate
      - Fix obvious measurement abbreviations (e.g., "gms" → "g", "kilometers" → "km")
      - Fix grammatical errors while preserving meaning
      - Remove unnecessary articles and prepositions that don't add clarity
      - For example: "I had homemade massman curry with tofu with a brown rice" → "homemade massaman curry with tofu and brown rice"
      - For example: "I 30 gms of chocolate" → "30g chocolate"

    8. CRITICAL: Remove all subjective descriptors and qualitative adjectives. Keep only factual, measurable information:
      - "2 delicious cups of coffee" → "2 cups of coffee"
      - "fantastic breakfast with eggs" → "breakfast with eggs"
      - "amazing dinner" → "dinner"

    9. For meals, include only objective facts and quantities, not subjective assessments:
      - Include: specific foods, preparations, quantities, times
      - Exclude: taste descriptions, personal preferences, emotions about the food

    10. CRITICAL FOR MEALS: Create ONLY ONE entry per meal type (Breakfast, Lunch, Dinner, Snacks, Coffee):
      - If multiple items are mentioned for a single meal type, combine them into one entry
      - Example: "For dinner I had sushi and salad" → ONE entry: {"type": "Dinner", "notes": "sushi and salad"}
      - Example: "For dinner I had sushi. I also had salad for dinner" → ONE entry: {"type": "Dinner", "notes": "sushi and salad"}
      - Example: "Dinner was sushi rolls and veggie gyoza" → ONE entry: {"type": "Dinner", "notes": "sushi rolls and veggie gyoza"}
      - Never create multiple entries with the same meal type
      - For repeated items in the same meal, include them only once: "sushi, sushi rolls" → just "sushi rolls"

    11. General notes about the day should go in the main \`notes\` field, not in any other field.

    12. Activities identified as workouts (including commutes) should ONLY appear in the workouts array. Do not list them in otherActivities.

    13. DO NOT add or invent any fields that are not in the schema above.

    14. Use abbreviations for standard measurements (g instead of grams, kg instead of kilograms, km instead of kilometers) for consistency.

    15. When processing "No pain" or similar phrases indicating absence, set the painDiscomfort field to null rather than creating an object with null values.

    16. For workout intensity, map descriptive terms to numerical values:
        - "low" or "light" → 3
        - "medium" → 5
        - "moderate" → 6
        - "high" → 8
        - "intense" → 9
        - "very high" or "very intense" → 10

    17. CRITICAL: Respond ONLY with the valid JSON object representing the extracted data. Do not include any introductory text, explanations, or conversational elements before or after the JSON object.

    Example 1:
    If the transcript says "I commuted 5 kilometers to the office each way", record that as:
    "type": "commute", "distanceKm": 10, "notes": "commuted to and from the office"

    Example 2:
    For this transcript: "Exercise was a 5K M-RON, as well as a 45-minute yoga class of medium intensity. For breakfast, I had overnight oats with berries. For lunch, I had keish with salad. For dinner, I had black bean burito with a side of roast potato. Sleep was eight hours. No pain or discomfort."

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
        responseMimeType: "application/json", // Explicitly request JSON output
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
      // Remove potential markdown fences before parsing
      const cleanedJsonString = jsonString.replace(/^```json\n?|\n?```$/g, "");
      return JSON.parse(cleanedJsonString) as StructuredHealthData;
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
