-- Add coordinates to donation_listings for map view
ALTER TABLE public.donation_listings 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Create push_subscriptions table for Web Push
CREATE TABLE public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, endpoint)
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own subscriptions
CREATE POLICY "Users can view own subscriptions"
ON public.push_subscriptions
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create own subscriptions"
ON public.push_subscriptions
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own subscriptions"
ON public.push_subscriptions
FOR DELETE
USING (user_id = auth.uid());

-- Service role can read all subscriptions for sending notifications
CREATE POLICY "Service can read all subscriptions"
ON public.push_subscriptions
FOR SELECT
USING (true);