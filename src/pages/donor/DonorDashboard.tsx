import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/StatCard';
import { ListingCard } from '@/components/ListingCard';
import { StatusBadge } from '@/components/StatusBadge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useListings } from '@/hooks/useListings';
import { Plus, Package, Clock, CheckCircle2, UtensilsCrossed, History, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { FeedbackDialog } from '@/components/FeedbackDialog';

const DonorDashboard = () => {
  const { user, profile } = useAuth();
  const { myListings, isMyListingsLoading } = useListings();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('active');
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [selectedListingForFeedback, setSelectedListingForFeedback] = useState<{
    listingId: string;
    toUserId: string;
    toUserName: string;
  } | null>(null);

  const activeListings = myListings.filter(l => ['posted', 'requested', 'confirmed'].includes(l.status));
  const completedListings = myListings.filter(l => l.status === 'completed');
  const expiredListings = myListings.filter(l => l.status === 'expired' || l.status === 'cancelled');
  const pendingRequests = myListings.filter(l => l.status === 'requested').length;
  const totalMeals = myListings
    .filter(l => l.status === 'completed')
    .reduce((sum, l) => sum + l.quantity, 0);

  if (isMyListingsLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {profile?.name?.split(' ')[0]}!</h1>
            <p className="text-muted-foreground">{profile?.org_name}</p>
          </div>
          <Button onClick={() => navigate('/donor/create-listing')}>
            <Plus className="h-4 w-4" />
            Create Listing
          </Button>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Package} label="Active Listings" value={activeListings.length} delay={0} />
          <StatCard icon={Clock} label="Pending Requests" value={pendingRequests} delay={100} />
          <StatCard icon={CheckCircle2} label="Completed" value={completedListings.length} delay={200} />
          <StatCard icon={UtensilsCrossed} label="Meals Donated" value={totalMeals} delay={300} />
        </div>

        {/* Listings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="active" className="gap-2">
              <Package className="h-4 w-4" />
              Active ({activeListings.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Completed ({completedListings.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {activeListings.length === 0 ? (
              <Card className="p-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-medium mb-2">No active listings</h3>
                <p className="text-muted-foreground text-sm mb-4">Create your first donation listing to get started</p>
                <Button onClick={() => navigate('/donor/create-listing')}>
                  <Plus className="h-4 w-4" />
                  Create Listing
                </Button>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeListings.map((listing) => (
                  <ListingCard 
                    key={listing.id} 
                    listing={listing}
                    onAction={() => navigate(`/donor/listing/${listing.id}`)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completedListings.length === 0 ? (
              <Card className="p-12 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-medium mb-2">No completed donations yet</h3>
                <p className="text-muted-foreground text-sm">Your completed donations will appear here</p>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedListings.map((listing) => (
                  <ListingCard 
                    key={listing.id} 
                    listing={listing}
                    showActions={false}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            <Card className="glass-card">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Food</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Quantity</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myListings.map((listing) => (
                      <tr 
                        key={listing.id} 
                        className="border-b hover:bg-muted/50 cursor-pointer"
                        onClick={() => navigate(`/donor/listing/${listing.id}`)}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={listing.photos?.[0] || 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop'} 
                              alt={listing.food_category}
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                            <span className="font-medium">{listing.food_category}</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm">{listing.quantity} {listing.quantity_unit}</td>
                        <td className="p-4">
                          <StatusBadge status={listing.status} />
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {format(new Date(listing.created_at), 'MMM d, yyyy')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {selectedListingForFeedback && (
        <FeedbackDialog
          open={feedbackDialogOpen}
          onOpenChange={setFeedbackDialogOpen}
          listingId={selectedListingForFeedback.listingId}
          toUserId={selectedListingForFeedback.toUserId}
          toUserName={selectedListingForFeedback.toUserName}
        />
      )}
    </Layout>
  );
};

export default DonorDashboard;
