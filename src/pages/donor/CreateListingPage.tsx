import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useListings, FoodType } from '@/hooks/useListings';
import { useStorage } from '@/hooks/useStorage';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Leaf, 
  Drumstick, 
  UtensilsCrossed,
  Clock,
  MapPin,
  Camera,
  AlertTriangle,
  CheckCircle2,
  Upload,
  Loader2
} from 'lucide-react';

const CreateListingPage = () => {
  const { profile } = useAuth();
  const { createListing, isCreating } = useListings();
  const { uploadFile, isUploading } = useStorage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    foodType: 'veg' as FoodType,
    foodCategory: '',
    quantity: '',
    quantityUnit: 'servings',
    packagingType: '',
    preparedTime: '',
    expiryTime: '',
    pickupTimeStart: '',
    pickupTimeEnd: '',
    location: profile?.address?.split(',')[0] || '',
    address: profile?.address || '',
    hygieneNotes: '',
    allergens: '',
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Upload photo if selected
      let photoUrl: string | undefined;
      if (photoFile) {
        photoUrl = await uploadFile(photoFile);
      }

      // Parse dates
      const now = new Date();
      const preparedTime = formData.preparedTime ? new Date(formData.preparedTime).toISOString() : new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
      const expiryTime = formData.expiryTime ? new Date(formData.expiryTime).toISOString() : new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString();
      const pickupTimeStart = formData.pickupTimeStart ? new Date(formData.pickupTimeStart).toISOString() : now.toISOString();
      const pickupTimeEnd = formData.pickupTimeEnd ? new Date(formData.pickupTimeEnd).toISOString() : new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString();

      await createListing({
        food_type: formData.foodType,
        food_category: formData.foodCategory,
        quantity: parseInt(formData.quantity) || 0,
        quantity_unit: formData.quantityUnit,
        packaging_type: formData.packagingType || undefined,
        prepared_time: preparedTime,
        expiry_time: expiryTime,
        pickup_time_start: pickupTimeStart,
        pickup_time_end: pickupTimeEnd,
        location: formData.location,
        address: formData.address,
        photos: photoUrl ? [photoUrl] : undefined,
        hygiene_notes: formData.hygieneNotes || undefined,
        allergens: formData.allergens.split(',').map(a => a.trim()).filter(Boolean),
      });

      navigate('/donor/dashboard');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create listing. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const foodTypeOptions = [
    { value: 'veg', label: 'Vegetarian', icon: Leaf, color: 'text-green-600' },
    { value: 'non-veg', label: 'Non-Vegetarian', icon: Drumstick, color: 'text-red-600' },
    { value: 'both', label: 'Mixed', icon: UtensilsCrossed, color: 'text-amber-600' },
  ];

  const packagingOptions = [
    'Individual containers',
    'Bento boxes',
    'Bulk containers',
    'Paper bags',
    'Thermal containers',
    'Wrapped items',
  ];

  const categoryOptions = [
    'Japanese Cuisine',
    'Bento Boxes',
    'Fresh Bread & Pastries',
    'Rice Dishes',
    'Curry & Rice',
    'Noodles',
    'Salads & Sides',
    'Desserts',
    'Beverages',
    'Mixed Meals',
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => navigate('/donor/dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create Donation Listing</h1>
          <p className="text-muted-foreground">Share your excess food with those in need</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Food Details */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5 text-primary" />
                Food Details
              </CardTitle>
              <CardDescription>Describe the food you're donating</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Food Type */}
              <div className="space-y-3">
                <Label>Food Type</Label>
                <RadioGroup
                  value={formData.foodType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, foodType: value as FoodType }))}
                  className="grid grid-cols-3 gap-4"
                >
                  {foodTypeOptions.map((option) => (
                    <Label
                      key={option.value}
                      htmlFor={`food-${option.value}`}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.foodType === option.value 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <RadioGroupItem value={option.value} id={`food-${option.value}`} className="sr-only" />
                      <option.icon className={`h-6 w-6 ${option.color}`} />
                      <span className="text-sm font-medium">{option.label}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="foodCategory">Food Category</Label>
                <Select 
                  value={formData.foodCategory} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, foodCategory: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    placeholder="e.g., 50"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantityUnit">Unit</Label>
                  <Select 
                    value={formData.quantityUnit} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, quantityUnit: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="servings">Servings</SelectItem>
                      <SelectItem value="boxes">Boxes</SelectItem>
                      <SelectItem value="pieces">Pieces</SelectItem>
                      <SelectItem value="kg">Kilograms</SelectItem>
                      <SelectItem value="plates">Plates</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Packaging */}
              <div className="space-y-2">
                <Label htmlFor="packagingType">Packaging Type</Label>
                <Select 
                  value={formData.packagingType} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, packagingType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select packaging" />
                  </SelectTrigger>
                  <SelectContent>
                    {packagingOptions.map((pkg) => (
                      <SelectItem key={pkg} value={pkg}>{pkg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Time & Location */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Time & Location
              </CardTitle>
              <CardDescription>When and where can NGOs pick up?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preparedTime">Prepared Time</Label>
                  <Input
                    id="preparedTime"
                    name="preparedTime"
                    type="datetime-local"
                    value={formData.preparedTime}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiryTime">Safe Until</Label>
                  <Input
                    id="expiryTime"
                    name="expiryTime"
                    type="datetime-local"
                    value={formData.expiryTime}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pickupTimeStart">Pickup Window Start</Label>
                  <Input
                    id="pickupTimeStart"
                    name="pickupTimeStart"
                    type="datetime-local"
                    value={formData.pickupTimeStart}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pickupTimeEnd">Pickup Window End</Label>
                  <Input
                    id="pickupTimeEnd"
                    name="pickupTimeEnd"
                    type="datetime-local"
                    value={formData.pickupTimeEnd}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location (Area)</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    name="location"
                    placeholder="e.g., Shibuya, Tokyo"
                    value={formData.location}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Full Address</Label>
                <Textarea
                  id="address"
                  name="address"
                  placeholder="Complete address for pickup"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Safety & Photos */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                Safety & Photos
              </CardTitle>
              <CardDescription>Important hygiene information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="hygieneNotes">Hygiene Notes</Label>
                <Textarea
                  id="hygieneNotes"
                  name="hygieneNotes"
                  placeholder="e.g., Prepared in certified kitchen. Stored at proper temperature."
                  value={formData.hygieneNotes}
                  onChange={handleChange}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="allergens">Allergens (comma-separated)</Label>
                <Input
                  id="allergens"
                  name="allergens"
                  placeholder="e.g., Soy, Wheat, Dairy"
                  value={formData.allergens}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label>Photo</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  {photoPreview ? (
                    <div className="space-y-4">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="mx-auto max-h-48 rounded-lg object-cover"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setPhotoFile(null);
                          setPhotoPreview(null);
                        }}
                      >
                        Remove Photo
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Click to upload a photo
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => navigate('/donor/dashboard')}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={isCreating || isUploading}
            >
              {isCreating || isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create Listing
                  <CheckCircle2 className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreateListingPage;
