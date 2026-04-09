# Cybersecurity Score — Calculation Reference

**Source file:** `govern/src/components/Dashboard.tsx`

The Cybersecurity Score is a composite 0–100 index (displayed as a /850-style scale with risk bands) calculated entirely on the frontend from live Supabase data. It has three sub-scores — Education, Protection, and Readiness — each fed by different data sources and weighted into the overall score.

---

## Overall Score

```
Overall = (Education × 40%) + (Protection × 45%) + (Readiness × 15%)
```

The result is an integer 0–100. It is displayed on a 300–850 scale on the UI (cosmetic only; the underlying math is 0–100).

### Risk bands

| Score | Label | Description |
|-------|-------|-------------|
| ≥ 80 | Very Low Risk | Mature cybersecurity program; strong controls in place |
| ≥ 74 | Low Risk | Good security posture; minor gaps may exist |
| ≥ 67 | Moderate Risk | Basic security controls in place; moderate exposure |
| ≥ 58 | High Risk | Weak security hygiene; multiple vulnerabilities likely |
| < 58 | Critical Risk | Severely lacking security defenses; major gaps may be unmitigated |

---

## Education Score (weight: 40%)

Measures how well the organisation has enrolled and completed cybersecurity and data-protection training.

```
Education =
  20% × (cyberLearners / totalStaff × 100)               -- % staff enrolled in Learn
+ 20% × (dataProtectionLearners / totalStaff × 100)       -- % staff enrolled in Data Protection
+ 30% × (completedLearn / cyberLearners × 100)            -- % enrolled who completed Cyber Security training
+ 30% × (completedPDPA / dataProtectionLearners × 100)    -- % enrolled who completed Data Protection training
```

### Data source

| Variable | Source |
|----------|--------|
| `totalStaff` | `profiles` row count |
| `cyberLearners` | `profiles` rows where `cyber_learner = true` |
| `dataProtectionLearners` | `profiles` rows where `dpe_learner = true` |
| `completedLearn` | `profiles` rows where `learn_complete = true` |
| `completedPDPA` | `profiles` rows where `dpe_complete = true` |

---

## Protection Score (weight: 45%)

Measures the organisation's hardware/software hygiene and inventory review currency.

```
Compliance %         = avg(configPercentage, patchPercentage)

configPercentage     = Active hardware / total hardware × 100
patchPercentage      = Hardware updated in last 30 days / total hardware × 100

updatedAccountInv %  = (total accounts − "Not submitted" accounts) / total accounts × 100
updatedHardwareInv % = (total hardware − "Not submitted" hardware) / total hardware × 100

Protection =
  40% × Compliance %
+ 30% × updatedAccountInv %
+ 30% × updatedHardwareInv %
```

### Data source

| Variable | Source |
|----------|--------|
| `configPercentage` | `hardware_inventory` rows where `status = 'Active'` |
| `patchPercentage` | `hardware_inventory` rows where `updated_at ≥ now − 30 days` |
| `updatedAccountInv` | `account_inventory` rows where `approval_status ≠ 'Not submitted'` |
| `updatedHardwareInv` | `hardware_inventory` rows where `approval_status ≠ 'Not submitted'` |

---

## Readiness Score (weight: 15%)

Measures incident preparedness: phishing resistance, breach team readiness, and policy document read-through rates.

```
Readiness =
  40% × phishingPassRate                -- (sent − clicked) / sent × 100
+ 20% × dbimtScore                     -- rolesWithMembers / 7 × 100
+ 10% × irpCompletionRate              -- IRP completed assignments / total assigned × 100
+ 10% × ispCompletionRate              -- ISP completed assignments / total assigned × 100
+ 10% × dppCompletionRate              -- DPP completed assignments / total assigned × 100
+ 10% × chhCompletionRate              -- CHH completed assignments / total assigned × 100
```

### DBIMT score detail

The Data Breach Incident Management Team (DBIMT) score checks whether all 7 key breach-team roles have at least one member assigned. Roles excluded from the count: `Insurance Rep`, `Incident Manager`.

```
dbimtScore = rolesWithMembers / 7 × 100
```

The team is shown as "Identified" on the dashboard only when `dbimtScore === 100` (all 7 roles filled).

### Document matching

Documents are looked up by title keyword (case-insensitive):

| Abbrev | Keywords matched |
|--------|-----------------|
| IRP | `incident response` OR category `incident` |
| ISP | `information security` OR `security policy` |
| DPP | `data protection` OR `privacy policy` |
| CHH | exact title `Cyber Hygiene Handbook - All Staff` |

Completion rate per document:
```
rate = completed document_assignments / total document_assignments for that doc_id
```

### Data source

| Variable | Source |
|----------|--------|
| `phishingPassRate` | `user_phishing_scores` — `resource = 'sent'` vs `resource = 'click_link'` |
| `dbimtScore` | `breach_management_team` + `breach_team_members` tables |
| Document rates | `documents` + `document_assignments` (`status = 'Completed'`) |

---

## Metric colour thresholds (UI only)

Applied to all percentage/score metrics on the dashboard cards:

| Value | Colour |
|-------|--------|
| ≥ 80% | Green |
| ≥ 60% | Yellow/Amber |
| < 60% | Red |

Binary metrics (DBIMT): Green = "Identified", Red = "Not Identified".

---

## Notes and known gaps

- The `AdminPanel.tsx` component contains an older **static/hardcoded** version of the score display (817/850). This is a UI prototype and is not used in the live dashboard — `Dashboard.tsx` is the live component.
- The `hiddenMetricsTable` array in `Dashboard.tsx` (lines 274–280) documents an earlier weighting proposal (10/40/0/25/25) that is **not** used in the actual calculation. It is retained for reference only.
- The `dpba_domain_score_view` query (Data Protection Behaviour Assessment) is commented out — not yet live.
- The `csba_domain_score_view` query (Cybersecurity Behaviour Assessment bar chart) is fetched but the chart UI is commented out, pending a product decision on when to surface it.
- The overall score range is displayed as 300–850 on screen but the calculation produces 0–100. The display is cosmetic — there is no linear mapping between 0–100 and 300–850; the raw integer is shown directly in the /850 UI.
