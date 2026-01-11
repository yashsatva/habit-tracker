'use client';

import { useState, useEffect } from 'react';
import { Habit } from '@/types';

interface CalendarProps {
  habits: Habit[];
  onToggleDate: (habitId: string, date: string) => Promise<void>;
}

export default function Calendar({ habits, onToggleDate }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [trackingStates, setTrackingStates] = useState<Record<string, boolean>>({});
  const [isToggling, setIsToggling] = useState<string | null>(null);

  // Initialize tracking states from habits
  useEffect(() => {
    const states: Record<string, boolean> = {};
    habits.forEach((habit) => {
      habit.trackedDates.forEach((date) => {
        states[`${habit._id}-${date}`] = true;
      });
    });
    setTrackingStates(states);
  }, [habits]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Get previous month days to fill the calendar
  const prevMonthDays = new Date(year, month, 0).getDate();
  interface DayInfo {
    date: number;
    isCurrentMonth: boolean;
    fullDate: Date;
  }
  const daysToShow: DayInfo[] = [];

  // Add previous month's trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const date = prevMonthDays - i;
    daysToShow.push({ date, isCurrentMonth: false, fullDate: new Date(year, month - 1, date) });
  }

  // Add current month's days
  for (let date = 1; date <= daysInMonth; date++) {
    daysToShow.push({ date, isCurrentMonth: true, fullDate: new Date(year, month, date) });
  }

  // Add next month's leading days to complete the grid
  const remainingDays = 42 - daysToShow.length; // 6 rows × 7 days = 42
  for (let date = 1; date <= remainingDays; date++) {
    daysToShow.push({ date, isCurrentMonth: false, fullDate: new Date(year, month + 1, date) });
  }

  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isFutureDate = (date: Date): boolean => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate > today;
  };

  const handleToggle = async (habitId: string, date: Date) => {
    if (isToggling || isFutureDate(date)) return;

    const dateString = formatDateToString(date);
    const key = `${habitId}-${dateString}`;
    const currentState = trackingStates[key] || false;

    setIsToggling(key);
    setTrackingStates((prev) => ({
      ...prev,
      [key]: !currentState,
    }));

    try {
      await onToggleDate(habitId, dateString);
    } catch (error) {
      // Revert on error
      setTrackingStates((prev) => ({
        ...prev,
        [key]: currentState,
      }));
    } finally {
      setIsToggling(null);
    }
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const today = new Date();
  const isToday = (date: Date) =>
    date.toDateString() === today.toDateString();

  // Calculate streak for display - consecutive days from today backwards
  const calculateCurrentStreak = () => {
    if (habits.length === 0) return 0;
    const habit = habits[0]; // Only one habit in this view
    if (habit.trackedDates.length === 0) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Convert tracked dates to Date objects and sort descending
    const trackedDates = habit.trackedDates
      .map(dateStr => {
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);
        return date;
      })
      .filter(date => date <= today) // Exclude future dates
      .sort((a, b) => b.getTime() - a.getTime()); // Sort descending
    
    if (trackedDates.length === 0) return 0;
    
    // Check if today is tracked
    const todayStr = formatDateToString(today);
    const isTodayTracked = habit.trackedDates.includes(todayStr);
    
    let streak = 0;
    let checkDate = new Date(today);
    
    // Start from today if tracked, or yesterday if not
    if (!isTodayTracked) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    // Count consecutive days backwards
    for (const trackedDate of trackedDates) {
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

  const currentStreak = calculateCurrentStreak();
  const habitColor = habits.length > 0 ? habits[0].color : '#3b82f6';

  return (
    <div className="space-y-6">
      {/* Streak Banner for Single Habit */}
      {habits.length === 1 && currentStreak > 0 && (
        <div 
          className="rounded-2xl p-6 shadow-xl border relative overflow-hidden"
          style={{ 
            background: `linear-gradient(135deg, ${habitColor}20, ${habitColor}10)`,
            borderColor: `${habitColor}40`
          }}
        >
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Current Streak</p>
              <p className="text-4xl font-bold text-white">{currentStreak}</p>
              <p className="text-slate-300 text-sm mt-1">days in a row! 🔥</p>
            </div>
            <div className="text-6xl">🔥</div>
          </div>
        </div>
      )}

      <div className="bg-slate-800 rounded-2xl shadow-lg p-4 sm:p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-slate-700 rounded-xl transition-colors active:scale-95 text-slate-300"
          aria-label="Previous month"
        >
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            {monthNames[month]} {year}
          </h2>
          <button
            onClick={goToToday}
            className="text-xs sm:text-sm text-blue-400 hover:text-blue-300 font-medium mt-1 px-3 py-1 rounded-lg hover:bg-blue-900/30 transition-colors"
          >
            Today
          </button>
        </div>
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-slate-700 rounded-xl transition-colors active:scale-95 text-slate-300"
          aria-label="Next month"
        >
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {habits.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <svg className="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-slate-400">No habits to track. Add a habit first!</p>
        </div>
      ) : (
        <>
          {/* Calendar Grid View - Same for Desktop and Mobile */}
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {dayNames.map((day) => (
                      <th
                        key={day}
                        className="p-2 sm:p-3 text-center text-xs sm:text-sm font-semibold text-slate-400 pb-4"
                      >
                        {day.substring(0, 1)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: Math.ceil(daysToShow.length / 7) }).map(
                    (_, weekIndex) => (
                      <tr key={weekIndex}>
                        {daysToShow
                          .slice(weekIndex * 7, weekIndex * 7 + 7)
                          .map((dayInfo, dayIndex) => {
                            const dateString = formatDateToString(dayInfo.fullDate);
                            const dayKey = weekIndex * 7 + dayIndex;
                            const habit = habits.length > 0 ? habits[0] : null;
                            const key = habit ? `${habit._id}-${dateString}` : '';
                            const isTracked = habit ? (trackingStates[key] || false) : false;
                            const isCurrentlyToggling = isToggling === key;
                            const isCurrentMonth = dayInfo.isCurrentMonth;

                            return (
                              <td
                                key={dayKey}
                                className={`p-2 sm:p-3 text-center align-middle ${
                                  !isCurrentMonth ? 'opacity-30' : ''
                                }`}
                              >
                                {habit && (
                                  <button
                                    onClick={() => {
                                      if (isCurrentMonth && !isFutureDate(dayInfo.fullDate)) {
                                        handleToggle(habit._id, dayInfo.fullDate);
                                      }
                                    }}
                                    disabled={isCurrentlyToggling || !isCurrentMonth || isFutureDate(dayInfo.fullDate)}
                                    className={`relative w-full aspect-square flex items-center justify-center rounded-full transition-all ${
                                      isCurrentlyToggling
                                        ? 'cursor-wait'
                                        : isCurrentMonth && !isFutureDate(dayInfo.fullDate)
                                        ? 'cursor-pointer hover:scale-110 active:scale-95'
                                        : 'cursor-not-allowed opacity-50'
                                    }`}
                                    aria-label={`${dateString} - ${isTracked ? 'Tracked' : 'Not tracked'}`}
                                  >
                                    {/* Date Number */}
                                    <span
                                      className={`text-sm sm:text-base font-semibold z-10 ${
                                        isToday(dayInfo.fullDate)
                                          ? 'text-white'
                                          : isTracked
                                          ? 'text-white'
                                          : isCurrentMonth
                                          ? 'text-slate-300'
                                          : 'text-slate-600'
                                      }`}
                                    >
                                      {dayInfo.date}
                                    </span>
                                    
                                    {/* Circle Background - Only for past/today dates */}
                                    {isCurrentMonth && !isFutureDate(dayInfo.fullDate) && (
                                      <div
                                        className={`absolute inset-0 rounded-full transition-all ${
                                          isTracked
                                            ? 'opacity-100 scale-100'
                                            : 'opacity-30 scale-90'
                                        }`}
                                        style={{
                                          backgroundColor: isTracked ? habit.color : habit.color,
                                          boxShadow: isTracked
                                            ? `0 0 0 2px ${habit.color}, 0 0 12px ${habit.color}40`
                                            : `0 0 0 1px ${habit.color}60`,
                                        }}
                                      />
                                    )}
                                    
                                    {/* Future date - grayed out */}
                                    {isCurrentMonth && isFutureDate(dayInfo.fullDate) && (
                                      <div className="absolute inset-0 rounded-full bg-slate-800 border-2 border-slate-600 opacity-50" />
                                    )}
                                    
                                    {/* Today indicator ring */}
                                    {isToday(dayInfo.fullDate) && !isTracked && !isFutureDate(dayInfo.fullDate) && (
                                      <div className="absolute inset-0 rounded-full border-2 border-blue-500" />
                                    )}
                                  </button>
                                )}
                              </td>
                            );
                          })}
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  );
}

