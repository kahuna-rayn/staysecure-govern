-- Step 1: Add user_id column to hardware_inventory
ALTER TABLE hardware_inventory 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id);

-- Add comment for documentation
COMMENT ON COLUMN hardware_inventory.user_id IS 'Foreign key to profiles table. NULL means unassigned.';

-- Step 2: Backfill user_id from hardware table by matching serial_number
-- Match hardware records to hardware_inventory and update user_id
UPDATE hardware_inventory hi
SET user_id = h.user_id
FROM hardware h
WHERE hi.serial_number = h.serial_number
  AND hi.user_id IS NULL
  AND h.user_id IS NOT NULL;

-- Step 3: Also backfill from asset_owner name matching (for legacy data)
-- Match asset_owner (full_name) to profiles.full_name
UPDATE hardware_inventory hi
SET user_id = p.id
FROM profiles p
WHERE hi.asset_owner = p.full_name
  AND hi.user_id IS NULL
  AND hi.asset_owner IS NOT NULL
  AND hi.asset_owner != ''
  AND hi.asset_owner != 'no-owner'
  AND hi.asset_owner != 'Unassigned';

-- Step 4: Update status to 'Assigned' for items that now have user_id
UPDATE hardware_inventory
SET status = 'Assigned'
WHERE user_id IS NOT NULL
  AND status = 'Unassigned';

-- Step 5: Create index for performance
CREATE INDEX IF NOT EXISTS idx_hardware_inventory_user_id ON hardware_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_hardware_inventory_status ON hardware_inventory(status);

-- Step 6: Drop the hardware table (no longer needed)
DROP TABLE IF EXISTS hardware CASCADE;

