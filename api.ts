import { BookingRecord } from './types';

const STORAGE_KEY = 'findMySpaceBookings';
const CHANNEL_NAME = 'find-my-space-updates';
const DB_LOCK_NAME = 'findMySpace_db_write_lock';

// Helper to simulate network latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class BackendService {
  
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
    await delay(150); // Small read latency
    return this.getStore();
  }

  /**
   * POST: Create new bookings with atomic conflict detection using Web Locks API
   * This guarantees that only one tab can write to the DB at a time.
   */
  async bookSeats(newBookings: BookingRecord[]): Promise<void> {
    // 1. Simulate Request Latency
    await delay(300);

    // 2. Use Web Locks API for Mutex
    // 'exclusive' mode ensures this function runs alone across all tabs for this origin
    return navigator.locks.request(DB_LOCK_NAME, { mode: 'exclusive' }, async () => {
      
      // 3. Critical Section: Read -> Validate -> Write
      const existingBookings = this.getStore();

      // Conflict Detection
      const conflicts: BookingRecord[] = [];
      
      for (const newB of newBookings) {
        if (!newB.spaceId || !newB.timeId || !newB.seatId || !newB.userId) {
           throw new Error("Invalid booking data: Missing required fields.");
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

      if (conflicts.length > 0) {
        const seats = conflicts.map(c => c.seatId).join(', ');
        throw new Error(`Booking Failed: Seat(s) ${seats} have already been booked.`);
      }

      // Commit
      const updatedStore = [...existingBookings, ...newBookings];
      this.setStore(updatedStore);
      
      // Notify (inside lock to ensure sequence, though broadcast is async)
      this.broadcastChange();
    });
  }

  /**
   * DELETE: Cancel a specific booking
   */
  async cancelBooking(spaceId: string, timeId: string, seatId: string, userId: string): Promise<void> {
    await delay(300);

    return navigator.locks.request(DB_LOCK_NAME, { mode: 'exclusive' }, async () => {
      const existingBookings = this.getStore();
      
      const bookingIndex = existingBookings.findIndex(b => 
        b.spaceId === spaceId && 
        b.timeId === timeId && 
        b.seatId === seatId && 
        b.userId === userId
      );

      if (bookingIndex === -1) {
        throw new Error("Booking not found or you do not have permission to cancel it.");
      }

      // Remove booking
      existingBookings.splice(bookingIndex, 1);
      this.setStore(existingBookings);
      this.broadcastChange();
    });
  }

  /**
   * DEBUG: Clear all data
   */
  async resetDatabase(): Promise<void> {
    return navigator.locks.request(DB_LOCK_NAME, async () => {
      this.setStore([]);
      this.broadcastChange();
    });
  }
}

export const api = new BackendService();