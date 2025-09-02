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

	// MedNexus contracts (deployed on 0G testnet)
	contracts: {
		medicalVerification: '0x2b83DDc5D0dd317D2A1e4adA44819b26CA54A652',
		medicalCollaborationHub: '0xdcEcd3Cf494069f9FB5614e05Efa4Fa45C4f949c', 
		medicalIntelligenceINFT: '0xe3259D46d5A4F900B5f9D1289CBf9791D9cc8b59'
	},

	// Deployment block
	deploymentBlock: 326165
};
