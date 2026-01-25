-- Add 'picked_up' status to the donation_status enum
ALTER TYPE donation_status ADD VALUE IF NOT EXISTS 'picked_up' AFTER 'confirmed';