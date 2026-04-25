# Device Inventory API — Reference

This document is for the 3rd party developer integrating govern's hardware inventory into an external system.

---

## Authentication

All requests must include a Bearer token in the `Authorization` header:

```
Authorization: Bearer <GOVERN_API_KEY>
```

The key is provided separately per client deployment. Keep it confidential — it is not rotated automatically.

---

## Base URL

```
https://<project-ref>.supabase.co/functions/v1/device-ingest
```

The `<project-ref>` is specific to each client deployment and provided alongside the API key.

---

## Endpoints

### `GET /v1/devices`

Returns a paginated list of all devices in the hardware inventory.

**Query parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | `1` | Page number (1-based) |
| `page_size` | integer | `100` | Results per page (max `200`) |
| `updated_since` | ISO 8601 string | — | Only return devices updated at or after this timestamp |

**Example request**

```
GET /v1/devices?page=1&page_size=100
Authorization: Bearer <GOVERN_API_KEY>
```

**Example response**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "device_name": "DESKTOP-ABC123",
      "serial_number": "SN12345",
      "asset_type": "laptop",
      "asset_owner": "Jane Smith",
      "user_id": "a1b2c3d4-...",
      "manufacturer": "Dell",
      "model": "Latitude 5520",
      "os_type": "Windows",
      "os_version": "11.0.22621",
      "os_edition": "Enterprise",
      "status": "Active",
      "source": "intune",
      "external_id": "abc123-intune-id",
      "asset_location": "London Office",
      "ip_address": "192.168.1.42",
      "mac_addresses": "AA:BB:CC:DD:EE:FF",
      "domain_workgroup": "CORP",
      "last_seen_at": "2026-04-23T22:00:00Z",
      "last_logged_user": "jsmith",
      "processor": "Intel Core i7-1185G7",
      "memory": "16 GB",
      "antivirus": "Microsoft Defender",
      "last_synced_at": "2026-04-24T02:00:00Z",
      "created_at": "2026-01-15T10:00:00Z",
      "updated_at": "2026-04-24T02:00:00Z"
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

**Incremental sync example**

To fetch only records changed since your last sync, pass the timestamp of your previous run:

```
GET /v1/devices?updated_since=2026-04-23T02:00:00Z
```

---

### `GET /v1/devices/:id`

Returns a single device by its UUID.

**Path parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | The device `id` from a previous list response |

**Example request**

```
GET /v1/devices/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <GOVERN_API_KEY>
```

**Example response**

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "device_name": "DESKTOP-ABC123",
    ...
  }
}
```

---

## Field reference

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier in govern |
| `device_name` | string | Hostname / computer name |
| `serial_number` | string | Hardware serial number |
| `asset_type` | string | `laptop`, `desktop`, `mobile`, `computer` |
| `asset_owner` | string | Display name of the assigned user |
| `user_id` | UUID \| null | Linked user profile UUID (null if unresolved) |
| `manufacturer` | string \| null | Hardware manufacturer |
| `model` | string \| null | Device model name |
| `os_type` | string \| null | Operating system family: `Windows`, `macOS`, `Linux` |
| `os_version` | string \| null | OS version string |
| `os_edition` | string \| null | OS edition / SKU |
| `status` | string \| null | `Active`, `Inactive`, `Pending Retirement` |
| `source` | string \| null | `intune` or `atera` — originating system |
| `external_id` | string \| null | ID in the originating system |
| `asset_location` | string \| null | Location string as reported by the source system |
| `ip_address` | string \| null | Current IP address (Atera only) |
| `mac_addresses` | string \| null | MAC address(es), comma-separated (Intune only) |
| `domain_workgroup` | string \| null | Windows domain or workgroup (Atera only) |
| `last_seen_at` | ISO 8601 \| null | Last time the device was online (Atera only) |
| `last_logged_user` | string \| null | Last Windows login name (Atera only) |
| `processor` | string \| null | CPU description (Atera only) |
| `memory` | string \| null | RAM description (Atera only) |
| `antivirus` | string \| null | Antivirus product name (Atera only) |
| `last_synced_at` | ISO 8601 \| null | Last time the source system confirmed the device |
| `created_at` | ISO 8601 \| null | When the record was first created in govern |
| `updated_at` | ISO 8601 \| null | When the record was last updated |

---

## Error responses

| Status | Meaning |
|--------|---------|
| `401` | Missing or invalid `GOVERN_API_KEY` |
| `400` | Bad request — invalid UUID format or `updated_since` value |
| `404` | Device not found |
| `500` | Internal server error — contact StaySecure support |

All errors return a JSON body:

```json
{ "error": "Description of the problem" }
```

---

## Code examples

### Python

```python
import requests

BASE = "https://<project-ref>.supabase.co/functions/v1/device-ingest"
HEADERS = {"Authorization": "Bearer <GOVERN_API_KEY>"}

def get_all_devices():
    devices = []
    page = 1
    while True:
        resp = requests.get(
            f"{BASE}/v1/devices",
            headers=HEADERS,
            params={"page": page, "page_size": 200}
        )
        resp.raise_for_status()
        body = resp.json()
        devices.extend(body["data"])
        if not body["pagination"]["has_next_page"]:
            break
        page += 1
    return devices
```

### Node.js

```js
const BASE = 'https://<project-ref>.supabase.co/functions/v1/device-ingest'
const HEADERS = { Authorization: `Bearer ${process.env.GOVERN_API_KEY}` }

async function getAllDevices() {
  const devices = []
  let page = 1
  while (true) {
    const res = await fetch(`${BASE}/v1/devices?page=${page}&page_size=200`, { headers: HEADERS })
    const { data, pagination } = await res.json()
    devices.push(...data)
    if (!pagination.has_next_page) break
    page++
  }
  return devices
}
```

### PHP

```php
function getAllDevices($baseUrl, $apiKey) {
    $devices = [];
    $page = 1;
    do {
        $url = "$baseUrl/v1/devices?page=$page&page_size=200";
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_HTTPHEADER     => ["Authorization: Bearer $apiKey"],
            CURLOPT_RETURNTRANSFER => true,
        ]);
        $body = json_decode(curl_exec($ch), true);
        curl_close($ch);
        $devices = array_merge($devices, $body['data']);
        $hasNext = $body['pagination']['has_next_page'];
        $page++;
    } while ($hasNext);
    return $devices;
}
```

---

## Notes

- The inventory is refreshed nightly by an automated sync from the client's device management system (Intune or Atera). There is no on-demand refresh endpoint.
- `user_id` is populated automatically for Intune-sourced devices where the device's UPN matches a user email in govern. For Atera-sourced devices, it may be null until manually assigned by a govern administrator.
- The `source` field is consistent for all devices in a given client deployment — a client uses either Intune or Atera, not both.
