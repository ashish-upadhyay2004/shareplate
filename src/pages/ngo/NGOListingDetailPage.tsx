import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/StatusBadge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  Leaf,
  Drumstick,
  Package,
  Send,
  AlertTriangle
} from 'lucide-react';

const NGOListingDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser, getListingById, createRequest, getRequestsByListing } = useApp();

  const listing = getListingById(id || '');
  const existingRequest = getRequestsByListing(id || '').find(r => r.ngoId === currentUser?.id);

  const [message, setMessage] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!listing) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <Package className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Listing Not Found</h1>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </Layout>
    );
  }

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    createRequest({
      listingId: listing.id,
      ngoId: currentUser!.id,
      ngoName: currentUser!.name,
      ngoOrg: currentUser!.orgName,
      message,
      requestedPickupTime: pickupTime ? new Date(pickupTime) : new Date(),
    });

    toast({
      title: 'Request Sent!',
      description: 'The restaurant will be notified of your request.',
    });

    setIsSubmitting(false);
    navigate('/ngo/requests');
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Explore
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image & Status */}
            <div className="relative rounded-2xl overflow-hidden">
              <img 
                src={listing.photos[0] || 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800'} 
                alt={listing.foodCategory}
                className="w-full h-64 md:h-80 object-cover"
              />
              <div className="absolute top-4 left-4">
                <StatusBadge status={listing.status} />
              </div>
              <div className="absolute top-4 right-4">
                <Badge className="bg-background/80 backdrop-blur-sm text-foreground">
                  {listing.foodType === 'veg' && <Leaf className="h-3 w-3 mr-1 text-green-600" />}
                  {listing.foodType === 'non-veg' && <Drumstick className="h-3 w-3 mr-1 text-red-600" />}
                  {listing.foodType === 'veg' ? 'Vegetarian' : listing.foodType === 'non-veg' ? 'Non-Veg' : 'Mixed'}
                </Badge>
              </div>
            </div>

            {/* Details */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-2xl">{listing.foodCategory}</CardTitle>
                <p className="text-muted-foreground">{listing.donorOrg}</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Quantity</p>
                      <p className="font-medium">{listing.quantity} {listing.quantityUnit}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Package className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Packaging</p>
                      <p className="font-medium">{listing.packagingType}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Pickup Window</p>
                      <p className="font-medium">
                        {format(new Date(listing.pickupTimeStart), 'MMM d, h:mm a')} - {format(new Date(listing.pickupTimeEnd), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Pickup Location</p>
                      <p className="font-medium">{listing.location}</p>
                      <p className="text-sm text-muted-foreground">{listing.address}</p>
                    </div>
                  </div>
                </div>

                {listing.hygieneNotes && (
                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span className="font-medium text-amber-800">Hygiene Notes</span>
                    </div>
                    <p className="text-sm text-amber-700">{listing.hygieneNotes}</p>
                    {listing.allergens.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {listing.allergens.map((allergen) => (
                          <Badge key={allergen} variant="outline" className="text-xs border-amber-300 text-amber-700">
                            {allergen}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Request Form */}
          <div>
            <Card className="glass-card sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Request This Donation</CardTitle>
              </CardHeader>
              <CardContent>
                {existingRequest ? (
                  <div className="text-center py-6">
                    <Badge variant={existingRequest.status === 'accepted' ? 'default' : 'secondary'} className="mb-3">
                      {existingRequest.status === 'pending' ? 'Request Pending' :
                       existingRequest.status === 'accepted' ? 'Request Accepted!' : 'Request Declined'}
                    </Badge>
                    <p className="text-sm text-muted-foreground mb-4">
                      {existingRequest.status === 'accepted' 
                        ? 'Check your requests page for contact details.'
                        : 'You have already requested this donation.'}
                    </p>
                    <Button onClick={() => navigate('/ngo/requests')} variant="outline" className="w-full">
                      View My Requests
                    </Button>
                  </div>
                ) : listing.status !== 'posted' ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <p className="text-sm">This donation is no longer available for requests.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitRequest} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="pickupTime">Preferred Pickup Time</Label>
                      <Input
                        id="pickupTime"
                        type="datetime-local"
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message to Donor</Label>
                      <Textarea
                        id="message"
                        placeholder="Introduce your organization and explain how this donation will help..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={4}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? 'Sending...' : 'Send Request'}
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NGOListingDetailPage;
