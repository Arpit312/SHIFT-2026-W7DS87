'use client';

import { Menu, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { ROLE_LABELS } from '@/lib/constants';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { profile } = useAuth();

  return (
    <header className="h-16 border-b border-cn-border bg-surface/50 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-text-muted hover:text-text-primary focus:outline-none rounded-md"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        {profile && (
          <div className="hidden sm:flex flex-col">
            <span className="text-sm font-semibold text-text-primary">{profile.society_name}</span>
            <span className="text-xs text-brand-orange font-medium">{ROLE_LABELS[profile.role]}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-text-muted hover:text-text-primary rounded-full hover:bg-elevated transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-orange border-2 border-surface"></span>
        </button>
        
        {profile && (
          <div className="flex items-center gap-3 pl-4 border-l border-cn-border">
            <div className="w-8 h-8 rounded-full bg-brand-orange/20 text-brand-orange flex items-center justify-center font-semibold text-sm">
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block text-sm font-medium text-text-primary">
              {profile.full_name}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
