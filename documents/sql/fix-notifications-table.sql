-- Fix notifications table schema
-- This migration updates the notifications table to match the expected schema

-- First, check if the old columns exist and rename/add new ones
DO $$
BEGIN
    -- Add notification_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'notifications' 
                   AND column_name = 'notification_type') THEN
        -- Check if 'kind' column exists (old schema)
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'notifications' 
                   AND column_name = 'kind') THEN
            -- Rename kind to notification_type
            ALTER TABLE public.notifications RENAME COLUMN kind TO notification_type;
        ELSE
            -- Add notification_type column
            ALTER TABLE public.notifications ADD COLUMN notification_type TEXT NOT NULL DEFAULT 'info';
        END IF;
    END IF;

    -- Add message column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'notifications' 
                   AND column_name = 'message') THEN
        -- Check if 'body' column exists (old schema)
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'notifications' 
                   AND column_name = 'body') THEN
            -- Rename body to message
            ALTER TABLE public.notifications RENAME COLUMN body TO message;
        ELSE
            -- Add message column
            ALTER TABLE public.notifications ADD COLUMN message TEXT NOT NULL DEFAULT '';
        END IF;
    END IF;

    -- Add action_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'notifications' 
                   AND column_name = 'action_url') THEN
        -- Check if 'link' column exists (old schema)
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'notifications' 
                   AND column_name = 'link') THEN
            -- Rename link to action_url
            ALTER TABLE public.notifications RENAME COLUMN link TO action_url;
        ELSE
            -- Add action_url column
            ALTER TABLE public.notifications ADD COLUMN action_url TEXT;
        END IF;
    END IF;

    -- Add related_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'notifications' 
                   AND column_name = 'related_type') THEN
        ALTER TABLE public.notifications ADD COLUMN related_type TEXT;
    END IF;

    -- Add related_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'notifications' 
                   AND column_name = 'related_id') THEN
        ALTER TABLE public.notifications ADD COLUMN related_id UUID;
    END IF;

    -- Add action_label column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'notifications' 
                   AND column_name = 'action_label') THEN
        ALTER TABLE public.notifications ADD COLUMN action_label TEXT;
    END IF;

    -- Add priority column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'notifications' 
                   AND column_name = 'priority') THEN
        ALTER TABLE public.notifications ADD COLUMN priority TEXT DEFAULT 'normal';
    END IF;

    -- Add expires_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'notifications' 
                   AND column_name = 'expires_at') THEN
        ALTER TABLE public.notifications ADD COLUMN expires_at TIMESTAMPTZ;
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_related ON public.notifications(related_type, related_id);

-- Enable realtime for notifications table (for real-time updates in UI)
DO $
BEGIN
    -- Check if notifications table is already in the realtime publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
END $;

-- Set replica identity to FULL for better realtime support
-- This ensures all columns are sent in realtime events, not just changed ones
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Verify the schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'notifications'
ORDER BY ordinal_position;
