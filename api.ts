import { BookingRecord } from './types';

const STORAGE_KEY = 'findMySpaceBookings';
const CHANNEL_NAME = 'find-my-space-updates';

// Simulate network delay to mimic real-world server latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  /**
   * Fetch all bookings from the "Database"
   */
  getBookings: async (): Promise<BookingRecord[]> => {
    // Simulate reading from a remote server
    await delay(200); 
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  /**
   * Attempt to book seats with Atomic Collision Detection
   * This mimics a database transaction.
   */
  bookSeats: async (newBookings: BookingRecord[]): Promise<void> => {
    // Simulate network processing time
    await delay(600); 

    // 1. CRITICAL: Re-fetch absolute latest data from source
    // In a real app, this happens on the server (Postgres/MongoDB)
    const currentData = localStorage.getItem(STORAGE_KEY);
    const existingBookings: BookingRecord[] = currentData ? JSON.parse(currentData) : [];

    // 2. Server-side Validation: Check for double bookings
    const conflicts = newBookings.filter(newB => 
      existingBookings.some(existing => 
        existing.spaceId === newB.spaceId && 
        existing.timeId === newB.timeId && 
        existing.seatId === newB.seatId
      )
    );

    // 3. If conflicts exist, reject the entire transaction
    if (conflicts.length > 0) {
      const conflictedSeatIds = conflicts.map(c => c.seatId).join(', ');
      throw new Error(`Booking Failed: Seat(s) ${conflictedSeatIds} were just booked by another user.`);
    }

    // 4. Commit to "Database"
    const updatedBookings = [...existingBookings, ...newBookings];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedBookings));

    // 5. Broadcast update to other connected clients (Tabs)
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage('BOOKING_UPDATED');
    channel.close();
  }
};