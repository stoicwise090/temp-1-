
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
  status: 'available' | 'booked' | 'booked-by-me' | 'selected' | 'gap' | 'screen' | 'table' | 'cabin';
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

// Extended interface for internal storage including password
export interface AuthUser extends User {
  password: string; 
}

export interface BookingState {
  step: 'login' | 'home' | 'time' | 'seats' | 'confirmation' | 'profile';
  selectedSpace: Space | null;
  selectedTime: TimeSlot | null;
  selectedSeats: string[];
}

export interface BookingRecord {
  spaceId: string;
  timeId: string;
  seatId: string;
  timestamp: number;
  userId: string;
  // Optional ID for database primary key
  id?: number; 
}

// --- NEW INTERFACE ---
export interface IBookingService {
  initialize(): Promise<void>;
  login(studentId: string, password: string): Promise<User>;
  register(newUser: AuthUser): Promise<User>;
  updateUserProfile(updatedUser: User): Promise<User>;
  verifyStudentId(studentId: string): Promise<boolean>;
  resetPassword(studentId: string, newPassword: string): Promise<void>;
  
  getBookings(): Promise<BookingRecord[]>;
  bookSeats(bookings: BookingRecord[]): Promise<void>;
  cancelBooking(spaceId: string, timeId: string, seatId: string, userId: string): Promise<void>;
  resetDatabase(): Promise<void>;
  
  // Realtime subscription hook
  onBookingUpdate(callback: () => void): () => void;
}
