import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md'
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#09090B]/80 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Dialog surface */}
      <div className={`relative w-full ${maxWidthStyles[maxWidth]} bg-[#111114] border border-[#27272D] rounded-2xl shadow-2xl p-6 z-10 transition-all duration-200`}>
        <div className="flex items-center justify-between pb-4 border-b border-[#27272D]/60 mb-5">
          {title && <h3 className="text-lg font-semibold text-[#F4F1EA]">{title}</h3>}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9A9AA3] hover:text-[#F4F1EA] hover:bg-[#18181D] transition-colors ml-auto"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
