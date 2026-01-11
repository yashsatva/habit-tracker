import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Habit from '@/models/Habit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { habitId, date } = body;

    // Validation
    if (!habitId) {
      return NextResponse.json(
        { error: 'Habit ID is required' },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify the habit belongs to the user
    const habit = await Habit.findOne({
      _id: habitId,
      userId: session.user.id,
    });

    if (!habit) {
      return NextResponse.json(
        { error: 'Habit not found or unauthorized' },
        { status: 404 }
      );
    }

    // Toggle the date in trackedDates array
    const trackedDates = habit.trackedDates || [];
    const dateIndex = trackedDates.indexOf(date);

    if (dateIndex > -1) {
      // Date exists, remove it (untrack)
      trackedDates.splice(dateIndex, 1);
    } else {
      // Date doesn't exist, add it (track)
      trackedDates.push(date);
    }

    habit.trackedDates = trackedDates;
    await habit.save();

    return NextResponse.json({
      habit: habit.toObject(),
      isTracked: dateIndex === -1,
    });
  } catch (error) {
    console.error('Error tracking habit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

