import React, { useState, useEffect } from 'react';
import { BasicCoachStorage } from '../lib/basic-coach-storage';
import { BasicUserProfile } from '../types/basic-coach';

interface ProfileInputProps {
  onProfileUpdate: (profile: BasicUserProfile) => void;
}

export const ProfileInput: React.FC<ProfileInputProps> = ({ onProfileUpdate }) => {
  const [profileText, setProfileText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const maxChars = 500;

  useEffect(() => {
    const savedProfile = BasicCoachStorage.loadProfile();
    if (savedProfile) {
      setProfileText(savedProfile.profileText);
      setCharCount(savedProfile.profileText.length);
    }
  }, []);

  const handleSave = async () => {
    if (!profileText.trim()) return;

    setIsSaving(true);
    
    const profile: BasicUserProfile = {
      profileText: profileText.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    BasicCoachStorage.saveProfile(profile);
    onProfileUpdate(profile);
    
    setIsSaving(false);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= maxChars) {
      setProfileText(text);
      setCharCount(text.length);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="profile-text" className="block text-sm font-medium text-gray-700 mb-2">
          Tell us about yourself, your health goals, and any context you'd like the coach to know:
        </label>
        <textarea
          id="profile-text"
          value={profileText}
          onChange={handleTextChange}
          onBlur={handleSave}
          placeholder="Example: I'm a 35-year-old software developer looking to improve my energy levels and establish better sleep habits. I work long hours and often skip meals. My goal is to lose 15 pounds and feel more energetic throughout the day."
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          rows={6}
          maxLength={maxChars}
        />
        <div className="flex justify-between items-center mt-1">
          <span className={`text-sm ${charCount >= maxChars ? 'text-red-600' : 'text-gray-500'}`}>
            {charCount}/{maxChars} characters
          </span>
          {isSaving && (
            <span className="text-sm text-blue-600">Saving...</span>
          )}
        </div>
      </div>
    </div>
  );
};