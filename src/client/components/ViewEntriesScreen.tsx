import React, { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useHealthLogs, useDeleteHealthLog } from '../hooks/useHealthLogs';
import { ConfirmDialog } from './ConfirmDialog';
import { StructuredHealthData } from '../../lib/ai';

interface HealthLog {
  id: number;
  date: string;
  audioUrl: string | null;
  transcript: string | null;
  healthData: StructuredHealthData;
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

  const handleEdit = (log: any) => {
    navigate({ to: '/edit-entry/$id', params: { id: log.id.toString() } });
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        {/* Navigation Header */}
        <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors">
                <span className="icon-[mdi-light--chevron-left] w-5 h-5"></span>
                <span className="text-sm font-medium">Back</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-slate-600">Loading entries...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        {/* Navigation Header */}
        <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors">
                <span className="icon-[mdi-light--chevron-left] w-5 h-5"></span>
                <span className="text-sm font-medium">Back</span>
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
            <h3 className="text-xl font-semibold text-red-900 mb-2">Error Loading Entries</h3>
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
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Navigation Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors">
              <span className="icon-[mdi-light--chevron-left] w-5 h-5"></span>
              <span className="text-sm font-medium">Back</span>
            </Link>
            <Link 
              to="/add-entry" 
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Add Entry
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Health Journal</h1>
          <p className="text-slate-600">
            {sortedLogs.length} {sortedLogs.length === 1 ? 'entry' : 'entries'}
          </p>
        </div>

        {/* Entries List */}
        {sortedLogs.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="icon-[mdi--chart-line] w-10 h-10 text-slate-400"></span>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-4">No Entries Yet</h3>
            <p className="text-slate-600 mb-6">
              You haven't created any health entries yet. Start by recording your first health log!
            </p>
            <Link to="/add-entry" className="btn btn-primary btn-md">
              Add Your First Entry
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedLogs.map((log: any) => {
              const logDate = new Date(log.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });

              return (
                <div key={log.id} className="glass-card rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group">
                  <div className="flex">
                    {/* Main Content - Clickable */}
                    <div 
                      className="flex-1 p-6 transition-colors"
                      onClick={() => navigate({ to: '/view-entry/$id', params: { id: log.id.toString() } })}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-slate-900">{logDate}</h3>
                        <span className="text-sm text-slate-500">
                          {new Date(log.createdAt * 1000).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>


                      {/* Health Indicators */}
                      <div className="flex flex-wrap gap-2">
                        {log.healthData?.workouts?.length > 0 && (
                          <div className="flex items-center space-x-1.5 bg-blue-50 px-3 py-1.5 rounded-full">
                            <span className="icon-[mdi--dumbbell] w-4 h-4 text-blue-600"></span>
                            <span className="text-sm font-medium text-blue-700">
                              {log.healthData.workouts.length} workout{log.healthData.workouts.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                        {log.healthData?.meals?.length > 0 && (
                          <div className="flex items-center space-x-1.5 bg-green-50 px-3 py-1.5 rounded-full">
                            <span className="icon-[mdi--food] w-4 h-4 text-green-600"></span>
                            <span className="text-sm font-medium text-green-700">
                              {log.healthData.meals.length} meal{log.healthData.meals.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                        {log.healthData?.sleep?.hours && (
                          <div className="flex items-center space-x-1.5 bg-purple-50 px-3 py-1.5 rounded-full">
                            <span className="icon-[mdi--sleep] w-4 h-4 text-purple-600"></span>
                            <span className="text-sm font-medium text-purple-700">
                              {log.healthData.sleep.hours}h sleep
                            </span>
                          </div>
                        )}
                        {log.healthData?.energyLevel && (
                          <div className="flex items-center space-x-1.5 bg-yellow-50 px-3 py-1.5 rounded-full">
                            <span className="icon-[mdi--lightning-bolt] w-4 h-4 text-yellow-600"></span>
                            <span className="text-sm font-medium text-yellow-700">
                              Energy {log.healthData.energyLevel}/10
                            </span>
                          </div>
                        )}
                        {log.healthData?.mood?.rating && (
                          <div className="flex items-center space-x-1.5 bg-pink-50 px-3 py-1.5 rounded-full">
                            <span className="icon-[mdi--emoticon-happy] w-4 h-4 text-pink-600"></span>
                            <span className="text-sm font-medium text-pink-700">
                              Mood {log.healthData.mood.rating}/10
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col items-center justify-center p-4 space-y-2 border-l border-slate-200/50">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(log);
                        }}
                        className="btn btn-ghost btn-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit entry"
                      >
                        <span className="icon-[mdi-light--pencil] w-5 h-5"></span>
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm({ show: true, logId: log.id.toString(), logDate });
                        }}
                        className="btn btn-ghost btn-sm text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete entry"
                      >
                        <span className="icon-[mdi-light--delete] w-5 h-5"></span>
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