'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  FilePlus, 
  MapPin, 
  ShieldCheck, 
  FolderOpen, 
  CheckSquare, 
  Calendar, 
  Receipt, 
  FileText, 
  GraduationCap, 
  User,
  LogOut,
  Settings,
  Users,
  Inbox,
  ScanSearch,
} from 'lucide-react';
import type { Role } from '@/lib/constants';
import { ROLES } from '@/lib/constants';
import { useAuth } from '@/hooks/use-auth';

interface SidebarProps {
  role: Role;
  className?: string;
  onNavigate?: () => void; // Used for closing mobile drawer
}

export function Sidebar({ role, className, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { logout, isLoggingOut } = useAuth();

  const getLinks = () => {
    switch (role) {
      case ROLES.EV_OWNER:
        return [
          { href: '/dashboard/owner', label: 'Overview', icon: LayoutDashboard },
          { href: '/dashboard/owner/new-request', label: 'New Charging Request', icon: FilePlus },
          { href: '/dashboard/owner/tracker', label: 'Request Tracker', icon: MapPin },
          { href: '/dashboard/owner/parking-screener', label: 'Parking Space Screener', icon: ScanSearch },
          { href: '/dashboard/owner/photo-check', label: 'Photo Check Report', icon: ShieldCheck },
          { href: '/dashboard/owner/evidence', label: 'Evidence Locker', icon: FolderOpen },
          { href: '/dashboard/owner/conditions', label: 'My Conditions', icon: CheckSquare },
          { href: '/dashboard/owner/slots', label: 'My Charging Slots', icon: Calendar },
          { href: '/dashboard/owner/bills', label: 'My Bills', icon: Receipt },
          { href: '/dashboard/owner/packet', label: 'Haan Packet', icon: FileText },
          { href: '/dashboard/owner/learn', label: 'Safety Learn', icon: GraduationCap },
          { href: '/dashboard/owner/profile', label: 'Profile & Vehicle', icon: User },
        ];
      case ROLES.RWA_ADMIN:
        return [
          { href: '/dashboard/rwa', label: 'Requests Inbox', icon: Inbox },
          { href: '/dashboard/rwa/settings', label: 'Society Settings', icon: Settings },
        ];
      case ROLES.ELECTRICIAN:
        return [
          { href: '/dashboard/electrician', label: 'Assigned Inspections', icon: CheckSquare },
        ];
      case ROLES.SUPER_ADMIN:
        return [
          { href: '/dashboard/admin', label: 'Platform Overview', icon: LayoutDashboard },
          { href: '/dashboard/admin/societies', label: 'Societies', icon: Users },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <div className={cn('flex flex-col h-full bg-surface border-r border-cn-border', className)}>
      <div className="p-6">
        <div className="flex items-center gap-2 text-brand-orange">
          <ShieldCheck className="w-8 h-8" />
          <span className="font-heading font-bold text-xl tracking-tight text-text-primary">ChargeNOC</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 space-y-1 scrollbar-thin">
        {links.map((link) => {
          const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/dashboard/owner');
          const Icon = link.icon;
          
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive 
                  ? 'bg-brand-orange/10 text-brand-orange' 
                  : 'text-text-muted hover:text-text-primary hover:bg-elevated'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive ? 'text-brand-orange' : 'text-text-muted')} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-cn-border">
        <button
          onClick={() => logout()}
          disabled={isLoggingOut}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
