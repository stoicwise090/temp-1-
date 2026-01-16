import { BookingRecord } from './types';

const STORAGE_KEY = 'findMySpaceBookings';
const CHANNEL_NAME = 'find-my-space-updates';

// Helper to simulate network latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class SimulatedBackend {
  
  private getStore(): BookingRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Database corruption detected. Resetting store.", e);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
  }

  private setStore(data: BookingRecord[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  /**
   * Broadcasts a change event to other tabs
   */
  private broadcastChange() {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage('BOOKING_UPDATED');
    channel.close();
  }

  /**
   * GET: Fetch all bookings
   */
  async getBookings(): Promise<BookingRecord[]> {
    await delay(200); // Network latency
    return this.getStore();
  }

  /**
   * POST: Create new bookings with atomic conflict detection
   */
  async bookSeats(newBookings: BookingRecord[]): Promise<void> {
    // 1. Simulate Network Request Time
    // This is where the race condition usually happens in real life (between request and server processing)
    await delay(600); 

    // --- CRITICAL SECTION START ---
    // In a real backend, this would be a database transaction.
    // In JS (Single Threaded), we must ensure we Read -> Check -> Write synchronously 
    // without any 'await' in between to prevent the event loop from processing other tasks.
    
    const existingBookings = this.getStore();

    // 2. Conflict Detection
    const conflicts: BookingRecord[] = [];
    
    for (const newB of newBookings) {
      // Validate data integrity
      if (!newB.spaceId || !newB.timeId || !newB.seatId) {
         throw new Error("Invalid booking data provided.");
      }

      const isTaken = existingBookings.some(existing => 
        existing.spaceId === newB.spaceId && 
        existing.timeId === newB.timeId && 
        existing.seatId === newB.seatId
      );

      if (isTaken) {
        conflicts.push(newB);
      }
    }

    // 3. Rollback / Error if ANY conflict exists
    if (conflicts.length > 0) {
      const seats = conflicts.map(c => c.seatId).join(', ');
      throw new Error(`Booking Failed: Seat(s) ${seats} have already been booked.`);
    }

    // 4. Commit Transaction
    const updatedStore = [...existingBookings, ...newBookings];
    this.setStore(updatedStore);
    
    // --- CRITICAL SECTION END ---

    // 5. Notify Subscribers
    this.broadcastChange();
  }

  /**
   * DEBUG: Clear all data
   */
  async resetDatabase(): Promise<void> {
    await delay(300);
    this.setStore([]);
    this.broadcastChange();
  }
}

export const api = new SimulatedBackend();