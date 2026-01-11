'use client';

import { Habit } from '@/types';
import Button from './Button';
import Link from 'next/link';

interface HabitCardProps {
  habit: Habit;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export default function HabitCard({ habit, onDelete, isDeleting = false }: HabitCardProps) {
  const trackedCount = habit.trackedDates.length;
  const streak = calculateStreak(habit.trackedDates);

  return (
    <Link href={`/dashboard/calendar?habit=${habit._id}`}>
      <div
        className="bg-slate-800 rounded-2xl shadow-lg p-5 hover:shadow-xl transition-all duration-200 border-t-4 group border border-slate-700 cursor-pointer hover:scale-[1.02]"
        style={{ borderTopColor: habit.color }}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: habit.color }}
                aria-label={`Color: ${habit.color}`}
              />
              <h3 className="text-lg font-bold text-white truncate">
                {habit.name}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold text-white">{trackedCount}</span>
                <span className="text-slate-400">days</span>
              </div>
              {streak > 0 && (
                <div className="flex items-center gap-2 text-orange-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="font-semibold">{streak}</span>
                  <span className="text-slate-400">day streak</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-slate-400 group-hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(habit._id);
              }}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}

function calculateStreak(trackedDates: string[]): number {
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
}

