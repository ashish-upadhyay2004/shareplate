import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ListingCard } from '@/components/ListingCard';
import { useListings } from '@/hooks/useListings';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Search, Leaf, Drumstick, Package, Loader2 } from 'lucide-react';

const NGOExplorePage = () => {
  const { listings, isLoading } = useListings();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [foodTypeFilter, setFoodTypeFilter] = useState<string | null>(null);

  const availableListings = listings.filter(l => l.status === 'posted');
  
  const filteredListings = availableListings.filter(listing => {
    const matchesSearch = listing.food_category.toLowerCase().includes(search.toLowerCase()) ||
                          listing.location.toLowerCase().includes(search.toLowerCase());
    const matchesFoodType = !foodTypeFilter || listing.food_type === foodTypeFilter;
    return matchesSearch && matchesFoodType;
  });

  if (isLoading) {
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Find Available Donations</h1>
          <p className="text-muted-foreground">Browse and request food donations from nearby restaurants</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by food type or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Badge
              variant={foodTypeFilter === null ? 'default' : 'outline'}
              className="cursor-pointer px-4 py-2"
              onClick={() => setFoodTypeFilter(null)}
            >
              All
            </Badge>
            <Badge
              variant={foodTypeFilter === 'veg' ? 'default' : 'outline'}
              className="cursor-pointer px-4 py-2"
              onClick={() => setFoodTypeFilter('veg')}
            >
              <Leaf className="h-3 w-3 mr-1" />
              Veg
            </Badge>
            <Badge
              variant={foodTypeFilter === 'non-veg' ? 'default' : 'outline'}
              className="cursor-pointer px-4 py-2"
              onClick={() => setFoodTypeFilter('non-veg')}
            >
              <Drumstick className="h-3 w-3 mr-1" />
              Non-Veg
            </Badge>
          </div>
        </div>

        {/* Listings Grid */}
        {filteredListings.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-medium mb-2">No listings found</h3>
            <p className="text-muted-foreground text-sm">Try adjusting your filters or check back later</p>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                actionLabel="Request Donation"
                onAction={() => navigate(`/ngo/listing/${listing.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default NGOExplorePage;
