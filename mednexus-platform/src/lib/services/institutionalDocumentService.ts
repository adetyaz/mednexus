import { browser } from '$app/environment';
import type { MedicalDataUpload } from './ogStorage';
import type { VerifiedDoctor, MedicalInstitution } from './medicalInstitutionService';

/**
 * Institutional Document Library Service
 * Manages documents at the hospital/institution level with proper access control
 */

export interface InstitutionalDocumentReference {
	fileId: string;
	fileName: string;
	fileType: string;
	uploadDate: string;
	fileSize: number;
	encryptionKey: string;
	storageHash: string;
	
	// Institutional metadata
	institutionId: string;
	departmentId?: string;
	uploadedBy: string; // Doctor wallet address
	accessLevel: 'private' | 'departmental' | 'institutional' | 'shared' | 'public';
	
	// Medical metadata
	medicalDataType: string;
	medicalSpecialty?: string;
	urgencyLevel?: string;
	
	// Approval system
	approvalStatus?: 'pending' | 'approved' | 'rejected';
	approvedBy?: string; // Department head or admin wallet
	approvalDate?: string;
	
	// Sharing
	sharedWith?: string[]; // Institution IDs for shared documents
	tags?: string[];
	description?: string;
}

export interface InstitutionDocumentLibrary {
	institutionId: string;
	departments: {
		[departmentId: string]: {
			privateDocuments: InstitutionalDocumentReference[];     // Doctor-specific
			departmentalDocuments: InstitutionalDocumentReference[]; // Department-wide
			institutionalDocuments: InstitutionalDocumentReference[]; // Hospital-wide
		}
	};
	sharedDocuments: InstitutionalDocumentReference[];        // Shared with other institutions
	publicDocuments: InstitutionalDocumentReference[];        // Public medical research
	lastUpdated: string;
}

export class InstitutionalDocumentService {
	private libraries: Map<string, InstitutionDocumentLibrary> = new Map();
	private storageKey = 'mednexus_institutional_documents';

	constructor() {
		if (browser) {
			this.loadFromStorage();
		}
	}

	/**
	 * Initialize document library for a new institution
	 */
	async initializeInstitutionLibrary(institutionId: string): Promise<void> {
		if (this.libraries.has(institutionId)) {
			return; // Already initialized
		}

		const library: InstitutionDocumentLibrary = {
			institutionId,
			departments: {},
			sharedDocuments: [],
			publicDocuments: [],
			lastUpdated: new Date().toISOString()
		};

		this.libraries.set(institutionId, library);
		this.saveToStorage();
	}

	/**
	 * Initialize department in institution library
	 */
	async initializeDepartment(institutionId: string, departmentId: string): Promise<void> {
		let library = this.libraries.get(institutionId);
		if (!library) {
			await this.initializeInstitutionLibrary(institutionId);
			library = this.libraries.get(institutionId)!;
		}

		if (!library.departments[departmentId]) {
			library.departments[departmentId] = {
				privateDocuments: [],
				departmentalDocuments: [],
				institutionalDocuments: []
			};
			
			library.lastUpdated = new Date().toISOString();
			this.libraries.set(institutionId, library);
			this.saveToStorage();
		}
	}

	/**
	 * Add document to institutional library
	 */
	async addDocumentToLibrary(
		file: MedicalDataUpload,
		doctor: VerifiedDoctor,
		accessLevel: 'private' | 'departmental' | 'institutional' | 'shared' | 'public',
		additionalInfo?: {
			description?: string;
			tags?: string[];
			sharedWith?: string[];
		}
	): Promise<void> {
		// Ensure institution and department libraries exist
		await this.initializeInstitutionLibrary(doctor.institutionId);
		await this.initializeDepartment(doctor.institutionId, doctor.department);

		const documentRef: InstitutionalDocumentReference = {
			fileId: file.id,
			fileName: file.filename,
			fileType: file.dataType,
			uploadDate: file.uploadDate,
			fileSize: file.fileSize,
			encryptionKey: file.encryptionKey,
			storageHash: file.storageHash,
			institutionId: doctor.institutionId,
			departmentId: doctor.department,
			uploadedBy: doctor.doctorWallet,
			accessLevel,
			medicalDataType: file.dataType,
			medicalSpecialty: file.medicalSpecialty,
			urgencyLevel: file.urgencyLevel,
			approvalStatus: accessLevel === 'institutional' ? 'pending' : 'approved',
			...additionalInfo
		};

		const library = this.libraries.get(doctor.institutionId)!;
		const department = library.departments[doctor.department];

		// Add to appropriate category based on access level
		switch (accessLevel) {
			case 'private':
				department.privateDocuments.push(documentRef);
				break;
			case 'departmental':
				department.departmentalDocuments.push(documentRef);
				break;
			case 'institutional':
				department.institutionalDocuments.push(documentRef);
				break;
			case 'shared':
				library.sharedDocuments.push(documentRef);
				break;
			case 'public':
				library.publicDocuments.push(documentRef);
				break;
		}

		library.lastUpdated = new Date().toISOString();
		this.libraries.set(doctor.institutionId, library);
		this.saveToStorage();
	}

	/**
	 * Get documents accessible to a specific doctor
	 */
	async getAccessibleDocuments(
		doctorWallet: string,
		doctor: VerifiedDoctor,
		category?: 'private' | 'departmental' | 'institutional' | 'shared' | 'public'
	): Promise<{
		privateDocuments: InstitutionalDocumentReference[];
		departmentalDocuments: InstitutionalDocumentReference[];
		institutionalDocuments: InstitutionalDocumentReference[];
		sharedDocuments: InstitutionalDocumentReference[];
		publicDocuments: InstitutionalDocumentReference[];
	}> {
		const library = this.libraries.get(doctor.institutionId);
		if (!library) {
			return {
				privateDocuments: [],
				departmentalDocuments: [],
				institutionalDocuments: [],
				sharedDocuments: [],
				publicDocuments: []
			};
		}

		const department = library.departments[doctor.department] || {
			privateDocuments: [],
			departmentalDocuments: [],
			institutionalDocuments: []
		};

		// Filter documents based on access permissions
		const privateDocuments = department.privateDocuments
			.filter(doc => doc.uploadedBy === doctorWallet);

		const departmentalDocuments = department.departmentalDocuments
			.filter(doc => doc.approvalStatus === 'approved');

		// For institutional documents, show from all departments if doctor has permission
		let institutionalDocuments: InstitutionalDocumentReference[] = [];
		if (doctor.permissions.canViewAllDepartments || doctor.permissions.accessLevel !== 'doctor') {
			// Show from all departments
			Object.values(library.departments).forEach(dept => {
				institutionalDocuments.push(...dept.institutionalDocuments
					.filter(doc => doc.approvalStatus === 'approved'));
			});
		} else {
			// Show only from their department
			institutionalDocuments = department.institutionalDocuments
				.filter(doc => doc.approvalStatus === 'approved');
		}

		const sharedDocuments = library.sharedDocuments
			.filter(doc => doc.approvalStatus === 'approved');

		// Public documents from all institutions
		const publicDocuments: InstitutionalDocumentReference[] = [];
		this.libraries.forEach(lib => {
			publicDocuments.push(...lib.publicDocuments
				.filter(doc => doc.approvalStatus === 'approved'));
		});

		return {
			privateDocuments,
			departmentalDocuments,
			institutionalDocuments,
			sharedDocuments,
			publicDocuments
		};
	}

	/**
	 * Approve or reject institutional documents
	 */
	async approveDocument(
		documentId: string,
		institutionId: string,
		approverWallet: string,
		approved: boolean,
		approver: VerifiedDoctor
	): Promise<void> {
		const library = this.libraries.get(institutionId);
		if (!library) {
			throw new Error('Institution library not found');
		}

		// Check if approver has permission
		if (!approver.permissions.canManageUsers && approver.permissions.accessLevel === 'doctor') {
			throw new Error('Insufficient permissions to approve documents');
		}

		// Find document across all categories
		let documentFound = false;
		
		// Check institutional documents in all departments
		Object.values(library.departments).forEach(dept => {
			const docIndex = dept.institutionalDocuments.findIndex(doc => doc.fileId === documentId);
			if (docIndex !== -1) {
				dept.institutionalDocuments[docIndex].approvalStatus = approved ? 'approved' : 'rejected';
				dept.institutionalDocuments[docIndex].approvedBy = approverWallet;
				dept.institutionalDocuments[docIndex].approvalDate = new Date().toISOString();
				documentFound = true;
			}
		});

		// Check shared documents
		const sharedIndex = library.sharedDocuments.findIndex(doc => doc.fileId === documentId);
		if (sharedIndex !== -1) {
			library.sharedDocuments[sharedIndex].approvalStatus = approved ? 'approved' : 'rejected';
			library.sharedDocuments[sharedIndex].approvedBy = approverWallet;
			library.sharedDocuments[sharedIndex].approvalDate = new Date().toISOString();
			documentFound = true;
		}

		// Check public documents
		const publicIndex = library.publicDocuments.findIndex(doc => doc.fileId === documentId);
		if (publicIndex !== -1) {
			library.publicDocuments[publicIndex].approvalStatus = approved ? 'approved' : 'rejected';
			library.publicDocuments[publicIndex].approvedBy = approverWallet;
			library.publicDocuments[publicIndex].approvalDate = new Date().toISOString();
			documentFound = true;
		}

		if (!documentFound) {
			throw new Error('Document not found');
		}

		library.lastUpdated = new Date().toISOString();
		this.libraries.set(institutionId, library);
		this.saveToStorage();
	}

	/**
	 * Share document with another institution
	 */
	async shareDocumentWithInstitution(
		documentId: string,
		fromInstitutionId: string,
		toInstitutionId: string,
		sharerWallet: string,
		sharer: VerifiedDoctor
	): Promise<void> {
		if (!sharer.permissions.canShare) {
			throw new Error('Doctor does not have permission to share documents');
		}

		const fromLibrary = this.libraries.get(fromInstitutionId);
		const toLibrary = this.libraries.get(toInstitutionId);

		if (!fromLibrary || !toLibrary) {
			throw new Error('Institution library not found');
		}

		// Find document to share
		let documentToShare: InstitutionalDocumentReference | null = null;

		// Search in accessible documents
		Object.values(fromLibrary.departments).forEach(dept => {
			const doc = dept.institutionalDocuments.find(d => d.fileId === documentId);
			if (doc && (doc.uploadedBy === sharerWallet || sharer.permissions.canViewAllDepartments)) {
				documentToShare = { ...doc, accessLevel: 'shared', sharedWith: [toInstitutionId] };
			}
		});

		if (!documentToShare) {
			throw new Error('Document not found or insufficient permissions to share');
		}

		// Add to target institution's shared documents
		toLibrary.sharedDocuments.push(documentToShare);
		toLibrary.lastUpdated = new Date().toISOString();

		this.libraries.set(toInstitutionId, toLibrary);
		this.saveToStorage();
	}

	/**
	 * Get library statistics for an institution
	 */
	async getLibraryStatistics(institutionId: string): Promise<{
		totalDocuments: number;
		documentsByCategory: Record<string, number>;
		documentsByDepartment: Record<string, number>;
		pendingApprovals: number;
		recentDocuments: InstitutionalDocumentReference[];
	}> {
		const library = this.libraries.get(institutionId);
		if (!library) {
			return {
				totalDocuments: 0,
				documentsByCategory: {},
				documentsByDepartment: {},
				pendingApprovals: 0,
				recentDocuments: []
			};
		}

		let totalDocuments = 0;
		let pendingApprovals = 0;
		const documentsByCategory: Record<string, number> = {
			private: 0,
			departmental: 0,
			institutional: 0,
			shared: 0,
			public: 0
		};
		const documentsByDepartment: Record<string, number> = {};
		const allDocuments: InstitutionalDocumentReference[] = [];

		// Count department documents
		Object.entries(library.departments).forEach(([deptId, dept]) => {
			const deptTotal = dept.privateDocuments.length + dept.departmentalDocuments.length + dept.institutionalDocuments.length;
			documentsByDepartment[deptId] = deptTotal;
			totalDocuments += deptTotal;

			documentsByCategory.private += dept.privateDocuments.length;
			documentsByCategory.departmental += dept.departmentalDocuments.length;
			documentsByCategory.institutional += dept.institutionalDocuments.length;

			allDocuments.push(...dept.privateDocuments, ...dept.departmentalDocuments, ...dept.institutionalDocuments);

			// Count pending approvals
			pendingApprovals += dept.institutionalDocuments.filter(doc => doc.approvalStatus === 'pending').length;
		});

		// Add shared and public documents
		totalDocuments += library.sharedDocuments.length + library.publicDocuments.length;
		documentsByCategory.shared = library.sharedDocuments.length;
		documentsByCategory.public = library.publicDocuments.length;
		
		allDocuments.push(...library.sharedDocuments, ...library.publicDocuments);
		pendingApprovals += library.sharedDocuments.filter(doc => doc.approvalStatus === 'pending').length;
		pendingApprovals += library.publicDocuments.filter(doc => doc.approvalStatus === 'pending').length;

		// Get recent documents (last 10)
		const recentDocuments = allDocuments
			.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
			.slice(0, 10);

		return {
			totalDocuments,
			documentsByCategory,
			documentsByDepartment,
			pendingApprovals,
			recentDocuments
		};
	}

	/**
	 * Search documents across institution
	 */
	async searchDocuments(
		institutionId: string,
		searchQuery: {
			fileName?: string;
			medicalDataType?: string;
			medicalSpecialty?: string;
			department?: string;
			dateRange?: { start: string; end: string };
			tags?: string[];
		},
		searcherWallet: string,
		searcher: VerifiedDoctor
	): Promise<InstitutionalDocumentReference[]> {
		const accessibleDocs = await this.getAccessibleDocuments(searcherWallet, searcher);
		const allAccessibleDocs = [
			...accessibleDocs.privateDocuments,
			...accessibleDocs.departmentalDocuments,
			...accessibleDocs.institutionalDocuments,
			...accessibleDocs.sharedDocuments,
			...accessibleDocs.publicDocuments
		];

		return allAccessibleDocs.filter(doc => {
			// Apply search filters
			if (searchQuery.fileName && !doc.fileName.toLowerCase().includes(searchQuery.fileName.toLowerCase())) {
				return false;
			}
			
			if (searchQuery.medicalDataType && doc.medicalDataType !== searchQuery.medicalDataType) {
				return false;
			}
			
			if (searchQuery.medicalSpecialty && doc.medicalSpecialty !== searchQuery.medicalSpecialty) {
				return false;
			}
			
			if (searchQuery.department && doc.departmentId !== searchQuery.department) {
				return false;
			}
			
			if (searchQuery.dateRange) {
				const docDate = new Date(doc.uploadDate);
				const startDate = new Date(searchQuery.dateRange.start);
				const endDate = new Date(searchQuery.dateRange.end);
				if (docDate < startDate || docDate > endDate) {
					return false;
				}
			}
			
			if (searchQuery.tags && searchQuery.tags.length > 0) {
				const docTags = doc.tags || [];
				if (!searchQuery.tags.some(tag => docTags.includes(tag))) {
					return false;
				}
			}

			return true;
		});
	}

	// Private helper methods
	private loadFromStorage(): void {
		if (!browser) return;

		try {
			const data = localStorage.getItem(this.storageKey);
			if (data) {
				const parsed = JSON.parse(data);
				this.libraries = new Map(Object.entries(parsed));
			}
		} catch (error) {
			console.error('Failed to load institutional document data from storage:', error);
		}
	}

	private saveToStorage(): void {
		if (!browser) return;

		try {
			const obj = Object.fromEntries(this.libraries);
			localStorage.setItem(this.storageKey, JSON.stringify(obj));
		} catch (error) {
			console.error('Failed to save institutional document data to storage:', error);
		}
	}
}
