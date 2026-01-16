export interface Space {
  id: string;
  name: string;
  type: 'library' | 'seminar' | 'lab';
  capacity: number;
  floor: string;
  description: string;
  imageGradient: string;
  tags: string[];
}

export interface TimeSlot {
  id: string;
  label: string;
  period: 'AM' | 'PM';
}

export interface Seat {
  id: string;
  row: number;
  col: number;
  status: 'available' | 'booked' | 'selected' | 'gap' | 'screen' | 'table' | 'cabin';
  label?: string;
}

export interface UserSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  publicProfile: boolean;
  darkMode: boolean;
}

export interface User {
  name: string;
  email: string;
  studentId: string;
  avatarUrl?: string;
  settings: UserSettings;
}

export interface BookingState {
  step: 'login' | 'home' | 'time' | 'seats' | 'confirmation' | 'profile';
  selectedSpace: Space | null;
  selectedTime: TimeSlot | null;
  selectedSeats: string[];
}