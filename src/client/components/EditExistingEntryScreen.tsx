import React, { useState } from 'react';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { useUpdateHealthData, useTranscribeAudio, useUpdateExistingEntry, useHealthLogs } from '../hooks/useHealthLogs';
import { VoiceUpdateRecorder } from './VoiceUpdateRecorder';
import { TextUpdateInput } from './TextUpdateInput';
import { StructuredHealthData } from '../../lib/ai';

interface HealthLogEntry {
  id: number;
  date: string;
  transcript: string;
  structuredData?: string | StructuredHealthData;
  workouts?: any[];
  meals?: any[];
  painDiscomfort?: any;
  healthData?: StructuredHealthData;
  createdAt?: number;
  updatedAt?: number;
  audioUrl?: string;
}

export function EditExistingEntryScreen() {
  const navigate = useNavigate();
  const { id } = useParams({ strict: false });
  const { data: logs, isLoading } = useHealthLogs();
  
  // Find the entry by ID and ensure transcript is not null
  const entry = logs?.find(log => log.id.toString() === id);
  const processedEntry = entry ? {
    ...entry,
    transcript: entry.transcript || ''
  } as HealthLogEntry : null;

  // If entry not found and not loading, redirect
  if (!isLoading && !processedEntry) {
    navigate({ to: '/view-entries' });
    return null;
  }

  // Show loading while fetching data
  if (isLoading || !processedEntry) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading entry...</span>
      </div>
    );
  }
  
  // Parse the entry data
  const parseEntryData = (entry: HealthLogEntry): StructuredHealthData => {
    // First check if we have healthData directly (from server response)
    if (entry.healthData && typeof entry.healthData === 'object') {
      return entry.healthData;
    }
    
    // If structuredData is a string, parse it
    if (typeof entry.structuredData === 'string') {
      try {
        return JSON.parse(entry.structuredData);
      } catch {
        // Fallback: return a basic structure
        return {
          date: entry.date || null,
          screenTimeHours: null,
          workouts: [],
          meals: [],
          waterIntakeLiters: null,
          painDiscomfort: undefined,
          sleep: {
            hours: null,
            quality: null,
          },
          energyLevel: null,
          mood: {
            rating: null,
            notes: null,
          },
          weightKg: null,
          otherActivities: null,
          notes: null,
        };
      }
    }
    
    // If structuredData is already an object, use it directly
    if (entry.structuredData && typeof entry.structuredData === 'object') {
      return entry.structuredData;
    }
    
    // Final fallback
    return {
      date: entry.date || null,
      screenTimeHours: null,
      workouts: [],
      meals: [],
      waterIntakeLiters: null,
      painDiscomfort: undefined,
      sleep: {
        hours: null,
        quality: null,
      },
      energyLevel: null,
      mood: {
        rating: null,
        notes: null,
      },
      weightKg: null,
      otherActivities: null,
      notes: null,
    };
  };

  const [currentData, setCurrentData] = useState<StructuredHealthData>(() => parseEntryData(processedEntry));
  const [isRecordingUpdate, setIsRecordingUpdate] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isProcessingTextUpdate, setIsProcessingTextUpdate] = useState(false);
  const [updateTranscript, setUpdateTranscript] = useState<string>('');
  
  const updateHealthData = useUpdateHealthData();
  const transcribeAudio = useTranscribeAudio();
  const updateExistingEntry = useUpdateExistingEntry();

  const handleRecordUpdate = async (updateBlob: Blob) => {
    try {
      setIsRecordingUpdate(false);
      setIsTranscribing(true);
      
      // Transcribe the audio
      console.log('Transcribing audio update...');
      const transcriptionResponse = await transcribeAudio.mutateAsync(updateBlob);
      const voiceUpdate = transcriptionResponse.transcript;
      console.log('Transcription result:', voiceUpdate);
      setUpdateTranscript(voiceUpdate);
      
      // Merge with existing data
      console.log('Merging update with existing data...');
      const response = await updateHealthData.mutateAsync({
        originalData: currentData,
        updateTranscript: voiceUpdate
      });
      
      setCurrentData(response.data);
      console.log('Data merged successfully');
      
    } catch (error) {
      console.error('Failed to process update:', error);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleTextUpdate = async (text: string) => {
    try {
      setIsProcessingTextUpdate(true);
      setUpdateTranscript(text);
      
      console.log('Processing text update...');
      const response = await updateHealthData.mutateAsync({
        originalData: currentData,
        updateTranscript: text
      });
      
      setCurrentData(response.data);
      setIsProcessingTextUpdate(false);
      console.log('Text update processed successfully');
      
    } catch (error) {
      console.error('Failed to process text update:', error);
      setIsProcessingTextUpdate(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!updateTranscript) {
        console.error('No update transcript available');
        return;
      }

      await updateExistingEntry.mutateAsync({
        id: processedEntry.id.toString(),
        healthData: currentData,
        updateTranscript: updateTranscript
      });
      
      // Navigate back to view entries after successful save
      navigate({ to: '/view-entries' });
    } catch (error) {
      console.error('Failed to save updated health log:', error);
    }
  };

  const handleCancel = () => {
    navigate({ to: '/view-entries' });
  };

  const isProcessingUpdate = isTranscribing || updateHealthData.isPending || isProcessingTextUpdate;
  const canSave = updateTranscript.length > 0;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Unknown Date';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Navigation Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link to="/view-entries" className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <span className="icon-[mdi-light--chevron-left] w-4 h-4 mr-2"></span>
              Back to Entries
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900">Edit Health Entry</h2>
            <p className="text-gray-600 text-sm mt-1">
              {formatDate(processedEntry.date)} - Record voice or text updates to modify this entry
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            <HealthDataPreview data={currentData} />
          </div>

          {/* Text Update Input */}
          <div className="p-6 border-t border-gray-200">
            <TextUpdateInput
              onSubmit={handleTextUpdate}
              onCancel={() => {}}
              isProcessing={isProcessingTextUpdate}
              disabled={updateExistingEntry.isPending || isRecordingUpdate}
            />
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSave}
              disabled={updateExistingEntry.isPending || isProcessingUpdate || !canSave}
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
            >
              {updateExistingEntry.isPending ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </div>
              ) : (
                '✅ Save Changes'
              )}
            </button>

            <VoiceUpdateRecorder
              isRecording={isRecordingUpdate}
              onStartRecording={() => setIsRecordingUpdate(true)}
              onStopRecording={() => setIsRecordingUpdate(false)}
              onRecordingComplete={handleRecordUpdate}
              disabled={isProcessingUpdate || updateExistingEntry.isPending}
            />

            <button
              onClick={handleCancel}
              disabled={updateExistingEntry.isPending || isProcessingUpdate}
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

          {isProcessingTextUpdate && (
            <div className="p-4 bg-blue-50 border-t border-blue-200">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <div>
                  <p className="text-blue-800 font-medium">Processing your text update...</p>
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

          {updateExistingEntry.isError && (
            <div className="p-4 bg-red-50 border-t border-red-200">
              <p className="text-red-700 font-medium">Save Failed</p>
              <p className="text-red-600 text-sm">{updateExistingEntry.error?.message}</p>
            </div>
          )}

          {/* Instructions */}
          {!canSave && (
            <div className="p-4 bg-yellow-50 border-t border-yellow-200">
              <p className="text-yellow-800 text-sm">
                Click "🎤 Record Update" for voice changes or "✏️ Text Update" for text changes to modify this entry. 
                Examples: "Change my mood to 8", "I also had a snack", "Actually, my workout was 45 minutes"
              </p>
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
              {data.workouts.map((workout: any, index: number) => (
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
              {data.meals.map((meal: any, index: number) => (
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