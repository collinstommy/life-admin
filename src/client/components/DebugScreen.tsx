import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useDeleteAllHealthLogs, useSeedDatabase } from '../hooks/useHealthLogs';
import { ConfirmDialog } from './ConfirmDialog';

export function DebugScreen() {
  const deleteAllMutation = useDeleteAllHealthLogs();
  const seedMutation = useSeedDatabase();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();

  const handleSeedDatabase = () => {
    seedMutation.mutate();
  };

  const handleDeleteAll = () => {
    deleteAllMutation.mutate();
    setShowDeleteConfirm(false);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Navigation Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <button
              onClick={() => navigate({ to: '/' })}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="icon-[mdi-light--chevron-left] w-4 h-4 mr-2"></span>
              Back
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
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

          {/* Edit Validation Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Edit Validation Testing</h2>
            <p className="text-gray-600 mb-4">
              Test and validate the AI edit/merge functionality with different scenarios and track accuracy improvements.
            </p>
            <button
              onClick={() => navigate({ to: '/debug/edit-validation' })}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Test Edit Validation
            </button>
          </div>

          {/* Design System Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Design System</h2>
            <p className="text-gray-600 mb-4">
              View our complete design system with all components, colors, and guidelines.
            </p>
            <button
              onClick={() => navigate({ to: '/debug/design-system' })}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors"
            >
              View Design System
            </button>
          </div>

          {/* Expenses Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Expenses</h2>
            <p className="text-gray-600 mb-4">
              View and manage all expenses in the system.
            </p>
            <button
              onClick={() => navigate({ to: '/expenses' })}
              className="bg-emerald-500 text-white px-4 py-2 rounded hover:bg-emerald-600 transition-colors"
            >
              View Expenses
            </button>
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
      </div>
    </div>
  );
} 