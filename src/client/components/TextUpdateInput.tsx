import React, { useState } from 'react';

interface TextUpdateInputProps {
  onSubmit: (text: string) => void;
  onCancel: () => void;
  isProcessing?: boolean;
  disabled?: boolean;
}

export function TextUpdateInput({ onSubmit, onCancel, isProcessing = false, disabled = false }: TextUpdateInputProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!text.trim()) {
      setError('Please enter some text before submitting.');
      return;
    }
    if (text.trim().length > 1000) {
      setError('Text update is too long. Please limit to 1000 characters.');
      return;
    }
    setError('');
    onSubmit(text.trim());
  };

  const handleCancel = () => {
    setText('');
    setError('');
    onCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">Text Update</h3>
        <p className="text-xs text-gray-600 mt-1">
          Type natural language updates like "Change my mood to 8", "I also had a snack", or "Actually, my workout was 45 minutes"
        </p>
      </div>
      
      <div className="p-4">
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError('');
          }}
          onKeyDown={handleKeyDown}
          disabled={isProcessing || disabled}
          placeholder="Enter your update here..."
          className="w-full min-h-[120px] p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-50"
          maxLength={1000}
        />
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-3 space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <span className={`text-xs ${text.length > 900 ? 'text-red-600' : 'text-gray-500'}`}>
              {text.length}/1000
            </span>
            <span className="text-xs text-gray-400">Press Ctrl+Enter to submit</span>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
            <button
              onClick={handleCancel}
              disabled={isProcessing || disabled}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isProcessing || disabled || !text.trim()}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                'Submit Update'
              )}
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}