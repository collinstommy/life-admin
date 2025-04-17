// import { Layout } from "./shared/Layout";
import { serveStatic } from "hono/cloudflare-workers";
// @ts-expect-error - cloudflare
import manifest from "__STATIC_CONTENT_MANIFEST";
import { app } from "./app";
import { NotionApiClient } from "./api/notion";
import type { MiddlewareHandler } from "hono";
import { HonoApp } from "./types";
import { storeAudioRecording, getAudioRecording } from "./lib/storage";
import { transcribeAudio, extractHealthData } from "./lib/ai";
// We'll use these in Phase 2 with database integration
// import { getAllHealthLogs, getHealthLogById } from "./lib/db";
// Temporarily unused while testing without database
// import { saveHealthLog } from "./lib/db";

// Middleware to verify API key
const authenticateApiKey: MiddlewareHandler<HonoApp> = async (c, next) => {
  // TODO: Uncomment this when API key verification is needed
  // const apiKey = c.req.header("X-API-Key");
  // if (!apiKey || apiKey !== c.env.DAILY_LOG_API_KEY) {
  //   return c.json({ error: "Unauthorized" }, 401);
  // }
  await next();
};

// Middleware to initialize the database
// const withDb: MiddlewareHandler<HonoApp> = async (c, next) => {
//   c.set("db", initDb(c));
//   await next();
// };

// Serve static files
app.use("/static/*", serveStatic({ root: "./", manifest }));

// API routes require authentication
app.use("/api/*", authenticateApiKey);

// Legacy routes for backwards compatibility
app.use("/logs", authenticateApiKey);

// Health log API routes for Phase 2
app.post("/api/health-log", async (c) => {
  try {
    console.log("Health log upload request received");
    // Get audio data from request
    const formData = await c.req.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      console.error("No audio file provided in request");
      return c.json({ error: "No audio file provided" }, 400);
    }

    console.log("Audio file received:", {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size,
    });

    let transcript = "";
    let audioUrl = "";

    try {
      // Store audio in R2
      const audioBuffer = await audioFile.arrayBuffer();
      audioUrl = await storeAudioRecording(c, audioBuffer, "webm");
      console.log("Audio stored in R2:", audioUrl);

      // Transcribe audio using real Whisper API
      transcript = await transcribeAudio(c, audioBuffer);
      console.log("Transcript:", transcript);
    } catch (transcriptError) {
      console.error(
        "Error in audio processing or transcription:",
        transcriptError,
      );
      return c.json(
        {
          error: "Failed to process audio",
          message:
            transcriptError instanceof Error
              ? transcriptError.message
              : String(transcriptError),
        },
        500,
      );
    }

    try {
      // Extract structured data using Gemini
      const healthData = await extractHealthData(c, transcript);
      console.log("Health data extracted successfully");

      // Skip database saving for now
      // const logId = await saveHealthLog(c, audioUrl, transcript, healthData);

      // For testing, use a mock ID
      const mockId = Math.floor(Math.random() * 1000);

      console.log("Successfully processed health log", {
        id: mockId,
        audioUrl,
      });

      // Return the structured data with a mock ID
      return c.json({
        success: true,
        message: "Health log processed successfully",
        id: mockId,
        transcript,
        data: healthData,
      });
    } catch (dataError) {
      console.error("Error extracting structured data:", dataError);
      return c.json(
        {
          error: "Failed to extract structured data",
          message:
            dataError instanceof Error ? dataError.message : String(dataError),
        },
        500,
      );
    }
  } catch (error) {
    console.error("Unexpected error processing health log:", error);
    return c.json(
      {
        error: "Failed to process health log",
        message: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});

// Get all health logs
app.get("/api/health-log", async (c) => {
  try {
    // Skip database query for now
    // const logs = await getAllHealthLogs(c);

    // Return mock data for testing
    return c.json([
      {
        id: 1,
        date: new Date().toISOString().split("T")[0],
        audioUrl: "/recordings/sample-recording.webm",
        transcript:
          "Today I had a good day. I did a 45-minute yoga session and drank about 2 liters of water.",
        healthData: {
          screenTimeHours: 3.5,
          waterIntakeLiters: 2,
          sleepHours: 7.5,
          sleepQuality: 8,
          energyLevel: 8,
        },
        workouts: [
          {
            type: "Yoga",
            durationMinutes: 45,
            intensity: 7,
            notes: "Focused on stretching",
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
        ],
      },
    ]);
  } catch (error) {
    console.error("Error fetching health logs:", error);
    return c.json({ error: "Failed to fetch health logs" }, 500);
  }
});

// Get a specific health log by ID
app.get("/api/health-log/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"), 10);
    if (isNaN(id)) {
      return c.json({ error: "Invalid ID" }, 400);
    }

    // Skip database query for now
    // const log = await getHealthLogById(c, id);

    // Return mock data for testing
    const mockLog = {
      id,
      date: new Date().toISOString().split("T")[0],
      audioUrl: `/recordings/sample-recording-${id}.webm`,
      transcript:
        "Today I had a good day. I did a 45-minute yoga session and drank about 2 liters of water. I had overnight oats with berries for breakfast, a quinoa salad with chickpeas for lunch, and stir-fried veggies with tofu for dinner. I slept about 7.5 hours with quality 8 out of 10. My mood was good, about 8 out of 10. I drank 2.5 liters of water and my screen time was about 3.5 hours.",
      healthData: {
        screenTimeHours: 3.5,
        waterIntakeLiters: 2,
        sleepHours: 7.5,
        sleepQuality: 8,
        energyLevel: 8,
      },
      workouts: [
        {
          type: "Yoga",
          durationMinutes: 45,
          intensity: 7,
          notes: "Focused on stretching",
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
      ],
    };

    return c.json(mockLog);
  } catch (error) {
    console.error("Error fetching health log:", error);
    return c.json({ error: "Failed to fetch health log" }, 500);
  }
});

// Get an audio recording by filename
app.get("/recordings/:filename", async (c) => {
  try {
    const filename = c.req.param("filename");
    console.log("Requesting recording:", filename);

    // Mock response for sample files (useful for testing)
    if (filename.startsWith("sample-")) {
      console.log("Serving mock recording for sample file");
      return new Response("Mock audio file", {
        headers: {
          "Content-Type": "audio/webm",
        },
      });
    }

    const response = await getAudioRecording(c, filename);

    if (!response) {
      console.log("Recording not found:", filename);
      return c.json({ error: "Recording not found" }, 404);
    }

    return response;
  } catch (error) {
    console.error("Error retrieving recording:", error);
    return c.json(
      {
        error: "Failed to retrieve recording",
        message: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});

// Legacy API endpoint
app.get("/logs", async (c) => {
  const notionClient = new NotionApiClient(
    c.env.NOTION_TOKEN,
    c.env.NOTION_DATABASE_ID,
    c.env.DAILY_LOG_CACHE,
  );

  try {
    const logs = await notionClient.getAllLogs();
    return c.json(logs);
  } catch (error) {
    console.error("Error fetching logs:", error);
    return c.json({ error: "Failed to fetch logs" }, 500);
  }
});

// Serve the Health Tracking Voice Recorder app as the main page
app.get("/", async (c) => {
  return c.html(
    await fetch(`${c.req.url}static/index.html`).then((res) => res.text()),
  );
});

// For direct access to the health tracker
app.get("/health-tracker", async (c) => {
  return c.html(
    await fetch(
      `${c.req.url.replace("/health-tracker", "")}/static/index.html`,
    ).then((res) => res.text()),
  );
});

export default app;
