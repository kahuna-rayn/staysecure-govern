# Key Dates Due Date Calculation - Known Issue

## Current Implementation (Temporary for Demo)

**Status**: ⚠️ **Temporary Implementation - Needs Fix**

The current due date calculation in `CompliancePanel.tsx` uses a simplified approach that calculates dates based on:
- Activity frequency (Quarterly, Monthly, Annually, etc.)
- Quarter extracted from activity name (Q1, Q2, Q3, Q4)
- Current date/year

### Current Logic

For quarterly activities:
- Extracts quarter from activity name (e.g., "Anti-Malware Report Review (Quarterly) - Q1")
- Calculates quarter end dates:
  - Q1: March 31
  - Q2: June 30
  - Q3: September 30
  - Q4: December 31
- If quarter has passed, uses next year's date

## Correct Implementation (Required)

**The due dates should be calculated based on the organization's certification dates, not just frequency.**

### What Needs to Be Done

1. **Link to Organization Certifications**
   - Each key activity is associated with a certificate (e.g., "HIB")
   - The certificate should have:
     - Issue date
     - Expiry date
     - Renewal cycle/period

2. **Calculate Based on Certification Timeline**
   - Due dates should be calculated from the certificate's issue/renewal dates
   - For quarterly activities, calculate based on when the certification period started
   - Account for certification renewal cycles

3. **Database Schema Requirements**
   - Need to link `key_dates` table to organization certificates
   - May need to add fields to track:
     - Certificate issue date reference
     - Base calculation date
     - Renewal cycle information

### Example

If an organization's HIB certificate was issued on January 15, 2025:
- Q1 activities should be due based on Q1 of the certification period (not calendar year)
- Q2 activities should be due based on Q2 of the certification period
- etc.

## Priority

**Medium** - Current implementation works for demo purposes but needs to be corrected before production use.

## Related Files

- `src/components/CompliancePanel.tsx` - Contains the `calculateDueDate()` function
- `key_dates` table - Stores key activities and their frequencies
- Organization certificates table - Needs to be linked for proper calculation

## Notes

- The "Updated Due Date" column allows manual overrides, which will take precedence over calculated dates
- This is acceptable for edge cases, but the base calculation should be correct

