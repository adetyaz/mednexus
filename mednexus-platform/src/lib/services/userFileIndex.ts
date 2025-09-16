import { browser } from '$app/environment';
import type { MedicalDataUpload } from './ogStorage';

/**
 * User File Index Service
 * Manages wallet-based file ownership and retrieval
 */

export interface UserFileIndex {
	walletAddress: string;
	institutionalFiles: FileReference[];
	researchFiles: FileReference[];
	clinicalFiles: FileReference[];
	sharedFiles: SharedFileReference[];
	lastUpdated: string;
}

export interface FileReference {
	fileId: string;
	fileName: string;
	fileType: string;
	uploadDate: string;
	fileSize: number;
	encryptionKey: string;
	storageHash: string;
	metadata: {
		dataType: string;
		medicalSpecialty?: string;
		urgencyLevel?: string;
		departmentId?: string;
	};
}

export interface SharedFileReference extends FileReference {
	sharedBy: string;
	sharedDate: string;
	accessLevel: 'view' | 'download' | 'comment';
	expiryDate?: string;
	accessReason: string;
}

export class UserFileIndexService {
	private currentWallet: string | null = null;
	private userIndex: UserFileIndex | null = null;
	private indexKey: string = '';

	constructor() {
		if (browser) {
			this.indexKey = 'mednexus_user_file_index';
		}
	}

	/**
	 * Initialize user file index for a wallet address
	 */
	async initializeUserIndex(walletAddress: string): Promise<UserFileIndex> {
		this.currentWallet = walletAddress.toLowerCase();
		
		// Try to load existing index
		const existingIndex = this.loadUserIndex(this.currentWallet);
		
		if (existingIndex) {
			this.userIndex = existingIndex;
			return existingIndex;
		}

		// Create new index
		this.userIndex = {
			walletAddress: this.currentWallet,
			institutionalFiles: [],
			researchFiles: [],
			clinicalFiles: [],
			sharedFiles: [],
			lastUpdated: new Date().toISOString()
		};

		this.saveUserIndex();
		return this.userIndex;
	}

	/**
	 * Add a file to the user's index
	 */
	async addFileToIndex(
		file: MedicalDataUpload, 
		category: 'institutional' | 'research' | 'clinical' = 'institutional'
	): Promise<void> {
		if (!this.userIndex || !this.currentWallet) {
			throw new Error('User index not initialized');
		}

		const fileReference: FileReference = {
			fileId: file.id,
			fileName: file.filename,
			fileType: file.dataType,
			uploadDate: file.uploadDate,
			fileSize: file.fileSize,
			encryptionKey: file.encryptionKey,
			storageHash: file.storageHash,
			metadata: {
				dataType: file.dataType,
				medicalSpecialty: file.medicalSpecialty,
				urgencyLevel: file.urgencyLevel,
				departmentId: (file as any).departmentId
			}
		};

		// Add to appropriate category
		switch (category) {
			case 'institutional':
				this.userIndex.institutionalFiles.push(fileReference);
				break;
			case 'clinical':
				this.userIndex.clinicalFiles.push(fileReference);
				break;
			case 'research':
				this.userIndex.researchFiles.push(fileReference);
				break;
		}

		this.userIndex.lastUpdated = new Date().toISOString();
		this.saveUserIndex();
	}

	/**
	 * Share a file with another user
	 */
	async shareFile(
		fileId: string,
		recipientWallet: string,
		accessLevel: 'view' | 'download' | 'comment',
		accessReason: string,
		expiryDate?: string
	): Promise<void> {
		if (!this.userIndex || !this.currentWallet) {
			throw new Error('User index not initialized');
		}

		// Find the file in current user's index
		const file = this.findFileInIndex(fileId);
		if (!file) {
			throw new Error('File not found in user index');
		}

		// Create shared file reference
		const sharedFile: SharedFileReference = {
			...file,
			sharedBy: this.currentWallet,
			sharedDate: new Date().toISOString(),
			accessLevel,
			accessReason,
			expiryDate
		};

		// Add to recipient's shared files (this would typically be done via API)
		const recipientIndex = this.loadUserIndex(recipientWallet.toLowerCase());
		if (recipientIndex) {
			recipientIndex.sharedFiles.push(sharedFile);
			recipientIndex.lastUpdated = new Date().toISOString();
			this.saveUserIndex(recipientIndex);
		}
	}

	/**
	 * Get all files for the current user
	 */
	async getUserFiles(): Promise<UserFileIndex | null> {
		return this.userIndex;
	}

	/**
	 * Get files by category
	 */
	async getFilesByCategory(category: 'institutional' | 'clinical' | 'shared' | 'research'): Promise<FileReference[] | SharedFileReference[]> {
		if (!this.userIndex) {
			return [];
		}

		switch (category) {
			case 'institutional':
				return this.userIndex.institutionalFiles;
			case 'clinical':
				return this.userIndex.clinicalFiles;
			case 'shared':
				return this.userIndex.sharedFiles;
			case 'research':
				return this.userIndex.researchFiles;
			default:
				return [];
		}
	}

	/**
	 * Search files by criteria
	 */
	async searchFiles(query: {
		fileName?: string;
		dataType?: string;
		medicalSpecialty?: string;
		dateRange?: { start: string; end: string };
		category?: 'institutional' | 'clinical' | 'shared' | 'research';
	}): Promise<FileReference[]> {
		if (!this.userIndex) {
			return [];
		}

		let allFiles: FileReference[] = [];
		
		if (query.category) {
			allFiles = await this.getFilesByCategory(query.category) as FileReference[];
		} else {
			allFiles = [
				...this.userIndex.institutionalFiles,
				...this.userIndex.clinicalFiles,
				...this.userIndex.sharedFiles,
				...this.userIndex.researchFiles
			];
		}

		return allFiles.filter(file => {
			// File name search
			if (query.fileName && !file.fileName.toLowerCase().includes(query.fileName.toLowerCase())) {
				return false;
			}

			// Data type filter
			if (query.dataType && file.metadata.dataType !== query.dataType) {
				return false;
			}

			// Medical specialty filter
			if (query.medicalSpecialty && file.metadata.medicalSpecialty !== query.medicalSpecialty) {
				return false;
			}

			// Date range filter
			if (query.dateRange) {
				const fileDate = new Date(file.uploadDate);
				const startDate = new Date(query.dateRange.start);
				const endDate = new Date(query.dateRange.end);
				
				if (fileDate < startDate || fileDate > endDate) {
					return false;
				}
			}

			return true;
		});
	}

	/**
	 * Remove a file from the user's index
	 */
	async removeFileFromIndex(fileId: string): Promise<void> {
		if (!this.userIndex) {
			throw new Error('User index not initialized');
		}

		// Remove from all categories
		this.userIndex.institutionalFiles = this.userIndex.institutionalFiles.filter(f => f.fileId !== fileId);
		this.userIndex.clinicalFiles = this.userIndex.clinicalFiles.filter(f => f.fileId !== fileId);
		this.userIndex.sharedFiles = this.userIndex.sharedFiles.filter(f => f.fileId !== fileId);
		this.userIndex.researchFiles = this.userIndex.researchFiles.filter(f => f.fileId !== fileId);

		this.userIndex.lastUpdated = new Date().toISOString();
		this.saveUserIndex();
	}

	/**
	 * Get file statistics for the user
	 */
	async getFileStatistics(): Promise<{
		totalFiles: number;
		totalSize: number;
		filesByType: Record<string, number>;
		filesByCategory: Record<string, number>;
		recentFiles: FileReference[];
	}> {
		if (!this.userIndex) {
			return {
				totalFiles: 0,
				totalSize: 0,
				filesByType: {},
				filesByCategory: {},
				recentFiles: []
			};
		}

		const allFiles = [
			...this.userIndex.institutionalFiles,
			...this.userIndex.clinicalFiles,
			...this.userIndex.sharedFiles,
			...this.userIndex.researchFiles
		];

		const totalSize = allFiles.reduce((sum, file) => sum + file.fileSize, 0);
		
		const filesByType = allFiles.reduce((acc, file) => {
			acc[file.metadata.dataType] = (acc[file.metadata.dataType] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);

		const filesByCategory = {
			institutional: this.userIndex.institutionalFiles.length,
			clinical: this.userIndex.clinicalFiles.length,
			shared: this.userIndex.sharedFiles.length,
			research: this.userIndex.researchFiles.length
		};

		// Get 5 most recent files
		const recentFiles = allFiles
			.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
			.slice(0, 5);

		return {
			totalFiles: allFiles.length,
			totalSize,
			filesByType,
			filesByCategory,
			recentFiles
		};
	}

	// Private helper methods
	private findFileInIndex(fileId: string): FileReference | null {
		if (!this.userIndex) return null;

		const allFiles = [
			...this.userIndex.institutionalFiles,
			...this.userIndex.clinicalFiles,
			...this.userIndex.sharedFiles,
			...this.userIndex.researchFiles
		];

		return allFiles.find(file => file.fileId === fileId) || null;
	}

	private loadUserIndex(walletAddress: string): UserFileIndex | null {
		if (!browser) return null;

		try {
			const stored = localStorage.getItem(`${this.indexKey}_${walletAddress}`);
			if (!stored) return null;

			const parsed = JSON.parse(stored);
			
			// Migration: Convert old structure to new structure
			if (parsed.personalFiles || parsed.professionalFiles) {
				const migrated: UserFileIndex = {
					walletAddress: parsed.walletAddress,
					institutionalFiles: parsed.professionalFiles || [],
					researchFiles: parsed.researchFiles || [],
					clinicalFiles: parsed.personalFiles || [], // Migrate personal to clinical
					sharedFiles: parsed.sharedFiles || [],
					lastUpdated: parsed.lastUpdated || new Date().toISOString()
				};
				
				// Save the migrated version
				this.saveUserIndex(migrated);
				return migrated;
			}
			
			// Ensure all required arrays exist
			if (!parsed.institutionalFiles) parsed.institutionalFiles = [];
			if (!parsed.researchFiles) parsed.researchFiles = [];
			if (!parsed.clinicalFiles) parsed.clinicalFiles = [];
			if (!parsed.sharedFiles) parsed.sharedFiles = [];
			
			return parsed;
		} catch (error) {
			console.error('Failed to load user index:', error);
			return null;
		}
	}

	private saveUserIndex(index?: UserFileIndex): void {
		if (!browser || !this.currentWallet) return;

		const indexToSave = index || this.userIndex;
		if (!indexToSave) return;

		try {
			localStorage.setItem(
				`${this.indexKey}_${this.currentWallet}`, 
				JSON.stringify(indexToSave)
			);
		} catch (error) {
			console.error('Failed to save user index:', error);
		}
	}
}
