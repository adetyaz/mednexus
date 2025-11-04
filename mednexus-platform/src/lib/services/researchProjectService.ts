// =====================================================
// RESEARCH PROJECT SERVICE
// Service for Research Collaboration Hub with Supabase integration
// =====================================================

import { ethers } from 'ethers';
import { get } from 'svelte/store';
import { walletStore } from '$lib/wallet';
import { supabase } from '$lib/supabase';
import ResearchCollaborationHubABI from '$lib/ABIs/ResearchCollaborationHub.json';

// Extend window object for ethereum
declare global {
    interface Window {
        ethereum?: any;
    }
}

// Contract configuration
const RESEARCH_HUB_ADDRESS = '0x035F1565aeeB03DF80Dfe65aeBF0d03Bec5bf696';
const PROJECT_FEE = '0.001'; // 0.001 A0GI

export interface ResearchProjectData {
    title: string;
    description: string;
    researchField?: string;
    projectType?: string;
    expectedResults?: string;
    methodology?: string;
    startDate?: string;
    expectedEndDate?: string;
    fundingAmount?: number;
    fundingSource?: string;
    requiredResources?: string;
    ethicsApprovalStatus?: string;
    visibility?: 'private' | 'institutional' | 'public' | 'collaborative';
    collaboratingInstitutions?: string[];
    teamMembers?: string[];
}

export interface BlockchainResult {
    success: boolean;
    txHash?: string;
    projectId?: string;
    blockNumber?: number;
    error?: string;
}

export interface DatabaseResult {
    success: boolean;
    projectId?: number;
    error?: string;
}

export interface CreateProjectResult {
    blockchain: BlockchainResult;
    database: DatabaseResult;
}

export interface ProjectFilters {
    institution?: string;
    status?: string;
    researchField?: string;
    limit?: number;
}

class ResearchProjectService {
    private provider: ethers.BrowserProvider | null = null;
    private signer: ethers.JsonRpcSigner | null = null;
    private contract: ethers.Contract | null = null;

    /**
     * Initialize the service with wallet connection
     */
    async initialize(): Promise<void> {
        const wallet = get(walletStore);
        if (!wallet.isConnected) {
            throw new Error('Wallet not connected');
        }

        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();
        this.contract = new ethers.Contract(
            RESEARCH_HUB_ADDRESS,
            ResearchCollaborationHubABI,
            this.signer
        );

        console.log('🔬 Research Project Service initialized');
    }

    /**
     * Create a research project on blockchain and save to database
     */
    async createProject(projectData: ResearchProjectData): Promise<CreateProjectResult> {
        try {
            await this.initialize();
            
            // Step 1: Create on blockchain
            console.log('📋 Creating research project on blockchain...');
            console.log('📋 Project data:', projectData);
            
            const blockchainResult = await this.createBlockchainProject(projectData);
            
            if (!blockchainResult.success) {
                return {
                    blockchain: blockchainResult,
                    database: { success: false, error: 'Blockchain transaction failed' }
                };
            }

            console.log('✅ Blockchain project created:', blockchainResult);

            // Step 2: Save to database
            console.log('💾 Saving project to database...');
            const databaseResult = await this.saveToDatabase(projectData, blockchainResult);
            
            console.log('✅ Database save result:', databaseResult);

            return {
                blockchain: blockchainResult,
                database: databaseResult
            };

        } catch (error) {
            console.error('❌ Failed to create research project:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                blockchain: { success: false, error: errorMessage },
                database: { success: false, error: errorMessage }
            };
        }
    }

    /**
     * Create project on blockchain
     */
    private async createBlockchainProject(projectData: ResearchProjectData): Promise<BlockchainResult> {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            const dataHash = ethers.keccak256(ethers.toUtf8Bytes(projectData.description));
            
            console.log('🚀 Calling contract with:');
            console.log('Title:', projectData.title);
            console.log('Description:', projectData.description);
            console.log('Data hash:', dataHash);
            console.log('Fee:', PROJECT_FEE, 'A0GI');
            
            const tx = await this.contract.createProject(
                projectData.title,
                projectData.description,
                dataHash,
                { value: ethers.parseEther(PROJECT_FEE) }
            );

            console.log('📡 Transaction sent:', tx.hash);
            const receipt = await tx.wait();
            console.log('⛽ Gas used:', receipt.gasUsed.toString());
            console.log('📦 Block number:', receipt.blockNumber);

            // Extract project ID from events
            let projectId: string | null = null;
            if (receipt.logs && receipt.logs.length > 0) {
                try {
                    for (const log of receipt.logs) {
                        try {
                            const parsedLog = this.contract.interface.parseLog(log);
                            if (parsedLog && parsedLog.name === 'ProjectCreated') {
                                projectId = parsedLog.args[0].toString();
                                break;
                            }
                        } catch (parseError) {
                            // Continue to next log
                            continue;
                        }
                    }
                } catch (logsError) {
                    console.warn('Could not parse event logs:', logsError);
                }
            }

            console.log('🔢 Project ID:', projectId);
            console.log('📜 Full transaction receipt:', receipt);

            return {
                success: true,
                txHash: tx.hash,
                projectId: projectId || undefined,
                blockNumber: receipt.blockNumber
            };

        } catch (error) {
            console.error('❌ Blockchain creation failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                success: false,
                error: errorMessage
            };
        }
    }

    /**
     * Save project to Supabase database
     */
    private async saveToDatabase(projectData: ResearchProjectData, blockchainResult: BlockchainResult): Promise<DatabaseResult> {
        try {
            const wallet = get(walletStore);
            
            // Get doctor and institution info if available
            const { data: doctorData, error: doctorError } = await supabase
                .from('medical_doctors')
                .select('id, institution_id')
                .eq('wallet_address', wallet.address)
                .maybeSingle();

            if (doctorError) {
                console.warn('Could not fetch doctor data:', doctorError);
            }

            const projectRecord = {
                blockchain_project_id: blockchainResult.projectId ? Math.abs(Number(blockchainResult.projectId) % 9223372036854775807) : 0,
                title: projectData.title,
                description: projectData.description,
                contract_address: RESEARCH_HUB_ADDRESS,
                transaction_hash: blockchainResult.txHash || '',
                block_number: blockchainResult.blockNumber || 0,
                data_hash: ethers.keccak256(ethers.toUtf8Bytes(projectData.description)),
                lead_wallet_address: wallet.address,
                lead_doctor_id: doctorData?.id || null,
                lead_institution_id: doctorData?.institution_id || null,
                research_field: projectData.researchField || 'General',
                project_type: projectData.projectType || 'Research',
                expected_results: projectData.expectedResults || null,
                methodology: projectData.methodology || null,
                start_date: projectData.startDate || null,
                expected_end_date: projectData.expectedEndDate || null,
                funding_amount: projectData.fundingAmount || null,
                funding_source: projectData.fundingSource || null,
                required_resources: projectData.requiredResources || null,
                ethics_approval_status: projectData.ethicsApprovalStatus || 'pending',
                visibility: projectData.visibility || 'institutional',
                collaborating_institutions: projectData.collaboratingInstitutions || [],
                team_members: projectData.teamMembers || [],
                blockchain_created_at: new Date().toISOString()
            };

            console.log('💾 Inserting project record:', projectRecord);

            const { data, error } = await supabase
                .from('research_projects')
                .insert(projectRecord)
                .select('id')
                .single();

            if (error) {
                console.error('❌ Database save error:', error);
                return {
                    success: false,
                    error: error.message
                };
            }

            console.log('✅ Project saved to database:', data);

            return {
                success: true,
                projectId: data.id
            };

        } catch (error) {
            console.error('❌ Database save failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                success: false,
                error: errorMessage
            };
        }
    }

    /**
     * Get all research projects from database (replacing mock data)
     */
    async getProjects(filters: ProjectFilters = {}): Promise<any[]> {
        try {
            let query = supabase
                .from('research_projects')
                .select(`
                    *,
                    medical_institutions!lead_institution_id(name, type),
                    medical_doctors!lead_doctor_id(name, medical_specialty)
                `)
                .order('created_at', { ascending: false });

            if (filters.institution) {
                query = query.eq('lead_institution_id', filters.institution);
            }

            if (filters.status) {
                query = query.eq('status', filters.status);
            }

            if (filters.researchField) {
                query = query.eq('research_field', filters.researchField);
            }

            if (filters.limit) {
                query = query.limit(filters.limit);
            }

            const { data, error } = await query;

            if (error) {
                console.error('❌ Failed to fetch projects:', error);
                return [];
            }

            console.log('📊 Fetched projects:', data);
            return data || [];

        } catch (error) {
            console.error('❌ Failed to fetch projects:', error);
            return [];
        }
    }

    /**
     * Get contract statistics
     */
    async getContractStats(): Promise<{totalProjects: number, collectedFees: string, contractAddress: string, projectFee: string}> {
        try {
            await this.initialize();

            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            const [totalProjects, collectedFees] = await Promise.all([
                this.contract.totalProjects(),
                this.contract.collectedFees()
            ]);

            return {
                totalProjects: Number(totalProjects),
                collectedFees: ethers.formatEther(collectedFees),
                contractAddress: RESEARCH_HUB_ADDRESS,
                projectFee: PROJECT_FEE
            };

        } catch (error) {
            console.error('❌ Failed to get contract stats:', error);
            throw error;
        }
    }
}

export const researchProjectService = new ResearchProjectService();