import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IHabit extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  color: string;
  trackedDates: string[]; // Array of ISO date strings (YYYY-MM-DD)
  createdAt: Date;
}

const HabitSchema: Schema<IHabit> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Habit name is required'],
      trim: true,
      maxlength: [100, 'Habit name cannot exceed 100 characters'],
    },
    color: {
      type: String,
      required: [true, 'Color is required'],
      default: '#3b82f6', // Default blue color
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color'],
    },
    trackedDates: {
      type: [String],
      default: [],
      validate: {
        validator: function (dates: string[]) {
          return dates.every((date) => /^\d{4}-\d{2}-\d{2}$/.test(date));
        },
        message: 'All dates must be in YYYY-MM-DD format',
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Create index for efficient queries
HabitSchema.index({ userId: 1, createdAt: -1 });

// Prevent re-compilation during development
const Habit: Model<IHabit> = mongoose.models.Habit || mongoose.model<IHabit>('Habit', HabitSchema);

export default Habit;

