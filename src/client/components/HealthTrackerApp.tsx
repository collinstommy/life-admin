import React, { useState } from 'react';
import { VoiceRecorder } from './VoiceRecorder';
import { TranscriptProcessor } from './TranscriptProcessor';
import { HistoryView } from './HistoryView';
import { LoginForm } from './LoginForm';
import { useAuth } from '../hooks/useAuth';

type Tab = 'recorder' | 'transcript' | 'history';

export function HealthTrackerApp() {
  const [activeTab, setActiveTab] = useState<Tab>('recorder');
  const { isAuthenticated, isLoading, logout } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div className="container mx-auto p-4">
      {/* Header with logout */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Health Tracker</h1>
        <button
          onClick={logout}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Sign Out
        </button>
      </div>
      
      {/* Tab Navigation */}
      <nav className="flex justify-center mb-6">
        <div className="bg-white rounded-lg shadow-md p-1">
          <button 
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'recorder' 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-600 hover:text-blue-500'
            }`}
            onClick={() => setActiveTab('recorder')}
          >
            🎙️ Voice Recorder
          </button>
          <button 
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'transcript' 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-600 hover:text-blue-500'
            }`}
            onClick={() => setActiveTab('transcript')}
          >
            📝 Transcript
          </button>
          <button 
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'history' 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-600 hover:text-blue-500'
            }`}
            onClick={() => setActiveTab('history')}
          >
            📊 History
          </button>
        </div>
      </nav>

      {/* Tab Content */}
      <main className="max-w-4xl mx-auto">
        {activeTab === 'recorder' && <VoiceRecorder />}
        {activeTab === 'transcript' && <TranscriptProcessor />}
        {activeTab === 'history' && <HistoryView />}
      </main>
    </div>
  );
} 