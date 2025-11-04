// =====================================================
// CLINICAL TRIAL SERVICE
// Service for Clinical Trial Hub with Supabase integration
// =====================================================

import { ethers } from 'ethers';
import { get } from 'svelte/store';
import { walletStore } from '$lib/wallet';
import { supabase } from '$lib/supabase';
import ClinicalTrialHubABI from '$lib/ABIs/ClinicalTrialHub.json';

// Extend window object for ethereum
declare global {
    interface Window {
        ethereum?: any;
    }
}

// Contract configuration
const CLINICAL_TRIAL_HUB_ADDRESS = '0x55bA3CCf5Ac075D107e9F1843a5f3abea3C050a2';
const TRIAL_FEE = '0.001'; // 0.001 A0GI

export interface TrialData {
    title: string;
    description: string;
    phase?: string;
    trialType?: string;
    therapeuticArea?: string;
    interventionType?: string;
    studyDesign?: string;
    primaryEndpoint?: string;
    participants?: number;
    ageRange?: string;
    genderCriteria?: string;
    principalInvestigator?: string;
    protocolNumber?: string;
    fundingSource?: string;
    totalBudget?: number;
    sponsorOrganization?: string;
    visibility?: string;
    publicSummary?: string;
    duration?: string;
}

export interface BlockchainResult {
    success: boolean;
    txHash?: string;
    trialId?: string;
    blockNumber?: number;
    error?: string;
}

export interface DatabaseResult {
    success: boolean;
    trialId?: number;
    error?: string;
}

export interface CreateTrialResult {
    blockchain: BlockchainResult;
    database: DatabaseResult;
}

export interface TrialFilters {
    institution?: string;
    status?: string;
    phase?: string;
    therapeuticArea?: string;
    limit?: number;
}

class ClinicalTrialService {
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
            CLINICAL_TRIAL_HUB_ADDRESS,
            ClinicalTrialHubABI,
            this.signer
        );

        console.log('🧪 Clinical Trial Service initialized');
    }

    /**
     * Create a clinical trial on blockchain and save to database
     */
    async createTrial(trialData: TrialData): Promise<CreateTrialResult> {
        try {
            await this.initialize();
            
            // Step 1: Create on blockchain
            console.log('🧪 Creating clinical trial on blockchain...');
            console.log('🧪 Trial data:', trialData);
            
            const blockchainResult = await this.createBlockchainTrial(trialData);
            
            if (!blockchainResult.success) {
                return {
                    blockchain: blockchainResult,
                    database: { success: false, error: 'Blockchain transaction failed' }
                };
            }

            console.log('✅ Blockchain trial created:', blockchainResult);

            // Step 2: Save to database
            console.log('💾 Saving trial to database...');
            const databaseResult = await this.saveToDatabase(trialData, blockchainResult);
            
            console.log('✅ Database save result:', databaseResult);

            return {
                blockchain: blockchainResult,
                database: databaseResult
            };

        } catch (error) {
            console.error('❌ Failed to create clinical trial:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                blockchain: { success: false, error: errorMessage },
                database: { success: false, error: errorMessage }
            };
        }
    }

    /**
     * Create trial on blockchain
     */
    private async createBlockchainTrial(trialData: TrialData): Promise<BlockchainResult> {
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            const dataHash = ethers.keccak256(ethers.toUtf8Bytes(trialData.description));
            
            console.log('🚀 Calling contract with:');
            console.log('Title:', trialData.title);
            console.log('Description:', trialData.description);
            console.log('Data hash:', dataHash);
            console.log('Fee:', TRIAL_FEE, 'A0GI');
            
            const tx = await this.contract.createTrial(
                trialData.title,
                trialData.description,
                dataHash,
                { value: ethers.parseEther(TRIAL_FEE) }
            );

            console.log('📡 Transaction sent:', tx.hash);
            const receipt = await tx.wait();
            console.log('⛽ Gas used:', receipt.gasUsed.toString());
            console.log('📦 Block number:', receipt.blockNumber);

            // Extract trial ID from events
            let trialId: string | null = null;
            if (receipt.logs && receipt.logs.length > 0) {
                try {
                    for (const log of receipt.logs) {
                        try {
                            const parsedLog = this.contract.interface.parseLog(log);
                            if (parsedLog && parsedLog.name === 'TrialCreated') {
                                trialId = parsedLog.args[0].toString();
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

            console.log('🔢 Trial ID:', trialId);
            console.log('📜 Full transaction receipt:', receipt);

            return {
                success: true,
                txHash: tx.hash,
                trialId: trialId || undefined,
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
     * Save trial to Supabase database
     */
    private async saveToDatabase(trialData: TrialData, blockchainResult: BlockchainResult): Promise<DatabaseResult> {
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

            const trialRecord = {
                blockchain_trial_id: blockchainResult.trialId ? Math.abs(Number(blockchainResult.trialId) % 9223372036854775807) : 0,
                title: trialData.title,
                description: trialData.description,
                contract_address: CLINICAL_TRIAL_HUB_ADDRESS,
                transaction_hash: blockchainResult.txHash || '',
                block_number: blockchainResult.blockNumber || 0,
                data_hash: ethers.keccak256(ethers.toUtf8Bytes(trialData.description)),
                sponsor_wallet_address: wallet.address,
                sponsor_doctor_id: doctorData?.id || null,
                sponsor_institution_id: doctorData?.institution_id || null,
                trial_phase: trialData.phase || 'Phase I',
                trial_type: trialData.trialType || 'Interventional',
                therapeutic_area: trialData.therapeuticArea || 'General',
                intervention_type: trialData.interventionType || 'Drug',
                study_design: trialData.studyDesign || 'Randomized',
                primary_endpoint: trialData.primaryEndpoint || null,
                target_enrollment: trialData.participants || null,
                age_range: trialData.ageRange || null,
                gender_criteria: trialData.genderCriteria || 'All',
                principal_investigator: trialData.principalInvestigator || null,
                protocol_number: trialData.protocolNumber || null,
                funding_source: trialData.fundingSource || null,
                total_budget: trialData.totalBudget || null,
                sponsor_organization: trialData.sponsorOrganization || null,
                visibility: trialData.visibility || 'institutional',
                public_summary: trialData.publicSummary || trialData.description,
                estimated_completion_date: trialData.duration ? this.calculateEndDate(trialData.duration) : null,
                blockchain_created_at: new Date().toISOString()
            };

            console.log('💾 Inserting trial record:', trialRecord);

            const { data, error } = await supabase
                .from('clinical_trials')
                .insert(trialRecord)
                .select('id')
                .single();

            if (error) {
                console.error('❌ Database save error:', error);
                return {
                    success: false,
                    error: error.message
                };
            }

            console.log('✅ Trial saved to database:', data);

            return {
                success: true,
                trialId: data.id
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
     * Calculate end date based on duration string
     */
    private calculateEndDate(duration: string): string | null {
        try {
            const today = new Date();
            const durationMatch = duration.match(/(\d+)\s*(months?|years?|weeks?|days?)/i);
            
            if (!durationMatch) {
                return null;
            }

            const amount = parseInt(durationMatch[1]);
            const unit = durationMatch[2].toLowerCase();

            if (unit.startsWith('month')) {
                today.setMonth(today.getMonth() + amount);
            } else if (unit.startsWith('year')) {
                today.setFullYear(today.getFullYear() + amount);
            } else if (unit.startsWith('week')) {
                today.setDate(today.getDate() + (amount * 7));
            } else if (unit.startsWith('day')) {
                today.setDate(today.getDate() + amount);
            }

            return today.toISOString().split('T')[0]; // Return YYYY-MM-DD format

        } catch (error) {
            console.warn('Could not parse duration:', duration);
            return null;
        }
    }

    /**
     * Get all clinical trials from database (replacing mock data)
     */
    async getTrials(filters: TrialFilters = {}): Promise<any[]> {
        try {
            let query = supabase
                .from('clinical_trials')
                .select(`
                    *,
                    medical_institutions!sponsor_institution_id(name, type),
                    medical_doctors!sponsor_doctor_id(name, medical_specialty)
                `)
                .order('created_at', { ascending: false });

            if (filters.institution) {
                query = query.eq('sponsor_institution_id', filters.institution);
            }

            if (filters.status) {
                query = query.eq('status', filters.status);
            }

            if (filters.phase) {
                query = query.eq('trial_phase', filters.phase);
            }

            if (filters.therapeuticArea) {
                query = query.eq('therapeutic_area', filters.therapeuticArea);
            }

            if (filters.limit) {
                query = query.limit(filters.limit);
            }

            const { data, error } = await query;

            if (error) {
                console.error('❌ Failed to fetch trials:', error);
                return [];
            }

            console.log('📊 Fetched trials:', data);
            return data || [];

        } catch (error) {
            console.error('❌ Failed to fetch trials:', error);
            return [];
        }
    }

    /**
     * Get contract statistics
     */
    async getContractStats(): Promise<{totalTrials: number, collectedFees: string, contractAddress: string, trialFee: string}> {
        try {
            await this.initialize();

            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            const [totalTrials, collectedFees] = await Promise.all([
                this.contract.totalTrials(),
                this.contract.collectedFees()
            ]);

            return {
                totalTrials: Number(totalTrials),
                collectedFees: ethers.formatEther(collectedFees),
                contractAddress: CLINICAL_TRIAL_HUB_ADDRESS,
                trialFee: TRIAL_FEE
            };

        } catch (error) {
            console.error('❌ Failed to get contract stats:', error);
            throw error;
        }
    }
}

export const clinicalTrialService = new ClinicalTrialService();