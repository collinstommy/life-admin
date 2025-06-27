import { AppContext } from "../../types";

/**
 * Generates a random file name for audio recordings
 * @returns A random string suitable for file names
 */
function generateRandomFileName(): string {
  // Generate a timestamp-based filename with some random characters
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${randomPart}`;
}

/**
 * Stores an audio recording in R2 and returns the URL
 * @param ctx Hono context with R2 binding
 * @param audioBlob Audio data as a Blob or ArrayBuffer
 * @param extension File extension (default: 'webm')
 * @returns URL to the stored file
 */
export async function storeAudioRecording(
  ctx: AppContext,
  audioBlob: ArrayBuffer | Blob,
  extension: string = "webm",
): Promise<string> {
  const fileName = `${generateRandomFileName()}.${extension}`;
  const contentType =
    extension === "webm"
      ? "audio/webm"
      : extension === "mp3"
        ? "audio/mpeg"
        : "application/octet-stream";

  await ctx.env.HEALTH_RECORDINGS.put(fileName, audioBlob, {
    httpMetadata: {
      contentType,
    },
  });

  // Return the URL that can be used to access the file
  // This assumes your worker handles requests to /recordings/:id
  return `/recordings/${fileName}`;
}

/**
 * Gets an audio recording from R2
 * @param ctx Hono context with R2 binding
 * @param fileName Name of the file to retrieve
 * @returns The audio file as a Response or null if not found
 */
export async function getAudioRecording(
  ctx: AppContext,
  fileName: string,
): Promise<Response | null> {
  const file = await ctx.env.HEALTH_RECORDINGS.get(fileName);

  if (!file) {
    return null;
  }

  console.log("File:", file);

  return new Response(file.body, {
    headers: {
      "Content-Type":
        file.httpMetadata?.contentType || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000", // Cache for a year
    },
  });
}
