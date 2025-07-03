import React, { useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { useHealthLogs, useDeleteHealthLog } from '../hooks/useHealthLogs';
import { ConfirmDialog } from './ConfirmDialog';
import { HealthLog as DBHealthLog, HealthLog } from '../../db/schema';
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Energy Level */}
        {data.energyLevel && (
          <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-90">Energy</p>
                <p className="text-lg font-bold">{data.energyLevel}/10</p>
              </div>
              <span className="text-xl">⚡</span>
            </div>
          </div>
        )}

        {/* Mood */}
        {data.mood.rating && (
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-90">Mood</p>
                <p className="text-lg font-bold">{data.mood.rating}/10</p>
              </div>
              <span className="text-xl">😊</span>
            </div>
          </div>
        )}

        {/* Sleep */}
        {data.sleep.hours && (
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-90">Sleep</p>
                <p className="text-lg font-bold">{data.sleep.hours}h</p>
              </div>
              <span className="text-xl">😴</span>
            </div>
          </div>
        )}

        {/* Weight */}
        {data.weightKg && (
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-90">Weight</p>
                <p className="text-lg font-bold">{data.weightKg}kg</p>
              </div>
              <span className="text-xl">⚖️</span>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Sections */}
      <div className="grid gap-4">
        {/* Workouts */}
        {data.workouts && data.workouts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <span className="mr-2">🏋️</span>
              Workouts ({data.workouts.length})
            </h3>
            <div className="space-y-2">
              {data.workouts.map((workout, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{workout.type}</p>
                      <p className="text-xs text-gray-600">
                        {workout.durationMinutes} min
                        {workout.distanceKm && ` • ${workout.distanceKm}km`}
                        {workout.intensity && ` • Intensity: ${workout.intensity}/10`}
                      </p>
                    </div>
                  </div>
                  {workout.notes && (
                    <p className="text-xs text-gray-700 mt-2">{workout.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Meals */}
        {data.meals && data.meals.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
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
        <div className="bg-white rounded-xl shadow-sm p-4">
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
            {data.sleep.quality && (
              <div className="bg-purple-50 rounded-lg p-2">
                <p className="text-purple-600 font-medium">Sleep Quality</p>
                <p className="text-purple-800">{data.sleep.quality}/10</p>
              </div>
            )}
          </div>
        </div>

        {/* Pain/Discomfort */}
        {data.painDiscomfort && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <span className="mr-2">🚨</span>
              Pain/Discomfort
            </h3>
            <div className="bg-red-50 rounded-lg p-3">
              <p className="font-medium text-red-900">
                {data.painDiscomfort.location} - Level {data.painDiscomfort.intensity}/5
              </p>
              {data.painDiscomfort.notes && (
                <p className="text-xs text-red-700 mt-1">{data.painDiscomfort.notes}</p>
              )}
            </div>
          </div>
        )}

        {/* Additional Notes */}
        {(data.otherActivities || data.notes) && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <span className="mr-2">📝</span>
              Additional Notes
            </h3>
            <div className="space-y-2">
              {data.otherActivities && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="font-medium text-gray-900 text-xs">Other Activities</p>
                  <p className="text-xs text-gray-700">{data.otherActivities}</p>
                </div>
              )}
              {data.notes && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="font-medium text-gray-900 text-xs">General Notes</p>
                  <p className="text-xs text-gray-700">{data.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
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
                <span className="icon-[mdi-light--chevron-left] w-4 h-4 mr-2"></span>
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
                <span className="icon-[mdi-light--chevron-left] w-4 h-4 mr-2"></span>
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
    <div className="bg-gray-50 min-h-screen">
      {/* Navigation Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Back Button */}
            <Link to="/view-entries" className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <span className="icon-[mdi-light--chevron-left] w-4 h-4 mr-2"></span>
              <span className="hidden sm:inline">Back to Entries</span>
              <span className="sm:hidden">Back</span>
            </Link>
            
            {/* Delete Button */}
            <button
              onClick={() => setDeleteConfirm({ show: true, logId: log.id.toString(), logDate })}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <span className="icon-[mdi-light--delete] w-5 h-5"></span>
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
                  <span className="icon-[mdi-light--chevron-down] w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform"></span>
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