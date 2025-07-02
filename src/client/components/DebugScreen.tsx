import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useDeleteAllHealthLogs } from '../hooks/useHealthLogs';
import { ConfirmDialog } from './ConfirmDialog';

interface SeedResponse {
  success: boolean;
  message: string;
  entries: Array<{
    id: string;
    date: string;
    transcript: string;
  }>;
}

export function DebugScreen() {
  const deleteAllMutation = useDeleteAllHealthLogs();
  const [seedMutation, setSeedMutation] = useState<{
    isPending: boolean;
    isError: boolean;
    isSuccess: boolean;
    error: Error | null;
    data: SeedResponse | null;
  }>({
    isPending: false,
    isError: false,
    isSuccess: false,
    error: null,
    data: null,
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSeedDatabase = async () => {
    setSeedMutation({ isPending: true, isError: false, isSuccess: false, error: null, data: null });
    
    try {
      const response = await fetch('/api/seed', { method: 'POST' });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to seed database');
      }
      
      setSeedMutation({ isPending: false, isError: false, isSuccess: true, error: null, data });
    } catch (error) {
      setSeedMutation({ 
        isPending: false, 
        isError: true, 
        isSuccess: false, 
        error: error as Error, 
        data: null 
      });
    }
  };

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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Debug Tools</h1>
          <p className="text-gray-600 text-sm">Developer tools and advanced options</p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {/* Manual Entry */}
          <Link
            to="/debug/manual-entry"
            className="bg-white hover:bg-gray-50 p-6 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md block text-center group"
          >
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
              <span className="text-green-600 text-2xl">✍️</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Manual Entry</h4>
            <p className="text-gray-600 text-sm">Create entry from text</p>
          </Link>

          {/* Transcript Processor */}
          <Link
            to="/debug/transcript"
            className="bg-white hover:bg-gray-50 p-6 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md block text-center group"
          >
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-yellow-200 transition-colors">
              <span className="text-yellow-600 text-2xl">📝</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Transcript Processor</h4>
            <p className="text-gray-600 text-sm">Process text manually</p>
          </Link>

          {/* History View */}
          <Link
            to="/debug/history"
            className="bg-white hover:bg-gray-50 p-6 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md block text-center group"
          >
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-200 transition-colors">
              <span className="text-indigo-600 text-2xl">📊</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Raw History</h4>
            <p className="text-gray-600 text-sm">View raw health logs</p>
          </Link>

          {/* Seed Database */}
          <button
            onClick={handleSeedDatabase}
            className="bg-white hover:bg-gray-50 p-6 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md block text-center group disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={seedMutation.isPending}
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
              <span className="text-blue-600 text-2xl">🌱</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Seed Database</h4>
            <p className="text-gray-600 text-sm">Create sample data</p>
          </button>

          {/* Delete All Data */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-white hover:bg-red-50 p-6 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md block text-center group disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={deleteAllMutation.isPending}
          >
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-red-200 transition-colors">
              <span className="text-red-600 text-2xl">🗑️</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Delete All Data</h4>
            <p className="text-gray-600 text-sm">Remove all health logs</p>
          </button>
        </div>

        {/* Status Messages */}
        <div className="space-y-4">
          {seedMutation.isPending && (
            <div className="bg-blue-50 rounded-xl shadow-sm p-4">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-blue-800 font-medium">Seeding database...</span>
              </div>
            </div>
          )}
          
          {seedMutation.isError && (
            <div className="bg-red-50 rounded-xl shadow-sm p-4">
              <p className="text-red-800 font-medium">Error seeding database</p>
              <p className="text-red-600 text-sm">{seedMutation.error?.message}</p>
            </div>
          )}
          
          {seedMutation.isSuccess && (
            <div className="bg-green-50 rounded-xl shadow-sm p-4">
              <p className="text-green-800 font-medium">✅ Database seeded successfully!</p>
              <p className="text-green-600 text-sm">{seedMutation.data?.message}</p>
            </div>
          )}

          {deleteAllMutation.isPending && (
            <div className="bg-red-50 rounded-xl shadow-sm p-4">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600 mr-3"></div>
                <span className="text-red-800 font-medium">Deleting all data...</span>
              </div>
            </div>
          )}
          
          {deleteAllMutation.isError && (
            <div className="bg-red-50 rounded-xl shadow-sm p-4">
              <p className="text-red-800 font-medium">Error deleting data</p>
              <p className="text-red-600 text-sm">{deleteAllMutation.error?.message}</p>
            </div>
          )}
          
          {deleteAllMutation.isSuccess && (
            <div className="bg-green-50 rounded-xl shadow-sm p-4">
              <p className="text-green-800 font-medium">✅ All data deleted successfully!</p>
              <p className="text-green-600 text-sm">{deleteAllMutation.data?.message}</p>
            </div>
          )}
        </div>

        {/* Warning Note */}
        <div className="mt-8 bg-yellow-50 rounded-xl shadow-sm p-4">
          <div className="flex items-start">
            <div className="text-yellow-600 text-lg mr-3">⚠️</div>
            <div>
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> These are developer tools for testing and debugging. 
                Use caution when deleting data as this action cannot be undone.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete All Health Data"
        message="Are you sure you want to delete ALL health log entries? This action cannot be undone and will permanently remove all your health tracking data."
        onConfirm={() => {
          deleteAllMutation.mutate();
          setShowDeleteConfirm(false);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
        isLoading={deleteAllMutation.isPending}
      />
    </div>
  );
} 