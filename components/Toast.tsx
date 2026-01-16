import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 5000); // Auto dismiss after 5 seconds

    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const icons = {
    success: <CheckCircle size={20} className="text-green-500" />,
    error: <AlertCircle size={20} className="text-red-500" />,
    info: <Info size={20} className="text-blue-500" />
  };

  const bgColors = {
    success: 'bg-white dark:bg-slate-800 border-l-4 border-green-500',
    error: 'bg-white dark:bg-slate-800 border-l-4 border-red-500',
    info: 'bg-white dark:bg-slate-800 border-l-4 border-blue-500'
  };

  return (
    <div className={`
      pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 
      flex items-start p-4 gap-3 transition-all duration-300 animate-slide-up
      ${bgColors[toast.type]}
    `}>
      <div className="flex-shrink-0 pt-0.5">
        {icons[toast.type]}
      </div>
      <div className="flex-1 w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-white">
          {toast.message}
        </p>
      </div>
      <div className="ml-4 flex flex-shrink-0">
        <button
          onClick={() => onClose(toast.id)}
          className="inline-flex rounded-md text-slate-400 hover:text-slate-500 focus:outline-none"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export const ToastContainer: React.FC<{ toasts: ToastMessage[], removeToast: (id: string) => void }> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-0 right-0 z-[100] flex flex-col gap-2 p-4 sm:p-6 pointer-events-none">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  );
};