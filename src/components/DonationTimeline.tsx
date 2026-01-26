import { forwardRef } from 'react';
import { CheckCircle2, Clock, Package } from 'lucide-react';
import { format } from 'date-fns';
import { DonationStatus } from '@/hooks/useListings';

interface DonationTimelineProps {
  currentStatus: DonationStatus;
  createdAt: string;
  updatedAt: string;
  hasAcceptedRequest: boolean;
}

export const DonationTimeline = forwardRef<HTMLDivElement, DonationTimelineProps>(({
  currentStatus,
  createdAt,
  updatedAt,
  hasAcceptedRequest,
}, ref) => {
  // Define which statuses are "completed" in the timeline
  const getStatusIndex = (status: DonationStatus): number => {
    const order: DonationStatus[] = ['posted', 'requested', 'confirmed', 'picked_up', 'completed'];
    return order.indexOf(status);
  };

  const currentIndex = getStatusIndex(currentStatus);

  // Simplified timeline steps - single-step donor completion flow
  const steps = [
    {
      status: 'confirmed',
      label: 'Request Accepted',
      description: 'Donation request confirmed',
      icon: CheckCircle2,
      actor: 'donor' as const,
      completed: currentIndex >= 2,
      current: currentStatus === 'confirmed' || currentStatus === 'picked_up',
    },
    {
      status: 'completed',
      label: 'Completed',
      description: 'Donor verified donation completion',
      icon: Package,
      actor: 'donor' as const,
      completed: currentIndex >= 4,
      current: currentStatus === 'completed',
    },
  ];

  // Only show the timeline if we have at least a confirmed status
  if (currentIndex < 2 && !hasAcceptedRequest) {
    return null;
  }

  return (
    <div ref={ref} className="bg-muted/30 rounded-xl p-4 border">
      <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
        <Clock className="h-4 w-4 text-primary" />
        Donation Progress Timeline
      </h4>
      
      <div className="relative">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = step.completed;
          const isCurrent = step.current;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.status} className="flex items-start gap-3 relative">
              {/* Vertical line */}
              {!isLast && (
                <div 
                  className={`absolute left-[14px] top-8 w-0.5 h-8 ${
                    isCompleted ? 'bg-green-500' : 'bg-muted-foreground/20'
                  }`}
                />
              )}
              
              {/* Status circle */}
              <div 
                className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center z-10 ${
                  isCompleted 
                    ? 'bg-green-500 text-white' 
                    : isCurrent 
                      ? 'bg-primary text-primary-foreground ring-2 ring-primary/30' 
                      : 'bg-muted-foreground/20 text-muted-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>

              {/* Content */}
              <div className={`pb-6 ${isLast ? 'pb-0' : ''}`}>
                <div className="flex items-center gap-2">
                  <span className={`font-medium text-sm ${
                    isCompleted || isCurrent ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.label}
                  </span>
                  {isCurrent && !isCompleted && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      Current
                    </span>
                  )}
                  {isCompleted && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {step.description}
                </p>
                {isCompleted && (
                  <p className="text-xs text-muted-foreground/70 mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {step.status === currentStatus 
                      ? format(new Date(updatedAt), 'MMM d, h:mm a')
                      : 'Completed'
                    }
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Status-specific messages */}
      {(currentStatus === 'confirmed' || currentStatus === 'picked_up') && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span><strong>Action required:</strong> Mark as completed once the NGO has collected the donation</span>
          </p>
        </div>
      )}

      {currentStatus === 'completed' && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span><strong>Donation completed!</strong> Thank you for making a difference</span>
          </p>
        </div>
      )}
    </div>
  );
});

DonationTimeline.displayName = 'DonationTimeline';
