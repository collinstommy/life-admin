import React, { useState } from 'react';
import { useCreateHealthLogFromText } from '../hooks/useHealthLogs';
import { useNavigate } from '@tanstack/react-router';
import { Instructions } from './Instructions';

export const ManualEntryScreen: React.FC = () => {
  const [text, setText] = useState('');
  const createHealthLog = useCreateHealthLogFromText();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      const newLog = await createHealthLog.mutateAsync({ text });
      if (newLog && newLog.id) {
        navigate({ to: '/view-entry/$id', params: { id: newLog.id.toString() } });
      } else {
        navigate({ to: '/view-entries' });
      }
    } catch (error) {
      // Error handling is managed by the hook's onError callback
      console.error('Failed to create health log:', error);
    }
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-bold mb-4">New Text Entry</h1>
          <Instructions />
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              className="textarea textarea-bordered w-full h-64 text-base"
              placeholder="Enter your health log details here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={createHealthLog.isPending}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createHealthLog.isPending || !text.trim()}
            >
              {createHealthLog.isPending ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Submitting...
                </>
              ) : (
                'Submit'
              )}
            </button>
            {createHealthLog.isError && (
              <div className="alert alert-error">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{createHealthLog.error.message}</span>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};