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
		name: '0G-Mainnet',
		chainId: PUBLIC_OG_CHAIN_ID ? parseInt(PUBLIC_OG_CHAIN_ID) : 16661,
		rpcUrl: PUBLIC_OG_RPC_URL || 'https://evmrpc.0g.ai',
		explorer: 'https://chainscan.0g.ai',
		symbol: '0G'
	},

	// 0G Storage contracts (Mainnet)
	storage: {
		flowContract: '0x62D4144dB0F0a6fBBaeb6296c785C71B3D57C526',
		mineContract: '0xCd01c5Cd953971CE4C2c9bFb95610236a7F414fe',
		marketContract: '0x53191725d260221bBa307D8EeD6e2Be8DD265e19', // Keep existing if working
		rewardContract: '0x457aC76B58ffcDc118AABD6DbC63ff9072880870'
	},

	// 0G DA contract
	da: {
		entranceContract: '0xE75A073dA5bb7b0eC622170Fd268f35E675a957B'
	},

	// MedNexus contracts (deployed on 0G mainnet)
	contracts: {
		medicalVerification: PUBLIC_MEDICAL_VERIFICATION_CONTRACT || '0x2b83DDc5D0dd317D2A1e4adA44819b26CA54A652',
		medicalCollaborationHub: PUBLIC_COLLABORATION_HUB_CONTRACT || '0xe3259D46d5A4F900B5f9D1289CBf9791D9cc8b59', 
		medicalIntelligenceINFT: PUBLIC_MEDICAL_INFT_CONTRACT || '0xe3259D46d5A4F900B5f9D1289CBf9791D9cc8b59'
	},

	// Deployment block
	deploymentBlock: 326165
};
