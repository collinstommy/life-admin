import React, { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useDeleteHealthLog } from '../hooks/useHealthLogs';
import { ConfirmDialog } from './ConfirmDialog';
import { StructuredHealthData } from '../../lib/ai';

interface HealthLog {
  id: number;
  date: string;
  audioUrl: string | null;
  transcript: string | null;
  healthData?: StructuredHealthData; // Make optional to match actual data structure
  structuredData?: string | null; // Add this field that might exist in the actual data
  createdAt: number;
  updatedAt: number;
}

interface EntriesListProps {
  logs: any[]; // Use any[] to be more flexible with the input type
  isLoading: boolean;
  error?: any; // Optional error state
  length?: number; // If provided, limits the number of days to show
  showActionButtons?: boolean; // Whether to show edit/delete buttons
}

export function EntriesList({ logs, isLoading, error, length, showActionButtons = true }: EntriesListProps) {
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

  // Sort logs by date (newest first)
  const sortedLogs = logs ? [...logs].sort((a: any, b: any) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  }) : [];

  // Function to generate entries with placeholders for missing days
  const generateEntriesWithPlaceholders = () => {
    if (sortedLogs.length === 0 && !length) return [];

    const entries: Array<{ type: 'entry' | 'placeholder'; data: any; date: string }> = [];
    
    // Determine how many days to show
    const today = new Date();
    const maxDays = length || 30; // Default to 30 days if no length specified
    const maxItems = length || 20; // Default to 20 items if no length specified
    let itemCount = 0;
    
    for (let i = 0; i < maxDays && itemCount < maxItems; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() - i);
      const dateString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Check if there's an entry for this date
      const existingEntry = sortedLogs.find(log => log.date === dateString);
      
      if (existingEntry) {
        entries.push({ type: 'entry', data: existingEntry, date: dateString });
      } else {
        // Only show placeholder if it's not today or if we have some entries
        if (i > 0 || sortedLogs.length > 0) {
          entries.push({ type: 'placeholder', data: null, date: dateString });
        }
      }
      
      itemCount++;
    }
    
    return entries;
  };

  const entriesWithPlaceholders = generateEntriesWithPlaceholders();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-slate-600">Loading entries...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center border-red-200">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-red-600 text-2xl">⚠️</span>
        </div>
        <h3 className="text-xl font-semibold text-red-900 mb-2">Error Loading Entries</h3>
        <p className="text-red-700">{error instanceof Error ? error.message : 'Failed to load entries'}</p>
      </div>
    );
  }

  if (sortedLogs.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No entries yet</h3>
        <p className="text-slate-600 mb-4">Start tracking your journey today</p>
        <Link 
          to="/add-entry" 
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors inline-block"
        >
          Create Your First Entry
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {entriesWithPlaceholders.map((item, index) => {
          if (item.type === 'placeholder') {
            const placeholderDate = new Date(item.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });

            return (
              <div key={`placeholder-${item.date}`} className="glass-card rounded-2xl overflow-hidden border-dashed border-2 border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                      <span className="icon-[mdi--calendar-plus] w-6 h-6 text-slate-400"></span>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-slate-600">{placeholderDate}</h3>
                      <p className="text-sm text-slate-500">No entry for this day</p>
                    </div>
                  </div>
                  
                  <Link 
                    to="/add-text-entry" 
                    search={{ date: item.date }}
                    className="btn btn-outline btn-sm text-slate-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                  >
                    <span className="icon-[mdi--plus] w-4 h-4 mr-1"></span>
                    Add Entry
                  </Link>
                </div>
              </div>
            );
          }

          // Render actual entry
          const log = item.data;
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
                {showActionButtons && (
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
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      {showActionButtons && (
        <ConfirmDialog
          isOpen={deleteConfirm.show}
          title="Delete Health Entry"
          message={`Are you sure you want to delete the health entry from ${deleteConfirm.logDate}? This action cannot be undone.`}
          onConfirm={() => handleDelete(deleteConfirm.logId)}
          onCancel={() => setDeleteConfirm({ show: false, logId: '', logDate: '' })}
          isLoading={deleteHealthLog.isPending}
        />
      )}
    </>
  );
}