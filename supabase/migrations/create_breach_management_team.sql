-- Create breach_management_team table
-- This table stores breach management team roles and assignments

CREATE TABLE IF NOT EXISTS public.breach_management_team (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Team role information
  team_role TEXT,
  activity TEXT,
  sequence INTEGER NOT NULL DEFAULT 0,
  
  -- Practice information
  best_practice TEXT,
  org_practice TEXT,
  recommended_designee TEXT,
  
  -- Assignment
  member UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Configuration
  mandatory BOOLEAN NOT NULL DEFAULT false,
  allow_custom BOOLEAN NOT NULL DEFAULT true,
  is_system BOOLEAN NOT NULL DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_breach_management_team_member ON public.breach_management_team(member);
CREATE INDEX IF NOT EXISTS idx_breach_management_team_sequence ON public.breach_management_team(sequence);
CREATE INDEX IF NOT EXISTS idx_breach_management_team_role ON public.breach_management_team(team_role);

-- Enable RLS
ALTER TABLE public.breach_management_team ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow authenticated users to view all breach management team records
CREATE POLICY "Authenticated users can view breach management team"
  ON public.breach_management_team FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to insert breach management team records
CREATE POLICY "Authenticated users can insert breach management team"
  ON public.breach_management_team FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update breach management team records
CREATE POLICY "Authenticated users can update breach management team"
  ON public.breach_management_team FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete breach management team records
CREATE POLICY "Authenticated users can delete breach management team"
  ON public.breach_management_team FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_breach_management_team_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER breach_management_team_updated_at
  BEFORE UPDATE ON public.breach_management_team
  FOR EACH ROW
  EXECUTE FUNCTION update_breach_management_team_updated_at();

-- Comments
COMMENT ON TABLE public.breach_management_team IS 
  'Stores breach management team roles, activities, and member assignments';
COMMENT ON COLUMN public.breach_management_team.sequence IS 
  'Order in which team roles should be displayed or processed';
COMMENT ON COLUMN public.breach_management_team.mandatory IS 
  'Whether this role is mandatory for breach management';
COMMENT ON COLUMN public.breach_management_team.is_system IS 
  'Whether this is a system-defined role (cannot be deleted)';

