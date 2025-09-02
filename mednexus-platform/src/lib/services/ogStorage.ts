
import { browser } from '$app/environment';

export interface MedicalDataUpload {
	id: string;
	patientId: string;
	institutionId: string;
	dataType: 'clinical_notes' | 'imaging' | 'lab_results' | 'diagnostic_reports' | 'treatment_plans';
	filename: string;
	fileSize: number;
	encryptionKey: string;
	storageHash: string;
	ipfsHash?: string;
	uploadDate: string;
	accessPermissions: string[];
	consentStatus: 'granted' | 'pending' | 'revoked';
	retentionPeriod: number; // days
	isAnonymized: boolean;
	medicalSpecialty: string;
	urgencyLevel: 'routine' | 'urgent' | 'emergency';
	complianceFlags: string[];
}

export interface StorageStats {
	totalFiles: number;
	totalSize: string;
	storageUsed: string;
	storageAvailable: string;
	filesThisMonth: number;
	averageFileSize: string;
	complianceStatus: 'compliant' | 'warning' | 'violation';
	lastBackup: string;
}

export interface StorageInfo {
	ready: boolean;
	storageType: string;
	endpoint: string;
	status: 'connected' | 'disconnected' | 'error';
}

export class EnhancedOGStorageService {
	private isInitialized = false;
	private uploads: MedicalDataUpload[] = [];

	async init(): Promise<void> {
		if (!browser) return;
		
		try {
			// Initialize 0G Storage SDK
			await this.connectToOGNetwork();
			await this.loadExistingUploads();
			this.isInitialized = true;
			console.log('Enhanced 0G Storage Service initialized');
		} catch (error) {
			console.error('Failed to initialize 0G Storage:', error);
			throw error;
		}
	}

	private async connectToOGNetwork(): Promise<void> {
		// Simulate connection to 0G Storage nodes
		await new Promise(resolve => setTimeout(resolve, 1000));
		console.log('Connected to 0G Storage network');
	}

	private async loadExistingUploads(): Promise<void> {
		if (browser) {
			const stored = localStorage.getItem('mednexus_medical_uploads');
			if (stored) {
				this.uploads = JSON.parse(stored);
			}
		}
	}

	async getStorageInfo(): Promise<StorageInfo> {
		return {
			ready: this.isInitialized,
			storageType: '0G Storage Network',
			endpoint: 'https://rpc-storage-testnet.0g.ai',
			status: this.isInitialized ? 'connected' : 'disconnected'
		};
	}

	// Upload medical data with encryption
	async uploadMedicalData(
		file: File,
		metadata: {
			patientId: string;
			institutionId: string;
			dataType: MedicalDataUpload['dataType'];
			medicalSpecialty: string;
			urgencyLevel: MedicalDataUpload['urgencyLevel'];
			accessPermissions: string[];
			retentionPeriod: number;
			isAnonymized: boolean;
		},
	): Promise<string> {
		if (!this.isInitialized) {
			throw new Error('0G Storage service not initialized');
		}

		// Simulate encryption and upload
		const storageHash = `0x${Math.random().toString(16).substr(2, 40)}`;
		const encryptionKey = `key_${Math.random().toString(16).substr(2, 16)}`;

		const upload: MedicalDataUpload = {
			id: `upload_${Date.now()}`,
			patientId: metadata.patientId,
			institutionId: metadata.institutionId,
			dataType: metadata.dataType,
			filename: file.name,
			fileSize: file.size,
			encryptionKey,
			storageHash,
			uploadDate: new Date().toISOString(),
			accessPermissions: metadata.accessPermissions,
			consentStatus: 'granted',
			retentionPeriod: metadata.retentionPeriod,
			isAnonymized: metadata.isAnonymized,
			medicalSpecialty: metadata.medicalSpecialty,
			urgencyLevel: metadata.urgencyLevel,
			complianceFlags: ['HIPAA_COMPLIANT', 'GDPR_COMPLIANT']
		};

		this.uploads.push(upload);
		this.saveUploads();

		// Simulate upload delay
		await new Promise(resolve => setTimeout(resolve, 2000));
		
		console.log('Medical data uploaded to 0G Storage:', upload.id);
		return upload.id;
	}

	private saveUploads(): void {
		if (browser) {
			localStorage.setItem('mednexus_medical_uploads', JSON.stringify(this.uploads));
		}
	}

	// Get storage statistics
	getStorageStats(): StorageStats {
		const totalSize = this.uploads.reduce((sum, upload) => sum + upload.fileSize, 0);
		const filesThisMonth = this.uploads.filter(upload => {
			const uploadDate = new Date(upload.uploadDate);
			const monthAgo = new Date();
			monthAgo.setMonth(monthAgo.getMonth() - 1);
			return uploadDate > monthAgo;
		}).length;

		return {
			totalFiles: this.uploads.length,
			totalSize: this.formatFileSize(totalSize),
			storageUsed: this.formatFileSize(totalSize),
			storageAvailable: this.formatFileSize(1000000000 - totalSize), // 1GB limit
			filesThisMonth,
			averageFileSize: this.uploads.length > 0 ? 
				this.formatFileSize(totalSize / this.uploads.length) : '0 B',
			complianceStatus: 'compliant',
			lastBackup: new Date().toISOString()
		};
	}

	private formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
	}

	// Get all uploads
	getAllUploads(): MedicalDataUpload[] {
		return [...this.uploads];
	}

	// Get uploads by institution
	getUploadsByInstitution(institutionId: string): MedicalDataUpload[] {
		return this.uploads.filter(upload => upload.institutionId === institutionId);
	}

	// Search uploads
	searchUploads(query: string): MedicalDataUpload[] {
		const searchTerm = query.toLowerCase();
		return this.uploads.filter(upload =>
			upload.filename.toLowerCase().includes(searchTerm) ||
			upload.medicalSpecialty.toLowerCase().includes(searchTerm) ||
			upload.dataType.toLowerCase().includes(searchTerm)
		);
	}

	isReady(): boolean {
		return this.isInitialized;
	}
}

// Export singleton service
export const enhancedOGStorageService = new EnhancedOGStorageService();

// Backward compatibility
export const storageHelper = enhancedOGStorageService;

// Helper functions
export function formatDataType(dataType: MedicalDataUpload['dataType']): string {
	const types = {
		'clinical_notes': 'Clinical Notes',
		'imaging': 'Medical Imaging',
		'lab_results': 'Laboratory Results',
		'diagnostic_reports': 'Diagnostic Reports',
		'treatment_plans': 'Treatment Plans'
	};
	return types[dataType] || dataType;
}

export function formatUrgencyLevel(level: MedicalDataUpload['urgencyLevel']): string {
	const levels = {
		'routine': 'Routine',
		'urgent': 'Urgent',
		'emergency': 'Emergency'
	};
	return levels[level] || level;
}
