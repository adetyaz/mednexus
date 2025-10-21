/**
 * Research Coordination Service (Wave 4)
 * Handles multi-institutional research collaboration, automated ethics approval
 * coordination, research protocol development, and outcome publication
 * 
 * Builds on:
 * - Wave 2: Cross-border infrastructure, institutional verification
 * - Wave 3: AI pattern matching, global case discovery
 * - Wave 4: Clinical trial coordination
 */

import { browser } from '$app/environment';
import { ethers } from 'ethers';
import type { ClinicalTrial, ResearchProtocol } from './clinicalTrialService';
import { supabase } from '$lib/supabase';

/**
 * Research Collaboration Network
 */
export interface ResearchCollaboration {
	collaborationId: string;
	title: string;
	type: 'observational_study' | 'systematic_review' | 'meta_analysis' | 'registry_study' | 'case_series';
	status: 'planning' | 'ethics_review' | 'active' | 'analysis' | 'publication' | 'completed';
	
	// Participating institutions
	leadInstitution: {
		institutionId: string;
		institutionName: string;
		country: string;
		piWallet: string;
		piName: string;
	};
	
	collaboratingInstitutions: {
		institutionId: string;
		institutionName: string;
		country: string;
		localPIName: string;
		role: 'data_contributor' | 'co_investigator' | 'advisory' | 'sponsor';
		dataSharing: boolean;
		fundingContribution?: number;
	}[];
	
	// Research focus
	researchQuestion: string;
	hypothesis: string;
	primaryObjectives: string[];
	secondaryObjectives: string[];
	specialty: string;
	keywords: string[];
	
	// Methodology
	protocol: ResearchProtocol;
	
	// Ethics & Regulatory
	ethics: {
		centralEthicsApproval?: EthicsCommitteeApproval;
		siteSpecificApprovals: Map<string, EthicsCommitteeApproval>;
		dataProtectionAssessment: boolean;
		conflictOfInterestDeclared: boolean;
	};
	
	// Data & Results
	dataCollection: {
		targetSampleSize: number;
		currentSampleSize: number;
		dataCollectionStart?: Date;
		dataCollectionEnd?: Date;
		dataQualityScore: number; // 0-100
		missingDataPercentage: number;
	};
	
	results: {
		analysisCompleted: boolean;
		primaryEndpointsMet: boolean;
		manuscriptDrafted: boolean;
		peerReviewed: boolean;
		published: boolean;
		publicationDOI?: string;
	};
	
	// Blockchain verification
	blockchain: {
		protocolHash: string;
		registrationTxHash?: string;
		dataProvenanceHashes: string[];
		publicationHash?: string;
	};
	
	// Timeline
	timeline: {
		protocolDevelopment: Date;
		ethicsSubmission: Date;
		dataCollectionStart: Date;
		analysisStart: Date;
		publicationTarget: Date;
	};
	
	// Funding
	funding: {
		totalBudget: number;
		currency: string;
		sources: {
			source: string;
			amount: number;
			type: 'grant' | 'industry' | 'institutional' | 'philanthropic';
		}[];
	};
	
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Ethics Committee Approval
 */
export interface EthicsCommitteeApproval {
	approvalId: string;
	committee: {
		name: string;
		institution: string;
		country: string;
		registrationNumber: string;
		chairperson?: string;
	};
	
	submission: {
		submissionDate: Date;
		protocolVersion: string;
		documents: {
			protocol: string; // 0G Storage hash
			consentForms: string[];
			investigatorBrochure?: string;
			dataManagementPlan: string;
		};
	};
	
	review: {
		reviewType: 'expedited' | 'full_board' | 'exempt';
		reviewDate?: Date;
		decision: 'approved' | 'conditional_approval' | 'revisions_required' | 'rejected' | 'pending';
		conditions: string[];
		validityPeriod?: number; // months
	};
	
	approval: {
		approvalDate?: Date;
		approvalNumber?: string;
		expiryDate?: Date;
		amendments: EthicsAmendment[];
	};
	
	// Blockchain verification
	blockchainProof: {
		submissionHash: string;
		approvalHash?: string;
		txHash: string;
		timestamped: Date;
	};
}

/**
 * Ethics Amendment
 */
export interface EthicsAmendment {
	amendmentId: string;
	amendmentNumber: number;
	submissionDate: Date;
	description: string;
	reason: string;
	approved: boolean;
	approvalDate?: Date;
	newExpiryDate?: Date;
}

/**
 * Research Dataset
 */
export interface ResearchDataset {
	datasetId: string;
	collaborationId: string;
	institutionId: string;
	
	// Dataset metadata
	title: string;
	description: string;
	dataType: 'clinical' | 'genomic' | 'imaging' | 'laboratory' | 'patient_reported';
	
	// Data characteristics
	sampleSize: number;
	dateRange: {
		start: Date;
		end: Date;
	};
	completeness: number; // percentage
	qualityScore: number; // 0-100
	
	// Variables
	variables: {
		name: string;
		type: 'categorical' | 'continuous' | 'binary' | 'ordinal';
		missingPercentage: number;
		description: string;
	}[];
	
	// Privacy & Security
	deidentified: boolean;
	encryptionMethod: string;
	accessLevel: 'open' | 'registered' | 'controlled';
	
	// Storage
	storage: {
		storageHash: string; // 0G Storage
		encryptedDataHash: string;
		manifestHash: string;
		size: number; // bytes
	};
	
	// Provenance
	provenance: {
		collectedBy: string;
		collectionMethod: string;
		processingSteps: string[];
		validationPerformed: boolean;
		auditTrail: string[]; // blockchain tx hashes
	};
	
	uploadedAt: Date;
	lastVerified: Date;
}

/**
 * Research Publication
 */
export interface ResearchPublication {
	publicationId: string;
	collaborationId?: string;
	
	// Publication details
	title: string;
	authors: {
		name: string;
		affiliation: string;
		orcid?: string;
		contributionRole: string[];
		correspondingAuthor: boolean;
	}[];
	
	abstract: string;
	keywords: string[];
	
	// Journal/Conference
	venue: {
		name: string;
		type: 'journal' | 'conference' | 'preprint';
		impactFactor?: number;
	};
	
	// Publication status
	status: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'published';
	submissionDate?: Date;
	acceptanceDate?: Date;
	publicationDate?: Date;
	doi?: string;
	pmid?: string;
	
	// Access
	openAccess: boolean;
	license?: string; // e.g., CC-BY-4.0
	manuscriptHash: string; // 0G Storage
	supplementaryMaterials: string[]; // 0G Storage hashes
	
	// Citations & Impact
	citations: number;
	altmetricScore?: number;
	
	// Blockchain registration
	blockchain: {
		manuscriptHash: string;
		registrationTxHash: string;
		timestamped: Date;
		immutable: boolean;
	};
	
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Research Protocol Template
 */
export interface ProtocolTemplate {
	templateId: string;
	name: string;
	studyType: string;
	specialty: string;
	
	sections: {
		sectionName: string;
		sectionNumber: string;
		required: boolean;
		content: string;
		guidelines: string[];
	}[];
	
	checklist: {
		item: string;
		category: string;
		completed: boolean;
	}[];
	
	regulatoryRequirements: {
		region: string;
		requirement: string;
		mandatory: boolean;
	}[];
}

/**
 * Cross-Institutional Data Query
 */
export interface DataQuery {
	queryId: string;
	requestingInstitution: string;
	requestingResearcher: {
		name: string;
		walletAddress: string;
		credentials: string[];
	};
	
	query: {
		title: string;
		purpose: string;
		dataRequested: string[];
		inclusionCriteria: Record<string, any>;
		exclusionCriteria: Record<string, any>;
		dateRange?: {
			start: Date;
			end: Date;
		};
	};
	
	ethics: {
		ethicsApprovalNumber: string;
		ethicsApprovalHash: string;
		dataUseAgreementHash: string;
	};
	
	responses: {
		institutionId: string;
		approved: boolean;
		dataSize: number;
		dataHash: string;
		responseDate: Date;
	}[];
	
	status: 'pending' | 'approved' | 'data_shared' | 'completed' | 'rejected';
	createdAt: Date;
}

/**
 * Research Coordination Service
 */
class ResearchCoordinationService {
	private collaborations: Map<string, ResearchCollaboration> = new Map();
	private ethicsApprovals: Map<string, EthicsCommitteeApproval[]> = new Map();
	private datasets: Map<string, ResearchDataset[]> = new Map();
	private publications: Map<string, ResearchPublication> = new Map();
	private dataQueries: Map<string, DataQuery> = new Map();

	constructor() {
		// Mock data removed - using Supabase database
		// if (browser) {
		// 	this.loadMockData();
		// }
	}

	/**
	 * Create new research collaboration
	 */
	async createCollaboration(
		collaborationData: Partial<ResearchCollaboration>
	): Promise<ResearchCollaboration> {
		const collaborationId = `collab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		
		const collaboration: ResearchCollaboration = {
			collaborationId,
			title: collaborationData.title || 'New Research Collaboration',
			type: collaborationData.type || 'observational_study',
			status: 'planning',
			leadInstitution: collaborationData.leadInstitution || {
				institutionId: 'unknown',
				institutionName: 'Unknown Institution',
				country: 'Unknown',
				piWallet: '0x0000000000000000000000000000000000000000',
				piName: 'Dr. Unknown'
			},
			collaboratingInstitutions: collaborationData.collaboratingInstitutions || [],
			researchQuestion: collaborationData.researchQuestion || 'Research question to be defined',
			hypothesis: collaborationData.hypothesis || 'Hypothesis to be defined',
			primaryObjectives: collaborationData.primaryObjectives || [],
			secondaryObjectives: collaborationData.secondaryObjectives || [],
			specialty: collaborationData.specialty || 'General Medicine',
			keywords: collaborationData.keywords || [],
			protocol: collaborationData.protocol || this.createDefaultProtocol(),
			ethics: {
				siteSpecificApprovals: new Map(),
				dataProtectionAssessment: false,
				conflictOfInterestDeclared: false
			},
			dataCollection: {
				targetSampleSize: 0,
				currentSampleSize: 0,
				dataQualityScore: 0,
				missingDataPercentage: 0
			},
			results: {
				analysisCompleted: false,
				primaryEndpointsMet: false,
				manuscriptDrafted: false,
				peerReviewed: false,
				published: false
			},
			blockchain: {
				protocolHash: ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(collaborationData))),
				dataProvenanceHashes: []
			},
			timeline: collaborationData.timeline || {
				protocolDevelopment: new Date(),
				ethicsSubmission: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
				dataCollectionStart: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
				analysisStart: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
				publicationTarget: new Date(Date.now() + 500 * 24 * 60 * 60 * 1000)
			},
			funding: collaborationData.funding || {
				totalBudget: 0,
				currency: 'USD',
				sources: []
			},
			createdAt: new Date(),
			updatedAt: new Date()
		};

		// Store in Supabase database
		try {
			const { error } = await supabase.from('research_collaborations').insert({
				collaboration_id: collaborationId,
				title: collaboration.title,
				type: collaboration.type,
				status: collaboration.status,
				research_question: collaboration.researchQuestion,
				objectives: [...collaboration.primaryObjectives, ...collaboration.secondaryObjectives],
				methodology: collaboration.protocol.methodology || 'To be defined',
				lead_institution: collaboration.leadInstitution,
				collaborating_institutions: collaboration.collaboratingInstitutions,
				timeline: collaboration.timeline,
				funding: collaboration.funding,
				data_sharing: {
					policy: 'restricted',
					embargoUntil: null,
					dataAvailability: 'upon_request'
				},
				blockchain: collaboration.blockchain
			});

			if (error) {
				console.error('❌ Supabase insert error:', error);
				throw new Error(`Failed to create collaboration: ${error.message}`);
			}

			console.log(`✅ Created research collaboration in database: ${collaboration.title}`);
		} catch (err) {
			console.error('❌ Database error:', err);
			throw err;
		}

		return collaboration;
	}

	/**
	 * Submit protocol for ethics approval
	 */
	async submitForEthicsApproval(
		collaborationId: string,
		committeeInfo: EthicsCommitteeApproval['committee'],
		documents: EthicsCommitteeApproval['submission']['documents']
	): Promise<EthicsCommitteeApproval> {
		const collaboration = this.collaborations.get(collaborationId);
		if (!collaboration) {
			throw new Error('Collaboration not found');
		}

		const approvalId = `ethics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		
		const approval: EthicsCommitteeApproval = {
			approvalId,
			committee: committeeInfo,
			submission: {
				submissionDate: new Date(),
				protocolVersion: '1.0',
				documents
			},
			review: {
				reviewType: 'full_board',
				decision: 'pending',
				conditions: []
			},
			approval: {
				amendments: []
			},
			blockchainProof: {
				submissionHash: ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(documents))),
				txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
				timestamped: new Date()
			}
		};

		// Store approval
		const existing = this.ethicsApprovals.get(collaborationId) || [];
		existing.push(approval);
		this.ethicsApprovals.set(collaborationId, existing);

		// Update collaboration status
		collaboration.status = 'ethics_review';
		// TODO: Update in Supabase
		// this.collaborations.set(collaborationId, collaboration);

		console.log(`📝 Submitted for ethics approval: ${committeeInfo.name}`);

		return approval;
	}

	/**
	 * Approve ethics submission (simulated)
	 */
	async approveEthicsSubmission(
		collaborationId: string,
		approvalId: string,
		approvalNumber: string,
		validityMonths: number = 12
	): Promise<EthicsCommitteeApproval> {
		const approvals = this.ethicsApprovals.get(collaborationId);
		if (!approvals) {
			throw new Error('No ethics submissions found');
		}

		const approval = approvals.find(a => a.approvalId === approvalId);
		if (!approval) {
			throw new Error('Ethics submission not found');
		}

		const approvalDate = new Date();
		const expiryDate = new Date(approvalDate);
		expiryDate.setMonth(expiryDate.getMonth() + validityMonths);

		approval.review.decision = 'approved';
		approval.review.reviewDate = new Date();
		approval.approval.approvalDate = approvalDate;
		approval.approval.approvalNumber = approvalNumber;
		approval.approval.expiryDate = expiryDate;
		approval.blockchainProof.approvalHash = ethers.keccak256(ethers.toUtf8Bytes(approvalNumber));

		// Update collaboration
		const collaboration = this.collaborations.get(collaborationId);
		if (collaboration) {
			collaboration.status = 'active';
			collaboration.ethics.centralEthicsApproval = approval;
			// TODO: Update in Supabase
			// this.collaborations.set(collaborationId, collaboration);
		}

		console.log(`✅ Ethics approval granted: ${approvalNumber}`);

		return approval;
	}

	/**
	 * Upload research dataset
	 */
	async uploadDataset(
		collaborationId: string,
		institutionId: string,
		datasetInfo: Partial<ResearchDataset>
	): Promise<ResearchDataset> {
		const collaboration = this.collaborations.get(collaborationId);
		if (!collaboration) {
			throw new Error('Collaboration not found');
		}

		const datasetId = `dataset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		
		const dataset: ResearchDataset = {
			datasetId,
			collaborationId,
			institutionId,
			title: datasetInfo.title || 'Research Dataset',
			description: datasetInfo.description || 'Dataset description',
			dataType: datasetInfo.dataType || 'clinical',
			sampleSize: datasetInfo.sampleSize || 0,
			dateRange: datasetInfo.dateRange || {
				start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
				end: new Date()
			},
			completeness: datasetInfo.completeness || 95,
			qualityScore: datasetInfo.qualityScore || 90,
			variables: datasetInfo.variables || [],
			deidentified: true,
			encryptionMethod: 'AES-256-GCM',
			accessLevel: 'controlled',
			storage: {
				storageHash: `0x${Math.random().toString(16).substr(2, 64)}`,
				encryptedDataHash: `0x${Math.random().toString(16).substr(2, 64)}`,
				manifestHash: `0x${Math.random().toString(16).substr(2, 64)}`,
				size: Math.floor(Math.random() * 1000000000) // Random size in bytes
			},
			provenance: {
				collectedBy: institutionId,
				collectionMethod: 'Electronic Health Records',
				processingSteps: ['Deidentification', 'Quality Control', 'Validation'],
				validationPerformed: true,
				auditTrail: []
			},
			uploadedAt: new Date(),
			lastVerified: new Date()
		};

		// Store dataset
		const existing = this.datasets.get(collaborationId) || [];
		existing.push(dataset);
		this.datasets.set(collaborationId, existing);

		// Update collaboration data collection
		collaboration.dataCollection.currentSampleSize += dataset.sampleSize;
		collaboration.blockchain.dataProvenanceHashes.push(dataset.storage.storageHash);
		// TODO: Update in Supabase
		// this.collaborations.set(collaborationId, collaboration);

		console.log(`📊 Dataset uploaded: ${dataset.title} (${dataset.sampleSize} samples)`);

		return dataset;
	}

	/**
	 * Publish research results
	 */
	async publishResults(
		collaborationId: string,
		publicationData: Partial<ResearchPublication>
	): Promise<ResearchPublication> {
		const collaboration = this.collaborations.get(collaborationId);
		if (!collaboration) {
			throw new Error('Collaboration not found');
		}

		const publicationId = `pub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		
		const publication: ResearchPublication = {
			publicationId,
			collaborationId,
			title: publicationData.title || collaboration.title,
			authors: publicationData.authors || [],
			abstract: publicationData.abstract || '',
			keywords: publicationData.keywords || collaboration.keywords,
			venue: publicationData.venue || {
				name: 'MedNexus Research Journal',
				type: 'journal',
				impactFactor: 8.5
			},
			status: 'submitted',
			openAccess: publicationData.openAccess ?? true,
			manuscriptHash: `0x${Math.random().toString(16).substr(2, 64)}`,
			supplementaryMaterials: [],
			citations: 0,
			blockchain: {
				manuscriptHash: `0x${Math.random().toString(16).substr(2, 64)}`,
				registrationTxHash: `0x${Math.random().toString(16).substr(2, 64)}`,
				timestamped: new Date(),
				immutable: true
			},
			createdAt: new Date(),
			updatedAt: new Date()
		};

		this.publications.set(publicationId, publication);

		// Update collaboration
		collaboration.results.manuscriptDrafted = true;
		collaboration.status = 'publication';
		collaboration.blockchain.publicationHash = publication.manuscriptHash;
		// TODO: Update in Supabase
		// this.collaborations.set(collaborationId, collaboration);

		console.log(`📄 Research published: ${publication.title}`);

		return publication;
	}

	/**
	 * Create cross-institutional data query
	 */
	async createDataQuery(
		requestingInstitution: string,
		researcher: DataQuery['requestingResearcher'],
		queryDetails: Partial<DataQuery['query']>,
		ethicsInfo: DataQuery['ethics']
	): Promise<DataQuery> {
		const queryId = `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		
		const query: DataQuery = {
			queryId,
			requestingInstitution,
			requestingResearcher: researcher,
			query: {
				title: queryDetails.title || 'Data Query',
				purpose: queryDetails.purpose || 'Research purposes',
				dataRequested: queryDetails.dataRequested || [],
				inclusionCriteria: queryDetails.inclusionCriteria || {},
				exclusionCriteria: queryDetails.exclusionCriteria || {}
			},
			ethics: ethicsInfo,
			responses: [],
			status: 'pending',
			createdAt: new Date()
		};

		this.dataQueries.set(queryId, query);

		console.log(`🔍 Data query created: ${query.query.title}`);

		return query;
	}

	/**
	 * Get all collaborations
	 */
	async getAllCollaborations(): Promise<ResearchCollaboration[]> {
		try {
			const { data, error } = await supabase
				.from('research_collaborations')
				.select('*')
				.order('created_at', { ascending: false });

			if (error) throw error;
			return (data || []).map(row => this.mapDbToCollaboration(row));
		} catch (err) {
			console.error('❌ Error fetching collaborations:', err);
			return [];
		}
	}

	/**
	 * Get collaboration by ID
	 */
	async getCollaboration(collaborationId: string): Promise<ResearchCollaboration | null> {
		try {
			const { data, error } = await supabase
				.from('research_collaborations')
				.select('*')
				.eq('collaboration_id', collaborationId)
				.single();

			if (error) throw error;
			return data ? this.mapDbToCollaboration(data) : null;
		} catch (err) {
			console.error('❌ Error fetching collaboration:', err);
			return null;
		}
	}

	private mapDbToCollaboration(row: any): ResearchCollaboration {
		return {
			collaborationId: row.collaboration_id,
			title: row.title,
			type: row.type,
			status: row.status,
			leadInstitution: row.lead_institution,
			collaboratingInstitutions: row.collaborating_institutions || [],
			researchQuestion: row.research_question,
			hypothesis: row.hypothesis || '',
			primaryObjectives: row.objectives || [],
			secondaryObjectives: [],
			specialty: row.specialty || 'General Medicine',
			keywords: row.keywords || [],
			protocol: row.protocol || this.createDefaultProtocol(),
			ethics: {
				siteSpecificApprovals: new Map(),
				dataProtectionAssessment: false,
				conflictOfInterestDeclared: false
			},
			dataCollection: {
				targetSampleSize: 0,
				currentSampleSize: 0,
				dataQualityScore: 0,
				missingDataPercentage: 0
			},
			results: {
				analysisCompleted: false,
				primaryEndpointsMet: false,
				manuscriptDrafted: false,
				peerReviewed: false,
				published: false
			},
			blockchain: row.blockchain || { protocolHash: '', dataProvenanceHashes: [] },
			timeline: row.timeline,
			funding: row.funding,
			createdAt: new Date(row.created_at),
			updatedAt: new Date(row.updated_at)
		};
	}

	/**
	 * Get ethics approvals for collaboration
	 */
	getEthicsApprovals(collaborationId: string): EthicsCommitteeApproval[] {
		return this.ethicsApprovals.get(collaborationId) || [];
	}

	/**
	 * Get datasets for collaboration
	 */
	getDatasets(collaborationId: string): ResearchDataset[] {
		return this.datasets.get(collaborationId) || [];
	}

	/**
	 * Get all publications
	 */
	getAllPublications(): ResearchPublication[] {
		return Array.from(this.publications.values());
	}

	/**
	 * Get data queries
	 */
	getAllDataQueries(): DataQuery[] {
		return Array.from(this.dataQueries.values());
	}

	// Helper methods

	private createDefaultProtocol(): ResearchProtocol {
		return {
			protocolId: `protocol_${Date.now()}`,
			version: '1.0',
			title: 'Research Protocol',
			abstract: 'Protocol abstract to be defined',
			methodology: {
				studyDesign: 'To be determined',
				population: 'To be defined',
				interventions: [],
				comparators: [],
				outcomes: [],
				statisticalAnalysis: 'To be defined',
				sampleSize: 0,
				powerAnalysis: 'To be performed'
			},
			collaboratingInstitutions: [],
			leadInstitution: 'Unknown',
			timeline: {
				protocolDevelopment: new Date(),
				ethicsSubmission: new Date(),
				enrollmentStart: new Date(),
				dataCollection: new Date(),
				analysis: new Date(),
				publication: new Date()
			},
			dataSharing: {
				dataAvailable: true,
				dataType: [],
				accessCriteria: 'Upon reasonable request'
			},
			blockchain: {
				protocolHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
				timestamped: new Date(),
				immutable: false
			}
		};
	}

	/**
	 * Load mock research collaboration data
	 */
	private loadMockData() {
		// Mock collaboration 1: Global rare disease registry
		const collab1Data: Partial<ResearchCollaboration> = {
			title: 'Global Registry of Ehlers-Danlos Syndrome: Natural History and Treatment Outcomes',
			type: 'registry_study',
			status: 'active',
			leadInstitution: {
				institutionId: 'johns-hopkins',
				institutionName: 'Johns Hopkins Hospital',
				country: 'United States',
				piWallet: '0x1234567890123456789012345678901234567890',
				piName: 'Dr. Maria Rodriguez'
			},
			collaboratingInstitutions: [
				{
					institutionId: 'charite-berlin',
					institutionName: 'Charité Universitätsmedizin Berlin',
					country: 'Germany',
					localPIName: 'Prof. Dr. Klaus Mueller',
					role: 'co_investigator',
					dataSharing: true,
					fundingContribution: 250000
				},
				{
					institutionId: 'st-thomas-london',
					institutionName: "St. Thomas' Hospital",
					country: 'United Kingdom',
					localPIName: 'Dr. Emily Wilson',
					role: 'data_contributor',
					dataSharing: true
				},
				{
					institutionId: 'sydney-hospital',
					institutionName: 'Sydney Hospital',
					country: 'Australia',
					localPIName: 'Dr. James Chen',
					role: 'data_contributor',
					dataSharing: true
				}
			],
			researchQuestion: 'What are the long-term cardiovascular and musculoskeletal outcomes in patients with Ehlers-Danlos Syndrome across different genetic subtypes?',
			hypothesis: 'Patients with vascular EDS will have significantly worse cardiovascular outcomes compared to hypermobile EDS, with genotype-specific risk patterns',
			primaryObjectives: [
				'Characterize natural history of EDS across genetic subtypes',
				'Identify predictors of major adverse cardiovascular events',
				'Establish genotype-phenotype correlations'
			],
			secondaryObjectives: [
				'Evaluate quality of life outcomes',
				'Assess treatment patterns and efficacy',
				'Develop risk stratification tools'
			],
			specialty: 'Medical Genetics',
			keywords: ['Ehlers-Danlos Syndrome', 'Rare Disease', 'Natural History', 'Registry', 'Cardiovascular'],
			funding: {
				totalBudget: 3500000,
				currency: 'USD',
				sources: [
					{
						source: 'NIH National Center for Advancing Translational Sciences',
						amount: 2000000,
						type: 'grant'
					},
					{
						source: 'Ehlers-Danlos Society',
						amount: 1000000,
						type: 'philanthropic'
					},
					{
						source: 'German Research Foundation (DFG)',
						amount: 500000,
						type: 'grant'
					}
				]
			}
		};

		// Mock collaboration 2: COVID-19 treatment outcomes
		const collab2Data: Partial<ResearchCollaboration> = {
			title: 'International Consortium for COVID-19 Treatment Outcomes in Immunocompromised Patients',
			type: 'observational_study',
			status: 'analysis',
			leadInstitution: {
				institutionId: 'mass-general',
				institutionName: 'Massachusetts General Hospital',
				country: 'United States',
				piWallet: '0x2345678901234567890123456789012345678901',
				piName: 'Dr. Robert Singh'
			},
			collaboratingInstitutions: [
				{
					institutionId: 'toronto-general',
					institutionName: 'Toronto General Hospital',
					country: 'Canada',
					localPIName: 'Dr. Sarah Johnson',
					role: 'co_investigator',
					dataSharing: true,
					fundingContribution: 180000
				},
				{
					institutionId: 'karolinska',
					institutionName: 'Karolinska University Hospital',
					country: 'Sweden',
					localPIName: 'Dr. Anders Bergström',
					role: 'co_investigator',
					dataSharing: true,
					fundingContribution: 150000
				},
				{
					institutionId: 'singapore-general',
					institutionName: 'Singapore General Hospital',
					country: 'Singapore',
					localPIName: 'Dr. Li Wei',
					role: 'data_contributor',
					dataSharing: true
				}
			],
			researchQuestion: 'How do treatment outcomes with novel antivirals differ in immunocompromised patients compared to immunocompetent patients with COVID-19?',
			hypothesis: 'Immunocompromised patients will have prolonged viral shedding and reduced treatment efficacy despite early antiviral therapy',
			primaryObjectives: [
				'Compare treatment outcomes between immunocompromised and immunocompetent patients',
				'Identify predictors of treatment failure',
				'Characterize viral dynamics in immunocompromised patients'
			],
			secondaryObjectives: [
				'Evaluate safety profiles across patient populations',
				'Assess development of resistant variants',
				'Determine optimal treatment duration'
			],
			specialty: 'Infectious Diseases',
			keywords: ['COVID-19', 'Immunocompromised', 'Antivirals', 'Treatment Outcomes', 'Viral Dynamics'],
			funding: {
				totalBudget: 2800000,
				currency: 'USD',
				sources: [
					{
						source: 'WHO Emergency Response Grant',
						amount: 1500000,
						type: 'grant'
					},
					{
						source: 'Pharma Industry Consortium',
						amount: 1000000,
						type: 'industry'
					},
					{
						source: 'Institutional Funds',
						amount: 300000,
						type: 'institutional'
					}
				]
			}
		};

		// Mock collaboration 3: AI-powered sepsis prediction
		const collab3Data: Partial<ResearchCollaboration> = {
			title: 'Development and Validation of AI-Powered Early Sepsis Prediction System: Multi-Center Study',
			type: 'observational_study',
			status: 'active',
			leadInstitution: {
				institutionId: 'stanford-med',
				institutionName: 'Stanford Medical Center',
				country: 'United States',
				piWallet: '0x3456789012345678901234567890123456789012',
				piName: 'Dr. Raj Patel'
			},
			collaboratingInstitutions: [
				{
					institutionId: 'mayo-clinic',
					institutionName: 'Mayo Clinic',
					country: 'United States',
					localPIName: 'Dr. Lisa Anderson',
					role: 'co_investigator',
					dataSharing: true,
					fundingContribution: 300000
				},
				{
					institutionId: 'ntu-hospital',
					institutionName: 'National Taiwan University Hospital',
					country: 'Taiwan',
					localPIName: 'Dr. Chen Wei-Ling',
					role: 'data_contributor',
					dataSharing: true
				},
				{
					institutionId: 'amu-hospital',
					institutionName: 'Amsterdam University Medical Centers',
					country: 'Netherlands',
					localPIName: 'Dr. Jan van der Berg',
					role: 'data_contributor',
					dataSharing: true
				}
			],
			researchQuestion: 'Can machine learning algorithms trained on multi-center data predict sepsis onset 6-12 hours before clinical diagnosis?',
			hypothesis: 'AI models trained on diverse patient populations will achieve >85% sensitivity and >90% specificity for early sepsis prediction',
			primaryObjectives: [
				'Develop and validate AI sepsis prediction model',
				'Assess model performance across diverse populations',
				'Evaluate clinical utility and impact on patient outcomes'
			],
			secondaryObjectives: [
				'Identify most predictive features across sites',
				'Assess model fairness and bias',
				'Determine optimal alert thresholds'
			],
			specialty: 'Critical Care Medicine',
			keywords: ['Sepsis', 'Machine Learning', 'Early Warning System', 'Critical Care', 'Prediction Model'],
			funding: {
				totalBudget: 4200000,
				currency: 'USD',
				sources: [
					{
						source: 'AHRQ Patient Safety Grant',
						amount: 2500000,
						type: 'grant'
					},
					{
						source: 'Google Health AI Research',
						amount: 1200000,
						type: 'industry'
					},
					{
						source: 'Stanford Digital Health Initiative',
						amount: 500000,
						type: 'institutional'
					}
				]
			}
		};

		// Create collaborations
		[collab1Data, collab2Data, collab3Data].forEach(async (data) => {
			const collab = await this.createCollaboration(data);
			
			// Mock ethics approval for active studies
			if (data.status === 'active' || data.status === 'analysis') {
				const approval = await this.submitForEthicsApproval(
					collab.collaborationId,
					{
						name: `${data.leadInstitution?.institutionName} IRB`,
						institution: data.leadInstitution?.institutionName || 'Unknown',
						country: data.leadInstitution?.country || 'Unknown',
						registrationNumber: `IRB-${Math.floor(Math.random() * 10000)}`
					},
					{
						protocol: `0x${Math.random().toString(16).substr(2, 64)}`,
						consentForms: [`0x${Math.random().toString(16).substr(2, 64)}`],
						dataManagementPlan: `0x${Math.random().toString(16).substr(2, 64)}`
					}
				);

				await this.approveEthicsSubmission(
					collab.collaborationId,
					approval.approvalId,
					`IRB-2024-${Math.floor(Math.random() * 10000)}`,
					12
				);

				// Mock dataset uploads from some institutions
				if (data.collaboratingInstitutions && data.collaboratingInstitutions.length > 0) {
					for (let i = 0; i < Math.min(2, data.collaboratingInstitutions.length); i++) {
						const inst = data.collaboratingInstitutions[i];
						await this.uploadDataset(collab.collaborationId, inst.institutionId, {
							title: `${inst.institutionName} Clinical Dataset`,
							description: `De-identified patient data from ${inst.institutionName}`,
							dataType: 'clinical',
							sampleSize: Math.floor(Math.random() * 500) + 100,
							completeness: 90 + Math.random() * 10,
							qualityScore: 85 + Math.random() * 15,
							variables: [
								{
									name: 'Demographics',
									type: 'categorical',
									missingPercentage: 0,
									description: 'Patient demographics'
								},
								{
									name: 'Vital Signs',
									type: 'continuous',
									missingPercentage: 2,
									description: 'Clinical vital signs'
								}
							]
						});
					}
				}
			}
		});

		console.log('✅ Loaded 3 mock research collaborations with ethics approvals and datasets');
	}
}

// Export singleton instance
export const researchCoordinationService = new ResearchCoordinationService();
