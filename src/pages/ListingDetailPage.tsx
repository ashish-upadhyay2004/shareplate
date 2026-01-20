import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/StatusBadge';
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
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';

const ListingDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    currentUser, 
    getListingById, 
    getRequestsByListing, 
    updateRequestStatus,
    updateListingStatus,
    users
  } = useApp();

  const listing = getListingById(id || '');
  const requests = getRequestsByListing(id || '');

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

  const isDonor = currentUser?.role === 'donor' && listing.donorId === currentUser.id;
  const isNGO = currentUser?.role === 'ngo';
  const acceptedRequest = requests.find(r => r.status === 'accepted');

  const handleAcceptRequest = (requestId: string) => {
    updateRequestStatus(requestId, 'accepted');
    toast({
      title: 'Request Accepted!',
      description: 'The NGO has been notified and contact details are now shared.',
    });
  };

  const handleRejectRequest = (requestId: string) => {
    updateRequestStatus(requestId, 'rejected');
    toast({
      title: 'Request Declined',
      description: 'The NGO has been notified.',
    });
  };

  const handleMarkCompleted = () => {
    updateListingStatus(listing.id, 'completed');
    toast({
      title: 'Donation Completed! 🎉',
      description: 'Thank you for making a difference!',
    });
  };

  const getNgoDetails = (ngoId: string) => {
    return users.find(u => u.id === ngoId);
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
          Back
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
                      <p className="font-medium">{listing.address}</p>
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

                {/* Action buttons for confirmed status */}
                {isDonor && listing.status === 'confirmed' && (
                  <div className="flex gap-3 pt-4 border-t">
                    <Button onClick={handleMarkCompleted} className="flex-1" variant="success">
                      <CheckCircle2 className="h-4 w-4" />
                      Mark as Completed
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate(`/chat/${listing.id}`)}
                    >
                      <MessageSquare className="h-4 w-4" />
                      Chat
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Requests (Donor View) */}
            {isDonor && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg">Requests ({requests.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {requests.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No requests yet</p>
                    </div>
                  ) : (
                    requests.map((request) => {
                      const ngo = getNgoDetails(request.ngoId);
                      return (
                        <div key={request.id} className="p-4 rounded-lg border bg-card">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{request.ngoOrg}</span>
                            <Badge variant={
                              request.status === 'accepted' ? 'default' :
                              request.status === 'rejected' ? 'destructive' : 'secondary'
                            }>
                              {request.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{request.message}</p>
                          <p className="text-xs text-muted-foreground mb-3">
                            Requested: {format(new Date(request.requestedPickupTime), 'MMM d, h:mm a')}
                          </p>

                          {request.status === 'accepted' && ngo && (
                            <div className="p-3 rounded-lg bg-green-50 border border-green-200 mb-3">
                              <p className="text-xs font-medium text-green-800 mb-2">Contact Details</p>
                              <div className="space-y-1 text-sm text-green-700">
                                <p className="flex items-center gap-2">
                                  <Phone className="h-3 w-3" /> {ngo.contact}
                                </p>
                                <p className="flex items-center gap-2">
                                  <Mail className="h-3 w-3" /> {ngo.email}
                                </p>
                              </div>
                            </div>
                          )}

                          {request.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                className="flex-1"
                                onClick={() => handleAcceptRequest(request.id)}
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Accept
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleRejectRequest(request.id)}
                              >
                                <XCircle className="h-3 w-3" />
                                Decline
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            )}

            {/* Donor Contact (NGO View - only if confirmed) */}
            {isNGO && acceptedRequest?.ngoId === currentUser?.id && (
              <Card className="glass-card border-green-200 bg-green-50/50">
                <CardHeader>
                  <CardTitle className="text-lg text-green-800">Pickup Confirmed!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-green-700">Contact the restaurant to coordinate pickup:</p>
                  <div className="space-y-2">
                    <p className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-green-600" />
                      {users.find(u => u.id === listing.donorId)?.contact}
                    </p>
                    <p className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-green-600" />
                      {users.find(u => u.id === listing.donorId)?.email}
                    </p>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => navigate(`/chat/${listing.id}`)}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Open Chat
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ListingDetailPage;
