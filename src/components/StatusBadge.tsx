import { DonationStatus } from '@/types';
import { 
  Clock, 
  MessageSquare, 
  CheckCircle2, 
  PartyPopper, 
  Timer, 
  XCircle 
} from 'lucide-react';

interface StatusBadgeProps {
  status: DonationStatus;
  className?: string;
}

export const StatusBadge = ({ status, className = '' }: StatusBadgeProps) => {
  const config = {
    posted: {
      label: 'Available',
      icon: Clock,
      className: 'status-posted',
    },
    requested: {
      label: 'Requested',
      icon: MessageSquare,
      className: 'status-requested',
    },
    confirmed: {
      label: 'Confirmed',
      icon: CheckCircle2,
      className: 'status-confirmed',
    },
    completed: {
      label: 'Completed',
      icon: PartyPopper,
      className: 'status-completed',
    },
    expired: {
      label: 'Expired',
      icon: Timer,
      className: 'status-expired',
    },
    cancelled: {
      label: 'Cancelled',
      icon: XCircle,
      className: 'status-cancelled',
    },
  };

  const { label, icon: Icon, className: statusClass } = config[status];

  return (
    <span className={`status-badge ${statusClass} ${className}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
};
