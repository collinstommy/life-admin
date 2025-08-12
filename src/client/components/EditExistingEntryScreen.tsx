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
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-slate-600">Loading entry...</span>
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
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Navigation Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/view-entries" className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
              </svg>
              <span className="text-sm font-medium">Back to Entries</span>
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Edit Health Entry</h1>
              <p className="text-sm text-slate-500">{formatDate(processedEntry.date)}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="glass-card rounded-2xl overflow-hidden">
          {/* Content */}
          <div className="p-6">
            <HealthDataPreview data={currentData} />
          </div>

          {/* Text Update Input */}
          <div className="p-6 border-t border-slate-200/50">
            <TextUpdateInput
              onSubmit={handleTextUpdate}
              onCancel={() => {}}
              isProcessing={isProcessingTextUpdate}
              disabled={updateExistingEntry.isPending || isRecordingUpdate}
            />
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-slate-200/50 bg-slate-50/50 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSave}
              disabled={updateExistingEntry.isPending || isProcessingUpdate || !canSave}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-slate-400 disabled:to-slate-500 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 disabled:cursor-not-allowed"
            >
              {updateExistingEntry.isPending ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </div>
              ) : (
                'Save Changes'
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
              className="px-6 py-3 text-slate-600 hover:text-slate-800 font-semibold disabled:opacity-50 disabled:cursor-not-allowed border border-slate-300 rounded-xl hover:bg-white/50 transition-all duration-200"
            >
              Cancel
            </button>
          </div>

          {/* Update Status */}
          {isTranscribing && (
            <div className="p-4 bg-blue-50/80 backdrop-blur-sm border-t border-blue-200/50">
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
            <div className="p-4 bg-blue-50/80 backdrop-blur-sm border-t border-blue-200/50">
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
            <div className="p-4 bg-blue-50/80 backdrop-blur-sm border-t border-blue-200/50">
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
            <div className="p-4 bg-red-50/80 backdrop-blur-sm border-t border-red-200/50">
              <p className="text-red-700 font-medium">Transcription Failed</p>
              <p className="text-red-600 text-sm">{transcribeAudio.error?.message}</p>
            </div>
          )}

          {updateHealthData.isError && (
            <div className="p-4 bg-red-50/80 backdrop-blur-sm border-t border-red-200/50">
              <p className="text-red-700 font-medium">Update Failed</p>
              <p className="text-red-600 text-sm">{updateHealthData.error?.message}</p>
            </div>
          )}

          {updateExistingEntry.isError && (
            <div className="p-4 bg-red-50/80 backdrop-blur-sm border-t border-red-200/50">
              <p className="text-red-700 font-medium">Save Failed</p>
              <p className="text-red-600 text-sm">{updateExistingEntry.error?.message}</p>
            </div>
          )}

          {/* Instructions */}
          {!canSave && (
            <div className="p-4 bg-yellow-50/80 backdrop-blur-sm border-t border-yellow-200/50">
              <p className="text-yellow-800 text-sm">
                Use voice recording or text updates to modify this entry. 
                Examples: "Change my mood to 8", "I also had a snack", "Actually, my workout was 45 minutes"
              </p>
            </div>
          )}
        </div>
      </main>
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
        <h3 className="text-2xl font-bold text-slate-900">{formatDate(data.date)}</h3>
        <p className="text-slate-600 text-sm">Health & Wellness Summary</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Workouts */}
        {data.workouts && data.workouts.length > 0 && (
          <div className="glass-card rounded-2xl p-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">🏋️</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900">Workouts</h3>
              <span className="text-sm text-slate-500">{data.workouts.length} activity{data.workouts.length !== 1 ? 'ies' : ''}</span>
            </div>
            <div className="space-y-3">
              {data.workouts.map((workout: any, index: number) => (
                <div key={index} className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-slate-900">{workout.type}</h4>
                    <span className="text-sm text-red-600 font-medium">{workout.durationMinutes} min</span>
                  </div>
                  {workout.notes && (
                    <p className="text-sm text-slate-600 mb-2">{workout.notes}</p>
                  )}
                  <div className="flex items-center space-x-4 text-sm text-slate-500">
                    {workout.distanceKm && (
                      <span>{workout.distanceKm}km</span>
                    )}
                    {workout.distanceKm && workout.intensity && <span className="text-slate-400">•</span>}
                    {workout.intensity && (
                      <span>Intensity: {workout.intensity}/10</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Meals */}
        {data.meals && data.meals.length > 0 && (
          <div className="glass-card rounded-2xl p-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">🍽️</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900">Meals</h3>
              <span className="text-sm text-slate-500">{data.meals.length} meal{data.meals.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-3">
              {data.meals.map((meal: any, index: number) => (
                <div key={index} className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4">
                  <h4 className="font-semibold text-slate-900 mb-1">{meal.type}</h4>
                  {meal.notes && <p className="text-sm text-slate-600">{meal.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Health Metrics */}
        <div className="glass-card rounded-2xl p-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">📊</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-900">Health Metrics</h3>
          </div>
          <div className="space-y-3">
            {data.waterIntakeLiters && (
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
                <span className="text-sm font-medium text-blue-900">Water Intake</span>
                <span className="text-sm text-blue-700 font-medium">{data.waterIntakeLiters}L</span>
              </div>
            )}
            {data.screenTimeHours && (
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-xl">
                <span className="text-sm font-medium text-orange-900">Screen Time</span>
                <span className="text-sm text-orange-700 font-medium">{data.screenTimeHours}h</span>
              </div>
            )}
            {data.sleep?.quality && (
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-xl">
                <span className="text-sm font-medium text-purple-900">Sleep Quality</span>
                <span className="text-sm text-purple-700 font-medium">{data.sleep.quality}/10</span>
              </div>
            )}
            {data.energyLevel && (
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-xl">
                <span className="text-sm font-medium text-yellow-900">Energy Level</span>
                <span className="text-sm text-yellow-700 font-medium">{data.energyLevel}/10</span>
              </div>
            )}
            {data.mood?.rating && (
              <div className="flex justify-between items-center p-3 bg-pink-50 rounded-xl">
                <span className="text-sm font-medium text-pink-900">Mood</span>
                <span className="text-sm text-pink-700 font-medium">{data.mood.rating}/10</span>
              </div>
            )}
            {data.weightKg && (
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                <span className="text-sm font-medium text-green-900">Weight</span>
                <span className="text-sm text-green-700 font-medium">{data.weightKg}kg</span>
              </div>
            )}
          </div>
        </div>

        {/* Additional Notes */}
        {(data.otherActivities || data.notes || data.painDiscomfort) && (
          <div className="glass-card rounded-2xl p-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">📝</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900">Additional Notes</h3>
            </div>
            
            <div className="space-y-3">
              {data.otherActivities && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-medium text-slate-900 mb-2">Other Activities</h4>
                  <p className="text-sm text-slate-600">{data.otherActivities}</p>
                </div>
              )}
              {data.notes && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-medium text-slate-900 mb-2">General Notes</h4>
                  <p className="text-sm text-slate-600">{data.notes}</p>
                </div>
              )}
              {data.painDiscomfort && (
                <div className="bg-red-50 rounded-xl p-4">
                  <h4 className="font-medium text-red-900 mb-2">Pain/Discomfort</h4>
                  <p className="text-sm text-red-700 mb-1">
                    {data.painDiscomfort.location} - Level {data.painDiscomfort.intensity}/5
                  </p>
                  {data.painDiscomfort.notes && (
                    <p className="text-sm text-red-600">{data.painDiscomfort.notes}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 