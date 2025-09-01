/**
 * Contract Types for MedNexus Platform
 */

import type { ContractTransactionResponse } from 'ethers';

export interface ContractInfo {
	address: string;
	name: string;
	symbol?: string;
	totalSupply?: string;
	owner?: string;
}

// Medical Intelligence INFT Contract Interface
export interface MedicalIntelligenceINFT {
	createMedicalCase: (
		title: string,
		description: string,
		ipfsUri: string,
		revenueShare: number
	) => Promise<ContractTransactionResponse>;

	submitExpertResponse: (
		tokenId: string,
		diagnosis: string,
		confidence: number,
		treatment: string
	) => Promise<ContractTransactionResponse>;

	getExpertResponses: (tokenId: string) => Promise<unknown[]>;

	getMedicalCase: (tokenId: string) => Promise<unknown>;

	totalSupply: () => Promise<bigint>;

	tokenByIndex: (index: number) => Promise<bigint>;

	ownerOf: (tokenId: string) => Promise<string>;
}

// Medical Collaboration Hub Contract Interface
export interface MedicalCollaborationHub {
	createCollaboration: (
		title: string,
		description: string,
		participants: string[]
	) => Promise<ContractTransactionResponse>;

	joinCollaboration: (collaborationId: string) => Promise<ContractTransactionResponse>;

	getCollaboration: (collaborationId: string) => Promise<unknown>;
}

// Medical Verification Contract Interface
export interface MedicalVerification {
	verifyInstitution: (
		institutionAddress: string,
		institutionName: string,
		licenseNumber: string
	) => Promise<ContractTransactionResponse>;

	verifyMedicalProfessional: (
		professionalAddress: string,
		institutionAddress: string,
		credentials: string
	) => Promise<ContractTransactionResponse>;

	isVerifiedInstitution: (address: string) => Promise<boolean>;

	isVerifiedProfessional: (address: string) => Promise<boolean>;
}
