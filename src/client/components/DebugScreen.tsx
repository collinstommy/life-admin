import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useDeleteAllHealthLogs, useSeedDatabase } from '../hooks/useHealthLogs';
import { ConfirmDialog } from './ConfirmDialog';

export function DebugScreen() {
  const deleteAllMutation = useDeleteAllHealthLogs();
  const seedMutation = useSeedDatabase();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSeedDatabase = () => {
    seedMutation.mutate();
  };

  const handleDeleteAll = () => {
    deleteAllMutation.mutate();
    setShowDeleteConfirm(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/" className="text-blue-500 hover:text-blue-700">
          ← Back to Health Tracker
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-6">Debug & Development Tools</h1>
      
      <div className="space-y-6">
        {/* Seed Database Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Seed Database</h2>
          <p className="text-gray-600 mb-4">
            Add sample health log entries to the database for testing purposes.
          </p>
          <button
            onClick={handleSeedDatabase}
            disabled={seedMutation.isPending}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
          >
            {seedMutation.isPending ? 'Seeding...' : 'Seed Database'}
          </button>
          
          {seedMutation.isError && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              Error: {seedMutation.error?.message || 'Failed to seed database'}
            </div>
          )}
          
          {seedMutation.isSuccess && (
            <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              Success! Database seeded with {seedMutation.data?.entries?.length || 0} entries.
            </div>
          )}
        </div>
        
        {/* Delete All Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Delete All Data</h2>
          <p className="text-gray-600 mb-4">
            Remove all health log entries from the database. This action cannot be undone.
          </p>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleteAllMutation.isPending}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:bg-gray-400"
          >
            {deleteAllMutation.isPending ? 'Deleting...' : 'Delete All Entries'}
          </button>
          
          {deleteAllMutation.isError && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              Error: {deleteAllMutation.error?.message || 'Failed to delete entries'}
            </div>
          )}
          
          {deleteAllMutation.isSuccess && (
            <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              Success! Deleted {deleteAllMutation.data?.deletedCount || 0} entries.
            </div>
          )}
        </div>
      </div>
      
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAll}
        title="Delete All Health Logs"
        message="Are you sure you want to delete all health log entries? This action cannot be undone."
        confirmText="Delete All"
        cancelText="Cancel"
      />
    </div>
  );
} 