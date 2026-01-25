import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DonationRequest } from '@/hooks/useRequests';
import { Clock, ArrowRight, Building, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface PendingRequestsCardProps {
  requests: DonationRequest[];
  isLoading?: boolean;
}

export const PendingRequestsCard = ({ requests, isLoading }: PendingRequestsCardProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card className="glass-card border-amber-200 bg-amber-50/50">
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return null;
  }

  return (
    <Card className="glass-card border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
          <Clock className="h-5 w-5" />
          Pending Requests ({requests.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.slice(0, 5).map((request) => (
          <div 
            key={request.id} 
            className="flex items-center justify-between p-3 rounded-lg bg-white border border-amber-100 hover:border-amber-300 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-amber-600" />
                <span className="font-medium truncate text-sm">
                  {request.ngo_profile?.org_name || request.ngo_profile?.name || 'Unknown NGO'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {request.listing?.food_category || 'Food Donation'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(request.created_at), 'MMM d, h:mm a')}
                </span>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => navigate(`/donor/listing/${request.listing_id}`)}
              className="ml-2 shrink-0"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {requests.length > 5 && (
          <p className="text-xs text-center text-amber-700">
            +{requests.length - 5} more pending requests
          </p>
        )}
      </CardContent>
    </Card>
  );
};
