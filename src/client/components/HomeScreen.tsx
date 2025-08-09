import React, { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useHealthLogs, useDeleteHealthLog } from '../hooks/useHealthLogs';
import { ConfirmDialog } from './ConfirmDialog';

export function HomeScreen() {
  const { data: logs, isLoading } = useHealthLogs();
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

  const N_ENTRIES_TO_SHOW = 7;

  const sortedLogs = logs ? [...logs].sort((a: any, b: any) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  }).slice(0, N_ENTRIES_TO_SHOW) : []; // Show only the 3 most recent entries

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-lg font-semibold text-slate-900">Health Journal</h1>
                <p className="text-sm text-slate-500">Your daily wellness companion</p>
              </div>
            </div>
            <Link 
              to="/add-entry" 
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Add Entry
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Action Cards Grid */}
        <div className="mb-8">
          <div className="grid grid-cols-4 gap-3 md:gap-6">
            {/* Voice Entry */}
            <Link
              to="/add-entry"
              className="glass-card rounded-xl p-3 md:p-6 cursor-pointer hover:scale-105 transition-all duration-200 block group"
            >
              <div className="w-10 h-10 md:w-16 md:h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg md:rounded-2xl flex items-center justify-center mx-auto mb-2 md:mb-4">
                <svg className="w-5 h-5 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                </svg>
              </div>
              <h3 className="text-xs md:text-xl font-semibold text-slate-900 text-center">Voice</h3>
            </Link>

            {/* Text Entry */}
            <Link
              to="/add-text-entry"
              className="glass-card rounded-xl p-3 md:p-6 cursor-pointer hover:scale-105 transition-all duration-200 block group"
            >
              <div className="w-10 h-10 md:w-16 md:h-16 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-lg md:rounded-2xl flex items-center justify-center mx-auto mb-2 md:mb-4">
                <svg className="w-5 h-5 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
              </div>
              <h3 className="text-xs md:text-xl font-semibold text-slate-900 text-center">Text</h3>
            </Link>

            {/* View Entries */}
            <Link
              to="/view-entries"
              className="glass-card rounded-xl p-3 md:p-6 cursor-pointer hover:scale-105 transition-all duration-200 block group"
            >
              <div className="w-10 h-10 md:w-16 md:h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-lg md:rounded-2xl flex items-center justify-center mx-auto mb-2 md:mb-4">
                <svg className="w-5 h-5 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
              <h3 className="text-xs md:text-xl font-semibold text-slate-900 text-center">View</h3>
            </Link>

            {/* Debug Tools */}
            <Link
              to="/debug"
              className="glass-card rounded-xl p-3 md:p-6 cursor-pointer hover:scale-105 transition-all duration-200 block group"
            >
              <div className="w-10 h-10 md:w-16 md:h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg md:rounded-2xl flex items-center justify-center mx-auto mb-2 md:mb-4">
                <svg className="w-5 h-5 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <h3 className="text-xs md:text-xl font-semibold text-slate-900 text-center">Debug</h3>
            </Link>
          </div>
        </div>

        {/* Recent Entries Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Recent Entries</h2>
            {logs && logs.length > N_ENTRIES_TO_SHOW && (
              <Link 
                to="/view-entries" 
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                View All
              </Link>
            )}
          </div>
        </div>

        {/* Entries List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-slate-600">Loading entries...</span>
          </div>
        ) : sortedLogs.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No entries yet</h3>
            <p className="text-slate-600 mb-4">Start tracking your health journey today</p>
            <Link 
              to="/add-entry" 
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors inline-block"
            >
              Create Your First Entry
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
                <div key={log.id} className="glass-card rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group">
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
                      <div className="flex flex-wrap gap-3">
                        {log.healthData?.workouts?.length > 0 && (
                          <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1.5 rounded-full">
                            <span className="text-blue-600 text-sm">🏋️</span>
                            <span className="text-sm font-medium text-blue-700">
                              {log.healthData.workouts.length} workout{log.healthData.workouts.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                        {log.healthData?.meals?.length > 0 && (
                          <div className="flex items-center space-x-2 bg-green-50 px-3 py-1.5 rounded-full">
                            <span className="text-green-600 text-sm">🍽️</span>
                            <span className="text-sm font-medium text-green-700">
                              {log.healthData.meals.length} meal{log.healthData.meals.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                        {log.healthData?.sleep?.hours && (
                          <div className="flex items-center space-x-2 bg-purple-50 px-3 py-1.5 rounded-full">
                            <span className="text-purple-600 text-sm">😴</span>
                            <span className="text-sm font-medium text-purple-700">
                              {log.healthData.sleep.hours}h sleep
                            </span>
                          </div>
                        )}
                        {log.healthData?.energyLevel && (
                          <div className="flex items-center space-x-2 bg-yellow-50 px-3 py-1.5 rounded-full">
                            <span className="text-yellow-600 text-sm">⚡</span>
                            <span className="text-sm font-medium text-yellow-700">
                              Energy {log.healthData.energyLevel}/10
                            </span>
                          </div>
                        )}
                        {log.healthData?.mood?.rating && (
                          <div className="flex items-center space-x-2 bg-pink-50 px-3 py-1.5 rounded-full">
                            <span className="text-pink-600 text-sm">😊</span>
                            <span className="text-sm font-medium text-pink-700">
                              Mood {log.healthData.mood.rating}/10
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 p-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(log);
                        }}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit entry"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm({ show: true, logId: log.id.toString(), logDate });
                        }}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete entry"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

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