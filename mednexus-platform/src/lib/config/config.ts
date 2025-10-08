// 0G Chain configuration for MedNexus
import { 
	PUBLIC_OG_RPC_URL, 
	PUBLIC_OG_CHAIN_ID, 
	PUBLIC_MEDICAL_VERIFICATION_CONTRACT,
	PUBLIC_COLLABORATION_HUB_CONTRACT,
	PUBLIC_MEDICAL_INFT_CONTRACT
} from '$env/static/public';

export const NETWORK_CONFIG = {
	// Network configuration
	network: {
		name: '0G-Galileo-Testnet',
		chainId: PUBLIC_OG_CHAIN_ID ? parseInt(PUBLIC_OG_CHAIN_ID) : 16602,
		rpcUrl: PUBLIC_OG_RPC_URL || 'https://evmrpc-testnet.0g.ai',
		explorer: 'https://chainscan-galileo.0g.ai',
		symbol: 'OG'
	},

	// 0G Storage contracts
	storage: {
		flowContract: '0x22E03a6A89B950F1c82ec5e74F8eCa321a105296',
		mineContract: '0x00A9E9604b0538e06b268Fb297Df333337f9593b',
		marketContract: '0x53191725d260221bBa307D8EeD6e2Be8DD265e19', // Keep existing if working
		rewardContract: '0xA97B57b4BdFEA2D0a25e535bd849ad4e6C440A69'
	},

	// 0G DA contract
	da: {
		entranceContract: '0xE75A073dA5bb7b0eC622170Fd268f35E675a957B'
	},

	// MedNexus contracts (deployed on 0G testnet)
	contracts: {
		medicalVerification: PUBLIC_MEDICAL_VERIFICATION_CONTRACT || '0x24BF26c9676247eFD93C1D765132FE7d529E5929',
		medicalCollaborationHub: PUBLIC_COLLABORATION_HUB_CONTRACT || '0x94b8Bd13ed6Ab0bE0C0eb904EC1bf456C37AE23B', 
		medicalIntelligenceINFT: PUBLIC_MEDICAL_INFT_CONTRACT || '0xe3259D46d5A4F900B5f9D1289CBf9791D9cc8b59'
	},

	// Deployment block
	deploymentBlock: 326165
};
