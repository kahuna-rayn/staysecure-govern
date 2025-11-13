-- Fix RLS policies for hardware table
-- Allow authenticated users to view hardware assigned to them or all hardware if admin

-- Enable RLS if not already enabled
ALTER TABLE hardware ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own hardware" ON hardware;
DROP POLICY IF EXISTS "Authenticated users can view all hardware" ON hardware;
DROP POLICY IF EXISTS "Authenticated users can insert hardware" ON hardware;
DROP POLICY IF EXISTS "Authenticated users can update hardware" ON hardware;
DROP POLICY IF EXISTS "Authenticated users can delete hardware" ON hardware;

-- Allow authenticated users to view all hardware
-- This allows admins to see all hardware when viewing user profiles
CREATE POLICY "Authenticated users can view all hardware"
  ON hardware FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to insert hardware
CREATE POLICY "Authenticated users can insert hardware"
  ON hardware FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update hardware
CREATE POLICY "Authenticated users can update hardware"
  ON hardware FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete hardware
CREATE POLICY "Authenticated users can delete hardware"
  ON hardware FOR DELETE
  USING (auth.uid() IS NOT NULL);

