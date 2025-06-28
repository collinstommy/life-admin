import React, { useState } from 'react';
import { useProcessTranscript } from '../hooks/useHealthLogs';

export function TranscriptProcessor() {
  const [transcript, setTranscript] = useState('');
  
  const processMutation = useProcessTranscript();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!transcript.trim()) {
      alert('Please enter a transcript to process');
      return;
    }

    processMutation.mutate(transcript.trim(), {
      onSuccess: (data) => {
        console.log('Processing successful:', data);
        // Keep the transcript in the input for reference
      },
      onError: (error) => {
        console.error('Processing failed:', error);
      }
    });
  };

  const clearTranscript = () => {
    setTranscript('');
    processMutation.reset();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-4">Process Transcript</h2>
      <p className="text-gray-600 mb-6">
        Enter your health-related text and we'll extract structured data from it.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="transcript" className="block text-sm font-medium text-gray-700 mb-2">
            Health Transcript
          </label>
          <textarea
            id="transcript"
            value={transcript}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTranscript(e.target.value)}
            placeholder="Enter your health log here... For example: 'Today I had a great workout at the gym for 45 minutes doing strength training. I drank about 6 glasses of water and ate a healthy salad for lunch. I'm feeling really energetic and my mood is great!'"
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={processMutation.isPending}
          />
          <p className="text-sm text-gray-500 mt-1">
            {transcript.length} characters
          </p>
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={!transcript.trim() || processMutation.isPending}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-md font-semibold transition-colors"
          >
            {processMutation.isPending ? 'Processing...' : 'Process Transcript'}
          </button>
          
          <button
            type="button"
            onClick={clearTranscript}
            disabled={processMutation.isPending}
            className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-md font-semibold transition-colors"
          >
            Clear
          </button>
        </div>
      </form>

      {/* Processing Status */}
      {processMutation.isPending && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <div>
              <p className="text-blue-800 font-medium">Processing transcript...</p>
              <p className="text-blue-600 text-sm">Extracting health data using AI.</p>
            </div>
          </div>
        </div>
      )}

      {processMutation.isError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-6">
          <p className="text-red-700 font-medium">Processing Failed</p>
          <p className="text-red-600 text-sm">{processMutation.error?.message}</p>
        </div>
      )}

      {processMutation.isSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mt-6">
          <p className="text-green-800 font-medium">✅ Transcript processed successfully!</p>
          <p className="text-green-700 text-sm">ID: {processMutation.data.id}</p>
          
          <div className="mt-4 space-y-4">
            {/* Original Transcript */}
            <div>
              <p className="text-sm font-medium text-green-800 mb-2">Original Transcript:</p>
              <div className="bg-green-100 p-3 rounded text-sm text-green-700">
                {processMutation.data.transcript}
              </div>
            </div>
            
            {/* Extracted Health Data */}
            {processMutation.data.data && (
              <div>
                <p className="text-sm font-medium text-green-800 mb-2">Extracted Health Data:</p>
                <pre className="text-xs text-green-700 bg-green-100 p-3 rounded overflow-auto max-h-64 border">
                  {JSON.stringify(processMutation.data.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Example/Help Section */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-800 mb-2">Examples</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p><strong>Workout:</strong> "I did a 30-minute HIIT workout this morning and felt great!"</p>
          <p><strong>Nutrition:</strong> "For breakfast I had oatmeal with berries and drank 2 glasses of water."</p>
          <p><strong>Sleep:</strong> "I slept for 8 hours last night and woke up feeling refreshed."</p>
          <p><strong>Mood:</strong> "I'm feeling stressed today but my energy level is pretty good."</p>
          <p><strong>Multiple:</strong> "Today I worked out for 45 minutes, ate a healthy lunch, drank 6 glasses of water, and I'm in a great mood!"</p>
        </div>
      </div>
    </div>
  );
} 