-- Add missing fields to align with Epic 1 technical specification
-- This migration adds fields that were in the spec but not in the initial schema

-- Add display_name to profiles table
ALTER TABLE public.profiles
ADD COLUMN display_name TEXT;

-- Add description and icon_url to servers table
ALTER TABLE public.servers
ADD COLUMN description TEXT,
ADD COLUMN icon_url TEXT;

-- Add role to server_members table
-- Default to 'member' for existing records, 'owner' will be set by the auto-add trigger
ALTER TABLE public.server_members
ADD COLUMN role TEXT NOT NULL DEFAULT 'member'
CHECK (role IN ('owner', 'admin', 'member'));

-- Update existing server_members to set owner role correctly
UPDATE public.server_members sm
SET role = 'owner'
FROM public.servers s
WHERE sm.server_id = s.id
  AND sm.user_id = s.owner_id;

-- Add description and position to channels table
ALTER TABLE public.channels
ADD COLUMN description TEXT,
ADD COLUMN position INTEGER DEFAULT 0;

-- Update existing channels to have sequential positions per server
WITH ranked_channels AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY server_id ORDER BY created_at) - 1 as new_position
  FROM public.channels
)
UPDATE public.channels c
SET position = rc.new_position
FROM ranked_channels rc
WHERE c.id = rc.id;

-- Update the handle_new_server function to set role='owner' for server creator
CREATE OR REPLACE FUNCTION public.handle_new_server()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.server_members (server_id, user_id, role)
  VALUES (new.id, new.owner_id, 'owner');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: We're keeping the composite primary key (server_id, user_id) for server_members
-- Adding an 'id' UUID field would be a breaking change and the composite key works well
