import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/StatusBadge';
import { FeedbackDialog } from '@/components/FeedbackDialog';
import { ComplaintDialog } from '@/components/ComplaintDialog';
import { DonationTimeline } from '@/components/DonationTimeline';
import { useAuth } from '@/hooks/useAuth';
import { useListings, DonationListing } from '@/hooks/useListings';
import { useRequests, DonationRequest } from '@/hooks/useRequests';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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
  AlertTriangle,
  Loader2,
  Star,
  Truck
} from 'lucide-react';

const ListingDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, role } = useAuth();
  const { getListingById, updateListingStatus } = useListings();
  const { getRequestsByListing, updateRequestStatus } = useRequests();

  const [listing, setListing] = useState<DonationListing | null>(null);
  const [requests, setRequests] = useState<DonationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [complaintDialogOpen, setComplaintDialogOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<{
    listingId: string;
    toUserId: string;
    toUserName: string;
  } | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<{
    toUserId: string;
    toUserName: string;
    listingId: string;
  } | null>(null);

  // Fetch listing and request data
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setIsLoading(true);
      const listingData = await getListingById(id);
      setListing(listingData);

      if (listingData) {
        const requestsData = await getRequestsByListing(id);
        setRequests(requestsData);
      }

      setIsLoading(false);
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Real-time subscription for listing status changes
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`listing-status-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'donation_listings',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          // Update listing state with new data
          const newData = payload.new as DonationListing;
          setListing(prev => prev ? { ...prev, ...newData } : null);
          console.log('Listing status updated in real-time:', newData.status);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

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

  const isDonor = role === 'donor' && listing.donor_id === user?.id;
  const isNGO = role === 'ngo';
  const acceptedRequest = requests.find(r => r.status === 'accepted');

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await updateRequestStatus({ requestId, status: 'accepted', listingId: listing.id });
      const updatedRequests = await getRequestsByListing(listing.id);
      setRequests(updatedRequests);
      toast({
        title: 'Request Accepted!',
        description: 'The NGO has been notified and contact details are now shared.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to accept request.',
        variant: 'destructive',
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await updateRequestStatus({ requestId, status: 'rejected', listingId: listing.id });
      const updatedRequests = await getRequestsByListing(listing.id);
      setRequests(updatedRequests);
      toast({
        title: 'Request Declined',
        description: 'The NGO has been notified.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to decline request.',
        variant: 'destructive',
      });
    }
  };

  const handleMarkPickedUp = async () => {
    try {
      await updateListingStatus({ listingId: listing.id, status: 'picked_up' });
      setListing(prev => prev ? { ...prev, status: 'picked_up' } : null);
      toast({
        title: 'Marked as Picked Up! 🚗',
        description: 'The NGO has picked up the donation.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark as picked up.',
        variant: 'destructive',
      });
    }
  };

  const handleMarkCompleted = async () => {
    try {
      await updateListingStatus({ listingId: listing.id, status: 'completed' });
      setListing(prev => prev ? { ...prev, status: 'completed' } : null);
      toast({
        title: 'Donation Completed! 🎉',
        description: 'Thank you for making a difference!',
      });

      // Open feedback dialog for the NGO
      if (acceptedRequest) {
        setSelectedFeedback({
          listingId: listing.id,
          toUserId: acceptedRequest.ngo_id,
          toUserName: acceptedRequest.ngo_profile?.org_name || acceptedRequest.ngo_profile?.name || 'NGO',
        });
        setFeedbackDialogOpen(true);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark as completed.',
        variant: 'destructive',
      });
    }
  };

  const handleReportIssue = (userId: string, userName: string) => {
    setSelectedComplaint({
      toUserId: userId,
      toUserName: userName,
      listingId: listing.id,
    });
    setComplaintDialogOpen(true);
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
                src={listing.photos?.[0] || 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800'}
                alt={listing.food_category}
                className="w-full h-64 md:h-80 object-cover"
              />
              <div className="absolute top-4 left-4">
                <StatusBadge status={listing.status} />
              </div>
              <div className="absolute top-4 right-4">
                <Badge className="bg-background/80 backdrop-blur-sm text-foreground">
                  {listing.food_type === 'veg' && <Leaf className="h-3 w-3 mr-1 text-green-600" />}
                  {listing.food_type === 'non-veg' && <Drumstick className="h-3 w-3 mr-1 text-red-600" />}
                  {listing.food_type === 'veg' ? 'Vegetarian' : listing.food_type === 'non-veg' ? 'Non-Veg' : 'Mixed'}
                </Badge>
              </div>
            </div>

            {/* Details */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-2xl">{listing.food_category}</CardTitle>
                <p className="text-muted-foreground">{listing.donor_profile?.org_name || 'Unknown Donor'}</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Quantity</p>
                      <p className="font-medium">{listing.quantity} {listing.quantity_unit}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Package className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Packaging</p>
                      <p className="font-medium">{listing.packaging_type || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Pickup Window</p>
                      <p className="font-medium">
                        {format(new Date(listing.pickup_time_start), 'MMM d, h:mm a')} - {format(new Date(listing.pickup_time_end), 'h:mm a')}
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

                {listing.hygiene_notes && (
                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span className="font-medium text-amber-800">Hygiene Notes</span>
                    </div>
                    <p className="text-sm text-amber-700">{listing.hygiene_notes}</p>
                    {listing.allergens && listing.allergens.length > 0 && (
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

                {/* Timeline Visualization - visible for confirmed, picked_up, and completed statuses */}
                {isDonor && (listing.status === 'confirmed' || listing.status === 'picked_up' || listing.status === 'completed') && (
                  <DonationTimeline
                    currentStatus={listing.status}
                    createdAt={listing.created_at}
                    updatedAt={listing.updated_at}
                    hasAcceptedRequest={!!acceptedRequest}
                  />
                )}

                {/* Info for confirmed status - NGO should mark as picked up */}
                {isDonor && listing.status === 'confirmed' && (
                  <div className="space-y-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate(`/chat/${listing.id}`)}
                    >
                      <MessageSquare className="h-4 w-4" />
                      Chat with NGO
                    </Button>
                  </div>
                )}

                {/* Action buttons for picked_up status - Donor confirms completion */}
                {isDonor && listing.status === 'picked_up' && (
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex gap-3">
                      <Button onClick={handleMarkCompleted} className="flex-1">
                        <CheckCircle2 className="h-4 w-4" />
                        Confirm Completion
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/chat/${listing.id}`)}
                      >
                        <MessageSquare className="h-4 w-4" />
                        Chat
                      </Button>
                    </div>
                  </div>
                )}

                {/* Feedback button for completed listings */}
                {isDonor && listing.status === 'completed' && acceptedRequest && (
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedFeedback({
                          listingId: listing.id,
                          toUserId: acceptedRequest.ngo_id,
                          toUserName: acceptedRequest.ngo_profile?.org_name || acceptedRequest.ngo_profile?.name || 'NGO',
                        });
                        setFeedbackDialogOpen(true);
                      }}
                    >
                      <Star className="h-4 w-4" />
                      Give Feedback
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-amber-600 hover:text-amber-700"
                      onClick={() => handleReportIssue(
                        acceptedRequest.ngo_id,
                        acceptedRequest.ngo_profile?.org_name || acceptedRequest.ngo_profile?.name || 'NGO'
                      )}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Report Issue
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
                    requests.map((request) => (
                      <div key={request.id} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{request.ngo_profile?.org_name || 'Unknown NGO'}</span>
                          <Badge variant={
                            request.status === 'accepted' ? 'default' :
                              request.status === 'rejected' ? 'destructive' : 'secondary'
                          }>
                            {request.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{request.message}</p>
                        <p className="text-xs text-muted-foreground mb-3">
                          Requested: {format(new Date(request.requested_pickup_time), 'MMM d, h:mm a')}
                        </p>

                        {request.status === 'accepted' && request.ngo_profile && (
                          <div className="p-3 rounded-lg bg-green-50 border border-green-200 mb-3">
                            <p className="text-xs font-medium text-green-800 mb-2">Contact Details</p>
                            <div className="space-y-1 text-sm text-green-700">
                              {request.ngo_profile.contact && (
                                <p className="flex items-center gap-2">
                                  <Phone className="h-3 w-3" /> {request.ngo_profile.contact}
                                </p>
                              )}
                              <p className="flex items-center gap-2">
                                <Mail className="h-3 w-3" /> {request.ngo_profile.email}
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

                        {/* Reconsideration flow - allow accepting previously rejected requests */}
                        {request.status === 'rejected' && listing.status !== 'confirmed' && listing.status !== 'completed' && (
                          <div className="mt-3 pt-3 border-t">
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full border-green-300 text-green-700 hover:bg-green-50"
                              onClick={() => handleAcceptRequest(request.id)}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Reconsider & Accept
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            )}

            {/* Donor Contact (NGO View - only if confirmed) */}
            {isNGO && acceptedRequest?.ngo_id === user?.id && (
              <Card className="glass-card border-green-200 bg-green-50/50">
                <CardHeader>
                  <CardTitle className="text-lg text-green-800">Pickup Confirmed!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-green-700">Contact the restaurant to coordinate pickup:</p>
                  <div className="space-y-2">
                    {listing.donor_profile?.contact && (
                      <p className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-green-600" />
                        {listing.donor_profile.contact}
                      </p>
                    )}
                    {listing.donor_profile?.email && (
                      <p className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-green-600" />
                        {listing.donor_profile.email}
                      </p>
                    )}
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => navigate(`/chat/${listing.id}`)}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Open Chat
                  </Button>
                  {listing.status === 'completed' && (
                    <>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setSelectedFeedback({
                            listingId: listing.id,
                            toUserId: listing.donor_id,
                            toUserName: listing.donor_profile?.org_name || listing.donor_profile?.name || 'Donor',
                          });
                          setFeedbackDialogOpen(true);
                        }}
                      >
                        <Star className="h-4 w-4" />
                        Give Feedback
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full text-amber-600 hover:text-amber-700"
                        onClick={() => handleReportIssue(
                          listing.donor_id,
                          listing.donor_profile?.org_name || listing.donor_profile?.name || 'Donor'
                        )}
                      >
                        <AlertTriangle className="h-4 w-4" />
                        Report Issue
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {selectedFeedback && (
        <FeedbackDialog
          open={feedbackDialogOpen}
          onOpenChange={setFeedbackDialogOpen}
          listingId={selectedFeedback.listingId}
          toUserId={selectedFeedback.toUserId}
          toUserName={selectedFeedback.toUserName}
        />
      )}

      {selectedComplaint && (
        <ComplaintDialog
          open={complaintDialogOpen}
          onOpenChange={setComplaintDialogOpen}
          toUserId={selectedComplaint.toUserId}
          toUserName={selectedComplaint.toUserName}
          listingId={selectedComplaint.listingId}
        />
      )}
    </Layout>
  );
};

export default ListingDetailPage;