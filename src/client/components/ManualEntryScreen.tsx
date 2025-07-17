import React, { useState } from 'react';
import { useCreateHealthLogFromText } from '../hooks/useHealthLogs';
import { useNavigate } from '@tanstack/react-router';

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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">New Text Entry</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          className="textarea textarea-bordered w-full h-64"
          placeholder="Enter your health log details here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={createHealthLog.isPending}
        />
        <button
          type="submit"
          className="btn btn-primary mt-4"
          disabled={createHealthLog.isPending || !text.trim()}
        >
          {createHealthLog.isPending ? 'Submitting...' : 'Submit'}
        </button>
        {createHealthLog.isError && (
          <div className="alert alert-error mt-4">
            <p>{createHealthLog.error.message}</p>
          </div>
        )}
      </form>
    </div>
  );
};