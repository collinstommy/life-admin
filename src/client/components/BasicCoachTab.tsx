import React, { useState, useEffect } from 'react';
import { ProfileInput } from './ProfileInput';
import { ChatInterface } from './ChatInterface';
import { BasicCoachStorage } from '../lib/basic-coach-storage';
import { BasicUserProfile } from '../types/basic-coach';

export const BasicCoachTab: React.FC = () => {
  const [profile, setProfile] = useState<BasicUserProfile | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  useEffect(() => {
    const savedProfile = BasicCoachStorage.loadProfile();
    if (savedProfile && savedProfile.profileText.trim()) {
      setProfile(savedProfile);
      setIsProfileComplete(true);
    }
  }, []);

  const handleProfileUpdate = (updatedProfile: BasicUserProfile) => {
    setProfile(updatedProfile);
    setIsProfileComplete(updatedProfile.profileText.trim().length > 0);
  };

  const handleEditProfile = () => {
    setIsProfileComplete(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
          <h1 className="text-2xl font-bold text-white">AI Health Coach</h1>
          <p className="text-blue-100 text-sm mt-1">
            Get personalized health guidance based on your profile
          </p>
        </div>

        <div className="p-6">
          {!isProfileComplete ? (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Set Up Your Profile
              </h2>
              <p className="text-gray-600 mb-6">
                Tell us about yourself so we can provide personalized health guidance.
              </p>
              <ProfileInput onProfileUpdate={handleProfileUpdate} />
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Chat with Your Health Coach
                </h2>
                <button
                  onClick={handleEditProfile}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Edit Profile
                </button>
              </div>
              <ChatInterface profileText={profile?.profileText || ''} />
            </div>
          )}
        </div>
      </div>

      {/* Profile Preview */}
      {profile && isProfileComplete && (
        <div className="mt-4 bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Your Profile</h3>
          <p className="text-sm text-gray-600 line-clamp-3">
            {profile.profileText}
          </p>
        </div>
      )}
    </div>
  );
};