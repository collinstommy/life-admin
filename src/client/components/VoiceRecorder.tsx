import React, { useState, useRef, useEffect } from 'react';
import { useUploadRecording } from '../hooks/useHealthLogs';

export function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState('00:00');
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  
  const uploadMutation = useUploadRecording();

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

  const uploadRecording = () => {
    if (recordedBlob) {
      uploadMutation.mutate(recordedBlob, {
        onSuccess: (data) => {
          console.log('Upload successful:', data);
          // Reset the recorder state
          resetRecorder();
        },
        onError: (error) => {
          console.error('Upload failed:', error);
          setError(error.message);
        }
      });
    }
  };

  const resetRecorder = () => {
    setRecordedBlob(null);
    setRecordingTime('00:00');
    setError(null);
    if (recordedBlob) {
      URL.revokeObjectURL(URL.createObjectURL(recordedBlob));
    }
  };

  const discardRecording = () => {
    resetRecorder();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-4">Voice Recorder</h2>
      
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
              disabled={!isInitialized || uploadMutation.isPending}
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
              onClick={uploadRecording}
              disabled={uploadMutation.isPending}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-md font-semibold transition-colors"
            >
              {uploadMutation.isPending ? 'Uploading...' : 'Upload & Process'}
            </button>
            
            <button 
              onClick={discardRecording}
              disabled={uploadMutation.isPending}
              className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-md font-semibold transition-colors"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Upload Status */}
      {uploadMutation.isPending && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <div>
              <p className="text-blue-800 font-medium">Processing your recording...</p>
              <p className="text-blue-600 text-sm">This may take a few moments.</p>
            </div>
          </div>
        </div>
      )}

      {uploadMutation.isError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700 font-medium">Upload Failed</p>
          <p className="text-red-600 text-sm">{uploadMutation.error?.message}</p>
        </div>
      )}

      {uploadMutation.isSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-green-800 font-medium">✅ Recording processed successfully!</p>
          <p className="text-green-700 text-sm">ID: {uploadMutation.data.id}</p>
          
          {uploadMutation.data.transcript && (
            <div className="mt-3">
              <p className="text-sm font-medium text-green-800 mb-1">Transcript:</p>
              <p className="text-sm text-green-700 bg-green-100 p-2 rounded">
                {uploadMutation.data.transcript}
              </p>
            </div>
          )}
          
          {uploadMutation.data.data && (
            <div className="mt-3">
              <p className="text-sm font-medium text-green-800 mb-1">Health Data:</p>
              <pre className="text-xs text-green-700 bg-green-100 p-2 rounded overflow-auto max-h-32">
                {JSON.stringify(uploadMutation.data.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 