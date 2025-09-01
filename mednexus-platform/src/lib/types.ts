export interface MedicalRecord {
	id: string;
	patientId: string;
	institutionId: string;
	dataType: 'DIAGNOSTIC_IMAGE' | 'LAB_RESULT' | 'CLINICAL_NOTE' | 'GENOMIC_DATA';
	specialty: string;
	timestamp: number;
	isEncrypted: boolean;
	storageRoot?: string;
	consentLevel: 'PRIVATE' | 'RESEARCH' | 'COLLABORATION' | 'PUBLIC_HEALTH';
}

export interface Institution {
	address: string;
	name: string;
	country: string;
	isVerified: boolean;
	verificationDate?: number;
}

export interface Verifier {
	address: string;
	name: string;
	region: string;
	specialty: string;
	isActive: boolean;
}

export interface ContractInfo {
	owner: string;
	paused: boolean;
	institutions: string;
	verifiers: string;
	balance: string;
}
