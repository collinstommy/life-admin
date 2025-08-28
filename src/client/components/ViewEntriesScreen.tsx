import React from 'react';
import { Link } from '@tanstack/react-router';
import { useHealthLogs } from '../hooks/useHealthLogs';
import { EntriesList } from './EntriesList';

export function ViewEntriesScreen() {
  const { data: logs, isLoading, error } = useHealthLogs();

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Navigation Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors">
              <span className="icon-[mdi-light--chevron-left] w-5 h-5"></span>
              <span className="text-sm font-medium">Back</span>
            </Link>
            <Link 
              to="/add-entry" 
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Add Entry
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin</h1>
          <p className="text-slate-600">
            {logs?.length || 0} {(logs?.length || 0) === 1 ? 'entry' : 'entries'}
          </p>
        </div>

        {/* Entries List */}
        <EntriesList 
          logs={logs || []} 
          isLoading={isLoading} 
          error={error}
          showActionButtons={true}
        />
      </div>
    </div>
  );
} 