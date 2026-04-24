# Device Ingestion: Intune + Atera → Hardware Inventory

## Context

- **Target table:** `govern`'s `hardware_inventory` (types at `govern/src/integrations/supabase/types.ts`)
- **Pattern to follow:** `learn/supabase/functions/profile-lookup/index.ts` — exported `handler`, `Deno.serve` when `import.meta.main`, Bearer API key auth, `@supabase/supabase-js` service role client
- **No existing Intune/Atera integration** — greenfield

---

## 1. Database Migration

Add columns to `hardware_inventory` to capture source-system fields not currently in the schema:

```sql
ALTER TABLE hardware_inventory
  ADD COLUMN IF NOT EXISTS source           text,          -- 'intune' | 'atera' | 'manual'
  ADD COLUMN IF NOT EXISTS external_id      text,          -- ID in source system (for upsert dedup)
  ADD COLUMN IF NOT EXISTS os_type          text,          -- Windows / macOS / Linux
  ADD COLUMN IF NOT EXISTS domain_workgroup text,
  ADD COLUMN IF NOT EXISTS ip_address       text,
  ADD COLUMN IF NOT EXISTS mac_addresses    text,
  ADD COLUMN IF NOT EXISTS last_seen_at     timestamptz,
  ADD COLUMN IF NOT EXISTS last_logged_user text,
  ADD COLUMN IF NOT EXISTS processor        text,
  ADD COLUMN IF NOT EXISTS memory           text,
  ADD COLUMN IF NOT EXISTS antivirus        text,
  ADD COLUMN IF NOT EXISTS last_synced_at   timestamptz,
  ADD UNIQUE (source, external_id);         -- prevents duplicate upserts
```

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

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/v1/sync?source=intune\|atera\|all` | `DEVICE_SYNC_KEY` | Trigger ingestion (internal/scheduled) |
| GET | `/v1/devices` | `DEVICE_API_KEY` | Paginated device list (3rd party) |
| GET | `/v1/devices/:id` | `DEVICE_API_KEY` | Single device (3rd party) |

Two separate env-var keys: `DEVICE_SYNC_KEY` (internal, admin-level) and `DEVICE_API_KEY` (shared with developer, read-only).

### Required Secrets

| Env Var | Purpose |
|--------|---------|
| `DEVICE_SYNC_KEY` | Admin key for POST /v1/sync |
| `DEVICE_API_KEY` | Read key issued to 3rd party developer |
| `INTUNE_TENANT_ID` | Azure AD tenant |
| `INTUNE_CLIENT_ID` | App registration client ID |
| `INTUNE_CLIENT_SECRET` | App registration secret |
| `ATERA_API_KEY` | Atera API key |
| `SUPABASE_URL` | Auto-provided by Supabase runtime |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-provided by Supabase runtime |

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

Paginates `GET https://app.atera.com/api/v3/agents` using `X-API-KEY` header.

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

## 5. Normaliser (`normalise.ts`)

Single function `normalise(source, raw[]) → HardwareInventoryInsert[]` with per-source adapters. Uses `serial_number` + `device_name` as human-readable dedup keys alongside `(source, external_id)`.

Upsert strategy:

```typescript
await supabase
  .from('hardware_inventory')
  .upsert(rows, { onConflict: 'source,external_id', ignoreDuplicates: false })
```

---

## 6. Tests (`index.test.ts`)

Mirrors the `profile-lookup` test pattern (mock Supabase client factory, `makeQueryBuilder`, stub `Deno.env`):

- Auth: missing key → 401, wrong key → 401
- `GET /v1/devices` → 200 with pagination envelope
- `GET /v1/devices/:uuid` → 200, invalid UUID → 400, not found → 404
- `POST /v1/sync?source=intune` with wrong key → 401
- `POST /v1/sync?source=atera` → mock Atera fetch, assert upsert called
- `POST /v1/sync?source=intune` → mock Graph token + devices fetch, assert upsert called
- CORS preflight → 204

External HTTP calls (Graph, Atera) are stubbed with `stub(globalThis, 'fetch', ...)`.

---

## 7. Sharing: API Endpoint vs Edge Function Source

### Option A — Share the API endpoint (recommended)

Give the developer: the base URL, a scoped `DEVICE_API_KEY`, and a reference doc modelled on `learn/docs/PROFILE_LOOKUP_API_REFERENCE.md`.

**Pros**
- Zero deployment overhead for the developer — just HTTP calls
- Credentials (Intune, Atera) never leave your infrastructure
- You control versioning, rate limiting, and data freshness
- Consistent with how you already share `profile-lookup` with govern

**Cons**
- Developer is dependent on your uptime and your sync schedule
- Any schema or field changes are a breaking change you must manage
- Read-only; developer cannot trigger a sync themselves (unless you expose POST /v1/sync with a limited key)

### Option B — Share the edge function source code

Give the developer the `device-ingest/` directory to deploy to their own Supabase project.

**Pros**
- Developer is fully autonomous — they control schedule, fields, retries
- No cross-team coordination for deploys or rate limits

**Cons**
- Developer must manage their own Intune/Atera credentials (security risk if mishandled)
- They must operate a Supabase project and Deno runtime
- Divergence risk: their fork drifts from your canonical schema
- If Intune/Atera API changes, they must update independently
- You lose visibility into what data they're writing to their DB

### Recommendation

Share the **API endpoint** (Option A). It matches the established `profile-lookup` precedent, keeps secrets centralised, and gives you control over the data contract. Add a `POST /v1/sync` route protected by a separate short-lived sync key if the developer needs to trigger on-demand refreshes. Document it the same way as the profile-lookup API reference.

---

## 8. Supabase Config

Add to `govern/supabase/config.toml`:

```toml
[functions.device-ingest]
verify_jwt = false
```

---

## Implementation Checklist

- [ ] `govern/supabase/migrations/add_device_ingest_columns.sql` — DB migration
- [ ] `govern/supabase/functions/device-ingest/intune.ts` — Intune Graph client
- [ ] `govern/supabase/functions/device-ingest/atera.ts` — Atera REST client
- [ ] `govern/supabase/functions/device-ingest/normalise.ts` — field normaliser
- [ ] `govern/supabase/functions/device-ingest/index.ts` — main handler
- [ ] `govern/supabase/functions/device-ingest/index.test.ts` — Deno unit tests
- [ ] `govern/supabase/functions/device-ingest/deno.json` — Deno config
- [ ] `govern/supabase/config.toml` — add `[functions.device-ingest]` entry
- [ ] `govern/docs/DEVICE_INGEST_API_REFERENCE.md` — API reference for 3rd party developer
