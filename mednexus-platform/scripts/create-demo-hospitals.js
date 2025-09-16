// Demo Hospitals for MedNexus Testing
// This file creates demo medical institutions that can be used for testing
// In production, hospitals would register through official verification processes

const DEMO_HOSPITALS = [
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

// Demo Doctors for testing (linked to hospitals above)
const DEMO_DOCTORS = [
	{
		walletAddress: '0x99BD4BDD7A9c22E2a35F09A6Bd17f038D5E5eB87', // Test wallet for Dr. Sarah Johnson
		name: 'Dr. Sarah Johnson',
		medicalLicenseNumber: 'CA-MD-789012',
		institutionId: 'mercy-general-sf',
		department: 'Cardiology',
		medicalSpecialty: 'Interventional Cardiology',
		yearsOfExperience: 15,
		contactInfo: {
			phone: '+1 (415) 567-8920',
			email: 'sarah.johnson@mercygeneral.org'
		},
		verificationStatus: 'verified',
		permissions: {
			canUpload: true,
			canShare: true,
			canViewAllDepartments: false,
			canManageUsers: false,
			canUploadDepartmental: true,
			canUploadInstitutional: false,
			canPublishPublic: false,
			accessLevel: 'doctor'
		}
	},
	{
		walletAddress: '0x59A0B39f49EBe851c97E654166A480E7d41122c6', // Test wallet for Dr. Michael Chen
		name: 'Dr. Michael Chen',
		medicalLicenseNumber: 'UK-GMC-456789',
		institutionId: 'st-marys-london',
		department: 'Emergency Medicine',
		medicalSpecialty: 'Emergency Medicine',
		yearsOfExperience: 10,
		contactInfo: {
			phone: '+44 20 3312 6700',
			email: 'michael.chen@stmarys.nhs.uk'
		},
		verificationStatus: 'verified',
		permissions: {
			canUpload: true,
			canShare: true,
			canViewAllDepartments: false,
			canManageUsers: false,
			canUploadDepartmental: true,
			canUploadInstitutional: false,
			canPublishPublic: false,
			accessLevel: 'doctor'
		}
	},
	{
		walletAddress: '0x8D8f96F92de3CbBc9b3c1048bDf3ce08DF7B1a40', // Test wallet for Dr. Emily Rodriguez
		name: 'Dr. Emily Rodriguez',
		medicalLicenseNumber: 'ON-CPSO-123456',
		institutionId: 'toronto-general',
		department: 'Cardiac Surgery',
		medicalSpecialty: 'Cardiothoracic Surgery',
		yearsOfExperience: 20,
		contactInfo: {
			phone: '+1 (416) 340-4850',
			email: 'emily.rodriguez@uhn.ca'
		},
		verificationStatus: 'verified',
		permissions: {
			canUpload: true,
			canShare: true,
			canViewAllDepartments: true,
			canManageUsers: true,
			canUploadDepartmental: true,
			canUploadInstitutional: true,
			canPublishPublic: false,
			accessLevel: 'department_head'
		}
	}
];

// Export for use in services
if (typeof module !== 'undefined' && module.exports) {
	module.exports = {
		DEMO_HOSPITALS,
		DEMO_DOCTORS
	};
}

// Browser/ES6 export
if (typeof window !== 'undefined') {
	window.DEMO_HOSPITALS = DEMO_HOSPITALS;
	window.DEMO_DOCTORS = DEMO_DOCTORS;
}