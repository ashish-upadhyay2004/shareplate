import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/context/AppContext';
import { format } from 'date-fns';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MessageSquare,
  MapPin,
  Package,
  ArrowRight,
  Inbox
} from 'lucide-react';

const NGORequestsPage = () => {
  const { currentUser, getRequestsByNgo, getListingById, users } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pending');

  const myRequests = getRequestsByNgo(currentUser?.id || '');

  const pendingRequests = myRequests.filter(r => r.status === 'pending');
  const acceptedRequests = myRequests.filter(r => r.status === 'accepted');
  const rejectedRequests = myRequests.filter(r => r.status === 'rejected');

  const getRequestsForTab = () => {
    switch (activeTab) {
      case 'pending': return pendingRequests;
      case 'confirmed': return acceptedRequests;
      case 'completed': return rejectedRequests;
      default: return myRequests;
    }
  };

  const currentRequests = getRequestsForTab();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Requests</h1>
          <p className="text-muted-foreground">Track your donation requests</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pending
              {pendingRequests.length > 0 && (
                <Badge variant="secondary" className="ml-1">{pendingRequests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Confirmed
              {acceptedRequests.length > 0 && (
                <Badge variant="secondary" className="ml-1">{acceptedRequests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <XCircle className="h-4 w-4" />
              Declined
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {currentRequests.length === 0 ? (
              <Card className="p-12 text-center">
                <Inbox className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-medium mb-2">No {activeTab} requests</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {activeTab === 'pending' && "Browse available donations to make requests"}
                </p>
                {activeTab === 'pending' && (
                  <Button onClick={() => navigate('/ngo/explore')}>
                    Explore Donations
                  </Button>
                )}
              </Card>
            ) : (
              <div className="grid gap-4">
                {currentRequests.map((request) => {
                  const listing = getListingById(request.listingId);
                  const donor = users.find(u => u.id === listing?.donorId);
                  
                  if (!listing) return null;

                  return (
                    <Card key={request.id} className="glass-card-hover overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row">
                          {/* Image */}
                          <div className="md:w-48 h-32 md:h-auto flex-shrink-0">
                            <img 
                              src={listing.photos[0]} 
                              alt={listing.foodCategory}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Content */}
                          <div className="flex-1 p-5">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div>
                                <h3 className="font-semibold text-lg">{listing.foodCategory}</h3>
                                <p className="text-sm text-muted-foreground">{listing.donorOrg}</p>
                              </div>
                              <Badge variant={
                                request.status === 'accepted' ? 'default' :
                                request.status === 'rejected' ? 'destructive' : 'secondary'
                              }>
                                {request.status === 'pending' ? 'Awaiting Response' :
                                 request.status === 'accepted' ? 'Confirmed' : 'Declined'}
                              </Badge>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-3 text-sm mb-4">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Package className="h-4 w-4" />
                                {listing.quantity} {listing.quantityUnit}
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                {listing.location}
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                Pickup: {format(new Date(request.requestedPickupTime), 'MMM d, h:mm a')}
                              </div>
                            </div>

                            {/* Timeline for accepted */}
                            {request.status === 'accepted' && (
                              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200 mb-4">
                                <div className="flex gap-2 items-center flex-1">
                                  <div className="h-2 w-2 rounded-full bg-green-500" />
                                  <span className="text-xs text-green-700">Confirmed</span>
                                  <div className="h-px flex-1 bg-green-300" />
                                  <div className="h-2 w-2 rounded-full bg-green-300" />
                                  <span className="text-xs text-green-600">Pickup</span>
                                  <div className="h-px flex-1 bg-green-300" />
                                  <div className="h-2 w-2 rounded-full bg-green-300" />
                                  <span className="text-xs text-green-600">Complete</span>
                                </div>
                              </div>
                            )}

                            {/* Contact info for accepted */}
                            {request.status === 'accepted' && donor && (
                              <div className="flex flex-wrap gap-3">
                                <Button size="sm" variant="outline" asChild>
                                  <a href={`tel:${donor.contact}`}>Call {donor.contact}</a>
                                </Button>
                                <Button 
                                  size="sm" 
                                  onClick={() => navigate(`/chat/${listing.id}`)}
                                >
                                  <MessageSquare className="h-4 w-4" />
                                  Open Chat
                                </Button>
                              </div>
                            )}

                            {request.status === 'pending' && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => navigate(`/ngo/listing/${listing.id}`)}
                              >
                                View Details
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default NGORequestsPage;
