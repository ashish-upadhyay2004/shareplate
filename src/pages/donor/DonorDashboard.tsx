import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/StatCard';
import { ListingCard } from '@/components/ListingCard';
import { StatusBadge } from '@/components/StatusBadge';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/card';
import { Plus, Package, Clock, CheckCircle2, UtensilsCrossed } from 'lucide-react';

const DonorDashboard = () => {
  const { currentUser, listings } = useApp();
  const navigate = useNavigate();

  const myListings = listings.filter(l => l.donorId === currentUser?.id);
  const activeListings = myListings.filter(l => ['posted', 'requested', 'confirmed'].includes(l.status));
  const completedListings = myListings.filter(l => l.status === 'completed');
  const pendingRequests = myListings.filter(l => l.status === 'requested').length;
  const totalMeals = myListings.reduce((sum, l) => sum + l.quantity, 0);

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
          <StatCard icon={UtensilsCrossed} label="Total Meals Donated" value={totalMeals} delay={300} />
        </div>

        {/* Active Listings */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your Active Listings</h2>
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
        </div>
      </div>
    </Layout>
  );
};

export default DonorDashboard;
