import React, { useState, useEffect } from 'react';
import { useCreateHealthLogFromText } from '../hooks/useHealthLogs';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Instructions } from './Instructions';

interface FormData {
  // Date
  date: string;
  
  // Basic Info
  sleep: string;
  energy: string;
  mood: string;
  
  // Meals
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: string;
  
  // Beverages
  coffee: string;
  water: string;
  otherDrinks: string;
  alcohol: string;
  
  // Exercise & Health
  workouts: string;
  weight: string;
  
  // Pain & Notes
  pain: string;
  notes: string;
}

const formDataToText = (data: FormData): string => {
  const parts: string[] = [];
  
  // Always include the date at the beginning
  if (data.date) {
    parts.push(`Date: ${data.date}`);
  }
  
  // Basic Info
  if (data.sleep) parts.push(`I slept ${data.sleep} hours`);
  if (data.energy) parts.push(`Energy level: ${data.energy}/10`);
  if (data.mood) parts.push(`Mood: ${data.mood}/10`);
  
  // Meals
  if (data.breakfast) parts.push(`Breakfast: ${data.breakfast}`);
  if (data.lunch) parts.push(`Lunch: ${data.lunch}`);
  if (data.dinner) parts.push(`Dinner: ${data.dinner}`);
  if (data.snacks) parts.push(`Snacks: ${data.snacks}`);
  
  // Beverages
  if (data.coffee) parts.push(`Coffee/Tea: ${data.coffee}`);
  if (data.water) parts.push(`Water: ${data.water} liters`);
  if (data.otherDrinks) parts.push(`Other drinks: ${data.otherDrinks}`);
  if (data.alcohol) parts.push(`Alcohol: ${data.alcohol}`);
  
  // Exercise & Health
  if (data.workouts) parts.push(`Workouts: ${data.workouts}`);
  if (data.weight) parts.push(`Weight: ${data.weight} kg`);
  
  // Pain & Notes
  if (data.pain) parts.push(`Pain/discomfort: ${data.pain}`);
  if (data.notes) parts.push(`Additional notes: ${data.notes}`);
  
  return parts.filter(p => p).join('. ');
};

export const ManualEntryScreen: React.FC = () => {
  // Get date from search params if provided
  const search = useSearch({ from: '/add-text-entry' }) as { date?: string };
  
  // Initialize with provided date or today's date
  const defaultDate = search?.date || new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState<FormData>({
    date: defaultDate,
    sleep: '',
    energy: '',
    mood: '',
    breakfast: '',
    lunch: '',
    dinner: '',
    snacks: '',
    coffee: '',
    water: '',
    otherDrinks: '',
    alcohol: '',
    workouts: '',
    weight: '',
    pain: '',
    notes: '',
  });
  const createHealthLog = useCreateHealthLogFromText();
  const navigate = useNavigate();

  // Update form data when search params change
  useEffect(() => {
    if (search?.date && search.date !== formData.date) {
      setFormData(prev => ({ ...prev, date: search.date! }));
    }
  }, [search?.date]);

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const hasAnyContent = Object.values(formData).some(value => value.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAnyContent) return;

    const text = formDataToText(formData);
    
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
      <style>{`
        .section-card {
          backdrop-filter: blur(10px);
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
      `}</style>
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
              <h1 className="text-2xl font-bold text-slate-900">Structured Health Entry</h1>
              <p className="text-slate-600">Fill in your daily health details</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Date Section */}
            <fieldset className="fieldset section-card rounded-xl">
              <legend className="fieldset-legend text-lg font-semibold text-slate-900 flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                Date
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Entry Date</legend>
                  <input 
                    type="date" 
                    className="input input-bordered rounded-lg" 
                    value={formData.date}
                    onChange={(e) => updateField('date', e.target.value)}
                    disabled={createHealthLog.isPending}
                    required
                  />
                </fieldset>
              </div>
            </fieldset>

            {/* Basic Info Section */}
            <fieldset className="fieldset section-card rounded-xl">
              <legend className="fieldset-legend text-lg font-semibold text-slate-900 flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Basic Information
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Sleep (hours)</legend>
                  <input 
                    type="number" 
                    step="0.5" 
                    min="0" 
                    max="24" 
                    className="input input-bordered rounded-lg" 
                    placeholder="8.5"
                    value={formData.sleep}
                    onChange={(e) => updateField('sleep', e.target.value)}
                    disabled={createHealthLog.isPending}
                  />
                </fieldset>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Energy Level (1-10)</legend>
                  <input 
                    type="number" 
                    min="1" 
                    max="10" 
                    className="input input-bordered rounded-lg" 
                    placeholder="7"
                    value={formData.energy}
                    onChange={(e) => updateField('energy', e.target.value)}
                    disabled={createHealthLog.isPending}
                  />
                </fieldset>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Mood (1-10)</legend>
                  <input 
                    type="number" 
                    min="1" 
                    max="10" 
                    className="input input-bordered rounded-lg" 
                    placeholder="8"
                    value={formData.mood}
                    onChange={(e) => updateField('mood', e.target.value)}
                    disabled={createHealthLog.isPending}
                  />
                </fieldset>
              </div>
            </fieldset>

            {/* Meals Section */}
            <fieldset className="fieldset section-card rounded-xl">
              <legend className="fieldset-legend text-lg font-semibold text-slate-900 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Meals & Nutrition
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">🌅 Breakfast</legend>
                  <textarea 
                    className="textarea textarea-bordered rounded-lg h-16" 
                    placeholder="Greek yogurt with berries and granola"
                    value={formData.breakfast}
                    onChange={(e) => updateField('breakfast', e.target.value)}
                    disabled={createHealthLog.isPending}
                  ></textarea>
                </fieldset>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">☀️ Lunch</legend>
                  <textarea 
                    className="textarea textarea-bordered rounded-lg h-16" 
                    placeholder="Grilled chicken salad with mixed vegetables"
                    value={formData.lunch}
                    onChange={(e) => updateField('lunch', e.target.value)}
                    disabled={createHealthLog.isPending}
                  ></textarea>
                </fieldset>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">🌙 Dinner</legend>
                  <textarea 
                    className="textarea textarea-bordered rounded-lg h-16" 
                    placeholder="Salmon with quinoa and steamed broccoli"
                    value={formData.dinner}
                    onChange={(e) => updateField('dinner', e.target.value)}
                    disabled={createHealthLog.isPending}
                  ></textarea>
                </fieldset>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">🍎 Snacks</legend>
                  <textarea 
                    className="textarea textarea-bordered rounded-lg h-16" 
                    placeholder="Apple with almond butter, handful of nuts"
                    value={formData.snacks}
                    onChange={(e) => updateField('snacks', e.target.value)}
                    disabled={createHealthLog.isPending}
                  ></textarea>
                </fieldset>
              </div>
            </fieldset>

            {/* Beverages Section */}
            <fieldset className="fieldset section-card rounded-xl">
              <legend className="fieldset-legend text-lg font-semibold text-slate-900 flex items-center">
                <span className="w-2 h-2 bg-amber-500 rounded-full mr-3"></span>
                Beverages
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">☕ Coffee/Tea</legend>
                  <input 
                    type="text" 
                    className="input input-bordered rounded-lg" 
                    placeholder="2 cups coffee, 1 green tea"
                    value={formData.coffee}
                    onChange={(e) => updateField('coffee', e.target.value)}
                    disabled={createHealthLog.isPending}
                  />
                </fieldset>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">💧 Water (liters)</legend>
                  <input 
                    type="number" 
                    min="0" 
                    className="input input-bordered rounded-lg" 
                    placeholder="8"
                    value={formData.water}
                    onChange={(e) => updateField('water', e.target.value)}
                    disabled={createHealthLog.isPending}
                  />
                </fieldset>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">🥤 Other Drinks</legend>
                  <input 
                    type="text" 
                    className="input input-bordered rounded-lg" 
                    placeholder="Smoothie, kombucha"
                    value={formData.otherDrinks}
                    onChange={(e) => updateField('otherDrinks', e.target.value)}
                    disabled={createHealthLog.isPending}
                  />
                </fieldset>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">🍷 Alcohol</legend>
                  <input 
                    type="text" 
                    className="input input-bordered rounded-lg" 
                    placeholder="1 glass wine"
                    value={formData.alcohol}
                    onChange={(e) => updateField('alcohol', e.target.value)}
                    disabled={createHealthLog.isPending}
                  />
                </fieldset>
              </div>
            </fieldset>

            {/* Exercise Section */}
            <fieldset className="fieldset section-card rounded-xl">
              <legend className="fieldset-legend text-lg font-semibold text-slate-900 flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                Exercise & Activity
              </legend>
              <fieldset className="fieldset">
                <legend className="fieldset-legend">🏃‍♀️ Workouts</legend>
                <textarea 
                  className="textarea textarea-bordered rounded-lg h-16" 
                  placeholder="45 min strength training - upper body, 30 min walk, yoga stretching"
                  value={formData.workouts}
                  onChange={(e) => updateField('workouts', e.target.value)}
                  disabled={createHealthLog.isPending}
                ></textarea>
              </fieldset>
            </fieldset>

            {/* Health Metrics Section */}
            <fieldset className="fieldset section-card rounded-xl">
              <legend className="fieldset-legend text-lg font-semibold text-slate-900 flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                Health Metrics
              </legend>
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Weight (lbs/kg)</legend>
                <input 
                  type="number" 
                  step="0.1" 
                  className="input input-bordered rounded-lg" 
                  placeholder="150.5"
                  value={formData.weight}
                  onChange={(e) => updateField('weight', e.target.value)}
                  disabled={createHealthLog.isPending}
                />
              </fieldset>
            </fieldset>

            {/* Pain & Symptoms Section */}
            <fieldset className="fieldset section-card rounded-xl">
              <legend className="fieldset-legend text-lg font-semibold text-slate-900 flex items-center">
                <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
                Pain & Symptoms
              </legend>
              <fieldset className="fieldset">
                <legend className="fieldset-legend">🩹 Pain/Discomfort</legend>
                <input 
                  type="text" 
                  className="input input-bordered rounded-lg" 
                  placeholder="Lower back pain level 3, mild headache in afternoon"
                  value={formData.pain}
                  onChange={(e) => updateField('pain', e.target.value)}
                  disabled={createHealthLog.isPending}
                />
              </fieldset>
            </fieldset>

            {/* Additional Notes Section */}
            <fieldset className="fieldset section-card rounded-xl">
              <legend className="fieldset-legend text-lg font-semibold text-slate-900 flex items-center">
                <span className="w-2 h-2 bg-teal-500 rounded-full mr-3"></span>
                Additional Notes
              </legend>
              <fieldset className="fieldset">
                <legend className="fieldset-legend">General Notes</legend>
                <textarea 
                  className="textarea textarea-bordered rounded-lg h-20" 
                  placeholder="Overall good day, felt productive at work, looking forward to weekend hiking trip..."
                  value={formData.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  disabled={createHealthLog.isPending}
                ></textarea>
              </fieldset>
            </fieldset>
            
            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-2">
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
                disabled={createHealthLog.isPending || !hasAnyContent}
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