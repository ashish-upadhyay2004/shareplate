-- Fix function search path for update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Drop the overly permissive notifications insert policy
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Create a more restrictive policy - users can only create notifications for valid recipients
CREATE POLICY "Authenticated users can create notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (
    -- Only allow creating notifications for yourself OR if you're involved in the listing
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.donation_listings 
        WHERE id = listing_id AND donor_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.donation_requests dr
        JOIN public.donation_listings dl ON dr.listing_id = dl.id
        WHERE dl.id = notifications.listing_id 
        AND (dr.ngo_id = auth.uid() OR dl.donor_id = auth.uid())
    )
    OR public.has_role(auth.uid(), 'admin')
);