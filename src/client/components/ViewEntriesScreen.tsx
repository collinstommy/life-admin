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
  id: string;
  date: string;
  transcript: string;
  healthData: HealthData;
  audioUrl?: string;
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
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <Link to="/" className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors mr-4">
            ← Back
          </Link>
          <h2 className="text-2xl font-semibold text-gray-800">View Entries</h2>
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading your health entries...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <Link to="/" className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors mr-4">
            ← Back
          </Link>
          <h2 className="text-2xl font-semibold text-gray-800">View Entries</h2>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 text-xl mb-2">⚠️</div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Entries</h3>
          <p className="text-red-700">{error instanceof Error ? error.message : 'Failed to load health entries'}</p>
        </div>
      </div>
    );
  }

  const sortedLogs = logs ? [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Link to="/" className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors mr-4">
            ← Back
          </Link>
          <h2 className="text-2xl font-semibold text-gray-800">View Entries</h2>
        </div>
        <div className="text-sm text-gray-600">
          {sortedLogs.length} {sortedLogs.length === 1 ? 'entry' : 'entries'}
        </div>
      </div>

      {/* Entries List */}
      {sortedLogs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
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
                <div className="space-y-4">
          {sortedLogs.map((log: HealthLog) => {
            const logDate = new Date(log.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });

            return (
              <div key={log.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Entry Header */}
                <div className="flex">
                  {/* Main clickable area */}
                  <div 
                    className="flex-1 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => navigate({ to: '/view-entry/$id', params: { id: log.id } })}
                  >
                    <h3 className="text-lg font-semibold text-gray-800">{logDate}</h3>
                    <div className="text-sm text-gray-600 mt-1">
                      {log.healthData.workouts?.length > 0 && (
                        <span className="mr-4">🏋️ {log.healthData.workouts.length} workout{log.healthData.workouts.length !== 1 ? 's' : ''}</span>
                      )}
                      {log.healthData.meals?.length > 0 && (
                        <span className="mr-4">🍽️ {log.healthData.meals.length} meal{log.healthData.meals.length !== 1 ? 's' : ''}</span>
                      )}
                      {log.healthData.sleep.hours && (
                        <span className="mr-4">😴 {log.healthData.sleep.hours}h sleep</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Delete button area */}
                  <div className="flex items-center justify-center p-4 border-l border-gray-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm({ show: true, logId: log.id, logDate });
                      }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors p-2 rounded-md cursor-pointer"
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