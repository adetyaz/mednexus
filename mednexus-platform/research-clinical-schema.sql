-- =====================================================
-- MEDNEXUS: Research & Clinical Trials Database Schema
-- For storing blockchain-created projects and trials
-- =====================================================

-- =====================================================
-- 1. RESEARCH PROJECTS TABLE
-- =====================================================
-- Stores research projects created on ResearchCollaborationHub contract
-- Links blockchain data with detailed metadata

CREATE TABLE IF NOT EXISTS research_projects (
    -- Primary identifiers
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blockchain_project_id BIGINT NOT NULL UNIQUE, -- Project ID from blockchain contract
    
    -- Basic project information
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    
    -- Blockchain details
    contract_address VARCHAR(42) NOT NULL, -- ResearchCollaborationHub contract address
    transaction_hash VARCHAR(66) NOT NULL, -- Creation transaction hash
    block_number BIGINT, -- Block number where project was created
    data_hash VARCHAR(66) NOT NULL, -- Data hash stored on blockchain
    
    -- Project lead (creator)
    lead_wallet_address VARCHAR(42) NOT NULL, -- Project creator's wallet
    lead_doctor_id VARCHAR(100), -- References medical_doctors.id (if registered doctor)
    lead_institution_id VARCHAR(100), -- References medical_institutions.id (if from registered institution)
    
    -- Project details
    research_field VARCHAR(255), -- e.g., 'Oncology', 'Cardiology', 'Neurology'
    project_type VARCHAR(100), -- e.g., 'Basic Research', 'Clinical Study', 'Literature Review'
    expected_results TEXT,
    methodology TEXT,
    
    -- Collaboration
    collaborating_institutions JSONB DEFAULT '[]'::jsonb, -- Array of institution IDs
    team_members JSONB DEFAULT '[]'::jsonb, -- Array of doctor wallet addresses
    external_partners JSONB DEFAULT '[]'::jsonb, -- Non-MedNexus partners
    
    -- Timeline and milestones
    start_date DATE,
    expected_end_date DATE,
    actual_end_date DATE,
    milestones JSONB DEFAULT '[]'::jsonb, -- Array of milestone objects
    
    -- Funding and resources
    funding_amount DECIMAL(20,8), -- Total funding amount
    funding_source VARCHAR(255), -- Funding organization
    required_resources TEXT,
    allocated_budget JSONB DEFAULT '{}'::jsonb, -- Budget breakdown
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'paused', 'cancelled'
    progress_percentage INTEGER DEFAULT 0, -- 0-100
    current_phase VARCHAR(100), -- Current research phase
    
    -- Compliance and approval
    ethics_approval_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    ethics_committee VARCHAR(255), -- Approving ethics committee
    regulatory_approvals JSONB DEFAULT '[]'::jsonb, -- Array of regulatory approvals
    
    -- Documentation and results
    research_documents JSONB DEFAULT '[]'::jsonb, -- Array of document IDs from medical_documents
    publications JSONB DEFAULT '[]'::jsonb, -- Published papers/results
    datasets JSONB DEFAULT '[]'::jsonb, -- Research datasets (0G Storage references)
    
    -- Visibility and sharing
    visibility VARCHAR(50) DEFAULT 'institutional', -- 'private', 'institutional', 'public', 'collaborative'
    shared_with_institutions JSONB DEFAULT '[]'::jsonb, -- Institutions with access
    
    -- Blockchain sync status
    blockchain_synced BOOLEAN DEFAULT TRUE,
    last_blockchain_sync TIMESTAMPTZ DEFAULT NOW(),
    sync_errors TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    blockchain_created_at TIMESTAMPTZ -- When created on blockchain
);

-- Indexes for research_projects
CREATE INDEX IF NOT EXISTS idx_research_blockchain_id ON research_projects(blockchain_project_id);
CREATE INDEX IF NOT EXISTS idx_research_lead_wallet ON research_projects(lead_wallet_address);
CREATE INDEX IF NOT EXISTS idx_research_lead_doctor ON research_projects(lead_doctor_id);
CREATE INDEX IF NOT EXISTS idx_research_lead_institution ON research_projects(lead_institution_id);
CREATE INDEX IF NOT EXISTS idx_research_status ON research_projects(status);
CREATE INDEX IF NOT EXISTS idx_research_field ON research_projects(research_field);
CREATE INDEX IF NOT EXISTS idx_research_type ON research_projects(project_type);
CREATE INDEX IF NOT EXISTS idx_research_tx_hash ON research_projects(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_research_created_at ON research_projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_visibility ON research_projects(visibility);

-- =====================================================
-- 2. CLINICAL TRIALS TABLE
-- =====================================================
-- Stores clinical trials created on ClinicalTrialHub contract
-- Links blockchain data with detailed trial metadata

CREATE TABLE IF NOT EXISTS clinical_trials (
    -- Primary identifiers
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blockchain_trial_id BIGINT NOT NULL UNIQUE, -- Trial ID from blockchain contract
    
    -- Basic trial information
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    
    -- Blockchain details
    contract_address VARCHAR(42) NOT NULL, -- ClinicalTrialHub contract address
    transaction_hash VARCHAR(66) NOT NULL, -- Creation transaction hash
    block_number BIGINT, -- Block number where trial was created
    data_hash VARCHAR(66) NOT NULL, -- Data hash stored on blockchain
    
    -- Trial sponsor (creator)
    sponsor_wallet_address VARCHAR(42) NOT NULL, -- Trial sponsor's wallet
    sponsor_doctor_id VARCHAR(100), -- References medical_doctors.id (if registered doctor)
    sponsor_institution_id VARCHAR(100), -- References medical_institutions.id (if from registered institution)
    
    -- Trial classification
    trial_phase VARCHAR(50), -- 'Preclinical', 'Phase I', 'Phase II', 'Phase III', 'Phase IV'
    trial_type VARCHAR(100), -- 'Interventional', 'Observational', 'Expanded Access'
    therapeutic_area VARCHAR(255), -- e.g., 'Oncology', 'Cardiology', 'Infectious Diseases'
    intervention_type VARCHAR(100), -- 'Drug', 'Device', 'Procedure', 'Behavioral'
    
    -- Study design
    study_design VARCHAR(100), -- 'Randomized', 'Non-randomized', 'Single-arm', 'Crossover'
    primary_endpoint TEXT,
    secondary_endpoints JSONB DEFAULT '[]'::jsonb,
    inclusion_criteria TEXT,
    exclusion_criteria TEXT,
    
    -- Participant information
    target_enrollment INTEGER,
    current_enrollment INTEGER DEFAULT 0,
    age_range VARCHAR(50), -- e.g., '18-65 years'
    gender_criteria VARCHAR(50), -- 'All', 'Male', 'Female'
    
    -- Timeline
    enrollment_start_date DATE,
    enrollment_end_date DATE,
    study_start_date DATE,
    estimated_completion_date DATE,
    actual_completion_date DATE,
    
    -- Locations and investigators
    principal_investigator VARCHAR(255),
    co_investigators JSONB DEFAULT '[]'::jsonb, -- Array of investigator objects
    study_locations JSONB DEFAULT '[]'::jsonb, -- Array of location objects
    collaborating_sites JSONB DEFAULT '[]'::jsonb, -- Multi-site trial locations
    
    -- Regulatory and compliance
    protocol_number VARCHAR(100),
    irb_approval_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    fda_ind_number VARCHAR(50), -- If applicable
    clinical_trial_registry VARCHAR(100), -- ClinicalTrials.gov identifier
    regulatory_submissions JSONB DEFAULT '[]'::jsonb,
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'recruiting', -- 'recruiting', 'active', 'completed', 'terminated', 'suspended'
    recruitment_status VARCHAR(50) DEFAULT 'not_started', -- 'not_started', 'recruiting', 'completed'
    completion_percentage INTEGER DEFAULT 0,
    
    -- Safety and monitoring
    adverse_events_count INTEGER DEFAULT 0,
    serious_adverse_events_count INTEGER DEFAULT 0,
    data_safety_monitoring_board BOOLEAN DEFAULT FALSE,
    interim_analyses JSONB DEFAULT '[]'::jsonb,
    
    -- Results and outcomes
    primary_outcome_achieved BOOLEAN,
    efficacy_results JSONB DEFAULT '{}'::jsonb,
    safety_results JSONB DEFAULT '{}'::jsonb,
    trial_documents JSONB DEFAULT '[]'::jsonb, -- References to medical_documents
    
    -- Funding and resources
    funding_source VARCHAR(255),
    total_budget DECIMAL(20,8),
    budget_allocation JSONB DEFAULT '{}'::jsonb,
    sponsor_organization VARCHAR(255),
    
    -- Publication and dissemination
    publications JSONB DEFAULT '[]'::jsonb,
    conference_presentations JSONB DEFAULT '[]'::jsonb,
    data_sharing_plan TEXT,
    
    -- Visibility and sharing
    visibility VARCHAR(50) DEFAULT 'institutional', -- 'private', 'institutional', 'public', 'regulatory'
    shared_with_institutions JSONB DEFAULT '[]'::jsonb,
    public_summary TEXT, -- Public-facing trial summary
    
    -- Blockchain sync status
    blockchain_synced BOOLEAN DEFAULT TRUE,
    last_blockchain_sync TIMESTAMPTZ DEFAULT NOW(),
    sync_errors TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    blockchain_created_at TIMESTAMPTZ -- When created on blockchain
);

-- Indexes for clinical_trials
CREATE INDEX IF NOT EXISTS idx_trials_blockchain_id ON clinical_trials(blockchain_trial_id);
CREATE INDEX IF NOT EXISTS idx_trials_sponsor_wallet ON clinical_trials(sponsor_wallet_address);
CREATE INDEX IF NOT EXISTS idx_trials_sponsor_doctor ON clinical_trials(sponsor_doctor_id);
CREATE INDEX IF NOT EXISTS idx_trials_sponsor_institution ON clinical_trials(sponsor_institution_id);
CREATE INDEX IF NOT EXISTS idx_trials_status ON clinical_trials(status);
CREATE INDEX IF NOT EXISTS idx_trials_phase ON clinical_trials(trial_phase);
CREATE INDEX IF NOT EXISTS idx_trials_type ON clinical_trials(trial_type);
CREATE INDEX IF NOT EXISTS idx_trials_therapeutic_area ON clinical_trials(therapeutic_area);
CREATE INDEX IF NOT EXISTS idx_trials_tx_hash ON clinical_trials(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_trials_created_at ON clinical_trials(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trials_recruitment ON clinical_trials(recruitment_status);
CREATE INDEX IF NOT EXISTS idx_trials_visibility ON clinical_trials(visibility);

-- =====================================================
-- 3. PROJECT COLLABORATION TABLE
-- =====================================================
-- Tracks collaboration between institutions on research projects

CREATE TABLE IF NOT EXISTS project_collaborations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
    
    -- Collaboration details
    collaborator_institution_id VARCHAR(100) NOT NULL REFERENCES medical_institutions(id) ON DELETE CASCADE,
    collaborator_type VARCHAR(50) NOT NULL, -- 'co_investigator', 'data_provider', 'resource_provider', 'advisor'
    
    -- Collaboration terms
    contribution_type VARCHAR(100), -- 'data', 'funding', 'expertise', 'infrastructure'
    contribution_details TEXT,
    access_level VARCHAR(50) DEFAULT 'read_only', -- 'read_only', 'contribute', 'full_access'
    
    -- Status
    collaboration_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'active', 'completed', 'terminated'
    agreed_terms TEXT,
    
    -- Timeline
    collaboration_start_date DATE,
    collaboration_end_date DATE,
    
    -- Contact
    primary_contact_doctor_id VARCHAR(100) REFERENCES medical_doctors(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for project_collaborations
CREATE INDEX IF NOT EXISTS idx_collab_project ON project_collaborations(project_id);
CREATE INDEX IF NOT EXISTS idx_collab_institution ON project_collaborations(collaborator_institution_id);
CREATE INDEX IF NOT EXISTS idx_collab_status ON project_collaborations(collaboration_status);
CREATE INDEX IF NOT EXISTS idx_collab_type ON project_collaborations(collaborator_type);

-- =====================================================
-- 4. TRIAL PARTICIPATION TABLE
-- =====================================================
-- Tracks institutional participation in clinical trials

CREATE TABLE IF NOT EXISTS trial_participations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trial_id UUID NOT NULL REFERENCES clinical_trials(id) ON DELETE CASCADE,
    
    -- Participation details
    participating_institution_id VARCHAR(100) NOT NULL REFERENCES medical_institutions(id) ON DELETE CASCADE,
    participation_role VARCHAR(50) NOT NULL, -- 'coordinating_center', 'site', 'data_center', 'laboratory'
    
    -- Site information (if institution is a trial site)
    site_number INTEGER,
    site_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'active', 'completed', 'closed'
    target_enrollment_site INTEGER,
    actual_enrollment_site INTEGER DEFAULT 0,
    
    -- Investigators at this site
    principal_investigator_id VARCHAR(100) REFERENCES medical_doctors(id),
    co_investigators JSONB DEFAULT '[]'::jsonb, -- Array of doctor IDs
    
    -- Regulatory status for this site
    irb_approval_status VARCHAR(50) DEFAULT 'pending',
    irb_approval_date DATE,
    site_initiation_date DATE,
    
    -- Timeline
    participation_start_date DATE,
    participation_end_date DATE,
    
    -- Performance metrics
    enrollment_rate DECIMAL(5,2), -- Percentage of target reached
    protocol_deviations INTEGER DEFAULT 0,
    data_quality_score DECIMAL(5,2), -- 0-100 quality score
    
    -- Status
    participation_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'active', 'completed', 'terminated'
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for trial_participations
CREATE INDEX IF NOT EXISTS idx_trial_part_trial ON trial_participations(trial_id);
CREATE INDEX IF NOT EXISTS idx_trial_part_institution ON trial_participations(participating_institution_id);
CREATE INDEX IF NOT EXISTS idx_trial_part_status ON trial_participations(participation_status);
CREATE INDEX IF NOT EXISTS idx_trial_part_pi ON trial_participations(principal_investigator_id);

-- =====================================================
-- 5. RESEARCH DATA SHARING TABLE
-- =====================================================
-- Tracks sharing of research data between projects and institutions

CREATE TABLE IF NOT EXISTS research_data_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Source information
    source_type VARCHAR(50) NOT NULL, -- 'research_project', 'clinical_trial'
    source_project_id UUID REFERENCES research_projects(id) ON DELETE CASCADE,
    source_trial_id UUID REFERENCES clinical_trials(id) ON DELETE CASCADE,
    
    -- Data being shared
    data_type VARCHAR(100) NOT NULL, -- 'dataset', 'results', 'protocol', 'documents'
    document_ids JSONB DEFAULT '[]'::jsonb, -- References to medical_documents
    data_description TEXT,
    
    -- Sharing details
    shared_with_institution_id VARCHAR(100) NOT NULL REFERENCES medical_institutions(id) ON DELETE CASCADE,
    shared_by_doctor_id VARCHAR(100) REFERENCES medical_doctors(id),
    sharing_purpose TEXT,
    
    -- Access control
    access_permissions JSONB DEFAULT '{
        "can_view": true,
        "can_download": false,
        "can_analyze": false,
        "can_publish": false,
        "can_reshare": false
    }'::jsonb,
    
    -- Compliance
    data_use_agreement TEXT,
    anonymization_level VARCHAR(50), -- 'identified', 'de_identified', 'anonymous'
    compliance_requirements JSONB DEFAULT '[]'::jsonb,
    
    -- Status
    sharing_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'active', 'expired', 'revoked'
    approval_required BOOLEAN DEFAULT TRUE,
    approved_by_doctor_id VARCHAR(100) REFERENCES medical_doctors(id),
    approval_date TIMESTAMPTZ,
    
    -- Timeline
    access_start_date DATE,
    access_end_date DATE,
    
    -- Usage tracking
    times_accessed INTEGER DEFAULT 0,
    last_accessed TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for research_data_shares
CREATE INDEX IF NOT EXISTS idx_data_share_source_project ON research_data_shares(source_project_id);
CREATE INDEX IF NOT EXISTS idx_data_share_source_trial ON research_data_shares(source_trial_id);
CREATE INDEX IF NOT EXISTS idx_data_share_institution ON research_data_shares(shared_with_institution_id);
CREATE INDEX IF NOT EXISTS idx_data_share_status ON research_data_shares(sharing_status);
CREATE INDEX IF NOT EXISTS idx_data_share_type ON research_data_shares(data_type);

-- =====================================================
-- 6. TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- =====================================================

-- Research Projects
CREATE OR REPLACE FUNCTION update_research_projects_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_research_projects_timestamp
    BEFORE UPDATE ON research_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_research_projects_timestamp();

-- Clinical Trials
CREATE OR REPLACE FUNCTION update_clinical_trials_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_clinical_trials_timestamp
    BEFORE UPDATE ON clinical_trials
    FOR EACH ROW
    EXECUTE FUNCTION update_clinical_trials_timestamp();

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE research_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_trials ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_data_shares ENABLE ROW LEVEL SECURITY;

-- Research Projects RLS Policies
CREATE POLICY "research_projects_visibility" ON research_projects
    FOR SELECT USING (
        visibility = 'public' OR 
        lead_institution_id = auth.jwt() ->> 'institution_id' OR
        lead_wallet_address = auth.jwt() ->> 'wallet_address' OR
        auth.jwt() ->> 'institution_id' = ANY(SELECT jsonb_array_elements_text(shared_with_institutions))
    );

CREATE POLICY "research_projects_insert" ON research_projects
    FOR INSERT WITH CHECK (
        lead_wallet_address = auth.jwt() ->> 'wallet_address'
    );

CREATE POLICY "research_projects_update" ON research_projects
    FOR UPDATE USING (
        lead_wallet_address = auth.jwt() ->> 'wallet_address' OR
        lead_institution_id = auth.jwt() ->> 'institution_id'
    );

-- Clinical Trials RLS Policies
CREATE POLICY "clinical_trials_visibility" ON clinical_trials
    FOR SELECT USING (
        visibility = 'public' OR 
        sponsor_institution_id = auth.jwt() ->> 'institution_id' OR
        sponsor_wallet_address = auth.jwt() ->> 'wallet_address' OR
        auth.jwt() ->> 'institution_id' = ANY(SELECT jsonb_array_elements_text(shared_with_institutions))
    );

CREATE POLICY "clinical_trials_insert" ON clinical_trials
    FOR INSERT WITH CHECK (
        sponsor_wallet_address = auth.jwt() ->> 'wallet_address'
    );

CREATE POLICY "clinical_trials_update" ON clinical_trials
    FOR UPDATE USING (
        sponsor_wallet_address = auth.jwt() ->> 'wallet_address' OR
        sponsor_institution_id = auth.jwt() ->> 'institution_id'
    );

-- =====================================================
-- SCHEMA COMPLETE
-- Ready for Research & Clinical Trial Implementation
-- =====================================================