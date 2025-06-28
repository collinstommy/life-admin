import React, { useState } from 'react';
import { useHealthLogs, useDeleteHealthLog } from '../hooks/useHealthLogs';
import { format, parseISO } from 'date-fns';
import { ConfirmDialog } from './ConfirmDialog';

interface HealthLog {
  id: string;
  date: string;
  transcript: string;
  healthData: any;
  audioUrl?: string;
}

interface ExpandedCards {
  [key: string]: boolean;
}

export function HistoryView() {
  const { data: logs, isLoading, isError, error, refetch } = useHealthLogs();
  const deleteMutation = useDeleteHealthLog();
  const [expandedCards, setExpandedCards] = useState<ExpandedCards>({});
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    logId: string | null;
    logDate: string | null;
  }>({
    isOpen: false,
    logId: null,
    logDate: null,
  });

  const toggleCard = (id: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'EEEE, MMMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'h:mm a');
    } catch {
      return '';
    }
  };

  const handleDeleteClick = (log: HealthLog) => {
    setDeleteDialog({
      isOpen: true,
      logId: log.id,
      logDate: formatDate(log.date),
    });
  };

  const handleDeleteConfirm = () => {
    if (deleteDialog.logId) {
      deleteMutation.mutate(deleteDialog.logId, {
        onSuccess: () => {
          setDeleteDialog({ isOpen: false, logId: null, logDate: null });
        },
        onError: (error) => {
          console.error('Delete failed:', error);
          // Keep the dialog open to show the error
        },
      });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, logId: null, logDate: null });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Health Log History</h2>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading your health logs...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Health Log History</h2>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700 font-medium">Failed to load health logs</p>
          <p className="text-red-600 text-sm">{error?.message}</p>
          <button 
            onClick={() => refetch()}
            className="mt-2 text-sm text-red-600 underline hover:text-red-800"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Health Log History</h2>
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <p className="text-gray-600 text-lg mb-2">No health logs yet</p>
          <p className="text-gray-500">Start by recording your first health log!</p>
        </div>
      </div>
    );
  }

  // Sort logs by date (newest first)
  const sortedLogs = [...logs].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Health Log History</h2>
        <p className="text-gray-600">{logs.length} {logs.length === 1 ? 'entry' : 'entries'}</p>
      </div>

      <div className="space-y-4">
        {sortedLogs.map((log) => (
          <div 
            key={log.id} 
            className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Card Header */}
            <div 
              className="bg-gray-50 px-4 py-3 cursor-pointer flex justify-between items-center"
              onClick={() => toggleCard(log.id)}
            >
              <div>
                <h3 className="font-medium text-gray-900">
                  {formatDate(log.date)}
                </h3>
                <p className="text-sm text-gray-600">
                  {formatTime(log.date)}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(log);
                  }}
                  disabled={deleteMutation.isPending}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                  title="Delete this health log"
                >
                  <svg 
                    className="w-4 h-4" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                    />
                  </svg>
                </button>
                
                <span className="text-sm text-gray-500">
                  {expandedCards[log.id] ? 'Hide Details' : 'Show Details'}
                </span>
                <svg 
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    expandedCards[log.id] ? 'rotate-180' : ''
                  }`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Card Content */}
            {expandedCards[log.id] && (
              <div className="p-4 space-y-4">
                {/* Transcript Section */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Raw Transcript</h4>
                  <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 border">
                    {log.transcript || 'No transcript available'}
                  </div>
                </div>

                {/* Health Data Section */}
                {log.healthData && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Health Summary</h4>
                    <div className="bg-blue-50 p-3 rounded border">
                      <pre className="text-xs text-blue-800 overflow-auto max-h-64">
                        {JSON.stringify(log.healthData, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Audio URL if available */}
                {log.audioUrl && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Audio Recording</h4>
                    <p className="text-sm text-gray-600">
                      <a 
                        href={log.audioUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        View audio file
                      </a>
                    </p>
                  </div>
                )}

                {/* Log ID for debugging */}
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Log ID: {log.id}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Refresh Button */}
      <div className="mt-6 text-center">
        <button
          onClick={() => refetch()}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Refresh History
        </button>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Health Log"
        message={`Are you use you want to delete?`}
        confirmText={deleteMutation.isPending ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      {/* Delete Error Display */}
      {deleteMutation.isError && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-md p-4 shadow-lg">
          <p className="text-red-700 font-medium">Failed to delete health log</p>
          <p className="text-red-600 text-sm">{deleteMutation.error?.message}</p>
          <button
            onClick={() => deleteMutation.reset()}
            className="mt-2 text-sm text-red-600 underline hover:text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
} 