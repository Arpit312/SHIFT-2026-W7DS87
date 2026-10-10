import React from 'react';
import { cn } from '@/lib/utils';

export interface ChargeSathiLogoProps {
  size?: number;
  variant?: 'full' | 'mark' | 'mono';
  className?: string;
}

export function ChargeSathiLogo({ size = 24, variant = 'full', className }: ChargeSathiLogoProps) {
  if (variant === 'mono') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 256 256"
        width={size}
        height={size}
        aria-label="ChargeSathi Logo"
        className={cn('text-current', className)}
      >
        <path fillRule="evenodd" clipRule="evenodd" fill="currentColor" d="M 32,128 C 32,75 75,32 128,32 C 181,32 224,75 224,128 C 224,181 181,224 128,224 C 105.7,224 85.1,216.5 68.7,204 L 32,224 L 52,187.3 C 39.5,170.9 32,150.3 32,128 Z M 140,80 L 92,144 L 124,144 L 116,176 L 164,112 L 132,112 L 140,80 Z" />
      </svg>
    );
  }

  // full or mark
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      width={size}
      height={size}
      aria-label="ChargeSathi Logo"
      className={className}
    >
      <defs>
        <linearGradient id="cs-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF7A1A" />
          <stop offset="100%" stopColor="#D9A93C" />
        </linearGradient>
      </defs>
      <path fillRule="evenodd" clipRule="evenodd" fill="url(#cs-grad)" d="M 32,128 C 32,75 75,32 128,32 C 181,32 224,75 224,128 C 224,181 181,224 128,224 C 105.7,224 85.1,216.5 68.7,204 L 32,224 L 52,187.3 C 39.5,170.9 32,150.3 32,128 Z M 140,80 L 92,144 L 124,144 L 116,176 L 164,112 L 132,112 L 140,80 Z" />
    </svg>
  );
}
