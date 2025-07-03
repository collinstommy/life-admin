import React, { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useExtractHealthData } from '../hooks/useHealthLogs';
import { EditEntryModal } from './EditEntryModal';

export function ManualEntryScreen() {
  const [transcript, setTranscript] = useState('');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const extractHealthData = useExtractHealthData();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transcript.trim()) {
      alert('Please enter a transcript to process');
      return;
    }

    try {
      const response = await extractHealthData.mutateAsync(transcript.trim());
      setExtractedData(response.data);
      setShowEditModal(true);
    } catch (error) {
      console.error('Failed to extract health data:', error);
    }
  };

  const handleSaveEntry = (id: string) => {
    setShowEditModal(false);
    setTranscript(''); // Clear the textarea after successful save
    setExtractedData(null);
    // Navigate back to home or show success message
    navigate({ to: '/' });
  };

  const handleCancelEntry = () => {
    setShowEditModal(false);
    setExtractedData(null);
    // Keep the transcript so user can modify and try again
  };

  const handleClear = () => {
    setTranscript('');
    setExtractedData(null);
    setShowEditModal(false);
  };

  return (
    <>
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
              and you can review it before saving.
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
                  disabled={extractHealthData.isPending || !transcript.trim()}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed"
                >
                  {extractHealthData.isPending ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    'Extract & Review Data'
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={extractHealthData.isPending}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear
                </button>
              </div>
            </form>

            {/* Error Display */}
            {extractHealthData.isError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 font-medium text-sm">Extraction Failed</p>
                <p className="text-red-600 text-xs mt-1">
                  {extractHealthData.error?.message || 'Unknown error occurred'}
                </p>
              </div>
            )}
          </div>

          {/* Instructions Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              💡 Tips for Better Results
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Workouts</h4>
                <p>Mention type, duration, intensity: "30-minute run, intensity 7/10"</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Meals</h4>
                <p>Describe breakfast, lunch, dinner, snacks: "Had oatmeal for breakfast"</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Sleep & Wellness</h4>
                <p>Include hours and quality: "Slept 7 hours, quality 8/10"</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Measurements</h4>
                <p>Water intake, screen time, weight: "Drank 2 liters of water"</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Mood & Energy</h4>
                <p>Rate on a scale: "Feeling energetic, mood 9/10"</p>
              </div>
            </div>

            <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-700 text-xs">
                <strong>New Feature:</strong> After extraction, you'll see a review screen where you can 
                record additional voice updates to add or correct information before saving.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && extractedData && (
        <EditEntryModal
          isOpen={showEditModal}
          initialData={extractedData}
          transcript={transcript}
          onSave={handleSaveEntry}
          onCancel={handleCancelEntry}
        />
      )}
    </>
  );
} 