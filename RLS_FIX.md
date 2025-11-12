# Fix RLS (Row Level Security) for Inventory Tables

## Problem
Queries return empty arrays even though data exists in the database. This is caused by RLS policies blocking access.

## Quick Fix

Run this SQL in your Supabase SQL Editor:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('hardware_inventory', 'software_inventory', 'account_inventory');

-- If RLS is enabled, create policies to allow authenticated users to read/write

-- Hardware Inventory Policies
CREATE POLICY "Allow authenticated users to read hardware_inventory"
ON hardware_inventory FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert hardware_inventory"
ON hardware_inventory FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update hardware_inventory"
ON hardware_inventory FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete hardware_inventory"
ON hardware_inventory FOR DELETE
TO authenticated
USING (true);

-- Software Inventory Policies
CREATE POLICY "Allow authenticated users to read software_inventory"
ON software_inventory FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert software_inventory"
ON software_inventory FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update software_inventory"
ON software_inventory FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete software_inventory"
ON software_inventory FOR DELETE
TO authenticated
USING (true);

-- Account Inventory Policies
CREATE POLICY "Allow authenticated users to read account_inventory"
ON account_inventory FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert account_inventory"
ON account_inventory FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update account_inventory"
ON account_inventory FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete account_inventory"
ON account_inventory FOR DELETE
TO authenticated
USING (true);
```

## Alternative: Disable RLS (Not Recommended for Production)

If you want to disable RLS entirely (only for development):

```sql
ALTER TABLE hardware_inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE software_inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE account_inventory DISABLE ROW LEVEL SECURITY;
```

**⚠️ Warning**: Only do this in development. In production, use proper RLS policies.

## Verify Fix

After applying policies, refresh the page and check the console. You should see:
- Hardware inventory data with actual items (not empty array)
- No RLS warnings

