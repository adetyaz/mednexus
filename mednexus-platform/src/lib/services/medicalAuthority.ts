// Medical Authority Network Service
// Manages global medical licensing and credential validation

import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { ethers } from 'ethers';
import { NETWORK_CONFIG } from '$lib/config/config.js';
import MedicalVerificationABI from '../../../ABIs/MedicalVerification.json';

export interface MedicalAuthority {
	id: string;
	name: string;
	country: string;
	region: string;
	type: 'licensing_board' | 'medical_association' | 'hospital_network' | 'university';
	credentials: string[];
	verificationEndpoint: string;
	isActive: boolean;
	joinedDate: string;
}

export interface MedicalCredential {
	id: string;
	authorityId: string;
	credentialType: 'medical_license' | 'specialty_board' | 'hospital_affiliation' | 'research_qualification';
	holderName: string;
	licenseNumber: string;
	specialty?: string;
	institution?: string;
	issuedDate: string;
	expiryDate: string;
	verificationHash: string;
	isVerified: boolean;
}

// Medical Authority Store
export const medicalAuthorities = writable<MedicalAuthority[]>([]);
export const verifiedCredentials = writable<MedicalCredential[]>([]);

// Global Medical Authorities Database
const GLOBAL_MEDICAL_AUTHORITIES: MedicalAuthority[] = [
	{
		id: 'us-fsmb',
		name: 'Federation of State Medical Boards',
		country: 'United States',
		region: 'North America',
		type: 'licensing_board',
		credentials: ['medical_license', 'specialty_board'],
		verificationEndpoint: 'https://api.fsmb.org/verify',
		isActive: true,
		joinedDate: '2024-01-01'
	},
	{
		id: 'uk-gmc',
		name: 'General Medical Council',
		country: 'United Kingdom',
		region: 'Europe',
		type: 'licensing_board',
		credentials: ['medical_license', 'specialty_board'],
		verificationEndpoint: 'https://api.gmc-uk.org/verify',
		isActive: true,
		joinedDate: '2024-01-15'
	},
	{
		id: 'canada-cpso',
		name: 'College of Physicians and Surgeons of Ontario',
		country: 'Canada',
		region: 'North America',
		type: 'licensing_board',
		credentials: ['medical_license'],
		verificationEndpoint: 'https://api.cpso.on.ca/verify',
		isActive: true,
		joinedDate: '2024-02-01'
	},
	{
		id: 'australia-ahpra',
		name: 'Australian Health Practitioner Regulation Agency',
		country: 'Australia',
		region: 'Oceania',
		type: 'licensing_board',
		credentials: ['medical_license', 'specialty_board'],
		verificationEndpoint: 'https://api.ahpra.gov.au/verify',
		isActive: true,
		joinedDate: '2024-02-15'
	},
	{
		id: 'germany-baek',
		name: 'Bundesärztekammer',
		country: 'Germany',
		region: 'Europe',
		type: 'medical_association',
		credentials: ['medical_license'],
		verificationEndpoint: 'https://api.bundesaerztekammer.de/verify',
		isActive: true,
		joinedDate: '2024-03-01'
	},
	{
		id: 'japan-jma',
		name: 'Japan Medical Association',
		country: 'Japan',
		region: 'Asia',
		type: 'medical_association',
		credentials: ['medical_license'],
		verificationEndpoint: 'https://api.med.or.jp/verify',
		isActive: true,
		joinedDate: '2024-03-15'
	},
	{
		id: 'who-global',
		name: 'World Health Organization',
		country: 'Global',
		region: 'International',
		type: 'medical_association',
		credentials: ['research_qualification', 'specialty_board'],
		verificationEndpoint: 'https://api.who.int/verify',
		isActive: true,
		joinedDate: '2024-01-01'
	}
];

class MedicalAuthorityService {
	private authorities: MedicalAuthority[] = [];
	private credentials: MedicalCredential[] = [];

	async initialize(): Promise<void> {
		if (!browser) return;

		// Load global authorities
		this.authorities = [...GLOBAL_MEDICAL_AUTHORITIES];
		medicalAuthorities.set(this.authorities);

		// Load any stored credentials
		const storedCredentials = localStorage.getItem('mednexus_credentials');
		if (storedCredentials) {
			this.credentials = JSON.parse(storedCredentials);
			verifiedCredentials.set(this.credentials);
		}
	}

	// Get all active medical authorities
	getActiveAuthorities(): MedicalAuthority[] {
		return this.authorities.filter(auth => auth.isActive);
	}

	// Get authorities by region
	getAuthoritiesByRegion(region: string): MedicalAuthority[] {
		return this.authorities.filter(auth => 
			auth.region === region && auth.isActive
		);
	}

	// Get authorities by country
	getAuthoritiesByCountry(country: string): MedicalAuthority[] {
		return this.authorities.filter(auth => 
			auth.country === country && auth.isActive
		);
	}

	// Verify medical credential
	async verifyCredential(credential: Partial<MedicalCredential>): Promise<boolean> {
		if (!credential.authorityId || !credential.licenseNumber) {
			throw new Error('Authority ID and license number required');
		}

		const authority = this.authorities.find(auth => auth.id === credential.authorityId);
		if (!authority) {
			throw new Error('Medical authority not found');
		}

		// Simulate credential verification
		// In real implementation, this would call the authority's API
		const isValid = await this.simulateCredentialVerification(authority, credential);
		
		if (isValid && credential.holderName) {
			const verifiedCredential: MedicalCredential = {
				id: `cred_${Date.now()}`,
				authorityId: credential.authorityId,
				credentialType: credential.credentialType || 'medical_license',
				holderName: credential.holderName,
				licenseNumber: credential.licenseNumber,
				specialty: credential.specialty,
				institution: credential.institution,
				issuedDate: credential.issuedDate || new Date().toISOString(),
				expiryDate: credential.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
				verificationHash: this.generateVerificationHash(credential),
				isVerified: true
			};

			this.credentials.push(verifiedCredential);
			this.saveCredentials();
			verifiedCredentials.set(this.credentials);
		}

		return isValid;
	}

	// Simulate credential verification (would be real API calls in production)
	private async simulateCredentialVerification(
		authority: MedicalAuthority, 
		credential: Partial<MedicalCredential>
	): Promise<boolean> {
		// Simulate API delay
		await new Promise(resolve => setTimeout(resolve, 1000));

		// Simulate verification logic
		// Real implementation would call authority.verificationEndpoint
		if (credential.licenseNumber && credential.licenseNumber.length >= 6) {
			// Simulate 95% success rate for valid-looking license numbers
			return Math.random() > 0.05;
		}
		
		return false;
	}

	// Generate verification hash for credential
	private generateVerificationHash(credential: Partial<MedicalCredential>): string {
		const data = `${credential.authorityId}_${credential.licenseNumber}_${credential.holderName}`;
		// Simple hash simulation - in production would use proper cryptographic hash
		return btoa(data).slice(0, 16);
	}

	// Save credentials to local storage
	private saveCredentials(): void {
		if (browser) {
			localStorage.setItem('mednexus_credentials', JSON.stringify(this.credentials));
		}
	}

	// Get verified credentials for a holder
	getCredentialsForHolder(holderName: string): MedicalCredential[] {
		return this.credentials.filter(cred => 
			cred.holderName === holderName && cred.isVerified
		);
	}

	// Check if holder has valid medical license
	hasValidMedicalLicense(holderName: string): boolean {
		return this.credentials.some(cred => 
			cred.holderName === holderName && 
			cred.credentialType === 'medical_license' && 
			cred.isVerified &&
			new Date(cred.expiryDate) > new Date()
		);
	}

	// Get statistics
	getNetworkStats() {
		return {
			totalAuthorities: this.authorities.length,
			activeAuthorities: this.authorities.filter(auth => auth.isActive).length,
			regionsCovered: [...new Set(this.authorities.map(auth => auth.region))].length,
			countriesCovered: [...new Set(this.authorities.map(auth => auth.country))].length,
			totalCredentials: this.credentials.length,
			verifiedCredentials: this.credentials.filter(cred => cred.isVerified).length,
			medicalLicenses: this.credentials.filter(cred => cred.credentialType === 'medical_license').length,
			specialtyBoards: this.credentials.filter(cred => cred.credentialType === 'specialty_board').length
		};
	}
}

// Export singleton service
export const medicalAuthorityService = new MedicalAuthorityService();

// Helper functions
export function formatCredentialType(type: string): string {
	const types = {
		'medical_license': 'Medical License',
		'specialty_board': 'Specialty Board Certification',
		'hospital_affiliation': 'Hospital Affiliation',
		'research_qualification': 'Research Qualification'
	};
	return types[type as keyof typeof types] || type;
}

export function formatAuthorityType(type: string): string {
	const types = {
		'licensing_board': 'Medical Licensing Board',
		'medical_association': 'Medical Association',
		'hospital_network': 'Hospital Network',
		'university': 'Medical University'
	};
	return types[type as keyof typeof types] || type;
}

export function isCredentialExpiringSoon(credential: MedicalCredential, daysThreshold = 90): boolean {
	const expiryDate = new Date(credential.expiryDate);
	const thresholdDate = new Date();
	thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
	return expiryDate <= thresholdDate;
}

// Blockchain Medical Verification Service
export class BlockchainMedicalVerificationService {
	private provider: ethers.JsonRpcProvider;
	private contract?: ethers.Contract;
	private isInitialized = false;

	constructor() {
		this.provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.network.rpcUrl);
	}

	async init(): Promise<void> {
		try {
			// Initialize contract connection
			this.contract = new ethers.Contract(
				NETWORK_CONFIG.contracts.medicalVerification,
				MedicalVerificationABI as any,
				this.provider
			);

			// Test connection
			const networkInfo = await this.provider.getNetwork();
			console.log('Connected to medical verification contract on:', networkInfo.name);
			
			this.isInitialized = true;
		} catch (error) {
			console.error('Failed to initialize blockchain verification service:', error);
			throw error;
		}
	}

	async verifyCredentialOnChain(credentialHash: string): Promise<boolean> {
		if (!this.isInitialized || !this.contract) {
			throw new Error('Blockchain verification service not initialized');
		}

		try {
			// Call the smart contract to verify credential
			const isVerified = await this.contract.isCredentialVerified(credentialHash);
			console.log('Blockchain verification result:', isVerified);
			return isVerified;
		} catch (error) {
			console.error('Blockchain verification failed:', error);
			return false;
		}
	}

	async getVerificationHistory(address: string): Promise<any[]> {
		if (!this.isInitialized || !this.contract) {
			throw new Error('Blockchain verification service not initialized');
		}

		try {
			// Get verification events from blockchain
			const filter = this.contract.filters.CredentialVerified(null, address);
			const events = await this.contract.queryFilter(filter);
			
			return events.map((event: any) => ({
				credentialHash: event.args?.[0],
				verifier: event.args?.[1],
				timestamp: event.args?.[2],
				blockNumber: event.blockNumber,
				transactionHash: event.transactionHash
			}));
		} catch (error) {
			console.error('Failed to get verification history:', error);
			return [];
		}
	}
}

// Global instance
export const blockchainVerificationService = new BlockchainMedicalVerificationService();
