import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/StatCard';
import { ListingCard } from '@/components/ListingCard';
import { StatusBadge } from '@/components/StatusBadge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/context/AppContext';
import { Plus, Package, Clock, CheckCircle2, UtensilsCrossed, History } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';

const DonorDashboard = () => {
  const { currentUser, listings } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('active');

  const myListings = listings.filter(l => l.donorId === currentUser?.id);
  const activeListings = myListings.filter(l => ['posted', 'requested', 'confirmed'].includes(l.status));
  const completedListings = myListings.filter(l => l.status === 'completed');
  const expiredListings = myListings.filter(l => l.status === 'expired' || l.status === 'cancelled');
  const pendingRequests = myListings.filter(l => l.status === 'requested').length;
  const totalMeals = myListings
    .filter(l => l.status === 'completed')
    .reduce((sum, l) => sum + l.quantity, 0);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {currentUser?.name?.split(' ')[0]}!</h1>
            <p className="text-muted-foreground">{currentUser?.orgName}</p>
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
                              src={listing.photos[0]} 
                              alt={listing.foodCategory}
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                            <span className="font-medium">{listing.foodCategory}</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm">{listing.quantity} {listing.quantityUnit}</td>
                        <td className="p-4">
                          <StatusBadge status={listing.status} />
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {format(new Date(listing.createdAt), 'MMM d, yyyy')}
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
    </Layout>
  );
};

export default DonorDashboard;
