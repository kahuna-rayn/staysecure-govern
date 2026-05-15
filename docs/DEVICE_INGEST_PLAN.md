# Device Ingestion: Intune + Atera → Hardware Inventory

## Context

- **Target table:** `govern`'s `hardware_inventory` (types at `govern/src/integrations/supabase/types.ts`)
- **Pattern to follow:** `learn/supabase/functions/profile-lookup/index.ts` — exported `handler`, `Deno.serve` when `import.meta.main`, Bearer API key auth, `@supabase/supabase-js` service role client
- **No existing Intune/Atera integration** — greenfield

---

## Impacted Modules


| Module           | Impact                                                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `govern/`        | New edge function; DB migration on `hardware_inventory`; `config.toml` update; `types.ts` regeneration; optional UI enhancements to hardware inventory views |
| `organisation/`  | DB migration on `org_profile`; new device integration settings panel; `org_profile` types regeneration                                                       |
| `deploy/`        | `onboard-client.sh` — add `supabase secrets set GOVERN_API_KEY` step                                                                                         |
| `learn/`         | No changes                                                                                                                                                   |
| `auth/`          | No changes                                                                                                                                                   |
| `notifications/` | No changes                                                                                                                                                   |
| `license/`       | No changes                                                                                                                                                   |


---

## 1. Database Migration

The actual `hardware_inventory` table definition has two important constraints that shape the migration:

- `serial_number` is already `UNIQUE` — this is the natural upsert key for deduplication across syncs
- `location_id` is a `uuid` FK to a locations table — Intune/Atera provide a location string, not a UUID, so a separate text column is needed for the raw value

Add the following columns:

```sql
ALTER TABLE hardware_inventory
  ADD COLUMN IF NOT EXISTS source           text,           -- 'intune' | 'atera' | 'manual'
  ADD COLUMN IF NOT EXISTS external_id      text,           -- ID in the source system (metadata only)
  ADD COLUMN IF NOT EXISTS os_type          text,           -- Windows / macOS / Linux
  ADD COLUMN IF NOT EXISTS asset_location   text,           -- raw location string from source (location_id FK cannot be auto-resolved)
  ADD COLUMN IF NOT EXISTS domain_workgroup text,
  ADD COLUMN IF NOT EXISTS ip_address       text,
  ADD COLUMN IF NOT EXISTS mac_addresses    text,
  ADD COLUMN IF NOT EXISTS last_seen_at     timestamptz,
  ADD COLUMN IF NOT EXISTS last_logged_user text,
  ADD COLUMN IF NOT EXISTS processor        text,
  ADD COLUMN IF NOT EXISTS memory           text,
  ADD COLUMN IF NOT EXISTS antivirus        text,
  ADD COLUMN IF NOT EXISTS last_synced_at   timestamptz;
-- No new unique constraint needed: serial_number is already UNIQUE and is the upsert key
```

**Upsert strategy:** use `serial_number` as the conflict key:

```typescript
await supabase
  .from('hardware_inventory')
  .upsert(rows, { onConflict: 'serial_number', ignoreDuplicates: false })
```

Each client uses either Intune or Atera — never both. `source` is therefore a static label per client (set once, never changes). There is no cross-source conflict risk.

**Devices with no serial number** (some VMs, cloud-only devices): generate a synthetic key as `NOSERIAL-{external_id}` so they still upsert cleanly.

File: `govern/supabase/migrations/add_device_ingest_columns.sql`

---

## 2. Edge Function Layout

```
govern/supabase/functions/device-ingest/
├── index.ts          ← main handler (exported + Deno.serve)
├── intune.ts         ← Microsoft Graph client
├── atera.ts          ← Atera REST client
├── normalise.ts      ← maps both sources → hardware_inventory rows
├── index.test.ts     ← Deno unit tests (mirrors profile-lookup pattern)
└── deno.json
```

### Routes


| Method | Path              | Auth              | Purpose                                |
| ------ | ----------------- | ----------------- | -------------------------------------- |
| POST   | `/v1/sync`        | `SUPABASE_SERVICE_ROLE_KEY` (`SB_SECRET`) | Trigger ingestion (internal/scheduled) |
| GET    | `/v1/devices`     | `GOVERN_API_KEY`  | Paginated device list (3rd party)      |
| GET    | `/v1/devices/:id` | `GOVERN_API_KEY`  | Single device (3rd party)              |


### Secrets


| Secret                      | Storage         | Scope                           | Purpose                                                                        |
| --------------------------- | --------------- | ------------------------------- | ------------------------------------------------------------------------------ |
| `GOVERN_API_KEY`            | Supabase secret | Same value across all projects  | Read key issued to 3rd party developer — same pattern as `LEARN_API_KEY`       |
| `intune_client_secret`      | Supabase Vault  | Per-client                      | Intune app registration secret                                                 |
| `atera_api_key`             | Supabase Vault  | Per-client (1 client currently) | Atera API key                                                                  |
| `SUPABASE_URL`              | Auto-provided   | —                               | Supabase runtime                                                                |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-provided   | —                               | Supabase runtime; also guards `POST /v1/sync` — no additional secret needed   |


`GOVERN_API_KEY` follows the same pattern as `LEARN_API_KEY` — a Supabase secret set via `supabase secrets set` and read server-side via `Deno.env.get('GOVERN_API_KEY')`. `LEARN_API_KEY` is per-customer; `GOVERN_API_KEY` uses the same value across all client projects but is provisioned the same way during onboarding.

Intune/Atera credentials are stored in Supabase Vault (DB-level encrypted store) rather than Supabase secrets because they are configured per-client through the admin UI — not set at deploy time.

---

## 3. Intune Client (`intune.ts`)

Uses OAuth2 client-credentials flow to get a token from `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token`, then paginates `GET https://graph.microsoft.com/v1.0/deviceManagement/managedDevices`.

Key Graph fields → `hardware_inventory` columns:

- `id` → `external_id`, `source = 'intune'`
- `deviceName` → `device_name`
- `serialNumber` → `serial_number`
- `manufacturer` → `manufacturer`
- `model` → `model`
- `operatingSystem` → `os_type`
- `osVersion` → `os_version`
- `skuFamily` → `os_edition`
- `managementState` → `status`
- `deviceType` → `asset_type`
- `userDisplayName` → `asset_owner`
- `lastSyncDateTime` → `last_synced_at`
- `wiFiMacAddress` / `ethernetMacAddress` → `mac_addresses`

---

## 4. Atera Client (`atera.ts`)

Paginates `GET https://app.atera.com/api/v3/agents` using `X-API-KEY` header, filtered by `atera_customer_id` (integer, stored in `org_profile`) to scope results to the correct customer.

Key Atera fields → `hardware_inventory` columns:

- `AgentID` → `external_id`, `source = 'atera'`
- `MachineName` / `ComputerName` → `device_name`
- `OSType` → `os_type`
- `OSVersion` → `os_version`
- `Vendor` → `manufacturer`
- `HardwareModel` / `SystemModel` → `model`
- `SerialNumber` → `serial_number`
- `IPAddress` → `ip_address`
- `LastSeenDate` → `last_seen_at`
- `LastLoggedUser` → `last_logged_user`
- `DomainName` → `domain_workgroup`
- `AntivirusName` → `antivirus`
- `Processor` → `processor`
- `Memory` → `memory`

---

## 5. User Matching (pegging devices to profiles)

The `hardware_inventory` table has two owner fields:

- `asset_owner` (text) — raw name/identifier from the source system, always populated
- `user_id` (uuid FK → `profiles`) — the resolved link to a user record, populated where a match is found

### Intune

Intune provides `userPrincipalName` (the user's UPN, typically their email) and `userDisplayName`. During normalisation, attempt to resolve `user_id` by looking up `profiles.email`:

```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('id')
  .eq('email', device.userPrincipalName)
  .maybeSingle()

row.user_id = profile?.id ?? null
row.asset_owner = device.userDisplayName
```

This is reliable — UPNs are email addresses and `profiles.email` is the canonical identifier.

### Atera

Atera provides `LastLoggedUser` which is a Windows login name (e.g. `jsmith`) — not an email. No auto-match attempt is made; `user_id` is left null and `asset_owner` is set to the raw login name. Admin can manually link the device via the existing `AssignHardwareDialog`.

### Summary


| Source | Field used          | Match target     | Auto-match                           |
| ------ | ------------------- | ---------------- | ------------------------------------ |
| Intune | `userPrincipalName` | `profiles.email` | Yes — reliable                       |
| Atera  | `LastLoggedUser`    | —                | No — Windows username, not matchable |


Unmatched devices (`user_id = null`) are visible in the hardware inventory and can be manually assigned by an admin.

---

## 6. Normaliser (`normalise.ts`)

Single function `normalise(source, raw[]) → HardwareInventoryInsert[]` with per-source adapters. Each client configures one source only (`intune` or `atera`) — determined by `device_source` in `org_profile`. `serial_number` is the upsert key (already unique on the table). Devices with no serial number get a synthetic value `NOSERIAL-{external_id}`.

---

## 7. Tests (`index.test.ts`)

Mirrors the `profile-lookup` test pattern (mock Supabase client factory, `makeQueryBuilder`, stub `Deno.env`):

- Auth: missing key → 401, wrong key → 401
- `GET /v1/devices` → 200 with pagination envelope
- `GET /v1/devices/:uuid` → 200, invalid UUID → 400, not found → 404
- `POST /v1/sync` with wrong key → 401
- `POST /v1/sync` with `device_source = 'atera'` in org config → mock Atera fetch, assert upsert called
- `POST /v1/sync` with `device_source = 'intune'` in org config → mock Graph token + devices fetch, assert upsert called
- `POST /v1/sync` with `device_source = null` → 400 with clear error
- Intune sync: device with matching `userPrincipalName` → `user_id` resolved; no match → `user_id` null
- CORS preflight → 204

External HTTP calls (Graph, Atera) are stubbed with `stub(globalThis, 'fetch', ...)`.

---

## 8. Developer Access: One Edge Function, Dual Purpose

The developer stack is Python, Node.js, PHP, MySQL, Linux. Sharing the edge function source code is not viable — they have no Supabase project or Deno runtime to run it on.

The `device-ingest` edge function serves two purposes within the same deployment:

```
┌─────────────────────────────────────────────────────┐
│          device-ingest edge function                │
│                                                     │
│  POST /v1/sync   ← internal only (DEVICE_SYNC_KEY) │
│    └─ fetches Intune or Atera                       │
│    └─ upserts into hardware_inventory               │
│                                                     │
│  GET /v1/devices       ← developer (GOVERN_API_KEY)│
│  GET /v1/devices/:id   ← developer (GOVERN_API_KEY)│
└─────────────────────────────────────────────────────┘
```

- `SUPABASE_SERVICE_ROLE_KEY` / `SB_SECRET` guards `POST /v1/sync` — no additional secret needed
- `GOVERN_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are separate secrets — the developer key cannot trigger a sync or write any data
- Sync schedule is controlled entirely by us (Supabase cron, nightly)
- All Intune/Atera credentials stay server-side; the developer never sees them
- Endpoint is versioned (`/v1/`) to allow non-breaking evolution

---

## 9. Organisation Module Changes (per-client credentials)

### Extend `org_profile` table

`org_profile` already stores `entra_enabled` and `azure_tenant_id`. Add new columns:

```sql
ALTER TABLE org_profile
  ADD COLUMN IF NOT EXISTS device_source         text,    -- 'intune' | 'atera' | null (not configured)
  ADD COLUMN IF NOT EXISTS intune_client_id      text,
  ADD COLUMN IF NOT EXISTS intune_client_secret  text,    -- Vault secret name, not the raw value
  ADD COLUMN IF NOT EXISTS atera_api_key         text,    -- Vault secret name, not the raw value
  ADD COLUMN IF NOT EXISTS atera_customer_id     integer, -- Atera customer ID used to scope agent queries
  ADD COLUMN IF NOT EXISTS device_last_synced_at timestamptz;
-- intune_tenant_id NOT added — azure_tenant_id (already present for Entra SSO) is reused
-- Migration 20260424000002 drops intune_tenant_id if it was added in error
```

The edge function reads `azure_tenant_id` (shared with Entra SSO) for Intune calls and resolves credentials from Supabase Vault at runtime:

```typescript
const { data: org } = await supabase
  .from('org_profile')
  .select('device_source, azure_tenant_id, intune_client_id, intune_client_secret, atera_api_key')
  .single()

const secretName = org.device_source === 'intune'
  ? org.intune_client_secret
  : org.atera_api_key

// vault schema is not PostgREST-accessible — use the public.get_vault_secret() RPC helper
const { data: secret } = await supabase.rpc('get_vault_secret', { secret_name: secretName })
```

### Provisioning Vault secrets

Before the admin UI exists, provision secrets via the Supabase SQL editor:

```sql
-- Store the actual secret value in Vault and record its name in org_profile.

-- Atera
SELECT vault.create_secret('YOUR_ATERA_API_KEY_HERE', 'atera-api-key-client-x');
UPDATE org_profile SET
  device_source      = 'atera',
  atera_api_key      = 'atera-api-key-client-x',   -- Vault secret name
  atera_customer_id  = 12345;                        -- Atera customer ID

-- Intune (reuses azure_tenant_id already stored for SSO)
SELECT vault.create_secret('YOUR_INTUNE_CLIENT_SECRET_HERE', 'intune-client-secret-client-x');
UPDATE org_profile SET
  device_source         = 'intune',
  intune_client_id      = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  intune_client_secret  = 'intune-client-secret-client-x';   -- Vault secret name
```

The edge function reads `org_profile.atera_api_key` / `org_profile.intune_client_secret` as the Vault secret *name*, then queries `vault.decrypted_secrets` to retrieve the actual value. The raw secret value never leaves the database layer.

### Organisation module admin UI

Extend the existing SSO settings panel to add:

- Radio/select: **Device management source** — Intune or Atera (one only per client)
- If Intune selected: Client ID, Client Secret (write-only) — Tenant ID is reused from SSO (`azure_tenant_id`)
- If Atera selected: API Key (write-only), Customer ID (integer input)
- **Test connection** button — calls `POST /v1/sync?dry_run=true` to validate credentials without writing data
- Last synced timestamp (read-only, from `device_last_synced_at`)

The UI writes the raw secret to Vault via `vault.create_secret()` and stores the returned name in `org_profile`.

---

## 10. Supabase Config

Add to `govern/supabase/config.toml`:

```toml
[functions.device-ingest]
verify_jwt = false
```

---

## Implementation Checklist

**Database** (migrations live in `learn/supabase/migrations/` — both `learn` and `govern` share the same Supabase project)

- [x] `learn/supabase/migrations/20260424000000_add_device_ingest_columns.sql` — add new columns to `hardware_inventory`
- [x] `learn/supabase/migrations/20260424000001_add_integration_columns_to_org_profile.sql` — add device_source + Vault credential columns to `org_profile`
- [x] `learn/supabase/migrations/20260424000002_drop_intune_tenant_id_from_org_profile.sql` — drop redundant `intune_tenant_id` (reuse `azure_tenant_id`)
- [x] `learn/supabase/migrations/20260424000003_vault_secret_helper.sql` — `public.get_vault_secret()` RPC for edge function Vault reads
- [x] `learn/supabase/migrations/20260424000004_vault_upsert_helper.sql` — `public.upsert_vault_secret()` RPC for UI Vault writes

**Edge function**

- [x] `learn/supabase/functions/device-ingest/intune.ts` — Intune Graph client (OAuth2 client-credentials, paginated `managedDevices`)
- [x] `learn/supabase/functions/device-ingest/atera.ts` — Atera REST client (paginated `/agents/customer/{id}`)
- [x] `learn/supabase/functions/device-ingest/normalise.ts` — field normaliser for both sources
- [x] `learn/supabase/functions/device-ingest/index.ts` — main handler; deployed
- [x] `learn/supabase/functions/device-ingest/index.test.ts` — Deno unit tests
- [x] `learn/supabase/functions/device-ingest/deno.json` — Deno config
- [x] `learn/supabase/config.toml` — `[functions.device-ingest]` entry

**Organisation module / Govern admin UI**

- [x] "Sign In & Security" card renamed to **"Sign In & Devices"**
- [x] "Azure Tenant ID" label renamed to **"Directory (tenant) ID"**
- [x] Device Management section added (hidden in Learn mode via `isLearnMode`)
- [x] Toggle maps to `device_source` (null = off)
- [x] Source selector (Intune / Atera) with conditional credential fields
- [x] Intune: Application (client) ID + Client Secret (write-only, Vault-backed)
- [x] Atera: API Key (write-only, Vault-backed) + Customer ID
- [x] **Save credentials** button — writes secrets to Vault, stores name in `org_profile`
- [x] **Test connection** button — calls `POST /v1/sync?dry_run=true` with user JWT (admin roles only)
- [x] "Signatory Information" card renamed to **"Key People & Compliance"**; Key Personnel section moved first; CEM/HIB/DPE signatory sections hidden in Learn mode

**Sync schedule**

- [x] `deploy/scripts/setup-cron-jobs.sh` — `device-sync-nightly` job added (02:30 UTC daily); called automatically by `onboard-client.sh` during provisioning
- [ ] "Sync now" button in UI (deferred — cron covers scheduled syncs; can add later)

**Docs & provisioning**

- [x] `GOVERN_API_KEY` provisioned via `deploy/scripts/provision-api-keys.sh` — already called by `onboard-client.sh`; generates both `LEARN_API_KEY` and `GOVERN_API_KEY` and prints handover sheet
- [x] `govern/docs/DEVICE_INGEST_API_REFERENCE.md` — ready to hand to 3rd party developer
- [x] `govern/docs/DEVICE_INGEST_CLIENT_GUIDE.md` — implementation team guide (field coverage, setup steps, cron note, available-but-not-mapped fields, troubleshooting)
- [x] `docs/SHIELD_PLAN.md` — SHIELD product & architecture plan created (Phase 1/1.5/2 roadmap, API field coverage appendix)

**Hardware inventory UI (pending)**

- [ ] Surface new fields in govern hardware inventory views: `source`, `last_seen_at`, `processor`, `memory`, `ip_address`, `mac_addresses`, `last_logged_user`

---

## 11. For the 3rd Party Developer

### What you receive

1. **Base URL** — `https://<project-ref>.supabase.co/functions/v1/device-ingest`
2. `**GOVERN_API_KEY`** — a Bearer token to include on every request
3. **API reference doc** (`govern/docs/DEVICE_INGEST_API_REFERENCE.md`)

### Endpoints


| Method | Path              | Description                   |
| ------ | ----------------- | ----------------------------- |
| GET    | `/v1/devices`     | Paginated list of all devices |
| GET    | `/v1/devices/:id` | Single device by ID           |


Query parameters for `/v1/devices`:


| Parameter       | Type     | Default       | Description                                    |
| --------------- | -------- | ------------- | ---------------------------------------------- |
| `page`          | integer  | 1             | Page number                                    |
| `page_size`     | integer  | 100 (max 200) | Results per page                               |
| `updated_since` | ISO 8601 | —             | Filter to records updated after this timestamp |


### Code examples

```python
# Python
import requests

BASE = "https://<project-ref>.supabase.co/functions/v1/device-ingest"
HEADERS = {"Authorization": "Bearer <GOVERN_API_KEY>"}

# List all devices (paginated)
resp = requests.get(f"{BASE}/v1/devices", headers=HEADERS, params={"page": 1, "page_size": 100})
body = resp.json()
# body = { "data": [...], "pagination": { "page": 1, "page_size": 100, "total_count": 243, ... } }

# Single device
resp = requests.get(f"{BASE}/v1/devices/<id>", headers=HEADERS)
device = resp.json()  # { "data": { ... } }
```

```js
// Node.js
const BASE = 'https://<project-ref>.supabase.co/functions/v1/device-ingest'
const HEADERS = { Authorization: `Bearer ${GOVERN_API_KEY}` }

const res = await fetch(`${BASE}/v1/devices?page=1&page_size=100`, { headers: HEADERS })
const { data, pagination } = await res.json()
```

```php
// PHP
$ch = curl_init("https://<project-ref>.supabase.co/functions/v1/device-ingest/v1/devices?page=1");
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer <GOVERN_API_KEY>"]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$body = json_decode(curl_exec($ch), true);
```

### Response shape

```json
{
  "data": [
    {
      "id": "uuid",
      "device_name": "DESKTOP-ABC123",
      "serial_number": "SN12345",
      "asset_type": "laptop",
      "asset_owner": "Jane Smith",
      "manufacturer": "Dell",
      "model": "Latitude 5520",
      "os_type": "Windows",
      "os_version": "11.0.22621",
      "os_edition": "Enterprise",
      "status": "Active",
      "source": "intune",
      "ip_address": "192.168.1.42",
      "mac_addresses": "AA:BB:CC:DD:EE:FF",
      "last_seen_at": "2026-04-23T22:00:00Z",
      "last_synced_at": "2026-04-24T02:00:00Z",
      "asset_location": "London Office",
      "domain_workgroup": "CORP",
      "processor": "Intel Core i7-1185G7",
      "memory": "16 GB",
      "antivirus": "Microsoft Defender"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 100,
    "total_count": 243,
    "total_pages": 3,
    "has_next_page": true
  }
}
```

### Error responses


| Status | Meaning                                |
| ------ | -------------------------------------- |
| 401    | Missing or invalid `GOVERN_API_KEY`    |
| 400    | Invalid request (e.g. bad UUID format) |
| 404    | Device not found                       |
| 500    | Internal server error                  |


### What you can and cannot do


|                                |     |
| ------------------------------ | --- |
| Read device list (paginated)   | Yes |
| Read single device by ID       | Yes |
| Filter by `updated_since`      | Yes |
| Trigger a sync                 | No  |
| Write or update device records | No  |


