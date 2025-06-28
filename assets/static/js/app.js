/**
 * Health Tracking Voice Recorder
 * Main application script
 */

// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", () => {
  // Initialize the recorder if VoiceRecorder class exists
  // VoiceRecorder is defined in recorder.js which should be loaded before this script
  const recorder =
    typeof VoiceRecorder !== "undefined" ? new VoiceRecorder() : null;

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
  const voiceTranscriptContainer = document.getElementById(
    "voiceTranscriptContainer",
  );
  const transcriptText = document.getElementById("transcriptText");

  // References to DOM elements - Navigation
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  // References to DOM elements - History
  const historyLoading = document.getElementById("historyLoading");
  const recordingsList = document.getElementById("recordingsList");

  // Track current active tab - used to remember which tab is currently shown
  // and provide appropriate UI context for user actions
  let activeTab = "recorder-tab";

  // Track if recordings have been loaded
  let recordingsLoaded = false;

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
      // Load recordings when switching to history tab
      if (tabId === "history-tab" && !recordingsLoaded) {
        loadRecordingHistory();
      }
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

    // Track the active tab
    activeTab = tabId;
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
          <p>Uploading and processing your recording...</p>
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

        const result = await response.json();

        // For voice recordings, show the transcript container and text
        voiceTranscriptContainer.style.display = "block";

        // Safely display the transcript
        if (result.transcript) {
          transcriptText.textContent = result.transcript;
        } else {
          transcriptText.textContent = "No transcript available.";
        }

        // Display the result
        resultJson.textContent = JSON.stringify(result.data || result, null, 2);
        processingStatus.style.display = "none";
        resultData.style.display = "block";

        // Add a message about successful processing
        const successMessage = document.createElement("div");
        successMessage.className = "success-message";
        successMessage.innerHTML = `
          <p>✅ Your health log has been successfully processed!</p>
          <p>ID: ${result.id}</p>
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

        // For transcript tab, hide the transcript container
        voiceTranscriptContainer.style.display = "none";

        // Display the result
        resultJson.textContent = JSON.stringify(result.data || result, null, 2);
        processingStatus.style.display = "none";
        resultData.style.display = "block";

        // Add a message about successful processing
        const successMessage = document.createElement("div");
        successMessage.className = "success-message";
        successMessage.innerHTML = `
          <p>✅ Your health data has been successfully processed!</p>
          <p>ID: ${result.id}</p>
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

  async function loadRecordingHistory() {
    try {
      historyLoading.style.display = "flex";
      recordingsList.innerHTML = "";

      const response = await fetch("/api/health-log");

      if (!response.ok) {
        throw new Error(`Failed to fetch recordings: ${response.status}`);
      }

      const data = await response.json();
      const recordings = Array.isArray(data) ? data : data.logs || [];
      const message = data.message || null;

      recordingsLoaded = true;

      historyLoading.style.display = "none";

      if (recordings.length === 0) {
        recordingsList.innerHTML = `
          <div class="no-recordings">
            <p>${message || "No recordings found. Create your first health log to get started!"}</p>
          </div>
        `;
        return;
      }

      recordings.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA;
      });

      recordings.forEach((recording) => {
        const card = createRecordingCard(recording);
        recordingsList.appendChild(card);
      });
    } catch (error) {
      console.error("Error loading recording history:", error);
      historyLoading.style.display = "none";
      recordingsList.innerHTML = `
        <div class="no-recordings">
          <p>Error loading recordings: ${error.message}</p>
          <button id="retryLoadBtn" class="btn btn-primary">Retry</button>
        </div>
      `;

      // Add event listener to retry button
      document.getElementById("retryLoadBtn")?.addEventListener("click", () => {
        loadRecordingHistory();
      });
    }
  }

  /**
   * Create a card element for a recording
   * @param {Object} recording - The recording data
   * @returns {HTMLElement} The card element
   */
  function createRecordingCard(recording) {
    const card = document.createElement("div");
    card.className = "recording-card collapsed";
    card.id = `recording-${recording.id}`;

    const recordingDate = new Date(recording.date);
    const formattedDate = recordingDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const transcript = recording.transcript || "No transcript available";
    const healthData = recording.healthData || {};

    const formattedHealthData = JSON.stringify(healthData, null, 2);

    card.innerHTML = `
      <div class="recording-header">
        <div class="recording-date">${formattedDate}</div>
        <div class="recording-actions">
          <button class="toggle-btn" aria-label="Toggle recording details">
            <span class="toggle-text">Show Details</span>
          </button>
        </div>
      </div>
      <div class="recording-content">
        <div class="recording-section">
          <div class="section-header">
            <h4>Raw Transcript</h4>
          </div>
          <div class="recording-transcript">${transcript}</div>
        </div>
        <div class="recording-section">
          <h4>Health Summary</h4>
          <pre class="recording-json">${formattedHealthData}</pre>
        </div>
      </div>
    `;

    const toggleBtn = card.querySelector(".toggle-btn");
    toggleBtn.addEventListener("click", () => {
      card.classList.toggle("collapsed");
      const isCollapsed = card.classList.contains("collapsed");
      toggleBtn.querySelector(".toggle-text").textContent = isCollapsed
        ? "Show Details"
        : "Hide Details";
    });

    return card;
  }

  // Initialize the recorder when the page loads
  initializeRecorder();
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", handleLogin);
  }
});

/**
 * Handle login button click
 */
async function handleLogin() {
  console.log("handleLogin");

  const password = passwordInput.value;
  if (!password) {
    alert("Please enter a password.");
    return;
  }

  try {
    const response = await fetch("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });

    if (response.ok) {
      alert("Logged in successfully!");
      // Optionally, hide the login section or redirect
    } else {
      const errorData = await response.json();
      alert(`Login failed: ${errorData.error}`);
    }
  } catch (error) {
    console.error("Error during login:", error);
    alert("An error occurred during login.");
  }
}
