import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0">
      {toasts.map(toast => {
        let bg = 'bg-white border-pink-200 text-slate-800';
        let icon = <Info className="w-5 h-5 text-sky-500 shrink-0" />;

        if (toast.type === 'success') {
          bg = 'bg-white border-emerald-200 text-slate-800 shadow-lg';
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
        } else if (toast.type === 'error') {
          bg = 'bg-white border-rose-200 text-slate-800 shadow-lg';
          icon = <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-3.5 rounded-2xl border ${bg} shadow-md transition-all animate-in fade-in slide-in-from-bottom-2 duration-200`}
          >
            {icon}
            <div className="flex-1 text-sm font-medium leading-snug">{toast.message}</div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-lg"
              title="Đóng thông báo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
