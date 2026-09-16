import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#09090B]/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer surface */}
      <div className="relative w-full bg-[#111114] border-t border-[#27272D] rounded-t-3xl p-6 z-10 max-h-[85vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-250">
        {/* Pull handle */}
        <div className="w-12 h-1.5 bg-[#27272D] rounded-full mx-auto mb-4" />
        
        <div className="flex items-center justify-between pb-3 border-b border-[#27272D]/60 mb-4">
          {title && <h3 className="text-base font-semibold text-[#F4F1EA]">{title}</h3>}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#9A9AA3] hover:text-[#F4F1EA] hover:bg-[#18181D]"
          >
            <X size={18} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
};
