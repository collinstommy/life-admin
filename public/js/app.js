/**
 * Health Tracking Voice Recorder
 * Main application script
 */

// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", () => {
  // Initialize the recorder
  const recorder = new VoiceRecorder();

  // References to DOM elements
  const startRecordingBtn = document.getElementById("startRecordingBtn");
  const stopRecordingBtn = document.getElementById("stopRecordingBtn");
  const uploadRecordingBtn = document.getElementById("uploadRecordingBtn");
  const discardRecordingBtn = document.getElementById("discardRecordingBtn");
  const recorderStatus = document.getElementById("recorderStatus");
  const recordingTimer = document.getElementById("recordingTimer");
  const audioPreview = document.getElementById("audioPreview");
  const previewSection = document.getElementById("previewSection");
  const resultSection = document.getElementById("resultSection");
  const processingStatus = document.getElementById("processingStatus");
  const resultData = document.getElementById("resultData");
  const resultJson = document.getElementById("resultJson");

  // Set up event listeners
  startRecordingBtn.addEventListener("click", handleStartRecording);
  stopRecordingBtn.addEventListener("click", handleStopRecording);
  uploadRecordingBtn.addEventListener("click", handleUploadRecording);
  discardRecordingBtn.addEventListener("click", handleDiscardRecording);

  // Listen for recorder events
  document.addEventListener("recordingStart", handleRecordingStarted);
  document.addEventListener("recordingStop", handleRecordingStopped);
  document.addEventListener("recordingComplete", handleRecordingCompleted);
  document.addEventListener("timerUpdate", handleTimerUpdate);

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
    const { audioUrl, audioBlob } = event.detail;

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

      // Create a FormData object to send the audio file
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      // Send the audio to the server
      const response = await fetch("/api/health-log", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process recording");
      }

      // Parse the JSON response
      const data = await response.json();

      // Display the transcript and structured data
      displayResult(data);
    } catch (error) {
      console.error("Error uploading recording:", error);
      processingStatus.innerHTML = `<p>Error processing recording: ${error.message}</p>`;
    }
  }

  /**
   * Display the result from the server
   * @param {Object} data - Response data from the server
   */
  function displayResult(data) {
    // Hide processing status and show result data
    processingStatus.style.display = "none";
    resultData.style.display = "block";

    const rawTranscript = document.getElementById("rawTranscript");

    // Display the transcript
    if (data.transcript) {
      rawTranscript.textContent = data.transcript;
    } else {
      rawTranscript.textContent = "No transcript available";
    }

    // Display the structured data
    resultJson.textContent = JSON.stringify(data.data || data, null, 2);
  }

  /**
   * Handle discard recording button click
   */
  function handleDiscardRecording() {
    // Reset audio preview
    audioPreview.src = "";

    // Hide preview section
    previewSection.style.display = "none";

    // Reset recorder status
    recorderStatus.textContent = "Ready to record";
  }

  /**
   * Display a sample result (for testing when offline)
   */
  function displaySampleResult() {
    // Hide processing status and show result data
    processingStatus.style.display = "none";
    resultData.style.display = "block";

    // Sample transcript
    const sampleTranscript =
      "Today I had overnight oats with berries for breakfast, a quinoa salad with chickpeas for lunch, and stir-fried veggies with tofu for dinner. I also had an apple and some nuts as snacks. I did a 45-minute yoga session with intensity 7, focusing on deep stretching and back strengthening. I slept about 7.5 hours with quality 8 out of 10. My mood was good, about 8 out of 10. I drank 2.5 liters of water and my screen time was about 3.5 hours.";

    document.getElementById("rawTranscript").textContent = sampleTranscript;

    // Sample JSON data
    const sampleData = {
      date: new Date().toISOString().split("T")[0],
      screenTimeHours: 3.5,
      workouts: [
        {
          type: "Yoga",
          durationMinutes: 45,
          intensity: 7,
          notes: "Focused on deep stretching and back strengthening",
        },
      ],
      meals: [
        {
          type: "Breakfast",
          notes: "Overnight oats with berries",
        },
        {
          type: "Lunch",
          notes: "Quinoa salad with chickpeas",
        },
        {
          type: "Dinner",
          notes: "Stir-fried vegetables with tofu",
        },
      ],
      waterIntakeLiters: 2.5,
      painDiscomfort: {
        location: "Lower back",
        intensity: 3,
        notes: "Mild discomfort after sitting",
      },
      sleep: {
        hours: 7.5,
        quality: 8,
      },
      energyLevel: 7,
      mood: {
        rating: 8,
        notes: "Feeling productive and positive",
      },
      weightKg: 68.2,
      otherActivities: "30 minutes of meditation",
      generalNotes: "Overall a balanced day",
    };

    // Display JSON in the result element
    resultJson.textContent = JSON.stringify(sampleData, null, 2);
  }

  // Initialize the recorder when the page loads
  initializeRecorder();
});
