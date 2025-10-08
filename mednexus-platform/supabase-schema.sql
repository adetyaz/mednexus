-- =====================================================
-- MEDNEXUS: Institution Registration Schema
-- Minimal schema for blockchain-first registration
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- MEDICAL INSTITUTIONS TABLE
-- =====================================================

CREATE TABLE medical_institutions (
    -- Primary identifiers
    id VARCHAR(100) PRIMARY KEY, -- Auto-generated like 'st-marys-london'
    name VARCHAR(255) NOT NULL,
    
    -- Location
    country VARCHAR(100) NOT NULL,
    address TEXT,
    
    -- Medical licensing
    license_number VARCHAR(100) NOT NULL, -- e.g., 'UK-NHS-007842'
    license_prefix VARCHAR(10), -- Extracted prefix like 'UK-NHS'
    accreditation TEXT,
    
    -- Contact information
    phone VARCHAR(50),
    email VARCHAR(255),
    emergency_contact VARCHAR(50),
    
    -- Blockchain integration (added after successful blockchain registration)
    wallet_address VARCHAR(42), -- Ethereum wallet address
    transaction_hash VARCHAR(66), -- Transaction hash from blockchain registration
    blockchain_registered BOOLEAN DEFAULT FALSE,
    
    -- Verification status (you handle manually)
    verified_by VARCHAR(42), -- Verifier wallet address
    verification_date TIMESTAMPTZ,
    
    -- Departments (JSON array for flexibility)
    departments JSONB DEFAULT '[]', -- e.g., ["Emergency Medicine", "Cardiology"]
    
    -- Metadata
    region VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_institutions_license_prefix ON medical_institutions(license_prefix);
CREATE INDEX idx_institutions_country ON medical_institutions(country);
CREATE INDEX idx_institutions_wallet ON medical_institutions(wallet_address);

CREATE INDEX idx_institutions_blockchain ON medical_institutions(blockchain_registered);

-- =====================================================
-- AUTO-UPDATE TIMESTAMPS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_institutions_updated_at 
    BEFORE UPDATE ON medical_institutions 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =====================================================
-- FUNCTION TO EXTRACT LICENSE PREFIX
-- =====================================================

CREATE OR REPLACE FUNCTION extract_license_prefix(license_number TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Extract prefix before the last hyphen
    -- UK-NHS-007842 -> UK-NHS
    -- CA-HOSP-123456 -> CA-HOSP
    -- US-STATE-789012 -> US-STATE
    
    IF license_number ~ '^[A-Z]{2,3}-[A-Z]{2,4}-' THEN
        RETURN SUBSTRING(license_number FROM '^([A-Z]{2,3}-[A-Z]{2,4})');
    ELSE
        -- Fallback: just take first part before hyphen
        RETURN SPLIT_PART(license_number, '-', 1);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER TO AUTO-EXTRACT LICENSE PREFIX
-- =====================================================

CREATE OR REPLACE FUNCTION auto_extract_license_prefix()
RETURNS TRIGGER AS $$
BEGIN
    NEW.license_prefix = extract_license_prefix(NEW.license_number);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_license_prefix 
    BEFORE INSERT OR UPDATE ON medical_institutions 
    FOR EACH ROW EXECUTE PROCEDURE auto_extract_license_prefix();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE medical_institutions ENABLE ROW LEVEL SECURITY;

-- Allow public read access (institutions can be public)
CREATE POLICY "Public read access" ON medical_institutions FOR SELECT USING (true);

-- Allow authenticated users to insert (registration)
CREATE POLICY "Allow registration" ON medical_institutions FOR INSERT WITH CHECK (true);

-- Allow updates to own records (for blockchain data updates)
CREATE POLICY "Allow updates" ON medical_institutions FOR UPDATE USING (true);

-- =====================================================
-- SAMPLE DATA (based on your demo structure)
-- =====================================================

-- Insert one sample institution to test the structure
INSERT INTO medical_institutions (
    id,
    name,
    country,
    address,
    license_number,
    accreditation,
    phone,
    email,
    emergency_contact,
    departments,
    region
) VALUES (
    'st-marys-london',
    'St. Mary''s Hospital London',
    'United Kingdom',
    'Praed Street, Paddington, London W2 1NY, UK',
    'UK-NHS-007842',
    'CQC Outstanding, UKAS',
    '+44 20 3312 6666',
    'enquiries@stmarys.nhs.uk',
    '+44 20 3312 6000',
    '["Accident & Emergency", "Cardiothoracic Surgery", "Neurology", "Oncology", "General Surgery", "Radiology", "Intensive Care", "Paediatrics"]',
    'Europe'
);

-- =====================================================
-- USEFUL QUERIES
-- =====================================================

-- Get institutions by license prefix (for verification matching)
-- SELECT * FROM medical_institutions WHERE license_prefix = 'UK-NHS';

-- Get blockchain-registered institutions
-- SELECT * FROM medical_institutions WHERE blockchain_registered = true;

-- Get institutions pending verification


-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE medical_institutions IS 'Medical institutions with blockchain-first registration';
COMMENT ON COLUMN medical_institutions.id IS 'Auto-generated ID like st-marys-london';
COMMENT ON COLUMN medical_institutions.license_prefix IS 'Extracted prefix like UK-NHS for verification matching';
COMMENT ON COLUMN medical_institutions.wallet_address IS 'Added after successful blockchain registration';
COMMENT ON COLUMN medical_institutions.transaction_hash IS 'Transaction hash from blockchain registration';
COMMENT ON COLUMN medical_institutions.blockchain_registered IS 'True only after successful blockchain transaction';

-- =====================================================
-- MEDICAL DOCTORS TABLE  
-- =====================================================

CREATE TABLE medical_doctors (
    -- Primary identifiers
    id VARCHAR(100) PRIMARY KEY, -- Auto-generated like 'dr-sarah-johnson-mercy'
    name VARCHAR(255) NOT NULL,
    
    -- Medical credentials
    medical_license_number VARCHAR(100) NOT NULL, -- e.g., 'CA-MD-789012'
    license_prefix VARCHAR(10), -- Extracted prefix like 'CA-MD'
    medical_specialty VARCHAR(255) NOT NULL, -- e.g., 'Interventional Cardiology'
    department VARCHAR(255) NOT NULL, -- e.g., 'Cardiology'
    years_of_experience INTEGER DEFAULT 0,
    
    -- Institution association (must be blockchain-verified)
    institution_id VARCHAR(100) NOT NULL REFERENCES medical_institutions(id),
    institution_wallet VARCHAR(42), -- Institution wallet address from blockchain
    
    -- Contact information
    phone VARCHAR(50),
    email VARCHAR(255),
    
    -- Blockchain integration (added after successful blockchain registration)
    wallet_address VARCHAR(42) NOT NULL UNIQUE, -- Doctor's wallet address
    transaction_hash VARCHAR(66), -- Transaction hash from blockchain registration
    blockchain_registered BOOLEAN DEFAULT FALSE,
    stake_amount DECIMAL(20,8), -- Amount staked on blockchain (0.0005 A0GI)
    
    -- Verification status (auto-verified on blockchain through staking)
    verification_status VARCHAR(20) DEFAULT 'verified', -- verified (auto through stake)
    verified_by VARCHAR(42), -- Institution wallet who verified (optional)
    verification_date TIMESTAMPTZ,
    
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
    }',
    
    -- Profile information (JSON for extensibility) 
    profile_info JSONB DEFAULT '{}', -- education, certifications, etc.
    
    -- Activity tracking (from smart contract)
    consultation_count INTEGER DEFAULT 0,
    reputation_score INTEGER DEFAULT 100,
    last_activity TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR DOCTORS
-- =====================================================

CREATE INDEX idx_doctors_wallet ON medical_doctors(wallet_address);
CREATE INDEX idx_doctors_institution ON medical_doctors(institution_id);
CREATE INDEX idx_doctors_license_prefix ON medical_doctors(license_prefix);
CREATE INDEX idx_doctors_specialty ON medical_doctors(medical_specialty);
CREATE INDEX idx_doctors_department ON medical_doctors(department);
CREATE INDEX idx_doctors_blockchain ON medical_doctors(blockchain_registered);
CREATE INDEX idx_doctors_verification ON medical_doctors(verification_status);

-- =====================================================
-- AUTO-UPDATE TIMESTAMPS FOR DOCTORS
-- =====================================================

CREATE TRIGGER update_doctors_updated_at 
    BEFORE UPDATE ON medical_doctors 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =====================================================
-- FUNCTION TO EXTRACT DOCTOR LICENSE PREFIX
-- =====================================================

CREATE OR REPLACE FUNCTION extract_doctor_license_prefix(license_number TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Extract prefix from doctor license numbers
    -- CA-MD-789012 -> CA-MD
    -- UK-GMC-654321 -> UK-GMC  
    -- ON-CPSO-123456 -> ON-CPSO
    
    IF license_number ~ '^[A-Z]{2,3}-[A-Z]{2,5}-' THEN
        RETURN SUBSTRING(license_number FROM '^([A-Z]{2,3}-[A-Z]{2,5})');
    ELSE
        -- Fallback: take first two parts
        RETURN SPLIT_PART(license_number, '-', 1) || '-' || SPLIT_PART(license_number, '-', 2);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER TO AUTO-EXTRACT DOCTOR LICENSE PREFIX
-- =====================================================

CREATE OR REPLACE FUNCTION auto_extract_doctor_license_prefix()
RETURNS TRIGGER AS $$
BEGIN
    NEW.license_prefix = extract_doctor_license_prefix(NEW.medical_license_number);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_doctor_license_prefix 
    BEFORE INSERT OR UPDATE ON medical_doctors 
    FOR EACH ROW EXECUTE PROCEDURE auto_extract_doctor_license_prefix();

-- =====================================================
-- FUNCTION TO GENERATE DOCTOR ID
-- =====================================================

CREATE OR REPLACE FUNCTION generate_doctor_id(doctor_name TEXT, institution_id TEXT)
RETURNS TEXT AS $$
DECLARE
    base_name TEXT;
    institution_suffix TEXT;
    final_id TEXT;
    counter INTEGER := 1;
BEGIN
    -- Clean and format doctor name
    base_name := LOWER(TRIM(doctor_name));
    base_name := REGEXP_REPLACE(base_name, '[^a-z0-9\s]', '', 'g'); -- Remove special chars
    base_name := REGEXP_REPLACE(base_name, '\s+', '-', 'g'); -- Replace spaces with hyphens
    base_name := REGEXP_REPLACE(base_name, '^dr-?', ''); -- Remove dr prefix
    
    -- Get institution suffix (first part of institution_id)
    institution_suffix := SPLIT_PART(institution_id, '-', 1);
    
    -- Construct base ID
    final_id := 'dr-' || base_name || '-' || institution_suffix;
    
    -- Ensure uniqueness by appending number if needed
    WHILE EXISTS (SELECT 1 FROM medical_doctors WHERE id = final_id) LOOP
        final_id := 'dr-' || base_name || '-' || institution_suffix || '-' || counter;
        counter := counter + 1;
    END LOOP;
    
    RETURN final_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER TO AUTO-GENERATE DOCTOR ID
-- =====================================================

CREATE OR REPLACE FUNCTION auto_generate_doctor_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        NEW.id = generate_doctor_id(NEW.name, NEW.institution_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_doctor_id 
    BEFORE INSERT ON medical_doctors 
    FOR EACH ROW EXECUTE PROCEDURE auto_generate_doctor_id();

-- =====================================================
-- ROW LEVEL SECURITY FOR DOCTORS
-- =====================================================

ALTER TABLE medical_doctors ENABLE ROW LEVEL SECURITY;

-- Allow public read access to verified doctors only
CREATE POLICY "Public read verified doctors" ON medical_doctors 
    FOR SELECT USING (verification_status = 'verified');

-- Allow doctors to read their own records
CREATE POLICY "Doctors read own records" ON medical_doctors 
    FOR SELECT USING (wallet_address = current_setting('jwt.claims.wallet_address', true));

-- Allow authenticated users to insert (registration)
CREATE POLICY "Allow doctor registration" ON medical_doctors 
    FOR INSERT WITH CHECK (true);

-- Allow doctors to update their own records
CREATE POLICY "Doctors update own records" ON medical_doctors 
    FOR UPDATE USING (wallet_address = current_setting('jwt.claims.wallet_address', true));

-- =====================================================
-- SAMPLE DATA - EMPTY (to be populated through UI)
-- =====================================================

-- No sample data - doctors will register through the UI

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View: Doctors with institution details
CREATE VIEW doctors_with_institutions AS
SELECT 
    d.id,
    d.name,
    d.medical_license_number,
    d.medical_specialty,
    d.department,
    d.wallet_address,
    d.verification_status,
    d.blockchain_registered,
    d.years_of_experience,
    i.name as institution_name,
    i.country as institution_country,
    i.license_number as institution_license,
    d.created_at
FROM medical_doctors d
JOIN medical_institutions i ON d.institution_id = i.id;

-- View: Verified doctors only
CREATE VIEW verified_doctors AS
SELECT * FROM medical_doctors 
WHERE verification_status = 'verified' AND blockchain_registered = true;

-- =====================================================
-- USEFUL QUERIES
-- =====================================================

-- Get doctors by institution
-- SELECT * FROM medical_doctors WHERE institution_id = 'mercy-general-sf';

-- Get doctors by specialty
-- SELECT * FROM medical_doctors WHERE medical_specialty LIKE '%Cardiology%';

-- Get doctor with institution details
-- SELECT * FROM doctors_with_institutions WHERE wallet_address = '0x99BD4BDD7A9c22E2a35F09A6Bd17f038D5E5eB87';

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE medical_doctors IS 'Medical doctors registered through MedicalCollaborationHub smart contract';
COMMENT ON COLUMN medical_doctors.id IS 'Auto-generated ID like dr-sarah-johnson-mercy';
COMMENT ON COLUMN medical_doctors.wallet_address IS 'Doctor wallet address - must be unique';
COMMENT ON COLUMN medical_doctors.institution_id IS 'References medical_institutions.id';
COMMENT ON COLUMN medical_doctors.transaction_hash IS 'Transaction hash from blockchain registration';
COMMENT ON COLUMN medical_doctors.blockchain_registered IS 'True only after successful blockchain transaction';
COMMENT ON COLUMN medical_doctors.stake_amount IS 'Amount staked on blockchain (0.0005 A0GI for doctors)';
COMMENT ON COLUMN medical_doctors.verification_status IS 'Auto-verified through blockchain staking mechanism';
COMMENT ON COLUMN medical_doctors.permissions IS 'JSON object defining doctor permissions and access levels';
