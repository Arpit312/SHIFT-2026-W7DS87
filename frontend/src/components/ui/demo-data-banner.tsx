import { AlertTriangle } from 'lucide-react';

interface DemoDataBannerProps {
  /** Custom message. Defaults to generic demo-data wording. */
  message?: string;
  /** When false the banner is not rendered. Defaults to true. */
  show?: boolean;
}

export function DemoDataBanner({ message, show = true }: DemoDataBannerProps) {
  if (!show) return null;
  return (
    <div className="bg-warning/10 border-l-4 border-warning p-3 mb-6 flex items-start text-warning">
      <AlertTriangle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
      <div className="text-sm">
        <p className="font-semibold">Demonstration Data</p>
        <p className="mt-1 text-warning/80">
          {message ??
            'This section contains sample data for demonstration purposes only. It is not live or verified.'}
        </p>
      </div>
    </div>
  );
}
