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
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Navigation Header */}
      <div className="glass-card sticky top-0 z-50 border-b border-slate-200/50 rounded-b-2xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate({ to: '/' })}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 rounded-lg transition-colors"
            >
              <span className="icon-[mdi--chevron-left] w-5 h-5 mr-2"></span>
              Back
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">📝</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">New Text Entry</h1>
              <p className="text-slate-600">Enter your health update details</p>
            </div>
          </div>
          
          <Instructions />
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-slate-900">Health Log Details</span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full h-64 text-base rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Enter your health log details here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={createHealthLog.isPending}
              />
              <label className="label">
                <span className="label-text-alt text-slate-500">Describe your day, activities, mood, energy, sleep, meals, and any other health observations</span>
              </label>
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate({ to: '/' })}
                className="btn btn-ghost text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary px-6"
                disabled={createHealthLog.isPending || !text.trim()}
              >
                {createHealthLog.isPending ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Submitting...
                  </>
                ) : (
                  'Submit Entry'
                )}
              </button>
            </div>
            
            {createHealthLog.isError && (
              <div className="glass-card bg-red-50/50 border-red-200 rounded-xl p-4">
                <div className="flex items-center space-x-2">
                  <span className="icon-[mdi--alert] w-5 h-5 text-red-600"></span>
                  <div>
                    <p className="text-red-700 font-semibold">Submission Failed</p>
                    <p className="text-red-600 text-sm">{createHealthLog.error?.message}</p>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};