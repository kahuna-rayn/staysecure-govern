# Device Integration — Implementation Guide

*For the StaySecure implementation team. Use this guide when onboarding a client onto the device management integration.*

---

## Overview

Each client uses **one** device management source — either **Microsoft Intune** or **Atera**. The integration syncs device data nightly into the `hardware_inventory` table in govern.

---

## Choosing a Source


|                          | Intune                                                         | Atera                                                             |
| ------------------------ | -------------------------------------------------------------- | ----------------------------------------------------------------- |
| **Best for**             | Clients using Microsoft 365 / Entra ID                         | Clients using Atera as their RMM tool                             |
| **Auth model**           | Azure App Registration (OAuth2 client credentials)             | Atera API key + Customer ID                                       |
| **Device scope**         | All Intune-enrolled devices in the tenant                      | All agents under a specific Atera customer                        |
| **User matching**        | Automatic — matched via `userPrincipalName` → `profiles.email` | Manual — `last_logged_user` is a local username, not auto-matched |
| **Mac data quality**     | Limited (memory returns 0, no processor field in API)          | Good (full hardware details including processor, memory)          |
| **Windows data quality** | Good (memory populated, compliance state available)            | Good                                                              |


---

## Setting Up Intune

### What the client needs to provide

The client's IT admin needs to supply values from their **Azure App Registration**:


| Field in UI             | Where to find it in Azure Portal                                                 |
| ----------------------- | -------------------------------------------------------------------------------- |
| Directory (tenant) ID   | Azure Active Directory → Overview → **Directory (tenant) ID**                    |
| Application (client) ID | App registrations → app → Overview → **Application (client) ID**                 |
| Client Secret           | App registrations → app → Certificates & secrets → **Value** (not the Secret ID) |


> **Important:** The client must provide the secret **Value**, not the Secret ID (GUID). The Value is only shown once when created.

### Azure App Registration requirements

The app registration must have the following **Application permission** (not Delegated) granted with admin consent:

- `DeviceManagementManagedDevices.Read.All`

Steps for the client's IT admin:

1. Go to **Azure Portal → App registrations → app → API permissions**
2. Click **Add a permission → Microsoft Graph → Application permissions**
3. Search for and add `DeviceManagementManagedDevices.Read.All`
4. Click **Grant admin consent for organisation**

### Can the client reuse their existing Entra SSO app registration?

**Recommended: No.** Create a separate app registration for device sync. Reasons:

- Separation of concerns — SSO uses Delegated permissions; device sync uses Application permissions
- Easier to rotate secrets independently
- Clearer audit trail

However, if the client prefers to reuse the same app registration, it is technically possible — just add the `DeviceManagementManagedDevices.Read.All` application permission to the existing SSO app and provide the same tenant ID, client ID, and secret.

### Implementation steps

1. In govern admin UI → Organisation Profile → **Sign In & Devices**
2. Enable the **Device Management** toggle
3. Select **Intune** as the source
4. Enter **Application (client) ID** and **Client Secret**
5. The **Directory (tenant) ID** is already set from SSO — no need to re-enter
6. Click **Save credentials**
7. Click **Test connection** — should return a device count
8. Set up the nightly cron job (see below)

---

## Setting Up Atera

### What the client needs to provide


| Field in UI | Where to find it                                                                |
| ----------- | ------------------------------------------------------------------------------- |
| API Key     | Atera portal → Admin → API → **Generate API key**                               |
| Customer ID | Atera portal → Customers → select the customer → note the numeric ID in the URL |


> The Customer ID is the integer in the URL when viewing a customer: `https://app.atera.com/.../#/customers/**12345**/...`

### Implementation steps

1. In govern admin UI → Organisation Profile → **Sign In & Devices**
2. Enable the **Device Management** toggle
3. Select **Atera** as the source
4. Enter the **API Key** and **Customer ID**
5. Click **Save credentials**
6. Click **Test connection** — should return a device count
7. Set up the nightly cron job (see below)

---

## Field Coverage by Source


| Hardware Inventory Field | Intune (Mac)                   | Intune (Windows)               | Atera (Mac)                 | Atera (Windows)             |
| ------------------------ | ------------------------------ | ------------------------------ | --------------------------- | --------------------------- |
| `device_name`            | ✓                              | ✓                              | ✓                           | ✓                           |
| `serial_number`          | ✓                              | ✓                              | ✓                           | ✓                           |
| `manufacturer`           | ✓                              | ✓                              | ✓                           | ✓                           |
| `model`                  | ✓                              | ✓                              | ✓                           | ✓                           |
| `os_type`                | ✓ macOS                        | ✓ Windows                      | ✓ Mac                       | ✓ Windows                   |
| `os_version`             | ✓                              | ✓                              | ✓ human-readable            | ✓ human-readable            |
| `os_edition`             | — not in API                   | — not in API                   | ✓ OS build string           | ✓ OS build string           |
| `asset_type`             | derived from OS                | derived from OS                | derived from DeviceType     | derived from DeviceType     |
| `asset_owner`            | ✓ display name                 | ✓ display name                 | ✓ last logged user          | ✓ last logged user          |
| `user_id`                | ✓ auto-matched via UPN         | ✓ auto-matched via UPN         | — not auto-matched          | — not auto-matched          |
| `mac_addresses`          | ✓ Wi-Fi + Ethernet             | ✓ Wi-Fi + Ethernet             | ✓                           | ✓                           |
| `ip_address`             | — not in API                   | — not in API                   | ✓ (loopback/APIPA filtered) | ✓ (loopback/APIPA filtered) |
| `processor`              | — not in API                   | — not in API                   | ✓                           | ✓                           |
| `memory`                 | — API returns 0 for Mac        | ✓                              | ✓                           | ✓                           |
| `domain_workgroup`       | — not in API                   | — not in API                   | ✓                           | ✓                           |
| `last_seen_at`           | ✓ last Intune sync             | ✓ last Intune sync             | ✓ last Atera check-in       | ✓ last Atera check-in       |
| `last_logged_user`       | ✓ display name                 | ✓ display name                 | ✓ local username            | ✓ local username            |
| `antivirus`              | — not in list API              | — not in list API              | — not in agent list         | — not in agent list         |
| `asset_location`         | — not in API                   | — not in API                   | — not in API                | — not in API                |
| `status`                 | derived from `complianceState` | derived from `complianceState` | Always `Active`             | Always `Active`             |


**Notes:**

- Fields marked `—` are `null` in the database after sync. They can be filled in manually via the govern UI.
- `location_id` (UUID FK) is never auto-populated. Location must be assigned manually.
- `asset_classification`, `end_of_support_date`, `approval_`* fields are always populated manually.
- If a device has no serial number, a synthetic serial `NOSERIAL-{external_id}` is assigned.

---

## Additional Fields Available But Not Yet Mapped

The APIs return the following fields on every sync. They are **not currently stored** in `hardware_inventory` because the required database columns have not been added. A future migration will unlock them — no changes to the sync logic or API calls are needed beyond that.

> **To implement:** Create a migration adding the columns below, then update `normalise.ts` to map the values. No changes to `intune.ts` or `atera.ts` are needed for Atera fields or the starred Intune fields. Three Intune fields also require a one-line addition to the `$select` query (marked †).

### Intune — available in the existing `$select` response

These are already fetched on every sync and silently discarded.


| Graph field                 | Proposed column       | Type          | Notes                                    |
| --------------------------- | --------------------- | ------------- | ---------------------------------------- |
| `isEncrypted`               | `is_encrypted`        | `boolean`     | BitLocker (Windows) / FileVault (Mac)    |
| `managedDeviceOwnerType`    | `owned_by`            | `text`        | `company` or `personal`                  |
| `enrolledDateTime`          | `enrolled_at`         | `timestamptz` | When device was first enrolled in Intune |
| `totalStorageSpaceInBytes`  | `storage_total_bytes` | `bigint`      | Total disk capacity                      |
| `deviceCategoryDisplayName` | `device_category`     | `text`        | Client-assigned category in Intune       |


### Intune — available but also need adding to `$select` †


| Graph field                  | Proposed column      | Type      | Notes                                              |
| ---------------------------- | -------------------- | --------- | -------------------------------------------------- |
| `jailBroken`                 | `is_jailbroken`      | `boolean` | `"True"` / `"False"` string — normalise to boolean |
| `partnerReportedThreatState` | `threat_state`       | `text`    | Active threat status from Defender / 3rd party AV  |
| `freeStorageSpaceInBytes`    | `storage_free_bytes` | `bigint`  | Free disk space                                    |


### Atera — available in the existing agent response

These are already returned in the paginated agent list and silently discarded.


| Atera field                 | Proposed column  | Type          | Notes                                                    |
| --------------------------- | ---------------- | ------------- | -------------------------------------------------------- |
| `Online`                    | `online`         | `boolean`     | Whether agent is currently online                        |
| `LastRebootTime`            | `last_reboot_at` | `timestamptz` | Last reboot — indicates pending-reboot-after-patch state |
| `BatteryInfo.BatteryHealth` | `battery_health` | `integer`     | Battery health % (laptops only; null for desktops)       |
| `AgentVersion`              | `agent_version`  | `text`        | Version of the Atera RMM agent installed                 |
| `BiosVersion`               | `bios_version`   | `text`        | BIOS / firmware version string                           |
| `BiosReleaseDate`           | `bios_date`      | `timestamptz` | BIOS release date — indicator of firmware age            |


### Fields that require separate per-device API calls (not part of nightly sync)

The following are **not** returned by the list endpoint. Each requires one HTTP call per device, making them unsuitable for the nightly sync. A separate weekly "deep sync" function is planned for SHIELD Phase 1.5. We would do this serparately and 3rd party developer can use the same API calls to ingest the data. 


| Source | Endpoint                                          | Fields                                                                                                                                                     | Notes                            |
| ------ | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Intune | `GET /managedDevices/{id}/windowsProtectionState` | `antivirusEnabled`, `antivirusSignatureUpdateDateTime`, `signatureUpdateOverdue`, `realTimeProtectionEnabled`, `rebootRequired`, `tamperProtectionEnabled` | Windows only                     |
| Atera  | `GET /agents/{deviceGuid}/available-patches`      | Pending patch count, security patch count                                                                                                                  | One call per device              |
| Atera  | `GET /agents/{deviceGuid}/installed-patches`      | Last patched date                                                                                                                                          | One call per device              |
| Atera  | `GET /alerts`                                     | Active hardware / disk / availability alerts                                                                                                               | One call for all devices (cheap) |


### Fields not available from either API


| Field                                          | Status                                                                           |
| ---------------------------------------------- | -------------------------------------------------------------------------------- |
| `os_edition` (Windows Home / Pro / Enterprise) | Not in Intune `managedDevice` v1.0; not in Atera                                 |
| `processor`                                    | Not in Intune `managedDevice` v1.0 (Atera has it — already mapped)               |
| `ip_address`                                   | Not in Intune list endpoint (Atera has it — already mapped)                      |
| Antivirus name                                 | Not directly available; Intune exposes AV *state* (on/off), not the product name |


---

## Nightly Sync Schedule

The device-ingest cron job (`device-sync-nightly`, runs at 02:30 UTC daily) is configured automatically by `deploy/scripts/setup-cron-jobs.sh` during client onboarding — no manual steps required.

If a client project is missing the job (e.g. device management was added after initial onboarding), re-run:

```bash
./deploy/scripts/setup-cron-jobs.sh <project-ref>
```

The job is a no-op if `device_source` is not configured in `org_profile` — safe to run on all client projects regardless of whether device management is enabled.

---

## Post-Sync Manual Steps

After the first sync, the implementation team should:

1. **Review `NOSERIAL-*` entries** — devices without serial numbers. Confirm with the client whether these are real devices or noise (e.g. virtual machines, stale records).
2. **Assign locations** — `asset_location` contains the raw string from the source; `location_id` (FK) must be set manually via the govern UI once locations are configured.
3. **Match Atera users** — Atera's `last_logged_user` is a local OS username. If the client wants `user_id` populated for Atera devices, manually match usernames to profiles.
4. **Set `asset_classification`** — not provided by any integration; must be set per device.
5. **Set `end_of_support_date`** — not provided by any integration; set based on OS version.

---

## Secrets Security

Both `intune_client_secret` and `atera_api_key` are stored in **Supabase Vault** (encrypted at rest). The `org_profile` table stores only the Vault secret *name*, never the raw value. The edge function resolves the actual value at runtime via the `public.get_vault_secret()` RPC.

To rotate a secret (e.g. when a client rotates their Intune client secret):

1. Open govern admin UI → Organisation Profile → Sign In & Devices
2. Clear the Client Secret field and enter the new value
3. Click **Save credentials** — the old Vault entry is overwritten

---

## Govern-Only Clients (No Learn) -- NEEDS IMPLMENTATION DECISION

The `device-ingest` edge function and `hardware_inventory` table currently live on the **Supabase project that is provisioned when a client onboards onto learn**. Clients who only use the 3rd party govern system (PHP/Python/Node/MySQL) and do not have learn have no Supabase project, so the standard pipeline does not apply.

### Current status

All existing clients have learn, so this is not yet a live issue. When the first govern-only client arises, one of the following approaches should be adopted.

### Option A — Provision a full Supabase project (recommended)

Spin up a Supabase project for the govern-only client using the same onboarding process as a learn client. Deploy `device-ingest` and run the device-ingest migrations. The 3rd party developer gets the same API endpoint and `GOVERN_API_KEY` as any other client.

**Pros:** Zero code changes; identical API; same security model; same admin UI.  
**Cons:** Additional Supabase project cost per govern-only client (low — free tier covers most cases).

This is the **preferred path**. The device sync is a StaySecure value-add (normalised schema, Vault-secured credentials, scheduled sync) and should remain on our infrastructure regardless of whether the client uses learn.

### Option B — 3rd party developer integrates directly

Provide the 3rd party developer with the field mapping specification (see Field Coverage table above) and let them call Intune or Atera directly from their own infrastructure. StaySecure provides the spec and normalisation rules; the developer implements the sync.

**Pros:** No dependency on StaySecure infrastructure for govern-only clients.  
**Cons:** More work for the developer; StaySecure loses control of data quality, field normalisation, and secret management; harder to support.

This option is only suitable if the client explicitly does not want their device data passing through StaySecure infrastructure.

---

## Troubleshooting


| Symptom                                               | Likely cause                                                                         | Fix                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| Test connection → `intune_client_secret not set`      | Credentials not saved yet                                                            | Click Save credentials first                                   |
| Test connection → `Vault secret "..." not found`      | Secret name in `org_profile` doesn't match Vault                                     | Re-save credentials via UI                                     |
| Test connection → `Intune token fetch failed (401)`   | Wrong Client ID or Secret                                                            | Verify values in Azure portal                                  |
| Test connection → `Intune devices fetch failed (403)` | Missing `DeviceManagementManagedDevices.Read.All` permission or no admin consent     | Client IT admin needs to grant consent                         |
| Test connection → `atera_customer_id not set`         | Customer ID missing                                                                  | Enter Customer ID and save                                     |
| Test connection → `synced_count: 0`                   | Wrong Atera Customer ID                                                              | Verify ID from Atera portal URL                                |
| All devices show `NOSERIAL-`*                         | Serial numbers not reported by source                                                | Check device compliance in Intune / Atera agent health         |
| `memory` null for Mac devices (Intune)                | Known API limitation — `physicalMemoryInBytes` returns 0 for macOS in Graph API v1.0 | Expected; use Atera for Mac clients if memory data is required |


