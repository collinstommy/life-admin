import React, { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useHealthLogs, useDeleteHealthLog } from '../hooks/useHealthLogs';
import { ConfirmDialog } from './ConfirmDialog';

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

interface HealthLog {
  id: number;
  date: string;
  audioUrl: string | null;
  transcript: string | null;
  healthData: HealthData;
  createdAt: number;
  updatedAt: number;
}

export function ViewEntriesScreen() {
  const { data: logs, isLoading, error } = useHealthLogs();
  const deleteHealthLog = useDeleteHealthLog();
  const navigate = useNavigate();
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; logId: string; logDate: string }>({
    show: false,
    logId: '',
    logDate: ''
  });

  const handleDelete = async (logId: string) => {
    try {
      await deleteHealthLog.mutateAsync(logId);
      setDeleteConfirm({ show: false, logId: '', logDate: '' });
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        {/* Navigation Header */}
        <div className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <Link to="/" className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                Back
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading entries...</span>
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
              <Link to="/" className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                Back
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-red-50 rounded-xl shadow-sm p-6 text-center">
            <div className="text-red-600 text-xl mb-2">⚠️</div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Entries</h3>
            <p className="text-red-700">{error instanceof Error ? error.message : 'Failed to load health entries'}</p>
          </div>
        </div>
      </div>
    );
  }

  const sortedLogs = logs ? [...logs].sort((a: any, b: any) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  }) : [];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Navigation Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link to="/" className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
              Back
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">View Entries</h1>
          <p className="text-gray-600 text-sm">
            {sortedLogs.length} {sortedLogs.length === 1 ? 'entry' : 'entries'}
          </p>
        </div>

        {/* Entries List */}
        {sortedLogs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">No Entries Yet</h3>
            <p className="text-gray-600 mb-6">
              You haven't created any health entries yet. Start by recording your first health log!
            </p>
            <Link to="/add-entry" className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md font-medium transition-colors">
              Add Your First Entry
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedLogs.map((log: any) => {
              const logDate = new Date(log.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });

              return (
                <div key={log.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="flex">
                    {/* Main Content - Clickable */}
                    <div 
                      className="flex-1 p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate({ to: '/view-entry/$id', params: { id: log.id.toString() } })}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{logDate}</h3>
                        <span className="text-xs text-gray-500">
                          {(() => {
                            // Handle different timestamp formats
                            let timestamp;
                            if (log.createdAt && typeof log.createdAt === 'number') {
                              // If it's already a number, check if it needs conversion
                              timestamp = log.createdAt > 1000000000000 ? log.createdAt : log.createdAt * 1000;
                            } else if (log.createdAt && typeof log.createdAt === 'string') {
                              timestamp = new Date(log.createdAt).getTime();
                            } else {
                              // Fallback to date field if createdAt is not available
                              timestamp = new Date(log.date).getTime();
                            }
                            
                            const date = new Date(timestamp);
                            return isNaN(date.getTime()) ? '' : date.toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            });
                          })()}
                        </span>
                      </div>

                      {/* Health Summary */}
                      <div className="text-xs text-gray-600 flex flex-wrap gap-3">
                        {log.healthData?.workouts?.length > 0 && (
                          <span className="flex items-center">
                            <span className="mr-1">🏋️</span>
                            {log.healthData.workouts.length} workout{log.healthData.workouts.length !== 1 ? 's' : ''}
                          </span>
                        )}
                        {log.healthData?.meals?.length > 0 && (
                          <span className="flex items-center">
                            <span className="mr-1">🍽️</span>
                            {log.healthData.meals.length} meal{log.healthData.meals.length !== 1 ? 's' : ''}
                          </span>
                        )}
                        {log.healthData?.sleep.hours && (
                          <span className="flex items-center">
                            <span className="mr-1">😴</span>
                            {log.healthData.sleep.hours}h sleep
                          </span>
                        )}
                        {log.healthData?.energyLevel && (
                          <span className="flex items-center">
                            <span className="mr-1">⚡</span>
                            Energy {log.healthData.energyLevel}/10
                          </span>
                        )}
                        {log.healthData?.mood.rating && (
                          <span className="flex items-center">
                            <span className="mr-1">😊</span>
                            Mood {log.healthData.mood.rating}/10
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Delete Button */}
                    <div className="flex items-center justify-center p-4 border-l border-gray-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm({ show: true, logId: log.id.toString(), logDate });
                        }}
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors p-2 rounded-md cursor-pointer"
                        title="Delete entry"
                      >
                        <svg 
                          className="w-5 h-5" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24" 
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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