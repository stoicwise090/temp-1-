import React from 'react';
import { MapPin, Search } from 'lucide-react';
import { User as UserType } from '../types';

interface NavbarProps {
    user: UserType | null;
    onProfileClick: () => void;
    onHomeClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onProfileClick, onHomeClick }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={onHomeClick}> 
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/30 transform group-hover:rotate-12 transition-transform duration-300">
              F
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
              Find<span className="text-indigo-600 dark:text-indigo-400">MySpace</span>
            </span>
          </div>

          {/* Location Selector (Mock) */}
          <div className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-full text-sm text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer border border-transparent hover:border-slate-300 dark:hover:border-slate-600">
            <MapPin size={16} className="text-indigo-500 dark:text-indigo-400" />
            <span>K.K Wagh Institute Of Engineering</span>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <button className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-full transition-all">
              <Search size={22} />
            </button>
            
            {user ? (
                <div 
                    onClick={onProfileClick}
                    className="flex items-center gap-3 pl-6 border-l border-slate-200 dark:border-slate-800 cursor-pointer group"
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{user.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">ID: {user.studentId}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-700 shadow-md flex items-center justify-center text-slate-500 dark:text-slate-400 overflow-hidden group-hover:border-indigo-200 dark:group-hover:border-indigo-500/50 transition-colors">
                    {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{user.name.charAt(0)}</span>
                    )}
                  </div>
                </div>
            ) : (
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};