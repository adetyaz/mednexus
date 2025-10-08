-- =====================================================
-- MEDNEXUS: Medical Doctors Schema
-- Integrates with MedicalCollaborationHub smart contract
-- Doctors must be registered through blockchain-first process
-- =====================================================

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
    institution_id VARCHAR(100) NOT NULL, -- References medical_institutions.id
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
    verification_status VARCHAR(20) DEFAULT 'pending', -- pending, verified, rejected
    
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
    
    -- Activity tracking
    last_activity TIMESTAMPTZ,
    consultation_count INTEGER DEFAULT 0,
    reputation_score INTEGER DEFAULT 100,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign key constraint
    CONSTRAINT fk_institution FOREIGN KEY (institution_id) REFERENCES medical_institutions(id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_doctors_wallet ON medical_doctors(wallet_address);
CREATE INDEX idx_doctors_institution ON medical_doctors(institution_id);
CREATE INDEX idx_doctors_license_prefix ON medical_doctors(license_prefix);
CREATE INDEX idx_doctors_specialty ON medical_doctors(medical_specialty);
CREATE INDEX idx_doctors_department ON medical_doctors(department);
CREATE INDEX idx_doctors_blockchain ON medical_doctors(blockchain_registered);
CREATE INDEX idx_doctors_verification ON medical_doctors(verification_status);

-- =====================================================
-- AUTO-UPDATE TIMESTAMPS
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
    -- US-MD-123456 -> US-MD
    -- UK-GMC-98765 -> UK-GMC
    
    IF license_number ~ '^[A-Z]{2,3}-[A-Z]{2,4}-' THEN
        RETURN SUBSTRING(license_number FROM '^([A-Z]{2,3}-[A-Z]{2,4})');
    ELSE
        -- Fallback: take first two parts
        RETURN SPLIT_PART(license_number, '-', 1) || '-' || SPLIT_PART(license_number, '-', 2);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER TO AUTO-EXTRACT LICENSE PREFIX
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
BEGIN
    -- Clean and format doctor name
    base_name := LOWER(TRIM(doctor_name));
    base_name := REGEXP_REPLACE(base_name, '[^a-z0-9\s]', '', 'g'); -- Remove special chars
    base_name := REGEXP_REPLACE(base_name, '\s+', '-', 'g'); -- Replace spaces with hyphens
    base_name := REGEXP_REPLACE(base_name, '^dr-?', ''); -- Remove dr prefix
    
    -- Get institution suffix (first part of institution_id)
    institution_suffix := SPLIT_PART(institution_id, '-', 1);
    
    -- Construct final ID
    final_id := 'dr-' || base_name || '-' || institution_suffix;
    
    -- Ensure uniqueness by appending number if needed
    WHILE EXISTS (SELECT 1 FROM medical_doctors WHERE id = final_id) LOOP
        final_id := final_id || '-' || FLOOR(RANDOM() * 1000)::TEXT;
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
-- ROW LEVEL SECURITY
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

-- Allow institution admins to update doctors in their institution
CREATE POLICY "Institution admins update doctors" ON medical_doctors 
    FOR UPDATE USING (
        institution_wallet = current_setting('jwt.claims.wallet_address', true)
    );

-- =====================================================
-- USEFUL QUERIES
-- =====================================================

-- Get doctors by institution
-- SELECT * FROM medical_doctors WHERE institution_id = 'mercy-general-sf';

-- Get doctors by specialty
-- SELECT * FROM medical_doctors WHERE medical_specialty LIKE '%Cardiology%';

-- Get blockchain-registered doctors
-- SELECT * FROM medical_doctors WHERE blockchain_registered = true;

-- Get doctors pending verification
-- SELECT * FROM medical_doctors WHERE verification_status = 'pending';

-- Get doctor with institution details
-- SELECT d.*, i.name as institution_name, i.country as institution_country
-- FROM medical_doctors d
-- JOIN medical_institutions i ON d.institution_id = i.id
-- WHERE d.wallet_address = '0x99BD4BDD7A9c22E2a35F09A6Bd17f038D5E5eB87';

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
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE medical_doctors IS 'Medical doctors registered through blockchain-first process';
COMMENT ON COLUMN medical_doctors.id IS 'Auto-generated ID like dr-sarah-johnson-mercy';
COMMENT ON COLUMN medical_doctors.wallet_address IS 'Doctor wallet address - must be unique';
COMMENT ON COLUMN medical_doctors.institution_id IS 'References medical_institutions.id';
COMMENT ON COLUMN medical_doctors.transaction_hash IS 'Transaction hash from blockchain registration';
COMMENT ON COLUMN medical_doctors.blockchain_registered IS 'True only after successful blockchain transaction';
COMMENT ON COLUMN medical_doctors.stake_amount IS 'Amount staked on blockchain (0.0005 A0GI for doctors)';
COMMENT ON COLUMN medical_doctors.permissions IS 'JSON object defining doctor permissions and access levels';