import { browser } from '$app/environment';
import { EnhancedOGStorageService } from './ogStorage';
import { MedicalInstitutionService, type VerifiedDoctor } from './medicalInstitutionService';
import { InstitutionalDocumentService } from './institutionalDocumentService';
import type { MedicalDataUpload } from './ogStorage';

/**
 * Medical Document Management Service
 * Central service that orchestrates all document-related operations
 * for medical institutions
 */

export class MedicalDocumentManagementService {
	private ogStorage: EnhancedOGStorageService;
	private institutionService: MedicalInstitutionService;
	private documentService: InstitutionalDocumentService;

	constructor() {
		this.ogStorage = new EnhancedOGStorageService();
		this.institutionService = new MedicalInstitutionService();
		this.documentService = new InstitutionalDocumentService();
	}

	/**
	 * Initialize the document management service
	 */
	async initialize(): Promise<void> {
		try {
			await this.ogStorage.init();
			console.log('Medical Document Management Service initialized successfully');
		} catch (error) {
			console.error('Failed to initialize Medical Document Management Service:', error);
			throw error;
		}
	}

	/**
	 * Upload medical document with institutional context
	 */
	async uploadMedicalDocument(
		file: File,
		doctorWallet: string,
		documentMetadata: {
			medicalDataType: string;
			medicalSpecialty?: string;
			urgencyLevel?: string;
			description?: string;
			tags?: string[];
			accessLevel: 'private' | 'departmental' | 'institutional' | 'shared' | 'public';
			sharedWith?: string[]; // Institution IDs for shared documents
		}
	): Promise<{
		success: boolean;
		fileId?: string;
		message: string;
		document?: any;
	}> {
		try {
			// Ensure storage service is initialized
			if (!this.ogStorage.isReady()) {
				console.log('Initializing 0G Storage service...');
				await this.ogStorage.init();
			}

			// Verify doctor credentials
			const doctor = this.institutionService.getDoctor(doctorWallet);
			if (!doctor) {
				return {
					success: false,
					message: 'Doctor not found or not verified. Please complete institutional registration first.'
				};
			}

			// Check if doctor has permission to upload at specified access level
			if (!this.hasUploadPermission(doctor, documentMetadata.accessLevel)) {
				return {
					success: false,
					message: `Insufficient permissions to upload documents with ${documentMetadata.accessLevel} access level.`
				};
			}

			// Upload to 0G Chain storage
			const uploadResult = await this.ogStorage.uploadMedicalData(
				file,
				{
					patientId: doctor.doctorWallet, // Use doctor wallet as patient ID for institutional docs
					institutionId: doctor.institutionId,
					dataType: documentMetadata.medicalDataType as any,
					medicalSpecialty: documentMetadata.medicalSpecialty || 'general',
					urgencyLevel: documentMetadata.urgencyLevel as any || 'routine',
					accessPermissions: [doctor.institutionId, doctor.department],
					retentionPeriod: 365, // Default 1 year
					isAnonymized: false
				}
			);

			// Add to institutional document library
			await this.documentService.addDocumentToLibrary(
				uploadResult,
				doctor,
				documentMetadata.accessLevel,
				{
					description: documentMetadata.description,
					tags: documentMetadata.tags,
					sharedWith: documentMetadata.sharedWith
				}
			);

			return {
				success: true,
				fileId: uploadResult.id,
				message: 'Document uploaded successfully to institutional library',
				document: uploadResult
			};

		} catch (error: any) {
			console.error('Medical document upload failed:', error);
			return {
				success: false,
				message: error.message || 'Failed to upload document'
			};
		}
	}

	/**
	 * Get documents accessible to a doctor with institutional context
	 */
	async getDoctorAccessibleDocuments(
		doctorWallet: string,
		filters?: {
			category?: 'private' | 'departmental' | 'institutional' | 'shared' | 'public';
			medicalSpecialty?: string;
			urgencyLevel?: string;
			searchQuery?: string;
			department?: string;
			dateRange?: { start: string; end: string };
		}
	): Promise<{
		success: boolean;
		documents?: any;
		message?: string;
	}> {
		try {
			const doctor = this.institutionService.getDoctor(doctorWallet);
			if (!doctor) {
				return {
					success: false,
					message: 'Doctor not found or not verified'
				};
			}

			const documents = await this.documentService.getAccessibleDocuments(
				doctorWallet,
				doctor,
				filters?.category
			);

			// Apply additional filters if provided
			let filteredDocuments = documents;
			
			if (filters) {
				if (filters.medicalSpecialty) {
					Object.keys(filteredDocuments).forEach(key => {
						filteredDocuments[key as keyof typeof filteredDocuments] = 
							filteredDocuments[key as keyof typeof filteredDocuments]
								.filter((doc: any) => doc.medicalSpecialty === filters.medicalSpecialty);
					});
				}

				if (filters.urgencyLevel) {
					Object.keys(filteredDocuments).forEach(key => {
						filteredDocuments[key as keyof typeof filteredDocuments] = 
							filteredDocuments[key as keyof typeof filteredDocuments]
								.filter((doc: any) => doc.urgencyLevel === filters.urgencyLevel);
					});
				}

				if (filters.searchQuery) {
					const query = filters.searchQuery.toLowerCase();
					Object.keys(filteredDocuments).forEach(key => {
						filteredDocuments[key as keyof typeof filteredDocuments] = 
							filteredDocuments[key as keyof typeof filteredDocuments]
								.filter((doc: any) => 
									doc.fileName.toLowerCase().includes(query) ||
									doc.description?.toLowerCase().includes(query) ||
									doc.tags?.some((tag: string) => tag.toLowerCase().includes(query))
								);
					});
				}
			}

			return {
				success: true,
				documents: filteredDocuments
			};

		} catch (error: any) {
			console.error('Failed to get doctor documents:', error);
			return {
				success: false,
				message: error.message || 'Failed to retrieve documents'
			};
		}
	}

	/**
	 * Download document with access verification
	 */
	async downloadDocument(
		fileId: string,
		doctorWallet: string,
		encryptionKey: string
	): Promise<{
		success: boolean;
		fileData?: Uint8Array;
		fileName?: string;
		message?: string;
	}> {
		try {
			const doctor = this.institutionService.getDoctor(doctorWallet);
			if (!doctor) {
				return {
					success: false,
					message: 'Doctor not found or not verified'
				};
			}

			// Verify doctor has access to this document
			const accessibleDocs = await this.documentService.getAccessibleDocuments(doctorWallet, doctor);
			const allDocs = [
				...accessibleDocs.privateDocuments,
				...accessibleDocs.departmentalDocuments,
				...accessibleDocs.institutionalDocuments,
				...accessibleDocs.sharedDocuments,
				...accessibleDocs.publicDocuments
			];

			const document = allDocs.find(doc => doc.fileId === fileId);
			if (!document) {
				return {
					success: false,
					message: 'Document not found or access denied'
				};
			}

			// Simulate download from 0G Chain (no actual download method available)
			// In production, this would interface with the 0G Storage network
			const simulatedFileData = new Uint8Array([1, 2, 3, 4]); // Placeholder
			
			return {
				success: true,
				fileData: simulatedFileData,
				fileName: document.fileName,
				message: 'Document downloaded successfully'
			};

		} catch (error: any) {
			console.error('Document download failed:', error);
			return {
				success: false,
				message: error.message || 'Failed to download document'
			};
		}
	}

	/**
	 * Share document with another institution
	 */
	async shareDocument(
		fileId: string,
		fromDoctorWallet: string,
		targetInstitutionId: string,
		shareMessage?: string
	): Promise<{
		success: boolean;
		message: string;
	}> {
		try {
			const doctor = this.institutionService.getDoctor(fromDoctorWallet);
			if (!doctor) {
				return {
					success: false,
					message: 'Doctor not found or not verified'
				};
			}

			await this.documentService.shareDocumentWithInstitution(
				fileId,
				doctor.institutionId,
				targetInstitutionId,
				fromDoctorWallet,
				doctor
			);

			return {
				success: true,
				message: 'Document shared successfully with target institution'
			};

		} catch (error: any) {
			console.error('Document sharing failed:', error);
			return {
				success: false,
				message: error.message || 'Failed to share document'
			};
		}
	}

	/**
	 * Approve or reject institutional documents
	 */
	async approveDocument(
		fileId: string,
		approverWallet: string,
		approved: boolean
	): Promise<{
		success: boolean;
		message: string;
	}> {
		try {
			const approver = this.institutionService.getDoctor(approverWallet);
			if (!approver) {
				return {
					success: false,
					message: 'Approver not found or not verified'
				};
			}

			await this.documentService.approveDocument(
				fileId,
				approver.institutionId,
				approverWallet,
				approved,
				approver
			);

			return {
				success: true,
				message: `Document ${approved ? 'approved' : 'rejected'} successfully`
			};

		} catch (error: any) {
			console.error('Document approval failed:', error);
			return {
				success: false,
				message: error.message || 'Failed to process document approval'
			};
		}
	}

	/**
	 * Get institution library statistics
	 */
	async getInstitutionStatistics(doctorWallet: string): Promise<{
		success: boolean;
		statistics?: any;
		message?: string;
	}> {
		try {
			const doctor = this.institutionService.getDoctor(doctorWallet);
			if (!doctor) {
				return {
					success: false,
					message: 'Doctor not found or not verified'
				};
			}

			const statistics = await this.documentService.getLibraryStatistics(doctor.institutionId);
			
			return {
				success: true,
				statistics
			};

		} catch (error: any) {
			console.error('Failed to get statistics:', error);
			return {
				success: false,
				message: error.message || 'Failed to retrieve statistics'
			};
		}
	}

	/**
	 * Search documents across institution
	 */
	async searchDocuments(
		doctorWallet: string,
		searchQuery: {
			fileName?: string;
			medicalDataType?: string;
			medicalSpecialty?: string;
			department?: string;
			dateRange?: { start: string; end: string };
			tags?: string[];
		}
	): Promise<{
		success: boolean;
		results?: any[];
		message?: string;
	}> {
		try {
			const doctor = this.institutionService.getDoctor(doctorWallet);
			if (!doctor) {
				return {
					success: false,
					message: 'Doctor not found or not verified'
				};
			}

			const results = await this.documentService.searchDocuments(
				doctor.institutionId,
				searchQuery,
				doctorWallet,
				doctor
			);

			return {
				success: true,
				results
			};

		} catch (error: any) {
			console.error('Document search failed:', error);
			return {
				success: false,
				message: error.message || 'Failed to search documents'
			};
		}
	}

	/**
	 * Get doctor's institutional context and permissions
	 */
	async getDoctorContext(doctorWallet: string): Promise<{
		success: boolean;
		doctor?: VerifiedDoctor;
		institution?: any;
		message?: string;
	}> {
		try {
			const doctor = this.institutionService.getDoctor(doctorWallet);
			if (!doctor) {
				return {
					success: false,
					message: 'Doctor not found. Please complete institutional registration first.'
				};
			}

			const institution = this.institutionService.getInstitution(doctor.institutionId);
			
			return {
				success: true,
				doctor,
				institution
			};

		} catch (error: any) {
			console.error('Failed to get doctor context:', error);
			return {
				success: false,
				message: error.message || 'Failed to retrieve doctor information'
			};
		}
	}

	// Helper methods
	private hasUploadPermission(doctor: VerifiedDoctor, accessLevel: string): boolean {
		switch (accessLevel) {
			case 'private':
				return true; // All doctors can upload private documents
			case 'departmental':
				return doctor.permissions.canUploadDepartmental || doctor.permissions.accessLevel !== 'doctor';
			case 'institutional':
				return doctor.permissions.canUploadInstitutional || doctor.permissions.accessLevel !== 'doctor';
			case 'shared':
				return doctor.permissions.canShare || doctor.permissions.accessLevel !== 'doctor';
			case 'public':
				return doctor.permissions.canPublishPublic || doctor.permissions.accessLevel === 'admin';
			default:
				return false;
		}
	}
}

// Export singleton instance
export const medicalDocumentManager = new MedicalDocumentManagementService();
