/**
 * Health Tracking Voice Recorder
 * Main application script
 */

// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", () => {
  // Initialize the recorder
  const recorder = new VoiceRecorder();

  // References to DOM elements - Voice Recording
  const startRecordingBtn = document.getElementById("startRecordingBtn");
  const stopRecordingBtn = document.getElementById("stopRecordingBtn");
  const uploadRecordingBtn = document.getElementById("uploadRecordingBtn");
  const discardRecordingBtn = document.getElementById("discardRecordingBtn");
  const recorderStatus = document.getElementById("recorderStatus");
  const recordingTimer = document.getElementById("recordingTimer");
  const audioPreview = document.getElementById("audioPreview");
  const previewSection = document.getElementById("previewSection");

  // References to DOM elements - Transcript Processing
  const transcriptInput = document.getElementById("transcriptInput");
  const processTranscriptBtn = document.getElementById("processTranscriptBtn");
  const clearTranscriptBtn = document.getElementById("clearTranscriptBtn");

  // References to DOM elements - Shared
  const resultSection = document.getElementById("resultSection");
  const processingStatus = document.getElementById("processingStatus");
  const resultData = document.getElementById("resultData");
  const resultJson = document.getElementById("resultJson");

  // References to DOM elements - Navigation
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  // Set up event listeners - Recording
  startRecordingBtn.addEventListener("click", handleStartRecording);
  stopRecordingBtn.addEventListener("click", handleStopRecording);
  uploadRecordingBtn.addEventListener("click", handleUploadRecording);
  discardRecordingBtn.addEventListener("click", handleDiscardRecording);

  // Set up event listeners - Transcript
  processTranscriptBtn.addEventListener("click", handleProcessTranscript);
  clearTranscriptBtn.addEventListener("click", handleClearTranscript);

  // Set up event listeners - Navigation
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabId = button.getAttribute("data-tab");
      switchTab(tabId);
    });
  });

  // Listen for recorder events
  document.addEventListener("recordingStart", handleRecordingStarted);
  document.addEventListener("recordingStop", handleRecordingStopped);
  document.addEventListener("recordingComplete", handleRecordingCompleted);
  document.addEventListener("timerUpdate", handleTimerUpdate);

  /**
   * Switch between tabs
   * @param {string} tabId - The ID of the tab to switch to
   */
  function switchTab(tabId) {
    // Hide all tabs and remove active class from all buttons
    tabContents.forEach((tab) => tab.classList.remove("active"));
    tabButtons.forEach((btn) => btn.classList.remove("active"));

    // Show the selected tab and set the corresponding button as active
    document.getElementById(tabId).classList.add("active");
    document.querySelector(`[data-tab="${tabId}"]`).classList.add("active");

    // Hide the results section when switching tabs
    resultSection.style.display = "none";
  }

  /**
   * Initialize the recorder when the page loads
   */
  async function initializeRecorder() {
    try {
      const setupSuccess = await recorder.setup();

      if (setupSuccess) {
        startRecordingBtn.disabled = false;
        recorderStatus.textContent = "Ready to record";
      } else {
        recorderStatus.textContent = "Failed to initialize recorder";
        startRecordingBtn.disabled = true;
      }
    } catch (error) {
      console.error("Error initializing recorder:", error);
      recorderStatus.textContent = "Failed to initialize recorder";
      startRecordingBtn.disabled = true;
    }
  }

  /**
   * Handle start recording button click
   */
  async function handleStartRecording() {
    // If recorder is not set up, initialize it
    if (!recorder.mediaRecorder) {
      await initializeRecorder();
      if (!recorder.mediaRecorder) return;
    }

    // Start recording
    recorder.startRecording();
  }

  /**
   * Handle stop recording button click
   */
  function handleStopRecording() {
    recorder.stopRecording();
  }

  /**
   * Handle recording started event
   */
  function handleRecordingStarted() {
    // Update UI
    startRecordingBtn.disabled = true;
    stopRecordingBtn.disabled = false;
    recorderStatus.textContent = "Recording...";

    // Hide preview and results sections
    previewSection.style.display = "none";
    resultSection.style.display = "none";
  }

  /**
   * Handle recording stopped event
   */
  function handleRecordingStopped() {
    // Update UI
    startRecordingBtn.disabled = false;
    stopRecordingBtn.disabled = true;
    recorderStatus.textContent = "Recording stopped";
  }

  /**
   * Handle recording completed event
   * @param {CustomEvent} event - Event containing audio data
   */
  function handleRecordingCompleted(event) {
    const { audioUrl } = event.detail;

    // Set audio preview source
    audioPreview.src = audioUrl;

    // Show preview section
    previewSection.style.display = "block";
  }

  /**
   * Handle timer update event
   * @param {CustomEvent} event - Event containing timer data
   */
  function handleTimerUpdate(event) {
    const { time } = event.detail;
    recordingTimer.textContent = time;
  }

  /**
   * Handle upload recording button click
   */
  async function handleUploadRecording() {
    try {
      const audioBlob = recorder.getAudioBlob();

      if (!audioBlob) {
        console.error("No recording available");
        return;
      }

      // Show processing UI
      previewSection.style.display = "none";
      resultSection.style.display = "block";
      processingStatus.style.display = "block";
      resultData.style.display = "none";

      // Create a FormData object to send the recording
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      try {
        // Show detailed processing steps
        processingStatus.innerHTML = `
          <div class="loader"></div>
          <p>Step 1/3: Uploading audio recording...</p>
        `;

        // Send to the server
        const response = await fetch("/api/health-log", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server error (${response.status}): ${errorText}`);
        }

        processingStatus.innerHTML = `
          <div class="loader"></div>
          <p>Step 3/3: Processing completed!</p>
        `;

        const result = await response.json();

        // Safely display the transcript
        const transcriptTextElement = document.getElementById("transcriptText");
        if (transcriptTextElement) {
          if (result.transcript) {
            transcriptTextElement.textContent = result.transcript;
          } else {
            transcriptTextElement.textContent = "No transcript available.";
          }
        } else {
          console.error(
            "Cannot find transcript element with ID 'transcriptText'",
          );
        }

        // Display the result
        resultJson.textContent = JSON.stringify(result.data || result, null, 2);
        processingStatus.style.display = "none";
        resultData.style.display = "block";

        // Add a message about successful processing
        const successMessage = document.createElement("div");
        successMessage.className = "success-message";
        successMessage.innerHTML = `
          <p>✅ Your health log has been successfully processed and saved!</p>
          <p>Log ID: ${result.id}</p>
        `;
        resultData.prepend(successMessage);
      } catch (error) {
        console.error("Error processing recording:", error);
        processingStatus.innerHTML = `
          <p>⚠️ Error: ${error.message}</p>
          <p>Please try again or contact support if the problem persists.</p>
        `;
      }
    } catch (error) {
      console.error("Error uploading recording:", error);
      processingStatus.innerHTML = `
        <p>⚠️ Error processing recording: ${error.message}</p>
        <p>Please try again or contact support if the problem persists.</p>
      `;
    }
  }

  /**
   * Handle process transcript button click
   */
  async function handleProcessTranscript() {
    try {
      const transcript = transcriptInput.value.trim();

      if (!transcript) {
        alert("Please enter a transcript to process");
        return;
      }

      // Show processing UI
      resultSection.style.display = "block";
      processingStatus.style.display = "block";
      resultData.style.display = "none";

      // Show processing status
      processingStatus.innerHTML = `
        <div class="loader"></div>
        <p>Processing transcript...</p>
      `;

      try {
        // Send to the server
        const response = await fetch("/api/process-transcript", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ transcript }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server error (${response.status}): ${errorText}`);
        }

        const result = await response.json();

        // Safely display the transcript
        const transcriptTextElement = document.getElementById("transcriptText");
        if (transcriptTextElement) {
          if (result.transcript) {
            transcriptTextElement.textContent = result.transcript;
          } else {
            transcriptTextElement.textContent = "No transcript available.";
          }
        } else {
          console.error(
            "Cannot find transcript element with ID 'transcriptText'",
          );
        }

        // Display the result
        resultJson.textContent = JSON.stringify(result.data || result, null, 2);
        processingStatus.style.display = "none";
        resultData.style.display = "block";

        // Add a message about successful processing
        const successMessage = document.createElement("div");
        successMessage.className = "success-message";
        successMessage.innerHTML = `
          <p>✅ Your transcript has been successfully processed!</p>
          <p>Log ID: ${result.id}</p>
        `;
        resultData.prepend(successMessage);
      } catch (error) {
        console.error("Error processing transcript:", error);
        processingStatus.innerHTML = `
          <p>⚠️ Error: ${error.message}</p>
          <p>Please try again or contact support if the problem persists.</p>
        `;
      }
    } catch (error) {
      console.error("Error processing transcript:", error);
      processingStatus.innerHTML = `
        <p>⚠️ Error: ${error.message}</p>
        <p>Please try again or contact support if the problem persists.</p>
      `;
    }
  }

  /**
   * Handle clear transcript button click
   */
  function handleClearTranscript() {
    transcriptInput.value = "";
    resultSection.style.display = "none";
  }

  /**
   * Handle discard recording button click
   */
  function handleDiscardRecording() {
    // Reset the recorder
    recorder.reset();

    // Reset UI
    startRecordingBtn.disabled = false;
    stopRecordingBtn.disabled = true;
    recorderStatus.textContent = "Ready to record";
    previewSection.style.display = "none";
    resultSection.style.display = "none";
    processingStatus.style.display = "none";
    resultData.style.display = "none";
    resultJson.textContent = "";
  }

  // Initialize the recorder when the page loads
  initializeRecorder();
});
