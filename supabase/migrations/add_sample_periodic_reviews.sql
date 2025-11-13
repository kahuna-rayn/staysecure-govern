-- Add sample periodic review data matching key dates activities
-- This includes quarterly, semi-annual, and annual reviews

-- Use this user ID for submitted_by and approved_by
-- Replace with actual user ID from your profiles table if different
DO $$
DECLARE
  user_id UUID := '56e2b62a-c393-4bcf-ae6d-1b8c4b0fa823';
BEGIN
  -- Quarterly Reviews (Q1-Q4 for 2025)
  INSERT INTO periodic_reviews (activity, due_date, approval_status, summary_or_evidence, any_change, submitted_at, submitted_by, approved_at, approved_by)
  VALUES
    -- Q1 Reviews
    ('Anti-Malware Report Review (Quarterly) - Q1', '2025-03-31', 'Submitted', 'All systems scanned and updated. No threats detected.', false, '2025-03-25 10:00:00', user_id, '2025-03-26 10:00:00', user_id),
    ('Usage of Administrative Account Log and Maintenance Review (Quarterly) - Q1', '2025-03-31', 'Approved', 'All admin accounts reviewed. Access logs show normal activity patterns.', false, '2025-03-27 14:00:00', user_id, '2025-03-28 14:30:00', user_id),
    ('Security Incident Response Review (Quarterly) - Q1', '2025-03-31', 'Not Submitted', NULL, NULL, NULL, NULL, '2025-03-31 23:59:59', user_id),
    
    -- Q2 Reviews
    ('Anti-Malware Report Review (Quarterly) - Q2', '2025-06-30', 'Submitted', 'Quarterly scan completed. One false positive resolved.', true, '2025-06-27 09:00:00', user_id, '2025-06-28 09:15:00', user_id),
    ('Usage of Administrative Account Log and Maintenance Review (Quarterly) - Q2', '2025-06-30', 'Not Submitted', NULL, NULL, NULL, NULL, '2025-06-30 23:59:59', user_id),
    ('Security Incident Response Review (Quarterly) - Q2', '2025-06-30', 'Approved', 'Response procedures tested. All team members trained on new protocols.', true, '2025-06-28 16:00:00', user_id, '2025-06-29 16:45:00', user_id),
    
    -- Q3 Reviews
    ('Anti-Malware Report Review (Quarterly) - Q3', '2025-09-30', 'Not Submitted', NULL, NULL, NULL, NULL, '2025-09-30 23:59:59', user_id),
    ('Usage of Administrative Account Log and Maintenance Review (Quarterly) - Q3', '2025-09-30', 'Not Submitted', NULL, NULL, NULL, NULL, '2025-09-30 23:59:59', user_id),
    ('Security Incident Response Review (Quarterly) - Q3', '2025-09-30', 'Not Submitted', NULL, NULL, NULL, NULL, '2025-09-30 23:59:59', user_id),
    
    -- Q4 Reviews
    ('Anti-Malware Report Review (Quarterly) - Q4', '2025-12-31', 'Not Submitted', NULL, NULL, NULL, NULL, '2025-12-31 23:59:59', user_id),
    ('Usage of Administrative Account Log and Maintenance Review (Quarterly) - Q4', '2025-12-31', 'Not Submitted', NULL, NULL, NULL, NULL, '2025-12-31 23:59:59', user_id),

    -- Semi-Annual Reviews
    ('Data Backup and Recovery Testing (Semi-Annual) - H1', '2025-06-30', 'Approved', 'Full backup restoration test completed successfully. All systems operational.', false, '2025-06-19 11:00:00', user_id, '2025-06-20 11:00:00', user_id),
    ('Business Continuity Plan Review (Semi-Annual) - H1', '2025-06-30', 'Submitted', 'BCP updated with new contact information and revised procedures.', true, '2025-06-22 13:00:00', user_id, '2025-06-23 13:20:00', user_id),
    ('Data Backup and Recovery Testing (Semi-Annual) - H2', '2025-12-31', 'Not Submitted', NULL, NULL, NULL, NULL, '2025-12-31 23:59:59', user_id),
    ('Business Continuity Plan Review (Semi-Annual) - H2', '2025-12-31', 'Not Submitted', NULL, NULL, NULL, NULL, '2025-12-31 23:59:59', user_id),

    -- Annual Reviews
    ('Security Policy Review (Annual)', '2025-12-31', 'Submitted', 'Annual security policy review in progress. Updates to password policy and access controls under consideration.', true, '2025-12-15 10:00:00', user_id, '2025-12-16 10:30:00', user_id),
    ('Risk Assessment (Annual)', '2025-12-31', 'Not Submitted', NULL, NULL, NULL, NULL, '2025-12-31 23:59:59', user_id),
    ('Compliance Audit (Annual)', '2025-12-31', 'Not Submitted', NULL, NULL, NULL, NULL, '2025-12-31 23:59:59', user_id),
    ('Vendor Security Assessment (Annual)', '2025-12-31', 'Approved', 'All vendors assessed. Three vendors require updated security documentation.', true, '2025-12-10 15:00:00', user_id, '2025-12-11 15:00:00', user_id);
END $$;

