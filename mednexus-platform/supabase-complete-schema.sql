-- =====================================================
-- MEDNEXUS: Complete Database Schema
-- Includes: Medical Doctors, Document Metadata, Document Files
-- Institution table already exists as the base
-- =====================================================

-- =====================================================
-- 1. MEDICAL DOCTORS TABLE
-- =====================================================
-- Stores doctor information after blockchain registration
-- References: medical_institutions table (already exists)

CREATE TABLE IF NOT EXISTS medical_doctors (
    -- Primary identifiers
    id VARCHAR(100) PRIMARY KEY, -- Auto-generated like 'dr-sarah-johnson-mercy'
    name VARCHAR(255) NOT NULL,
    
    -- Medical credentials
    medical_license_number VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'CA-MD-789012'
    license_prefix VARCHAR(10), -- Extracted prefix like 'CA-MD'
    medical_specialty VARCHAR(255) NOT NULL, -- e.g., 'Interventional Cardiology'
    department VARCHAR(255) NOT NULL, -- e.g., 'Cardiology'
    years_of_experience INTEGER DEFAULT 0,
    
    -- Institution association (FOREIGN KEY to medical_institutions)
    institution_id VARCHAR(100) NOT NULL REFERENCES medical_institutions(id) ON DELETE CASCADE,
    institution_wallet VARCHAR(42), -- Institution wallet address from blockchain
    
    -- Contact information
    phone VARCHAR(50),
    email VARCHAR(255),
    
    -- Blockchain integration (added after successful blockchain registration)
    wallet_address VARCHAR(42) NOT NULL UNIQUE, -- Doctor's wallet address
    transaction_hash VARCHAR(66), -- Transaction hash from blockchain registration
    blockchain_registered BOOLEAN DEFAULT FALSE,
    stake_amount DECIMAL(20,8), -- Amount staked on blockchain (0.0005 A0GI)
    
    -- Verification status
    verified_by VARCHAR(42), -- Institution admin wallet who verified
    verification_date TIMESTAMPTZ,
    verification_status VARCHAR(20) DEFAULT 'verified', -- pending, verified, rejected
    
    -- Permissions (JSON for flexibility)
    permissions JSONB DEFAULT '{
        "canUpload": true,
        "canShare": true,
        "canViewAllDepartments": false,
        "canManageUsers": false,
        "canUploadDepartmental": true,
        "canUploadInstitutional": false,
        "canPublishPublic": false,
        "accessLevel": "doctor"
    }'::jsonb,
    
    -- Profile information
    profile_info JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for medical_doctors
CREATE INDEX IF NOT EXISTS idx_doctors_institution ON medical_doctors(institution_id);
CREATE INDEX IF NOT EXISTS idx_doctors_wallet ON medical_doctors(wallet_address);
CREATE INDEX IF NOT EXISTS idx_doctors_license ON medical_doctors(medical_license_number);
CREATE INDEX IF NOT EXISTS idx_doctors_department ON medical_doctors(department);
CREATE INDEX IF NOT EXISTS idx_doctors_specialty ON medical_doctors(medical_specialty);
CREATE INDEX IF NOT EXISTS idx_doctors_status ON medical_doctors(verification_status);

-- =====================================================
-- 2. DOCUMENT METADATA TABLE
-- =====================================================
-- Stores metadata about medical documents
-- Actual file content is stored on 0G Storage Network
-- This table only stores references and metadata

CREATE TABLE IF NOT EXISTS medical_documents (
    -- Primary identifiers
    id VARCHAR(100) PRIMARY KEY, -- Generated like 'upload_1730000000000'
    filename VARCHAR(500) NOT NULL,
    
    -- File information
    file_size BIGINT NOT NULL, -- Size in bytes
    file_type VARCHAR(100) NOT NULL, -- MIME type or extension
    data_type VARCHAR(100) NOT NULL, -- e.g., 'lab_results', 'imaging', 'prescription'
    
    -- 0G Storage reference (THE KEY LINK TO DECENTRALIZED STORAGE)
    storage_hash VARCHAR(66) NOT NULL UNIQUE, -- Merkle root hash from 0G Storage
    encryption_key VARCHAR(255), -- Key used for file encryption
    
    -- Medical metadata
    patient_id VARCHAR(100), -- Can be doctor wallet for institutional docs
    medical_specialty VARCHAR(255),
    urgency_level VARCHAR(50), -- 'routine', 'urgent', 'critical'
    
    -- Institution and doctor association
    institution_id VARCHAR(100) NOT NULL REFERENCES medical_institutions(id) ON DELETE CASCADE,
    uploaded_by VARCHAR(42) NOT NULL, -- Doctor wallet address (references medical_doctors.wallet_address)
    department_id VARCHAR(255) NOT NULL, -- Department name
    
    -- Access control
    access_level VARCHAR(50) NOT NULL DEFAULT 'private', -- 'private', 'departmental', 'institutional', 'shared', 'public'
    access_permissions JSONB DEFAULT '[]'::jsonb, -- Array of institution IDs or department IDs with access
    consent_status VARCHAR(50) DEFAULT 'granted', -- 'granted', 'pending', 'revoked'
    
    -- Document details
    description TEXT,
    tags JSONB DEFAULT '[]'::jsonb, -- Array of tags for search/categorization
    
    -- Sharing and collaboration
    shared_with JSONB DEFAULT '[]'::jsonb, -- Array of institution IDs for shared documents
    approval_status VARCHAR(50) DEFAULT 'approved', -- 'pending', 'approved', 'rejected'
    
    -- Compliance and retention
    compliance_flags JSONB DEFAULT '["HIPAA_COMPLIANT", "GDPR_COMPLIANT", "0G_VERIFIED"]'::jsonb,
    retention_period INTEGER DEFAULT 365, -- Days to retain document
    is_anonymized BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    upload_date TIMESTAMPTZ DEFAULT NOW(),
    last_accessed TIMESTAMPTZ,
    expires_at TIMESTAMPTZ, -- Auto-calculated based on retention_period
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for medical_documents
CREATE INDEX IF NOT EXISTS idx_documents_institution ON medical_documents(institution_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON medical_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_department ON medical_documents(department_id);
CREATE INDEX IF NOT EXISTS idx_documents_access_level ON medical_documents(access_level);
CREATE INDEX IF NOT EXISTS idx_documents_data_type ON medical_documents(data_type);
CREATE INDEX IF NOT EXISTS idx_documents_specialty ON medical_documents(medical_specialty);
CREATE INDEX IF NOT EXISTS idx_documents_urgency ON medical_documents(urgency_level);
CREATE INDEX IF NOT EXISTS idx_documents_storage_hash ON medical_documents(storage_hash);
CREATE INDEX IF NOT EXISTS idx_documents_upload_date ON medical_documents(upload_date DESC);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON medical_documents USING gin(tags);

-- =====================================================
-- 3. DOCUMENT FILES STORAGE REFERENCE TABLE
-- =====================================================
-- Tracks file locations and storage status on 0G Storage Network
-- This is for advanced tracking of file storage across the network

CREATE TABLE IF NOT EXISTS document_storage_references (
    -- Primary identifiers
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id VARCHAR(100) NOT NULL REFERENCES medical_documents(id) ON DELETE CASCADE,
    
    -- 0G Storage network details
    storage_hash VARCHAR(66) NOT NULL, -- Merkle root hash (same as in medical_documents)
    indexer_url TEXT NOT NULL, -- 0G Indexer URL used for upload
    rpc_url TEXT, -- EVM RPC URL used
    
    -- Transaction details
    transaction_hash VARCHAR(66), -- Blockchain transaction hash for upload
    block_number BIGINT, -- Block number where upload was confirmed
    
    -- Storage status
    storage_status VARCHAR(50) DEFAULT 'uploaded', -- 'uploading', 'uploaded', 'verified', 'failed'
    verification_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'verified', 'failed'
    
    -- File chunks information (0G stores files in chunks)
    total_chunks INTEGER,
    uploaded_chunks INTEGER,
    chunk_size BIGINT,
    
    -- Network redundancy
    replica_count INTEGER DEFAULT 1, -- How many replicas exist on network
    nodes_storing JSONB DEFAULT '[]'::jsonb, -- Array of node IDs storing this file
    
    -- Performance metrics
    upload_duration_ms INTEGER, -- Time taken to upload
    verification_duration_ms INTEGER, -- Time taken to verify
    
    -- Error tracking
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    last_retry_at TIMESTAMPTZ,
    
    -- Timestamps
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for document_storage_references
CREATE INDEX IF NOT EXISTS idx_storage_document ON document_storage_references(document_id);
CREATE INDEX IF NOT EXISTS idx_storage_hash_ref ON document_storage_references(storage_hash);
CREATE INDEX IF NOT EXISTS idx_storage_status ON document_storage_references(storage_status);
CREATE INDEX IF NOT EXISTS idx_storage_verification ON document_storage_references(verification_status);
CREATE INDEX IF NOT EXISTS idx_storage_uploaded_at ON document_storage_references(uploaded_at DESC);

-- =====================================================
-- 4. DOCUMENT ACCESS LOG TABLE
-- =====================================================
-- Tracks who accessed which documents (audit trail)

CREATE TABLE IF NOT EXISTS document_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id VARCHAR(100) NOT NULL REFERENCES medical_documents(id) ON DELETE CASCADE,
    
    -- Who accessed
    accessed_by VARCHAR(42) NOT NULL, -- Doctor wallet address
    doctor_name VARCHAR(255),
    institution_id VARCHAR(100) REFERENCES medical_institutions(id) ON DELETE SET NULL,
    
    -- What action
    access_type VARCHAR(50) NOT NULL, -- 'view', 'download', 'share', 'delete'
    access_result VARCHAR(50) DEFAULT 'success', -- 'success', 'denied', 'failed'
    
    -- Context
    ip_address VARCHAR(45),
    user_agent TEXT,
    access_reason TEXT, -- Optional reason for access
    
    -- Timestamps
    accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for document_access_logs
CREATE INDEX IF NOT EXISTS idx_access_logs_document ON document_access_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_user ON document_access_logs(accessed_by);
CREATE INDEX IF NOT EXISTS idx_access_logs_institution ON document_access_logs(institution_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_timestamp ON document_access_logs(accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_logs_type ON document_access_logs(access_type);

-- =====================================================
-- 5. DOCUMENT SHARING TABLE
-- =====================================================
-- Tracks document sharing between institutions

CREATE TABLE IF NOT EXISTS document_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id VARCHAR(100) NOT NULL REFERENCES medical_documents(id) ON DELETE CASCADE,
    
    -- From and To
    from_institution_id VARCHAR(100) NOT NULL REFERENCES medical_institutions(id) ON DELETE CASCADE,
    to_institution_id VARCHAR(100) NOT NULL REFERENCES medical_institutions(id) ON DELETE CASCADE,
    shared_by VARCHAR(42) NOT NULL, -- Doctor wallet who initiated share
    
    -- Share permissions
    can_view BOOLEAN DEFAULT TRUE,
    can_download BOOLEAN DEFAULT FALSE,
    can_reshare BOOLEAN DEFAULT FALSE,
    
    -- Share status
    share_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'revoked'
    share_message TEXT, -- Optional message with share request
    
    -- Expiration
    expires_at TIMESTAMPTZ,
    
    -- Timestamps
    shared_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for document_shares
CREATE INDEX IF NOT EXISTS idx_shares_document ON document_shares(document_id);
CREATE INDEX IF NOT EXISTS idx_shares_from_institution ON document_shares(from_institution_id);
CREATE INDEX IF NOT EXISTS idx_shares_to_institution ON document_shares(to_institution_id);
CREATE INDEX IF NOT EXISTS idx_shares_status ON document_shares(share_status);
CREATE INDEX IF NOT EXISTS idx_shares_shared_by ON document_shares(shared_by);

-- =====================================================
-- 6. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_medical_doctors_updated_at BEFORE UPDATE ON medical_doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_documents_updated_at BEFORE UPDATE ON medical_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_storage_references_updated_at BEFORE UPDATE ON document_storage_references
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_shares_updated_at BEFORE UPDATE ON document_shares
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate document expiration date
CREATE OR REPLACE FUNCTION set_document_expiration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.retention_period IS NOT NULL THEN
        NEW.expires_at = NEW.upload_date + (NEW.retention_period || ' days')::INTERVAL;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for document expiration
CREATE TRIGGER set_medical_documents_expiration BEFORE INSERT OR UPDATE ON medical_documents
    FOR EACH ROW EXECUTE FUNCTION set_document_expiration();

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- Enable RLS on all tables

ALTER TABLE medical_doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_storage_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;

-- Example policies (adjust based on your auth setup)

-- Doctors can read their own record
CREATE POLICY doctors_select_own ON medical_doctors
    FOR SELECT USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Doctors can read documents they have access to
CREATE POLICY documents_select_accessible ON medical_documents
    FOR SELECT USING (
        uploaded_by = current_setting('request.jwt.claims', true)::json->>'wallet_address'
        OR access_level = 'public'
        OR (access_level = 'institutional' AND institution_id IN (
            SELECT institution_id FROM medical_doctors 
            WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
        ))
    );

-- =====================================================
-- 8. VIEWS FOR COMMON QUERIES
-- =====================================================

-- View: Documents with uploader details
CREATE OR REPLACE VIEW documents_with_details AS
SELECT 
    d.*,
    doc.name as uploader_name,
    doc.medical_specialty as uploader_specialty,
    doc.department as uploader_department,
    i.name as institution_name,
    i.country as institution_country
FROM medical_documents d
LEFT JOIN medical_doctors doc ON d.uploaded_by = doc.wallet_address
LEFT JOIN medical_institutions i ON d.institution_id = i.id;

-- View: Document storage status
CREATE OR REPLACE VIEW document_storage_status AS
SELECT 
    d.id,
    d.filename,
    d.storage_hash,
    d.institution_id,
    dsr.storage_status,
    dsr.verification_status,
    dsr.transaction_hash,
    dsr.uploaded_at,
    dsr.verified_at
FROM medical_documents d
LEFT JOIN document_storage_references dsr ON d.id = dsr.document_id;

-- View: Institution document statistics
CREATE OR REPLACE VIEW institution_document_stats AS
SELECT 
    i.id as institution_id,
    i.name as institution_name,
    COUNT(DISTINCT d.id) as total_documents,
    COUNT(DISTINCT d.uploaded_by) as active_doctors,
    SUM(d.file_size) as total_storage_bytes,
    COUNT(CASE WHEN d.access_level = 'private' THEN 1 END) as private_documents,
    COUNT(CASE WHEN d.access_level = 'departmental' THEN 1 END) as departmental_documents,
    COUNT(CASE WHEN d.access_level = 'institutional' THEN 1 END) as institutional_documents,
    COUNT(CASE WHEN d.access_level = 'public' THEN 1 END) as public_documents
FROM medical_institutions i
LEFT JOIN medical_documents d ON i.id = d.institution_id
GROUP BY i.id, i.name;

-- =====================================================
-- 9. SAMPLE QUERIES
-- =====================================================

-- Query 1: Get all documents for a specific doctor
-- SELECT * FROM medical_documents WHERE uploaded_by = '0x123...';

-- Query 2: Get documents accessible to a doctor's department
-- SELECT * FROM medical_documents 
-- WHERE institution_id = 'mercy-general-hospital-usa' 
-- AND department_id = 'Cardiology'
-- AND access_level IN ('departmental', 'institutional', 'public');

-- Query 3: Get storage hash for downloading from 0G Storage
-- SELECT storage_hash, encryption_key FROM medical_documents WHERE id = 'upload_123';

-- Query 4: Track document access
-- INSERT INTO document_access_logs (document_id, accessed_by, access_type)
-- VALUES ('upload_123', '0x123...', 'download');

-- Query 5: Get document statistics by institution
-- SELECT * FROM institution_document_stats WHERE institution_id = 'mercy-general-hospital-usa';

-- =====================================================
-- END OF SCHEMA
-- =====================================================

-- Notes:
-- 1. Actual file content is NEVER stored in database
-- 2. Only storage_hash (merkle root) is stored as reference to 0G Storage
-- 3. Anyone with storage_hash can retrieve file from 0G decentralized network
-- 4. medical_institutions table must exist first (already exists in your setup)
-- 5. All foreign keys reference medical_institutions for data integrity
