import React, { useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { useHealthLogs, useDeleteHealthLog } from '../hooks/useHealthLogs';
import { ConfirmDialog } from './ConfirmDialog';
import { HealthLog as DBHealthLog, HealthLog } from '../../db/schema';

interface HealthData {
  date: string;
  screenTimeHours: number | null;
  workouts: Array<{
    type: string;
    durationMinutes: number;
    distanceKm?: number;
    intensity: number;
    notes?: string;
  }>;
  meals: Array<{
    type: string;
    notes: string;
  }>;
  waterIntakeLiters: number | null;
  painDiscomfort?: {
    location: string | null;
    intensity: number | null;
    notes: string | null;
  };
  sleep: {
    hours: number | null;
    quality: number | null;
  };
  energyLevel: number | null;
  mood: {
    rating: number | null;
    notes: string | null;
  };
  weightKg: number | null;
  otherActivities: string | null;
  notes: string | null;
}

interface HealthLogWithData {
  id: number;
  date: string;
  audioUrl: string | null;
  transcript: string | null;
  healthData: HealthData;
  createdAt: number;
  updatedAt: number;
}

function HealthDataDisplay({ data }: { data: HealthData }) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatRating = (rating: number | null, max: number = 10) => {
    if (rating === null) return 'Not recorded';
    return `${rating}/${max}`;
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {data.energyLevel !== null && (
          <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-4 rounded-xl shadow-sm text-white transform hover:scale-105 transition-transform">
            <div className="text-2xl font-bold mb-1">{data.energyLevel}<span className="text-lg text-emerald-100">/10</span></div>
            <div className="text-emerald-100 text-xs font-medium">Energy Level</div>
          </div>
        )}
        {data.mood.rating !== null && (
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-4 rounded-xl shadow-sm text-white transform hover:scale-105 transition-transform">
            <div className="text-2xl font-bold mb-1">{data.mood.rating}<span className="text-lg text-amber-100">/10</span></div>
            <div className="text-amber-100 text-xs font-medium">Mood</div>
          </div>
        )}
        {data.sleep.hours !== null && (
          <div className="bg-gradient-to-br from-purple-400 to-purple-600 p-4 rounded-xl shadow-sm text-white transform hover:scale-105 transition-transform">
            <div className="text-2xl font-bold mb-1">{data.sleep.hours}<span className="text-lg text-purple-100">h</span></div>
            <div className="text-purple-100 text-xs font-medium">Sleep</div>
          </div>
        )}
        {data.weightKg !== null && (
          <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-4 rounded-xl shadow-sm text-white transform hover:scale-105 transition-transform">
            <div className="text-2xl font-bold mb-1">{data.weightKg}<span className="text-lg text-blue-100">kg</span></div>
            <div className="text-blue-100 text-xs font-medium">Weight</div>
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Workouts */}
        {data.workouts && data.workouts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 pb-3">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-blue-600 text-sm">🏋️</span>
                </div>
                <h3 className="font-semibold text-gray-900">Workouts</h3>
              </div>
              
              <div className="space-y-2">
                {data.workouts.map((workout, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">{workout.type}</h4>
                      <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-md">
                        {workout.intensity}/10
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>
                        {workout.durationMinutes} min
                        {workout.distanceKm && ` • ${workout.distanceKm} km`}
                        {` • Intensity ${workout.intensity}/10`}
                      </div>
                      {workout.notes && (
                        <p className="text-gray-500">{workout.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Meals */}
        {data.meals && data.meals.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 pb-3">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-green-600 text-sm">🍽️</span>
                </div>
                <h3 className="font-semibold text-gray-900">Meals</h3>
              </div>
              
              <div className="space-y-2">
                {data.meals.map((meal, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 text-sm">{meal.type}</span>
                    </div>
                    <p className="text-xs text-gray-600">{meal.notes}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sleep & Recovery */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 pb-3">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-purple-600 text-sm">😴</span>
              </div>
              <h3 className="font-semibold text-gray-900">Sleep & Recovery</h3>
            </div>
            
            <div className="space-y-3">
              {(data.sleep.hours !== null || data.sleep.quality !== null) && (
                <div className="grid grid-cols-2 gap-3">
                  {data.sleep.hours !== null && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900">{data.sleep.hours}h</div>
                      <div className="text-xs text-gray-600">Duration</div>
                    </div>
                  )}
                  {data.sleep.quality !== null && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900">{data.sleep.quality}/10</div>
                      <div className="text-xs text-gray-600">Quality</div>
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-2">
                {data.waterIntakeLiters !== null && (
                  <div className="flex justify-between py-1">
                    <span className="text-xs font-medium text-gray-700">Water Intake</span>
                    <span className="text-xs text-gray-900">{data.waterIntakeLiters}L</span>
                  </div>
                )}
                {data.screenTimeHours !== null && (
                  <div className="flex justify-between py-1">
                    <span className="text-xs font-medium text-gray-700">Screen Time</span>
                    <span className="text-xs text-gray-900">{data.screenTimeHours}h</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Health Notes */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 pb-3">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-cyan-600 text-sm">💊</span>
              </div>
              <h3 className="font-semibold text-gray-900">Health Notes</h3>
            </div>
            
            <div className="space-y-3">
              {data.mood.notes && (
                <div className="bg-cyan-50 rounded-lg p-3">
                  <div className="flex items-center mb-2">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full mr-2"></span>
                    <span className="text-xs font-medium text-cyan-800">Mood</span>
                  </div>
                  <p className="text-xs text-cyan-700">{data.mood.notes}</p>
                </div>
              )}
              
              {data.painDiscomfort && (data.painDiscomfort.location || data.painDiscomfort.intensity) && (
                <div className="bg-red-50 rounded-lg p-3">
                  <div className="flex items-center mb-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    <span className="text-xs font-medium text-red-800">Pain/Discomfort</span>
                  </div>
                  <p className="text-xs text-red-700">
                    {data.painDiscomfort.location && `${data.painDiscomfort.location}`}
                    {data.painDiscomfort.intensity && ` (${data.painDiscomfort.intensity}/10)`}
                  </p>
                  {data.painDiscomfort.notes && (
                    <p className="text-xs text-red-600 mt-1">{data.painDiscomfort.notes}</p>
                  )}
                </div>
              )}
              
              {data.energyLevel !== null && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs font-medium text-gray-700">Energy Level</span>
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{width: `${(data.energyLevel / 10) * 100}%`}}></div>
                    </div>
                    <span className="text-xs text-gray-900">{data.energyLevel}/10</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Notes */}
      {(data.otherActivities || data.notes) && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 pb-3">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-gray-600 text-sm">📝</span>
              </div>
              <h3 className="font-semibold text-gray-900">Additional Notes</h3>
            </div>
            
            <div className="space-y-3">
              {data.otherActivities && (
                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-1">Other Activities</h4>
                  <p className="text-xs text-gray-600">{data.otherActivities}</p>
                </div>
              )}
              {data.notes && (
                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-1">General Notes</h4>
                  <p className="text-xs text-gray-600">{data.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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

  console.log('logs', logs);

  // Cast as any because the server transforms structuredData to healthData in the API response
  const log = logs?.find((log: any) => log.id === Number(id));

  console.log('log', log);
  console.log('id', id);

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
      <div className="bg-gray-50 min-h-screen">
        {/* Navigation Header */}
        <div className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <Link to="/view-entries" className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                <span className="hidden sm:inline">Back to Entries</span>
                <span className="sm:hidden">Back</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading entry...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen">
        {/* Navigation Header */}
        <div className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <Link to="/view-entries" className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                <span className="hidden sm:inline">Back to Entries</span>
                <span className="sm:hidden">Back</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-red-50 rounded-xl shadow-sm p-6 text-center">
            <div className="text-red-600 text-xl mb-2">⚠️</div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Entry</h3>
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
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
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
    <div className="bg-gray-50 min-h-screen">
      {/* Navigation Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Back Button */}
            <Link to="/view-entries" className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
              <span className="hidden sm:inline">Back to Entries</span>
              <span className="sm:hidden">Back</span>
            </Link>
            
            {/* Delete Button */}
            <button
              onClick={() => setDeleteConfirm({ show: true, logId: log.id.toString(), logDate })}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{logDate}</h1>
          <p className="text-gray-600 text-sm">Health & Wellness Summary</p>
        </div>

        {/* Health Data */}
        <HealthDataDisplay data={(log as any).healthData} />
        
        {/* Original Transcript */}
        {log.transcript && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mt-6">
            <details className="group">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-blue-600 text-sm">🎤</span>
                    </div>
                    <h3 className="font-semibold text-gray-900">Original Voice Recording</h3>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </summary>
              <div className="px-4 pb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {log.transcript}
                  </p>
                </div>
              </div>
            </details>
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