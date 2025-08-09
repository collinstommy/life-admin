import React, { useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { useHealthLogs, useDeleteHealthLog } from '../hooks/useHealthLogs';
import { ConfirmDialog } from './ConfirmDialog';
import { StructuredHealthData } from '../../lib/ai';

interface HealthLogWithData {
  id: number;
  date: string;
  audioUrl: string | null;
  transcript: string | null;
  healthData: StructuredHealthData;
  createdAt: number;
  updatedAt: number;
}

function HealthDataDisplay({ data }: { data: StructuredHealthData }) {
  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Energy Level */}
        {data.energyLevel && (
          <div className="rounded-2xl p-6 text-white energy-gradient shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Energy</p>
                <p className="text-3xl font-bold">{data.energyLevel}/10</p>
              </div>
              <span className="text-3xl">⚡</span>
            </div>
            <div className="mt-3">
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-white rounded-full h-2" 
                  style={{ width: `${(data.energyLevel / 10) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Mood */}
        {data.mood?.rating && (
          <div className="rounded-2xl p-6 text-white mood-gradient shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Mood</p>
                <p className="text-3xl font-bold">{data.mood.rating}/10</p>
              </div>
              <span className="text-3xl">😊</span>
            </div>
            <div className="mt-3">
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-white rounded-full h-2" 
                  style={{ width: `${(data.mood.rating / 10) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Sleep */}
        {data.sleep?.hours && (
          <div className="rounded-2xl p-6 text-white sleep-gradient shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Sleep</p>
                <p className="text-3xl font-bold">{data.sleep.hours}h</p>
              </div>
              <span className="text-3xl">😴</span>
            </div>
            <div className="mt-3">
              {data.sleep.quality && (
                <p className="text-xs opacity-90">Quality: {data.sleep.quality}/10</p>
              )}
            </div>
          </div>
        )}

        {/* Weight */}
        {data.weightKg && (
          <div className="rounded-2xl p-6 text-white weight-gradient shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Weight</p>
                <p className="text-3xl font-bold">{data.weightKg}kg</p>
              </div>
              <span className="text-3xl">⚖️</span>
            </div>
            <div className="mt-3">
              <p className="text-xs opacity-90">Stable</p>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column - Workouts & Meals */}
        <div className="space-y-6">
          
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
                {data.workouts.map((workout, index) => (
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
                {data.meals.map((meal, index) => (
                  <div key={index} className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4">
                    <h4 className="font-semibold text-slate-900 mb-1">{meal.type}</h4>
                    {meal.notes && <p className="text-sm text-slate-600">{meal.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Additional Details */}
        <div className="space-y-6">
          
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
    </div>
  );
}

export function SingleEntryScreen() {
  const { id } = useParams({ strict: false });
  const { data: logs, isLoading, error } = useHealthLogs();
  const deleteHealthLog = useDeleteHealthLog();
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; logId: string; logDate: string }>({
    show: false,
    logId: '',
    logDate: ''
  });

  // Cast as any because the server transforms structuredData to healthData in the API response
  const log = logs?.find((log: any) => log.id === Number(id));

  const handleDelete = async (logId: string) => {
    try {
      await deleteHealthLog.mutateAsync(logId);
      setDeleteConfirm({ show: false, logId: '', logDate: '' });
      // Navigate back to entries list after deletion
      window.history.back();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        {/* Navigation Header */}
        <div className="glass-card sticky top-0 z-50 border-b border-slate-200/50 rounded-b-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/view-entries" className="p-2 rounded-lg hover:bg-slate-100/50 transition-colors">
                <span className="icon-[mdi-light--chevron-left] w-5 h-5 text-slate-600"></span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-slate-600">Loading entry...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        {/* Navigation Header */}
        <div className="glass-card sticky top-0 z-50 border-b border-slate-200/50 rounded-b-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/view-entries" className="p-2 rounded-lg hover:bg-slate-100/50 transition-colors">
                <span className="icon-[mdi-light--chevron-left] w-5 h-5 text-slate-600"></span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="glass-card rounded-2xl p-8 text-center border-red-200">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="icon-[mdi--alert] w-10 h-10 text-red-600"></span>
            </div>
            <h3 className="text-xl font-semibold text-red-900 mb-2">Error Loading Entry</h3>
            <p className="text-red-700">{error instanceof Error ? error.message : 'Failed to load health entry'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!log) {
    return (
      <div className="bg-gray-50 min-h-screen">
        {/* Navigation Header */}
        <div className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <Link to="/view-entries" className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <span className="icon-[mdi-light--chevron-left] w-4 h-4 mr-2"></span>
                <span className="hidden sm:inline">Back to Entries</span>
                <span className="sm:hidden">Back</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-yellow-50 rounded-xl shadow-sm p-6 text-center">
            <div className="text-yellow-600 text-xl mb-2">🔍</div>
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Entry Not Found</h3>
            <p className="text-yellow-700">The requested health entry could not be found. It may have been deleted or the link is incorrect.</p>
            <Link 
              to="/view-entries" 
              className="inline-block mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              View All Entries
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const logDate = formatDate(log.date);

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Navigation Header */}
      <div className="glass-card sticky top-0 z-50 border-b border-slate-200/50 rounded-b-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link to="/view-entries" className="p-2 rounded-lg hover:bg-slate-100/50 transition-colors">
                <span className="icon-[mdi--chevron-left] w-5 h-5 text-slate-600"></span>
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">Health Entry</h1>
                <p className="text-sm text-slate-500">{logDate}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Link
                to="/edit-entry/$id"
                params={{ id: log.id.toString() }}
                className="btn btn-ghost btn-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                title="Edit entry"
              >
                <span className="icon-[mdi--pencil] w-5 h-5"></span>
                <span className="hidden sm:inline ml-1">Edit</span>
              </Link>
              
              <button
                onClick={() => setDeleteConfirm({ show: true, logId: log.id.toString(), logDate })}
                className="btn btn-ghost btn-sm text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Delete entry"
              >
                <span className="icon-[mdi--delete] w-5 h-5"></span>
                <span className="hidden sm:inline ml-1">Delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Entry Summary */}
        <div className="glass-card rounded-2xl p-6 mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl icon-[mdi--chart-line]"></span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Daily Health Summary</h2>
              <p className="text-slate-600">{logDate} • {new Date(log.createdAt * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
          {log.transcript && (
            <p className="text-slate-700 text-lg">{log.transcript.substring(0, 150)}{log.transcript.length > 150 ? '...' : ''}</p>
          )}
        </div>

        {/* Health Data */}
        <HealthDataDisplay data={(log as any).healthData} />

        {/* Original Transcript */}
        {log.transcript && (
          <div className="glass-card rounded-2xl p-6 mt-8">
            <details className="group">
              <summary className="cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-xl flex items-center justify-center">
                      <span className="text-white icon-[mdi--microphone]"></span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">Original Voice Recording</h3>
                      <p className="text-sm text-slate-600">Click to view the full transcript</p>
                    </div>
                  </div>
                  <span className="icon-[mdi-light--chevron-down] w-5 h-5 text-slate-400 transform transition-transform group-open:rotate-180"></span>
                </div>
              </summary>
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-slate-700 leading-relaxed">{log.transcript}</p>
                </div>
              </div>
            </details>
          </div>
        )}

        {/* Audio Player */}
        {log.audioUrl && (
          <div className="glass-card rounded-2xl p-6 mt-8">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                <span className="text-white icon-[mdi--play]"></span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-slate-900">Original Recording</h4>
                <p className="text-sm text-slate-600">Click to play audio recording</p>
              </div>
              <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                <span className="icon-[mdi--play] w-5 h-5"></span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.show}
        title="Delete Health Entry"
        message={`Are you sure you want to delete the health entry from ${deleteConfirm.logDate}? This action cannot be undone.`}
        onConfirm={() => handleDelete(deleteConfirm.logId)}
        onCancel={() => setDeleteConfirm({ show: false, logId: '', logDate: '' })}
        isLoading={deleteHealthLog.isPending}
      />
    </div>
  );
}