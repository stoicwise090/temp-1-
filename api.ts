
import { BookingRecord, AuthUser, User, IBookingService } from './types';
import { USERS } from './users';

// --- CONFIGURATION ---
// REPLACE THESE WITH YOUR ACTUAL SUPABASE KEYS
const SUPABASE_URL = 'https://your-project.supabase.co'; 
const SUPABASE_KEY = 'your-anon-key';

// Toggle this to switch between Local and Cloud modes
const USE_CLOUD = false; 

const BOOKING_STORAGE_KEY = 'findMySpaceBookings';
const USERS_STORAGE_KEY = 'findMySpaceUsers';
const CHANNEL_NAME = 'find-my-space-updates';
const DB_LOCK_NAME = 'findMySpace_db_write_lock';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- STRATEGY 1: LOCAL STORAGE SERVICE (Existing Logic) ---
export class LocalBookingService implements IBookingService {
  
  async initialize() {
    this.initializeUsers();
  }

  onBookingUpdate(callback: () => void): () => void {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (event) => {
      if (event.data === 'BOOKING_UPDATED') callback();
    };
    
    // Also listen to storage events (other tabs)
    const storageHandler = (e: StorageEvent) => {
       if (e.key === BOOKING_STORAGE_KEY) callback();
    };
    window.addEventListener('storage', storageHandler);

    return () => {
      channel.close();
      window.removeEventListener('storage', storageHandler);
    };
  }

  private broadcastChange() {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage('BOOKING_UPDATED');
    channel.close();
  }

  private initializeUsers() {
    try {
      let existingUsers = this.getStore<AuthUser[]>(USERS_STORAGE_KEY);
      let hasChanges = false;
      USERS.forEach(seedUser => {
        const exists = existingUsers.some(u => u.studentId === seedUser.studentId);
        if (!exists) {
          existingUsers.push(seedUser);
          hasChanges = true;
        }
      });
      if (hasChanges || existingUsers.length === 0) {
        this.setStore(USERS_STORAGE_KEY, existingUsers);
      }
    } catch (e) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(USERS));
    }
  }

  private getStore<T>(key: string): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch { return [] as any; }
  }

  private setStore(key: string, data: any) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  async login(studentId: string, password: string): Promise<User> {
    await delay(400);
    const users = this.getStore<AuthUser[]>(USERS_STORAGE_KEY);
    const user = users.find(u => u.studentId === studentId && u.password === password);
    if (!user) throw new Error("Invalid Student ID or Password");
    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  async register(newUser: AuthUser): Promise<User> {
    await delay(600);
    return navigator.locks.request(DB_LOCK_NAME, { mode: 'exclusive' }, async () => {
      const users = this.getStore<AuthUser[]>(USERS_STORAGE_KEY);
      if (users.some(u => u.studentId === newUser.studentId)) throw new Error("Student ID already exists");
      users.push(newUser);
      this.setStore(USERS_STORAGE_KEY, users);
      const { password: _, ...safeUser } = newUser;
      return safeUser;
    });
  }

  async updateUserProfile(updatedUser: User): Promise<User> {
    await delay(300);
    const users = this.getStore<AuthUser[]>(USERS_STORAGE_KEY);
    const index = users.findIndex(u => u.studentId === updatedUser.studentId);
    if (index === -1) throw new Error("User not found");
    users[index] = { ...users[index], ...updatedUser };
    this.setStore(USERS_STORAGE_KEY, users);
    const { password: _, ...safeUser } = users[index];
    return safeUser;
  }

  async verifyStudentId(studentId: string): Promise<boolean> {
    const users = this.getStore<AuthUser[]>(USERS_STORAGE_KEY);
    return users.some(u => u.studentId === studentId);
  }

  async resetPassword(studentId: string, newPassword: string): Promise<void> {
    const users = this.getStore<AuthUser[]>(USERS_STORAGE_KEY);
    const index = users.findIndex(u => u.studentId === studentId);
    if (index !== -1) {
        users[index].password = newPassword;
        this.setStore(USERS_STORAGE_KEY, users);
    }
  }

  async getBookings(): Promise<BookingRecord[]> {
    return this.getStore<BookingRecord[]>(BOOKING_STORAGE_KEY);
  }

  async bookSeats(newBookings: BookingRecord[]): Promise<void> {
    await delay(300);
    return navigator.locks.request(DB_LOCK_NAME, { mode: 'exclusive' }, async () => {
      const existing = this.getStore<BookingRecord[]>(BOOKING_STORAGE_KEY);
      // Check conflicts
      const conflicts = newBookings.filter(nb => 
        existing.some(eb => eb.spaceId === nb.spaceId && eb.timeId === nb.timeId && eb.seatId === nb.seatId)
      );
      
      if (conflicts.length > 0) throw new Error("Booking Failed: Some seats are already booked.");
      
      this.setStore(BOOKING_STORAGE_KEY, [...existing, ...newBookings]);
      this.broadcastChange();
    });
  }

  async cancelBooking(spaceId: string, timeId: string, seatId: string, userId: string): Promise<void> {
    await delay(200);
    return navigator.locks.request(DB_LOCK_NAME, { mode: 'exclusive' }, async () => {
      const existing = this.getStore<BookingRecord[]>(BOOKING_STORAGE_KEY);
      const idx = existing.findIndex(b => b.spaceId === spaceId && b.timeId === timeId && b.seatId === seatId && b.userId === userId);
      if (idx === -1) throw new Error("Booking not found");
      existing.splice(idx, 1);
      this.setStore(BOOKING_STORAGE_KEY, existing);
      this.broadcastChange();
    });
  }

  async resetDatabase(): Promise<void> {
    this.setStore(BOOKING_STORAGE_KEY, []);
    this.broadcastChange();
  }
}

// --- STRATEGY 2: REMOTE SUPABASE SERVICE (Cloud Logic) ---
export class RemoteBookingService implements IBookingService {
  private supabase: any;

  constructor() {
    if (!(window as any).supabase) throw new Error("Supabase client not loaded");
    this.supabase = (window as any).supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }

  async initialize() {
    console.log("🟢 Cloud Storage Initialized");
  }

  onBookingUpdate(callback: () => void): () => void {
    const channel = this.supabase
      .channel('public:bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        callback();
      })
      .subscribe();

    return () => {
      this.supabase.removeChannel(channel);
    };
  }

  // --- Auth Methods (Using 'users' table for consistency with local demo) ---
  // In a real app, use this.supabase.auth.signUp()
  async login(studentId: string, password: string): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('studentId', studentId)
      .eq('password', password)
      .single();

    if (error || !data) throw new Error("Invalid Credentials");
    const { password: _, ...safeUser } = data;
    return safeUser;
  }

  async register(newUser: AuthUser): Promise<User> {
    // 1. Check existing
    const { data: existing } = await this.supabase.from('users').select('studentId').eq('studentId', newUser.studentId).single();
    if (existing) throw new Error("Student ID already exists");

    // 2. Insert
    const { data, error } = await this.supabase.from('users').insert([newUser]).select().single();
    if (error) throw new Error(error.message);
    
    const { password: _, ...safeUser } = data;
    return safeUser;
  }

  async updateUserProfile(updatedUser: User): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .update({ 
        name: updatedUser.name, 
        email: updatedUser.email, 
        settings: updatedUser.settings 
      })
      .eq('studentId', updatedUser.studentId)
      .select()
      .single();

    if (error) throw new Error("Update failed");
    const { password: _, ...safeUser } = data;
    return safeUser;
  }

  async verifyStudentId(studentId: string): Promise<boolean> {
    const { data } = await this.supabase.from('users').select('studentId').eq('studentId', studentId).single();
    return !!data;
  }

  async resetPassword(studentId: string, newPassword: string): Promise<void> {
    const { error } = await this.supabase.from('users').update({ password: newPassword }).eq('studentId', studentId);
    if (error) throw new Error("Reset failed");
  }

  // --- Booking Methods ---

  async getBookings(): Promise<BookingRecord[]> {
    const { data, error } = await this.supabase.from('bookings').select('*');
    if (error) return [];
    // Map database columns to camelCase if necessary, but here we assume 1:1 match
    return data.map((d: any) => ({
      spaceId: d.space_id,
      timeId: d.time_id,
      seatId: d.seat_id,
      userId: d.user_id,
      timestamp: d.timestamp,
      id: d.id
    }));
  }

  async bookSeats(bookings: BookingRecord[]): Promise<void> {
    // Map to snake_case for DB
    const dbRows = bookings.map(b => ({
      space_id: b.spaceId,
      time_id: b.timeId,
      seat_id: b.seatId,
      user_id: b.userId,
      timestamp: b.timestamp
    }));

    const { error } = await this.supabase.from('bookings').insert(dbRows);

    if (error) {
      // Postgres Unique Violation Code
      if (error.code === '23505') {
        throw new Error("Booking Failed: One or more seats were just taken.");
      }
      throw new Error(error.message);
    }
  }

  async cancelBooking(spaceId: string, timeId: string, seatId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('bookings')
      .delete()
      .match({ space_id: spaceId, time_id: timeId, seat_id: seatId, user_id: userId });

    if (error) throw new Error("Cancellation failed");
  }

  async resetDatabase(): Promise<void> {
     console.warn("Reset disabled on cloud for safety");
  }
}

// --- FACTORY ---
// Choose service based on config
export const api: IBookingService = (USE_CLOUD && SUPABASE_URL) 
  ? new RemoteBookingService() 
  : new LocalBookingService();

// Initialize immediately
api.initialize();
