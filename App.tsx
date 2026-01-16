import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { SeatMap } from './components/SeatMap';
import { Login } from './components/Login';
import { Profile } from './components/Profile';
import { SPACES, TIME_SLOTS } from './constants';
import { BookingState, Space, TimeSlot, User } from './types';
import { ArrowLeft, Calendar, Clock, CheckCircle2, MapPin, ChevronRight, User as UserIcon, Armchair } from 'lucide-react';

// Interface for stored booking data
interface BookingRecord {
  spaceId: string;
  timeId: string;
  seatId: string;
  timestamp: number;
  userId?: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  
  const [state, setState] = useState<BookingState>({
    step: 'login', // Default start at login
    selectedSpace: null,
    selectedTime: null,
    selectedSeats: [],
  });

  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [timeFilter, setTimeFilter] = useState<'ALL' | 'AM' | 'PM'>('ALL');

  // Load bookings from local storage on mount
  useEffect(() => {
    const storedBookings = localStorage.getItem('findMySpaceBookings');
    if (storedBookings) {
      try {
        setBookings(JSON.parse(storedBookings));
      } catch (error) {
        console.error("Failed to parse bookings from local storage", error);
      }
    }
  }, []);

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [state.step]);

  // Auth Handlers
  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setState(prev => ({ ...prev, step: 'home' }));
  };

  const handleLogout = () => {
    setUser(null);
    setState({
        step: 'login',
        selectedSpace: null,
        selectedTime: null,
        selectedSeats: []
    });
  };

  const navigateToProfile = () => {
      setState(prev => ({ ...prev, step: 'profile' }));
  };

  // Get seat IDs that are booked for the current space and time
  const getBookedSeatIds = () => {
    if (!state.selectedSpace || !state.selectedTime) return [];
    return bookings
      .filter(b => b.spaceId === state.selectedSpace?.id && b.timeId === state.selectedTime?.id)
      .map(b => b.seatId);
  };

  const handleSpaceSelect = (space: Space) => {
    setState(prev => ({ ...prev, selectedSpace: space, step: 'time' }));
    setTimeFilter('ALL');
  };

  const handleTimeSelect = (time: TimeSlot) => {
    setState(prev => ({ ...prev, selectedTime: time, step: 'seats', selectedSeats: [] }));
  };

  const toggleSeat = (seatId: string) => {
    setState(prev => {
      const exists = prev.selectedSeats.includes(seatId);
      const newSeats = exists 
        ? prev.selectedSeats.filter(id => id !== seatId)
        : [...prev.selectedSeats, seatId];
      return { ...prev, selectedSeats: newSeats };
    });
  };

  const handleConfirm = () => {
    if (!state.selectedSpace || !state.selectedTime) return;

    // Create new booking records
    const newBookings: BookingRecord[] = state.selectedSeats.map(seatId => ({
      spaceId: state.selectedSpace!.id,
      timeId: state.selectedTime!.id,
      seatId,
      timestamp: Date.now(),
      userId: user?.studentId
    }));

    // Update state and local storage
    const updatedBookings = [...bookings, ...newBookings];
    setBookings(updatedBookings);
    localStorage.setItem('findMySpaceBookings', JSON.stringify(updatedBookings));

    setState(prev => ({ ...prev, step: 'confirmation' }));
  };

  const handleReset = () => {
    setState({
      step: 'home',
      selectedSpace: null,
      selectedTime: null,
      selectedSeats: [],
    });
  };

  const goBack = () => {
    setState(prev => {
      if (prev.step === 'profile') return { ...prev, step: 'home' };
      if (prev.step === 'confirmation') return { ...prev, step: 'home' }; 
      if (prev.step === 'seats') return { ...prev, step: 'time', selectedSeats: [] };
      if (prev.step === 'time') return { ...prev, step: 'home', selectedSpace: null };
      return prev;
    });
  };

  // --- RENDER HELPERS ---

  const renderSchedule = () => {
    if (!user) return null;
    
    // Filter and enrich bookings
    const myBookings = bookings
      .filter(b => b.userId === user.studentId)
      .map(b => {
        const space = SPACES.find(s => s.id === b.spaceId);
        const time = TIME_SLOTS.find(t => t.id === b.timeId);
        return { ...b, space, time };
      })
      .filter((item): item is BookingRecord & { space: Space, time: TimeSlot } => !!item.space && !!item.time);

    if (myBookings.length === 0) {
        return (
             <div className="mb-12 bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 flex flex-col items-center justify-center text-center transition-colors duration-300">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4 text-slate-300 dark:text-slate-500">
                    <Calendar size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">No Upcoming Bookings</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto text-sm">You haven't booked any spaces yet. Select a facility below to get started.</p>
            </div>
        );
    }

    // Group by Space and Time
    const groupedBookings: Record<string, { space: Space, time: TimeSlot, seats: string[] }> = {};
    
    myBookings.forEach(b => {
        const key = `${b.spaceId}-${b.timeId}`;
        if (!groupedBookings[key]) {
            groupedBookings[key] = {
                space: b.space,
                time: b.time,
                seats: []
            };
        }
        groupedBookings[key].seats.push(b.seatId);
    });

    // Convert to array and sort by time
    const sortedGroups = Object.values(groupedBookings).sort((a, b) => {
        return a.time.id.localeCompare(b.time.id);
    });

    return (
      <div className="mb-12 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                    <Calendar size={20} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Schedule</h2>
            </div>
            <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                Today
            </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide snap-x">
            {sortedGroups.map((group, idx) => (
                <div key={idx} className="min-w-[280px] bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700 flex flex-col group hover:border-indigo-200 dark:hover:border-indigo-700 transition-all snap-center">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                                {group.time.period}
                            </span>
                            <span className="text-2xl font-bold text-slate-800 dark:text-white">
                                {group.time.label}
                            </span>
                        </div>
                        <div className={`p-2 rounded-xl bg-gradient-to-br ${group.space.imageGradient} text-white shadow-md`}>
                             {group.space.type === 'library' && <Armchair size={18} />}
                             {group.space.type === 'seminar' && <UserIcon size={18} />}
                             {group.space.type === 'lab' && <MapPin size={18} />}
                        </div>
                    </div>
                    
                    <div className="mb-4">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 leading-tight mb-1">{group.space.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{group.space.floor}</p>
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-50 dark:border-slate-700 flex justify-between items-center">
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">{group.seats.length}</span> {group.seats.length === 1 ? 'Seat' : 'Seats'}
                        </div>
                        <div className="flex gap-1">
                            {group.seats.slice(0, 3).map(seat => (
                                <span key={seat} className="text-[10px] font-mono bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                                    {seat}
                                </span>
                            ))}
                            {group.seats.length > 3 && (
                                <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                                    +{group.seats.length - 3}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            ))}
            
            <button 
                onClick={() => document.getElementById('spaces-grid')?.scrollIntoView({ behavior: 'smooth' })}
                className="min-w-[100px] flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all snap-center"
            >
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-white dark:group-hover:bg-slate-700">
                    <ArrowLeft size={16} className="rotate-180" />
                </div>
                <span className="text-xs font-bold">Book More</span>
            </button>
        </div>
      </div>
    );
  };

  const renderHome = () => (
    <div className="max-w-7xl mx-auto px-4 py-12 animate-fade-in">
      <div className="text-center mb-16">
        <span className="text-indigo-600 dark:text-indigo-400 font-bold tracking-wider uppercase text-xs mb-2 block">Campus Facilities</span>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-slate-900 dark:text-white tracking-tight">
          Find your perfect <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">workspace</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto font-light">
          Reserve seats in the library, seminar halls, or labs instantly. Check real-time availability and manage your bookings effortlessly.
        </p>
      </div>

      {renderSchedule()}

      <div id="spaces-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-2">
        {SPACES.map(space => (
          <button
            key={space.id}
            onClick={() => handleSpaceSelect(space)}
            className="group relative flex flex-col text-left bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 hover:shadow-2xl hover:shadow-indigo-500/20 dark:hover:shadow-indigo-500/10 hover:-translate-y-2 transition-all duration-300 border border-slate-100 dark:border-slate-700"
          >
            <div className={`h-48 w-full bg-gradient-to-br ${space.imageGradient} relative overflow-hidden`}>
              <div className="absolute inset-0 bg-white/10 group-hover:bg-transparent transition-colors"></div>
              <div className="absolute bottom-4 left-6 text-white transform group-hover:scale-110 transition-transform origin-bottom-left duration-500">
                {space.type === 'library' && <Armchair size={56} strokeWidth={1.5} />}
                {space.type === 'seminar' && <UserIcon size={56} strokeWidth={1.5} />}
                {space.type === 'lab' && <MapPin size={56} strokeWidth={1.5} />}
              </div>
            </div>
            
            <div className="p-8 flex flex-col flex-grow w-full">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{space.name}</h3>
                <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full">{space.floor}</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed line-clamp-2">{space.description}</p>
              
              <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-700 w-full">
                <div className="flex flex-wrap gap-2 mb-4">
                  {space.tags.map(tag => (
                    <span key={tag} className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center text-indigo-600 dark:text-indigo-400 text-sm font-semibold group-hover:translate-x-1 transition-transform">
                  Check Availability <ChevronRight size={16} className="ml-1" />
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderTimeSelection = () => {
    const filteredSlots = TIME_SLOTS.filter(slot => 
      timeFilter === 'ALL' ? true : slot.period === timeFilter
    );

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700 transition-colors duration-300">
          <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-slate-100 dark:border-slate-700 pb-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Select a Time</h2>
              <p className="text-slate-500 dark:text-slate-400">
                Booking for <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{state.selectedSpace?.name}</span>
              </p>
            </div>
            
            {/* Filter Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-700 p-1.5 rounded-xl self-start sm:self-auto">
              {(['ALL', 'AM', 'PM'] as const).map((filter) => (
                 <button
                  key={filter}
                  onClick={() => setTimeFilter(filter)}
                  className={`px-6 py-2 rounded-lg text-sm font-bold transition-all shadow-sm ${
                    timeFilter === filter 
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-md' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-600/50 shadow-transparent'
                  }`}
                >
                  {filter === 'ALL' ? 'All Day' : filter}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {filteredSlots.map(time => (
              <button
                key={time.id}
                onClick={() => handleTimeSelect(time)}
                className="relative flex flex-col items-center justify-center py-6 px-4 rounded-2xl border-2 transition-all duration-200 group bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500/50"
              >
                <span className="text-xl font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">{time.label}</span>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 group-hover:text-indigo-400">{time.period}</span>
                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div>
              </button>
            ))}
          </div>
          
          {filteredSlots.length === 0 && (
              <div className="text-center py-16">
                  <div className="text-slate-300 dark:text-slate-600 mb-2"><Clock size={48} className="mx-auto" /></div>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">No time slots available for {timeFilter}.</p>
              </div>
          )}
        </div>
      </div>
    );
  };

  const renderSeatSelection = () => {
    if (!state.selectedSpace) return null;

    return (
      <div className="max-w-6xl mx-auto px-4 py-6 animate-fade-in">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Map Area */}
          <div className="flex-grow bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 lg:p-10 shadow-xl shadow-slate-200/60 dark:shadow-slate-900/60 transition-colors duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Select Seats</h2>
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700 px-4 py-2 rounded-lg border border-slate-100 dark:border-slate-600 text-sm font-medium text-slate-600 dark:text-slate-300">
                 <Clock size={16} className="text-indigo-500 dark:text-indigo-400" />
                 {state.selectedTime?.label} {state.selectedTime?.period}
              </div>
            </div>

            <SeatMap 
              space={state.selectedSpace} 
              selectedSeats={state.selectedSeats} 
              onToggleSeat={toggleSeat} 
              bookedSeats={getBookedSeatIds()}
            />
            
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-center gap-8">
               <div className="flex items-center gap-2">
                 <div className="w-4 h-4 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500"></div>
                 <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Available</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-4 h-4 rounded bg-indigo-600 dark:bg-indigo-500 shadow-md shadow-indigo-500/40"></div>
                 <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Selected</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"></div>
                 <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Occupied</span>
               </div>
            </div>
          </div>

          {/* Sidebar Summary */}
          <div className="lg:w-80 flex-shrink-0">
             <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sticky top-24 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 transition-colors duration-300">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Booking Summary</h3>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg"><MapPin size={18} /></div>
                    <div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Space</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{state.selectedSpace.name}</p>
                    </div>
                  </div>
                   <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg"><Calendar size={18} /></div>
                    <div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Time</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Today, {state.selectedTime?.label} {state.selectedTime?.period}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4 mb-6 border border-slate-100 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Seats</span>
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{state.selectedSeats.length}</span>
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 break-words">
                    {state.selectedSeats.length > 0 ? state.selectedSeats.join(', ') : 'No seats selected'}
                  </div>
                </div>

                <button
                  onClick={handleConfirm}
                  disabled={state.selectedSeats.length === 0}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed hover:-translate-y-0.5 transition-all"
                >
                  Confirm Booking
                </button>
             </div>
          </div>
        </div>
      </div>
    );
  };

  const renderConfirmation = () => (
    <div className="max-w-md mx-auto px-4 py-16 text-center animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl shadow-slate-200/60 dark:shadow-slate-900/60 border border-slate-100 dark:border-slate-700 relative overflow-hidden transition-colors duration-300">
        {/* Decorative circle */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-green-50 dark:bg-green-900/20 rounded-full"></div>
        
        <div className="relative z-10">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle2 size={32} strokeWidth={3} />
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">You're all set!</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">A confirmation email has been sent to your student ID.</p>

          <div className="border-t-2 border-dashed border-slate-100 dark:border-slate-700 my-6 relative">
             <div className="absolute -left-10 -top-3 w-6 h-6 bg-slate-50 dark:bg-slate-900 rounded-full"></div>
             <div className="absolute -right-10 -top-3 w-6 h-6 bg-slate-50 dark:bg-slate-900 rounded-full"></div>
          </div>

          <div className="space-y-4 text-left">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Location</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{state.selectedSpace?.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Time</span>
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{state.selectedTime?.label} {state.selectedTime?.period}</span>
            </div>
             <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Seats</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{state.selectedSeats.join(', ')}</span>
            </div>
          </div>

          <div className="mt-8 pt-6">
             <div className="w-full h-16 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-600">
                 <span className="text-slate-400 dark:text-slate-500 text-xs font-mono tracking-widest">BARCODE-SCAN-HERE</span>
             </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleReset}
        className="mt-8 text-slate-500 dark:text-slate-400 font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm flex items-center justify-center gap-2 mx-auto"
      >
        <ArrowLeft size={16} /> Book Another Space
      </button>
    </div>
  );

  // If not logged in, show Login page (assuming simple gatekeeping)
  if (state.step === 'login') {
      return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-500">
      <Navbar user={user} onProfileClick={navigateToProfile} />

      {/* Breadcrumb / Back Button */}
      {state.step !== 'home' && state.step !== 'confirmation' && (
        <div className="max-w-7xl mx-auto px-4 py-6 w-full animate-fade-in">
          <button 
            onClick={goBack}
            className="group flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-4 py-2 rounded-lg hover:bg-white dark:hover:bg-slate-800"
          >
            <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center group-hover:border-indigo-200 dark:group-hover:border-indigo-500 shadow-sm">
               <ArrowLeft size={16} />
            </div>
            <span className="font-medium">Back</span>
          </button>
        </div>
      )}

      <main className="flex-grow">
        {state.step === 'home' && renderHome()}
        {state.step === 'time' && renderTimeSelection()}
        {state.step === 'seats' && renderSeatSelection()}
        {state.step === 'confirmation' && renderConfirmation()}
        {state.step === 'profile' && user && <Profile user={user} onLogout={handleLogout} />}
      </main>

      <footer className="mt-auto py-8 text-center text-slate-400 dark:text-slate-500 text-xs border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors duration-300">
        <p>© 2024 Find My Space. K.K Wagh Institute Of Engineering Project.</p>
      </footer>
    </div>
  );
}

export default App;