import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { ConfirmDialog } from './ConfirmDialog';
import { useDeleteAllHealthLogs } from '../hooks/useHealthLogs';

async function seedDatabase() {
  const res = await fetch('/api/seed', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error('Failed to seed database');
  }
  return res.json();
}

export function DebugScreen() {
  const seedMutation = useMutation({ mutationFn: seedDatabase });
  const deleteAllMutation = useDeleteAllHealthLogs();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header with back button */}
      <div className="flex items-center mb-8">
        <Link
          to="/"
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors mr-4"
        >
          ← Back
        </Link>
        <h2 className="text-2xl font-semibold text-gray-800">Debug Tools</h2>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🛠️</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Developer Tools
          </h3>
          <p className="text-gray-600">
            Access to existing functionality for testing and development
          </p>
        </div>

        {/* Debug options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {/* Manual Entry */}
          <Link
            to="/debug/manual-entry"
            className="bg-green-500 hover:bg-green-600 text-white p-6 rounded-lg shadow transition-all duration-200 hover:shadow-lg block text-center"
          >
            <div className="text-2xl mb-2">✍️</div>
            <h4 className="font-semibold mb-1">Manual Entry</h4>
            <p className="text-green-100 text-sm">Create entry from text</p>
          </Link>

          {/* Transcript Processor */}
          <Link
            to="/debug/transcript"
            className="bg-yellow-500 hover:bg-yellow-600 text-white p-6 rounded-lg shadow transition-all duration-200 hover:shadow-lg block text-center"
          >
            <div className="text-2xl mb-2">📝</div>
            <h4 className="font-semibold mb-1">Transcript Processor</h4>
            <p className="text-yellow-100 text-sm">Process text manually</p>
          </Link>

          {/* History View */}
          <Link
            to="/debug/history"
            className="bg-indigo-500 hover:bg-indigo-600 text-white p-6 rounded-lg shadow transition-all duration-200 hover:shadow-lg block text-center"
          >
            <div className="text-2xl mb-2">📊</div>
            <h4 className="font-semibold mb-1">Raw History</h4>
            <p className="text-indigo-100 text-sm">View raw health logs</p>
          </Link>

          {/* Seed Database */}
          <button
            onClick={() => seedMutation.mutate()}
            className="bg-blue-500 hover:bg-blue-600 text-white p-6 rounded-lg shadow transition-all duration-200 hover:shadow-lg block text-center"
            disabled={seedMutation.isPending}
          >
            <div className="text-2xl mb-2">🌱</div>
            <h4 className="font-semibold mb-1">Seed Database</h4>
            <p className="text-blue-100 text-sm">Create sample data</p>
          </button>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-red-500 hover:bg-red-600 text-white p-6 rounded-lg shadow transition-all duration-200 hover:shadow-lg block text-center"
            disabled={deleteAllMutation.isPending}
          >
            <div className="text-2xl mb-2">🗑️</div>
            <h4 className="font-semibold mb-1">Delete All Data</h4>
            <p className="text-red-100 text-sm">Remove all health logs</p>
          </button>
        </div>

        {seedMutation.isPending && (
          <div className="mt-4 text-center text-gray-600">Seeding...</div>
        )}
        {seedMutation.isError && (
          <div className="mt-4 text-center text-red-600">
            Error: {seedMutation.error.message}
          </div>
        )}
        {seedMutation.isSuccess && (
          <div className="mt-4 text-center text-green-600">
            {seedMutation.data.message}
          </div>
        )}

        {deleteAllMutation.isPending && (
          <div className="mt-4 text-center text-gray-600">Deleting all data...</div>
        )}
        {deleteAllMutation.isError && (
          <div className="mt-4 text-center text-red-600">
            Error: {deleteAllMutation.error.message}
          </div>
        )}
        {deleteAllMutation.isSuccess && (
          <div className="mt-4 text-center text-green-600">
            {deleteAllMutation.data.message}
          </div>
        )}

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <div className="text-yellow-600 text-lg mr-2">⚠️</div>
            <div>
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> These are the original screens from the previous version. 
                They will be replaced with improved versions in the main navigation.
              </p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete All Health Data"
        message="Are you sure you want to delete all health logs and related data? This action cannot be undone."
        confirmText="Delete All"
        cancelText="Cancel"
        confirmButtonClass="bg-red-500 hover:bg-red-600"
        isLoading={deleteAllMutation.isPending}
        onConfirm={() => {
          deleteAllMutation.mutate();
          setShowDeleteConfirm(false);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
} 