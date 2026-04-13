import React, { useEffect } from 'react';
import { Check, Clock, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600';
  const icon = type === 'success' ? <Check size={20} /> : type === 'error' ? <X size={20} /> : <Clock size={20} />;

  return (
    <div className="fixed top-20 right-8 z-[200] animate-in slide-in-from-right duration-300">
      <div className={`${bgColor} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[300px]`}>
        <div className="flex-shrink-0">{icon}</div>
        <p className="flex-1 font-medium">{message}</p>
        <button type="button" onClick={onClose} className="flex-shrink-0 hover:opacity-80 transition-opacity">
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default Toast;
