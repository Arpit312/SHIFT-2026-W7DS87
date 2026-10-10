import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  time?: string;
  icon?: ReactNode;
  active?: boolean;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <div key={item.id} className="relative pl-8">
            {/* Vertical line connecting items */}
            {!isLast && (
              <div
                className={cn(
                  'absolute top-8 left-3.5 -bottom-6 w-0.5',
                  item.active ? 'bg-brand-orange' : 'bg-cn-border'
                )}
                aria-hidden="true"
              />
            )}
            
            {/* Icon/dot */}
            <div
              className={cn(
                'absolute left-0 top-1 w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 bg-surface',
                item.active 
                  ? 'border-brand-orange text-brand-orange' 
                  : 'border-cn-border text-text-muted'
              )}
            >
              {item.icon || <div className={cn("w-2 h-2 rounded-full", item.active ? "bg-brand-orange" : "bg-cn-border")} />}
            </div>
            
            {/* Content */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline">
              <div>
                <h4 className={cn('text-sm font-medium', item.active ? 'text-text-primary' : 'text-text-muted')}>
                  {item.title}
                </h4>
                {item.description && (
                  <p className="mt-1 text-sm text-text-muted">
                    {item.description}
                  </p>
                )}
              </div>
              {item.time && (
                <span className="mt-1 sm:mt-0 text-xs text-text-muted whitespace-nowrap sm:ml-4">
                  {item.time}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
