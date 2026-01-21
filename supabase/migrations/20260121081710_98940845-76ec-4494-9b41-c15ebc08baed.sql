-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('donor', 'ngo', 'admin');

-- Create food type enum
CREATE TYPE public.food_type AS ENUM ('veg', 'non-veg', 'both');

-- Create donation status enum
CREATE TYPE public.donation_status AS ENUM ('posted', 'requested', 'confirmed', 'completed', 'expired', 'cancelled');

-- Create request status enum
CREATE TYPE public.request_status AS ENUM ('pending', 'accepted', 'rejected');

-- Create verification status enum
CREATE TYPE public.verification_status AS ENUM ('pending', 'approved', 'rejected');

-- Create user roles table (for RBAC)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    org_name TEXT,
    contact TEXT,
    address TEXT,
    avatar_url TEXT,
    verification_status verification_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create donation listings table
CREATE TABLE public.donation_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    food_type food_type NOT NULL DEFAULT 'both',
    food_category TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    quantity_unit TEXT NOT NULL DEFAULT 'servings',
    packaging_type TEXT,
    prepared_time TIMESTAMP WITH TIME ZONE NOT NULL,
    expiry_time TIMESTAMP WITH TIME ZONE NOT NULL,
    pickup_time_start TIMESTAMP WITH TIME ZONE NOT NULL,
    pickup_time_end TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT NOT NULL,
    address TEXT NOT NULL,
    status donation_status NOT NULL DEFAULT 'posted',
    photos TEXT[] DEFAULT '{}',
    hygiene_notes TEXT,
    allergens TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create donation requests table
CREATE TABLE public.donation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES public.donation_listings(id) ON DELETE CASCADE NOT NULL,
    ngo_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message TEXT,
    requested_pickup_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status request_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create feedback/ratings table
CREATE TABLE public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES public.donation_listings(id) ON DELETE CASCADE NOT NULL,
    from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat messages table
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES public.donation_listings(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false,
    listing_id UUID REFERENCES public.donation_listings(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for donation_listings
CREATE POLICY "Anyone can view posted listings"
ON public.donation_listings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Donors can create listings"
ON public.donation_listings FOR INSERT
TO authenticated
WITH CHECK (donor_id = auth.uid() AND public.has_role(auth.uid(), 'donor'));

CREATE POLICY "Donors can update own listings"
ON public.donation_listings FOR UPDATE
TO authenticated
USING (donor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Donors can delete own listings"
ON public.donation_listings FOR DELETE
TO authenticated
USING (donor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for donation_requests
CREATE POLICY "View own requests or requests on own listings"
ON public.donation_requests FOR SELECT
TO authenticated
USING (
    ngo_id = auth.uid() 
    OR EXISTS (
        SELECT 1 FROM public.donation_listings 
        WHERE id = listing_id AND donor_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "NGOs can create requests"
ON public.donation_requests FOR INSERT
TO authenticated
WITH CHECK (ngo_id = auth.uid() AND public.has_role(auth.uid(), 'ngo'));

CREATE POLICY "Update own requests or requests on own listings"
ON public.donation_requests FOR UPDATE
TO authenticated
USING (
    ngo_id = auth.uid() 
    OR EXISTS (
        SELECT 1 FROM public.donation_listings 
        WHERE id = listing_id AND donor_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
);

-- RLS Policies for feedback
CREATE POLICY "Anyone can view feedback"
ON public.feedback FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Participants can create feedback"
ON public.feedback FOR INSERT
TO authenticated
WITH CHECK (from_user_id = auth.uid());

-- RLS Policies for chat_messages
CREATE POLICY "Participants can view messages"
ON public.chat_messages FOR SELECT
TO authenticated
USING (
    sender_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.donation_listings 
        WHERE id = listing_id AND donor_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.donation_requests 
        WHERE listing_id = chat_messages.listing_id AND ngo_id = auth.uid() AND status = 'accepted'
    )
    OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Participants can send messages"
ON public.chat_messages FOR INSERT
TO authenticated
WITH CHECK (
    sender_id = auth.uid()
    AND (
        EXISTS (
            SELECT 1 FROM public.donation_listings 
            WHERE id = listing_id AND donor_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.donation_requests 
            WHERE listing_id = chat_messages.listing_id AND ngo_id = auth.uid() AND status = 'accepted'
        )
    )
);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create trigger for auto-creating profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, name, email)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'User'), NEW.email);
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for auto-creating role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role app_role;
BEGIN
    user_role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'donor');
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, user_role);
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_donation_listings_updated_at
    BEFORE UPDATE ON public.donation_listings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_donation_requests_updated_at
    BEFORE UPDATE ON public.donation_requests
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create storage bucket for food photos
INSERT INTO storage.buckets (id, name, public) VALUES ('food-photos', 'food-photos', true);

-- Storage policies for food photos
CREATE POLICY "Anyone can view food photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'food-photos');

CREATE POLICY "Authenticated users can upload food photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'food-photos');

CREATE POLICY "Users can update own photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'food-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'food-photos' AND auth.uid()::text = (storage.foldername(name))[1]);