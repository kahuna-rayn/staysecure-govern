# Organisation Module File Analysis

## Summary
After comparing duplicate files, **the module versions (`src/modules/organisation/components/`) are the latest and most complete**. They have:
- More recent modification dates (Nov 13 vs Sep 2)
- Better integration with `OrganisationContext`
- Proper relative imports for module structure
- Additional features (e.g., `ImportUsersDialog` only exists in module)

## File Comparison Results

### Admin Components

| File | Module Version | Component Version | Recommendation |
|------|---------------|-------------------|----------------|
| `UserManagement.tsx` | ✅ Nov 13, has `useOrganisationContext` | Sep 2, no context | **Keep module version** |
| `UserCard.tsx` | ✅ Nov 13 14:48 | Sep 2 | **Keep module version** |
| `UserDetailView.tsx` | ✅ Nov 13 09:13 | Nov 13 00:52 | **Keep module version** (newer) |
| `UserList.tsx` | ✅ Nov 13 09:13 | Sep 2 | **Keep module version** |
| `UserTable.tsx` | ✅ Nov 13 09:13 | Sep 2 | **Keep module version** |
| `CreateUserDialog.tsx` | ✅ Nov 13 09:13 | Sep 2 | **Keep module version** |
| `EditUserDialog.tsx` | ✅ Nov 13 09:13 | Sep 2 | **Keep module version** |
| `AddOrganisationCertificateDialog.tsx` | ✅ Nov 13 09:13 | Sep 2 | **Keep module version** |
| `AddPhysicalLocationDialog.tsx` | ✅ Nov 13 00:32 | Sep 2 | **Keep module version** |
| `AssignPhysicalLocationDialog.tsx` | ✅ Nov 13 00:32 | Sep 2 | **Keep module version** |
| `AssignHardwareDialog.tsx` | ✅ Nov 13 00:32 | Nov 13 00:29 | **Keep module version** (newer) |
| `AssignSoftwareDialog.tsx` | ✅ Nov 13 00:32 | Nov 13 00:29 | **Keep module version** (newer) |
| `AddEducationDialog.tsx` | ✅ Nov 13 00:32 | Sep 2 | **Keep module version** |
| `ImportUsersDialog.tsx` | ✅ Nov 13 00:35 | ❌ **Doesn't exist** | **Keep module version** (unique) |
| `UserDepartmentsManager.tsx` | ✅ Exists | Sep 2 | **Keep module version** |
| `UserDepartmentsRolesManager.tsx` | ✅ Exists | Sep 2 | **Keep module version** |
| `UserDepartmentsRolesTable.tsx` | ✅ Exists | Sep 2 | **Keep module version** |
| `DepartmentRolePairsDisplay.tsx` | ✅ Exists | Sep 2 | **Keep module version** |

### Core Components

| File | Module Version | Component Version | Recommendation |
|------|---------------|-------------------|----------------|
| `OrganisationCertificates.tsx` | ✅ Exists | ✅ Identical | **Keep module version** |
| `PhysicalLocationTab.tsx` | ✅ Exists | ✅ Different | **Compare and keep best** |
| `PersonaProfile.tsx` | ✅ Exists | ✅ Exists | **Compare and keep best** |

### Files to KEEP in `/src/components/admin/` (GOVERN-specific, NOT duplicates)

These are NOT part of the organisation module and should remain:
- `AccountInventory.tsx`
- `AssetManagement.tsx`
- `CertificateManagement.tsx`
- `HardwareInventory.tsx`
- `HardwareManagement.tsx`
- `InventoryManagement.tsx`
- `PhysicalLocationAccess.tsx`
- `RoleAssignmentSelect.tsx`
- `SoftwareInventory.tsx`
- `SoftwareManagement.tsx`
- `inventory/` subdirectory (all files)

## Key Differences Found

### UserManagement.tsx
- **Module version**: Uses `useOrganisationContext`, relative imports (`../../utils/userManagementActions`)
- **Component version**: No context, absolute imports (`@/utils/userManagementActions`)

### UserCard.tsx
- **Module version**: Imports `EditableField` from module path, updated Nov 13 14:48
- **Component version**: Imports from `@/components/profile/EditableField`, older Sep 2

## Recommended Action Plan

1. ✅ **Confirm module versions are latest** - DONE
2. ⏳ **Update any imports** that reference `/src/components/admin/` duplicates to use module paths
3. ⏳ **Remove duplicate files** from `/src/components/admin/` (keep only GOVERN-specific files)
4. ⏳ **Remove duplicate files** from `/src/components/` (PersonaProfile, OrganisationCertificates, etc.)
5. ⏳ **Consolidate `organisational/` directory** - move knowledge components to `knowledge/`, remove duplicates
6. ⏳ **Verify build** and fix any broken imports

## Files to Delete (Duplicates)

### From `/src/components/admin/`:
- `UserManagement.tsx`
- `UserCard.tsx`
- `UserDetailView.tsx`
- `UserList.tsx`
- `UserTable.tsx`
- `CreateUserDialog.tsx`
- `EditUserDialog.tsx`
- `AddOrganisationCertificateDialog.tsx`
- `AddPhysicalLocationDialog.tsx`
- `AssignPhysicalLocationDialog.tsx`
- `AssignHardwareDialog.tsx`
- `AssignSoftwareDialog.tsx`
- `AddEducationDialog.tsx`
- `UserDepartmentsManager.tsx`
- `UserDepartmentsRolesManager.tsx`
- `UserDepartmentsRolesTable.tsx`
- `DepartmentRolePairsDisplay.tsx`

### From `/src/components/`:
- `PersonaProfile.tsx` (if module version is better)
- `UserDetailView.tsx` (if module version is better)
- `OrganisationCertificates.tsx` (already identical)
- `OrganisationProfile.tsx` (if module version exists and is better)
- `PhysicalLocationTab.tsx` (if module version is better)
- `ProfileHeader.tsx` (if should be in module)
- `ProfileEditor.tsx` (if should be in module)
- `SearchableProfileField.tsx` (if module version exists)

