import { browser } from '$app/environment';

/**
 * Medical Institution Management Service
 * Handles hospital registration, verification, and management
 */

export interface MedicalInstitution {
	institutionId: string;
	name: string;
	address: string;
	licenseNumber: string;
	verificationStatus: 'pending' | 'verified' | 'rejected';
	adminWallet: string;
	contactInfo: {
		email: string;
		phone: string;
		website?: string;
	};
	departments: Department[];
	registrationDate: string;
	verifiedBy?: string;
	verificationDocuments: string[]; // IPFS hashes of verification docs
}

export interface Department {
	departmentId: string;
	name: string;
	headOfDepartment?: string;
	specialties: string[];
	doctorCount: number;
}

export interface VerifiedDoctor {
	doctorWallet: string;
	institutionId: string;
	medicalLicense: string;
	name: string;
	specialty: string;
	department: string;
	verificationStatus: 'pending' | 'verified' | 'suspended';
	verificationDate?: string;
	verifiedBy?: string;
	permissions: DoctorPermissions;
	profileInfo: {
		email: string;
		phone?: string;
		yearsExperience: number;
		education: string[];
	};
}

export interface DoctorPermissions {
	canUpload: boolean;
	canShare: boolean;
	canViewAllDepartments: boolean;
	canManageUsers: boolean;
	canUploadDepartmental: boolean;
	canUploadInstitutional: boolean;
	canPublishPublic: boolean;
	accessLevel: 'doctor' | 'department_head' | 'admin';
}

export class MedicalInstitutionService {
	private institutions: Map<string, MedicalInstitution> = new Map();
	private doctors: Map<string, VerifiedDoctor> = new Map();
	private storageKey = 'mednexus_institutions';
	private doctorsStorageKey = 'mednexus_doctors';

	constructor() {
		if (browser) {
			this.loadFromStorage();
		}
	}

	/**
	 * Register a new medical institution
	 */
	async registerInstitution(institutionData: Omit<MedicalInstitution, 'institutionId' | 'registrationDate' | 'verificationStatus'>): Promise<string> {
		const institutionId = this.generateInstitutionId(institutionData.name);
		
		const institution: MedicalInstitution = {
			...institutionData,
			institutionId,
			registrationDate: new Date().toISOString(),
			verificationStatus: 'pending'
		};

		this.institutions.set(institutionId, institution);
		this.saveToStorage();

		return institutionId;
	}

	/**
	 * Register a doctor with an institution
	 */
	async registerDoctor(doctorData: Omit<VerifiedDoctor, 'verificationStatus' | 'permissions'>): Promise<void> {
		const doctor: VerifiedDoctor = {
			...doctorData,
			verificationStatus: 'pending',
			permissions: {
				canUpload: true,
				canShare: true,
				canViewAllDepartments: false,
				canManageUsers: false,
				canUploadDepartmental: false,
				canUploadInstitutional: false,
				canPublishPublic: false,
				accessLevel: 'doctor'
			}
		};

		this.doctors.set(doctorData.doctorWallet, doctor);
		this.saveToStorage();
	}

	/**
	 * Verify an institution (admin function)
	 */
	async verifyInstitution(institutionId: string, verifierWallet: string, approved: boolean): Promise<void> {
		const institution = this.institutions.get(institutionId);
		if (!institution) {
			throw new Error('Institution not found');
		}

		institution.verificationStatus = approved ? 'verified' : 'rejected';
		institution.verifiedBy = verifierWallet;
		
		this.institutions.set(institutionId, institution);
		this.saveToStorage();
	}

	/**
	 * Verify a doctor (institution admin function)
	 */
	async verifyDoctor(doctorWallet: string, verifierWallet: string, approved: boolean): Promise<void> {
		const doctor = this.doctors.get(doctorWallet);
		if (!doctor) {
			throw new Error('Doctor not found');
		}

		const verifierDoctor = this.doctors.get(verifierWallet);
		const institution = this.institutions.get(doctor.institutionId);
		
		// Check if verifier has permission to verify doctors
		const canVerify = institution?.adminWallet === verifierWallet || 
						 (verifierDoctor?.permissions.accessLevel === 'admin' || 
						  verifierDoctor?.permissions.accessLevel === 'department_head');

		if (!canVerify) {
			throw new Error('Insufficient permissions to verify doctor');
		}

		doctor.verificationStatus = approved ? 'verified' : 'suspended';
		doctor.verifiedBy = verifierWallet;
		doctor.verificationDate = new Date().toISOString();

		this.doctors.set(doctorWallet, doctor);
		this.saveToStorage();
	}

	/**
	 * Get institution by ID
	 */
	getInstitution(institutionId: string): MedicalInstitution | null {
		return this.institutions.get(institutionId) || null;
	}

	/**
	 * Get doctor by wallet address
	 */
	getDoctor(walletAddress: string): VerifiedDoctor | null {
		return this.doctors.get(walletAddress) || null;
	}

	/**
	 * Get all verified institutions
	 */
	getVerifiedInstitutions(): MedicalInstitution[] {
		return Array.from(this.institutions.values())
			.filter(inst => inst.verificationStatus === 'verified');
	}

	/**
	 * Get all doctors in an institution
	 */
	getInstitutionDoctors(institutionId: string): VerifiedDoctor[] {
		return Array.from(this.doctors.values())
			.filter(doctor => doctor.institutionId === institutionId);
	}

	/**
	 * Get doctors in a specific department
	 */
	getDepartmentDoctors(institutionId: string, departmentId: string): VerifiedDoctor[] {
		return Array.from(this.doctors.values())
			.filter(doctor => 
				doctor.institutionId === institutionId && 
				doctor.department === departmentId &&
				doctor.verificationStatus === 'verified'
			);
	}

	/**
	 * Check if a doctor can access documents from another doctor
	 */
	canAccessDocuments(requestingDoctor: string, documentOwner: string, documentAccessLevel: string): boolean {
		const requester = this.getDoctor(requestingDoctor);
		const owner = this.getDoctor(documentOwner);

		if (!requester || !owner) return false;
		if (requester.verificationStatus !== 'verified') return false;

		// Same doctor can always access their own documents
		if (requestingDoctor === documentOwner) return true;

		// Public documents accessible to all verified doctors
		if (documentAccessLevel === 'public') return true;

		// Check institutional and departmental access
		const sameInstitution = requester.institutionId === owner.institutionId;
		const sameDepartment = sameInstitution && requester.department === owner.department;

		switch (documentAccessLevel) {
			case 'private':
				return false; // Only owner can access
			case 'departmental':
				return sameDepartment;
			case 'institutional':
				return sameInstitution;
			case 'shared':
				// Would need additional logic for explicit sharing
				return sameInstitution;
			default:
				return false;
		}
	}

	/**
	 * Add department to institution
	 */
	async addDepartment(institutionId: string, department: Omit<Department, 'departmentId' | 'doctorCount'>): Promise<void> {
		const institution = this.institutions.get(institutionId);
		if (!institution) {
			throw new Error('Institution not found');
		}

		const departmentId = this.generateDepartmentId(department.name);
		const newDepartment: Department = {
			...department,
			departmentId,
			doctorCount: 0
		};

		institution.departments.push(newDepartment);
		this.institutions.set(institutionId, institution);
		this.saveToStorage();
	}

	/**
	 * Update doctor permissions
	 */
	async updateDoctorPermissions(doctorWallet: string, permissions: Partial<DoctorPermissions>, updaterWallet: string): Promise<void> {
		const doctor = this.doctors.get(doctorWallet);
		if (!doctor) {
			throw new Error('Doctor not found');
		}

		const updater = this.doctors.get(updaterWallet);
		const institution = this.institutions.get(doctor.institutionId);

		// Check permissions
		const canUpdate = institution?.adminWallet === updaterWallet ||
						 (updater?.permissions.accessLevel === 'admin') ||
						 (updater?.permissions.accessLevel === 'department_head' && updater.department === doctor.department);

		if (!canUpdate) {
			throw new Error('Insufficient permissions to update doctor permissions');
		}

		doctor.permissions = { ...doctor.permissions, ...permissions };
		this.doctors.set(doctorWallet, doctor);
		this.saveToStorage();
	}

	// Private helper methods
	private generateInstitutionId(name: string): string {
		const timestamp = Date.now();
		const nameSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
		return `inst_${nameSlug}_${timestamp}`;
	}

	private generateDepartmentId(name: string): string {
		const timestamp = Date.now();
		const nameSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
		return `dept_${nameSlug}_${timestamp}`;
	}

	private loadFromStorage(): void {
		if (!browser) return;

		try {
			const institutionsData = localStorage.getItem(this.storageKey);
			if (institutionsData) {
				const parsed = JSON.parse(institutionsData);
				this.institutions = new Map(Object.entries(parsed));
			}

			const doctorsData = localStorage.getItem(this.doctorsStorageKey);
			if (doctorsData) {
				const parsed = JSON.parse(doctorsData);
				this.doctors = new Map(Object.entries(parsed));
			}
		} catch (error) {
			console.error('Failed to load institution data from storage:', error);
		}
	}

	private saveToStorage(): void {
		if (!browser) return;

		try {
			const institutionsObj = Object.fromEntries(this.institutions);
			localStorage.setItem(this.storageKey, JSON.stringify(institutionsObj));

			const doctorsObj = Object.fromEntries(this.doctors);
			localStorage.setItem(this.doctorsStorageKey, JSON.stringify(doctorsObj));
		} catch (error) {
			console.error('Failed to save institution data to storage:', error);
		}
	}
}
