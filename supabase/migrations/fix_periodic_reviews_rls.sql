-- Fix RLS policies for periodic_reviews table
-- Allow authenticated users to view and manage periodic reviews

-- Enable RLS if not already enabled
ALTER TABLE periodic_reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can view periodic reviews" ON periodic_reviews;
DROP POLICY IF EXISTS "Authenticated users can insert periodic reviews" ON periodic_reviews;
DROP POLICY IF EXISTS "Authenticated users can update periodic reviews" ON periodic_reviews;
DROP POLICY IF EXISTS "Authenticated users can delete periodic reviews" ON periodic_reviews;

-- Allow authenticated users to view all periodic reviews
CREATE POLICY "Authenticated users can view periodic reviews"
  ON periodic_reviews FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to insert periodic reviews
CREATE POLICY "Authenticated users can insert periodic reviews"
  ON periodic_reviews FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update periodic reviews
CREATE POLICY "Authenticated users can update periodic reviews"
  ON periodic_reviews FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete periodic reviews
CREATE POLICY "Authenticated users can delete periodic reviews"
  ON periodic_reviews FOR DELETE
  USING (auth.uid() IS NOT NULL);

