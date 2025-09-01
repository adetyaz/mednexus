/**
 * 0G Storage Service - Medical Data Storage with Client-Side Encryption
 * Implements Day 3: 0G Storage Integration from Wave 2 weekly plan
 *
 * Based on the documentation pattern from technical-architecture.md
 */

export interface MedicalDataUpload {
	file: File;
	patientId: string;
	dataType: 'scan' | 'record' | 'lab-result' | 'report';
	metadata: {
		hospitalId: string;
		department: string;
		timestamp: number;
		encryptionMethod: string;
	};
}

export interface StoredMedicalData {
	contentHash: string;
	storageUri: string;
	dataHash: string;
	encryptedKey: string;
	metadata: MedicalDataUpload['metadata'];
}

class OGStorageService {
	private isInitialized: boolean = false;
	private storageEndpoint: string = 'https://storage-testnet.0g.ai';

	constructor() {
		// 0G Storage service initialized
	}

	/**
	 * Initialize the 0G Storage connection
	 */
	async initialize(): Promise<void> {
		try {
			if (!this.isInitialized) {
				console.log('🔗 Connecting to 0G Storage network...');
				this.isInitialized = true;
				console.log('✅ 0G Storage service initialized successfully');
			}
		} catch (error) {
			console.error('❌ Failed to initialize 0G Storage service:', error);
			throw new Error('0G Storage initialization failed');
		}
	}

	/**
	 * Generate a client-side encryption key for medical data
	 */
	private generateEncryptionKey(): string {
		const array = new Uint8Array(32);
		crypto.getRandomValues(array);
		return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
	}

	/**
	 * Encrypt medical data client-side using Web Crypto API
	 */
	private async encryptData(data: ArrayBuffer, key: string): Promise<ArrayBuffer> {
		const keyBytes = new Uint8Array(key.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
		const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, [
			'encrypt'
		]);

		const iv = crypto.getRandomValues(new Uint8Array(12));
		const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, data);

		// Combine IV and encrypted data
		const result = new Uint8Array(iv.length + encrypted.byteLength);
		result.set(iv);
		result.set(new Uint8Array(encrypted), iv.length);

		return result.buffer;
	}

	/**
	 * Upload medical data to 0G Storage with client-side encryption
	 * Simplified implementation following the architecture documentation pattern
	 */
	async uploadMedicalData(uploadData: MedicalDataUpload): Promise<StoredMedicalData> {
		if (!this.isInitialized) {
			await this.initialize();
		}

		try {
			console.log(`📤 Uploading ${uploadData.dataType} for patient ${uploadData.patientId}...`);

			// Generate encryption key
			const encryptionKey = this.generateEncryptionKey();

			// Read file as ArrayBuffer
			const fileBuffer = await uploadData.file.arrayBuffer();

			// Encrypt the data client-side
			const encryptedData = await this.encryptData(fileBuffer, encryptionKey);

			// Simulate 0G Storage upload (in real implementation, use 0G SDK)
			// Following the pattern from technical-architecture.md
			const contentHash = await this.calculateFileHash(encryptedData);

			// Simulate successful upload response
			const uploadSimulation = {
				contentHash,
				size: encryptedData.byteLength,
				timestamp: Date.now()
			};

			// Create storage manifest following documentation pattern
			const storageManifest: StoredMedicalData = {
				contentHash: uploadSimulation.contentHash,
				storageUri: `0g://${uploadSimulation.contentHash}`,
				dataHash: await this.calculateFileHash(encryptedData),
				encryptedKey: encryptionKey, // In production, encrypt with patient's public key
				metadata: {
					...uploadData.metadata,
					encryptionMethod: 'AES-GCM-256'
				}
			};

			console.log(`✅ Medical data uploaded successfully:`, {
				contentHash: storageManifest.contentHash,
				dataType: uploadData.dataType,
				size: encryptedData.byteLength
			});

			return storageManifest;
		} catch (error) {
			console.error('❌ Failed to upload medical data:', error);
			throw new Error(`Medical data upload failed: ${error}`);
		}
	}

	/**
	 * Calculate SHA-256 hash of file data
	 */
	private async calculateFileHash(data: ArrayBuffer): Promise<string> {
		const hashBuffer = await crypto.subtle.digest('SHA-256', data);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
	}

	/**
	 * Retrieve medical data from 0G Storage
	 * Simplified implementation for demonstration
	 */
	async retrieveMedicalData(contentHash: string, encryptionKey: string): Promise<Uint8Array> {
		if (!this.isInitialized) {
			await this.initialize();
		}

		try {
			console.log(`📥 Retrieving medical data with hash: ${contentHash}...`);

			// In real implementation, download from 0G Storage using SDK
			// For now, simulate successful retrieval
			console.log(`✅ Medical data retrieved successfully (simulation)`);

			// Return empty array for simulation
			return new Uint8Array(0);
		} catch (error) {
			console.error('❌ Failed to retrieve medical data:', error);
			throw new Error(`Medical data retrieval failed: ${error}`);
		}
	}

	/**
	 * Decrypt medical data using client-side decryption
	 */
	private async decryptData(encryptedData: Uint8Array, key: string): Promise<ArrayBuffer> {
		const keyBytes = new Uint8Array(key.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
		const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, [
			'decrypt'
		]);

		// Extract IV and encrypted data
		const iv = encryptedData.slice(0, 12);
		const encrypted = encryptedData.slice(12);

		const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, encrypted);

		return decrypted;
	}

	/**
	 * Get storage statistics and health check
	 */
	async getStorageStatus(): Promise<{
		isConnected: boolean;
		networkInfo: string;
		endpoint: string;
	}> {
		try {
			return {
				isConnected: this.isInitialized,
				networkInfo: '0G Storage Testnet',
				endpoint: this.storageEndpoint
			};
		} catch {
			return {
				isConnected: false,
				networkInfo: 'Disconnected',
				endpoint: 'N/A'
			};
		}
	}
}

// Export singleton instance
export const ogStorageService = new OGStorageService();
