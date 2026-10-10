'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Sidebar } from './sidebar';
import type { Role } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role;
}

export function MobileDrawer({ isOpen, onClose, role }: MobileDrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Drawer */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 w-3/4 max-w-sm bg-surface shadow-xl transition-transform duration-300 ease-in-out transform",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-4 p-2 text-text-muted hover:text-text-primary bg-surface rounded-md z-10"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
        <Sidebar role={role} className="border-r-0" onNavigate={onClose} />
      </div>
    </div>,
    document.body
  );
}
