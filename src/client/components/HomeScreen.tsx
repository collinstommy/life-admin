import React from 'react';
import { Link } from '@tanstack/react-router';
import { useHealthLogs } from '../hooks/useHealthLogs';
import { EntriesList } from './EntriesList';

export function HomeScreen() {
  const { data: logs, isLoading } = useHealthLogs();

  const N_ENTRIES_TO_SHOW = 7;

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-lg font-semibold text-slate-900">Admin</h1>
              </div>
            </div>
            <Link 
              to="/add-entry" 
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Add Entry
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Action Cards Grid */}
        <div className="mb-8">
          <div className="grid grid-cols-5 gap-3 md:gap-6">
            {/* Voice Entry */}
            <Link
              to="/add-entry"
              className="glass-card rounded-xl p-3 md:p-6 cursor-pointer hover:scale-105 transition-all duration-200 block group"
            >
              <div className="w-10 h-10 md:w-16 md:h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg md:rounded-2xl flex items-center justify-center mx-auto mb-2 md:mb-4">
                <svg className="w-5 h-5 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                </svg>
              </div>
              <h3 className="text-xs md:text-xl font-semibold text-slate-900 text-center">Voice Health</h3>
            </Link>

            {/* Text Entry */}
            <Link
              to="/add-text-entry"
              className="glass-card rounded-xl p-3 md:p-6 cursor-pointer hover:scale-105 transition-all duration-200 block group"
            >
              <div className="w-10 h-10 md:w-16 md:h-16 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-lg md:rounded-2xl flex items-center justify-center mx-auto mb-2 md:mb-4">
                <svg className="w-5 h-5 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
              </div>
              <h3 className="text-xs md:text-xl font-semibold text-slate-900 text-center">Text Health</h3>
            </Link>

            {/* View Entries */}
            <Link
              to="/view-entries"
              className="glass-card rounded-xl p-3 md:p-6 cursor-pointer hover:scale-105 transition-all duration-200 block group"
            >
              <div className="w-10 h-10 md:w-16 md:h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-lg md:rounded-2xl flex items-center justify-center mx-auto mb-2 md:mb-4">
                <svg className="w-5 h-5 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
              <h3 className="text-xs md:text-xl font-semibold text-slate-900 text-center">View</h3>
            </Link>

            {/* Agent */}
            <Link
              to="/agent"
              className="glass-card rounded-xl p-3 md:p-6 cursor-pointer hover:scale-105 transition-all duration-200 block group"
            >
              <div className="w-10 h-10 md:w-16 md:h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg md:rounded-2xl flex items-center justify-center mx-auto mb-2 md:mb-4">
                <svg className="w-5 h-5 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
              </div>
              <h3 className="text-xs md:text-xl font-semibold text-slate-900 text-center">Agent</h3>
            </Link>

            {/* Debug Tools */}
            <Link
              to="/debug"
              className="glass-card rounded-xl p-3 md:p-6 cursor-pointer hover:scale-105 transition-all duration-200 block group"
            >
              <div className="w-10 h-10 md:w-16 md:h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg md:rounded-2xl flex items-center justify-center mx-auto mb-2 md:mb-4">
                <svg className="w-5 h-5 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <h3 className="text-xs md:text-xl font-semibold text-slate-900 text-center">Debug</h3>
            </Link>
          </div>
        </div>

        {/* Recent Entries Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Recent Entries</h2>
            {logs && logs.length > N_ENTRIES_TO_SHOW && (
              <Link 
                to="/view-entries" 
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                View All
              </Link>
            )}
          </div>
        </div>

        {/* Entries List */}
        <EntriesList 
          logs={logs || []} 
          isLoading={isLoading} 
          length={N_ENTRIES_TO_SHOW}
          showActionButtons={true}
        />
      </main>
    </div>
  );
} 