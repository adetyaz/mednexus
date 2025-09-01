/**
 * Medical Intelligence INFT Service
 * Implements Day 4: Medical Intelligence INFT testing and revenue sharing
 * From Wave 2 weekly plan
 */

import { ethers } from 'ethers';

// Import deployed contract ABI
import MedicalIntelligenceINFTABI from '../../../ABIs/MedicalIntelligenceINFT.json';

export interface MedicalCase {
	caseId: string;
	title: string;
	description: string;
	patientData: {
		age: number;
		gender: string;
		symptoms: string[];
		medicalHistory: string[];
	};
	diagnosticData: {
		labResults: string[];
		imagingResults: string[];
		geneticMarkers: string[];
	};
	metadata: {
		hospitalId: string;
		department: string;
		specialty: string;
		timestamp: number;
		urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
	};
}

export interface INFTCreationResult {
	tokenId: string;
	transactionHash: string;
	ipfsUri: string;
	medicalCaseHash: string;
	revenueShare: number;
}

export interface ExpertResponse {
	expertId: string;
	institutionId: string;
	expertise: string[];
	response: {
		diagnosis: string;
		confidence: number;
		treatment: string;
		reasoning: string;
		additionalTests: string[];
	};
	revenueEarned: number;
	timestamp: number;
}

class MedicalIntelligenceINFTService {
	private contract: ethers.Contract | null = null;
	private contractAddress: string = '0x123'; // Will be updated with actual deployed address
	private isInitialized: boolean = false;

	constructor() {
		// Service will be initialized when needed
	}

	/**
	 * Initialize the Medical Intelligence INFT contract connection
	 */
	async initialize(signer: ethers.Signer): Promise<void> {
		try {
			console.log('🔗 Connecting to Medical Intelligence INFT contract...');

			// Read deployed contract address from deployment file
			const deploymentData = await this.loadDeploymentData();
			this.contractAddress = deploymentData.contractAddress;

			// Connect to contract
			this.contract = new ethers.Contract(this.contractAddress, MedicalIntelligenceINFTABI, signer);

			this.isInitialized = true;
			console.log('✅ Medical Intelligence INFT service initialized');
			console.log(`📋 Contract Address: ${this.contractAddress}`);
		} catch (error) {
			console.error('❌ Failed to initialize INFT service:', error);
			throw new Error('Medical Intelligence INFT initialization failed');
		}
	}

	/**
	 * Load deployment data from the deployment files
	 */
	private async loadDeploymentData(): Promise<{ contractAddress: string }> {
		try {
			// In a real implementation, this would read from the deployment files
			// For now, return the expected format
			return {
				contractAddress: '0x123' // This will be replaced with actual deployed address
			};
		} catch {
			throw new Error('Failed to load deployment data');
		}
	}

	/**
	 * Create a Medical Intelligence INFT from a medical case
	 */
	async createMedicalINFT(medicalCase: MedicalCase): Promise<INFTCreationResult> {
		if (!this.isInitialized || !this.contract) {
			throw new Error('Service not initialized');
		}

		try {
			console.log(`🏥 Creating Medical Intelligence INFT for case: ${medicalCase.title}`);

			// 1. Prepare medical case metadata
			const medicalMetadata = {
				caseId: medicalCase.caseId,
				title: medicalCase.title,
				description: medicalCase.description,
				specialty: medicalCase.metadata.specialty,
				urgencyLevel: medicalCase.metadata.urgencyLevel,
				timestamp: medicalCase.metadata.timestamp,
				patientDataHash: await this.hashSensitiveData(medicalCase.patientData),
				diagnosticDataHash: await this.hashSensitiveData(medicalCase.diagnosticData)
			};

			// 2. Upload metadata to IPFS (simulated)
			const ipfsUri = await this.uploadToIPFS(medicalMetadata);

			// 3. Calculate medical case hash for blockchain
			const medicalCaseHash = await this.calculateCaseHash(medicalCase);

			// 4. Define revenue sharing (30% to original hospital, 70% to responding experts)
			const revenueShare = 30; // 30% to original hospital

			// 5. Create INFT on blockchain
			console.log('⛓️ Minting Medical Intelligence INFT on blockchain...');

			// Simulate contract interaction
			const simulatedTx = {
				hash: `0x${Math.random().toString(16).substring(2)}`,
				tokenId: Date.now().toString()
			};

			const result: INFTCreationResult = {
				tokenId: simulatedTx.tokenId,
				transactionHash: simulatedTx.hash,
				ipfsUri,
				medicalCaseHash,
				revenueShare
			};

			console.log('✅ Medical Intelligence INFT created successfully:', {
				tokenId: result.tokenId,
				caseTitle: medicalCase.title,
				specialty: medicalCase.metadata.specialty
			});

			return result;
		} catch (error) {
			console.error('❌ Failed to create Medical Intelligence INFT:', error);
			throw new Error(`INFT creation failed: ${error}`);
		}
	}

	/**
	 * Submit expert response to a Medical Intelligence INFT
	 */
	async submitExpertResponse(
		tokenId: string,
		expertResponse: Omit<ExpertResponse, 'revenueEarned' | 'timestamp'>
	): Promise<ExpertResponse> {
		if (!this.isInitialized || !this.contract) {
			throw new Error('Service not initialized');
		}

		try {
			console.log(`🩺 Submitting expert response for token ID: ${tokenId}`);

			// Calculate revenue earned based on response quality and timing
			const revenueEarned = this.calculateExpertRevenue(expertResponse.response.confidence);

			// Submit response to blockchain (simulated)
			console.log('⛓️ Recording expert response on blockchain...');

			const completeResponse: ExpertResponse = {
				...expertResponse,
				revenueEarned,
				timestamp: Date.now()
			};

			console.log('✅ Expert response submitted successfully:', {
				expertId: completeResponse.expertId,
				diagnosis: completeResponse.response.diagnosis,
				confidence: completeResponse.response.confidence,
				revenueEarned: completeResponse.revenueEarned
			});

			return completeResponse;
		} catch (error) {
			console.error('❌ Failed to submit expert response:', error);
			throw new Error(`Expert response submission failed: ${error}`);
		}
	}

	/**
	 * Get all expert responses for a Medical Intelligence INFT
	 */
	async getExpertResponses(tokenId: string): Promise<ExpertResponse[]> {
		if (!this.isInitialized || !this.contract) {
			throw new Error('Service not initialized');
		}

		try {
			console.log(`📖 Retrieving expert responses for token ID: ${tokenId}`);

			// In real implementation, this would query the blockchain
			// For now, return simulated responses
			const responses: ExpertResponse[] = [
				{
					expertId: 'expert_001',
					institutionId: 'johns_hopkins',
					expertise: ['cardiology', 'interventional_cardiology'],
					response: {
						diagnosis: 'Acute myocardial infarction with ST elevation',
						confidence: 95,
						treatment: 'Immediate percutaneous coronary intervention',
						reasoning: 'ECG shows ST elevation in leads II, III, aVF indicating inferior STEMI',
						additionalTests: ['Troponin levels', 'Echocardiogram', 'Coronary angiography']
					},
					revenueEarned: 150,
					timestamp: Date.now() - 3600000
				}
			];

			console.log(`✅ Retrieved ${responses.length} expert responses`);
			return responses;
		} catch (error) {
			console.error('❌ Failed to retrieve expert responses:', error);
			throw new Error(`Expert response retrieval failed: ${error}`);
		}
	}

	/**
	 * Calculate expert revenue based on response quality
	 */
	private calculateExpertRevenue(confidence: number): number {
		// Base revenue: $100
		// Confidence bonus: up to $100 additional based on confidence score
		const baseRevenue = 100;
		const confidenceBonus = (confidence / 100) * 100;

		return Math.round(baseRevenue + confidenceBonus);
	}

	/**
	 * Hash sensitive patient data for privacy
	 */
	private async hashSensitiveData(data: Record<string, unknown>): Promise<string> {
		const dataString = JSON.stringify(data);
		const encoder = new TextEncoder();
		const dataBuffer = encoder.encode(dataString);
		const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
	}

	/**
	 * Calculate unique hash for medical case
	 */
	private async calculateCaseHash(medicalCase: MedicalCase): Promise<string> {
		const caseString = JSON.stringify({
			caseId: medicalCase.caseId,
			title: medicalCase.title,
			metadata: medicalCase.metadata
		});

		const encoder = new TextEncoder();
		const dataBuffer = encoder.encode(caseString);
		const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
	}

	/**
	 * Upload metadata to IPFS (simulated)
	 */
	private async uploadToIPFS(metadata: Record<string, unknown>): Promise<string> {
		// In real implementation, this would upload to IPFS
		// For now, return a simulated IPFS URI
		const hash = await this.hashSensitiveData(metadata);
		return `ipfs://Qm${hash.substring(0, 44)}`;
	}

	/**
	 * Get contract status and statistics
	 */
	async getContractStatus(): Promise<{
		isConnected: boolean;
		contractAddress: string;
		networkInfo: string;
		totalINFTs: number;
	}> {
		try {
			return {
				isConnected: this.isInitialized,
				contractAddress: this.contractAddress,
				networkInfo: '0G Chain Testnet',
				totalINFTs: 42 // Simulated count
			};
		} catch {
			return {
				isConnected: false,
				contractAddress: 'N/A',
				networkInfo: 'Disconnected',
				totalINFTs: 0
			};
		}
	}
}

// Export singleton instance
export const medicalINFTService = new MedicalIntelligenceINFTService();
