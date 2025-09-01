import { ethers } from 'ethers';
import { NETWORK_CONFIG } from './config/config';

export class WalletManager {
	private provider: ethers.JsonRpcProvider | null = null;
	private signer: ethers.Signer | null = null;

	async connect(): Promise<boolean> {
		try {
			// Check if MetaMask is available
			if (typeof window.ethereum === 'undefined') {
				throw new Error('MetaMask not found');
			}

			// Connect to 0G Chain
			this.provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.network.rpcUrl);

			// Request account access
			await window.ethereum.request({ method: 'eth_requestAccounts' });

			// Create signer
			this.signer = await new ethers.BrowserProvider(window.ethereum).getSigner();

			// Check if we're on the right network
			const network = await this.provider.getNetwork();
			if (Number(network.chainId) !== NETWORK_CONFIG.network.chainId) {
				await this.switchNetwork();
			}

			return true;
		} catch (error) {
			console.error('Wallet connection failed:', error);
			return false;
		}
	}

	async switchNetwork(): Promise<void> {
		if (!window.ethereum) {
			throw new Error('MetaMask not found');
		}

		try {
			await window.ethereum.request({
				method: 'wallet_switchEthereumChain',
				params: [{ chainId: `0x${NETWORK_CONFIG.network.chainId.toString(16)}` }]
			});
		} catch (error: unknown) {
			// Network doesn't exist, add it
			if (error && typeof error === 'object' && 'code' in error && error.code === 4902) {
				await this.addNetwork();
			} else {
				throw error;
			}
		}
	}

	async addNetwork(): Promise<void> {
		if (!window.ethereum) {
			throw new Error('MetaMask not found');
		}

		await window.ethereum.request({
			method: 'wallet_addEthereumChain',
			params: [
				{
					chainId: `0x${NETWORK_CONFIG.network.chainId.toString(16)}`,
					chainName: NETWORK_CONFIG.network.name,
					nativeCurrency: {
						name: 'OG',
						symbol: 'OG',
						decimals: 18
					},
					rpcUrls: [NETWORK_CONFIG.network.rpcUrl],
					blockExplorerUrls: [NETWORK_CONFIG.network.explorer]
				}
			]
		});
	}

	async getAddress(): Promise<string | null> {
		if (!this.signer) return null;
		return await this.signer.getAddress();
	}

	async getBalance(): Promise<string | null> {
		if (!this.provider || !this.signer) return null;
		const balance = await this.provider.getBalance(await this.signer.getAddress());
		return ethers.formatEther(balance);
	}

	disconnect(): void {
		this.provider = null;
		this.signer = null;
	}

	getSigner(): ethers.Signer | null {
		return this.signer;
	}

	getProvider(): ethers.JsonRpcProvider | null {
		return this.provider;
	}
}

export const walletManager = new WalletManager();
