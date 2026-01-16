import React, { useState, useEffect } from 'react';
import { User, Mail, Hash, LogOut, Bell, Shield, Moon } from 'lucide-react';
import { User as UserType } from '../types';

interface ProfileProps {
  user: UserType;
  onLogout: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onLogout }) => {
  const [settings, setSettings] = useState(user.settings);

  // Apply dark mode class to body when setting changes
  useEffect(() => {
    if (settings.darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [settings.darkMode]);

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-8">My Profile</h1>

      {/* User Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700 mb-8 flex flex-col md:flex-row items-center gap-6 md:gap-8 transition-colors duration-300">
        <div className="relative">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 p-1">
            <div className="w-full h-full rounded-full bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                <span className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">{user.name.charAt(0)}</span>
            </div>
          </div>
          <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-white dark:border-slate-800 rounded-full"></div>
        </div>
        
        <div className="text-center md:text-left flex-grow">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">{user.name}</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-4">Engineering Student</p>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300">
                <Hash size={14} className="text-indigo-500 dark:text-indigo-400" />
                <span className="font-semibold">{user.studentId}</span>
             </div>
             <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300">
                <Mail size={14} className="text-indigo-500 dark:text-indigo-400" />
                <span className="font-semibold">{user.email}</span>
             </div>
          </div>
        </div>
      </div>

      {/* Settings Section */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700 mb-8 transition-colors duration-300">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
            <h3 className="font-bold text-slate-800 dark:text-white">Account Settings</h3>
        </div>
        
        <div className="p-2">
            <SettingItem 
                icon={<Bell size={20} />}
                title="Email Notifications"
                description="Receive booking confirmations via email"
                isActive={settings.emailNotifications}
                onToggle={() => toggleSetting('emailNotifications')}
            />
             <SettingItem 
                icon={<Shield size={20} />}
                title="Public Profile"
                description="Allow other students to see your basic info"
                isActive={settings.publicProfile}
                onToggle={() => toggleSetting('publicProfile')}
            />
             <SettingItem 
                icon={<Moon size={20} />}
                title="Dark Mode"
                description="Switch to a dark theme interface"
                isActive={settings.darkMode}
                onToggle={() => toggleSetting('darkMode')}
            />
        </div>
      </div>

      <button 
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
      >
        <LogOut size={20} />
        Sign Out
      </button>
    </div>
  );
};

// Helper component for settings toggle
const SettingItem: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    isActive: boolean;
    onToggle: () => void;
    disabled?: boolean;
}> = ({ icon, title, description, isActive, onToggle, disabled }) => (
    <div className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 rounded-xl transition-colors">
        <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-xl ${disabled ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'}`}>
                {icon}
            </div>
            <div>
                <h4 className={`font-bold text-sm ${disabled ? 'text-slate-400' : 'text-slate-800 dark:text-white'}`}>{title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
            </div>
        </div>
        
        <button 
            onClick={onToggle}
            disabled={disabled}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${isActive ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-600'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
            <span 
                className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ease-in-out ${isActive ? 'translate-x-6' : 'translate-x-0'}`}
            />
        </button>
    </div>
);