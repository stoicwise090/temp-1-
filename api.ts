
import { BookingRecord, AuthUser, User } from './types';
import { USERS } from './users'; // Initial seed data

const BOOKING_STORAGE_KEY = 'findMySpaceBookings';
const USERS_STORAGE_KEY = 'findMySpaceUsers';
const CHANNEL_NAME = 'find-my-space-updates';
const DB_LOCK_NAME = 'findMySpace_db_write_lock';

// Helper to simulate network latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class BackendService {
  
  constructor() {
    this.initializeUsers();
  }

  // --- INTERNAL STORAGE HELPERS ---

  private initializeUsers() {
    try {
      // Get existing users
      let existingUsers = this.getUserStore();
      let hasChanges = false;

      // Check if seed users exist, if not, add them
      // This ensures that if you update users.ts, the new admins appear in the app
      USERS.forEach(seedUser => {
        const exists = existingUsers.some(u => u.studentId === seedUser.studentId);
        if (!exists) {
          existingUsers.push(seedUser);
          hasChanges = true;
        }
      });

      if (hasChanges || existingUsers.length === 0) {
        this.setUserStore(existingUsers);
      }
    } catch (e) {
      console.error("Failed to initialize users", e);
      // Fallback reset
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(USERS));
    }
  }

  private getBookingStore(): BookingRecord[] {
    try {
      const data = localStorage.getItem(BOOKING_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Booking DB corruption", e);
      return [];
    }
  }

  private setBookingStore(data: BookingRecord[]) {
    localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(data));
  }

  private getUserStore(): AuthUser[] {
    try {
      const data = localStorage.getItem(USERS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("User DB corruption", e);
      return [];
    }
  }

  private setUserStore(data: AuthUser[]) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(data));
  }

  private broadcastChange() {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage('BOOKING_UPDATED');
    channel.close();
  }

  // --- USER AUTHENTICATION & MANAGEMENT ---

  async login(studentId: string, password: string): Promise<User> {
    await delay(600);
    const users = this.getUserStore();
    const user = users.find(u => u.studentId === studentId && u.password === password);
    
    if (!user) {
      throw new Error("Invalid Student ID or Password");
    }
    
    // Return user without password
    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  async register(newUser: AuthUser): Promise<User> {
    await delay(800);
    return navigator.locks.request(DB_LOCK_NAME, { mode: 'exclusive' }, async () => {
      const users = this.getUserStore();
      
      if (users.some(u => u.studentId === newUser.studentId)) {
        throw new Error("Student ID already exists");
      }

      users.push(newUser);
      this.setUserStore(users);
      
      const { password: _, ...safeUser } = newUser;
      return safeUser;
    });
  }

  async updateUserProfile(updatedUser: User): Promise<User> {
    await delay(500);
    return navigator.locks.request(DB_LOCK_NAME, { mode: 'exclusive' }, async () => {
      const users = this.getUserStore();
      const index = users.findIndex(u => u.studentId === updatedUser.studentId);
      
      if (index === -1) throw new Error("User not found");

      // Merge updates, keeping the password intact
      // We start with the existing user (which has the password) and overwrite properties
      users[index] = { ...users[index], ...updatedUser };
      this.setUserStore(users);
      
      const { password: _, ...safeUser } = users[index];
      return safeUser;
    });
  }

  async resetPassword(studentId: string, newPassword: string): Promise<void> {
    await delay(800);
    return navigator.locks.request(DB_LOCK_NAME, { mode: 'exclusive' }, async () => {
      const users = this.getUserStore();
      const index = users.findIndex(u => u.studentId === studentId);
      
      if (index === -1) throw new Error("Student ID not found");

      users[index].password = newPassword;
      this.setUserStore(users);
    });
  }

  async verifyStudentId(studentId: string): Promise<boolean> {
    await delay(400);
    const users = this.getUserStore();
    return users.some(u => u.studentId === studentId);
  }

  // --- BOOKING LOGIC ---

  async getBookings(): Promise<BookingRecord[]> {
    await delay(150);
    return this.getBookingStore();
  }

  async bookSeats(newBookings: BookingRecord[]): Promise<void> {
    await delay(300);
    return navigator.locks.request(DB_LOCK_NAME, { mode: 'exclusive' }, async () => {
      const existingBookings = this.getBookingStore();
      const conflicts: BookingRecord[] = [];
      
      for (const newB of newBookings) {
        const isTaken = existingBookings.some(existing => 
          existing.spaceId === newB.spaceId && 
          existing.timeId === newB.timeId && 
          existing.seatId === newB.seatId
        );
        if (isTaken) conflicts.push(newB);
      }

      if (conflicts.length > 0) {
        throw new Error(`Booking Failed: Some seats are already booked.`);
      }

      const updatedStore = [...existingBookings, ...newBookings];
      this.setBookingStore(updatedStore);
      this.broadcastChange();
    });
  }

  async cancelBooking(spaceId: string, timeId: string, seatId: string, userId: string): Promise<void> {
    await delay(300);
    return navigator.locks.request(DB_LOCK_NAME, { mode: 'exclusive' }, async () => {
      const existingBookings = this.getBookingStore();
      const bookingIndex = existingBookings.findIndex(b => 
        b.spaceId === spaceId && b.timeId === timeId && b.seatId === seatId && b.userId === userId
      );

      if (bookingIndex === -1) {
        throw new Error("Booking not found or permission denied.");
      }

      existingBookings.splice(bookingIndex, 1);
      this.setBookingStore(existingBookings);
      this.broadcastChange();
    });
  }

  async resetDatabase(): Promise<void> {
    return navigator.locks.request(DB_LOCK_NAME, async () => {
      this.setBookingStore([]);
      this.broadcastChange();
    });
  }
}

export const api = new BackendService();
