-- TEMPORARY FIX: Disable RLS for testing
-- Run this in Supabase SQL Editor

ALTER TABLE medical_doctors DISABLE ROW LEVEL SECURITY;
ALTER TABLE medical_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE document_storage_references DISABLE ROW LEVEL SECURITY;
ALTER TABLE document_access_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE document_shares DISABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_trials DISABLE ROW LEVEL SECURITY;
ALTER TABLE research_projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE medical_institutions DISABLE ROW LEVEL SECURITY;

-- Add missing institution that the code is trying to reference
INSERT INTO medical_institutions (id, name, country, address, phone, email, type, created_at) 
VALUES (
    'mercy-general-sf',
    'Mercy General Hospital San Francisco', 
    'USA',
    '123 Medical Center Dr, San Francisco, CA 94123',
    '+1-415-555-0123',
    'info@mercygeneral-sf.com',
    'hospital',
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Or create proper INSERT policies:
-- CREATE POLICY documents_insert ON medical_documents
--     FOR INSERT WITH CHECK (true); -- Allow all inserts for now