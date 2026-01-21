
import React, { useState } from 'react';
import { User, Lock, ArrowRight, AlertCircle, Quote, Mail, Hash, ChevronLeft, KeyRound, CheckCircle2 } from 'lucide-react';
import { User as UserType } from '../types';
import { api } from '../api';

interface LoginProps {
  onLogin: (user: UserType) => void;
}

type ViewState = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD';

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [view, setView] = useState<ViewState>('LOGIN');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form States
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  // Password Reset Specific
  const [resetStep, setResetStep] = useState(1); // 1: ID, 2: Code, 3: New Pass
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const clearForms = () => {
    setError('');
    setSuccessMsg('');
    setStudentId('');
    setPassword('');
    setName('');
    setEmail('');
    setResetStep(1);
    setResetCode('');
    setNewPassword('');
  };

  const switchView = (v: ViewState) => {
    clearForms();
    setView(v);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
        const user = await api.login(studentId, password);
        onLogin(user);
    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
        const newUser = {
            studentId,
            password,
            name,
            email,
            settings: {
                emailNotifications: true,
                smsNotifications: false,
                publicProfile: false,
                darkMode: false
            }
        };
        const user = await api.register(newUser);
        onLogin(user);
    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  };

  const handleForgotPass = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
        if (resetStep === 1) {
            // Verify ID exists
            const exists = await api.verifyStudentId(studentId);
            if (!exists) throw new Error("Student ID not found.");
            setSuccessMsg("Verification code sent to email (Simulated: Use 1234)");
            setResetStep(2);
        } else if (resetStep === 2) {
            if (resetCode !== '1234') throw new Error("Invalid verification code.");
            setResetStep(3);
            setSuccessMsg("");
        } else if (resetStep === 3) {
            await api.resetPassword(studentId, newPassword);
            setSuccessMsg("Password reset successfully! Please login.");
            setTimeout(() => switchView('LOGIN'), 1500);
        }
    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900 transition-colors duration-500">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 animate-fade-in">
        <div className="max-w-md w-full">
            <div className="mb-8">
                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-indigo-500/20 mb-6">
                    F
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
                    {view === 'LOGIN' && 'Welcome Back'}
                    {view === 'REGISTER' && 'Create Account'}
                    {view === 'FORGOT_PASSWORD' && 'Reset Password'}
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                    {view === 'LOGIN' && 'Enter your credentials to access campus facilities.'}
                    {view === 'REGISTER' && 'Join the campus network to book spaces.'}
                    {view === 'FORGOT_PASSWORD' && 'Follow the steps to recover your account.'}
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-bold animate-pulse">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}
            
            {successMsg && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl flex items-center gap-3 text-green-600 dark:text-green-400 text-sm font-bold animate-pulse">
                    <CheckCircle2 size={18} />
                    {successMsg}
                </div>
            )}

            {/* --- LOGIN VIEW --- */}
            {view === 'LOGIN' && (
                <form onSubmit={handleLogin} className="space-y-5">
                    <InputField icon={<Hash size={20} />} label="Student ID" value={studentId} onChange={setStudentId} placeholder="1234" />
                    <InputField icon={<Lock size={20} />} label="Password" value={password} onChange={setPassword} type="password" placeholder="••••••••" />
                    
                    <div className="flex items-center justify-between text-sm pt-2">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800" />
                            <span className="text-slate-500 dark:text-slate-400 font-medium group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">Remember me</span>
                        </label>
                        <button type="button" onClick={() => switchView('FORGOT_PASSWORD')} className="text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">Forgot Password?</button>
                    </div>

                    <SubmitButton isLoading={isLoading} label="Sign In" />
                    
                    <div className="text-center mt-6">
                        <span className="text-slate-500 dark:text-slate-400 text-sm">Don't have an account? </span>
                        <button type="button" onClick={() => switchView('REGISTER')} className="text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:underline">Register Now</button>
                    </div>
                </form>
            )}

            {/* --- REGISTER VIEW --- */}
            {view === 'REGISTER' && (
                <form onSubmit={handleRegister} className="space-y-4">
                     <InputField icon={<User size={20} />} label="Full Name" value={name} onChange={setName} placeholder="John Doe" />
                     <InputField icon={<Hash size={20} />} label="Student ID" value={studentId} onChange={setStudentId} placeholder="Your ID" />
                     <InputField icon={<Mail size={20} />} label="Email Address" value={email} onChange={setEmail} placeholder="john@college.edu" />
                     <InputField icon={<Lock size={20} />} label="Password" value={password} onChange={setPassword} type="password" placeholder="Create a password" />

                    <SubmitButton isLoading={isLoading} label="Create Account" />

                    <div className="text-center mt-4">
                        <button type="button" onClick={() => switchView('LOGIN')} className="text-slate-500 dark:text-slate-400 font-bold text-sm hover:text-indigo-600 flex items-center justify-center gap-1 mx-auto">
                            <ChevronLeft size={16} /> Back to Login
                        </button>
                    </div>
                </form>
            )}

            {/* --- FORGOT PASSWORD VIEW --- */}
            {view === 'FORGOT_PASSWORD' && (
                <form onSubmit={handleForgotPass} className="space-y-5">
                    {resetStep === 1 && (
                         <InputField icon={<Hash size={20} />} label="Enter Student ID" value={studentId} onChange={setStudentId} placeholder="1234" />
                    )}
                    
                    {resetStep === 2 && (
                         <InputField icon={<KeyRound size={20} />} label="Verification Code" value={resetCode} onChange={setResetCode} placeholder="1234" />
                    )}

                    {resetStep === 3 && (
                         <InputField icon={<Lock size={20} />} label="New Password" value={newPassword} onChange={setNewPassword} type="password" placeholder="New Password" />
                    )}

                    <SubmitButton isLoading={isLoading} label={resetStep === 1 ? "Send Code" : resetStep === 2 ? "Verify Code" : "Reset Password"} />

                    <div className="text-center mt-4">
                        <button type="button" onClick={() => switchView('LOGIN')} className="text-slate-500 dark:text-slate-400 font-bold text-sm hover:text-indigo-600 flex items-center justify-center gap-1 mx-auto">
                            <ChevronLeft size={16} /> Cancel
                        </button>
                    </div>
                </form>
            )}
            
            <div className="mt-12 flex items-center justify-center gap-2 text-xs text-slate-400 font-medium uppercase tracking-widest">
                <Lock size={12} /> Secure Campus Access
            </div>
        </div>
      </div>

      {/* Right Side - Artistic Image */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/90 to-violet-900/90 z-10 mix-blend-multiply"></div>
          <img 
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80" 
            alt="Campus" 
            className="absolute inset-0 w-full h-full object-cover grayscale opacity-60"
          />
          
          <div className="relative z-20 text-white max-w-lg px-12 animate-slide-up">
              <h2 className="text-5xl font-extrabold mb-6 leading-tight">Your Space, <br/> Your Way.</h2>
              <p className="text-indigo-100 text-lg leading-relaxed font-light">
                  Reserve your favorite spot in the library, seminar halls, or labs in seconds. 
                  Experience the smartest way to manage your campus life.
              </p>
              <div className="mt-12 pt-8 border-t border-white/10">
                  <Quote size={24} className="text-indigo-400 mb-4 opacity-80" />
                  <p className="text-xl font-medium text-white/90 italic leading-relaxed">
                      "The best way to predict the future is to create it."
                  </p>
                  <p className="text-sm text-indigo-300 mt-4 font-bold uppercase tracking-widest">
                      — Peter Drucker
                  </p>
              </div>
          </div>
      </div>
    </div>
  );
};

// UI Components for cleanliness
const InputField = ({ icon, label, value, onChange, type = 'text', placeholder }: any) => (
    <div className="space-y-2 animate-fade-in">
        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">{label}</label>
        <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors">
                {React.cloneElement(icon, { className: "text-slate-400 group-focus-within:text-indigo-500" })}
            </div>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="block w-full pl-11 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                placeholder={placeholder}
                required
            />
        </div>
    </div>
);

const SubmitButton = ({ isLoading, label }: any) => (
    <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
    >
        {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
            <>
                {label} <ArrowRight size={20} />
            </>
        )}
    </button>
);
