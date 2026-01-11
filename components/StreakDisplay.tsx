'use client';

import { Habit } from '@/types';

interface StreakDisplayProps {
  habits: Habit[];
}

export default function StreakDisplay({ habits }: StreakDisplayProps) {
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

  const getLongestStreak = (trackedDates: string[]): number => {
    if (trackedDates.length === 0) return 0;
    
    const sortedDates = trackedDates
      .map(date => new Date(date))
      .sort((a, b) => a.getTime() - b.getTime())
      .map(date => {
        date.setHours(0, 0, 0, 0);
        return date;
      });
    
    let maxStreak = 1;
    let currentStreak = 1;
    
    for (let i = 1; i < sortedDates.length; i++) {
      const diffTime = sortedDates[i].getTime() - sortedDates[i - 1].getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }
    
    return maxStreak;
  };

  const getCurrentStreakForHabit = (habit: Habit): number => {
    return calculateStreak(habit.trackedDates);
  };

  const getLongestStreakForHabit = (habit: Habit): number => {
    return getLongestStreak(habit.trackedDates);
  };

  const allStreaks = habits.map(h => getCurrentStreakForHabit(h));
  const currentStreak = Math.max(...allStreaks, 0);
  const longestStreak = Math.max(...habits.map(h => getLongestStreakForHabit(h)), 0);
  const totalTrackedDays = habits.reduce((sum, h) => sum + h.trackedDates.length, 0);

  if (habits.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Current Streak Banner */}
      {currentStreak > 0 && (
        <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-6 shadow-xl border border-orange-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-20">
            <svg className="w-32 h-32 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className="text-lg font-semibold text-white">Current Streak</h3>
            </div>
            <div className="text-5xl font-bold text-white mb-2">{currentStreak}</div>
            <p className="text-orange-100 text-sm">
              {currentStreak === longestStreak 
                ? 'Your longest streak! Keep it going! 🔥' 
                : `You're on fire! Keep going! 🔥`}
            </p>
          </div>
        </div>
      )}

      {/* Individual Habit Streaks */}
      {habits.length > 0 && (
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Habit Streaks</h3>
          <div className="space-y-3">
            {habits.map((habit) => {
              const streak = getCurrentStreakForHabit(habit);
              const longest = getLongestStreakForHabit(habit);
              return (
                <div key={habit._id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: habit.color }}
                    />
                    <span className="text-white font-medium truncate">{habit.name}</span>
                  </div>
                  <div className="flex items-center gap-4 ml-3">
                    <div className="text-right">
                      <div className="text-white font-bold text-lg">{streak}</div>
                      <div className="text-slate-400 text-xs">days</div>
                    </div>
                    {longest > streak && (
                      <div className="text-right border-l border-slate-600 pl-4">
                        <div className="text-slate-400 font-semibold text-sm">Best: {longest}</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

