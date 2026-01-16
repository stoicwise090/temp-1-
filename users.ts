import { User } from './types';

// Extending User interface to include password for authentication simulation
export interface AuthUser extends User {
  password: string;
}

// Add your users here
export const USERS: AuthUser[] = [
  {
    studentId: '1234',
    password: 'admin',
    name: 'Admin User',
    email: 'admin@findmyspace.edu',
    settings: {
        emailNotifications: true,
        smsNotifications: true,
        publicProfile: false,
        darkMode: false
    }
  },
  {
    studentId: '24901',
    password: 'password123',
    name: 'Alex Johnson',
    email: 'alex.j@kkwagh.edu.in',
    settings: {
        emailNotifications: true,
        smsNotifications: false,
        publicProfile: true,
        darkMode: false
    }
  },
   {
    studentId: '1111',
    password: '9090',
    name: 'Sara Bansod',
    email: 'sara@kkwagh.edu.in',
    settings: {
        emailNotifications: true,
        smsNotifications: false,
        publicProfile: true,
        darkMode: false
    }
  }
];
