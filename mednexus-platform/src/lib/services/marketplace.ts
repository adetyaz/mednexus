// Medical Intelligence INFT Marketplace Service
// Handles creation, trading, and validation of Medical Intelligence INFTs

import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface MedicalINFT {
	id: string;
	tokenId: number;
	title: string;
	description: string;
	specialty: string;
	category: 'diagnostic_protocol' | 'treatment_algorithm' | 'research_methodology' | 'specialist_consultation';
	creator: string;
	creatorCredentials: string[];
	price: string; // in A0GI
	royaltyPercentage: number;
	usageCount: number;
	rating: number;
	reviews: INFTReview[];
	tags: string[];
	medicalData: MedicalKnowledgeData;
	isVerified: boolean;
	verificationAuthority: string;
	createdDate: string;
	lastUpdated: string;
	isForSale: boolean;
	currentOwner: string;
	previousOwners: string[];
	usage: INFTUsage[];
}

export interface MedicalKnowledgeData {
	patientDemographics: string[];
	symptoms: string[];
	diagnosticCriteria: string[];
	treatmentProtocol: string[];
	expectedOutcomes: string[];
	contraindications: string[];
	evidenceLevel: 'A' | 'B' | 'C' | 'D';
	studyReferences: string[];
	successRate: number;
	sampleSize: number;
}

export interface INFTReview {
	id: string;
	reviewerId: string;
	reviewerCredentials: string[];
	rating: number;
	comment: string;
	verificationStatus: 'verified' | 'pending' | 'disputed';
	reviewDate: string;
	helpfulVotes: number;
}

export interface INFTUsage {
	id: string;
	userId: string;
	usageDate: string;
	usageType: 'consultation' | 'diagnosis' | 'treatment' | 'research';
	outcome: 'successful' | 'partially_successful' | 'unsuccessful' | 'pending';
	feedback: string;
	improvementSuggestions: string[];
}

export interface MarketplaceStats {
	totalINFTs: number;
	activeListings: number;
	totalVolume: string;
	averagePrice: string;
	topSpecialties: { specialty: string; count: number }[];
	recentSales: { inftId: string; price: string; date: string }[];
}

// Store for marketplace data
export const medicalINFTs = writable<MedicalINFT[]>([]);
export const marketplaceStats = writable<MarketplaceStats | null>(null);
export const userINFTs = writable<MedicalINFT[]>([]);

// Medical specialties for categorization
export const MEDICAL_SPECIALTIES = [
	'Cardiology',
	'Neurology', 
	'Oncology',
	'Radiology',
	'Pediatrics',
	'Dermatology',
	'Gastroenterology',
	'Endocrinology',
	'Psychiatry',
	'Emergency Medicine',
	'Orthopedics',
	'Ophthalmology',
	'Anesthesiology',
	'Pathology',
	'Surgery',
	'Internal Medicine',
	'Family Medicine',
	'Obstetrics & Gynecology',
	'Pulmonology',
	'Nephrology'
];

class MedicalINFTMarketplace {
	private infts: MedicalINFT[] = [];
	private userAddress: string | null = null;

	async initialize(userAddress?: string): Promise<void> {
		if (!browser) return;

		this.userAddress = userAddress || null;
		await this.loadMarketplaceData();
		await this.loadUserINFTs();
		this.updateMarketplaceStats();
	}

	// Load marketplace data (simulated - would connect to smart contract)
	private async loadMarketplaceData(): Promise<void> {
		// Simulate loading popular INFTs
		const sampleINFTs: MedicalINFT[] = [
			{
				id: 'inft_001',
				tokenId: 1,
				title: 'Advanced Cardiac Arrhythmia Diagnosis Protocol',
				description: 'Comprehensive diagnostic algorithm for complex cardiac arrhythmias with 95% accuracy rate',
				specialty: 'Cardiology',
				category: 'diagnostic_protocol',
				creator: '0x1234567890abcdef1234567890abcdef12345678',
				creatorCredentials: ['MD', 'Board Certified Cardiologist', 'Electrophysiology Fellowship'],
				price: '50.0',
				royaltyPercentage: 10,
				usageCount: 234,
				rating: 4.8,
				reviews: [],
				tags: ['arrhythmia', 'ECG', 'diagnosis', 'cardiology'],
				medicalData: {
					patientDemographics: ['Adults 18-80', 'All genders'],
					symptoms: ['Irregular heartbeat', 'Palpitations', 'Syncope'],
					diagnosticCriteria: ['12-lead ECG', 'Holter monitoring', 'Electrophysiology study'],
					treatmentProtocol: ['Risk stratification', 'Medication selection', 'Device therapy consideration'],
					expectedOutcomes: ['95% accurate diagnosis', 'Appropriate treatment selection'],
					contraindications: ['Severe hemodynamic instability', 'Active bleeding'],
					evidenceLevel: 'A',
					studyReferences: ['PMID: 12345678', 'PMID: 87654321'],
					successRate: 95,
					sampleSize: 1250
				},
				isVerified: true,
				verificationAuthority: 'American College of Cardiology',
				createdDate: '2024-06-01T00:00:00.000Z',
				lastUpdated: '2024-08-15T00:00:00.000Z',
				isForSale: true,
				currentOwner: '0x1234567890abcdef1234567890abcdef12345678',
				previousOwners: [],
				usage: []
			},
			{
				id: 'inft_002',
				tokenId: 2,
				title: 'Pediatric Pneumonia Treatment Algorithm',
				description: 'Evidence-based treatment protocol for pediatric pneumonia with antibiotic stewardship',
				specialty: 'Pediatrics',
				category: 'treatment_algorithm',
				creator: '0xabcdef1234567890abcdef1234567890abcdef12',
				creatorCredentials: ['MD', 'Board Certified Pediatrician', 'Infectious Disease Specialist'],
				price: '35.0',
				royaltyPercentage: 12,
				usageCount: 189,
				rating: 4.9,
				reviews: [],
				tags: ['pediatrics', 'pneumonia', 'antibiotic', 'treatment'],
				medicalData: {
					patientDemographics: ['Children 0-18 years'],
					symptoms: ['Cough', 'Fever', 'Difficulty breathing'],
					diagnosticCriteria: ['Chest X-ray', 'Clinical assessment', 'Laboratory studies'],
					treatmentProtocol: ['Antibiotic selection', 'Dosing guidelines', 'Duration of therapy'],
					expectedOutcomes: ['Clinical improvement in 48-72 hours', 'Reduced resistance'],
					contraindications: ['Known drug allergies', 'Severe immunocompromise'],
					evidenceLevel: 'A',
					studyReferences: ['PMID: 11111111', 'PMID: 22222222'],
					successRate: 92,
					sampleSize: 890
				},
				isVerified: true,
				verificationAuthority: 'American Academy of Pediatrics',
				createdDate: '2024-07-01T00:00:00.000Z',
				lastUpdated: '2024-08-20T00:00:00.000Z',
				isForSale: true,
				currentOwner: '0xabcdef1234567890abcdef1234567890abcdef12',
				previousOwners: [],
				usage: []
			}
		];

		this.infts = sampleINFTs;
		medicalINFTs.set(this.infts);
	}

	// Load user's owned INFTs
	private async loadUserINFTs(): Promise<void> {
		if (!this.userAddress) {
			userINFTs.set([]);
			return;
		}

		const userOwnedINFTs = this.infts.filter(inft => 
			inft.currentOwner.toLowerCase() === this.userAddress?.toLowerCase()
		);
		
		userINFTs.set(userOwnedINFTs);
	}

	// Update marketplace statistics
	private updateMarketplaceStats(): void {
		const stats: MarketplaceStats = {
			totalINFTs: this.infts.length,
			activeListings: this.infts.filter(inft => inft.isForSale).length,
			totalVolume: this.calculateTotalVolume(),
			averagePrice: this.calculateAveragePrice(),
			topSpecialties: this.getTopSpecialties(),
			recentSales: this.getRecentSales()
		};

		marketplaceStats.set(stats);
	}

	// Create new Medical Intelligence INFT
	async createINFT(inftData: Partial<MedicalINFT>): Promise<string> {
		if (!this.userAddress) {
			throw new Error('User wallet not connected');
		}

		const newINFT: MedicalINFT = {
			id: `inft_${Date.now()}`,
			tokenId: this.infts.length + 1,
			title: inftData.title || '',
			description: inftData.description || '',
			specialty: inftData.specialty || '',
			category: inftData.category || 'diagnostic_protocol',
			creator: this.userAddress,
			creatorCredentials: inftData.creatorCredentials || [],
			price: inftData.price || '0',
			royaltyPercentage: inftData.royaltyPercentage || 10,
			usageCount: 0,
			rating: 0,
			reviews: [],
			tags: inftData.tags || [],
			medicalData: inftData.medicalData || this.getDefaultMedicalData(),
			isVerified: false,
			verificationAuthority: '',
			createdDate: new Date().toISOString(),
			lastUpdated: new Date().toISOString(),
			isForSale: inftData.isForSale || false,
			currentOwner: this.userAddress,
			previousOwners: [],
			usage: []
		};

		// Simulate blockchain transaction
		await this.simulateTransaction('create', newINFT.id);

		this.infts.push(newINFT);
		medicalINFTs.set(this.infts);
		this.updateMarketplaceStats();
		await this.loadUserINFTs();

		return newINFT.id;
	}

	// Purchase INFT
	async purchaseINFT(inftId: string): Promise<boolean> {
		if (!this.userAddress) {
			throw new Error('User wallet not connected');
		}

		const inft = this.infts.find(i => i.id === inftId);
		if (!inft) {
			throw new Error('INFT not found');
		}

		if (!inft.isForSale) {
			throw new Error('INFT is not for sale');
		}

		// Simulate blockchain transaction
		await this.simulateTransaction('purchase', inftId);

		// Update ownership
		inft.previousOwners.push(inft.currentOwner);
		inft.currentOwner = this.userAddress;
		inft.isForSale = false;

		medicalINFTs.set(this.infts);
		this.updateMarketplaceStats();
		await this.loadUserINFTs();

		return true;
	}

	// List INFT for sale
	async listINFTForSale(inftId: string, price: string): Promise<boolean> {
		if (!this.userAddress) {
			throw new Error('User wallet not connected');
		}

		const inft = this.infts.find(i => i.id === inftId);
		if (!inft) {
			throw new Error('INFT not found');
		}

		if (inft.currentOwner.toLowerCase() !== this.userAddress.toLowerCase()) {
			throw new Error('You do not own this INFT');
		}

		// Simulate blockchain transaction
		await this.simulateTransaction('list', inftId);

		inft.isForSale = true;
		inft.price = price;
		inft.lastUpdated = new Date().toISOString();

		medicalINFTs.set(this.infts);
		this.updateMarketplaceStats();

		return true;
	}

	// Add review to INFT
	async addReview(inftId: string, rating: number, comment: string): Promise<boolean> {
		if (!this.userAddress) {
			throw new Error('User wallet not connected');
		}

		const inft = this.infts.find(i => i.id === inftId);
		if (!inft) {
			throw new Error('INFT not found');
		}

		const review: INFTReview = {
			id: `review_${Date.now()}`,
			reviewerId: this.userAddress,
			reviewerCredentials: [], // Would fetch from medical authority service
			rating,
			comment,
			verificationStatus: 'pending',
			reviewDate: new Date().toISOString(),
			helpfulVotes: 0
		};

		inft.reviews.push(review);
		inft.rating = this.calculateAverageRating(inft.reviews);

		medicalINFTs.set(this.infts);
		return true;
	}

	// Search INFTs
	searchINFTs(query: string, filters?: {
		specialty?: string;
		category?: string;
		priceRange?: [number, number];
		verified?: boolean;
	}): MedicalINFT[] {
		let results = this.infts;

		// Text search
		if (query.trim()) {
			const searchTerm = query.toLowerCase();
			results = results.filter(inft => 
				inft.title.toLowerCase().includes(searchTerm) ||
				inft.description.toLowerCase().includes(searchTerm) ||
				inft.tags.some(tag => tag.toLowerCase().includes(searchTerm))
			);
		}

		// Apply filters
		if (filters) {
			if (filters.specialty) {
				results = results.filter(inft => inft.specialty === filters.specialty);
			}
			if (filters.category) {
				results = results.filter(inft => inft.category === filters.category);
			}
			if (filters.priceRange) {
				results = results.filter(inft => {
					const price = parseFloat(inft.price);
					return price >= filters.priceRange![0] && price <= filters.priceRange![1];
				});
			}
			if (filters.verified !== undefined) {
				results = results.filter(inft => inft.isVerified === filters.verified);
			}
		}

		return results;
	}

	// Get trending INFTs
	getTrendingINFTs(): MedicalINFT[] {
		return [...this.infts]
			.sort((a, b) => (b.usageCount * b.rating) - (a.usageCount * a.rating))
			.slice(0, 10);
	}

	// Private helper methods
	private async simulateTransaction(type: string, inftId: string): Promise<void> {
		// Simulate blockchain transaction delay
		await new Promise(resolve => setTimeout(resolve, 2000));
		console.log(`Simulated ${type} transaction for INFT ${inftId}`);
	}

	private calculateTotalVolume(): string {
		const total = this.infts.reduce((sum, inft) => {
			return sum + (parseFloat(inft.price) * inft.usageCount);
		}, 0);
		return total.toFixed(2);
	}

	private calculateAveragePrice(): string {
		const forSale = this.infts.filter(inft => inft.isForSale);
		if (forSale.length === 0) return '0';
		
		const average = forSale.reduce((sum, inft) => sum + parseFloat(inft.price), 0) / forSale.length;
		return average.toFixed(2);
	}

	private getTopSpecialties(): { specialty: string; count: number }[] {
		const specialtyCounts = this.infts.reduce((acc, inft) => {
			acc[inft.specialty] = (acc[inft.specialty] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);

		return Object.entries(specialtyCounts)
			.map(([specialty, count]) => ({ specialty, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 5);
	}

	private getRecentSales(): { inftId: string; price: string; date: string }[] {
		// Simulate recent sales data
		return [
			{ inftId: 'inft_001', price: '50.0', date: new Date().toISOString() },
			{ inftId: 'inft_002', price: '35.0', date: new Date(Date.now() - 86400000).toISOString() }
		];
	}

	private calculateAverageRating(reviews: INFTReview[]): number {
		if (reviews.length === 0) return 0;
		const sum = reviews.reduce((total, review) => total + review.rating, 0);
		return Math.round((sum / reviews.length) * 10) / 10;
	}

	private getDefaultMedicalData(): MedicalKnowledgeData {
		return {
			patientDemographics: [],
			symptoms: [],
			diagnosticCriteria: [],
			treatmentProtocol: [],
			expectedOutcomes: [],
			contraindications: [],
			evidenceLevel: 'C',
			studyReferences: [],
			successRate: 0,
			sampleSize: 0
		};
	}
}

// Export singleton service
export const medicalINFTMarketplace = new MedicalINFTMarketplace();

// Helper functions
export function formatPrice(price: string): string {
	const num = parseFloat(price);
	return `${num.toFixed(2)} A0GI`;
}

export function formatRating(rating: number): string {
	return `${rating.toFixed(1)}/5.0`;
}

export function formatUsageCount(count: number): string {
	if (count < 1000) return count.toString();
	if (count < 1000000) return `${(count / 1000).toFixed(1)}k`;
	return `${(count / 1000000).toFixed(1)}M`;
}

export function getEvidenceLevelDescription(level: string): string {
	const descriptions = {
		'A': 'High-quality randomized controlled trials',
		'B': 'Well-conducted observational studies',
		'C': 'Expert opinion and case studies',
		'D': 'Preliminary or conflicting evidence'
	};
	return descriptions[level as keyof typeof descriptions] || 'Unknown evidence level';
}
