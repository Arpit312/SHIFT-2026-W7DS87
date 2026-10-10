import { Badge } from '@/components/ui/badge';
import {
  REQUEST_STATUSES,
  REQUEST_STATUS_LABELS,
  type RequestStatus,
  CONDITION_STATUSES,
  CONDITION_STATUS_LABELS,
  type ConditionStatus
} from '@/lib/constants';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  FileText,
  FileCheck2,
  Wrench,
  HelpCircle
} from 'lucide-react';
import type { ReactNode } from 'react';

interface StatusBadgeProps {
  status: RequestStatus | ConditionStatus;
  type: 'request' | 'condition';
  className?: string;
}

export function StatusBadge({ status, type, className }: StatusBadgeProps) {
  let label = '';
  let variant: React.ComponentProps<typeof Badge>['variant'] = 'default';
  let icon: ReactNode = null;

  if (type === 'request') {
    label = REQUEST_STATUS_LABELS[status as RequestStatus];
    switch (status) {
      case REQUEST_STATUSES.DRAFT:
        variant = 'secondary';
        icon = <FileText className="w-3 h-3 mr-1" />;
        break;
      case REQUEST_STATUSES.SUBMITTED:
      case REQUEST_STATUSES.PHOTO_CHECK_PENDING:
      case REQUEST_STATUSES.AWAITING_VERIFICATION:
      case REQUEST_STATUSES.AWAITING_RWA_DECISION:
        variant = 'info';
        icon = <Clock className="w-3 h-3 mr-1" />;
        break;
      case REQUEST_STATUSES.REVIEW_REQUIRED:
      case REQUEST_STATUSES.CORRECTIVE_ACTION_REQUIRED:
        variant = 'warning';
        icon = <AlertCircle className="w-3 h-3 mr-1" />;
        break;
      case REQUEST_STATUSES.APPROVED:
        variant = 'success';
        icon = <CheckCircle2 className="w-3 h-3 mr-1" />;
        break;
      case REQUEST_STATUSES.APPROVED_WITH_CONDITIONS:
        variant = 'success';
        icon = <FileCheck2 className="w-3 h-3 mr-1" />;
        break;
      case REQUEST_STATUSES.REJECTED:
        variant = 'danger';
        icon = <XCircle className="w-3 h-3 mr-1" />;
        break;
      case REQUEST_STATUSES.CLOSED:
        variant = 'default';
        icon = <CheckCircle2 className="w-3 h-3 mr-1" />;
        break;
      default:
        variant = 'default';
        icon = <HelpCircle className="w-3 h-3 mr-1" />;
    }
  } else if (type === 'condition') {
    label = CONDITION_STATUS_LABELS[status as ConditionStatus];
    switch (status) {
      case CONDITION_STATUSES.PENDING:
        variant = 'warning';
        icon = <Clock className="w-3 h-3 mr-1" />;
        break;
      case CONDITION_STATUSES.PROOF_SUBMITTED:
      case CONDITION_STATUSES.UNDER_REVIEW:
        variant = 'info';
        icon = <Clock className="w-3 h-3 mr-1" />;
        break;
      case CONDITION_STATUSES.VERIFIED:
        variant = 'success';
        icon = <CheckCircle2 className="w-3 h-3 mr-1" />;
        break;
      case CONDITION_STATUSES.REWORK_REQUIRED:
        variant = 'danger';
        icon = <Wrench className="w-3 h-3 mr-1" />;
        break;
      default:
        variant = 'default';
        icon = <HelpCircle className="w-3 h-3 mr-1" />;
    }
  }

  return (
    <Badge variant={variant} className={className}>
      {icon}
      {label}
    </Badge>
  );
}
