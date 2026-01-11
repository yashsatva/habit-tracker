'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Habit } from '@/types';
import Calendar from '@/components/Calendar';
import Button from '@/components/Button';
import Link from 'next/link';

function CalendarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedHabitId = searchParams.get('habit');

  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filteredHabits, setFilteredHabits] = useState<Habit[]>([]);

  useEffect(() => {
    fetchHabits();
  }, []);

  useEffect(() => {
    // Wait until loading is complete before processing
    if (isLoading) {
      return;
    }

    // If no habit is selected, redirect to dashboard
    if (!selectedHabitId) {
      router.push('/dashboard');
      return;
    }

    // If habits are loaded and we have a selected habit ID
    if (selectedHabitId && habits.length > 0) {
      const filtered = habits.filter((h) => h._id === selectedHabitId);
      if (filtered.length === 0) {
        // Habit not found, redirect to dashboard
        router.push('/dashboard');
        return;
      }
      setFilteredHabits(filtered);
    } else if (selectedHabitId && habits.length === 0) {
      // Selected habit ID exists but no habits found - might be loading or no habits exist
      // Wait a bit and then check again, or just show loading
      setFilteredHabits([]);
    }
  }, [selectedHabitId, habits, isLoading, router]);

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
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleDate = async (habitId: string, date: string) => {
    try {
      const response = await fetch('/api/habits/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ habitId, date }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle date');
      }

      const data = await response.json();

      // Update the habit in the local state
      const updatedHabits = habits.map((habit) =>
        habit._id === habitId ? data.habit : habit
      );
      setHabits(updatedHabits);
      
      // Also update filteredHabits if this is the currently selected habit
      if (habitId === selectedHabitId) {
        const updatedFiltered = updatedHabits.filter((h) => h._id === selectedHabitId);
        if (updatedFiltered.length > 0) {
          setFilteredHabits(updatedFiltered);
        }
      }
    } catch (error) {
      console.error('Error toggling date:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show loading state while we're processing the habit selection
  if (!selectedHabitId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If habits are loaded but the selected habit is not found yet, wait a moment
  if (selectedHabitId && habits.length > 0 && filteredHabits.length === 0) {
    // Check if the habit actually exists
    const habitExists = habits.some((h) => h._id === selectedHabitId);
    if (!habitExists) {
      // Habit doesn't exist, show error and redirect
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
          <div className="text-center">
            <p className="text-slate-400 mb-4">Habit not found</p>
            <Link href="/dashboard">
              <Button variant="primary">Go to Dashboard</Button>
            </Link>
          </div>
        </div>
      );
    }
    // Habit exists but filteredHabits hasn't been set yet, show loading
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If we still don't have filtered habits, show error
  if (filteredHabits.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <p className="text-slate-400 mb-4">No habit selected</p>
          <Link href="/dashboard">
            <Button variant="primary">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const selectedHabit = filteredHabits[0];

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <nav className="bg-slate-800/80 backdrop-blur-lg shadow-lg border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-row justify-between items-center py-4">
            <Link href="/dashboard" className="flex items-center gap-3 flex-1 min-w-0">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
                style={{ backgroundColor: selectedHabit.color }}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
                  {selectedHabit.name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  {selectedHabit.trackedDates.length} days tracked
                </p>
              </div>
            </Link>
            <div className="flex items-center gap-2 ml-4">
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Calendar habits={filteredHabits} onToggleDate={handleToggleDate} />
      </main>
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <CalendarContent />
    </Suspense>
  );
}

