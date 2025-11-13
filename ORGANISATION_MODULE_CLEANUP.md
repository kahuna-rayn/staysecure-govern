# Organisation Module File Cleanup Plan

## Problem
Files are scattered across multiple locations, breaking the documented module structure:
- Duplicate files in `/src/components/admin/` and `/src/modules/organisation/components/admin/`
- Files in `/src/components/` that should be in the module
- Duplicate profile components in `components/organisational/` and `components/profile/`

## Documented Structure (from README.md)

```
src/modules/organisation/
├── components/
│   ├── admin/              # User management components
│   ├── organisational/          # Role, department, location management
│   ├── OrganisationPanel.tsx
│   ├── OrganisationProfile.tsx
│   └── OrganisationCertificates.tsx
├── context/
│   └── OrganisationContext.tsx
├── hooks/
│   ├── useUserManagement.ts
│   └── useUserProfiles.ts
├── types/
│   └── index.ts
├── utils/
│   └── userManagementActions.ts
└── index.ts              # Main exports
```

## Current Duplicates Found

### 1. Admin Components (DUPLICATES - Remove from `/src/components/admin/`)

These exist in both locations and should ONLY be in the module:

- ✅ `UserManagement.tsx` → Keep in module, remove from `/src/components/admin/`
- ✅ `UserCard.tsx` → Keep in module, remove from `/src/components/admin/`
- ✅ `UserDetailView.tsx` → Keep in module, remove from `/src/components/admin/`
- ✅ `UserList.tsx` → Keep in module, remove from `/src/components/admin/`
- ✅ `UserTable.tsx` → Keep in module, remove from `/src/components/admin/`
- ✅ `CreateUserDialog.tsx` → Keep in module, remove from `/src/components/admin/`
- ✅ `EditUserDialog.tsx` → Keep in module, remove from `/src/components/admin/`
- ✅ `AddOrganisationCertificateDialog.tsx` → Keep in module, remove from `/src/components/admin/`
- ✅ `AddPhysicalLocationDialog.tsx` → Keep in module, remove from `/src/components/admin/`
- ✅ `AssignPhysicalLocationDialog.tsx` → Keep in module, remove from `/src/components/admin/`
- ✅ `AssignHardwareDialog.tsx` → Keep in module, remove from `/src/components/admin/`
- ✅ `AssignSoftwareDialog.tsx` → Keep in module, remove from `/src/components/admin/`
- ✅ `AddEducationDialog.tsx` → Keep in module, remove from `/src/components/admin/`
- ✅ `UserDepartmentsManager.tsx` → Keep in module, remove from `/src/components/admin/`
- ✅ `UserDepartmentsRolesManager.tsx` → Keep in module, remove from `/src/components/admin/`
- ✅ `UserDepartmentsRolesTable.tsx` → Keep in module, remove from `/src/components/admin/`
- ✅ `DepartmentRolePairsDisplay.tsx` → Keep in module, remove from `/src/components/admin/`

### 2. Core Components (MOVE to module)

These should be in the module but are currently in `/src/components/`:

- ✅ `PersonaProfile.tsx` → Move to `/src/modules/organisation/components/`
- ✅ `UserDetailView.tsx` → Already in module, remove from `/src/components/`
- ✅ `OrganisationCertificates.tsx` → Already in module, remove from `/src/components/`
- ✅ `OrganisationProfile.tsx` → Already in module, remove from `/src/components/`
- ✅ `PhysicalLocationTab.tsx` → Already in module, remove from `/src/components/`
- ✅ `ProfileHeader.tsx` → Move to `/src/modules/organisation/components/`
- ✅ `ProfileEditor.tsx` → Move to `/src/modules/organisation/components/`
- ✅ `SearchableProfileField.tsx` → Already in module, remove from `/src/components/`

### 3. Profile Components (CONSOLIDATE)

- `components/organisational/` has: DepartmentManagement, LocationManagement, RoleManagement (should be in `knowledge/`)
- `components/organisational/` also has: EditableField, MultipleRolesField, ProfileAvatar, ProfileBasicInfo, ProfileContactInfo, UserRoleField (duplicates of `profile/`)
- `components/profile/` has: EditableField, MultipleRolesField, ProfileAvatar, ProfileBasicInfo, ProfileContactInfo, UserRoleField

**Action**: 
- Move DepartmentManagement, LocationManagement, RoleManagement from `organisational/` to `knowledge/`
- Remove `organisational/` directory (all files are duplicates)
- Keep only `profile/` directory

### 4. Files to KEEP in `/src/components/admin/` (NOT part of module)

These are GOVERN-specific and should stay:
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
- `inventory/` subdirectory

## Import Path Updates Required

Files importing from `@/components/admin/` that should use module paths:

1. `/src/modules/organisation/components/admin/UserCard.tsx` - imports `DepartmentRolePairsDisplay` from `@/components/admin/`
2. `/src/components/InventoryPanel.tsx` - imports `UserManagement` from module (already correct)
3. `/src/components/ui/editable-table/EditableCell.tsx` - imports `DepartmentRolePairsDisplay` from module (already correct)
4. `/src/components/admin/UserCard.tsx` - imports `DepartmentRolePairsDisplay` from `@/components/admin/` (should be removed)

## Execution Plan

1. ✅ Audit complete
2. ⏳ Update import paths to use module paths
3. ⏳ Remove duplicate files from `/src/components/admin/`
4. ⏳ Remove duplicate files from `/src/components/`
5. ⏳ Consolidate `organisational/` into `knowledge/` and `profile/`
6. ⏳ Remove `organisational/` directory
7. ⏳ Verify build works
8. ⏳ Test application

