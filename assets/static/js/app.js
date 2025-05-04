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

  /**
   * Load recording history from API
   */
  async function loadRecordingHistory() {
    try {
      // Show loading state
      historyLoading.style.display = "flex";
      recordingsList.innerHTML = "";

      // Fetch recordings from API
      const response = await fetch("/api/health-log");

      if (!response.ok) {
        throw new Error(`Failed to fetch recordings: ${response.status}`);
      }

      const data = await response.json();
      const recordings = Array.isArray(data) ? data : data.logs || [];
      const message = data.message || null;

      // Mark recordings as loaded
      recordingsLoaded = true;

      // Hide loading state
      historyLoading.style.display = "none";

      // Display recordings or "no recordings" message
      if (recordings.length === 0) {
        recordingsList.innerHTML = `
          <div class="no-recordings">
            <p>${message || "No recordings found. Create your first health log to get started!"}</p>
          </div>
        `;
        return;
      }

      // Sort recordings by date, newest first
      recordings.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA;
      });

      // Create a card for each recording
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

    // Format date for display
    const recordingDate = new Date(recording.date);
    const formattedDate = recordingDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Get the transcript and healthData, ensuring we have valid values
    const transcript = recording.transcript || "No transcript available";
    const healthData = recording.healthData || {};

    // Format the healthData for display
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
            <button class="play-transcript-btn" aria-label="Play transcript using text-to-speech">
              <span class="icon">🔊</span> Play Transcript
            </button>
          </div>
          <div class="recording-transcript">${transcript}</div>
        </div>
        <div class="recording-section">
          <h4>Health Summary</h4>
          <pre class="recording-json">${formattedHealthData}</pre>
        </div>
      </div>
    `;

    // Add event listener to toggle button
    const toggleBtn = card.querySelector(".toggle-btn");
    toggleBtn.addEventListener("click", () => {
      card.classList.toggle("collapsed");
      const isCollapsed = card.classList.contains("collapsed");
      toggleBtn.querySelector(".toggle-text").textContent = isCollapsed
        ? "Show Details"
        : "Hide Details";
    });

    // Add event listener to play transcript button
    const playBtn = card.querySelector(".play-transcript-btn");
    playBtn.addEventListener("click", () => {
      playTranscriptAudio(transcript);
    });

    return card;
  }

  /**
   * Play transcript using the browser's Speech Synthesis API
   * @param {string} text - The transcript text to play
   */
  function playTranscriptAudio(text) {
    // Check if text is empty or if speech synthesis is not supported
    if (!text || !window.speechSynthesis) {
      alert(
        "Unable to play transcript. Your browser may not support speech synthesis.",
      );
      return;
    }

    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    // Create a new speech synthesis utterance
    const utterance = new SpeechSynthesisUtterance(text);

    // Set properties
    utterance.lang = "en-US";
    utterance.rate = 1.0; // Normal speed
    utterance.pitch = 1.0; // Normal pitch
    utterance.volume = 1.0; // Full volume

    // Get available voices (this is async in some browsers)
    let voices = window.speechSynthesis.getVoices();

    // If voices aren't immediately available, wait for them to load
    if (voices.length === 0) {
      window.speechSynthesis.addEventListener("voiceschanged", () => {
        voices = window.speechSynthesis.getVoices();
        setVoice();
      });
    } else {
      setVoice();
    }

    // Set a preferred voice if available
    function setVoice() {
      // Try to find a nice sounding voice
      const preferredVoices = [
        "Google UK English Female",
        "Microsoft Libby Online (Natural)",
        "Samantha",
        "Daniel",
      ];

      for (const name of preferredVoices) {
        const voice = voices.find((v) => v.name === name);
        if (voice) {
          utterance.voice = voice;
          break;
        }
      }

      // Fall back to the first English voice if none of the preferred voices are available
      if (!utterance.voice) {
        const englishVoice = voices.find((v) => v.lang.startsWith("en-"));
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
      }

      // Start speaking
      window.speechSynthesis.speak(utterance);
    }
  }

  // Initialize the recorder when the page loads
  initializeRecorder();
});
