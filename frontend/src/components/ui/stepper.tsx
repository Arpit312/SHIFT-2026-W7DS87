import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface StepperProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <nav aria-label="Progress" className={cn('w-full', className)}>
      <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
        {steps.map((step, index) => {
          const status = index < currentStep ? 'complete' : index === currentStep ? 'current' : 'upcoming';

          return (
            <li key={step} className="md:flex-1">
              <div
                className={cn(
                  'group flex flex-col border-l-4 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4 transition-colors',
                  status === 'complete'
                    ? 'border-brand-orange'
                    : status === 'current'
                    ? 'border-brand-orange'
                    : 'border-cn-border'
                )}
              >
                <span className="text-sm font-medium">
                  {status === 'complete' ? (
                    <span className="flex items-center text-brand-orange">
                      <Check className="mr-1 h-4 w-4 shrink-0" />
                      Step {index + 1}
                    </span>
                  ) : status === 'current' ? (
                    <span className="text-brand-orange">Step {index + 1}</span>
                  ) : (
                    <span className="text-text-muted">Step {index + 1}</span>
                  )}
                </span>
                <span className={cn('text-sm font-medium', status === 'upcoming' ? 'text-text-muted' : 'text-text-primary')}>
                  {step}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
