import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { MapView } from '@/components/MapView';
import { ListingCard } from '@/components/ListingCard';
import { useListings, DonationListing } from '@/hooks/useListings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, List, Map } from 'lucide-react';

const NGOMapPage = () => {
  const { listings, isLoading } = useListings();
  const navigate = useNavigate();
  const [selectedListing, setSelectedListing] = useState<DonationListing | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  const availableListings = listings.filter(l => l.status === 'posted');
  const listingsWithCoords = availableListings.filter(l => l.latitude && l.longitude);

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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Nearby Donations</h1>
            <p className="text-muted-foreground">
              Find available donations on the map
              {listingsWithCoords.length < availableListings.length && (
                <span className="ml-2 text-xs">
                  ({availableListings.length - listingsWithCoords.length} listings without location)
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'map' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('map')}
            >
              <Map className="h-4 w-4 mr-1" />
              Map
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4 mr-1" />
              List
            </Button>
          </div>
        </div>

        {viewMode === 'map' ? (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <MapView
                listings={listingsWithCoords}
                onListingClick={setSelectedListing}
              />
              {listingsWithCoords.length === 0 && (
                <Card className="mt-4">
                  <CardContent className="py-8 text-center">
                    <MapPin className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      No listings with location data available
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {selectedListing ? 'Selected Donation' : 'Click a marker'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedListing ? (
                    <div className="space-y-4">
                      <div>
                        <Badge variant={selectedListing.food_type === 'veg' ? 'default' : 'secondary'}>
                          {selectedListing.food_type === 'veg' ? '🥬 Vegetarian' : '🍖 Non-Veg'}
                        </Badge>
                      </div>
                      <h3 className="font-semibold">{selectedListing.food_category}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedListing.quantity} {selectedListing.quantity_unit}
                      </p>
                      <p className="text-sm">{selectedListing.location}</p>
                      <p className="text-xs text-muted-foreground">{selectedListing.address}</p>
                      <Button 
                        className="w-full"
                        onClick={() => navigate(`/ngo/listing/${selectedListing.id}`)}
                      >
                        View Details & Request
                      </Button>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Select a marker on the map to view donation details
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg">Available ({availableListings.length})</CardTitle>
                </CardHeader>
                <CardContent className="max-h-[300px] overflow-y-auto space-y-2">
                  {availableListings.map(listing => (
                    <div
                      key={listing.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedListing?.id === listing.id 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => setSelectedListing(listing)}
                    >
                      <p className="font-medium text-sm">{listing.food_category}</p>
                      <p className="text-xs text-muted-foreground">{listing.location}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableListings.map(listing => (
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

export default NGOMapPage;
