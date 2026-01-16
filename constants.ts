import { Space, TimeSlot } from './types';

export const SPACES: Space[] = [
  {
    id: 'lib-main',
    name: 'Central Library',
    type: 'library',
    capacity: 120,
    floor: '2nd Floor',
    description: 'Quiet study area with individual cubicles and power outlets.',
    imageGradient: 'from-blue-500 to-cyan-400',
    tags: ['Quiet Zone', 'WiFi', 'AC'],
  },
  {
    id: 'sem-hall-a',
    name: 'Seminar Hall A',
    type: 'seminar',
    capacity: 250,
    floor: 'Ground Floor',
    description: 'Large auditorium for guest lectures and events.',
    imageGradient: 'from-violet-600 to-fuchsia-500',
    tags: ['Projector', 'Stage', 'Dolby Sound'],
  },
  {
    id: 'comp-lab-1',
    name: 'Computer Lab',
    type: 'lab',
    capacity: 45,
    floor: '1st Floor',
    description: 'High-performance workstations for programming and design.',
    imageGradient: 'from-emerald-500 to-teal-400',
    tags: ['i7 PCs', 'Dual Monitor', 'High Speed Net'],
  }
];

export const TIME_SLOTS: TimeSlot[] = [
  { id: '0900', label: '09:00', period: 'AM' },
  { id: '1000', label: '10:00', period: 'AM' },
  { id: '1100', label: '11:00', period: 'AM' },
  { id: '1200', label: '12:00', period: 'PM' },
  { id: '1300', label: '01:00', period: 'PM' },
  { id: '1400', label: '02:00', period: 'PM' },
  { id: '1500', label: '03:00', period: 'PM' },
  { id: '1600', label: '04:00', period: 'PM' },
];