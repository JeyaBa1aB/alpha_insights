import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white/20 backdrop-blur-lg rounded-xl shadow-2xl border border-white/30 p-8 min-w-[320px] max-w-lg relative">
        <button
          className="absolute top-4 right-4 text-white text-xl font-bold hover:text-indigo-400"
          onClick={onClose}
        >
          &times;
        </button>
        {title && <h2 className="text-2xl font-semibold mb-4 text-white">{title}</h2>}
        {children}
      </div>
    </div>
  );
};

export default Modal;
