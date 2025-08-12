import React from 'react';

export const Instructions: React.FC = () => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        <div className="flex items-center space-x-2 text-blue-700">
          <span className="icon-[mdi--dumbbell] w-4 h-4 flex-shrink-0"></span>
          <span>Exercise</span>
        </div>
        <div className="flex items-center space-x-2 text-blue-700">
          <span className="icon-[mdi--sleep] w-4 h-4 flex-shrink-0"></span>
          <span>Sleep</span>
        </div>
        <div className="flex items-center space-x-2 text-blue-700">
          <span className="icon-[mdi--water] w-4 h-4 flex-shrink-0"></span>
          <span>Hydration</span>
        </div>
        <div className="flex items-center space-x-2 text-blue-700">
          <span className="icon-[mdi--food] w-4 h-4 flex-shrink-0"></span>
          <span>Meals & Snacks</span>
        </div>
        <div className="flex items-center space-x-2 text-blue-700">
          <span className="icon-[mdi--heart-pulse] w-4 h-4 flex-shrink-0"></span>
          <span>Health Symptoms</span>
        </div>
        <div className="flex items-center space-x-2 text-blue-700">
          <span className="icon-[mdi--monitor-cellphone] w-4 h-4 flex-shrink-0"></span>
          <span>Screen Time</span>
        </div>
        <div className="flex items-center space-x-2 text-blue-700">
          <span className="icon-[mdi--emoticon-happy] w-4 h-4 flex-shrink-0"></span>
          <span>Mood</span>
        </div>
        <div className="flex items-center space-x-2 text-blue-700">
          <span className="icon-[mdi--lightning-bolt] w-4 h-4 flex-shrink-0"></span>
          <span>Energy</span>
        </div>
        <div className="flex items-center space-x-2 text-blue-700">
          <span className="icon-[mdi--note-text] w-4 h-4 flex-shrink-0"></span>
          <span>Notes</span>
        </div>
      </div>
    </div>
  );
};