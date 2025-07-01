import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
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

export function ViewEntriesScreen() {
  const { data: logs, isLoading, error } = useHealthLogs();
  const deleteHealthLog = useDeleteHealthLog();
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
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
            const isExpanded = expandedEntry === log.id;
            const logDate = new Date(log.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });

            return (
              <div key={log.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Entry Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
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
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setDeleteConfirm({ show: true, logId: log.id, logDate })}
                        className="text-red-500 hover:text-red-700 transition-colors p-1"
                        title="Delete entry"
                      >
                        🗑️
                      </button>
                      <button
                        onClick={() => setExpandedEntry(isExpanded ? null : log.id)}
                        className="text-blue-500 hover:text-blue-700 transition-colors text-sm font-medium"
                      >
                        {isExpanded ? 'Hide Details' : 'Show Details'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="p-4">
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
                )}
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