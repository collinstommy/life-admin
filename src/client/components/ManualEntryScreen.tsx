import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useProcessTranscript } from '../hooks/useHealthLogs';

export function ManualEntryScreen() {
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState<any>(null);
  const processTranscript = useProcessTranscript();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transcript.trim()) {
      alert('Please enter a transcript to process');
      return;
    }

    try {
      const response = await processTranscript.mutateAsync(transcript.trim());
      setResult(response);
      setTranscript(''); // Clear the textarea after successful submission
    } catch (error) {
      console.error('Failed to process transcript:', error);
    }
  };

  const handleClear = () => {
    setTranscript('');
    setResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center mb-8">
        <Link
          to="/debug"
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors mr-4"
        >
          ← Back to Debug
        </Link>
        <h2 className="text-2xl font-semibold text-gray-800">Manual Entry</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            📝 Enter Health Log Transcript
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Type or paste a health log description below. The AI will extract structured data 
            and create a health log entry in the database (without an audio recording).
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="transcript" className="block text-sm font-medium text-gray-700 mb-2">
                Transcript Text
              </label>
              <textarea
                id="transcript"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Example: Today I did a 30-minute run, had oatmeal for breakfast, slept 7 hours last night, and my mood is about 8/10..."
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={processTranscript.isPending || !transcript.trim()}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed"
              >
                {processTranscript.isPending ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  'Process & Create Entry'
                )}
              </button>
              
              <button
                type="button"
                onClick={handleClear}
                disabled={processTranscript.isPending}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear
              </button>
            </div>
          </form>

          {/* Error Display */}
          {processTranscript.error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">
                <strong>Error:</strong> {processTranscript.error.message}
              </p>
            </div>
          )}
        </div>

        {/* Result Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            🎯 Processing Results
          </h3>
          
          {result ? (
            <div className="space-y-4">
              {/* Success Message */}
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex items-center">
                  <div className="text-green-600 text-lg mr-2">✅</div>
                  <div>
                    <h4 className="font-semibold text-green-800">Entry Created Successfully!</h4>
                    <p className="text-green-700 text-sm">Entry ID: {result.id}</p>
                  </div>
                </div>
              </div>

              {/* Extracted Data Preview */}
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Extracted Health Data:</h4>
                <pre className="bg-gray-50 p-3 rounded text-xs text-gray-700 overflow-x-auto max-h-64 overflow-y-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <Link
                  to="/view-entries"
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  View All Entries
                </Link>
                <button
                  onClick={() => setResult(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
                >
                  Create Another Entry
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">⏳</div>
              <p>Results will appear here after processing</p>
            </div>
          )}
        </div>
      </div>

      {/* Usage Tips */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-800 mb-2">💡 Usage Tips</h4>
        <ul className="text-yellow-700 text-sm space-y-1">
          <li>• Include activities, meals, sleep, mood, and any health metrics</li>
          <li>• Be specific about workout types, durations, and intensities</li>
          <li>• Mention time periods (e.g., "slept 7 hours", "30-minute run")</li>
          <li>• Include ratings for mood, energy, sleep quality (e.g., "mood 8/10")</li>
          <li>• Add any pain, discomfort, or health observations</li>
        </ul>
      </div>
    </div>
  );
} 