import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useExtractHealthData, useTranscribeAudio } from '../hooks/useHealthLogs';
import { Instructions } from './Instructions';

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
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        {/* Navigation Header */}
        <div className="glass-card sticky top-0 z-50 border-b border-slate-200/50 rounded-b-2xl">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors">
                <span className="icon-[mdi--chevron-left] w-5 h-5"></span>
                <span className="text-sm font-medium">Back</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">🎤</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Voice Recorder</h2>
                <p className="text-slate-600">Record your health update using voice</p>
              </div>
            </div>
            
            <Instructions />
            
            {/* Error Display */}
            {error && (
              <div className="glass-card bg-red-50/50 border-red-200 rounded-xl p-4 mb-6">
                <p className="text-red-700 font-medium">{error}</p>
                <button 
                  onClick={initializeRecorder}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Recording Controls */}
            <div className="text-center mb-8">
              <div className="text-5xl font-mono mb-6 text-slate-700 tracking-wider">
                {recordingTime}
              </div>
              
              <div className="space-x-4">
                {!isRecording ? (
                  <button 
                    onClick={startRecording}
                    disabled={!isInitialized || isLoadingOrProcessing}
                    className="btn btn-lg bg-green-500 hover:bg-green-600 disabled:bg-slate-300 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:shadow-none"
                  >
                    <span className="flex items-center space-x-2">
                      <span className="icon-[mdi--microphone] w-6 h-6"></span>
                      <span>{!isInitialized ? 'Initializing...' : 'Start Recording'}</span>
                    </span>
                  </button>
                ) : (
                  <button 
                    onClick={stopRecording}
                    className="btn btn-lg bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 animate-pulse"
                  >
                    <span className="flex items-center space-x-2">
                      <span className="icon-[mdi--stop] w-6 h-6"></span>
                      <span>Stop Recording</span>
                    </span>
                  </button>
                )}
              </div>

              {isRecording && (
                <div className="mt-8">
                  <div className="inline-flex items-center space-x-3 bg-red-50/80 border border-red-200 rounded-full px-6 py-3 text-red-700">
                    <div className="relative">
                      <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                      <div className="absolute inset-0 w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
                    </div>
                    <span className="text-base font-semibold">Recording in Progress...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Recording Preview */}
            {recordedBlob && (
              <div className="glass-card rounded-xl p-6 mb-6">
                <h3 className="text-xl font-semibold text-slate-900 mb-4">Recording Preview</h3>
                
                <audio 
                  controls 
                  src={URL.createObjectURL(recordedBlob)} 
                  className="w-full mb-6 rounded-lg"
                />
                
                <div className="flex justify-center space-x-4">
                  <button 
                    onClick={processRecording}
                    disabled={isLoadingOrProcessing}
                    className="btn btn-primary btn-md"
                  >
                    {isLoadingOrProcessing ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Processing...
                      </>
                    ) : (
                      'Process & Review'
                    )}
                  </button>
                  
                  <button 
                    onClick={discardRecording}
                    disabled={isLoadingOrProcessing}
                    className="btn btn-ghost btn-md text-slate-600 hover:text-red-600 hover:bg-red-50"
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}

            {/* Processing Status */}
            {isTranscribing && (
              <div className="glass-card bg-blue-50/50 border-blue-200 rounded-xl p-6 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <div>
                    <p className="text-blue-800 font-semibold">Transcribing your recording...</p>
                    <p className="text-blue-600 text-sm">Converting speech to text using AI</p>
                  </div>
                </div>
              </div>
            )}

            {isProcessing && !isTranscribing && (
              <div className="glass-card bg-blue-50/50 border-blue-200 rounded-xl p-6 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <div>
                    <p className="text-blue-800 font-semibold">Extracting health data...</p>
                    <p className="text-blue-600 text-sm">Analyzing your transcript for health information</p>
                  </div>
                </div>
              </div>
            )}

            {/* Error States */}
            {transcribeAudio.isError && (
              <div className="glass-card bg-red-50/50 border-red-200 rounded-xl p-6 mb-6">
                <div className="flex items-center space-x-2">
                  <span className="icon-[mdi--alert] w-5 h-5 text-red-600"></span>
                  <div>
                    <p className="text-red-700 font-semibold">Transcription Failed</p>
                    <p className="text-red-600 text-sm">{transcribeAudio.error?.message}</p>
                  </div>
                </div>
              </div>
            )}

            {extractHealthData.isError && (
              <div className="glass-card bg-red-50/50 border-red-200 rounded-xl p-6 mb-6">
                <div className="flex items-center space-x-2">
                  <span className="icon-[mdi--alert] w-5 h-5 text-red-600"></span>
                  <div>
                    <p className="text-red-700 font-semibold">Health Data Extraction Failed</p>
                    <p className="text-red-600 text-sm">{extractHealthData.error?.message}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}