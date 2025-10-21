create table public.medical_institutions (
  id character varying(100) not null,
  name character varying(255) not null,
  country character varying(100) not null,
  address text null,
  license_number character varying(100) not null,
  license_prefix character varying(10) null,
  accreditation text null,
  phone character varying(50) null,
  email character varying(255) null,
  emergency_contact character varying(50) null,
  wallet_address character varying(42) null,
  transaction_hash character varying(66) null,
  blockchain_registered boolean null default false,
  verified_by character varying(42) null,
  verification_date timestamp with time zone null,
  departments jsonb null default '[]'::jsonb,
  region character varying(50) null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint medical_institutions_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_institutions_license_prefix on public.medical_institutions using btree (license_prefix) TABLESPACE pg_default;

create index IF not exists idx_institutions_country on public.medical_institutions using btree (country) TABLESPACE pg_default;

create index IF not exists idx_institutions_wallet on public.medical_institutions using btree (wallet_address) TABLESPACE pg_default;

create index IF not exists idx_institutions_blockchain on public.medical_institutions using btree (blockchain_registered) TABLESPACE pg_default;

create trigger update_institutions_updated_at BEFORE
update on medical_institutions for EACH row
execute FUNCTION update_updated_at_column ();

create trigger auto_license_prefix BEFORE INSERT
or
update on medical_institutions for EACH row
execute FUNCTION auto_extract_license_prefix ();

-- ============================================================================
-- WAVE 4: CLINICAL TRIALS TABLES
-- ============================================================================

-- Clinical Trials Table
create table public.clinical_trials (
  trial_id character varying(100) not null,
  protocol_number character varying(50) not null unique,
  title text not null,
  short_title text null,
  phase character varying(20) not null check (phase in ('phase_1', 'phase_2', 'phase_3', 'phase_4')),
  status character varying(20) not null default 'planning' check (status in ('planning', 'recruiting', 'active', 'completed', 'suspended', 'terminated')),
  
  -- Medical details
  condition text not null,
  intervention jsonb not null, -- {type, name, description}
  objectives text null,
  
  -- Principal Investigator
  principal_investigator jsonb not null, -- {name, institution, credentials, walletAddress}
  
  -- Sponsor
  sponsor jsonb null, -- {name, institutionId, contactPerson, email}
  
  -- Eligibility criteria
  eligibility jsonb not null, -- {minAge, maxAge, gender, inclusionCriteria, exclusionCriteria, requiredDiagnoses}
  
  -- Trial design
  design jsonb null, -- {studyType, allocation, primaryPurpose, masking, enrollmentTarget, numberOfArms}
  
  -- Timeline
  timeline jsonb not null, -- {startDate, estimatedCompletionDate, primaryCompletionDate}
  
  -- Outcomes
  outcomes jsonb null, -- {primary, secondary, safetyMeasures}
  
  -- Enrollment stats
  enrollment jsonb not null default '{"total": 0, "screened": 0, "randomized": 0, "completed": 0, "withdrawn": 0, "currentByCountry": {}}'::jsonb,
  
  -- Blockchain
  blockchain jsonb null, -- {protocolHash, ethicsApprovalHashes, verified}
  
  -- Regulatory
  regulatory jsonb null, -- {irbApproved, dataMonitoringCommittee, localApprovals}
  
  -- Funding
  funding jsonb not null, -- {totalBudget, currency, source, perPatientCost}
  
  -- Metadata
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  
  constraint clinical_trials_pkey primary key (trial_id)
) TABLESPACE pg_default;

-- Trial Sites Table (many-to-one with clinical_trials)
create table public.trial_sites (
  site_id character varying(100) not null,
  trial_id character varying(100) not null,
  institution_id character varying(100) null,
  institution_name text not null,
  location text not null,
  country character varying(100) not null,
  principal_investigator text not null,
  status character varying(20) not null default 'pending' check (status in ('pending', 'active', 'suspended', 'closed')),
  
  -- Enrollment
  enrollment_target integer not null,
  current_enrollment integer not null default 0,
  
  -- Contact info
  contact_info jsonb not null, -- {email, phone, address}
  
  -- IRB approval
  irb_approval jsonb not null, -- {approved, approvalDate, expirationDate, irbName, protocolNumber}
  
  -- Metadata
  last_updated timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now(),
  
  constraint trial_sites_pkey primary key (site_id),
  constraint trial_sites_trial_fkey foreign key (trial_id) references clinical_trials(trial_id) on delete cascade
) TABLESPACE pg_default;

-- Indexes for clinical_trials
create index idx_trials_protocol_number on public.clinical_trials using btree (protocol_number) TABLESPACE pg_default;
create index idx_trials_status on public.clinical_trials using btree (status) TABLESPACE pg_default;
create index idx_trials_phase on public.clinical_trials using btree (phase) TABLESPACE pg_default;
create index idx_trials_condition on public.clinical_trials using btree (condition) TABLESPACE pg_default;

-- Indexes for trial_sites
create index idx_trial_sites_trial_id on public.trial_sites using btree (trial_id) TABLESPACE pg_default;
create index idx_trial_sites_status on public.trial_sites using btree (status) TABLESPACE pg_default;
create index idx_trial_sites_country on public.trial_sites using btree (country) TABLESPACE pg_default;

-- Trigger to update updated_at
create trigger update_clinical_trials_updated_at BEFORE update on clinical_trials for each row execute function update_updated_at_column();

-- ============================================================================
-- WAVE 4: RESEARCH COLLABORATION TABLES
-- ============================================================================

-- Research Collaborations Table
create table public.research_collaborations (
  collaboration_id character varying(100) not null,
  title text not null,
  type character varying(50) not null check (type in ('observational_study', 'registry_study', 'meta_analysis', 'systematic_review', 'case_series')),
  status character varying(20) not null default 'planning' check (status in ('planning', 'ethics_review', 'active', 'analysis', 'publication', 'completed')),
  
  -- Research details
  research_question text not null,
  objectives text[] not null,
  methodology text not null,
  
  -- Lead Institution
  lead_institution jsonb not null, -- {institutionId, institutionName, country, piWallet, piName}
  
  -- Collaborating Institutions
  collaborating_institutions jsonb not null default '[]'::jsonb,
  
  -- Timeline
  timeline jsonb not null, -- {startDate, estimatedCompletionDate, ethicsSubmissionDate}
  
  -- Funding
  funding jsonb not null, -- {totalBudget, currency, sources}
  
  -- Data sharing
  data_sharing jsonb not null default '{"policy": "restricted", "embargoUntil": null, "dataAvailability": "upon_request"}'::jsonb,
  
  -- Blockchain
  blockchain jsonb null, -- {protocolHash, ethicsHashes, publicationDOIs}
  
  -- Metadata
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  
  constraint research_collaborations_pkey primary key (collaboration_id)
) TABLESPACE pg_default;

-- Research Datasets Table
create table public.research_datasets (
  dataset_id character varying(100) not null,
  collaboration_id character varying(100) not null,
  name text not null,
  description text not null,
  data_type character varying(50) not null,
  
  -- Storage info
  storage jsonb not null, -- {storageLocation, size, format, accessLevel}
  
  -- Quality metrics
  completeness decimal not null default 0,
  quality_score decimal not null default 0,
  
  -- Metadata
  uploaded_at timestamp with time zone not null default now(),
  
  constraint research_datasets_pkey primary key (dataset_id),
  constraint research_datasets_collaboration_fkey foreign key (collaboration_id) references research_collaborations(collaboration_id) on delete cascade
) TABLESPACE pg_default;

-- Ethics Approvals Table
create table public.ethics_approvals (
  approval_id character varying(100) not null,
  collaboration_id character varying(100) not null,
  committee_name text not null,
  institution_id character varying(100) not null,
  
  -- Approval details
  approval_number text not null,
  approval_date timestamp with time zone not null,
  expiration_date timestamp with time zone not null,
  status character varying(20) not null check (status in ('pending', 'approved', 'conditional', 'rejected', 'expired')),
  
  -- Documents
  documents jsonb not null default '[]'::jsonb,
  
  -- Conditions
  conditions text[] null,
  
  -- Metadata
  created_at timestamp with time zone not null default now(),
  
  constraint ethics_approvals_pkey primary key (approval_id),
  constraint ethics_approvals_collaboration_fkey foreign key (collaboration_id) references research_collaborations(collaboration_id) on delete cascade
) TABLESPACE pg_default;

-- Research Publications Table
create table public.research_publications (
  publication_id character varying(100) not null,
  collaboration_id character varying(100) null,
  title text not null,
  authors jsonb not null, -- Array of {name, affiliation, contributorRole}
  
  -- Publication details
  journal text not null,
  doi text null unique,
  publication_date timestamp with time zone not null,
  status character varying(20) not null check (status in ('draft', 'submitted', 'under_review', 'accepted', 'published', 'rejected')),
  
  -- Metrics
  citations integer not null default 0,
  impact_factor decimal null,
  
  -- Blockchain
  blockchain jsonb null, -- {publicationHash, peerReviewHashes}
  
  -- Metadata
  created_at timestamp with time zone not null default now(),
  
  constraint research_publications_pkey primary key (publication_id),
  constraint research_publications_collaboration_fkey foreign key (collaboration_id) references research_collaborations(collaboration_id) on delete set null
) TABLESPACE pg_default;

-- Indexes for research_collaborations
create index idx_research_collaborations_type on public.research_collaborations using btree (type) TABLESPACE pg_default;
create index idx_research_collaborations_status on public.research_collaborations using btree (status) TABLESPACE pg_default;

-- Indexes for research_datasets
create index idx_research_datasets_collaboration_id on public.research_datasets using btree (collaboration_id) TABLESPACE pg_default;

-- Indexes for ethics_approvals
create index idx_ethics_approvals_collaboration_id on public.ethics_approvals using btree (collaboration_id) TABLESPACE pg_default;
create index idx_ethics_approvals_status on public.ethics_approvals using btree (status) TABLESPACE pg_default;

-- Indexes for research_publications
create index idx_research_publications_collaboration_id on public.research_publications using btree (collaboration_id) TABLESPACE pg_default;
create index idx_research_publications_doi on public.research_publications using btree (doi) TABLESPACE pg_default;

-- Triggers
create trigger update_research_collaborations_updated_at BEFORE update on research_collaborations for each row execute function update_updated_at_column();

-- ============================================================================
-- WAVE 5: INNOVATION MARKETPLACE TABLES
-- ============================================================================

-- Patents Table
create table public.patents (
  patent_id character varying(100) not null,
  title text not null,
  innovation_type character varying(50) not null check (innovation_type in ('drug', 'device', 'diagnostic', 'software', 'process', 'composition')),
  
  -- Innovation details
  innovation jsonb not null, -- {type, category, description, technicalDetails, advantages}
  
  -- Inventors
  inventors jsonb not null, -- Array of {name, affiliation, contributorRole}
  
  -- Owner
  owner jsonb not null, -- {institutionId, institutionName, department, contactEmail}
  
  -- Filing details
  filing jsonb not null, -- {status, filingDate, grantDate, jurisdictions, applicationNumber, patentNumber}
  
  -- Commercial details
  commercial jsonb not null, -- {readinessLevel, marketPotential, targetMarkets, competitorAnalysis, valuationEstimate}
  
  -- Prior art
  prior_art jsonb not null default '{"searchConducted": false, "references": []}'::jsonb,
  
  -- Licensing terms
  licensing jsonb not null default '{"available": false, "terms": "negotiable", "exclusivity": "non_exclusive", "royaltyRate": 0}'::jsonb,
  
  -- Blockchain
  blockchain jsonb null, -- {ipHash, filingHash, verified}
  
  -- Metadata
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  
  constraint patents_pkey primary key (patent_id)
) TABLESPACE pg_default;

-- Licensing Agreements Table
create table public.licensing_agreements (
  agreement_id character varying(100) not null,
  patent_id character varying(100) not null,
  
  -- Parties
  licensor jsonb not null, -- {institutionId, institutionName, representative, walletAddress}
  licensee jsonb not null, -- {name, type, representative, walletAddress}
  
  -- Agreement terms
  terms jsonb not null, -- {exclusivity, territory, field, duration, extensionOptions}
  
  -- Financial terms
  financial jsonb not null, -- {upfrontFee, royaltyRate, minimumRoyalty, milestonePayments, totalRevenueGenerated}
  
  -- Status
  status character varying(20) not null check (status in ('negotiation', 'active', 'suspended', 'terminated', 'expired')),
  
  -- Dates
  effective_date timestamp with time zone not null,
  expiration_date timestamp with time zone not null,
  
  -- Compliance
  compliance jsonb not null default '{"lastAudit": null, "nextAudit": null, "reportingSchedule": "quarterly"}'::jsonb,
  
  -- Blockchain
  blockchain jsonb null, -- {agreementHash, paymentHashes}
  
  -- Metadata
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  
  constraint licensing_agreements_pkey primary key (agreement_id),
  constraint licensing_agreements_patent_fkey foreign key (patent_id) references patents(patent_id) on delete cascade
) TABLESPACE pg_default;

-- Drug Discovery Projects Table
create table public.drug_discovery_projects (
  project_id character varying(100) not null,
  name text not null,
  therapeutic_area character varying(100) not null,
  status character varying(20) not null check (status in ('target_identification', 'lead_discovery', 'lead_optimization', 'preclinical', 'clinical', 'approved', 'discontinued')),
  
  -- Target details
  target jsonb not null, -- {name, type, description, validation, therapeuticHypothesis}
  
  -- Lead institution
  lead_institution jsonb not null, -- {institutionId, institutionName, department, piName}
  
  -- Collaborators
  collaborators jsonb not null default '[]'::jsonb,
  
  -- Funding
  funding jsonb not null, -- {totalBudget, currency, sources, grantNumbers}
  
  -- Timeline
  timeline jsonb not null, -- {startDate, currentPhase, estimatedCompletion, milestones}
  
  -- Compounds
  compounds_count integer not null default 0,
  
  -- Blockchain
  blockchain jsonb null, -- {projectHash, dataHashes}
  
  -- Metadata
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  
  constraint drug_discovery_projects_pkey primary key (project_id)
) TABLESPACE pg_default;

-- Drug Compounds Table
create table public.drug_compounds (
  compound_id character varying(100) not null,
  project_id character varying(100) not null,
  name text not null,
  chemical_name text not null,
  
  -- Chemical properties
  properties jsonb not null, -- {molecularWeight, formula, structure, smiles, inchi}
  
  -- Development stage
  development jsonb not null, -- {stage, startDate, leadOptimization, syntheticRoute}
  
  -- Efficacy data
  efficacy jsonb not null default '{"invitro": [], "invivo": [], "clinicalTrials": []}'::jsonb,
  
  -- Safety profile
  safety jsonb not null default '{"toxicology": [], "adverseEvents": [], "contraindications": []}'::jsonb,
  
  -- Pharmacology
  pharmacology jsonb not null default '{"absorption": null, "distribution": null, "metabolism": null, "excretion": null, "mechanism": ""}'::jsonb,
  
  -- IP status
  ip_status jsonb not null default '{"patentProtection": false, "patentId": null, "filingStatus": "none"}'::jsonb,
  
  -- Blockchain
  blockchain jsonb null, -- {compoundHash, dataHashes}
  
  -- Metadata
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  
  constraint drug_compounds_pkey primary key (compound_id),
  constraint drug_compounds_project_fkey foreign key (project_id) references drug_discovery_projects(project_id) on delete cascade
) TABLESPACE pg_default;

-- Indexes for patents
create index idx_patents_innovation_type on public.patents using btree (innovation_type) TABLESPACE pg_default;
create index idx_patents_filing_status on public.patents using btree ((filing->>'status')) TABLESPACE pg_default;

-- Indexes for licensing_agreements
create index idx_licensing_agreements_patent_id on public.licensing_agreements using btree (patent_id) TABLESPACE pg_default;
create index idx_licensing_agreements_status on public.licensing_agreements using btree (status) TABLESPACE pg_default;

-- Indexes for drug_discovery_projects
create index idx_drug_discovery_projects_status on public.drug_discovery_projects using btree (status) TABLESPACE pg_default;
create index idx_drug_discovery_projects_therapeutic_area on public.drug_discovery_projects using btree (therapeutic_area) TABLESPACE pg_default;

-- Indexes for drug_compounds
create index idx_drug_compounds_project_id on public.drug_compounds using btree (project_id) TABLESPACE pg_default;
create index idx_drug_compounds_development_stage on public.drug_compounds using btree ((development->>'stage')) TABLESPACE pg_default;

-- Triggers
create trigger update_patents_updated_at BEFORE update on patents for each row execute function update_updated_at_column();
create trigger update_licensing_agreements_updated_at BEFORE update on licensing_agreements for each row execute function update_updated_at_column();
create trigger update_drug_discovery_projects_updated_at BEFORE update on drug_discovery_projects for each row execute function update_updated_at_column();
create trigger update_drug_compounds_updated_at BEFORE update on drug_compounds for each row execute function update_updated_at_column();