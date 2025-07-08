import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useExtractHealthData, useTranscribeAudio } from '../hooks/useHealthLogs';

export function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState('00:00');
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [extractedData, setExtractedData] = useState<any>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  
  const extractHealthData = useExtractHealthData();
  const transcribeAudio = useTranscribeAudio();
  const navigate = useNavigate();

  // Initialize recorder on component mount
  useEffect(() => {
    initializeRecorder();
    return () => {
      // Cleanup on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  const initializeRecorder = async () => {
    try {
      setError(null);
      // We'll request permission but not start the stream yet
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately - we just wanted to check permissions
      stream.getTracks().forEach(track => track.stop());
      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing recorder:', error);
      setError('Failed to initialize recorder. Please check microphone permissions.');
      setIsInitialized(false);
    }
  };

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setRecordedBlob(blob);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      startTimeRef.current = Date.now();
      
      // Start timer
      timerRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const seconds = Math.floor(elapsed / 1000);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        setRecordingTime(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const processRecording = async () => {
    if (!recordedBlob) return;

    setIsProcessing(true);
    setIsTranscribing(true);
    setError(null);

    try {
      // First, transcribe the audio
      console.log('Transcribing audio recording...');
      const transcriptionResponse = await transcribeAudio.mutateAsync(recordedBlob);
      const transcribedText = (transcriptionResponse as any).transcript;
      console.log('Transcription result:', transcribedText);
      setTranscript(transcribedText);
      setIsTranscribing(false);

      // Create audio URL for storage
      const audioURL = URL.createObjectURL(recordedBlob);
      setAudioUrl(audioURL);

      // Extract health data from transcript
      console.log('Extracting health data from transcript...');
      const response = await extractHealthData.mutateAsync(transcribedText);
      const extractedHealthData = (response as any).data;
      setExtractedData(extractedHealthData);
      console.log('Health data extracted successfully');

      // Navigate to edit screen with extracted data
      navigate({ 
        to: '/edit-entry',
        state: {
          initialData: extractedHealthData,
          transcript: transcribedText,
          audioUrl: audioURL
        }
      } as any);
      
    } catch (error) {
      console.error('Processing failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to process recording');
      setIsTranscribing(false);
    } finally {
      setIsProcessing(false);
    }
  };



  const resetRecorder = () => {
    setRecordedBlob(null);
    setRecordingTime('00:00');
    setError(null);
    setTranscript('');
    setAudioUrl('');
    setExtractedData(null);
    setIsTranscribing(false);
    if (recordedBlob) {
      URL.revokeObjectURL(URL.createObjectURL(recordedBlob));
    }
  };

  const discardRecording = () => {
    resetRecorder();
  };

  const isLoadingOrProcessing = isProcessing || isTranscribing;

  return (
    <>
      <div className="bg-gray-50 min-h-screen">
        {/* Navigation Header */}
        <div className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <Link to="/" className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <span className="icon-[mdi-light--chevron-left] w-4 h-4 mr-2"></span>
                Back
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Voice Recorder</h2>
            
            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <p className="text-red-700">{error}</p>
                <button 
                  onClick={initializeRecorder}
                  className="mt-2 text-sm text-red-600 underline hover:text-red-800"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Recording Controls */}
            <div className="text-center mb-6">
              <div className="text-4xl font-mono mb-4 text-gray-700">
                {recordingTime}
              </div>
              
              <div className="space-x-4">
                {!isRecording ? (
                  <button 
                    onClick={startRecording}
                    disabled={!isInitialized || isLoadingOrProcessing}
                    className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-6 py-3 rounded-full text-lg font-semibold transition-colors"
                  >
                    {!isInitialized ? 'Initializing...' : 'Start Recording'}
                  </button>
                ) : (
                  <button 
                    onClick={stopRecording}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-full text-lg font-semibold transition-colors"
                  >
                    Stop Recording
                  </button>
                )}
              </div>

              {isRecording && (
                <div className="mt-4">
                  <div className="inline-flex items-center space-x-2 text-red-600">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Recording...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Recording Preview */}
            {recordedBlob && (
              <div className="border border-gray-200 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-medium mb-3">Recording Preview</h3>
                
                <audio 
                  controls 
                  src={URL.createObjectURL(recordedBlob)} 
                  className="w-full mb-4"
                />
                
                <div className="flex justify-center space-x-4">
                  <button 
                    onClick={processRecording}
                    disabled={isLoadingOrProcessing}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-md font-semibold transition-colors"
                  >
                    {isLoadingOrProcessing ? 'Processing...' : 'Process & Review'}
                  </button>
                  
                  <button 
                    onClick={discardRecording}
                    disabled={isLoadingOrProcessing}
                    className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-md font-semibold transition-colors"
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}

            {/* Processing Status */}
            {isTranscribing && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <div>
                    <p className="text-blue-800 font-medium">Transcribing your recording...</p>
                    <p className="text-blue-600 text-sm">Converting speech to text using AI.</p>
                  </div>
                </div>
              </div>
            )}

            {isProcessing && !isTranscribing && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <div>
                    <p className="text-blue-800 font-medium">Extracting health data...</p>
                    <p className="text-blue-600 text-sm">Analyzing your transcript for health information.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Error States */}
            {transcribeAudio.isError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <p className="text-red-700 font-medium">Transcription Failed</p>
                <p className="text-red-600 text-sm">{transcribeAudio.error?.message}</p>
              </div>
            )}

            {extractHealthData.isError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <p className="text-red-700 font-medium">Health Data Extraction Failed</p>
                <p className="text-red-600 text-sm">{extractHealthData.error?.message}</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </>
  );
} 