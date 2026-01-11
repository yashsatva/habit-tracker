import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Habit from '@/models/Habit';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const habits = await Habit.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ habits });
  } catch (error) {
    console.error('Error fetching habits:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const { name, color } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Habit name is required' },
        { status: 400 }
      );
    }

    if (name.trim().length > 100) {
      return NextResponse.json(
        { error: 'Habit name cannot exceed 100 characters' },
        { status: 400 }
      );
    }

    // Validate color hex format
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    const habitColor = color || '#3b82f6'; // Default blue
    if (!hexColorRegex.test(habitColor)) {
      return NextResponse.json(
        { error: 'Invalid color format. Please use hex color (e.g., #3b82f6)' },
        { status: 400 }
      );
    }

    await connectDB();

    const habit = new Habit({
      userId: session.user.id,
      name: name.trim(),
      color: habitColor,
      trackedDates: [],
    });

    await habit.save();

    return NextResponse.json(
      { habit: habit.toObject() },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating habit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

