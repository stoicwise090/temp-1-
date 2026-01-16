import React, { useMemo } from 'react';
import { Space, Seat, BookingRecord } from '../types';
import { Monitor, Table, Check, Lock } from 'lucide-react';

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
  
  // Generate the layout configuration based on space type
  const seats = useMemo(() => {
    const generatedSeats: Seat[] = [];
    
    // Helper to check booking status
    const getBookingStatus = (seatId: string): Seat['status'] => {
      // Find a booking for this specific seat, space, and time
      const booking = bookings.find(b => 
        b.spaceId === space.id && 
        b.timeId === selectedTimeId && 
        b.seatId === seatId
      );

      if (!booking) return 'available';
      
      // Distinguish between my booking and others
      return booking.userId === currentUserId ? 'booked-by-me' : 'booked';
    };

    if (space.type === 'library') {
      // 6 Rows x 8 Cols Standard Grid
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 8; c++) {
          const isGap = c === 4; // Aisle in the middle
          const seatId = `R${r}-C${c}`;
          generatedSeats.push({
            id: seatId,
            row: r,
            col: c,
            status: isGap ? 'gap' : getBookingStatus(seatId),
            label: `${String.fromCharCode(65 + r)}${c + 1}`
          });
        }
      }
    } else if (space.type === 'lab') {
      // Computer Lab Layout
      const rows = 8;
      const cols = 10;
      
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          let type: Seat['status'] = 'available';
          const seatId = `LAB-R${r}-C${c}`;
          
          // Define layout structure
          if (c < 3 || c > 6) type = 'available'; // Side computers
          else if (r > 2 && r < 6 && c > 3 && c < 6) type = 'table'; // Center meeting table
          else type = 'gap'; // Walkways

          if (r === rows - 1 && (c === 4 || c === 5)) type = 'cabin';

          // Check if booked (only if it was available)
          if (type === 'available') {
            type = getBookingStatus(seatId);
          }

          generatedSeats.push({
            id: seatId,
            row: r,
            col: c,
            status: type,
            label: type === 'available' || type === 'booked' || type === 'booked-by-me' ? `PC-${r * cols + c}` : undefined
          });
        }
      }
    } else {
      // Seminar Hall
      const rows = 8;
      const maxCols = 14;
      for (let r = 0; r < rows; r++) {
        const colsInRow = 8 + r; // Pyramid shape
        const startCol = Math.floor((maxCols - colsInRow) / 2);
        
        for (let c = 0; c < maxCols; c++) {
          const isValidSeat = c >= startCol && c < startCol + colsInRow;
          const seatId = `SEM-R${r}-C${c}`;
          
          let status: Seat['status'] = !isValidSeat ? 'gap' : 'available';
          if (status === 'available') {
            status = getBookingStatus(seatId);
          }

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
  }, [space.type, bookings, currentUserId, selectedTimeId, space.id]);

  // Render logic based on type
  if (space.type === 'seminar') {
    return (
      <div className="flex flex-col items-center w-full overflow-x-auto seat-scroller pb-12">
        {/* Screen */}
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
              // Add a slight curve effect using translate
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

  // Grid layout for Lab and Library
  return (
    <div className="w-full overflow-x-auto seat-scroller pb-4">
       <div className="flex flex-col items-center min-w-max mx-auto p-4">
        {/* Lab specific header items */}
        {space.type === 'lab' && (
          <div className="mb-10 w-full flex justify-center">
             <div className="px-12 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 text-xs font-semibold tracking-widest uppercase shadow-sm">
                Projector Screen / Whiteboard
             </div>
          </div>
        )}

        <div 
          className="grid gap-3"
          style={{ 
            gridTemplateColumns: `repeat(${Math.max(...seats.map(s => s.col)) + 1}, minmax(40px, 1fr))` 
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

// Sub-component for individual seat
const SeatButton: React.FC<{ 
  seat: Seat; 
  isSelected: boolean; 
  onToggle: () => void;
  type: string;
}> = ({ seat, isSelected, onToggle, type }) => {
  
  if (seat.status === 'gap') return <div className="w-8 h-8" />;
  
  if (seat.status === 'table') {
    return (
      <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500">
        <Table size={18} />
      </div>
    );
  }

  if (seat.status === 'cabin') {
    return (
      <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">
        Staff
      </div>
    );
  }

  const isBookedByMe = seat.status === 'booked-by-me';
  const isBooked = seat.status === 'booked';
  
  let baseClass = "relative flex items-center justify-center rounded-lg transition-all duration-300 text-xs font-semibold ";
  let sizeClass = type === 'seminar' ? "w-8 h-8 sm:w-10 sm:h-10" : "w-10 h-10 sm:w-11 sm:h-11";
  
  // Dynamic Styling based on state
  if (isBookedByMe) {
    baseClass += "bg-teal-500 dark:bg-teal-600 text-white cursor-default shadow-sm ring-1 ring-teal-600 dark:ring-teal-400 opacity-90 ";
  } else if (isBooked) {
    baseClass += "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-300 dark:border-slate-700 ";
  } else if (isSelected) {
    baseClass += "bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg shadow-indigo-500/40 scale-110 z-10 ring-2 ring-indigo-600 dark:ring-indigo-400 ring-offset-2 dark:ring-offset-slate-800 animate-pop ";
  } else {
    baseClass += "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer border border-slate-200 dark:border-slate-600 shadow-sm hover:border-indigo-400 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-indigo-500/20 hover:-translate-y-0.5 hover:shadow-md ";
  }

  let titleText = `Seat ${seat.label}`;
  if (isBookedByMe) titleText = `Booked by You`;
  if (isBooked) titleText = `Occupied`;

  return (
    <button 
      onClick={onToggle}
      disabled={isBooked || isBookedByMe}
      className={`${baseClass} ${sizeClass}`}
      title={titleText}
    >
      {type === 'lab' ? (
        isBookedByMe ? <Check size={16} /> : (isBooked ? <Lock size={14} /> : <Monitor size={15} />)
      ) : (
        isBookedByMe ? <Check size={16} /> : (isBooked ? <Lock size={14} /> : seat.label)
      )}
    </button>
  );
};