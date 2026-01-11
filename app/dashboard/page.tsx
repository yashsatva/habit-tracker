'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { Habit } from '@/types';
import Button from '@/components/Button';
import Input from '@/components/Input';
import HabitCard from '@/components/HabitCard';
import StatsCard from '@/components/StatsCard';
import StreakDisplay from '@/components/StreakDisplay';
import ConfirmModal from '@/components/ConfirmModal';

export default function DashboardPage() {
  const router = useRouter();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitColor, setNewHabitColor] = useState('#3b82f6');
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [habitToDelete, setHabitToDelete] = useState<{ id: string; name: string } | null>(null);

  const presetColors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
  ];

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      const response = await fetch('/api/habits');
      if (response.ok) {
        const data = await response.json();
        setHabits(data.habits || []);
      } else {
        if (response.status === 401) {
          router.push('/login');
        }
      }
    } catch (err) {
      console.error('Error fetching habits:', err);
      setError('Failed to load habits');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddHabit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!newHabitName.trim()) {
      setError('Habit name is required');
      return;
    }

    setIsAdding(true);

    try {
      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newHabitName.trim(),
          color: newHabitColor,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create habit');
        return;
      }

      setHabits([data.habit, ...habits]);
      setNewHabitName('');
      setNewHabitColor('#3b82f6');
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setHabitToDelete({ id, name });
  };

  const handleDeleteConfirm = async () => {
    if (!habitToDelete) return;

    const id = habitToDelete.id;
    setDeletingId(id);

    try {
      const response = await fetch(`/api/habits/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete habit');
      }

      setHabits(habits.filter((habit) => habit._id !== id));
    } catch (err) {
      setError('Failed to delete habit');
    } finally {
      setDeletingId(null);
      setHabitToDelete(null);
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  // Calculate stats
  const totalHabits = habits.length;
  const totalTrackedDays = habits.reduce((sum, h) => sum + h.trackedDates.length, 0);
  const today = new Date().toISOString().split('T')[0];
  const todayCompleted = habits.filter(h => h.trackedDates.includes(today)).length;
  const completionRate = totalHabits > 0 ? Math.round((todayCompleted / totalHabits) * 100) : 0;

  const calculateStreak = (trackedDates: string[]): number => {
    if (trackedDates.length === 0) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Convert tracked dates to Date objects and filter out future dates
    const trackedDatesList = trackedDates
      .map(dateStr => {
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);
        return date;
      })
      .filter(date => date <= today) // Exclude future dates
      .sort((a, b) => b.getTime() - a.getTime()); // Sort descending
    
    if (trackedDatesList.length === 0) return 0;
    
    // Check if today is tracked
    const todayStr = today.toISOString().split('T')[0];
    const isTodayTracked = trackedDates.includes(todayStr);
    
    let streak = 0;
    let checkDate = new Date(today);
    
    // Start from today if tracked, or yesterday if not
    if (!isTodayTracked) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    // Count consecutive days backwards
    for (const trackedDate of trackedDatesList) {
      const diffTime = checkDate.getTime() - trackedDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (diffDays > 0) {
        // Gap found, streak broken
        break;
      }
    }
    
    return streak;
  };

  const allStreaks = habits.map(h => calculateStreak(h.trackedDates));
  const longestStreak = Math.max(...allStreaks, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <nav className="bg-slate-800/80 backdrop-blur-lg shadow-lg border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-row justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white">
                Habit Tracker
              </h1>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Stats Cards */}
        {habits.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <StatsCard
              title="Total Habits"
              value={totalHabits}
              icon={
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
              color="blue"
            />
            <StatsCard
              title="Tracked Days"
              value={totalTrackedDays}
              icon={
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              color="green"
            />
            <StatsCard
              title="Today"
              value={`${todayCompleted}/${totalHabits}`}
              icon={
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
              color="orange"
            />
            <StatsCard
              title="Longest Streak"
              value={longestStreak}
              icon={
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
              color="purple"
            />
          </div>
        )}

        {/* Streak Display */}
        {habits.length > 0 && (
          <div className="mb-6">
            <StreakDisplay habits={habits} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Add Habit Form */}
          <div className="lg:col-span-1 lg:sticky lg:top-20 lg:self-start">
            <div className="bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Habit
              </h2>
              <form onSubmit={handleAddHabit} className="space-y-6">
                <div>
                  <Input
                    id="habit-name"
                    label="Habit Name"
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    placeholder="e.g., Exercise, Read, Meditate"
                    required
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-4">
                    Choose Color
                  </label>
                  
                  {/* Preset Color Options */}
                  <div className="grid grid-cols-5 gap-3 mb-4">
                    {presetColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewHabitColor(color)}
                        className={`relative w-full aspect-square rounded-xl border-2 transition-all transform hover:scale-105 active:scale-95 ${
                          newHabitColor === color
                            ? 'border-white scale-110 shadow-xl ring-4 ring-offset-2 ring-white ring-offset-slate-800'
                            : 'border-slate-600 hover:border-slate-400'
                        }`}
                        style={{ backgroundColor: color }}
                        aria-label={`Select color ${color}`}
                      >
                        {newHabitColor === color && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Custom Color Picker */}
                  <div className="relative">
                    <label className="block text-xs text-slate-400 mb-2">Or choose custom color</label>
                    <div className="relative">
                      <input
                        type="color"
                        value={newHabitColor}
                        onChange={(e) => setNewHabitColor(e.target.value)}
                        className="w-full h-14 rounded-xl cursor-pointer border-2 border-slate-600 bg-slate-700 hover:border-slate-500 transition-colors"
                      />
                      <div className="absolute top-1/2 left-4 transform -translate-y-1/2 pointer-events-none">
                        <div 
                          className="w-8 h-8 rounded-lg shadow-lg border-2 border-white/20"
                          style={{ backgroundColor: newHabitColor }}
                        />
                      </div>
                      <div className="absolute top-1/2 right-4 transform -translate-y-1/2 pointer-events-none">
                        <span className="text-xs text-slate-400 font-mono">{newHabitColor.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg bg-red-900/30 border border-red-700 p-3 animate-in fade-in">
                    <p className="text-sm text-red-300 font-medium">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={isAdding}
                >
                  {isAdding ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adding...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Habit
                    </span>
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Habits List */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                Your Habits
              </h2>
              <p className="text-slate-400">
                {habits.length === 0
                  ? 'No habits yet. Create one to get started!'
                  : `You're tracking ${habits.length} habit${habits.length !== 1 ? 's' : ''}`}
              </p>
            </div>

            {habits.length === 0 ? (
              <div className="bg-slate-800 rounded-2xl shadow-lg p-12 text-center border border-slate-700">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 rounded-full mb-4">
                  <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-slate-300 text-lg font-medium mb-2">
                  No habits yet
                </p>
                <p className="text-slate-500 text-sm">
                  Start tracking your habits today!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                {habits.map((habit) => (
                  <HabitCard
                    key={habit._id}
                    habit={habit}
                    onDelete={() => handleDeleteClick(habit._id, habit.name)}
                    isDeleting={deletingId === habit._id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!habitToDelete}
        onClose={() => setHabitToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Habit"
        message={`Are you sure you want to delete "${habitToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}

