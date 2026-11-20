import React, { useEffect } from 'react';

export interface SlideOverDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  width?: 'sm' | 'md' | 'lg';
  footer?: React.ReactNode;
  children: React.ReactNode;
}

const WIDTH_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-2xl',
};

export const SlideOverDrawer: React.FC<SlideOverDrawerProps> = ({
  open,
  onClose,
  title,
  width = 'md',
  footer,
  children,
}) => {
  // Close on escape key & manage body scroll
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onClose]);

  const widthClass = WIDTH_CLASSES[width] || WIDTH_CLASSES.md;

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${
        open ? 'pointer-events-auto visible' : 'pointer-events-none invisible'
      }`}
      aria-modal="true"
      role="dialog"
      aria-label={title}
    >
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div
          className={`w-screen ${widthClass} transform bg-white border-l border-[#E5E4DF] shadow-2xl transition duration-300 ease-in-out flex flex-col ${
            open ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E4DF] bg-white sticky top-0 z-10">
            <h2 className="text-xl font-serif font-semibold text-[#1A1A1A] tracking-tight">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#6B6B65] hover:text-[#1A1A1A] hover:bg-[#F7F6F2] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
              aria-label="Close drawer"
            >
              <svg
                className="w-5 h-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {children}
          </div>

          {/* Sticky Footer */}
          {footer && (
            <div className="sticky bottom-0 px-6 py-4 bg-white border-t border-[#E5E4DF] flex items-center justify-end gap-3 z-10">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SlideOverDrawer;
