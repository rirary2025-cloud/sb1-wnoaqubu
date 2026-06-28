import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
          <X size={20} />
        </button>
      </div>
      <div className="overflow-y-auto p-6 flex-1">{children}</div>
    </div>
  </div>
);
