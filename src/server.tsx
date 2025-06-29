// import { Layout } from "./shared/Layout";
import { serveStatic } from "hono/cloudflare-workers";
// @ts-expect-error - cloudflare
import manifest from "__STATIC_CONTENT_MANIFEST";
import { app } from "./app";
import { NotionApiClient } from "./api/notion";
import type { MiddlewareHandler } from "hono";
import { AppContext, HonoApp } from "./types";
import { sign, verify } from "hono/jwt";
import { getCookie, setCookie } from "hono/cookie";
import { storeAudioRecording, getAudioRecording } from "./lib/storage";
import { transcribeAudio, extractHealthData } from "./lib/ai";
// We'll use these in Phase 2 with database integration
import { getAllHealthLogs, getHealthLogById, initDb, deleteHealthLog } from "./lib/db";
// Import the saveHealthLog function
import { saveHealthLog } from "./lib/db";
// Import types from schema
import { HealthLog } from "./db/schema";

// Middleware to verify API key
const authenticateApiKey: MiddlewareHandler<HonoApp> = async (c, next) => {
  const apiKey = c.req.header("X-API-Key");
  if (!apiKey || apiKey !== c.env.DAILY_LOG_API_KEY) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
};

// Middleware to verify basic password
const authenticateJwt: MiddlewareHandler<HonoApp> = async (c, next) => {
  const token = getCookie(c, "jwt");

  if (!token) {
    return c.json({ error: "Unauthorized", message: "No token provided" }, 401);
  }

  try {
    const decodedPayload = await verify(token, c.env.JWT_SECRET);
    if (!decodedPayload || decodedPayload.user !== 'admin') {
      return c.json({ error: "Unauthorized", message: "Invalid token payload" }, 401);
    }
  } catch (e) {
    return c.json({ error: "Unauthorized", message: "Invalid token" }, 401);
  }

  await next();
};

// Middleware to initialize the database
const withDb: MiddlewareHandler<HonoApp> = async (c, next) => {
  c.set("db", initDb(c as AppContext));
  await next();
};

// Serve static files
app.use("/static/*", serveStatic({ root: "./", manifest }));

// API routes require authentication
app.use("/api/*", authenticateJwt);
app.use("/api/*", withDb);

app.post("/auth/login", async (c) => {
  const { password } = await c.req.json();
  console.log("Password:", password);
  console.log("Environment password:", c.env.PASSWORD);
  if (password === c.env.PASSWORD) {
    const token = await sign({ user: "admin", exp: Math.floor(Date.now() / 1000) + (60 * 60) }, c.env.JWT_SECRET);
    setCookie(c, "jwt", token, { httpOnly: true, secure: true, sameSite: "Strict", maxAge: 60 * 60 });
    return c.json({ message: "Logged in successfully" });
  } else {
    return c.json({ error: "Invalid credentials" }, 401);
  }
});

// Check authentication status
app.get("/auth/status", async (c) => {
  const token = getCookie(c, "jwt");

  if (!token) {
    return c.json({ isAuthenticated: false });
  }

  try {
    const decodedPayload = await verify(token, c.env.JWT_SECRET);
    if (!decodedPayload || decodedPayload.user !== 'admin') {
      return c.json({ isAuthenticated: false });
    }
    return c.json({ isAuthenticated: true });
  } catch (e) {
    return c.json({ isAuthenticated: false });
  }
});

// Logout endpoint - clears the JWT cookie
app.post("/auth/logout", async (c) => {
  // Clear the JWT cookie by setting it to expire immediately
  setCookie(c, "jwt", "", { 
    httpOnly: true, 
    secure: true, 
    sameSite: "Strict", 
    maxAge: 0 // This expires the cookie immediately
  });
  return c.json({ message: "Logged out successfully" });
});

// Legacy routes for backwards compatibility
app.use("/logs", authenticateApiKey);

// Process transcript directly (without audio)
app.post("/api/process-transcript", async (c) => {
  try {
    console.log("Process transcript request received");
    const body = await c.req.json();
    const transcript = body.transcript;

    if (!transcript) {
      console.error("No transcript provided in request");
      return c.json({ error: "No transcript provided" }, 400);
    }

    console.log("Transcript received:", transcript.substring(0, 100) + "...");

    try {
      // Extract structured data using Gemini
      const healthData = await extractHealthData(c, transcript);
      console.log("Health data extracted successfully");

      // Save to database
      const logId = await saveHealthLog(
        c as AppContext,
        "",
        transcript,
        healthData,
      );
      console.log("Health log saved to database with ID:", logId);

      console.log("Successfully processed transcript", {
        id: logId,
      });

      // Return the structured data with the log ID
      return c.json({
        success: true,
        message: "Transcript processed successfully",
        id: logId,
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
    console.error("Unexpected error processing transcript:", error);
    return c.json(
      {
        error: "Failed to process transcript",
        message: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});

app.post("/api/health-log", async (c) => {
  try {
    console.log("Health log upload request received");
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
      const healthData = await extractHealthData(c, transcript);
      console.log("Health data extracted successfully");

      const logId = await saveHealthLog(
        c as AppContext,
        audioUrl,
        transcript,
        healthData,
      );
      console.log("Health log saved to database with ID:", logId);

      console.log("Successfully processed health log", {
        success: true,
        message: "Health log processed successfully",
        id: logId,
        transcript,
        data: healthData,
      });

      // Return the structured data with the log ID
      return c.json({
        success: true,
        message: "Health log processed successfully",
        id: logId,
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

app.get("/api/health-log", async (c) => {
  try {
    console.log("Fetching all health logs from database");

    try {
      // Get logs from database
      const logs = await getAllHealthLogs(c as AppContext);
      console.log(`Retrieved ${logs.length} health logs from database`);

      // If no logs found, return friendly message
      if (logs.length === 0) {
        console.log("No health logs found in database");
        return c.json({
          logs: [],
          message:
            "No health logs found. Create your first health log by recording or entering a transcript.",
        });
      }

      // Transform logs to include structured data directly
      const formattedLogs = logs.map((log: HealthLog & { structuredData?: any; healthData?: any; workouts?: any; meals?: any; painDiscomfort?: any }) => {
        // If we have structured data, use it directly
        if (log.structuredData) {
          return {
            id: log.id,
            date: log.date,
            audioUrl: log.audioUrl,
            transcript: log.transcript,
            healthData: log.structuredData,
          };
        }

        // Fall back to the old format if needed
        return log;
      });

      return c.json(formattedLogs);
    } catch (error: unknown) {
      console.error("Database error when fetching health logs:", error);

      // Check if it's a "no such table" error
      const dbError = error as Error;
      if (dbError.message && dbError.message.includes("no such table")) {
        console.log(
          "Health logs table doesn't exist yet, returning empty result",
        );
        return c.json({
          logs: [],
          message:
            "The health tracker is being set up for the first time. Create your first health log by recording or entering a transcript.",
        });
      }

      // For other database errors, rethrow to be caught by the outer try/catch
      throw error;
    }
  } catch (error) {
    console.error("Error fetching health logs:", error);
    return c.json(
      {
        error: "Failed to fetch health logs",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// Get a specific health log by ID
app.get("/api/health-log/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"), 10);
    console.log(`Fetching health log with ID ${id} from database`);

    // Get log from database
    const log = await getHealthLogById(c as AppContext, id);

    if (!log) {
      console.log(`Health log with ID ${id} not found in database`);
      return c.json({ error: "Health log not found" }, 404);
    }

    console.log(`Retrieved health log with ID ${id} from database`);

    // If we have structured data, use it directly in the response
    if (log.structuredData) {
      return c.json({
        id: log.id,
        date: log.date,
        audioUrl: log.audioUrl,
        transcript: log.transcript,
        healthData: log.structuredData,
      });
    }

    // Otherwise return the log as is
    return c.json(log);
  } catch (error) {
    console.error("Error fetching health log:", error);
    return c.json({ error: "Failed to fetch health log" }, 500);
  }
});

// Delete a specific health log by ID
app.delete("/api/health-log/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"), 10);
    
    if (isNaN(id)) {
      return c.json({ error: "Invalid health log ID" }, 400);
    }

    console.log(`Attempting to delete health log with ID ${id}`);

    // Delete the health log
    const success = await deleteHealthLog(c as AppContext, id);

    if (!success) {
      console.log(`Health log with ID ${id} not found or could not be deleted`);
      return c.json({ error: "Health log not found" }, 404);
    }

    console.log(`Successfully deleted health log with ID ${id}`);
    return c.json({ 
      success: true, 
      message: `Health log ${id} deleted successfully` 
    });
  } catch (error) {
    console.error("Error deleting health log:", error);
    return c.json(
      {
        error: "Failed to delete health log",
        message: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});

// Get an audio recording by filename
app.get("/recordings/:filename", authenticateJwt, async (c) => {
  try {
    const filename = c.req.param("filename");
    console.log("Requesting recording:", filename);

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
  return c.html(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Health Tracking App</title>
    <link rel="stylesheet" href="/static/styles.css" />
  </head>
  <body class="bg-gray-100 min-h-screen">
    <!-- React App Root -->
    <div id="app"></div>
    
    <!-- React Application Bundle -->
    <script src="/static/index.js"></script>
  </body>
</html>`);
});


export default app;
