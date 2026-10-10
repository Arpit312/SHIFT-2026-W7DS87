import { cn } from '@/lib/utils';

export type ChargeSathiLogoVariant = 'full' | 'mark' | 'mono';

interface ChargeSathiLogoProps {
  size?: number;
  variant?: ChargeSathiLogoVariant;
  className?: string;
}

function MarkPaths({ variant }: { variant: ChargeSathiLogoVariant }) {
  const bubble = variant === 'mono' ? 'currentColor' : 'var(--cn-brand-orange)';
  const plug = variant === 'mono' ? 'currentColor' : 'var(--cn-gold)';
  const plugOpacity = variant === 'mono' ? 0.35 : 1;

  return (
    <>
      <path
        fill={bubble}
        d="M9 2.8h14A6.2 6.2 0 0 1 29.2 9v8.2A6.2 6.2 0 0 1 23 23.4h-8.4L6.8 30.2c-.58.43-1.4-.05-1.4-.76V23.4H9A6.2 6.2 0 0 1 2.8 17.2V9A6.2 6.2 0 0 1 9 2.8z"
      />
      <path
        fill={plug}
        fillOpacity={plugOpacity}
        d="M12.2 8.2h2.1v2.1h3.4V8.2h2.1v2.1h.8c.7 0 1.2.55 1.2 1.2v4.6c0 .7-.5 1.2-1.2 1.2h-1.15l-1.7 3.4h-1.7l-1.7-3.4H12.2c-.7 0-1.2-.5-1.2-1.2v-4.6c0-.65.5-1.2 1.2-1.2h.8V8.2zm2.1 4.1v2.2h3.4v-2.2h-3.4z"
      />
    </>
  );
}

export function ChargeSathiLogo({
  size = 32,
  variant = 'full',
  className,
}: ChargeSathiLogoProps) {
  const label = 'ChargeSathi';
  const wordmark = variant === 'full';

  return (
    <span
      className={cn('inline-flex items-center gap-2 text-text-primary', className)}
      role="img"
      aria-label={label}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
        className="shrink-0"
      >
        <MarkPaths variant={variant} />
      </svg>
      {wordmark ? (
        <span
          className="font-heading font-bold tracking-tight text-text-primary"
          style={{ fontSize: Math.max(12, Math.round(size * 0.45)) }}
        >
          {label}
        </span>
      ) : null}
    </span>
  );
}
