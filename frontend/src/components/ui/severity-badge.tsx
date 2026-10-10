import { Badge } from '@/components/ui/badge';
import { SEVERITIES, SEVERITY_LABELS, type Severity } from '@/lib/constants';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const label = SEVERITY_LABELS[severity];
  
  if (severity === SEVERITIES.CRITICAL) {
    return (
      <Badge variant="danger" className={className}>
        <AlertTriangle className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  }

  if (severity === SEVERITIES.MAJOR) {
    return (
      <Badge variant="warning" className={className}>
        <AlertCircle className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  }

  return (
    <Badge variant="info" className={className}>
      <Info className="w-3 h-3 mr-1" />
      {label}
    </Badge>
  );
}
