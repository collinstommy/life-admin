import React from 'react';
import { Link } from '@tanstack/react-router';

export function DebugScreen() {
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
        </div>

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
    </div>
  );
} 