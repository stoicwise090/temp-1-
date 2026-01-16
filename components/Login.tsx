import React, { useState } from 'react';
import { User, Lock, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { USERS } from '../users';
import { User as UserType } from '../types';

interface LoginProps {
  onLogin: (user: UserType) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const user = USERS.find(u => u.studentId === studentId && u.password === password);

      if (user) {
        onLogin(user);
      } else {
        setError('Invalid Student ID or Password');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900 transition-colors duration-500">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 animate-fade-in">
        <div className="max-w-md w-full">
            <div className="mb-10">
                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-indigo-500/20 mb-6">
                    F
                </div>
                <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">Welcome Back</h1>
                <p className="text-slate-500 dark:text-slate-400 text-lg">Enter your credentials to access campus facilities.</p>
            </div>

            {error && (
                <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-bold animate-pulse">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Student ID</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors">
                            <User size={20} className="text-slate-400 group-focus-within:text-indigo-500" />
                        </div>
                        <input
                            type="text"
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            className="block w-full pl-11 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                            placeholder="1234"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Password</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors">
                            <Lock size={20} className="text-slate-400 group-focus-within:text-indigo-500" />
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="block w-full pl-11 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between text-sm pt-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800" />
                        <span className="text-slate-500 dark:text-slate-400 font-medium group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">Remember me</span>
                    </label>
                    <button type="button" className="text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">Forgot Password?</button>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            Sign In <ArrowRight size={20} />
                        </>
                    )}
                </button>
            </form>
            
            <div className="mt-12 flex items-center justify-center gap-2 text-xs text-slate-400 font-medium uppercase tracking-widest">
                <Lock size={12} /> Secure Campus Access
            </div>
        </div>
      </div>

      {/* Right Side - Artistic Image (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/90 to-violet-900/90 z-10 mix-blend-multiply"></div>
          <img 
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80" 
            alt="Campus" 
            className="absolute inset-0 w-full h-full object-cover grayscale opacity-60"
          />
          
          <div className="relative z-20 text-white max-w-lg px-12 animate-slide-up">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/20">
                <Sparkles size={32} className="text-indigo-300" />
              </div>
              <h2 className="text-5xl font-extrabold mb-6 leading-tight">Your Space, <br/> Your Way.</h2>
              <p className="text-indigo-100 text-lg leading-relaxed font-light">
                  Reserve your favorite spot in the library, seminar halls, or labs in seconds. 
                  Experience the smartest way to manage your campus life.
              </p>

              <div className="mt-12 flex gap-4">
                  <div className="flex -space-x-4">
                      <div className="w-10 h-10 rounded-full border-2 border-indigo-900 bg-slate-300"></div>
                      <div className="w-10 h-10 rounded-full border-2 border-indigo-900 bg-slate-400"></div>
                      <div className="w-10 h-10 rounded-full border-2 border-indigo-900 bg-slate-200"></div>
                  </div>
                  <div className="flex flex-col justify-center">
                      <span className="font-bold text-sm">2k+ Students</span>
                      <span className="text-xs text-indigo-300">Active Daily</span>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};