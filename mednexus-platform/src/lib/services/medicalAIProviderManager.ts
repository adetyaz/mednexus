import type { PatternMatch } from './patternRecognitionService';
import { patternRecognitionService } from './patternRecognitionService';

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

	constructor() {
		// 0G Compute is the primary provider - no additional initialization needed
		console.log('🤖 MedicalAIProviderManager initialized with 0G Compute');
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

			// Currently only 0G Compute is supported
			if (provider !== '0g-compute') {
				console.warn(`⚠️ Provider ${provider} not available, falling back to 0G Compute`);
			}

			const analysisResult = await patternRecognitionService.analyzeCase(medicalInput);
			return {
				patterns: analysisResult.identifiedPatterns || [],
				usedProvider: '0g-compute',
				success: true
			};

		} catch (error: any) {
			console.error(`❌ 0G Compute analysis failed:`, error.message);
			
			return {
				patterns: [],
				usedProvider: '0g-compute',
				success: false,
				error: error.message
			};
		}
	}

	getAvailableProviders(): AIProviderStatus[] {
		return [
			{
				provider: '0g-compute',
				available: true,
				configured: true,
				displayName: '0G Compute Network',
				description: 'DeepSeek R1-70B via 0G Compute Network'
			}
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