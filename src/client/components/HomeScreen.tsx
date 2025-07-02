import React from 'react';
import { Link } from '@tanstack/react-router';

export function HomeScreen() {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Grid of navigation cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {/* Add Entry Button */}
          <Link
            to="/add-entry"
            className="bg-white hover:bg-gray-50 p-6 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md hover:scale-105 block text-center group"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
              <span className="text-blue-600 text-2xl">🎙️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Entry</h3>
            <p className="text-gray-600 text-sm">Record your health log</p>
          </Link>

          {/* View Entries Button */}
          <Link
            to="/view-entries"
            className="bg-white hover:bg-gray-50 p-6 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md hover:scale-105 block text-center group"
          >
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
              <span className="text-green-600 text-2xl">📊</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">View Entries</h3>
            <p className="text-gray-600 text-sm">Browse your health history</p>
          </Link>

          {/* Debug Button */}
          <Link
            to="/debug"
            className="bg-white hover:bg-gray-50 p-6 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md hover:scale-105 md:col-span-2 block text-center group"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
              <span className="text-purple-600 text-2xl">🛠️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Debug</h3>
            <p className="text-gray-600 text-sm">Developer tools and advanced options</p>
          </Link>
        </div>
      </div>
    </div>
  );
} 