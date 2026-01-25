-- Add complaints table for the feedback/moderation system
CREATE TABLE public.complaints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  listing_id UUID REFERENCES public.donation_listings(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('inappropriate_behavior', 'food_quality', 'no_show', 'communication', 'safety', 'other')),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add is_blocked column to profiles for user blocking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blocked_reason TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS on complaints
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- RLS policies for complaints
CREATE POLICY "Users can view own complaints"
  ON public.complaints FOR SELECT
  USING (from_user_id = auth.uid() OR to_user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create complaints"
  ON public.complaints FOR INSERT
  WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Admins can update complaints"
  ON public.complaints FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete complaints"
  ON public.complaints FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_complaints_updated_at
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add monthly_analytics table for real analytics data
CREATE TABLE public.monthly_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020),
  donations_count INTEGER NOT NULL DEFAULT 0,
  meals_served INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(month, year)
);

-- Enable RLS on monthly_analytics
ALTER TABLE public.monthly_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for monthly_analytics
CREATE POLICY "Anyone can view analytics"
  ON public.monthly_analytics FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage analytics"
  ON public.monthly_analytics FOR ALL
  USING (has_role(auth.uid(), 'admin'));