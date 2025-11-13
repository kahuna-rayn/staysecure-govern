-- Fix add_breach_team_assignments trigger function to handle department_id and role_id correctly
-- This function is triggered when a breach_team_members record is inserted
-- It looks up the team_role from breach_management_team, finds the matching role_id from roles table,
-- and creates user_departments and user_profile_roles records with a shared pairing_id

-- Drop and recreate the function to fix the department_id and role_id validation
CREATE OR REPLACE FUNCTION add_breach_team_assignments()
RETURNS TRIGGER AS $$
DECLARE
  v_pairing_id UUID;
  v_team_role TEXT;
  v_role_id UUID;
BEGIN
  -- Generate a pairing_id to link the department and role assignments
  v_pairing_id := gen_random_uuid();
  
  -- Get the team_role from breach_management_team table
  SELECT team_role INTO v_team_role
  FROM breach_management_team
  WHERE id = NEW.breach_team_id;
  
  -- If team_role exists, find the matching role_id from roles table
  IF v_team_role IS NOT NULL THEN
    SELECT role_id INTO v_role_id
    FROM roles
    WHERE name = v_team_role
    LIMIT 1;
  END IF;
  
  -- Add user to department if department_id exists and is valid
  IF NEW.department_id IS NOT NULL THEN
    -- Verify the department exists in the departments table before inserting
    IF EXISTS (SELECT 1 FROM departments WHERE id = NEW.department_id) THEN
      -- Insert user_departments record with pairing_id (only if we have a role to pair with)
      -- If no role found, insert without pairing_id (standalone department)
      INSERT INTO user_departments (user_id, department_id, pairing_id, assigned_at, assigned_by, is_primary)
      VALUES (
        NEW.user_id, 
        NEW.department_id,
        CASE WHEN v_role_id IS NOT NULL THEN v_pairing_id ELSE NULL END,
        COALESCE(NEW.assigned_at, NOW()),
        NEW.assigned_by,
        COALESCE(NEW.is_primary, false)
      )
      ON CONFLICT (user_id, department_id) DO UPDATE
      SET 
        pairing_id = COALESCE(
          CASE WHEN v_role_id IS NOT NULL THEN v_pairing_id ELSE NULL END,
          user_departments.pairing_id
        ),
        assigned_at = COALESCE(NEW.assigned_at, user_departments.assigned_at),
        assigned_by = COALESCE(NEW.assigned_by, user_departments.assigned_by),
        is_primary = COALESCE(NEW.is_primary, user_departments.is_primary);
    ELSE
      -- Log warning if department doesn't exist, but don't fail the insert
      RAISE WARNING 'Department % does not exist in departments table. Skipping user_departments creation for user %', 
        NEW.department_id, NEW.user_id;
    END IF;
  END IF;
  
  -- Add role to user if we found a matching role_id
  IF v_role_id IS NOT NULL THEN
    -- Verify the role exists in the roles table before inserting
    IF EXISTS (SELECT 1 FROM roles WHERE role_id = v_role_id) THEN
      -- Insert user_profile_roles record with the same pairing_id (or do nothing if it already exists)
      INSERT INTO user_profile_roles (user_id, role_id, pairing_id, assigned_at, assigned_by, is_primary)
      VALUES (
        NEW.user_id, 
        v_role_id,
        v_pairing_id,
        COALESCE(NEW.assigned_at, NOW()),
        NEW.assigned_by,
        COALESCE(NEW.is_primary, false)
      )
      ON CONFLICT (user_id, role_id) DO UPDATE
      SET 
        pairing_id = COALESCE(v_pairing_id, user_profile_roles.pairing_id),
        assigned_at = COALESCE(NEW.assigned_at, user_profile_roles.assigned_at),
        assigned_by = COALESCE(NEW.assigned_by, user_profile_roles.assigned_by),
        is_primary = COALESCE(NEW.is_primary, user_profile_roles.is_primary);
    ELSE
      -- Log warning if role doesn't exist, but don't fail the insert
      RAISE WARNING 'Role % does not exist in roles table. Skipping user_profile_roles creation for user %', 
        v_role_id, NEW.user_id;
    END IF;
  ELSE
    -- Log warning if team_role doesn't have a matching role in roles table
    IF v_team_role IS NOT NULL THEN
      RAISE WARNING 'No matching role found for team_role "%" in roles table. Skipping user_profile_roles creation for user %', 
        v_team_role, NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger is properly attached (drop and recreate to be safe)
DROP TRIGGER IF EXISTS add_breach_team_assignments_trigger ON breach_team_members;

CREATE TRIGGER add_breach_team_assignments_trigger
  AFTER INSERT ON breach_team_members
  FOR EACH ROW
  EXECUTE FUNCTION add_breach_team_assignments();

