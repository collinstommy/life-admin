import React, { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useHealthLogs, useDeleteHealthLog } from '../hooks/useHealthLogs';
import { ConfirmDialog } from './ConfirmDialog';
import { EditExistingEntryModal } from './EditExistingEntryModal';
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
  const [editModal, setEditModal] = useState<{ show: boolean; entry: any | null }>({
    show: false,
    entry: null
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
    setEditModal({ show: true, entry: log });
  };

  const handleEditSave = () => {
    setEditModal({ show: false, entry: null });
    // Logs will automatically refresh due to query invalidation
  };

  const handleEditCancel = () => {
    setEditModal({ show: false, entry: null });
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        {/* Navigation Header */}
        <div className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <Link to="/" className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <span className="icon-[mdi-light--chevron-left] w-4 h-4 mr-2"></span>
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
                <span className="icon-[mdi-light--chevron-left] w-4 h-4 mr-2"></span>
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
              <span className="icon-[mdi-light--chevron-left] w-4 h-4 mr-2"></span>
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
                          {new Date(log.createdAt * 1000).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
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

                    {/* Action Buttons */}
                    <div className="flex items-center justify-center border-l border-gray-100">
                      {/* Edit Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(log);
                        }}
                        className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors p-2 rounded-md cursor-pointer"
                        title="Edit entry"
                      >
                        <span className="icon-[mdi-light--pencil] w-5 h-5"></span>
                      </button>
                      
                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm({ show: true, logId: log.id.toString(), logDate });
                        }}
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors p-2 rounded-md cursor-pointer ml-1"
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

      {/* Edit Modal */}
      {editModal.show && editModal.entry && (
        <EditExistingEntryModal
          isOpen={editModal.show}
          entry={editModal.entry}
          onSave={handleEditSave}
          onCancel={handleEditCancel}
        />
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