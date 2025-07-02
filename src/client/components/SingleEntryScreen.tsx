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
      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.energyLevel !== null && (
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{data.energyLevel}/10</div>
            <div className="text-sm text-blue-800">Energy Level</div>
          </div>
        )}
        {data.mood.rating !== null && (
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{data.mood.rating}/10</div>
            <div className="text-sm text-green-800">Mood</div>
          </div>
        )}
        {data.sleep.hours !== null && (
          <div className="bg-purple-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">{data.sleep.hours}h</div>
            <div className="text-sm text-purple-800">Sleep</div>
          </div>
        )}
        {data.weightKg !== null && (
          <div className="bg-orange-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-orange-600">{data.weightKg}kg</div>
            <div className="text-sm text-orange-800">Weight</div>
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Workouts */}
        {data.workouts && data.workouts.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
              🏋️ Workouts
            </h4>
            <div className="space-y-2">
              {data.workouts.map((workout, idx) => (
                <div key={idx} className="bg-white p-3 rounded border">
                  <div className="font-medium text-gray-800">{workout.type}</div>
                  <div className="text-sm text-gray-600">
                    {workout.durationMinutes} min
                    {workout.distanceKm && ` • ${workout.distanceKm} km`}
                    {` • Intensity: ${workout.intensity}/10`}
                  </div>
                  {workout.notes && (
                    <div className="text-sm text-gray-500 mt-1">{workout.notes}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Meals */}
        {data.meals && data.meals.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
              🍽️ Meals
            </h4>
            <div className="space-y-2">
              {data.meals.map((meal, idx) => (
                <div key={idx} className="bg-white p-3 rounded border">
                  <div className="font-medium text-gray-800">{meal.type}</div>
                  <div className="text-sm text-gray-600">{meal.notes}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sleep & Recovery */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
            😴 Sleep & Recovery
          </h4>
          <div className="space-y-2">
            {data.sleep.hours !== null && (
              <div className="text-sm">
                <span className="font-medium">Hours:</span> {data.sleep.hours}h
              </div>
            )}
            {data.sleep.quality !== null && (
              <div className="text-sm">
                <span className="font-medium">Quality:</span> {formatRating(data.sleep.quality)}
              </div>
            )}
            {data.waterIntakeLiters !== null && (
              <div className="text-sm">
                <span className="font-medium">Water intake:</span> {data.waterIntakeLiters}L
              </div>
            )}
          </div>
        </div>

        {/* Health & Wellness */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
            💊 Health & Wellness
          </h4>
          <div className="space-y-2">
            {data.screenTimeHours !== null && (
              <div className="text-sm">
                <span className="font-medium">Screen time:</span> {data.screenTimeHours}h
              </div>
            )}
            {data.painDiscomfort && (data.painDiscomfort.location || data.painDiscomfort.intensity) && (
              <div className="text-sm">
                <span className="font-medium">Pain/Discomfort:</span>
                {data.painDiscomfort.location && ` ${data.painDiscomfort.location}`}
                {data.painDiscomfort.intensity && ` (${data.painDiscomfort.intensity}/10)`}
                {data.painDiscomfort.notes && (
                  <div className="text-gray-500 mt-1">{data.painDiscomfort.notes}</div>
                )}
              </div>
            )}
            {data.mood.notes && (
              <div className="text-sm">
                <span className="font-medium">Mood notes:</span>
                <div className="text-gray-600 mt-1">{data.mood.notes}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Notes */}
      {(data.otherActivities || data.notes) && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
            📝 Additional Notes
          </h4>
          {data.otherActivities && (
            <div className="text-sm mb-2">
              <span className="font-medium">Other activities:</span> {data.otherActivities}
            </div>
          )}
          {data.notes && (
            <div className="text-sm">
              <span className="font-medium">General notes:</span> {data.notes}
            </div>
          )}
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

  const log = logs?.find((log: HealthLog) => log.id === Number(id));

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

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <Link to="/view-entries" className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors mr-4">
            ← Back to Entries
          </Link>
          <h2 className="text-2xl font-semibold text-gray-800">Health Entry</h2>
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading entry...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <Link to="/view-entries" className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors mr-4">
            ← Back to Entries
          </Link>
          <h2 className="text-2xl font-semibold text-gray-800">Health Entry</h2>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 text-xl mb-2">⚠️</div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Entry</h3>
          <p className="text-red-700">{error instanceof Error ? error.message : 'Failed to load health entry'}</p>
        </div>
      </div>
    );
  }

  if (!log) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <Link to="/view-entries" className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors mr-4">
            ← Back to Entries
          </Link>
          <h2 className="text-2xl font-semibold text-gray-800">Health Entry</h2>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
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
    );
  }

  const logDate = new Date(log.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        {/* Back button row */}
        <div className="flex items-center justify-between mb-4">
          <Link to="/view-entries" className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
            <span className="hidden sm:inline">← Back to Entries</span>
            <span className="sm:hidden">← Back</span>
          </Link>
          <button
            onClick={() => setDeleteConfirm({ show: true, logId: log.id.toString(), logDate })}
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
        
        {/* Title row */}
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 leading-tight">{logDate}</h2>
        </div>
      </div>

      {/* Entry Content */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <HealthDataDisplay data={log.healthData} />
        
        {/* Raw Transcript (collapsible) */}
        {log.transcript && (
          <details className="mt-6">
            <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800">
              View Original Transcript
            </summary>
            <div className="mt-2 p-3 bg-gray-50 rounded text-sm text-gray-700">
              {log.transcript}
            </div>
          </details>
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