// 0G Chain configuration for MedNexus
export const NETWORK_CONFIG = {
	// Network configuration
	network: {
		name: '0G-Galileo-Testnet',
		chainId: 16601,
		rpcUrl: 'https://evmrpc-testnet.0g.ai',
		explorer: 'https://chainscan-galileo.0g.ai',
		symbol: 'OG'
	},

	// 0G Storage contracts
	storage: {
		flowContract: '0xbD75117F80b4E22698D0Cd7612d92BDb8eaff628',
		mineContract: '0x3A0d1d67497Ad770d6f72e7f4B8F0BAbaa2A649C',
		marketContract: '0x53191725d260221bBa307D8EeD6e2Be8DD265e19',
		rewardContract: '0xd3D4D91125D76112AE256327410Dd0414Ee08Cb4'
	},

	// 0G DA contract
	da: {
		entranceContract: '0xE75A073dA5bb7b0eC622170Fd268f35E675a957B'
	},

	// MedNexus contracts (to be deployed)
	contracts: {
		medicalVerification: '', // Will be set after deployment
		medicalCollaborationHub: '', // Will be set after deployment
		medicalIntelligenceINFT: '' // Will be set after deployment
	},

	// Deployment block
	deploymentBlock: 326165
};
