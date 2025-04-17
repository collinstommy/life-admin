/**
 * Health Tracking Voice Recorder
 * Audio recording functionality
 */

class VoiceRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.audioBlob = null;
    this.audioUrl = null;
    this.stream = null;
    this.isRecording = false;
    this.recordingStartTime = null;
    this.recordingTimer = null;
  }

  /**
   * Request microphone access and set up the MediaRecorder
   * @returns {Promise<boolean>} Success status
   */
  async setup() {
    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create MediaRecorder instance
      this.mediaRecorder = new MediaRecorder(this.stream);

      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        // Create audio blob from recorded chunks
        this.audioBlob = new Blob(this.audioChunks, { type: "audio/webm" });
        this.audioUrl = URL.createObjectURL(this.audioBlob);

        // Notify that recording has completed
        const event = new CustomEvent("recordingComplete", {
          detail: { audioUrl: this.audioUrl, audioBlob: this.audioBlob },
        });
        document.dispatchEvent(event);
      };

      return true;
    } catch (error) {
      console.error("Error setting up recorder:", error);
      return false;
    }
  }

  /**
   * Start recording audio
   */
  startRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== "recording") {
      // Reset audio chunks array
      this.audioChunks = [];
      this.audioBlob = null;
      this.audioUrl = null;

      // Start recording
      this.mediaRecorder.start();
      this.isRecording = true;
      this.recordingStartTime = Date.now();

      // Start timer
      this.startTimer();

      // Notify that recording has started
      const event = new CustomEvent("recordingStart");
      document.dispatchEvent(event);
    }
  }

  /**
   * Stop recording audio
   */
  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
      this.mediaRecorder.stop();
      this.isRecording = false;

      // Stop timer
      this.stopTimer();

      // Notify that recording has stopped
      const event = new CustomEvent("recordingStop");
      document.dispatchEvent(event);
    }
  }

  /**
   * Clean up resources
   */
  cleanup() {
    // Stop all tracks
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
    }

    // Clear timer
    this.stopTimer();

    // Revoke object URL
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
    }
  }

  /**
   * Start the recording timer
   */
  startTimer() {
    // Clear existing timer if any
    this.stopTimer();

    // Update timer every 100ms
    this.recordingTimer = setInterval(() => {
      if (!this.recordingStartTime) return;

      const elapsedTime = Date.now() - this.recordingStartTime;
      const formattedTime = this.formatTime(elapsedTime);

      // Dispatch timer update event
      const event = new CustomEvent("timerUpdate", {
        detail: { time: formattedTime, elapsedMs: elapsedTime },
      });
      document.dispatchEvent(event);
    }, 100);
  }

  /**
   * Stop the recording timer
   */
  stopTimer() {
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
  }

  /**
   * Format milliseconds to MM:SS format
   * @param {number} ms - Milliseconds
   * @returns {string} Formatted time string
   */
  formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  /**
   * Get the recorded audio blob
   * @returns {Blob|null} Audio blob
   */
  getAudioBlob() {
    return this.audioBlob;
  }

  /**
   * Get the recorded audio URL
   * @returns {string|null} Audio URL
   */
  getAudioUrl() {
    return this.audioUrl;
  }

  /**
   * Check if recording is in progress
   * @returns {boolean} Recording status
   */
  isCurrentlyRecording() {
    return this.isRecording;
  }
}

// Make VoiceRecorder available globally for other scripts
window.VoiceRecorder = VoiceRecorder;
