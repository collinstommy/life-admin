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
import { transcribeAudio, extractHealthData, mergeHealthDataWithUpdate, StructuredHealthData } from "./lib/ai";
// We'll use these in Phase 2 with database integration
import { getAllHealthLogs, getHealthLogById, initDb, deleteHealthLog, deleteAllHealthLogs, updateHealthLog } from "./lib/db";
// Import the saveHealthLog function
import { saveHealthLog } from "./lib/db";
// Import types from schema
import { HealthLog } from "./db/schema";
import { seedDatabase } from "./seed";
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

// JWT token expiration duration (7 days in seconds)
const SEVEN_DAYS = 60 * 60 * 24 * 7;

// Validation schemas
const loginSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

const processTranscriptSchema = z.object({
  transcript: z.string().min(1, 'Transcript is required'),
});

const extractHealthDataSchema = z.object({
  transcript: z.string().min(1, 'Transcript is required'),
});

const updateHealthDataSchema = z.object({
  originalData: z.any(),
  updateTranscript: z.string().min(1, 'Update transcript is required'),
});

const saveHealthLogSchema = z.object({
  healthData: z.any(),
  transcript: z.string().optional(),
  audioUrl: z.string().optional(),
});

const updateHealthLogSchema = z.object({
  healthData: z.any(),
  updateTranscript: z.string().min(1, 'Update transcript is required'),
});

const createHealthLogFromTextSchema = z.object({
  text: z.string().min(1, 'Text is required'),
});

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

const authRoutes = app
  .post("/auth/login", zValidator('json', loginSchema), async (c) => {
    const { password } = c.req.valid('json');
    console.log("Password:", password);
    console.log("Environment password:", c.env.PASSWORD);
    if (password === c.env.PASSWORD) {
      const token = await sign({ user: "admin", exp: Math.floor(Date.now() / 1000) + SEVEN_DAYS }, c.env.JWT_SECRET);
      setCookie(c, "jwt", token, { httpOnly: true, secure: true, sameSite: "Strict", maxAge: SEVEN_DAYS });
      return c.json({ message: "Logged in successfully" });
    } else {
      return c.json({ error: "Invalid credentials" }, 401);
    }
  })
  .get("/auth/status", async (c) => {
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
  })
  .post("/auth/logout", async (c) => {
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

// Define API routes with validation
const apiRoutes = app
  .post("/api/process-transcript", zValidator('json', processTranscriptSchema), async (c) => {
    try {
      console.log("Process transcript request received");
      const { transcript } = c.req.valid('json');

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
  })
  .post("/api/extract-health-data", zValidator('json', extractHealthDataSchema), async (c) => {
    try {
      console.log("Extract health data request received");
      const { transcript } = c.req.valid('json');

      console.log("Transcript received for extraction:", transcript.substring(0, 100) + "...");

      try {
        // Extract structured data using Gemini
        const healthData = await extractHealthData(c, transcript);
        console.log("Health data extracted successfully");

        // Return the structured data without saving
        return c.json({
          success: true,
          message: "Health data extracted successfully",
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
      console.error("Unexpected error extracting health data:", error);
      return c.json(
        {
          error: "Failed to extract health data",
          message: error instanceof Error ? error.message : String(error),
        },
        500,
      );
    }
  })
  .post("/api/update-health-data", zValidator('json', updateHealthDataSchema), async (c) => {
    try {
      console.log("Update health data request received");
      const { originalData, updateTranscript } = c.req.valid('json');

      console.log("Update transcript received:", updateTranscript.substring(0, 100) + "...");

      try {
        // Merge the update with existing data using Gemini
        const updatedHealthData = await mergeHealthDataWithUpdate(c, originalData, updateTranscript);
        console.log("Health data merged successfully");

        // Return the updated structured data without saving
        return c.json({
          success: true,
          message: "Health data updated successfully",
          updateTranscript,
          data: updatedHealthData,
        });
      } catch (dataError) {
        console.error("Error merging health data:", dataError);
        return c.json(
          {
            error: "Failed to merge health data",
            message:
              dataError instanceof Error ? dataError.message : String(dataError),
          },
          500,
        );
      }
    } catch (error) {
      console.error("Unexpected error updating health data:", error);
      return c.json(
        {
          error: "Failed to update health data",
          message: error instanceof Error ? error.message : String(error),
        },
        500,
      );
    }
  })
    .post("/api/transcribe-audio", async (c) => {
    try {
      console.log("Audio transcription request received");
      const formData = await c.req.formData();
      const audioFile = formData.get("audio") as File;

      if (!audioFile) {
        console.error("No audio file provided in request");
        return c.json({ error: "No audio file provided" }, 400);
      }

      console.log("Audio file received for transcription:", {
        name: audioFile.name,
        type: audioFile.type,
        size: audioFile.size,
      });

      try {
        // Transcribe audio using Gemini API
        const audioBuffer = await audioFile.arrayBuffer();
        const transcript = await transcribeAudio(c, audioBuffer);
        console.log("Transcription completed:", transcript);

        return c.json({
          success: true,
          transcript,
        });
      } catch (transcriptError) {
        console.error("Error transcribing audio:", transcriptError);
        return c.json(
          {
            error: "Failed to transcribe audio",
            message:
              transcriptError instanceof Error
                ? transcriptError.message
                : String(transcriptError),
          },
          500,
        );
      }
    } catch (error) {
      console.error("Unexpected error in audio transcription:", error);
      return c.json(
        {
          error: "Failed to process audio transcription",
          message: error instanceof Error ? error.message : String(error),
        },
        500,
      );
    }
  })
  .post("/api/save-health-log", zValidator('json', saveHealthLogSchema), async (c) => {
    try {
      console.log("Save health log request received");
      const { healthData, transcript, audioUrl } = c.req.valid('json');

      console.log("Saving health data to database");

      try {
        // Save to database
        const logId = await saveHealthLog(
          c as AppContext,
          audioUrl || "",
          transcript || "",
          healthData,
        );
        console.log("Health log saved to database with ID:", logId);

        return c.json({
          success: true,
          message: "Health log saved successfully",
          id: logId,
          data: healthData,
        });
      } catch (dataError) {
        console.error("Error saving health log:", dataError);
        return c.json(
          {
            error: "Failed to save health log",
            message:
              dataError instanceof Error ? dataError.message : String(dataError),
          },
          500,
        );
      }
    } catch (error) {
      console.error("Unexpected error saving health log:", error);
      return c.json(
        {
          error: "Failed to save health log",
          message: error instanceof Error ? error.message : String(error),
        },
        500,
      );
    }
  })
  .post("/api/health-log", async (c) => {
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
  })
  .get("/api/health-log", async (c) => {
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

        // The getAllHealthLogs function now returns properly formatted data
        // with healthData containing the structured information
        return c.json(logs);
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
  })
  .get("/api/health-log/:id", async (c) => {
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

      // The getHealthLogById function now returns properly structured data
      // Transform to match expected frontend format
      return c.json({
        id: log.id,
        date: log.date,
        audioUrl: log.audioUrl,
        transcript: log.transcript,
        healthData: log.structuredData,
        createdAt: log.createdAt,
        updatedAt: log.updatedAt,
      });
    } catch (error) {
      console.error("Error fetching health log:", error);
      return c.json({ error: "Failed to fetch health log" }, 500);
    }
  })
  .delete("/api/health-log/:id", async (c) => {
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
  })
  .delete("/api/health-logs", async (c) => {
    try {
      console.log("Attempting to delete all health logs");

      // Delete all health logs
      const deletedCount = await deleteAllHealthLogs(c as AppContext);

      console.log(`Successfully deleted ${deletedCount} health logs`);
      return c.json({ 
        success: true, 
        message: `${deletedCount} health logs deleted successfully`,
        deletedCount 
      });
    } catch (error) {
      console.error("Error deleting all health logs:", error);
      return c.json(
        {
          error: "Failed to delete all health logs",
          message: error instanceof Error ? error.message : String(error),
        },
        500,
      );
    }
  })
  .get("/recordings/:filename", authenticateJwt, async (c) => {
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
  })
  .put("/api/health-log/:id", zValidator('json', updateHealthLogSchema), async (c) => {
    try {
      console.log("Update health log request received");
      const id = parseInt(c.req.param('id'));
      const { healthData, updateTranscript } = c.req.valid('json');

      if (!id || isNaN(id)) {
        console.error("Invalid or missing health log ID");
        return c.json({ error: "Valid health log ID is required" }, 400);
      }

      console.log(`Updating health log with ID: ${id}`);

      try {
        // Get the existing health log to retrieve original transcript
        const existingLog = await getHealthLogById(c as AppContext, id);
        
        if (!existingLog) {
          console.error(`Health log with ID ${id} not found`);
          return c.json({ error: "Health log not found" }, 404);
        }

        const originalTranscript = existingLog.transcript || "";

        // Update the health log with complete replacement
        const updatedId = await updateHealthLog(
          c as AppContext,
          id,
          healthData,
          originalTranscript,
          updateTranscript,
        );
        
        console.log("Health log updated successfully with ID:", updatedId);

        return c.json({
          success: true,
          message: "Health log updated successfully",
          id: updatedId,
          data: healthData,
        });
      } catch (dataError) {
        console.error("Error updating health log:", dataError);
        return c.json(
          {
            error: "Failed to update health log",
            message:
              dataError instanceof Error ? dataError.message : String(dataError),
          },
          500,
        );
      }
    } catch (error) {
      console.error("Unexpected error updating health log:", error);
      return c.json(
        {
          error: "Failed to update health log",
          message: error instanceof Error ? error.message : String(error),
        },
        500,
      );
    }
  })
  .post("/api/seed", async (c) => {
    try {
      const result = await seedDatabase(c as AppContext);
      return c.json(result);
    } catch (error) {
      console.error("Error seeding database:", error);
      return c.json(
        {
          error: "Failed to seed database",
          message: error instanceof Error ? error.message : String(error),
        },
        500,
      );
    }
  })
  .post(
    "/api/create-health-log-from-text",
    zValidator('json', createHealthLogFromTextSchema),
    async (c) => {
      try {
        console.log("Create health log from text request received");
        const { text } = c.req.valid('json');

        console.log("Text received:", text.substring(0, 100) + "...");

        try {
          // Extract structured data using Gemini
          const healthData = await extractHealthData(c, text);
          console.log("Health data extracted successfully");

          // Save to database
          const logId = await saveHealthLog(
            c as AppContext,
            "", // No audio URL for text-based entries
            text,
            healthData,
          );
          console.log("Health log saved to database with ID:", logId);

          console.log("Successfully processed text entry", {
            id: logId,
          });

          // Return the structured data with the log ID
          return c.json({
            success: true,
            message: "Text entry processed successfully",
            id: logId,
            transcript: text,
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
        console.error("Unexpected error processing text entry:", error);
        return c.json(
          {
            error: "Failed to process text entry",
            message: error instanceof Error ? error.message : String(error),
          },
          500,
        );
      }
    },
  );

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

// HTML template for the SPA
const htmlTemplate = `<!doctype html>
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
</html>`;

// Serve the Health Tracking Voice Recorder app as the main page
app.get("/", async (c) => {
  return c.html(htmlTemplate);
});

// Catch-all route for client-side routing (SPA support)
// This must be LAST to avoid interfering with API routes
app.get("*", async (c) => {
  const path = c.req.path;
  
  // Don't serve SPA for API routes, static files, or recordings
  if (path.startsWith("/api/") || path.startsWith("/static/") || path.startsWith("/recordings/") || path.startsWith("/logs")) {
    return c.notFound();
  }
  
  // Serve the SPA for all other routes (client-side routing)
  return c.html(htmlTemplate);
});

// Export the route types for RPC
export type AuthRoutes = typeof authRoutes;
export type ApiRoutes = typeof apiRoutes;

export default app;
