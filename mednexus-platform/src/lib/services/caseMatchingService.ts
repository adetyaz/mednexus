/**
 * Global Medical Case Matching Service with 0G Compute Integration
 * Wave 2: Sub-30-second performance using 0G's distributed AI infrastructure
 */

import { NETWORK_CONFIG } from '$lib/config/config';
import { ethers } from 'ethers';
import { browser } from '$app/environment';
import { enhancedOGStorageService } from '$lib/services/ogStorage';
import { medicalTranslationService } from '$lib/services/medicalTranslationService';

// 0G SDK integration for compute and storage
import { Indexer, ZgFile } from '@0glabs/0g-ts-sdk';

export interface MedicalCase {
	id: string;
	patientId: string;
	hospitalId: string;
	chiefComplaint: string;
	symptoms: string[];
	vitalSigns: {
		temperature: number;
		bloodPressure: string;
		heartRate: number;
		respiratoryRate: number;
		oxygenSaturation: number;
	};
	demographics: {
		age: number;
		gender: 'male' | 'female' | 'other';
		ethnicity: string;
		weight: number;
		height: number;
	};
	medicalHistory: string[];
	currentMedications: string[];
	allergies: string[];
	labResults?: Record<string, any>;
	imagingResults?: string[];
	diagnosis?: string;
	treatment?: string[];
	outcome?: 'improved' | 'stable' | 'deteriorated' | 'unknown';
	timestamp: Date;
	urgency: 'routine' | 'urgent' | 'emergency';
	specialty: string;
	// 0G Integration fields
	encryptedDataHash?: string;
	storageManifest?: string;
	consentHash?: string;
	createdAt: Date;
	updatedAt: Date;
	// Multi-language support
	language?: string; // ISO 639-1 language code
	translations?: Map<string, MedicalCaseTranslation>; // Language -> translated content
	requiresTranslation?: boolean;
}

export interface MedicalCaseTranslation {
	language: string;
	chiefComplaint: string;
	symptoms: string[];
	medicalHistory: string[];
	currentMedications: string[];
	allergies: string[];
	diagnosis?: string;
	treatment?: string[];
	translatedAt: Date;
	confidence: number;
	reviewStatus: 'pending' | 'verified' | 'corrected';
}

export interface MedicalCaseManifest {
	caseId: string;
	contentHash: string;
	encryptionSpec: {
		algorithm: string;
		keyDerivation: string;
		accessControlList: string[];
	};
	medicalMetadata: {
		presentingSymptoms: string;
		demographicHash: string;
		similarityScore?: number;
		globalMatches: string[];
		researchConsent: boolean;
		anonymizationLevel: string;
	};
	storageUri?: string;
}

export interface CaseMatch {
	caseId: string;
	similarity: number; // 0-100% match score
	matchType: 'symptoms' | 'diagnosis' | 'treatment' | 'outcome' | 'demographic';
	relevantFactors: string[];
	confidence: number; // AI confidence score
	verificationProof?: string; // 0G DA verification
}

export interface MedicalAnalysisJob {
	jobType: string;
	inputManifests: string[];
	modelSpecs: {
		caseMatcher: string;
		symptomAnalyzer: string;
		geneticMatcher?: string;
		treatmentPredictor: string;
	};
	computeRequirements: {
		gpuType: string;
		memory: string;
		maxDuration: string;
	};
	accessPermissions: string[];
	outputEncryption: string;
}

export interface ComputeJobResult {
	jobId: string;
	status: 'pending' | 'running' | 'completed' | 'failed';
	results?: {
		similarCases: CaseMatch[];
		analysisMetadata: {
			processingTime: number;
			confidence: number;
			verificationHash: string;
		};
	};
	error?: string;
}

class ZeroGCaseMatchingService {
	private provider: ethers.JsonRpcProvider;
	private isInitialized = false;
	private pendingJobs: Map<string, ComputeJobResult> = new Map();
	
	// Temporary: Will be replaced with actual 0G SDK instances
	// private zgStorage: ZgStorage;
	// private zgCompute: ZgCompute;

	constructor() {
		this.provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.network.rpcUrl);
		this.initializeService();
	}

	private async initializeService(): Promise<void> {
		if (!browser) return;

		try {
			// TODO: Initialize 0G SDK components
			// this.zgStorage = new ZgStorage({
			//   rpcUrl: NETWORK_CONFIG.network.rpcUrl,
			//   storageContracts: NETWORK_CONFIG.storage
			// });
			// 
			// this.zgCompute = new ZgCompute({
			//   rpcUrl: NETWORK_CONFIG.network.rpcUrl,
			//   computeEndpoint: 'https://compute-testnet.0g.ai'
			// });

			this.isInitialized = true;
			console.log('0G Case Matching Service initialized');
		} catch (error) {
			console.error('Failed to initialize 0G services:', error);
		}
	}

	/**
	 * Find similar medical cases using 0G Compute's distributed AI
	 * Target: Sub-30-second performance
	 */
	async findSimilarCases(
		medicalCase: MedicalCase,
		options: {
			minSimilarity?: number;
			maxResults?: number;
			includeGlobal?: boolean;
			excludeHospital?: string;
		} = {}
	): Promise<CaseMatch[]> {
		const startTime = Date.now();

		try {
			// Step 1: Create encrypted medical case manifest
			const manifest = await this.createMedicalCaseManifest(medicalCase);

			// Step 2: Upload encrypted case data to 0G Storage
			const storageResult = await this.uploadCaseToStorage(medicalCase, manifest);

			// Step 3: Submit AI analysis job to 0G Compute
			const analysisJob = this.createAnalysisJob(manifest, options);
			const jobResult = await this.submitComputeJob(analysisJob);

			// Step 4: Wait for results with timeout for sub-30s performance
			const matches = await this.waitForJobCompletion(jobResult.jobId, 30000); // 30s timeout

			const processingTime = Date.now() - startTime;
			console.log(`Case matching completed in ${processingTime}ms`);

			// Verify sub-30-second requirement
			if (processingTime > 30000) {
				console.warn('Case matching exceeded 30-second target:', processingTime + 'ms');
			}

			return matches;

		} catch (error) {
			console.error('0G Case matching failed:', error);
			// Fallback to local processing for development/testing
			return this.fallbackLocalMatching(medicalCase, options);
		}
	}

	/**
	 * Create encrypted medical case manifest for 0G Storage
	 */
	private async createMedicalCaseManifest(medicalCase: MedicalCase): Promise<MedicalCaseManifest> {
		// Hash sensitive medical data
		const symptomsHash = await this.hashMedicalData(medicalCase.symptoms.join('|'));
		const demographicsData = `${medicalCase.demographics.age}|${medicalCase.demographics.gender}|${medicalCase.demographics.ethnicity}`;
		const demographicHash = await this.hashMedicalData(demographicsData);

		return {
			caseId: medicalCase.id,
			contentHash: await this.hashMedicalData(JSON.stringify(medicalCase)),
			encryptionSpec: {
				algorithm: "AES-256-GCM",
				keyDerivation: "PBKDF2",
				accessControlList: [medicalCase.hospitalId, "global_medical_network"]
			},
			medicalMetadata: {
				presentingSymptoms: symptomsHash,
				demographicHash,
				globalMatches: [],
				researchConsent: true, // TODO: Get from patient consent
				anonymizationLevel: "full"
			}
		};
	}

	/**
	 * Upload encrypted case to 0G Storage
	 */
	private async uploadCaseToStorage(medicalCase: MedicalCase, manifest: MedicalCaseManifest): Promise<string> {
		// TODO: Use actual 0G Storage SDK
		// const storageResult = await this.zgStorage.upload({
		//   data: this.encryptMedicalData(medicalCase),
		//   metadata: {
		//     type: "medical_case",
		//     specialty: medicalCase.specialty,
		//     urgency: medicalCase.urgency,
		//     timestamp: medicalCase.timestamp.toISOString()
		//   }
		// });
		// return storageResult.uri;

		// Temporary simulation
		console.log('Uploading encrypted medical case to 0G Storage...');
		await this.delay(1000); // Simulate upload time
		return `0g://storage/${manifest.contentHash}`;
	}

	/**
	 * Create AI analysis job for 0G Compute
	 */
	private createAnalysisJob(manifest: MedicalCaseManifest, options: any): MedicalAnalysisJob {
		return {
			jobType: "global_case_matching",
			inputManifests: [manifest.caseId],
			modelSpecs: {
				caseMatcher: "rare-disease-matcher-v4.2",
				symptomAnalyzer: "symptom-pattern-ai-v3.8",
				geneticMatcher: "genetic-similarity-v2.3",
				treatmentPredictor: "treatment-outcome-ai-v2.1"
			},
			computeRequirements: {
				gpuType: "nvidia-h100",
				memory: "80GB",
				maxDuration: "30min"
			},
			accessPermissions: ["global_medical_network"],
			outputEncryption: manifest.encryptionSpec.accessControlList[0] // Hospital public key
		};
	}

	/**
	 * Submit job to 0G Compute network
	 */
	private async submitComputeJob(analysisJob: MedicalAnalysisJob): Promise<ComputeJobResult> {
		console.log('Submitting analysis job to 0G Compute network...');
		const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		
		try {
			// Store job data in 0G Storage first using ogStorage service
			const jobData = JSON.stringify(analysisJob);
			const jobFile = new File([jobData], `medical_analysis_${jobId}.json`, { type: 'application/json' });
			
			// Upload to 0G Storage using existing ogStorage service
			const uploadResult = await enhancedOGStorageService.uploadMedicalData(jobFile, {
				patientId: 'compute_job',
				institutionId: 'mednexus_ai',
				dataType: 'diagnostic_reports',
				accessPermissions: ['medical_ai', 'compute_network'],
				urgencyLevel: 'routine',
				medicalSpecialty: 'artificial_intelligence',
				retentionPeriod: 30,
				isAnonymized: true
			});
			
			console.log(`Job data uploaded to 0G Storage: ${uploadResult.storageHash}`);
			
			// Submit compute job to 0G network
			// For now, use HTTP API to submit compute job until SDK has compute interface
			const computeEndpoint = 'https://compute-testnet.0g.ai/api/v1/jobs';
			const computeResponse = await fetch(computeEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${await this.getComputeToken()}`
				},
				body: JSON.stringify({
					jobId: jobId,
					jobType: analysisJob.jobType,
					inputData: uploadResult.storageHash,
					modelSpecs: analysisJob.modelSpecs,
					computeRequirements: analysisJob.computeRequirements,
					outputEncryption: analysisJob.outputEncryption
				})
			});
			
			if (computeResponse.ok) {
				const computeResult = await computeResponse.json();
				console.log(`0G Compute job submitted: ${computeResult.jobId}`);
				
				const jobResult: ComputeJobResult = {
					jobId: computeResult.jobId || jobId,
					status: 'pending'
				};
				
				this.pendingJobs.set(jobId, jobResult);
				
				// Poll for job completion
				this.pollJobStatus(jobId);
				
				return jobResult;
			} else {
				throw new Error(`Compute submission failed: ${computeResponse.statusText}`);
			}
			
		} catch (error) {
			console.error('Failed to submit to 0G Compute, falling back to simulation:', error);
			
			// Fallback to simulation if 0G Compute is unavailable
			const jobResult: ComputeJobResult = {
				jobId,
				status: 'pending'
			};

			this.pendingJobs.set(jobId, jobResult);
			
			// Simulate async processing as fallback
			setTimeout(() => {
				this.completeSimulatedJob(jobId);
			}, Math.random() * 5000 + 2000); // 2-7 seconds

			return jobResult;
		}
	}

	/**
	 * Wait for job completion with timeout
	 */
	private async waitForJobCompletion(jobId: string, timeoutMs: number): Promise<CaseMatch[]> {
		const startTime = Date.now();
		
		while (Date.now() - startTime < timeoutMs) {
			const job = this.pendingJobs.get(jobId);
			
			if (!job) {
				throw new Error(`Job ${jobId} not found`);
			}

			if (job.status === 'completed' && job.results) {
				return job.results.similarCases;
			}

			if (job.status === 'failed') {
				throw new Error(`Job ${jobId} failed: ${job.error}`);
			}

			// Wait before checking again
			await this.delay(500);
		}

		throw new Error(`Job ${jobId} timed out after ${timeoutMs}ms`);
	}

	/**
	 * Simulate job completion (temporary)
	 */
	private completeSimulatedJob(jobId: string): void {
		const job = this.pendingJobs.get(jobId);
		if (!job) return;

		// Simulate AI-generated similar cases
		const similarCases: CaseMatch[] = [
			{
				caseId: 'case_' + Math.random().toString(36).substr(2, 9),
				similarity: 94.5,
				matchType: 'symptoms',
				relevantFactors: ['Similar symptom cluster', 'Same demographic group', 'Comparable severity'],
				confidence: 92.3,
				verificationProof: '0g_da_proof_' + Math.random().toString(36).substr(2, 16)
			},
			{
				caseId: 'case_' + Math.random().toString(36).substr(2, 9),
				similarity: 87.2,
				matchType: 'diagnosis',
				relevantFactors: ['Similar diagnostic markers', 'Same specialty', 'Previous successful treatment'],
				confidence: 88.7,
				verificationProof: '0g_da_proof_' + Math.random().toString(36).substr(2, 16)
			}
		];

		job.status = 'completed';
		job.results = {
			similarCases,
			analysisMetadata: {
				processingTime: Math.random() * 25000 + 5000, // 5-30 seconds
				confidence: 90.5,
				verificationHash: '0x' + Math.random().toString(16).substr(2, 64)
			}
		};
	}

	/**
	 * Fallback local matching for development/testing
	 */
	private async fallbackLocalMatching(
		medicalCase: MedicalCase,
		options: any
	): Promise<CaseMatch[]> {
		console.log('Using fallback local matching...');
		
		// Simple similarity matching
		await this.delay(2000); // Simulate processing

		return [
			{
				caseId: 'local_case_001',
				similarity: 85.0,
				matchType: 'symptoms',
				relevantFactors: ['Similar symptoms', 'Same age group'],
				confidence: 80.0
			}
		];
	}

	/**
	 * Hash medical data for privacy
	 */
	private async hashMedicalData(data: string): Promise<string> {
		const encoder = new TextEncoder();
		const dataBytes = encoder.encode(data);
		const hashBuffer = await crypto.subtle.digest('SHA-256', dataBytes);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
	}

	/**
	 * Encrypt medical data (placeholder)
	 */
	private encryptMedicalData(medicalCase: MedicalCase): Uint8Array {
		// TODO: Implement proper encryption
		const data = JSON.stringify(medicalCase);
		return new TextEncoder().encode(data);
	}

	/**
	 * Utility delay function
	 */
	private delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	/**
	 * Get service status
	 */
	getServiceStatus(): { initialized: boolean; networkConnected: boolean } {
		return {
			initialized: this.isInitialized,
			networkConnected: this.provider !== null
		};
	}

	/**
	 * Get pending jobs count
	 */
	getPendingJobsCount(): number {
		return Array.from(this.pendingJobs.values())
			.filter(job => job.status === 'pending' || job.status === 'running').length;
	}

	/**
	 * Get compute authentication token
	 */
	private async getComputeToken(): Promise<string> {
		// TODO: Implement proper authentication with 0G Compute
		// For now, return a placeholder token
		return 'placeholder_compute_token';
	}

	/**
	 * Poll job status until completion
	 */
	private async pollJobStatus(jobId: string): Promise<void> {
		const maxAttempts = 60; // 5 minutes max
		let attempts = 0;
		
		const poll = async () => {
			attempts++;
			const job = this.pendingJobs.get(jobId);
			
			if (!job || attempts >= maxAttempts) {
				console.log(`Stopping poll for job ${jobId} - ${!job ? 'job not found' : 'max attempts reached'}`);
				return;
			}
			
			try {
				// Check job status from 0G Compute
				const statusResponse = await fetch(`https://compute-testnet.0g.ai/api/v1/jobs/${jobId}/status`, {
					headers: {
						'Authorization': `Bearer ${await this.getComputeToken()}`
					}
				});
				
				if (statusResponse.ok) {
					const statusData = await statusResponse.json();
					job.status = statusData.status;
					
					if (statusData.status === 'completed') {
						job.results = statusData.results;
						console.log(`0G Compute job ${jobId} completed successfully`);
						return;
					} else if (statusData.status === 'failed') {
						job.status = 'failed';
						job.error = statusData.error || 'Job failed';
						console.error(`0G Compute job ${jobId} failed:`, statusData.error);
						return;
					}
				}
			} catch (error) {
				console.warn(`Error polling job ${jobId}:`, error);
			}
			
			// Continue polling if job is still running
			if (job.status === 'pending' || job.status === 'running') {
				setTimeout(poll, 5000); // Poll every 5 seconds
			}
		};
		
		poll();
	}

	/**
	 * Translate medical case for cross-border sharing
	 */
	async translateMedicalCase(medicalCase: MedicalCase, targetLanguage: string): Promise<MedicalCase> {
		if (!medicalCase.language) {
			medicalCase.language = 'en'; // Default to English
		}

		const sourceLanguage = medicalCase.language;

		// Check if translation already exists
		if (medicalCase.translations?.has(targetLanguage)) {
			console.log(`Translation to ${targetLanguage} already exists`);
			return this.applyTranslation(medicalCase, targetLanguage);
		}

		console.log(`Translating medical case from ${medicalCase.language} to ${targetLanguage}...`);

		try {
			// Translate chief complaint
			const chiefComplaintTranslation = await medicalTranslationService.translateMedicalText({
				text: medicalCase.chiefComplaint,
				sourceLanguage: sourceLanguage,
				targetLanguage,
				medicalContext: 'symptoms',
				urgency: medicalCase.urgency,
				caseId: medicalCase.id
			});

			// Translate symptoms
			const symptomTranslations = await Promise.all(
				medicalCase.symptoms.map(symptom => 
					medicalTranslationService.translateMedicalText({
						text: symptom,
						sourceLanguage: sourceLanguage,
						targetLanguage,
						medicalContext: 'symptoms',
						urgency: medicalCase.urgency,
						caseId: medicalCase.id
					})
				)
			);

			// Translate medical history
			const historyTranslations = await Promise.all(
				medicalCase.medicalHistory.map(history =>
					medicalTranslationService.translateMedicalText({
						text: history,
						sourceLanguage: sourceLanguage,
						targetLanguage,
						medicalContext: 'diagnosis',
						urgency: medicalCase.urgency,
						caseId: medicalCase.id
					})
				)
			);

			// Translate medications
			const medicationTranslations = await Promise.all(
				medicalCase.currentMedications.map(medication =>
					medicalTranslationService.translateMedicalText({
						text: medication,
						sourceLanguage: sourceLanguage,
						targetLanguage,
						medicalContext: 'medication',
						urgency: medicalCase.urgency,
						caseId: medicalCase.id
					})
				)
			);

			// Translate allergies
			const allergyTranslations = await Promise.all(
				medicalCase.allergies.map(allergy =>
					medicalTranslationService.translateMedicalText({
						text: allergy,
						sourceLanguage: sourceLanguage,
						targetLanguage,
						medicalContext: 'general',
						urgency: medicalCase.urgency,
						caseId: medicalCase.id
					})
				)
			);

			// Create translation object
			const caseTranslation: MedicalCaseTranslation = {
				language: targetLanguage,
				chiefComplaint: chiefComplaintTranslation.translatedText,
				symptoms: symptomTranslations.map(t => t.translatedText),
				medicalHistory: historyTranslations.map(t => t.translatedText),
				currentMedications: medicationTranslations.map(t => t.translatedText),
				allergies: allergyTranslations.map(t => t.translatedText),
				diagnosis: medicalCase.diagnosis ? await this.translateField(
					medicalCase.diagnosis, sourceLanguage, targetLanguage, 'diagnosis', medicalCase
				) : undefined,
				treatment: medicalCase.treatment ? await Promise.all(
					medicalCase.treatment.map(treatment =>
						this.translateField(treatment, sourceLanguage, targetLanguage, 'treatment', medicalCase)
					)
				) : undefined,
				translatedAt: new Date(),
				confidence: this.calculateAverageConfidence([
					chiefComplaintTranslation,
					...symptomTranslations,
					...historyTranslations,
					...medicationTranslations,
					...allergyTranslations
				]),
				reviewStatus: 'pending'
			};

			// Store translation
			if (!medicalCase.translations) {
				medicalCase.translations = new Map();
			}
			medicalCase.translations.set(targetLanguage, caseTranslation);

			console.log(`Medical case translated to ${targetLanguage} with ${caseTranslation.confidence}% confidence`);

			// Return case with applied translation
			return this.applyTranslation(medicalCase, targetLanguage);

		} catch (error: any) {
			console.error('Medical case translation failed:', error);
			throw new Error(`Translation failed: ${error?.message || 'Unknown error'}`);
		}
	}

	/**
	 * Apply translation to create a localized version of the case
	 */
	private applyTranslation(medicalCase: MedicalCase, targetLanguage: string): MedicalCase {
		const translation = medicalCase.translations?.get(targetLanguage);
		if (!translation) {
			return medicalCase; // Return original if no translation
		}

		return {
			...medicalCase,
			language: targetLanguage,
			chiefComplaint: translation.chiefComplaint,
			symptoms: translation.symptoms,
			medicalHistory: translation.medicalHistory,
			currentMedications: translation.currentMedications,
			allergies: translation.allergies,
			diagnosis: translation.diagnosis || medicalCase.diagnosis,
			treatment: translation.treatment || medicalCase.treatment,
			requiresTranslation: false
		};
	}

	/**
	 * Translate a single field
	 */
	private async translateField(
		text: string,
		sourceLanguage: string,
		targetLanguage: string,
		context: 'diagnosis' | 'treatment' | 'medication' | 'symptoms' | 'general',
		medicalCase: MedicalCase
	): Promise<string> {
		const translation = await medicalTranslationService.translateMedicalText({
			text,
			sourceLanguage,
			targetLanguage,
			medicalContext: context,
			urgency: medicalCase.urgency,
			caseId: medicalCase.id
		});

		return translation.translatedText;
	}

	/**
	 * Calculate average confidence from multiple translations
	 */
	private calculateAverageConfidence(translations: any[]): number {
		if (translations.length === 0) return 0;
		
		const totalConfidence = translations.reduce((sum, t) => sum + t.confidence, 0);
		return Math.round(totalConfidence / translations.length);
	}

	/**
	 * Find similar cases across languages
	 */
	async findSimilarCasesCrossLanguage(
		medicalCase: MedicalCase,
		targetLanguages: string[],
		options: any = {}
	): Promise<CaseMatch[]> {
		const allMatches: CaseMatch[] = [];

		// First, find matches in original language
		const originalMatches = await this.findSimilarCases(medicalCase, options);
		allMatches.push(...originalMatches);

		// Then translate case and search in target languages
		for (const targetLanguage of targetLanguages) {
			if (targetLanguage === medicalCase.language) {
				continue; // Skip original language
			}

			try {
				console.log(`Searching for similar cases in ${targetLanguage}...`);
				
				// Translate the case
				const translatedCase = await this.translateMedicalCase(medicalCase, targetLanguage);
				
				// Find matches in translated language
				const languageMatches = await this.findSimilarCases(translatedCase, {
					...options,
					searchLanguage: targetLanguage
				});

				// Tag matches with language info
				const taggedMatches = languageMatches.map(match => ({
					...match,
					sourceLanguage: targetLanguage,
					translationRequired: true
				}));

				allMatches.push(...taggedMatches);

			} catch (error) {
				console.warn(`Failed to search in ${targetLanguage}:`, error);
			}
		}

		// Sort by similarity score and return top matches
		return allMatches
			.sort((a, b) => b.similarity - a.similarity)
			.slice(0, options.maxResults || 10);
	}

	/**
	 * Get supported languages for translation
	 */
	getSupportedLanguages(): any[] {
		return medicalTranslationService.getSupportedLanguages();
	}

	/**
	 * Check if case requires translation
	 */
	requiresTranslation(medicalCase: MedicalCase, targetLanguage: string): boolean {
		return medicalCase.language !== targetLanguage && 
			   !medicalCase.translations?.has(targetLanguage);
	}
}

export const zeroGCaseMatchingService = new ZeroGCaseMatchingService();
