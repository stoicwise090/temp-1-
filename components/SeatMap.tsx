
import React, { useMemo } from 'react';
import { Space, Seat, BookingRecord } from '../types';
import { Monitor, Table, Check, Lock, CheckCircle2, XCircle, DoorOpen, Phone } from 'lucide-react';

interface SeatMapProps {
  space: Space;
  selectedSeats: string[];
  onToggleSeat: (seatId: string) => void;
  bookings: BookingRecord[];
  currentUserId?: string;
  selectedTimeId?: string;
}

export const SeatMap: React.FC<SeatMapProps> = ({ 
  space, 
  selectedSeats, 
  onToggleSeat, 
  bookings, 
  currentUserId,
  selectedTimeId
}) => {
  
  // OPTIMIZATION: Create a lookup map for bookings in this specific space/time
  // This reduces complexity from O(Seats * Bookings) to O(Seats + Bookings)
  const bookingMap = useMemo(() => {
    const map = new Map<string, string>(); // SeatID -> UserID
    bookings.forEach(b => {
      if (b.spaceId === space.id && b.timeId === selectedTimeId) {
        map.set(b.seatId, b.userId);
      }
    });
    return map;
  }, [bookings, space.id, selectedTimeId]);

  // Generate the layout configuration based on space type
  const seats = useMemo(() => {
    const generatedSeats: Seat[] = [];
    
    // Helper to check booking status using the optimized map
    const getBookingStatus = (seatId: string): Seat['status'] => {
      if (!bookingMap.has(seatId)) return 'available';
      const bookedBy = bookingMap.get(seatId);
      return bookedBy === currentUserId ? 'booked-by-me' : 'booked';
    };

    if (space.type === 'library') {
      // Grid Dimensions based on sketch
      // Left block: 2 tables wide (approx 7 cols)
      // Gap: approx 3 cols
      // Right block: 3 tables wide (approx 11 cols)
      const MAX_ROWS = 14; 
      const MAX_COLS = 21;

      // Helper to define where tables are
      // Table ID -> [StartRow, StartCol]
      const tablePositions: Record<number, [number, number]> = {
        // Left Side
        1: [0, 0],  2: [0, 4],
        3: [4, 0],  4: [4, 4],
        5: [8, 0],  6: [8, 4],
        
        // Right Side
        7: [0, 10], 8: [0, 14], 9: [0, 18],
        10:[4, 10], 11:[4, 14], 12:[4, 18],
        13:[8, 10], 14:[8, 14], 15:[8, 18]
      };

      for (let r = 0; r < MAX_ROWS; r++) {
        for (let c = 0; c < MAX_COLS; c++) {
          let seat: Seat = { 
            id: `gap-${r}-${c}`, 
            row: r, 
            col: c, 
            status: 'gap' 
          };

          // Check if this coordinate belongs to a table
          let activeTableId = 0;
          for (const [tId, [tR, tC]] of Object.entries(tablePositions)) {
            const tableId = parseInt(tId);
            // A table occupies 3 rows (Seats, Table, Seats) and 3 cols
            if (r >= tR && r < tR + 3 && c >= tC && c < tC + 3) {
              activeTableId = tableId;
              
              // Relative position in the table 3x3 grid
              const relR = r - tR;
              const relC = c - tC;

              if (relR === 1) {
                // Middle row is the table surface
                seat.status = 'table';
                seat.label = `T${tableId}`;
              } else {
                // Row 0 and 2 are seats
                // Seat Numbering: Top row 1-3, Bottom row 4-6
                const seatNum = relR === 0 ? relC + 1 : relC + 4;
                const actualSeatId = `LIB-T${tableId}-${seatNum}`;
                
                seat.id = actualSeatId;
                seat.status = getBookingStatus(actualSeatId);
                seat.label = `${seatNum}`;
              }
              break; 
            }
          }

          // Special Areas
          // Staircase / Entrance (Middle)
          if (r >= 4 && r <= 6 && c >= 7 && c <= 9) {
            seat.status = 'gap';
            if (r === 5 && c === 8) {
               seat.status = 'cabin'; // Reusing cabin style for label
               seat.label = "Entrance";
            }
          }

          // Reception (Bottom Left)
          if (r >= 12 && c >= 0 && c <= 3) {
             seat.status = 'table'; // Use table style for desk
             if (r === 12 && c === 1) {
                 seat.status = 'cabin';
                 seat.label = "Reception";
             }
          }

          generatedSeats.push(seat);
        }
      }

    } else if (space.type === 'lab') {
      // Lab Layout
      const rows = 8;
      const cols = 10;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          let type: Seat['status'] = 'available';
          const seatId = `LAB-R${r}-C${c}`;
          
          if (c < 3 || c > 6) type = 'available';
          else if (r > 2 && r < 6 && c > 3 && c < 6) type = 'table';
          else type = 'gap';

          if (r === rows - 1 && (c === 4 || c === 5)) type = 'cabin';

          if (type === 'available') {
            type = getBookingStatus(seatId);
          }

          generatedSeats.push({
            id: seatId,
            row: r,
            col: c,
            status: type,
            label: (type === 'available' || type === 'booked' || type === 'booked-by-me') ? `PC-${r * cols + c}` : undefined
          });
        }
      }
    } else {
      // Seminar Hall
      const rows = 8;
      const maxCols = 14;
      for (let r = 0; r < rows; r++) {
        const colsInRow = 8 + r; 
        const startCol = Math.floor((maxCols - colsInRow) / 2);
        for (let c = 0; c < maxCols; c++) {
          const isValidSeat = c >= startCol && c < startCol + colsInRow;
          const seatId = `SEM-R${r}-C${c}`;
          let status: Seat['status'] = !isValidSeat ? 'gap' : 'available';
          if (status === 'available') status = getBookingStatus(seatId);

          generatedSeats.push({
            id: seatId,
            row: r,
            col: c,
            status: status,
            label: isValidSeat ? `${r + 1}-${c + 1}` : ''
          });
        }
      }
    }
    return generatedSeats;
  }, [space.type, bookingMap, currentUserId, space.id]);

  const maxCol = seats.length > 0 ? Math.max(...seats.map(s => s.col)) : 0;

  if (space.type === 'seminar') {
    return (
      <div className="flex flex-col items-center w-full overflow-x-auto seat-scroller pb-12">
        <div className="relative w-2/3 h-16 mb-10 flex justify-center">
            <div className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-400/10 rounded-t-[100px] blur-xl"></div>
            <div className="absolute bottom-0 w-full h-1.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent rounded-full shadow-[0_0_30px_rgba(99,102,241,0.8)]"></div>
            <div className="absolute -bottom-6 flex flex-col items-center">
                 <span className="text-[10px] uppercase tracking-[0.4em] text-indigo-400 font-extrabold mb-1">Stage</span>
                 <div className="w-1 h-8 bg-gradient-to-b from-indigo-400/50 to-transparent"></div>
            </div>
        </div>
        
        <div className="flex flex-col gap-3 perspective-container">
          {Array.from(new Set(seats.map(s => s.row))).map(rowIndex => (
            <div 
              key={rowIndex} 
              className="flex justify-center gap-2"
              style={{ transform: `scale(${1 + (rowIndex as number) * 0.02})` }} 
            >
              {seats.filter(s => s.row === rowIndex).map(seat => (
                <SeatButton 
                  key={seat.id} 
                  seat={seat} 
                  isSelected={selectedSeats.includes(seat.id)}
                  onToggle={() => onToggleSeat(seat.id)}
                  type="seminar"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto seat-scroller pb-4">
       <div className="flex flex-col items-center min-w-max mx-auto p-4">
        {space.type === 'lab' && (
          <div className="mb-10 w-full flex justify-center">
             <div className="px-12 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 text-xs font-semibold tracking-widest uppercase shadow-sm">
                Projector Screen / Whiteboard
             </div>
          </div>
        )}

        <div 
          className="grid gap-2"
          style={{ 
            gridTemplateColumns: `repeat(${maxCol + 1}, minmax(36px, 1fr))` 
          }}
        >
          {seats.map(seat => (
            <div key={seat.id} className="flex justify-center items-center">
               <SeatButton 
                  seat={seat} 
                  isSelected={selectedSeats.includes(seat.id)}
                  onToggle={() => onToggleSeat(seat.id)}
                  type={space.type}
                />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const SeatButton: React.FC<{ 
  seat: Seat; 
  isSelected: boolean; 
  onToggle: () => void;
  type: string;
}> = ({ seat, isSelected, onToggle, type }) => {
  
  if (seat.status === 'gap') return <div className="w-8 h-8 sm:w-9 sm:h-9" />;
  
  if (seat.status === 'table') {
    return (
      <div className="w-full h-full min-w-[32px] min-h-[32px] bg-slate-200 dark:bg-slate-700/50 rounded-md flex items-center justify-center text-slate-400 dark:text-slate-500 text-[10px] font-bold">
        {seat.label || <Table size={14} />}
      </div>
    );
  }

  if (seat.status === 'cabin') {
    const isEntrance = seat.label === "Entrance";
    return (
      <div className={`w-auto px-2 h-8 ${isEntrance ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'} rounded-lg flex items-center justify-center gap-1 text-[9px] font-bold uppercase whitespace-nowrap`}>
        {isEntrance ? <DoorOpen size={12} /> : <Phone size={12} />}
        {seat.label}
      </div>
    );
  }

  const isBookedByMe = seat.status === 'booked-by-me';
  const isBooked = seat.status === 'booked';
  
  const isDisabled = isBooked; 

  let baseClass = "relative flex items-center justify-center rounded-lg transition-all duration-300 text-[10px] font-bold group ";
  // Slightly smaller seats for library to fit the complex layout
  let sizeClass = type === 'library' ? "w-8 h-8 sm:w-9 sm:h-9" : "w-10 h-10 sm:w-11 sm:h-11";
  
  if (isBookedByMe) {
    baseClass += "bg-teal-500 dark:bg-teal-600 text-white shadow-sm ring-1 ring-teal-600 dark:ring-teal-400 opacity-100 hover:bg-red-500 hover:ring-red-500 cursor-pointer ";
  } else if (isBooked) {
    baseClass += "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-300 dark:border-slate-700 ";
  } else if (isSelected) {
    baseClass += "bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg shadow-indigo-500/40 scale-110 z-10 ring-2 ring-indigo-600 dark:ring-indigo-400 ring-offset-2 dark:ring-offset-slate-800 ";
  } else {
    baseClass += "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer border border-slate-200 dark:border-slate-600 shadow-sm hover:border-indigo-400 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-indigo-500/20 hover:-translate-y-0.5 hover:shadow-md ";
  }

  let titleText = `Seat ${seat.label}`;
  if (isBookedByMe) titleText = `Booked by You (Click to Cancel)`;
  if (isBooked) titleText = `Occupied`;

  return (
    <button 
      onClick={onToggle}
      disabled={isDisabled}
      className={`${baseClass} ${sizeClass}`}
      title={titleText}
      aria-label={titleText}
      aria-pressed={isSelected}
    >
      {isBookedByMe ? (
        <>
          <Check size={14} strokeWidth={3} className="group-hover:hidden" />
          <XCircle size={14} strokeWidth={3} className="hidden group-hover:block" />
        </>
      ) : isSelected ? (
        <CheckCircle2 size={14} className="animate-pop" />
      ) : type === 'lab' ? (
        isBooked ? <Lock size={12} /> : <Monitor size={14} />
      ) : (
        isBooked ? <Lock size={12} /> : seat.label
      )}
    </button>
  );
};
