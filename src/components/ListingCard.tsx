import { DonationListing } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Clock, 
  Users, 
  Leaf, 
  Drumstick,
  ChevronRight
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface ListingCardProps {
  listing: DonationListing;
  variant?: 'default' | 'compact';
  showActions?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

export const ListingCard = ({ 
  listing, 
  variant = 'default',
  showActions = true,
  actionLabel = 'View Details',
  onAction
}: ListingCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onAction) {
      onAction();
    } else {
      navigate(`/listing/${listing.id}`);
    }
  };

  const timeUntilExpiry = formatDistanceToNow(new Date(listing.expiryTime), { addSuffix: true });
  const pickupWindow = `${format(new Date(listing.pickupTimeStart), 'h:mm a')} - ${format(new Date(listing.pickupTimeEnd), 'h:mm a')}`;

  if (variant === 'compact') {
    return (
      <Card 
        className="glass-card-hover p-4 cursor-pointer"
        onClick={handleClick}
      >
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-xl overflow-hidden flex-shrink-0">
            {listing.photos[0] ? (
              <img 
                src={listing.photos[0]} 
                alt={listing.foodCategory}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-muted flex items-center justify-center">
                <Leaf className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium truncate">{listing.foodCategory}</h3>
              <StatusBadge status={listing.status} />
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {listing.donorOrg} • {listing.quantity} {listing.quantityUnit}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass-card-hover overflow-hidden group">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        {listing.photos[0] ? (
          <img 
            src={listing.photos[0]} 
            alt={listing.foodCategory}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
            <Leaf className="h-12 w-12 text-primary/30" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <StatusBadge status={listing.status} />
        </div>
        <div className="absolute top-3 right-3">
          <Badge 
            variant="secondary" 
            className="bg-background/80 backdrop-blur-sm"
          >
            {listing.foodType === 'veg' && <Leaf className="h-3 w-3 mr-1 text-green-600" />}
            {listing.foodType === 'non-veg' && <Drumstick className="h-3 w-3 mr-1 text-red-600" />}
            {listing.foodType === 'both' && '🍽️ '}
            {listing.foodType === 'veg' ? 'Vegetarian' : listing.foodType === 'non-veg' ? 'Non-Veg' : 'Mixed'}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        <div>
          <h3 className="font-semibold text-lg mb-1">{listing.foodCategory}</h3>
          <p className="text-sm text-muted-foreground">{listing.donorOrg}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{listing.quantity} {listing.quantityUnit}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="truncate">{timeUntilExpiry}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground col-span-2">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{listing.location}</span>
          </div>
        </div>

        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Pickup Window</p>
          <p className="text-sm font-medium">{pickupWindow}</p>
        </div>

        {showActions && (
          <Button 
            className="w-full" 
            variant={listing.status === 'posted' ? 'default' : 'outline'}
            onClick={handleClick}
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </Card>
  );
};
