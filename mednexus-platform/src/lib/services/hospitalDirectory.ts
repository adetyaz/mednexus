import { browser } from '$app/environment';

/**
 * Hospital Directory Service
 * Manages available hospitals for doctor registration
 * In production, this would integrate with official medical directories
 */

export interface HospitalProfile {
	id: string;
	name: string;
	address: string;
	licenseNumber: string;
	accreditation: string;
	contactInfo: {
		phone: string;
		email: string;
		emergencyContact: string;
	};
	departments: string[];
	country: string;
	region: string;
	verified: boolean;
	registrationDate: string;
}

export interface DoctorProfile {
	walletAddress: string;
	name: string;
	medicalLicenseNumber: string;
	institutionId: string;
	department: string;
	medicalSpecialty: string;
	yearsOfExperience: number;
	contactInfo: {
		phone: string;
		email: string;
	};
	verificationStatus: 'pending' | 'verified' | 'rejected';
	permissions: {
		canUpload: boolean;
		canShare: boolean;
		canViewAllDepartments: boolean;
		canManageUsers: boolean;
		canUploadDepartmental: boolean;
		canUploadInstitutional: boolean;
		canPublishPublic: boolean;
		accessLevel: 'doctor' | 'department_head' | 'admin';
	};
}

// Demo hospitals for testing
const DEMO_HOSPITALS: HospitalProfile[] = [
	{
		id: 'mercy-general-sf',
		name: 'Mercy General Hospital',
		address: '1234 Medical Center Drive, San Francisco, CA 94115',
		licenseNumber: 'CA-HOSP-001234',
		accreditation: 'Joint Commission, AAAHC',
		contactInfo: {
			phone: '+1 (415) 567-8900',
			email: 'admin@mercygeneral.org',
			emergencyContact: '+1 (415) 567-8911'
		},
		departments: [
			'Emergency Medicine',
			'Cardiology', 
			'Neurology',
			'Orthopedics',
			'Internal Medicine',
			'Radiology',
			'Surgery',
			'Pediatrics'
		],
		country: 'United States',
		region: 'North America',
		verified: true,
		registrationDate: '2024-01-15T00:00:00Z'
	},
	{
		id: 'st-marys-london',
		name: "St. Mary's Hospital London",
		address: 'Praed Street, Paddington, London W2 1NY, UK',
		licenseNumber: 'UK-NHS-007842',
		accreditation: 'CQC Outstanding, UKAS',
		contactInfo: {
			phone: '+44 20 3312 6666',
			email: 'enquiries@stmarys.nhs.uk',
			emergencyContact: '+44 20 3312 6000'
		},
		departments: [
			'Accident & Emergency',
			'Cardiothoracic Surgery',
			'Neurology',
			'Oncology',
			'General Surgery',
			'Radiology',
			'Intensive Care',
			'Paediatrics'
		],
		country: 'United Kingdom',
		region: 'Europe',
		verified: true,
		registrationDate: '2024-02-01T00:00:00Z'
	},
	{
		id: 'toronto-general',
		name: 'Toronto General Hospital',
		address: '200 Elizabeth St, Toronto, ON M5G 2C4, Canada',
		licenseNumber: 'ON-HOSP-092847',
		accreditation: 'Accreditation Canada, CPSO',
		contactInfo: {
			phone: '+1 (416) 340-4800',
			email: 'info@uhn.ca',
			emergencyContact: '+1 (416) 340-4900'
		},
		departments: [
			'Emergency Department',
			'Cardiac Surgery',
			'Transplant Surgery',
			'Medical Imaging',
			'Internal Medicine',
			'Critical Care',
			'Nephrology',
			'Gastroenterology'
		],
		country: 'Canada',
		region: 'North America',
		verified: true,
		registrationDate: '2024-02-10T00:00:00Z'
	},
	{
		id: 'royal-melbourne',
		name: 'Royal Melbourne Hospital',
		address: '300 Grattan Street, Parkville, VIC 3050, Australia',
		licenseNumber: 'AU-VIC-045612',
		accreditation: 'ACHS, NSQHS Standards',
		contactInfo: {
			phone: '+61 3 9342 7000',
			email: 'info@mh.org.au',
			emergencyContact: '+61 3 9342 7777'
		},
		departments: [
			'Emergency',
			'Cardiology',
			'Neurosurgery',
			'Oncology',
			'Trauma Surgery',
			'Medical Imaging',
			'ICU',
			'Rehabilitation'
		],
		country: 'Australia',
		region: 'Oceania',
		verified: true,
		registrationDate: '2024-02-20T00:00:00Z'
	},
	{
		id: 'charite-berlin',
		name: 'Charité - Universitätsmedizin Berlin',
		address: 'Charitéplatz 1, 10117 Berlin, Germany',
		licenseNumber: 'DE-BE-078123',
		accreditation: 'DIN EN ISO 9001, KTQ',
		contactInfo: {
			phone: '+49 30 450 50',
			email: 'info@charite.de',
			emergencyContact: '+49 30 450 531 000'
		},
		departments: [
			'Notaufnahme',
			'Kardiologie',
			'Neurochirurgie',
			'Onkologie',
			'Radiologie',
			'Chirurgie',
			'Innere Medizin',
			'Intensivmedizin'
		],
		country: 'Germany',
		region: 'Europe',
		verified: true,
		registrationDate: '2024-03-01T00:00:00Z'
	},
	{
		id: 'tokyo-university',
		name: 'University of Tokyo Hospital',
		address: '7-3-1 Hongo, Bunkyo City, Tokyo 113-8655, Japan',
		licenseNumber: 'JP-TO-156789',
		accreditation: 'JCI, JMIP',
		contactInfo: {
			phone: '+81 3-3815-5411',
			email: 'info@h.u-tokyo.ac.jp',
			emergencyContact: '+81 3-3815-5411'
		},
		departments: [
			'Emergency Medicine',
			'Cardiology',
			'Neurology',
			'Oncology',
			'Surgery',
			'Radiology',
			'Internal Medicine',
			'Pediatrics'
		],
		country: 'Japan',
		region: 'Asia',
		verified: true,
		registrationDate: '2024-03-15T00:00:00Z'
	}
];

export class HospitalDirectoryService {
	private hospitals: HospitalProfile[] = [];
	private storageKey = 'mednexus_hospital_directory';

	constructor() {
		if (browser) {
			this.loadHospitals();
		}
	}

	/**
	 * Initialize with demo hospitals
	 */
	private loadHospitals(): void {
		try {
			const stored = localStorage.getItem(this.storageKey);
			if (stored) {
				this.hospitals = JSON.parse(stored);
			} else {
				// Initialize with demo hospitals
				this.hospitals = [...DEMO_HOSPITALS];
				this.saveHospitals();
			}
		} catch (error) {
			console.error('Failed to load hospitals from storage:', error);
			this.hospitals = [...DEMO_HOSPITALS];
		}
	}

	/**
	 * Save hospitals to local storage
	 */
	private saveHospitals(): void {
		if (!browser) return;
		
		try {
			localStorage.setItem(this.storageKey, JSON.stringify(this.hospitals));
		} catch (error) {
			console.error('Failed to save hospitals to storage:', error);
		}
	}

	/**
	 * Get all verified hospitals
	 */
	getVerifiedHospitals(): HospitalProfile[] {
		return this.hospitals.filter(hospital => hospital.verified);
	}

	/**
	 * Get hospitals by country
	 */
	getHospitalsByCountry(country: string): HospitalProfile[] {
		return this.hospitals.filter(hospital => 
			hospital.country === country && hospital.verified
		);
	}

	/**
	 * Get hospitals by region
	 */
	getHospitalsByRegion(region: string): HospitalProfile[] {
		return this.hospitals.filter(hospital => 
			hospital.region === region && hospital.verified
		);
	}

	/**
	 * Get hospital by ID
	 */
	getHospital(id: string): HospitalProfile | null {
		return this.hospitals.find(hospital => hospital.id === id) || null;
	}

	/**
	 * Search hospitals by name
	 */
	searchHospitals(query: string): HospitalProfile[] {
		const lowercaseQuery = query.toLowerCase();
		return this.hospitals.filter(hospital =>
			hospital.verified && (
				hospital.name.toLowerCase().includes(lowercaseQuery) ||
				hospital.address.toLowerCase().includes(lowercaseQuery) ||
				hospital.country.toLowerCase().includes(lowercaseQuery)
			)
		);
	}

	/**
	 * Get departments for a hospital
	 */
	getHospitalDepartments(hospitalId: string): string[] {
		const hospital = this.getHospital(hospitalId);
		return hospital ? hospital.departments : [];
	}

	/**
	 * Add a new hospital (admin function)
	 */
	addHospital(hospital: Omit<HospitalProfile, 'registrationDate'>): string {
		const newHospital: HospitalProfile = {
			...hospital,
			registrationDate: new Date().toISOString()
		};
		
		this.hospitals.push(newHospital);
		this.saveHospitals();
		
		return newHospital.id;
	}

	/**
	 * Verify a hospital (admin function)
	 */
	verifyHospital(hospitalId: string): boolean {
		const hospital = this.hospitals.find(h => h.id === hospitalId);
		if (hospital) {
			hospital.verified = true;
			this.saveHospitals();
			return true;
		}
		return false;
	}

	/**
	 * Get available countries
	 */
	getAvailableCountries(): string[] {
		const countries = new Set(this.hospitals
			.filter(h => h.verified)
			.map(h => h.country));
		return Array.from(countries).sort();
	}

	/**
	 * Get available regions
	 */
	getAvailableRegions(): string[] {
		const regions = new Set(this.hospitals
			.filter(h => h.verified)
			.map(h => h.region));
		return Array.from(regions).sort();
	}

	/**
	 * Get hospital statistics
	 */
	getStatistics(): {
		totalHospitals: number;
		verifiedHospitals: number;
		hospitalsByRegion: Record<string, number>;
		hospitalsByCountry: Record<string, number>;
	} {
		const verified = this.hospitals.filter(h => h.verified);
		
		const byRegion: Record<string, number> = {};
		const byCountry: Record<string, number> = {};
		
		verified.forEach(hospital => {
			byRegion[hospital.region] = (byRegion[hospital.region] || 0) + 1;
			byCountry[hospital.country] = (byCountry[hospital.country] || 0) + 1;
		});
		
		return {
			totalHospitals: this.hospitals.length,
			verifiedHospitals: verified.length,
			hospitalsByRegion: byRegion,
			hospitalsByCountry: byCountry
		};
	}
}

// Export singleton instance
export const hospitalDirectory = new HospitalDirectoryService();
