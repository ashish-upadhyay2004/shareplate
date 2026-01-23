import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NotificationSettings } from '@/components/NotificationSettings';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Camera,
  Loader2,
  CheckCircle2
} from 'lucide-react';

const ProfilePage = () => {
  const { user, profile, updateProfile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    org_name: '',
    contact: '',
    address: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        org_name: profile.org_name || '',
        contact: profile.contact || '',
        address: profile.address || '',
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Delete old avatar if exists
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/food-photos/')[1];
        if (oldPath) {
          await supabase.storage.from('food-photos').remove([oldPath]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('food-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('food-photos')
        .getPublicUrl(fileName);

      await updateProfile({ avatar_url: publicUrl });
      await refreshProfile();

      toast({
        title: 'Avatar updated!',
        description: 'Your profile picture has been updated.',
      });
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload avatar.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateProfile(formData);
      await refreshProfile();
      toast({
        title: 'Profile updated!',
        description: 'Your changes have been saved.',
      });
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update profile.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your account details</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Notification Settings */}
          <NotificationSettings />

          {/* Avatar Section */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                Profile Picture
              </CardTitle>
              <CardDescription>Upload a photo for your profile</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.name} />
                  <AvatarFallback className="text-2xl bg-primary/10">
                    {profile?.name ? getInitials(profile.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                )}
              </div>
              <div className="text-center sm:text-left">
                <label className="cursor-pointer">
                  <Button type="button" variant="outline" disabled={isUploading} asChild>
                    <span>
                      <Camera className="h-4 w-4 mr-2" />
                      {isUploading ? 'Uploading...' : 'Change Photo'}
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
                <p className="text-sm text-muted-foreground mt-2">
                  JPG, PNG or GIF. Max 2MB.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Personal Info */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Personal Information
              </CardTitle>
              <CardDescription>Your basic account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email
                </Label>
                <Input
                  id="email"
                  value={profile?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="org_name" className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  Organization Name
                </Label>
                <Input
                  id="org_name"
                  name="org_name"
                  value={formData.org_name}
                  onChange={handleChange}
                  placeholder="Your organization or restaurant name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact" className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  Phone Number
                </Label>
                <Input
                  id="contact"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Address
                </Label>
                <Textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Your full address"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </form>
      </div>
    </Layout>
  );
};

export default ProfilePage;
