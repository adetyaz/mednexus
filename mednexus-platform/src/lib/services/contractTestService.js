// import { ethers } from 'ethers';
import { ethers } from 'ethers';
import { get } from 'svelte/store';
import { walletStore } from '$lib/wallet';

// Contract addresses on 0G Chain Mainnet
const RESEARCH_HUB_ADDRESS = '0x035F1565aeeB03DF80Dfe65aeBF0d03Bec5bf696';
const CLINICAL_TRIAL_HUB_ADDRESS = '0x55bA3CCf5Ac075D107e9F1843a5f3abea3C050a2';

// Import ABIs
import ResearchCollaborationHubABI from '$lib/ABIs/ResearchCollaborationHub.json';
import ClinicalTrialHubABI from '$lib/ABIs/ClinicalTrialHub.json';

class ContractTestService {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.researchContract = null;
        this.clinicalContract = null;
    }

    async initialize() {
        const wallet = get(walletStore);
        if (!wallet.isConnected) {
            throw new Error('Wallet not connected');
        }

        // Connect to 0G Chain
        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();

        // Initialize contracts
        this.researchContract = new ethers.Contract(
            RESEARCH_HUB_ADDRESS,
            ResearchCollaborationHubABI,
            this.signer
        );

        this.clinicalContract = new ethers.Contract(
            CLINICAL_TRIAL_HUB_ADDRESS,
            ClinicalTrialHubABI,
            this.signer
        );

        console.log('🚀 Contracts initialized on 0G Chain');
    }

    // Research Project Functions
    async createTestProject(projectData) {
        try {
            await this.initialize();

            const tx = await this.researchContract.createProject(
                projectData.title,
                projectData.description,
                ethers.keccak256(ethers.toUtf8Bytes(projectData.description)), // Generate dataHash
                { value: ethers.parseEther('0.001') } // PROJECT_FEE
            );

            console.log('📋 Creating project transaction:', tx.hash);
            const receipt = await tx.wait();
            console.log('✅ Project created successfully!', receipt);

            return {
                success: true,
                txHash: tx.hash,
                projectId: receipt.logs[0]?.topics[1] // Event emitted project ID
            };
        } catch (error) {
            console.error('❌ Failed to create project:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getProjectInfo(projectId) {
        try {
            await this.initialize();
            const project = await this.researchContract.getProject(projectId);
            
            return {
                title: project[0],
                description: project[1],
                lead: project[2],
                status: project[3],
                createdAt: new Date(Number(project[4]) * 1000).toLocaleString()
            };
        } catch (error) {
            console.error('❌ Failed to get project:', error);
            throw error;
        }
    }

    async getAllProjects() {
        try {
            await this.initialize();
            const projectIds = await this.researchContract.getAllProjects();
            
            const projects = [];
            for (let i = 0; i < Math.min(projectIds.length, 10); i++) { // Limit to 10 for display
                try {
                    const projectInfo = await this.getProjectInfo(projectIds[i]);
                    projects.push({
                        id: projectIds[i],
                        ...projectInfo
                    });
                } catch (error) {
                    console.error('Failed to load project:', projectIds[i]);
                }
            }
            
            return projects;
        } catch (error) {
            console.error('❌ Failed to get all projects:', error);
            throw error;
        }
    }

    // Clinical Trial Functions
    async createTestTrial(trialData) {
        try {
            await this.initialize();

            const tx = await this.clinicalContract.createTrial(
                trialData.title,
                trialData.description,
                ethers.keccak256(ethers.toUtf8Bytes(trialData.description)), // Generate dataHash
                { value: ethers.parseEther('0.001') } // TRIAL_FEE
            );

            console.log('📋 Creating trial transaction:', tx.hash);
            const receipt = await tx.wait();
            console.log('✅ Trial created successfully!', receipt);

            return {
                success: true,
                txHash: tx.hash,
                trialId: receipt.logs[0]?.topics[1] // Event emitted trial ID
            };
        } catch (error) {
            console.error('❌ Failed to create trial:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getTrialInfo(trialId) {
        try {
            await this.initialize();
            const trial = await this.clinicalContract.getTrial(trialId);
            
            return {
                title: trial[0],
                description: trial[1],
                sponsor: trial[2],
                status: trial[3],
                createdAt: new Date(Number(trial[4]) * 1000).toLocaleString()
            };
        } catch (error) {
            console.error('❌ Failed to get trial:', error);
            throw error;
        }
    }

    async getAllTrials() {
        try {
            await this.initialize();
            const trialIds = await this.clinicalContract.getAllTrials();
            
            const trials = [];
            for (let i = 0; i < Math.min(trialIds.length, 10); i++) { // Limit to 10 for display
                try {
                    const trialInfo = await this.getTrialInfo(trialIds[i]);
                    trials.push({
                        id: trialIds[i],
                        ...trialInfo
                    });
                } catch (error) {
                    console.error('Failed to load trial:', trialIds[i]);
                }
            }
            
            return trials;
        } catch (error) {
            console.error('❌ Failed to get all trials:', error);
            throw error;
        }
    }

    // Contract Info Functions
    async getContractStats() {
        try {
            await this.initialize();

            const [
                researchProjects,
                researchFees,
                clinicalTrials,
                clinicalFees
            ] = await Promise.all([
                this.researchContract.totalProjects(),
                this.researchContract.collectedFees(),
                this.clinicalContract.totalTrials(),
                this.clinicalContract.collectedFees()
            ]);

            return {
                research: {
                    totalProjects: Number(researchProjects),
                    collectedFees: ethers.formatEther(researchFees),
                    contractAddress: RESEARCH_HUB_ADDRESS
                },
                clinical: {
                    totalTrials: Number(clinicalTrials),
                    collectedFees: ethers.formatEther(clinicalFees),
                    contractAddress: CLINICAL_TRIAL_HUB_ADDRESS
                }
            };
        } catch (error) {
            console.error('❌ Failed to get contract stats:', error);
            throw error;
        }
    }
}

export const contractTestService = new ContractTestService();