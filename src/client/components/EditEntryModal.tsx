import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from '@tanstack/react-router';
import { useUpdateHealthData, useSaveHealthLog, useTranscribeAudio } from '../hooks/useHealthLogs';
import { VoiceUpdateRecorder } from './VoiceUpdateRecorder';
import { StructuredHealthData } from '../../lib/ai';

export function EditEntryScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get data from location state (passed from previous screen)
  const { initialData, transcript, audioUrl } = (location.state as any) || {
    initialData: null,
    transcript: '',
    audioUrl: undefined
  };


  // If no data was passed, redirect back
  if (!initialData) {
    navigate({ to: '/add-entry' });
    return null;
  }
  const [currentData, setCurrentData] = useState<StructuredHealthData>(initialData);
  const [isRecordingUpdate, setIsRecordingUpdate] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const updateHealthData = useUpdateHealthData();
  const saveHealthLog = useSaveHealthLog();
  const transcribeAudio = useTranscribeAudio();

  const handleRecordUpdate = async (updateBlob: Blob) => {
    try {
      setIsRecordingUpdate(false);
      setIsTranscribing(true);
      
      // Transcribe the audio
      console.log('Transcribing audio update...');
      const transcriptionResponse = await transcribeAudio.mutateAsync(updateBlob);
      const updateTranscript = transcriptionResponse.transcript;
      console.log('Transcription result:', updateTranscript);
      
      // Merge with existing data
      console.log('Merging update with existing data...');
      const response = await updateHealthData.mutateAsync({
        originalData: currentData,
        updateTranscript
      });
      
      setCurrentData(response.data);
      console.log('Data merged successfully');
      
    } catch (error) {
      console.error('Failed to process update:', error);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await saveHealthLog.mutateAsync({
        healthData: currentData,
        transcript,
        audioUrl
      });
      
      // Navigate to the view entries screen after successful save
      navigate({ to: '/view-entries' });
    } catch (error) {
      console.error('Failed to save health log:', error);
    }
  };

  const handleCancel = () => {
    navigate({ to: '/add-entry' });
  };

  const isProcessingUpdate = isTranscribing || updateHealthData.isPending;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Navigation Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link to="/add-entry" className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <span className="icon-[mdi-light--chevron-left] w-4 h-4 mr-2"></span>
              Back
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">Review Your Health Entry</h2>
          <p className="text-gray-600 text-sm mt-1">
            Review the extracted data below. You can record voice updates to add or correct information.
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <HealthDataPreview data={currentData} />
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSave}
            disabled={saveHealthLog.isPending || isProcessingUpdate}
            className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
          >
            {saveHealthLog.isPending ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </div>
            ) : (
              '✅ Accept & Save'
            )}
          </button>

          <VoiceUpdateRecorder
            isRecording={isRecordingUpdate}
            onStartRecording={() => setIsRecordingUpdate(true)}
            onStopRecording={() => setIsRecordingUpdate(false)}
            onRecordingComplete={handleRecordUpdate}
            disabled={isProcessingUpdate || saveHealthLog.isPending}
          />

          <button
            onClick={handleCancel}
            disabled={saveHealthLog.isPending || isProcessingUpdate}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 font-semibold disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ❌ Cancel
          </button>
        </div>

        {/* Update Status */}
        {isTranscribing && (
          <div className="p-4 bg-blue-50 border-t border-blue-200">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <div>
                <p className="text-blue-800 font-medium">Transcribing your voice update...</p>
                <p className="text-blue-600 text-sm">Converting speech to text.</p>
              </div>
            </div>
          </div>
        )}

        {updateHealthData.isPending && (
          <div className="p-4 bg-blue-50 border-t border-blue-200">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <div>
                <p className="text-blue-800 font-medium">Processing your update...</p>
                <p className="text-blue-600 text-sm">Merging new information with existing data.</p>
              </div>
            </div>
          </div>
        )}

        {/* Error States */}
        {transcribeAudio.isError && (
          <div className="p-4 bg-red-50 border-t border-red-200">
            <p className="text-red-700 font-medium">Transcription Failed</p>
            <p className="text-red-600 text-sm">{transcribeAudio.error?.message}</p>
          </div>
        )}

        {updateHealthData.isError && (
          <div className="p-4 bg-red-50 border-t border-red-200">
            <p className="text-red-700 font-medium">Update Failed</p>
            <p className="text-red-600 text-sm">{updateHealthData.error?.message}</p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

function HealthDataPreview({ data }: { data: StructuredHealthData }) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Today';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Date */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">{formatDate(data.date)}</h3>
        <p className="text-gray-600 text-sm">Health & Wellness Summary</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Workouts */}
        {data.workouts && data.workouts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <span className="mr-2">💪</span>
              Workouts ({data.workouts.length})
            </h3>
            <div className="space-y-3">
              {data.workouts.map((workout, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  <p className="font-medium text-gray-900">{workout.type}</p>
                  <div className="text-xs text-gray-700 mt-1 space-y-1">
                    {workout.durationMinutes && <p>Duration: {workout.durationMinutes} min</p>}
                    {workout.distanceKm && <p>Distance: {workout.distanceKm} km</p>}
                    {workout.intensity && <p>Intensity: {workout.intensity}/10</p>}
                    {workout.notes && <p>Notes: {workout.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Meals */}
        {data.meals && data.meals.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <span className="mr-2">🍽️</span>
              Meals ({data.meals.length})
            </h3>
            <div className="space-y-2">
              {data.meals.map((meal, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  <p className="font-medium text-gray-900">{meal.type}</p>
                  <p className="text-xs text-gray-700">{meal.notes}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Health Metrics */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <span className="mr-2">📊</span>
            Health Metrics
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {data.waterIntakeLiters && (
              <div className="bg-blue-50 rounded-lg p-2">
                <p className="text-blue-600 font-medium">Water Intake</p>
                <p className="text-blue-800">{data.waterIntakeLiters}L</p>
              </div>
            )}
            {data.screenTimeHours && (
              <div className="bg-orange-50 rounded-lg p-2">
                <p className="text-orange-600 font-medium">Screen Time</p>
                <p className="text-orange-800">{data.screenTimeHours}h</p>
              </div>
            )}
            {data.sleep?.hours && (
              <div className="bg-purple-50 rounded-lg p-2">
                <p className="text-purple-600 font-medium">Sleep</p>
                <p className="text-purple-800">{data.sleep.hours}h</p>
              </div>
            )}
            {data.sleep?.quality && (
              <div className="bg-purple-50 rounded-lg p-2">
                <p className="text-purple-600 font-medium">Sleep Quality</p>
                <p className="text-purple-800">{data.sleep.quality}/10</p>
              </div>
            )}
            {data.energyLevel && (
              <div className="bg-yellow-50 rounded-lg p-2">
                <p className="text-yellow-600 font-medium">Energy Level</p>
                <p className="text-yellow-800">{data.energyLevel}/10</p>
              </div>
            )}
            {data.mood?.rating && (
              <div className="bg-pink-50 rounded-lg p-2">
                <p className="text-pink-600 font-medium">Mood</p>
                <p className="text-pink-800">{data.mood.rating}/10</p>
              </div>
            )}
            {data.weightKg && (
              <div className="bg-green-50 rounded-lg p-2">
                <p className="text-green-600 font-medium">Weight</p>
                <p className="text-green-800">{data.weightKg}kg</p>
              </div>
            )}
          </div>
        </div>

        {/* Pain/Discomfort & Other */}
        <div className="space-y-4">
          {data.painDiscomfort && (data.painDiscomfort.location || data.painDiscomfort.intensity || data.painDiscomfort.notes) && (
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <span className="mr-2">🩹</span>
                Pain/Discomfort
              </h3>
              <div className="bg-red-50 rounded-lg p-3 text-xs">
                {data.painDiscomfort.location && <p className="text-red-800">Location: {data.painDiscomfort.location}</p>}
                {data.painDiscomfort.intensity && <p className="text-red-800">Intensity: {data.painDiscomfort.intensity}/10</p>}
                {data.painDiscomfort.notes && <p className="text-red-700 mt-1">{data.painDiscomfort.notes}</p>}
              </div>
            </div>
          )}

          {(data.otherActivities || data.notes) && (
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <span className="mr-2">📝</span>
                Other Notes
              </h3>
              <div className="space-y-2 text-xs">
                {data.otherActivities && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="font-medium text-gray-900">Activities</p>
                    <p className="text-gray-700">{data.otherActivities}</p>
                  </div>
                )}
                {data.notes && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="font-medium text-gray-900">General Notes</p>
                    <p className="text-gray-700">{data.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 