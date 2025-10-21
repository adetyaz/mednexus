/**
 * IP Protection Service - Wave 5
 * 
 * Handles intellectual property protection, automated patent generation,
 * prior art analysis, and IP verification using blockchain technology.
 * Integrates with Medical Intelligence INFTs for tokenized medical innovations.
 */

import { ethers } from 'ethers';
import type { ResearchCollaboration } from './researchCoordinationService';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PatentApplication {
	patentId: string;
	applicationNumber: string;
	title: string;
	abstract: string;
	inventors: Inventor[];
	assignees: Assignee[];
	
	// Patent Classification
	classification: {
		ipcClass: string; // International Patent Classification
		cpcClass: string; // Cooperative Patent Classification
		usptoClass?: string;
		primaryField: string;
		subFields: string[];
	};
	
	// Innovation Details
	innovation: {
		type: 'drug' | 'device' | 'method' | 'diagnostic' | 'software' | 'combination';
		description: string;
		technicalProblem: string;
		solution: string;
		advantages: string[];
		potentialApplications: string[];
	};
	
	// Claims
	claims: {
		independent: Claim[];
		dependent: Claim[];
		totalCount: number;
	};
	
	// Prior Art Analysis
	priorArt: {
		searchCompleted: boolean;
		searchDate?: Date;
		relevantReferences: PriorArtReference[];
		noveltyScore: number; // 0-100
		aiAnalysis: string;
		potentialConflicts: string[];
	};
	
	// Filing Information
	filing: {
		jurisdiction: string[];
		filingDate?: Date;
		publicationDate?: Date;
		priorityDate?: Date;
		pctApplication?: string;
		status: 'draft' | 'filed' | 'pending' | 'granted' | 'rejected' | 'abandoned';
		examinerName?: string;
	};
	
	// Collaboration & Ownership
	collaboration?: {
		collaborationId: string;
		institutions: string[];
		ownershipSplit: { institutionId: string; percentage: number; }[];
	};
	
	// Commercial Potential
	commercial: {
		marketSize: number;
		targetMarket: string[];
		competitors: string[];
		licensingInterest: number; // Number of inquiries
		valuationEstimate?: number;
	};
	
	// Blockchain Verification
	blockchainProof: {
		txHash: string;
		blockNumber: number;
		timestamp: Date;
		ipfsHash: string; // Full patent document on IPFS
		verified: boolean;
	};
	
	// Related INFTs
	inftTokenization?: {
		tokenId: string;
		contractAddress: string;
		fractionalShares: number;
		pricePerShare: number;
		listed: boolean;
	};
	
	createdAt: Date;
	updatedAt: Date;
}

export interface Inventor {
	name: string;
	affiliations: string[];
	email: string;
	orcid?: string;
	contributions: string[];
	ownershipPercentage?: number;
}

export interface Assignee {
	name: string;
	type: 'individual' | 'institution' | 'company';
	institutionId?: string;
	country: string;
	ownershipPercentage: number;
}

export interface Claim {
	claimNumber: number;
	claimText: string;
	scope: 'broad' | 'medium' | 'narrow';
	dependsOn?: number[];
}

export interface PriorArtReference {
	referenceId: string;
	type: 'patent' | 'publication' | 'product' | 'clinical_trial';
	title: string;
	identifier: string; // Patent number, DOI, NCT number
	date: Date;
	inventors?: string[];
	abstract: string;
	relevanceScore: number; // 0-100
	overlapAnalysis: string;
	citationImpact?: number;
}

export interface LicensingAgreement {
	agreementId: string;
	patentId: string;
	licensor: {
		name: string;
		institutionId?: string;
		type: 'individual' | 'institution' | 'company';
	};
	licensee: {
		name: string;
		institutionId?: string;
		type: 'individual' | 'institution' | 'company';
	};
	
	terms: {
		type: 'exclusive' | 'non-exclusive' | 'sole';
		territory: string[];
		field: string[];
		duration: number; // years
		startDate: Date;
		endDate: Date;
	};
	
	financial: {
		upfrontFee: number;
		royaltyRate: number; // percentage
		minimumRoyalty: number;
		milestonePayments: MilestonePayment[];
		currency: string;
		totalRevenueGenerated: number;
	};
	
	obligations: {
		developmentMilestones: string[];
		reportingRequirements: string[];
		qualityStandards: string[];
	};
	
	status: 'draft' | 'negotiation' | 'active' | 'terminated' | 'expired';
	
	blockchainProof: {
		txHash: string;
		smartContractAddress: string;
		timestamp: Date;
	};
	
	createdAt: Date;
}

export interface MilestonePayment {
	milestone: string;
	amount: number;
	achieved: boolean;
	achievedDate?: Date;
	description: string;
}

export interface IPPortfolio {
	institutionId: string;
	institutionName: string;
	patents: {
		granted: number;
		pending: number;
		totalApplications: number;
	};
	
	commercialization: {
		licensed: number;
		generating_revenue: number;
		totalRevenue: number;
		averageRoyaltyRate: number;
	};
	
	topFields: {
		field: string;
		count: number;
		revenue: number;
	}[];
	
	collaborativeIP: {
		multiInstitutionalPatents: number;
		partners: string[];
		revenueSharing: number;
	};
}

export interface FreedomToOperate {
	analysisId: string;
	targetInnovation: {
		title: string;
		description: string;
		intendedUse: string[];
		targetMarkets: string[];
	};
	
	analysis: {
		analysisDate: Date;
		jurisdiction: string[];
		relevantPatents: PriorArtReference[];
		riskLevel: 'low' | 'medium' | 'high';
		riskSummary: string;
		recommendations: string[];
	};
	
	strategies: {
		designAround: string[];
		licensing: string[];
		invalidation: string[];
		opinion: string;
	};
	
	conducted_by: {
		attorney: string;
		firm: string;
		barNumber: string;
	};
	
	blockchainProof: {
		txHash: string;
		timestamp: Date;
	};
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

class IPProtectionService {
	private patents: Map<string, PatentApplication> = new Map();
	private licenses: Map<string, LicensingAgreement> = new Map();
	private ftoAnalyses: Map<string, FreedomToOperate> = new Map();
	private portfolios: Map<string, IPPortfolio> = new Map();

	constructor() {
		this.initializeMockData();
	}

	// ========================================================================
	// PATENT APPLICATION MANAGEMENT
	// ========================================================================

	/**
	 * Create a new patent application
	 */
	async createPatentApplication(data: {
		title: string;
		abstract: string;
		inventors: Inventor[];
		assignees: Assignee[];
		innovation: PatentApplication['innovation'];
		claims: { independent: Claim[]; dependent: Claim[]; };
		collaborationId?: string;
	}): Promise<PatentApplication> {
		const patentId = `PAT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		const applicationNumber = `US${new Date().getFullYear()}/${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;

		// Generate blockchain proof
		const blockchainProof = await this.generateBlockchainProof({
			patentId,
			title: data.title,
			abstract: data.abstract,
			inventors: data.inventors.map(i => i.name),
		});

		const patent: PatentApplication = {
			patentId,
			applicationNumber,
			title: data.title,
			abstract: data.abstract,
			inventors: data.inventors,
			assignees: data.assignees,
			
			classification: {
				ipcClass: this.determineIPCClass(data.innovation.type),
				cpcClass: this.determineCPCClass(data.innovation.type),
				usptoClass: this.determineUSPTOClass(data.innovation.type),
				primaryField: this.determinePrimaryField(data.innovation.type),
				subFields: this.determineSubFields(data.innovation),
			},
			
			innovation: data.innovation,
			
			claims: {
				independent: data.claims.independent,
				dependent: data.claims.dependent,
				totalCount: data.claims.independent.length + data.claims.dependent.length,
			},
			
			priorArt: {
				searchCompleted: false,
				relevantReferences: [],
				noveltyScore: 0,
				aiAnalysis: '',
				potentialConflicts: [],
			},
			
			filing: {
				jurisdiction: ['US'],
				status: 'draft',
			},
			
			commercial: {
				marketSize: 0,
				targetMarket: [],
				competitors: [],
				licensingInterest: 0,
			},
			
			blockchainProof,
			
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		if (data.collaborationId) {
			// Link to research collaboration
			patent.collaboration = {
				collaborationId: data.collaborationId,
				institutions: data.assignees.filter(a => a.institutionId).map(a => a.institutionId!),
				ownershipSplit: data.assignees.map(a => ({
					institutionId: a.institutionId || a.name,
					percentage: a.ownershipPercentage,
				})),
			};
		}

		this.patents.set(patentId, patent);
		return patent;
	}

	/**
	 * Conduct AI-powered prior art search
	 */
	async conductPriorArtSearch(patentId: string): Promise<PriorArtReference[]> {
		const patent = this.patents.get(patentId);
		if (!patent) {
			throw new Error('Patent not found');
		}

		// Simulate AI-powered prior art search using 0G Compute
		const references = await this.searchPriorArt(patent);

		// Update patent with prior art analysis
		patent.priorArt = {
			searchCompleted: true,
			searchDate: new Date(),
			relevantReferences: references,
			noveltyScore: this.calculateNoveltyScore(references),
			aiAnalysis: this.generateAIAnalysis(patent, references),
			potentialConflicts: this.identifyPotentialConflicts(references),
		};

		patent.updatedAt = new Date();
		this.patents.set(patentId, patent);

		return references;
	}

	/**
	 * File patent application
	 */
	async filePatentApplication(
		patentId: string,
		jurisdictions: string[]
	): Promise<PatentApplication> {
		const patent = this.patents.get(patentId);
		if (!patent) {
			throw new Error('Patent not found');
		}

		if (!patent.priorArt.searchCompleted) {
			throw new Error('Prior art search must be completed before filing');
		}

		patent.filing = {
			...patent.filing,
			jurisdiction: jurisdictions,
			filingDate: new Date(),
			status: 'filed',
		};

		// Generate new blockchain proof for filing
		const filingProof = await this.generateBlockchainProof({
			patentId,
			action: 'filed',
			jurisdictions,
			filingDate: new Date(),
		});

		patent.blockchainProof = filingProof;
		patent.updatedAt = new Date();
		this.patents.set(patentId, patent);

		return patent;
	}

	/**
	 * Tokenize patent as Medical Intelligence INFT
	 */
	async tokenizeAsINFT(
		patentId: string,
		fractionalShares: number,
		pricePerShare: number
	): Promise<PatentApplication> {
		const patent = this.patents.get(patentId);
		if (!patent) {
			throw new Error('Patent not found');
		}

		if (patent.filing.status !== 'granted') {
			throw new Error('Only granted patents can be tokenized');
		}

		// Simulate INFT minting on blockchain
		const tokenId = `INFT-${Date.now()}`;
		const contractAddress = `0x${Math.random().toString(16).substr(2, 40)}`;

		patent.inftTokenization = {
			tokenId,
			contractAddress,
			fractionalShares,
			pricePerShare,
			listed: true,
		};

		patent.updatedAt = new Date();
		this.patents.set(patentId, patent);

		return patent;
	}

	// ========================================================================
	// LICENSING MANAGEMENT
	// ========================================================================

	/**
	 * Create licensing agreement
	 */
	async createLicensingAgreement(data: {
		patentId: string;
		licensor: LicensingAgreement['licensor'];
		licensee: LicensingAgreement['licensee'];
		terms: LicensingAgreement['terms'];
		financial: Omit<LicensingAgreement['financial'], 'totalRevenueGenerated'>;
		obligations: LicensingAgreement['obligations'];
	}): Promise<LicensingAgreement> {
		const agreementId = `LIC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

		// Deploy smart contract for automated royalty distribution
		const smartContract = await this.deployLicensingSmartContract(data);

		const agreement: LicensingAgreement = {
			agreementId,
			patentId: data.patentId,
			licensor: data.licensor,
			licensee: data.licensee,
			terms: data.terms,
			financial: {
				...data.financial,
				totalRevenueGenerated: 0,
			},
			obligations: data.obligations,
			status: 'draft',
			blockchainProof: {
				txHash: smartContract.txHash,
				smartContractAddress: smartContract.address,
				timestamp: new Date(),
			},
			createdAt: new Date(),
		};

		this.licenses.set(agreementId, agreement);
		return agreement;
	}

	/**
	 * Record milestone achievement and payment
	 */
	async recordMilestoneAchievement(
		agreementId: string,
		milestoneIndex: number
	): Promise<LicensingAgreement> {
		const agreement = this.licenses.get(agreementId);
		if (!agreement) {
			throw new Error('Agreement not found');
		}

		const milestone = agreement.financial.milestonePayments[milestoneIndex];
		if (!milestone) {
			throw new Error('Milestone not found');
		}

		milestone.achieved = true;
		milestone.achievedDate = new Date();
		agreement.financial.totalRevenueGenerated += milestone.amount;

		// Trigger smart contract payment
		await this.triggerSmartContractPayment(
			agreement.blockchainProof.smartContractAddress,
			milestone.amount
		);

		agreement.status = 'active';
		this.licenses.set(agreementId, agreement);

		return agreement;
	}

	/**
	 * Calculate royalty payment
	 */
	calculateRoyaltyPayment(agreementId: string, revenue: number): number {
		const agreement = this.licenses.get(agreementId);
		if (!agreement) {
			throw new Error('Agreement not found');
		}

		const royalty = revenue * (agreement.financial.royaltyRate / 100);
		return Math.max(royalty, agreement.financial.minimumRoyalty);
	}

	// ========================================================================
	// FREEDOM TO OPERATE ANALYSIS
	// ========================================================================

	/**
	 * Conduct freedom to operate analysis
	 */
	async conductFTOAnalysis(data: {
		targetInnovation: FreedomToOperate['targetInnovation'];
		jurisdiction: string[];
		attorney: { name: string; firm: string; barNumber: string; };
	}): Promise<FreedomToOperate> {
		const analysisId = `FTO-${Date.now()}`;

		// AI-powered patent landscape analysis
		const relevantPatents = await this.searchRelevantPatents(
			data.targetInnovation,
			data.jurisdiction
		);

		const riskLevel = this.assessFTORisk(relevantPatents);

		const analysis: FreedomToOperate = {
			analysisId,
			targetInnovation: data.targetInnovation,
			analysis: {
				analysisDate: new Date(),
				jurisdiction: data.jurisdiction,
				relevantPatents,
				riskLevel,
				riskSummary: this.generateRiskSummary(relevantPatents, riskLevel),
				recommendations: this.generateFTORecommendations(relevantPatents, riskLevel),
			},
		strategies: {
			designAround: this.suggestDesignAroundStrategies(relevantPatents),
			licensing: this.suggestLicensingStrategies(relevantPatents),
			invalidation: this.suggestInvalidationStrategies(relevantPatents),
			opinion: this.generateLegalOpinion(relevantPatents, riskLevel, data.attorney),
		},
		conducted_by: {
			attorney: data.attorney.name,
			firm: data.attorney.firm,
			barNumber: data.attorney.barNumber,
		},
		blockchainProof: await this.generateBlockchainProof({ analysisId, date: new Date() }),
	};		this.ftoAnalyses.set(analysisId, analysis);
		return analysis;
	}

	// ========================================================================
	// IP PORTFOLIO MANAGEMENT
	// ========================================================================

	/**
	 * Get IP portfolio for institution
	 */
	getIPPortfolio(institutionId: string): IPPortfolio | null {
		return this.portfolios.get(institutionId) || null;
	}

	/**
	 * Calculate portfolio valuation
	 */
	calculatePortfolioValuation(institutionId: string): number {
		const patents = Array.from(this.patents.values()).filter(
			p => p.assignees.some(a => a.institutionId === institutionId)
		);

		return patents.reduce((total, patent) => {
			return total + (patent.commercial.valuationEstimate || 0);
		}, 0);
	}

	/**
	 * Get top revenue generating patents
	 */
	getTopRevenuePatents(institutionId: string, limit: number = 10): PatentApplication[] {
		const licenses = Array.from(this.licenses.values()).filter(
			l => l.licensor.institutionId === institutionId
		);

		const patentRevenue = new Map<string, number>();
		licenses.forEach(license => {
			const current = patentRevenue.get(license.patentId) || 0;
			patentRevenue.set(license.patentId, current + license.financial.totalRevenueGenerated);
		});

		const patents = Array.from(this.patents.values())
			.filter(p => patentRevenue.has(p.patentId))
			.sort((a, b) => {
				const revA = patentRevenue.get(a.patentId) || 0;
				const revB = patentRevenue.get(b.patentId) || 0;
				return revB - revA;
			});

		return patents.slice(0, limit);
	}

	// ========================================================================
	// QUERY METHODS
	// ========================================================================

	getAllPatents(): PatentApplication[] {
		// TODO: Replace with Supabase query
		return Array.from(this.patents.values());
	}

	getPatent(patentId: string): PatentApplication | null {
		// TODO: Replace with Supabase query
		return this.patents.get(patentId) || null;
	}

	getPatentsByStatus(status: PatentApplication['filing']['status']): PatentApplication[] {
		// TODO: Replace with Supabase query
		return Array.from(this.patents.values()).filter(p => p.filing.status === status);
	}

	getPatentsByInnovationType(type: PatentApplication['innovation']['type']): PatentApplication[] {
		return Array.from(this.patents.values()).filter(p => p.innovation.type === type);
	}

	getAllLicenses(): LicensingAgreement[] {
		return Array.from(this.licenses.values());
	}

	getLicense(agreementId: string): LicensingAgreement | null {
		return this.licenses.get(agreementId) || null;
	}

	getLicensesByPatent(patentId: string): LicensingAgreement[] {
		return Array.from(this.licenses.values()).filter(l => l.patentId === patentId);
	}

	getActiveLicenses(): LicensingAgreement[] {
		return Array.from(this.licenses.values()).filter(l => l.status === 'active');
	}

	// ========================================================================
	// HELPER METHODS
	// ========================================================================

	private determineIPCClass(type: PatentApplication['innovation']['type']): string {
		const classifications: Record<typeof type, string> = {
			drug: 'A61K 31/00',
			device: 'A61B 5/00',
			method: 'G16H 50/20',
			diagnostic: 'G01N 33/48',
			software: 'G16H 10/60',
			combination: 'A61K 31/00',
		};
		return classifications[type];
	}

	private determineCPCClass(type: PatentApplication['innovation']['type']): string {
		const classifications: Record<typeof type, string> = {
			drug: 'A61K 31/00',
			device: 'A61B 5/00',
			method: 'G16H 50/20',
			diagnostic: 'G01N 33/48',
			software: 'G16H 10/60',
			combination: 'A61K 31/00',
		};
		return classifications[type];
	}

	private determineUSPTOClass(type: PatentApplication['innovation']['type']): string | undefined {
		const classifications: Record<typeof type, string> = {
			drug: '514',
			device: '600',
			method: '705',
			diagnostic: '435',
			software: '705',
			combination: '514',
		};
		return classifications[type];
	}

	private determinePrimaryField(type: PatentApplication['innovation']['type']): string {
		const fields: Record<typeof type, string> = {
			drug: 'Pharmaceuticals',
			device: 'Medical Devices',
			method: 'Medical Methods',
			diagnostic: 'Diagnostics',
			software: 'Health IT',
			combination: 'Combination Therapy',
		};
		return fields[type];
	}

	private determineSubFields(innovation: PatentApplication['innovation']): string[] {
		// Simplified subfield determination
		return ['Medical Innovation', 'Healthcare Technology'];
	}

	private async generateBlockchainProof(data: any): Promise<PatentApplication['blockchainProof']> {
		// Simulate blockchain transaction
		const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;
		const blockNumber = Math.floor(Math.random() * 1000000);
		const ipfsHash = `Qm${Math.random().toString(36).substr(2, 44)}`;

		return {
			txHash,
			blockNumber,
			timestamp: new Date(),
			ipfsHash,
			verified: true,
		};
	}

	private async searchPriorArt(patent: PatentApplication): Promise<PriorArtReference[]> {
		// Simulate AI-powered prior art search
		// In production, this would use 0G Compute for distributed search
		return [];
	}

	private calculateNoveltyScore(references: PriorArtReference[]): number {
		if (references.length === 0) return 95;
		const avgRelevance = references.reduce((sum, ref) => sum + ref.relevanceScore, 0) / references.length;
		return Math.max(0, 100 - avgRelevance);
	}

	private generateAIAnalysis(patent: PatentApplication, references: PriorArtReference[]): string {
		if (references.length === 0) {
			return 'No highly relevant prior art found. Innovation appears novel.';
		}
		return `Analyzed ${references.length} prior art references. Innovation shows novelty in ${patent.innovation.solution}.`;
	}

	private identifyPotentialConflicts(references: PriorArtReference[]): string[] {
		return references
			.filter(ref => ref.relevanceScore > 70)
			.map(ref => `Potential overlap with ${ref.identifier}: ${ref.overlapAnalysis}`);
	}

	private async searchRelevantPatents(
		innovation: FreedomToOperate['targetInnovation'],
		jurisdiction: string[]
	): Promise<PriorArtReference[]> {
		// Simulate patent landscape search
		return [];
	}

	private assessFTORisk(patents: PriorArtReference[]): 'low' | 'medium' | 'high' {
		if (patents.length === 0) return 'low';
		const highRelevance = patents.filter(p => p.relevanceScore > 70);
		if (highRelevance.length > 3) return 'high';
		if (highRelevance.length > 0) return 'medium';
		return 'low';
	}

	private generateRiskSummary(patents: PriorArtReference[], risk: string): string {
		return `FTO risk assessed as ${risk}. Found ${patents.length} relevant patents in the landscape.`;
	}

	private generateFTORecommendations(patents: PriorArtReference[], risk: string): string[] {
		const recommendations = ['Conduct detailed claim analysis'];
		if (risk === 'high') {
			recommendations.push('Consider licensing existing patents');
			recommendations.push('Explore design-around strategies');
		}
		return recommendations;
	}

	private suggestDesignAroundStrategies(patents: PriorArtReference[]): string[] {
		return ['Modify technical approach to avoid claim scope'];
	}

	private suggestLicensingStrategies(patents: PriorArtReference[]): string[] {
		return ['Approach patent holders for licensing discussions'];
	}

	private suggestInvalidationStrategies(patents: PriorArtReference[]): string[] {
		return ['Review for potential invalidity arguments'];
	}

	private generateLegalOpinion(
		patents: PriorArtReference[],
		risk: string,
		attorney: { name: string; firm: string; barNumber: string; }
	): string {
		return `In the opinion of ${attorney.name} (${attorney.barNumber}), the FTO risk is ${risk}.`;
	}

	private async deployLicensingSmartContract(data: any): Promise<{ txHash: string; address: string; }> {
		return {
			txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
			address: `0x${Math.random().toString(16).substr(2, 40)}`,
		};
	}

	private async triggerSmartContractPayment(contractAddress: string, amount: number): Promise<void> {
		// Simulate smart contract payment execution
		console.log(`Payment of ${amount} triggered on contract ${contractAddress}`);
	}

	// ========================================================================
	// MOCK DATA INITIALIZATION
	// ========================================================================

	private initializeMockData(): void {
		// Mock Patent 1: AI-Powered Sepsis Prediction Algorithm
		const patent1: PatentApplication = {
			patentId: 'PAT-001',
			applicationNumber: 'US2024/123456',
			title: 'Artificial Intelligence System for Early Sepsis Detection and Prediction',
			abstract: 'A novel machine learning system that analyzes real-time patient data to predict sepsis onset 6-12 hours before clinical manifestation, enabling early intervention and improved patient outcomes.',
			
			inventors: [
				{
					name: 'Dr. Sarah Chen',
					affiliations: ['Massachusetts General Hospital', 'Harvard Medical School'],
					email: 'sarah.chen@mgh.harvard.edu',
					orcid: '0000-0002-1234-5678',
					contributions: ['Algorithm development', 'Clinical validation'],
					ownershipPercentage: 40,
				},
				{
					name: 'Dr. James Martinez',
					affiliations: ['Stanford University Medical Center'],
					email: 'j.martinez@stanford.edu',
					orcid: '0000-0003-2345-6789',
					contributions: ['Data analysis', 'Model optimization'],
					ownershipPercentage: 35,
				},
				{
					name: 'Dr. Emily Wang',
					affiliations: ['Johns Hopkins Hospital'],
					email: 'ewang@jhmi.edu',
					contributions: ['Clinical trial design', 'Validation studies'],
					ownershipPercentage: 25,
				},
			],
			
			assignees: [
				{
					name: 'Massachusetts General Hospital',
					type: 'institution',
					institutionId: 'INST-001',
					country: 'United States',
					ownershipPercentage: 50,
				},
				{
					name: 'Stanford University',
					type: 'institution',
					institutionId: 'INST-002',
					country: 'United States',
					ownershipPercentage: 30,
				},
				{
					name: 'Johns Hopkins University',
					type: 'institution',
					institutionId: 'INST-003',
					country: 'United States',
					ownershipPercentage: 20,
				},
			],
			
			classification: {
				ipcClass: 'G16H 50/20',
				cpcClass: 'G16H 50/20',
				usptoClass: '705',
				primaryField: 'Medical AI & Diagnostics',
				subFields: ['Critical Care', 'Predictive Analytics', 'Machine Learning'],
			},
			
			innovation: {
				type: 'software',
				description: 'Deep learning model trained on 50,000+ ICU patient records that integrates vital signs, laboratory values, and clinical notes to predict sepsis.',
				technicalProblem: 'Sepsis is difficult to detect early, leading to high mortality rates. Current detection methods rely on late-stage symptoms.',
				solution: 'Multi-modal AI system that identifies subtle patterns in patient data 6-12 hours before clinical sepsis criteria are met.',
				advantages: [
					'93% sensitivity and 91% specificity in validation studies',
					'6-12 hour early warning window',
					'Real-time continuous monitoring',
					'Integration with existing EHR systems',
					'Reduced false positive rate compared to existing systems',
				],
				potentialApplications: [
					'ICU patient monitoring',
					'Emergency department screening',
					'Post-surgical monitoring',
					'Remote patient monitoring',
					'Low-resource healthcare settings',
				],
			},
			
			claims: {
				independent: [
					{
						claimNumber: 1,
						claimText: 'A computer-implemented method for predicting sepsis in a patient comprising: receiving real-time physiological data; processing said data using a trained neural network; and generating a sepsis risk score with temporal prediction.',
						scope: 'broad',
					},
					{
						claimNumber: 15,
						claimText: 'A system for early sepsis detection comprising: data acquisition module, machine learning processor, and alert generation system configured to predict sepsis 6-12 hours in advance.',
						scope: 'broad',
					},
				],
				dependent: [
					{
						claimNumber: 2,
						claimText: 'The method of claim 1, wherein the neural network is a recurrent neural network with attention mechanism.',
						scope: 'medium',
						dependsOn: [1],
					},
					{
						claimNumber: 3,
						claimText: 'The method of claim 1, wherein the physiological data includes vital signs, laboratory values, and clinical notes.',
						scope: 'narrow',
						dependsOn: [1],
					},
				],
				totalCount: 24,
			},
			
			priorArt: {
				searchCompleted: true,
				searchDate: new Date('2024-01-15'),
				relevantReferences: [
					{
						referenceId: 'US10234567B2',
						type: 'patent',
						title: 'Early Warning System for Patient Deterioration',
						identifier: 'US10234567B2',
						date: new Date('2019-03-15'),
						inventors: ['Smith, J.', 'Johnson, M.'],
						abstract: 'System for detecting patient deterioration using vital signs monitoring.',
						relevanceScore: 65,
						overlapAnalysis: 'Different approach - uses traditional scoring systems rather than ML',
						citationImpact: 23,
					},
					{
						referenceId: 'WO2020123456',
						type: 'patent',
						title: 'Machine Learning for ICU Monitoring',
						identifier: 'WO2020123456',
						date: new Date('2020-06-20'),
						inventors: ['Lee, K.', 'Park, S.'],
						abstract: 'ML system for general ICU patient monitoring.',
						relevanceScore: 58,
						overlapAnalysis: 'General ICU monitoring, not sepsis-specific',
						citationImpact: 15,
					},
				],
				noveltyScore: 88,
				aiAnalysis: 'Strong novelty. Prior art focuses on general deterioration detection. This invention is specifically optimized for sepsis with validated 6-12 hour prediction window.',
				potentialConflicts: [],
			},
			
			filing: {
				jurisdiction: ['US', 'EP', 'CN', 'JP'],
				filingDate: new Date('2024-02-01'),
				publicationDate: new Date('2024-08-01'),
				priorityDate: new Date('2023-08-01'),
				pctApplication: 'PCT/US2024/012345',
				status: 'pending',
				examinerName: 'Jane Wilson',
			},
			
			collaboration: {
				collaborationId: 'COLLAB-003',
				institutions: ['INST-001', 'INST-002', 'INST-003'],
				ownershipSplit: [
					{ institutionId: 'INST-001', percentage: 50 },
					{ institutionId: 'INST-002', percentage: 30 },
					{ institutionId: 'INST-003', percentage: 20 },
				],
			},
			
			commercial: {
				marketSize: 4200000000, // $4.2B global sepsis diagnostics market
				targetMarket: ['Hospital ICUs', 'Emergency Departments', 'EHR Vendors'],
				competitors: ['Epic Sepsis Model', 'Philips Early Warning Score', 'GE Healthcare'],
				licensingInterest: 12,
				valuationEstimate: 45000000,
			},
			
			blockchainProof: {
				txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
				blockNumber: 8765432,
				timestamp: new Date('2024-02-01T10:30:00Z'),
				ipfsHash: 'QmX3fB9hK2nP7vQ8wR4eD5tC6yJ9mL1zN8xP4vT2aQ7bK5',
				verified: true,
			},
			
			createdAt: new Date('2024-01-10'),
			updatedAt: new Date('2024-09-15'),
		};

		// Mock Patent 2: Novel Cancer Immunotherapy Combination
		const patent2: PatentApplication = {
			patentId: 'PAT-002',
			applicationNumber: 'US2024/234567',
			title: 'Synergistic Combination of Checkpoint Inhibitors with Oncolytic Virus for Enhanced Anti-Tumor Immunity',
			abstract: 'A novel therapeutic combination comprising a PD-1 inhibitor and genetically engineered oncolytic virus that demonstrates synergistic anti-tumor effects in solid malignancies.',
			
			inventors: [
				{
					name: 'Dr. Robert Thompson',
					affiliations: ['MD Anderson Cancer Center'],
					email: 'rthompson@mdanderson.org',
					orcid: '0000-0004-3456-7890',
					contributions: ['Preclinical studies', 'Mechanism research'],
					ownershipPercentage: 45,
				},
				{
					name: 'Dr. Lisa Park',
					affiliations: ['Johns Hopkins University'],
					email: 'lpark@jhu.edu',
					contributions: ['Virus engineering', 'Safety studies'],
					ownershipPercentage: 35,
				},
				{
					name: 'Dr. Michael Zhang',
					affiliations: ['Dana-Farber Cancer Institute'],
					email: 'mzhang@dfci.harvard.edu',
					contributions: ['Clinical trial design'],
					ownershipPercentage: 20,
				},
			],
			
			assignees: [
				{
					name: 'University of Texas MD Anderson Cancer Center',
					type: 'institution',
					institutionId: 'INST-004',
					country: 'United States',
					ownershipPercentage: 60,
				},
				{
					name: 'Johns Hopkins University',
					type: 'institution',
					institutionId: 'INST-003',
					country: 'United States',
					ownershipPercentage: 40,
				},
			],
			
			classification: {
				ipcClass: 'A61K 31/00',
				cpcClass: 'A61K 31/00',
				usptoClass: '514',
				primaryField: 'Pharmaceuticals',
				subFields: ['Oncology', 'Immunotherapy', 'Gene Therapy'],
			},
			
			innovation: {
				type: 'combination',
				description: 'Combination therapy using anti-PD-1 antibody with oncolytic virus expressing immune-stimulatory cytokines.',
				technicalProblem: 'Many solid tumors are resistant to checkpoint inhibitor monotherapy due to immunosuppressive tumor microenvironment.',
				solution: 'Oncolytic virus selectively infects tumor cells, lyses them, and releases tumor antigens while expressing cytokines that overcome immunosuppression, synergizing with PD-1 blockade.',
				advantages: [
					'78% objective response rate in Phase 2 trials (vs 35% for PD-1 alone)',
					'Converts "cold" tumors to "hot" immunogenic tumors',
					'Manageable safety profile',
					'Applicable to multiple solid tumor types',
					'Long-lasting immune memory',
				],
				potentialApplications: [
					'Melanoma',
					'Non-small cell lung cancer',
					'Head and neck cancer',
					'Colorectal cancer',
					'Pancreatic cancer',
				],
			},
			
			claims: {
				independent: [
					{
						claimNumber: 1,
						claimText: 'A pharmaceutical composition comprising: (a) an anti-PD-1 antibody; and (b) an oncolytic virus encoding at least one immune-stimulatory cytokine, for use in treating solid tumors.',
						scope: 'broad',
					},
				],
				dependent: [
					{
						claimNumber: 2,
						claimText: 'The composition of claim 1, wherein the oncolytic virus is a modified herpes simplex virus.',
						scope: 'narrow',
						dependsOn: [1],
					},
					{
						claimNumber: 3,
						claimText: 'The composition of claim 1, wherein the immune-stimulatory cytokine is selected from IL-12, GM-CSF, and IFN-gamma.',
						scope: 'medium',
						dependsOn: [1],
					},
				],
				totalCount: 18,
			},
			
			priorArt: {
				searchCompleted: true,
				searchDate: new Date('2024-03-01'),
				relevantReferences: [
					{
						referenceId: 'US9876543B2',
						type: 'patent',
						title: 'PD-1 Antibody Compositions',
						identifier: 'US9876543B2',
						date: new Date('2018-05-20'),
						abstract: 'Anti-PD-1 antibodies for cancer immunotherapy.',
						relevanceScore: 45,
						overlapAnalysis: 'Covers PD-1 antibodies generally, not combination with oncolytic virus',
					},
				],
				noveltyScore: 92,
				aiAnalysis: 'Highly novel combination. No prior art describes this specific synergistic mechanism.',
				potentialConflicts: [],
			},
			
			filing: {
				jurisdiction: ['US', 'EP', 'CN', 'JP', 'KR'],
				filingDate: new Date('2024-04-01'),
				status: 'pending',
				pctApplication: 'PCT/US2024/023456',
			},
			
			commercial: {
				marketSize: 185000000000, // $185B global oncology market
				targetMarket: ['Oncology Centers', 'Pharmaceutical Companies', 'Biotech Firms'],
				competitors: ['BMS Opdivo', 'Merck Keytruda', 'Amgen Imlygic'],
				licensingInterest: 28,
				valuationEstimate: 350000000,
			},
			
			blockchainProof: {
				txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
				blockNumber: 8765440,
				timestamp: new Date('2024-04-01T14:20:00Z'),
				ipfsHash: 'QmY4gC0hL3oQ8xS9zA5fE6uD7kM2aO9yQ1bR8vU3cS4eN6',
				verified: true,
			},
			
			createdAt: new Date('2024-03-15'),
			updatedAt: new Date('2024-09-20'),
		};

		// Mock Patent 3: Wearable Continuous Glucose Monitor
		const patent3: PatentApplication = {
			patentId: 'PAT-003',
			applicationNumber: 'US2024/345678',
			title: 'Minimally Invasive Continuous Glucose Monitoring System with AI-Powered Insulin Dosing Recommendations',
			abstract: 'A wearable biosensor device for continuous glucose monitoring integrated with machine learning algorithms that provide real-time insulin dosing recommendations.',
			
			inventors: [
				{
					name: 'Dr. Jennifer Lee',
					affiliations: ['Stanford University'],
					email: 'jlee@stanford.edu',
					contributions: ['Device engineering', 'Algorithm development'],
					ownershipPercentage: 50,
				},
				{
					name: 'Dr. David Kumar',
					affiliations: ['UCSF'],
					email: 'dkumar@ucsf.edu',
					contributions: ['Clinical validation'],
					ownershipPercentage: 30,
				},
				{
					name: 'Sarah Johnson, PhD',
					affiliations: ['Stanford University'],
					email: 'sjohnson@stanford.edu',
					contributions: ['Sensor technology'],
					ownershipPercentage: 20,
				},
			],
			
			assignees: [
				{
					name: 'Stanford University',
					type: 'institution',
					institutionId: 'INST-002',
					country: 'United States',
					ownershipPercentage: 70,
				},
				{
					name: 'University of California San Francisco',
					type: 'institution',
					institutionId: 'INST-005',
					country: 'United States',
					ownershipPercentage: 30,
				},
			],
			
			classification: {
				ipcClass: 'A61B 5/145',
				cpcClass: 'A61B 5/14532',
				usptoClass: '600',
				primaryField: 'Medical Devices',
				subFields: ['Diabetes Management', 'Biosensors', 'Wearables'],
			},
			
			innovation: {
				type: 'device',
				description: 'Non-invasive wearable patch with microneedle array for continuous glucose sensing, integrated with smartphone app for AI-powered insulin recommendations.',
				technicalProblem: 'Current CGM devices require frequent calibration, have limited accuracy, and don\'t provide actionable insights for insulin dosing.',
				solution: 'Novel enzyme-based microneedle sensors with 14-day wear time, factory calibration, and integrated AI that learns individual patient patterns.',
				advantages: [
					'Mean absolute relative difference (MARD) of 8.2%',
					'No fingerstick calibration required',
					'14-day wear time',
					'Water resistant for swimming',
					'AI learns individual glycemic patterns',
					'Predictive alerts 30 minutes before hypo/hyperglycemia',
				],
				potentialApplications: [
					'Type 1 diabetes management',
					'Type 2 diabetes on insulin',
					'Gestational diabetes monitoring',
					'Hospital glucose monitoring',
					'Pre-diabetes screening',
				],
			},
			
			claims: {
				independent: [
					{
						claimNumber: 1,
						claimText: 'A wearable glucose monitoring device comprising: a microneedle sensor array, a wireless transmitter, and an AI processor configured to provide insulin dosing recommendations based on continuous glucose data.',
						scope: 'broad',
					},
				],
				dependent: [
					{
						claimNumber: 2,
						claimText: 'The device of claim 1, wherein the microneedle array comprises enzymatic glucose oxidase sensors.',
						scope: 'narrow',
						dependsOn: [1],
					},
				],
				totalCount: 16,
			},
			
			priorArt: {
				searchCompleted: true,
				searchDate: new Date('2024-05-01'),
				relevantReferences: [],
				noveltyScore: 85,
				aiAnalysis: 'Novel integration of long-wear microneedle sensors with AI dosing recommendations.',
				potentialConflicts: [],
			},
			
			filing: {
				jurisdiction: ['US', 'EP'],
				filingDate: new Date('2024-06-01'),
				status: 'pending',
			},
			
			commercial: {
				marketSize: 12500000000, // $12.5B CGM market
				targetMarket: ['Diabetes Patients', 'Hospitals', 'Device Manufacturers'],
				competitors: ['Dexcom G7', 'Abbott FreeStyle Libre', 'Medtronic Guardian'],
				licensingInterest: 15,
				valuationEstimate: 120000000,
			},
			
			blockchainProof: {
				txHash: '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
				blockNumber: 8765450,
				timestamp: new Date('2024-06-01T09:15:00Z'),
				ipfsHash: 'QmZ5hD1iM4pR9wT0bG6xE7vF8lO3cQ2dS9yL4mN6aP8jH7',
				verified: true,
			},
			
			inftTokenization: {
				tokenId: 'INFT-789012',
				contractAddress: '0x9876543210abcdef9876543210abcdef98765432',
				fractionalShares: 10000,
				pricePerShare: 500,
				listed: true,
			},
			
			createdAt: new Date('2024-05-20'),
			updatedAt: new Date('2024-10-01'),
		};

		this.patents.set(patent1.patentId, patent1);
		this.patents.set(patent2.patentId, patent2);
		this.patents.set(patent3.patentId, patent3);

		// Mock License 1: Sepsis AI to Hospital System
		const license1: LicensingAgreement = {
			agreementId: 'LIC-001',
			patentId: 'PAT-001',
			licensor: {
				name: 'Massachusetts General Hospital',
				institutionId: 'INST-001',
				type: 'institution',
			},
			licensee: {
				name: 'Epic Systems Corporation',
				type: 'company',
			},
			terms: {
				type: 'non-exclusive',
				territory: ['United States', 'Canada'],
				field: ['Electronic Health Records', 'Clinical Decision Support'],
				duration: 10,
				startDate: new Date('2024-07-01'),
				endDate: new Date('2034-06-30'),
			},
			financial: {
				upfrontFee: 2000000,
				royaltyRate: 5,
				minimumRoyalty: 500000,
				milestonePayments: [
					{
						milestone: 'Integration into Epic EHR',
						amount: 1000000,
						achieved: true,
						achievedDate: new Date('2024-08-15'),
						description: 'Successful integration and deployment in Epic production environment',
					},
					{
						milestone: '100 Hospital Deployments',
						amount: 2000000,
						achieved: false,
						description: 'Algorithm deployed in 100 hospital systems',
					},
					{
						milestone: '500 Hospital Deployments',
						amount: 5000000,
						achieved: false,
						description: 'Algorithm deployed in 500 hospital systems',
					},
				],
				currency: 'USD',
				totalRevenueGenerated: 3000000,
			},
			obligations: {
				developmentMilestones: [
					'Complete Epic EHR integration within 6 months',
					'Provide technical support and updates',
					'Annual performance reporting',
				],
				reportingRequirements: [
					'Quarterly deployment reports',
					'Annual revenue reports',
					'Clinical outcomes data sharing',
				],
				qualityStandards: [
					'Maintain >90% sensitivity and specificity',
					'99.9% uptime SLA',
					'HIPAA compliance',
				],
			},
			status: 'active',
			blockchainProof: {
				txHash: '0xabcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234',
				smartContractAddress: '0x1234abcd1234abcd1234abcd1234abcd1234abcd',
				timestamp: new Date('2024-07-01T10:00:00Z'),
			},
			createdAt: new Date('2024-06-15'),
		};

		// Mock License 2: Cancer Therapy to Biotech
		const license2: LicensingAgreement = {
			agreementId: 'LIC-002',
			patentId: 'PAT-002',
			licensor: {
				name: 'MD Anderson Cancer Center',
				institutionId: 'INST-004',
				type: 'institution',
			},
			licensee: {
				name: 'Regeneron Pharmaceuticals',
				type: 'company',
			},
			terms: {
				type: 'exclusive',
				territory: ['Worldwide'],
				field: ['Oncology', 'Immunotherapy'],
				duration: 15,
				startDate: new Date('2024-08-01'),
				endDate: new Date('2039-07-31'),
			},
			financial: {
				upfrontFee: 25000000,
				royaltyRate: 8,
				minimumRoyalty: 5000000,
				milestonePayments: [
					{
						milestone: 'IND Filing',
						amount: 10000000,
						achieved: true,
						achievedDate: new Date('2024-09-01'),
						description: 'Investigational New Drug application filed with FDA',
					},
					{
						milestone: 'Phase 1 Completion',
						amount: 15000000,
						achieved: false,
						description: 'Complete Phase 1 safety trials',
					},
					{
						milestone: 'Phase 2 Completion',
						amount: 25000000,
						achieved: false,
						description: 'Complete Phase 2 efficacy trials',
					},
					{
						milestone: 'Phase 3 Completion',
						amount: 50000000,
						achieved: false,
						description: 'Complete Phase 3 pivotal trials',
					},
					{
						milestone: 'FDA Approval',
						amount: 100000000,
						achieved: false,
						description: 'Receive FDA approval for first indication',
					},
				],
				currency: 'USD',
				totalRevenueGenerated: 35000000,
			},
			obligations: {
				developmentMilestones: [
					'File IND within 12 months',
					'Initiate Phase 1 within 18 months',
					'Regular development updates to licensor',
				],
				reportingRequirements: [
					'Semi-annual development progress reports',
					'Annual financial reports',
					'Clinical trial data sharing',
				],
				qualityStandards: [
					'GMP manufacturing',
					'FDA regulatory compliance',
					'Safety monitoring protocols',
				],
			},
			status: 'active',
			blockchainProof: {
				txHash: '0xef5678efef5678efef5678efef5678efef5678efef5678efef5678efef5678ef',
				smartContractAddress: '0x5678efab5678efab5678efab5678efab5678efab',
				timestamp: new Date('2024-08-01T14:30:00Z'),
			},
			createdAt: new Date('2024-07-20'),
		};

		this.licenses.set(license1.agreementId, license1);
		this.licenses.set(license2.agreementId, license2);

		// Mock IP Portfolios
		const portfolio1: IPPortfolio = {
			institutionId: 'INST-001',
			institutionName: 'Massachusetts General Hospital',
			patents: {
				granted: 12,
				pending: 8,
				totalApplications: 20,
			},
			commercialization: {
				licensed: 7,
				generating_revenue: 5,
				totalRevenue: 12500000,
				averageRoyaltyRate: 5.2,
			},
			topFields: [
				{ field: 'Medical AI', count: 5, revenue: 4200000 },
				{ field: 'Diagnostics', count: 4, revenue: 3100000 },
				{ field: 'Medical Devices', count: 3, revenue: 2800000 },
			],
			collaborativeIP: {
				multiInstitutionalPatents: 6,
				partners: ['Stanford', 'Johns Hopkins', 'MIT'],
				revenueSharing: 3200000,
			},
		};

		const portfolio2: IPPortfolio = {
			institutionId: 'INST-002',
			institutionName: 'Stanford University',
			patents: {
				granted: 18,
				pending: 12,
				totalApplications: 30,
			},
			commercialization: {
				licensed: 11,
				generating_revenue: 8,
				totalRevenue: 28000000,
				averageRoyaltyRate: 6.1,
			},
			topFields: [
				{ field: 'Medical Devices', count: 8, revenue: 12000000 },
				{ field: 'Health IT', count: 6, revenue: 9500000 },
				{ field: 'Diagnostics', count: 4, revenue: 6500000 },
			],
			collaborativeIP: {
				multiInstitutionalPatents: 9,
				partners: ['UCSF', 'MGH', 'Mayo Clinic'],
				revenueSharing: 7200000,
			},
		};

		this.portfolios.set(portfolio1.institutionId, portfolio1);
		this.portfolios.set(portfolio2.institutionId, portfolio2);
	}
}

// Export singleton instance
export const ipProtectionService = new IPProtectionService();
