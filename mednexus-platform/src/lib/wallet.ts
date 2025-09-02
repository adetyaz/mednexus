// Wallet manager using Reown AppKit (formerly WalletConnect)
import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { createAppKit } from '@reown/appkit';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { mainnet, arbitrum, polygon } from '@reown/appkit/networks';
import { ethers } from 'ethers';
import { PUBLIC_REOWN_PROJECT_ID, PUBLIC_OG_RPC_URL } from '$env/static/public';

interface WalletState {
	isConnected: boolean;
	address: string | null;
	balance: string;
	chainId: number | null;
}

// Wallet state store
export const walletStore = writable<WalletState>({
	isConnected: false,
	address: null,
	balance: '0',
	chainId: null
});

// 0G Chain configuration
const ogChain = {
	id: 16601,
	name: '0G-Newton-Testnet',
	network: '0g-testnet',
	nativeCurrency: {
		decimals: 18,
		name: 'A0GI',
		symbol: 'A0GI'
	},
	rpcUrls: {
		default: {
			http: [PUBLIC_OG_RPC_URL || 'https://evmrpc-testnet.0g.ai']
		},
		public: {
			http: [PUBLIC_OG_RPC_URL || 'https://evmrpc-testnet.0g.ai']
		}
	},
	blockExplorers: {
		default: {
			name: '0G Chain Explorer',
			url: 'https://chainscan-newton.0g.ai'
		}
	}
};

// 1. Get projectId from https://cloud.reown.com
// Using SvelteKit environment variable syntax
const projectId = PUBLIC_REOWN_PROJECT_ID;

// 2. Set up the Ethers adapter
const ethersAdapter = new EthersAdapter();

// 3. Configure the metadata
const metadata = {
	name: 'MedNexus',
	description: 'Medical collaboration platform on 0G Network',
	url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173',
	icons: ['https://avatars.githubusercontent.com/u/37784886']
};

// 4. Create the AppKit instance
let appkit: ReturnType<typeof createAppKit> | null = null;

if (browser) {
	try {
		// Validate configuration before creating AppKit
		if (!projectId) {
			console.error('PUBLIC_REOWN_PROJECT_ID environment variable is required. Please add it to your .env file');
			throw new Error('Missing required environment variable: PUBLIC_REOWN_PROJECT_ID');
		}
		
		if (projectId.length < 10) {
			console.error('Invalid Reown project ID. Please get a valid project ID from https://cloud.reown.com');
			throw new Error('Invalid project ID configuration');
		}

		appkit = createAppKit({
			adapters: [ethersAdapter],
			projectId,
			networks: [ogChain, mainnet, arbitrum, polygon],
			metadata,
			features: {
				analytics: false, // Disable analytics to avoid configuration issues
				socials: [],
				email: false,
				onramp: false
			},
			themeMode: 'light',
			themeVariables: {
				'--w3m-z-index': 999999
			}
		});

		console.log('AppKit initialized successfully with project ID:', projectId.substring(0, 8) + '...');

		// Subscribe to account changes
		appkit.subscribeAccount((account) => {
			walletStore.update(state => ({
				...state,
				isConnected: account.isConnected || false,
				address: account.address || null
			}));
		});

		// Subscribe to network changes
		appkit.subscribeNetwork((network) => {
			const chainId = typeof network.chainId === 'string' 
				? parseInt(network.chainId, 16) 
				: network.chainId || null;
			walletStore.update(state => ({
				...state,
				chainId
			}));
		});

	} catch (error) {
		console.error('Failed to initialize AppKit:', error);
	}
}

class WalletManager {
	// Public access to the wallet store
	public walletStore = walletStore;
	
	async connect(): Promise<void> {
		if (!browser || !appkit) {
			throw new Error('AppKit not initialized');
		}

		try {
			await appkit.open();
		} catch (error) {
			console.error('Failed to connect wallet:', error);
			throw error;
		}
	}

	async disconnect(): Promise<void> {
		if (!browser || !appkit) return;
		
		try {
			await appkit.disconnect();
			walletStore.set({
				isConnected: false,
				address: null,
				balance: '0',
				chainId: null
			});
		} catch (error) {
			console.error('Failed to disconnect wallet:', error);
			throw error;
		}
	}

	async switchToOGChain(): Promise<void> {
		if (!browser || !appkit) {
			throw new Error('AppKit not initialized');
		}

		try {
			await appkit.switchNetwork(ogChain);
		} catch (error) {
			console.error('Failed to switch network:', error);
			throw error;
		}
	}

	isOnOGChain(): boolean {
		let isOnCorrectChain = false;
		walletStore.subscribe(state => {
			isOnCorrectChain = state.chainId === 16601;
		})();
		return isOnCorrectChain;
	}

	async getBalance(): Promise<string> {
		if (!browser || !appkit) return '0';
		
		try {
			// Get balance from AppKit
			const provider = appkit.getWalletProvider() as { request?: (params: { method: string; params?: unknown[] }) => Promise<unknown> };
			if (!provider || !provider.request) return '0';
			
			const accounts = await provider.request({ method: 'eth_accounts' }) as string[];
			if (!accounts || accounts.length === 0) return '0';
			
			const balance = await provider.request({
				method: 'eth_getBalance',
				params: [accounts[0], 'latest']
			}) as string;
			
			// Convert from wei to ether
			const balanceInEther = parseInt(balance, 16) / Math.pow(10, 18);
			return balanceInEther.toFixed(4);
		} catch (error) {
			console.error('Error getting balance:', error);
			return '0';
		}
	}

	async getSigner(): Promise<ethers.Signer | null> {
		if (!browser || !appkit) return null;
		
		try {
			const provider = appkit.getWalletProvider();
			if (!provider) return null;
			
			// Create ethers provider from the wallet provider
			const ethersProvider = new ethers.BrowserProvider(provider as any);
			const signer = await ethersProvider.getSigner();
			return signer;
		} catch (error) {
			console.error('Error getting signer:', error);
			return null;
		}
	}
}

// Export singleton instance
export const walletManager = new WalletManager();

// Helper functions
export function formatAddress(address: string | null): string {
	if (!address) return '';
	return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatBalance(balance: string): string {
	const num = parseFloat(balance);
	if (num === 0) return '0 A0GI';
	if (num < 0.001) return '<0.001 A0GI';
	return `${num.toFixed(3)} A0GI`;
}
