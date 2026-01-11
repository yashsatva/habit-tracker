export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Habit {
  _id: string;
  userId: string;
  name: string;
  color: string;
  trackedDates: string[];
  createdAt: Date;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

