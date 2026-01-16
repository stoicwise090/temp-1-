import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api } from '../api';
import { BookingRecord } from '../types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
    removeItem: (key: string) => { delete store[key]; }
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock Navigator Locks
// A simple non-blocking mock for testing logic flow, not actual concurrency
Object.defineProperty(navigator, 'locks', {
  value: {
    request: async (_name: string, _options: any, callback: any) => {
      // Handle overload where options might be the callback
      const cb = typeof _options === 'function' ? _options : callback;
      return cb();
    }
  }
});

// Mock BroadcastChannel
globalThis.BroadcastChannel = vi.fn().mockImplementation(() => ({
  postMessage: vi.fn(),
  close: vi.fn(),
})) as any;

describe('BackendService (API)', () => {
  beforeEach(async () => {
    await api.resetDatabase();
  });

  it('should successfully book a seat', async () => {
    const booking: BookingRecord = {
      spaceId: 'lib-main',
      timeId: '0900',
      seatId: 'R1-C1',
      userId: 'test-user',
      timestamp: Date.now()
    };

    await api.bookSeats([booking]);
    const bookings = await api.getBookings();
    expect(bookings).toHaveLength(1);
    expect(bookings[0].seatId).toBe('R1-C1');
  });

  it('should prevent double booking', async () => {
    const booking: BookingRecord = {
      spaceId: 'lib-main',
      timeId: '0900',
      seatId: 'R1-C1',
      userId: 'user-1',
      timestamp: Date.now()
    };

    await api.bookSeats([booking]);

    const conflictBooking: BookingRecord = {
      ...booking,
      userId: 'user-2'
    };

    await expect(api.bookSeats([conflictBooking])).rejects.toThrow(/Booking Failed/);
  });

  it('should allow booking different seats', async () => {
    const b1: BookingRecord = {
      spaceId: 'lib-main',
      timeId: '0900',
      seatId: 'R1-C1',
      userId: 'user-1',
      timestamp: Date.now()
    };
    const b2: BookingRecord = {
        spaceId: 'lib-main',
        timeId: '0900',
        seatId: 'R1-C2', // Different seat
        userId: 'user-2',
        timestamp: Date.now()
    };

    await api.bookSeats([b1]);
    await api.bookSeats([b2]);
    const bookings = await api.getBookings();
    expect(bookings).toHaveLength(2);
  });

  it('should cancel a booking', async () => {
     const booking: BookingRecord = {
      spaceId: 'lib-main',
      timeId: '0900',
      seatId: 'R1-C1',
      userId: 'user-1',
      timestamp: Date.now()
    };

    await api.bookSeats([booking]);
    let bookings = await api.getBookings();
    expect(bookings).toHaveLength(1);

    await api.cancelBooking('lib-main', '0900', 'R1-C1', 'user-1');
    bookings = await api.getBookings();
    expect(bookings).toHaveLength(0);
  });

  it('should fail to cancel a non-existent booking', async () => {
      await expect(api.cancelBooking('lib-main', '0900', 'R9-C9', 'user-1'))
        .rejects.toThrow(/Booking not found/);
  });
});