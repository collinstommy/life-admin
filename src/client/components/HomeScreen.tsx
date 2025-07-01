import React from 'react';
import { Link } from '@tanstack/react-router';

export function HomeScreen() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Welcome to Health Tracker
        </h2>
        <p className="text-gray-600">
          Choose an option to get started
        </p>
      </div>

      {/* Grid of large buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        {/* Add Entry Button */}
        <Link
          to="/add-entry"
          className="bg-blue-500 hover:bg-blue-600 text-white p-8 rounded-xl shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl block text-center"
        >
          <div className="text-4xl mb-4">🎙️</div>
          <h3 className="text-xl font-semibold mb-2">Add Entry</h3>
          <p className="text-blue-100">Record your health log</p>
        </Link>

        {/* View Entries Button */}
        <Link
          to="/view-entries"
          className="bg-green-500 hover:bg-green-600 text-white p-8 rounded-xl shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl block text-center"
        >
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-xl font-semibold mb-2">View Entries</h3>
          <p className="text-green-100">Browse your health history</p>
        </Link>

        {/* Debug Button */}
        <Link
          to="/debug"
          className="bg-purple-500 hover:bg-purple-600 text-white p-8 rounded-xl shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl md:col-span-2 block text-center"
        >
          <div className="text-4xl mb-4">🛠️</div>
          <h3 className="text-xl font-semibold mb-2">Debug</h3>
          <p className="text-purple-100">Developer tools and advanced options</p>
        </Link>
      </div>
    </div>
  );
} 