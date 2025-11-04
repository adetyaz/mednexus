/**
 * 0G Compute Service
 * Implements the official 0G Compute SDK for AI inference
 * Based on: https://docs.0g.ai/developer-hub/building-on-0g/compute-network/sdk
 */

import { ethers } from 'ethers';
import { browser } from '$app/environment';
import { NETWORK_CONFIG } from '$lib/config/config';

// Import 0G Compute SDK
import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';

export interface ComputeService {
	provider: string;
	serviceType: string;
	url: string;
	inputPrice: bigint;
	outputPrice: bigint;
	model: string;
	verifiability: string;
}

export interface ComputeRequestOptions {
	providerAddress: string;
	messages: Array<{ role: string; content: string }>;
	model?: string;
}

export interface ComputeResponse {
	success: boolean;
	content?: string;
	chatId?: string;
	error?: string;
	isValid?: boolean;
}

export class OGComputeService {
	private broker: any = null;
	private provider: ethers.JsonRpcProvider;
	private wallet: ethers.Wallet | null = null;
	private isInitialized = false;

	// Official 0G service providers
	private readonly OFFICIAL_SERVICES = {
		'gpt-oss-120b': '0xf07240Efa67755B5311bc75784a061eDB47165Dd',
		'deepseek-r1-70b': '0x3feE5a4dd5FDb8a32dDA97Bed899830605dBD9D3'
	};

	constructor() {
		// Use mainnet
		const rpcUrl = NETWORK_CONFIG.network.rpcUrl || 'https://evmrpc.0g.ai';
		this.provider = new ethers.JsonRpcProvider(rpcUrl);
	}

	async initialize(privateKey?: string): Promise<void> {
		if (!browser) return;

		try {
			// Check if user has MetaMask/wallet connected
			if (!privateKey && typeof window !== 'undefined' && (window as any).ethereum) {
				console.log('🔧 Connecting to user wallet (MetaMask)...');
				
				// Request account access
				await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
				
				// Create ethers provider from MetaMask
				const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
				const signer = await browserProvider.getSigner();
				
				console.log('📍 Connected wallet address:', await signer.getAddress());
				
				// Create broker using user's wallet signer
				this.broker = await createZGComputeNetworkBroker(signer);
				this.wallet = null; // Not using Wallet, using Signer instead
				
			} else if (privateKey) {
				// Use provided private key
				this.wallet = new ethers.Wallet(privateKey, this.provider);
				console.log('🔧 Initializing with provided private key...');
				console.log('📍 Wallet address:', this.wallet.address);
				
				// Create broker using wallet
				this.broker = await createZGComputeNetworkBroker(this.wallet);
			} else {
				throw new Error('No wallet available. Please connect MetaMask or provide a private key.');
			}
			
			this.isInitialized = true;
			console.log('✅ 0G Compute broker initialized with real wallet');
		} catch (error) {
			console.error('Failed to initialize 0G Compute broker:', error);
			throw error;
		}
	}

	async checkBalance(): Promise<string> {
		if (!this.broker) {
			throw new Error('Broker not initialized');
		}

		try {
			const account = await this.broker.ledger.getLedger();
			const balance = ethers.formatEther(account.totalBalance);
			console.log(`💰 Account balance: ${balance} 0G`);
			return balance;
		} catch (error) {
			console.error('Failed to check balance:', error);
			throw error;
		}
	}

	async addFunds(amount: number): Promise<void> {
		if (!this.broker) {
			throw new Error('Broker not initialized');
		}

		try {
			console.log(`💳 Adding ${amount} 0G tokens...`);
			await this.broker.ledger.addLedger(amount);
			console.log('✅ Funds added successfully');
		} catch (error) {
			console.error('Failed to add funds:', error);
			throw error;
		}
	}

	async listServices(): Promise<ComputeService[]> {
		if (!this.broker) {
			throw new Error('Broker not initialized');
		}

		try {
			const services = await this.broker.inference.listService();
			console.log(`📋 Found ${services.length} available services`);
			return services;
		} catch (error) {
			console.error('Failed to list services:', error);
			throw error;
		}
	}

	async acknowledgeProvider(providerAddress: string): Promise<void> {
		if (!this.broker) {
			throw new Error('Broker not initialized');
		}

		try {
			console.log(`🤝 Acknowledging provider: ${providerAddress}`);
			await this.broker.inference.acknowledgeProviderSigner(providerAddress);
			console.log('✅ Provider acknowledged');
		} catch (error) {
			console.error('Failed to acknowledge provider:', error);
			throw error;
		}
	}

	async sendInferenceRequest(options: ComputeRequestOptions): Promise<ComputeResponse> {
		if (!this.broker) {
			throw new Error('Broker not initialized');
		}

		try {
			const { providerAddress, messages, model } = options;

			// Step 1: Get service metadata (with timeout)
			console.log('🔍 Getting service metadata...');
			const metadataPromise = this.broker.inference.getServiceMetadata(providerAddress);
			const timeoutPromise = new Promise((_, reject) => 
				setTimeout(() => reject(new Error('Metadata request timed out after 30s')), 30000)
			);
			const { endpoint, model: serviceModel } = await Promise.race([metadataPromise, timeoutPromise]) as any;
			
			const selectedModel = model || serviceModel;
			console.log(`📡 Endpoint: ${endpoint}`);
			console.log(`🤖 Model: ${selectedModel}`);

			// Step 2: Generate request headers
			console.log('🔐 Generating auth headers...');
			const headers = await this.broker.inference.getRequestHeaders(
				providerAddress,
				JSON.stringify(messages)
			);

			// Step 3: Send request to service (with timeout)
			console.log('🚀 Sending inference request...');
			const fetchPromise = fetch(`${endpoint}/chat/completions`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...headers
				},
				body: JSON.stringify({
					messages,
					model: selectedModel
				})
			});
			const fetchTimeoutPromise = new Promise((_, reject) => 
				setTimeout(() => reject(new Error('AI inference request timed out after 60s')), 60000)
			);
			const response = await Promise.race([fetchPromise, fetchTimeoutPromise]) as Response;

			if (!response.ok) {
				const errorText = await response.text();
				console.error('Request failed:', response.status, errorText);
				throw new Error(`Request failed: ${response.statusText} - ${errorText}`);
			}

			let data;
			try {
				const responseText = await response.text();
				console.log('📥 Raw response:', responseText.substring(0, 200));
				data = JSON.parse(responseText);
			} catch (parseError) {
				console.error('Failed to parse response:', parseError);
				throw new Error('Could not parse response from AI service');
			}

			const content = data.choices?.[0]?.message?.content;
			const chatId = data.id;

			if (!content) {
				console.error('No content in response:', data);
				throw new Error('No content received from AI service');
			}

			console.log('✅ Inference complete, content length:', content.length);

			// Step 4: Verify response (optional - don't fail if verification fails)
			let isValid = undefined;
			try {
				console.log('🔐 Attempting response verification...');
				isValid = await this.broker.inference.processResponse(
					providerAddress,
					content,
					chatId
				);
				console.log(`🔒 Response verification: ${isValid ? 'VALID' : 'INVALID'}`);
			} catch (verifyError: any) {
				// Don't fail the entire request if verification fails
				// Some services may not support verification or have issues
				console.warn('⚠️ Response verification failed (non-critical):', verifyError.message);
				console.log('✅ Continuing with unverified response...');
				isValid = undefined; // Mark as unverified but still return content
			}

			// Return the AI response regardless of verification status
			return {
				success: true,
				content,
				chatId,
				isValid
			};

		} catch (error: any) {
			console.error('Inference request failed:', error);
			return {
				success: false,
				error: error.message || 'Unknown error'
			};
		}
	}

	// Helper: Get GPT-OSS service provider
	getGptOssProvider(): string {
		return this.OFFICIAL_SERVICES['gpt-oss-120b'];
	}

	// Helper: Get DeepSeek service provider
	getDeepSeekProvider(): string {
		return this.OFFICIAL_SERVICES['deepseek-r1-70b'];
	}

	isReady(): boolean {
		return this.isInitialized && this.broker !== null;
	}
}

// Export singleton
export const ogComputeService = new OGComputeService();
