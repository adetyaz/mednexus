import type { PatternMatch } from './patternRecognitionService';
import { patternRecognitionService } from './patternRecognitionService';
import { HuggingFaceMedicalAnalysis } from './huggingFaceMedicalAnalysis';
import { GroqMedicalIntelligence } from './groqMedicalIntelligence';

export type AIProvider = '0g-compute' | 'huggingface' | 'groq';

export interface AIProviderStatus {
	provider: AIProvider;
	available: boolean;
	configured: boolean;
	displayName: string;
	description: string;
}

export class MedicalAIProviderManager {
	private currentProvider: AIProvider = '0g-compute';
	private huggingFaceService: HuggingFaceMedicalAnalysis | null = null;
	private groqService: GroqMedicalIntelligence | null = null;

	constructor() {
		this.initializeServices();
	}

	private initializeServices(): void {
		// Initialize HuggingFace service if configured
		this.huggingFaceService = HuggingFaceMedicalAnalysis.createFromEnvironment();
		
		// Initialize Groq service if configured
		this.groqService = GroqMedicalIntelligence.createFromEnvironment();
	}

	async analyzeMedicalCase(medicalInput: any, preferredProvider?: AIProvider): Promise<{
		patterns: PatternMatch[];
		usedProvider: AIProvider;
		success: boolean;
		error?: string;
	}> {
		const provider = preferredProvider || this.currentProvider;
		
		try {
			console.log(`🤖 Attempting medical analysis with ${provider}...`);

			switch (provider) {
				case '0g-compute':
					const analysisResult = await patternRecognitionService.analyzeCase(medicalInput);
					return {
						patterns: analysisResult.identifiedPatterns || [],
						usedProvider: '0g-compute',
						success: true
					};

				case 'huggingface':
					if (!this.huggingFaceService) {
						throw new Error('HuggingFace service not configured');
					}
					const hfPatterns = await this.huggingFaceService.analyzeMedicalCase(medicalInput);
					return {
						patterns: hfPatterns,
						usedProvider: 'huggingface',
						success: true
					};

				case 'groq':
					if (!this.groqService) {
						throw new Error('Groq service not configured');
					}
					const groqPatterns = await this.groqService.analyzeMedicalCase(medicalInput);
					return {
						patterns: groqPatterns,
						usedProvider: 'groq',
						success: true
					};

				default:
					throw new Error(`Unknown AI provider: ${provider}`);
			}

		} catch (error: any) {
			console.error(`❌ ${provider} analysis failed:`, error.message);
			
			// Try fallback providers if the primary fails
			if (provider === '0g-compute') {
				console.log('🔄 Attempting fallback to alternative AI providers...');
				
				// Try Groq first (usually faster)
				if (this.groqService) {
					try {
						const groqPatterns = await this.groqService.analyzeMedicalCase(medicalInput);
						return {
							patterns: groqPatterns,
							usedProvider: 'groq',
							success: true
						};
					} catch (groqError) {
						console.warn('Groq fallback also failed:', groqError);
					}
				}

				// Try HuggingFace as final fallback
				if (this.huggingFaceService) {
					try {
						const hfPatterns = await this.huggingFaceService.analyzeMedicalCase(medicalInput);
						return {
							patterns: hfPatterns,
							usedProvider: 'huggingface',
							success: true
						};
					} catch (hfError) {
						console.warn('HuggingFace fallback also failed:', hfError);
					}
				}
			}

			return {
				patterns: [],
				usedProvider: provider,
				success: false,
				error: error.message
			};
		}
	}

	getAvailableProviders(): AIProviderStatus[] {
		return [
			{
				provider: '0g-compute',
				available: true, // Always attempt 0G
				configured: true,
				displayName: '0G Compute Network',
				description: 'DeepSeek R1-70B via 0G Compute Network'
			},
			// {
			// 	provider: 'huggingface',
			// 	available: !!this.huggingFaceService,
			// 	configured: HuggingFaceMedicalAnalysis.isConfigured(),
			// 	displayName: 'HuggingFace AI',
			// 	description: 'Free medical AI analysis via HuggingFace'
			// },
			// {
			// 	provider: 'groq',
			// 	available: !!this.groqService,
			// 	configured: GroqMedicalIntelligence.isConfigured(),
			// 	displayName: 'Groq Intelligence',
			// 	description: 'Fast medical AI inference via Groq'
			// }
		];
	}

	setCurrentProvider(provider: AIProvider): void {
		this.currentProvider = provider;
		console.log(`🤖 AI Provider switched to: ${provider}`);
	}

	getCurrentProvider(): AIProvider {
		return this.currentProvider;
	}

	isProviderAvailable(provider: AIProvider): boolean {
		const status = this.getAvailableProviders().find(p => p.provider === provider);
		return status?.available || false;
	}

	getProviderDisplayName(provider: AIProvider): string {
		const status = this.getAvailableProviders().find(p => p.provider === provider);
		return status?.displayName || provider;
	}
}

// Singleton instance
export const medicalAIManager = new MedicalAIProviderManager();