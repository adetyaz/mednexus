import { ethers } from 'ethers';
import { walletManager } from './wallet';

// Simple contract ABI for basic interactions
const VERIFICATION_ABI = [
	'function getContractInfo() view returns (address, bool, uint256, uint256, uint256)',
	'function registerInstitution(string memory, string memory, bytes32) external',
	'function verifyInstitution(address) external',
	'function getAllInstitutions() view returns (address[])'
];

export class ContractManager {
	private contract: ethers.Contract | null = null;
	private contractAddress: string = '';

	async init(contractAddress: string): Promise<void> {
		try {
			const signer = walletManager.getSigner();
			if (!signer) {
				throw new Error('Wallet not connected');
			}

			this.contractAddress = contractAddress;
			this.contract = new ethers.Contract(contractAddress, VERIFICATION_ABI, signer);

			console.log('Contract initialized at:', contractAddress);
		} catch (error) {
			console.error('Contract initialization failed:', error);
			throw error;
		}
	}

	async getContractInfo(): Promise<{
		owner: string;
		paused: boolean;
		institutions: string;
		verifiers: string;
		balance: string;
	}> {
		if (!this.contract) {
			throw new Error('Contract not initialized');
		}

		try {
			const info = await this.contract.getContractInfo();
			return {
				owner: info[0],
				paused: info[1],
				institutions: info[2].toString(),
				verifiers: info[3].toString(),
				balance: ethers.formatEther(info[4])
			};
		} catch (error) {
			console.error('Failed to get contract info:', error);
			throw error;
		}
	}

	async registerInstitution(name: string, country: string, credentials: string): Promise<string> {
		if (!this.contract) {
			throw new Error('Contract not initialized');
		}

		try {
			const credentialsHash = ethers.keccak256(ethers.toUtf8Bytes(credentials));
			const tx = await this.contract.registerInstitution(name, country, credentialsHash);
			await tx.wait();
			return tx.hash;
		} catch (error) {
			console.error('Institution registration failed:', error);
			throw error;
		}
	}

	async getAllInstitutions(): Promise<string[]> {
		if (!this.contract) {
			throw new Error('Contract not initialized');
		}

		try {
			return await this.contract.getAllInstitutions();
		} catch (error) {
			console.error('Failed to get institutions:', error);
			throw error;
		}
	}

	getContractAddress(): string {
		return this.contractAddress;
	}
}

export const contractManager = new ContractManager();
