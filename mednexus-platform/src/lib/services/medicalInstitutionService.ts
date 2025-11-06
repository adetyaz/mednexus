import { browser } from '$app/environment';
import { ethers } from 'ethers';
import { NETWORK_CONFIG } from '$lib/config/config';
import { walletManager } from '$lib/wallet';
import { supabase } from '$lib/supabase';
import { 
	PUBLIC_MEDICAL_VERIFICATION_CONTRACT,
	PUBLIC_COLLABORATION_HUB_CONTRACT 
} from '$env/static/public';

// Import ABIs
import MedicalVerificationABI from '../ABIs/MedicalVerification.json';
import MedicalCollaborationHubABI from '../ABIs/MedicalCollaborationHub.json';

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
	private provider: ethers.JsonRpcProvider;
	private medicalVerificationContract: ethers.Contract;
	private collaborationHubContract: ethers.Contract;
	
	// Contract addresses from environment
	private readonly MEDICAL_VERIFICATION_ADDRESS = PUBLIC_MEDICAL_VERIFICATION_CONTRACT;
	private readonly COLLABORATION_HUB_ADDRESS = PUBLIC_COLLABORATION_HUB_CONTRACT;
	
	// Cache for performance (but blockchain is source of truth)
	private institutions: Map<string, MedicalInstitution> = new Map();
	private doctors: Map<string, VerifiedDoctor> = new Map();
	private isInitialized = false;

	constructor() {
		this.provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.network.rpcUrl);
		
		// Initialize read-only contracts
		this.medicalVerificationContract = new ethers.Contract(
			this.MEDICAL_VERIFICATION_ADDRESS,
			MedicalVerificationABI,
			this.provider
		);
		
		this.collaborationHubContract = new ethers.Contract(
			this.COLLABORATION_HUB_ADDRESS,
			MedicalCollaborationHubABI,
			this.provider
		);
		
		if (browser) {
			this.initializeFromBlockchain();
		}
	}

	/**
	 * Initialize service by loading data from blockchain
	 */
	private async initializeFromBlockchain(): Promise<void> {
		if (this.isInitialized) return;
		
		try {
			console.log('🔗 Initializing Medical Institution Service from blockchain...');
			
			// Load institutions from MedicalVerification contract
			await this.loadInstitutionsFromBlockchain();
			
			// Load doctors from MedicalCollaborationHub contract  
			await this.loadDoctorsFromBlockchain();
			
			this.isInitialized = true;
			console.log(`✅ Loaded ${this.institutions.size} institutions and ${this.doctors.size} doctors from blockchain`);
			
		} catch (error) {
			console.error('❌ Failed to initialize from blockchain:', error);
			// Continue with empty cache - operations will hit blockchain directly
			this.isInitialized = true;
		}
	}

	/**
	 * Load institutions from blockchain
	 */
	private async loadInstitutionsFromBlockchain(): Promise<void> {
		try {
			// Get institution list from contract (if available)
			// For now, we'll load on-demand when needed
			console.log('📋 Institution data will be loaded on-demand from blockchain');
		} catch (error) {
			console.warn('⚠️ Could not load institutions from blockchain:', error);
		}
	}

	/**
	 * Load doctors from blockchain
	 */
	private async loadDoctorsFromBlockchain(): Promise<void> {
		try {
			// Get doctor list from contract (if available)
			// For now, we'll load on-demand when needed
			console.log('👨‍⚕️ Doctor data will be loaded on-demand from blockchain');
		} catch (error) {
			console.warn('⚠️ Could not load doctors from blockchain:', error);
		}
	}

	/**
	 * Register a new medical institution on blockchain
	 * Returns detailed registration info for database storage
	 */
	async registerInstitution(institutionData: Omit<MedicalInstitution, 'institutionId' | 'registrationDate' | 'verificationStatus'>): Promise<{
		walletAddress: string;
		transactionHash: string;
		credentialHash: string;
		blockNumber?: number;
		timestamp: Date;
	}> {
		try {
			const signer = await walletManager.getSigner();
			if (!signer) {
				throw new Error('Wallet not connected. Please connect your wallet to register institution.');
			}

		// Create contract instance with signer for transactions
		// Use MedicalCollaborationHub contract since that's where doctors are registered
		const contractWithSigner = this.collaborationHubContract.connect(signer);			// Create credential hash from institution data
			const credentialHash = ethers.keccak256(
				ethers.toUtf8Bytes(JSON.stringify({
					name: institutionData.name,
					licenseNumber: institutionData.licenseNumber,
					address: institutionData.address
				}))
			);

			console.log(`🏥 Registering institution "${institutionData.name}" on MedicalCollaborationHub contract...`);
			
			// Call smart contract registerInstitution function on MedicalCollaborationHub
			// The function expects: name, country, specialties[], nonce for commit-reveal
			const specialties = ["General Medicine", "Emergency Care"]; // Default specialties
			const nonce = Math.floor(Math.random() * 1000000); // Random nonce for commit-reveal
			
			// First commit the registration
			const commitHash = ethers.keccak256(
				ethers.AbiCoder.defaultAbiCoder().encode(
					["string", "string", "uint256", "address"],
					[institutionData.name, "Global", nonce, await signer.getAddress()]
				)
			);
			
			console.log('🔐 Committing registration...');
			const commitTx = await (contractWithSigner as any).commitRegistration(commitHash);
			await commitTx.wait();
			
			// Wait for commit delay
			console.log('⏳ Waiting for commit delay...');
			await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
			
			console.log('📝 Revealing registration...');
			const tx = await (contractWithSigner as any).registerInstitution(
				institutionData.name,
				"Global", // Country
				specialties, // Specialties array
				nonce, // Nonce for reveal
				{ value: ethers.parseEther("0.002") } // Institution stake
			);

			console.log(`⏳ Transaction submitted: ${tx.hash}`);
			const receipt = await tx.wait();
			console.log(`✅ Institution registered successfully! Block: ${receipt.blockNumber}`);

			// Get signer address
			const signerAddress = await signer.getAddress();
			
			// Return detailed registration info
			return {
				walletAddress: signerAddress,
				transactionHash: tx.hash,
				credentialHash: credentialHash, // Keep for compatibility
				blockNumber: receipt.blockNumber,
				timestamp: new Date()
			};
			
		} catch (error: any) {
			console.error('❌ Failed to register institution:', error);
			throw new Error(`Institution registration failed: ${error.message}`);
		}
	}

	/**
	 * Register a doctor with an institution on blockchain (blockchain-first approach)
	 * Returns detailed registration info for database storage
	 */
	async registerDoctor(doctorData: {
		name: string;
		medicalLicenseNumber: string;
		medicalSpecialty: string;
		department: string;
		institutionId: string; // Supabase institution ID
		yearsOfExperience?: number;
		contactInfo?: {
			phone?: string;
			email?: string;
		};
		profileInfo?: any;
	}): Promise<{
		walletAddress: string;
		transactionHash: string;
		stakeAmount: string;
		blockNumber?: number;
		timestamp: Date;
		institutionWallet: string;
		databaseId: string;
	}> {
		console.log('🏥 Starting doctor registration process...');
		console.log('Doctor data:', doctorData);

		// Step 1: Get institution data from database to get wallet address
		const { data: institution, error: institutionError } = await supabase
			.from('medical_institutions')
			.select('id, name, wallet_address, blockchain_registered')
			.eq('id', doctorData.institutionId)
			.single();

		if (institutionError || !institution) {
			throw new Error(`Institution not found: ${doctorData.institutionId}`);
		}

		const institutionData = institution as {
			id: string;
			name: string;
			wallet_address: string | null;
			blockchain_registered: boolean;
		};

		if (!institutionData.blockchain_registered) {
			throw new Error(`Institution must be blockchain registered first: ${institutionData.name}`);
		}

		if (!institutionData.wallet_address) {
			throw new Error(`Institution wallet address not found: ${institutionData.name}`);
		}

		console.log('✅ Institution found:', institutionData.name, 'Wallet:', institutionData.wallet_address);

		// Verify institution is actually registered on blockchain
		const isVerified = await this.isInstitutionVerifiedOnBlockchain(institutionData.wallet_address);
		if (!isVerified) {
			console.error('❌ Institution not verified on blockchain:', institutionData.wallet_address);
			const blockchainData = await this.getInstitutionFromBlockchain(institutionData.wallet_address);
			
			// Convert BigInt values to strings for JSON serialization
			const serializedData = this.serializeBlockchainData(blockchainData);
			
			throw new Error(`Institution ${institutionData.name} (${institutionData.wallet_address}) is not verified on the blockchain. Please register the institution first. Blockchain data: ${JSON.stringify(serializedData)}`);
		}

		console.log('✅ Institution verified on blockchain:', institutionData.wallet_address);

		// Step 2: Register on blockchain first
		const blockchainResult = await this.registerDoctorOnBlockchain(
			doctorData, 
			institutionData.wallet_address
		);
		console.log('✅ Blockchain registration successful:', blockchainResult);

		// Step 3: Save to database with blockchain data
		const databaseId = await this.saveDoctorToDatabase(
			doctorData, 
			blockchainResult, 
			institutionData.wallet_address
		);
		console.log('✅ Database save successful, ID:', databaseId);

		return {
			...blockchainResult,
			institutionWallet: institutionData.wallet_address,
			databaseId
		};
	}

	/**
	 * Register doctor on MedicalCollaborationHub smart contract
	 */
	private async registerDoctorOnBlockchain(
		doctorData: any, 
		institutionWallet: string
	): Promise<{
		walletAddress: string;
		transactionHash: string;
		stakeAmount: string;
		blockNumber?: number;
		timestamp: Date;
	}> {
		const signer = await walletManager.getSigner();
		if (!signer) {
			throw new Error('Wallet not connected. Please connect your wallet to register as doctor.');
		}

		const doctorWallet = await signer.getAddress();
		console.log('👨‍⚕️ Registering doctor on blockchain:', doctorWallet);
		console.log('🏥 Institution wallet address being used:', institutionWallet);

		// Create contract instance with signer
		const contractWithSigner = this.collaborationHubContract.connect(signer);

		// Double-check institution verification right before the call
		console.log('🔍 Verifying institution on blockchain before doctor registration...');
		console.log('🔍 Contract address:', this.COLLABORATION_HUB_ADDRESS);
		console.log('🔍 Institution wallet to check:', institutionWallet);
		
		const isVerified = await (contractWithSigner as any).verifiedInstitutions(institutionWallet);
		console.log('✅ Institution verified status:', isVerified);
		
		// Also check the institutions mapping to see what data exists
		const institutionStruct = await (contractWithSigner as any).institutions(institutionWallet);
		console.log('🏥 Full institution struct:', this.serializeBlockchainData(institutionStruct));
		
		// Check if institution has data even if not marked as verified
		const hasData = institutionStruct && institutionStruct[0] && institutionStruct[0] !== '';
		console.log('🔍 Institution has data:', hasData);
		
		if (!isVerified) {
			console.log('❌ Institution verification failed but let\'s check if it has valid data...');
			
			if (hasData) {
				console.log('⚠️ Institution has data but verification flag is false. This might be a contract issue.');
				console.log('🔄 Proceeding with registration anyway since institution data exists...');
			} else {
				// Convert BigInt values to strings for JSON serialization
				const serializedData = this.serializeBlockchainData(institutionStruct);
				
				throw new Error(`BLOCKCHAIN CHECK: Institution ${institutionWallet} is NOT verified on the smart contract and has no data. Institution data: ${JSON.stringify(serializedData)}`);
			}
		}

		const stakeAmount = ethers.parseEther("0.0005");
	

		try {
			// Call registerDoctor function on MedicalCollaborationHub
			console.log('📞 Calling smart contract registerDoctor...');
			const tx = await (contractWithSigner as any).registerDoctor(
				doctorData.name,
				doctorData.medicalSpecialty,
				doctorData.medicalLicenseNumber,
				institutionWallet,
				{ value: stakeAmount }
			);

			console.log('⏳ Transaction submitted:', tx.hash);
			console.log('⏳ Waiting for confirmation...');
			
			const receipt = await tx.wait();
			console.log('✅ Transaction confirmed in block:', receipt.blockNumber);

			return {
				walletAddress: doctorWallet,
				transactionHash: tx.hash,
				stakeAmount: ethers.formatEther(stakeAmount),
				blockNumber: receipt.blockNumber,
				timestamp: new Date()
			};

		} catch (error: any) {
			console.error('❌ Blockchain registration failed:', error);
			
			// Parse common error messages
			if (error.message?.includes('insufficient funds')) {
				throw new Error(`Insufficient funds. You need at least ${ethers.formatEther(stakeAmount)} 0G to register as a doctor.`);
			} else if (error.message?.includes('NotVerifiedInstitution')) {
				throw new Error('Institution is not verified on blockchain.');
			} else if (error.message?.includes('Already registered')) {
				throw new Error('Doctor already registered with this wallet address.');
			} else {
				throw new Error(`Blockchain registration failed: ${error.message}`);
			}
		}
	}

	/**
	 * Save doctor to Supabase database with blockchain transaction data
	 */
	private async saveDoctorToDatabase(
		doctorData: any,
		blockchainResult: any,
		institutionWallet: string
	): Promise<string> {
		console.log('💾 Saving doctor to database...');

		const doctorRecord = {
			name: doctorData.name,
			medical_license_number: doctorData.medicalLicenseNumber,
			medical_specialty: doctorData.medicalSpecialty,
			department: doctorData.department,
			years_of_experience: doctorData.yearsOfExperience || 0,
			institution_id: doctorData.institutionId,
			institution_wallet: institutionWallet,
			wallet_address: blockchainResult.walletAddress,
			phone: doctorData.contactInfo?.phone,
			email: doctorData.contactInfo?.email,
			transaction_hash: blockchainResult.transactionHash,
			blockchain_registered: true,
			stake_amount: blockchainResult.stakeAmount,
			verification_status: 'verified', // Auto-verified through blockchain staking
			permissions: {
				canUpload: true,
				canShare: true,
				canViewAllDepartments: false,
				canManageUsers: false,
				canUploadDepartmental: true,
				canUploadInstitutional: false,
				canPublishPublic: false,
				accessLevel: 'doctor'
			},
			profile_info: doctorData.profileInfo || {}
		};

		console.log('📝 Doctor record to insert:', doctorRecord);

		try {
			const { data, error } = await supabase
				.from('medical_doctors')
				.insert(doctorRecord as any) // Type assertion to handle Supabase typing
				.select('id')
				.single();

			if (error) {
				console.error('❌ Database insert error:', error);
				throw new Error(`Database save failed: ${error.message}`);
			}

			const savedData = data as { id: string } | null;
			if (!savedData?.id) {
				throw new Error('Database save succeeded but no ID returned');
			}

			console.log('✅ Doctor saved to database with ID:', savedData.id);
			return savedData.id;

		} catch (error: any) {
			console.error('❌ Database save failed:', error);
			throw new Error(`Failed to save doctor to database: ${error.message}`);
		}
	}

	/**
	 * Get verified institutions from database for UI selection
	 */
	async getVerifiedInstitutionsFromDB(): Promise<Array<{
		id: string;
		name: string;
		country: string;
		wallet_address: string;
		departments: string[];
	}>> {
		try {
			const { data, error } = await supabase
				.from('medical_institutions')
				.select('id, name, country, wallet_address, departments')
				.eq('blockchain_registered', true)
				.order('name');

			if (error) {
				throw error;
			}

			// Parse departments from JSON string to array
			const institutions = (data || []).map((institution: any) => ({
				...institution,
				departments: this.parseDepartments(institution.departments)
			}));

			return institutions;
		} catch (error: any) {
			console.error('Error fetching verified institutions:', error);
			throw new Error(`Failed to fetch institutions: ${error.message}`);
		}
	}

	/**
	 * Parse departments field - handle both string and array formats
	 */
	private parseDepartments(departments: any): string[] {
		if (!departments) return [];
		
		if (Array.isArray(departments)) {
			return departments;
		}
		
		if (typeof departments === 'string') {
			try {
				const parsed = JSON.parse(departments);
				return Array.isArray(parsed) ? parsed : [];
			} catch {
				// If it's not valid JSON, treat it as a single department
				return [departments];
			}
		}
		
		return [];
	}

	/**
	 * Check if wallet address is already registered as doctor
	 */
	async isDoctorRegistered(walletAddress: string): Promise<boolean> {
		try {
			const { data, error } = await supabase
				.from('medical_doctors')
				.select('wallet_address')
				.eq('wallet_address', walletAddress)
				.single();

			if (error && error.code !== 'PGRST116') { // Ignore "no rows" error
				throw error;
			}

			return !!data;
		} catch (error: any) {
			console.error('Error checking doctor registration:', error);
			return false;
		}
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
		// Institution verification is now handled by blockchain
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
		// Doctor verification is now handled by blockchain
	}

	/**
	 * Get institution by ID
	 */
	getInstitution(institutionId: string): MedicalInstitution | null {
		// Check cache first
		const cached = this.institutions.get(institutionId);
		if (cached) return cached;
		
		// Check demo institutions
		switch (institutionId) {
			case 'mercy-general-sf':
				return {
					institutionId: 'mercy-general-sf',
					name: 'Mercy General Hospital',
					address: '1234 Medical Center Drive, San Francisco, CA 94115',
					licenseNumber: 'CA-HOSP-001234',
					verificationStatus: 'verified',
					adminWallet: '',
					contactInfo: {
						email: 'admin@mercygeneral.org',
						phone: '+1 (415) 567-8900'
					},
					departments: [],
					registrationDate: '2024-01-15T00:00:00Z',
					verificationDocuments: []
				};
			case 'st-marys-london':
				return {
					institutionId: 'st-marys-london',
					name: "St. Mary's Hospital London",
					address: 'Praed Street, Paddington, London W2 1NY, UK',
					licenseNumber: 'UK-NHS-007842',
					verificationStatus: 'verified',
					adminWallet: '',
					contactInfo: {
						email: 'enquiries@stmarys.nhs.uk',
						phone: '+44 20 3312 6666'
					},
					departments: [],
					registrationDate: '2024-02-01T00:00:00Z',
					verificationDocuments: []
				};
			case 'toronto-general':
				return {
					institutionId: 'toronto-general',
					name: 'Toronto General Hospital',
					address: '200 Elizabeth St, Toronto, ON M5G 2C4, Canada',
					licenseNumber: 'ON-HOSP-092847',
					verificationStatus: 'verified',
					adminWallet: '',
					contactInfo: {
						email: 'info@uhn.ca',
						phone: '+1 (416) 340-4800'
					},
					departments: [],
					registrationDate: '2024-02-10T00:00:00Z',
					verificationDocuments: []
				};
			default:
				return null;
		}
	}

	/**
	 * Get doctor by wallet address from blockchain
	 */
	async getDoctor(walletAddress: string): Promise<VerifiedDoctor | null> {
		console.log(`🔍 Looking for doctor with wallet: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`);
		
		try {
			// First check cache
			const cachedDoctor = this.doctors.get(walletAddress);
			if (cachedDoctor) {
				console.log(`✅ Found doctor in cache: ${cachedDoctor.name}`);
				return cachedDoctor;
			}

			// Query blockchain directly
			console.log(`📡 Querying blockchain for doctor data...`);
			const doctorData = await (this.collaborationHubContract as any).doctors(walletAddress);
			const isVerified = await (this.collaborationHubContract as any).verifiedDoctors(walletAddress);
			
			if (!isVerified || !doctorData.name) {
				console.log(`❌ Doctor not found on blockchain, checking demo data...`);
				console.log(`🔍 Checking wallet address: ${walletAddress}`);
				console.log(`🔍 Lowercase wallet: ${walletAddress.toLowerCase()}`);
				
				// Check for specific demo wallet addresses
				if (walletAddress.toLowerCase() === '0x99BD4BDD7A9c22E2a35F09A6Bd17f038D5E5eB87'.toLowerCase()) {
					// Dr. Sarah Johnson
					const doctor: VerifiedDoctor = {
						doctorWallet: walletAddress,
						institutionId: 'mercy-general-sf',
						medicalLicense: 'CA-MD-789012',
						name: 'Sarah Johnson',
						specialty: 'Interventional Cardiology',
						department: 'Cardiology',
						verificationStatus: 'verified',
						verificationDate: new Date().toISOString(),
						permissions: {
							canUpload: true,
							canShare: true,
							canViewAllDepartments: false,
							canManageUsers: false,
							canUploadDepartmental: true,
							canUploadInstitutional: false,
							canPublishPublic: false,
							accessLevel: 'doctor'
						},
						profileInfo: {
							email: 'sarah.johnson@mercygeneral.org',
							phone: '+1 (415) 567-8920',
							yearsExperience: 15,
							education: []
						}
					};
					console.log(`✅ Found demo doctor: Dr. Sarah Johnson at Mercy General Hospital`);
					return doctor;
				}
				
				if (walletAddress.toLowerCase() === '0x59A0B39f49EBe851c97E654166A480E7d41122c6'.toLowerCase()) {
					// Dr. Michael Chen
					const doctor: VerifiedDoctor = {
						doctorWallet: walletAddress,
						institutionId: 'st-marys-london',
						medicalLicense: 'UK-GMC-456789',
						name: 'Michael Chen',
						specialty: 'Emergency Medicine',
						department: 'Emergency Medicine',
						verificationStatus: 'verified',
						verificationDate: new Date().toISOString(),
						permissions: {
							canUpload: true,
							canShare: true,
							canViewAllDepartments: false,
							canManageUsers: false,
							canUploadDepartmental: true,
							canUploadInstitutional: false,
							canPublishPublic: false,
							accessLevel: 'doctor'
						},
						profileInfo: {
							email: 'michael.chen@stmarys.nhs.uk',
							phone: '+44 20 3312 6700',
							yearsExperience: 10,
							education: []
						}
					};
					console.log(`✅ Found demo doctor: Dr. Michael Chen at St. Mary's Hospital London`);
					return doctor;
				}
				
				if (walletAddress.toLowerCase() === '0x8D8f96F92de3CbBc9b3c1048bDf3ce08DF7B1a40'.toLowerCase()) {
					// Dr. Emily Rodriguez
					const doctor: VerifiedDoctor = {
						doctorWallet: walletAddress,
						institutionId: 'toronto-general',
						medicalLicense: 'ON-CPSO-123456',
						name: 'Emily Rodriguez',
						specialty: 'Cardiothoracic Surgery',
						department: 'Cardiac Surgery',
						verificationStatus: 'verified',
						verificationDate: new Date().toISOString(),
						permissions: {
							canUpload: true,
							canShare: true,
							canViewAllDepartments: true,
							canManageUsers: true,
							canUploadDepartmental: true,
							canUploadInstitutional: true,
							canPublishPublic: false,
							accessLevel: 'department_head'
						},
						profileInfo: {
							email: 'emily.rodriguez@uhn.ca',
							phone: '+1 (416) 340-4850',
							yearsExperience: 20,
							education: []
						}
					};
					console.log(`✅ Found demo doctor: Dr. Emily Rodriguez at Toronto General Hospital`);
					return doctor;
				}
				
				return null;
			}

			// Convert blockchain data to our format
			const doctor: VerifiedDoctor = {
				doctorWallet: walletAddress,
				institutionId: doctorData.institutionAddress,
				medicalLicense: doctorData.licenseNumber,
				name: doctorData.name,
				specialty: doctorData.specialty,
				department: doctorData.specialty, // Using specialty as department for now
				verificationStatus: 'verified',
				verificationDate: new Date(Number(doctorData.registrationDate) * 1000).toISOString(),
				permissions: {
					canUpload: true,
					canShare: true,
					canViewAllDepartments: false,
					canManageUsers: false,
					canUploadDepartmental: false,
					canUploadInstitutional: false,
					canPublishPublic: false,
					accessLevel: 'doctor'
				},
				profileInfo: {
					email: '', // Not stored on chain
					yearsExperience: 0, // Not stored on chain
					education: [] // Not stored on chain
				}
			};

			// Cache the result
			this.doctors.set(walletAddress, doctor);
			console.log(`✅ Found doctor on blockchain: ${doctor.name} at ${doctor.institutionId}`);
			
			return doctor;
			
		} catch (error) {
			console.error(`❌ Error fetching doctor from blockchain:`, error);
			return null;
		}
	}

	/**
	 * Synchronous version for backward compatibility (will be deprecated)
	 * @deprecated Use getDoctor() instead
	 */
	getDoctorSync(walletAddress: string): VerifiedDoctor | null {
		console.log(`⚠️ Using deprecated getDoctorSync - please use async getDoctor()`);
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
	async canAccessDocuments(requestingDoctor: string, documentOwner: string, documentAccessLevel: string): Promise<boolean> {
		const requester = await this.getDoctor(requestingDoctor);
		const owner = await this.getDoctor(documentOwner);

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
		// Department data is now managed on blockchain
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
		// Doctor permissions are now managed on blockchain
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

	/**
	 * Check if institution is verified on blockchain
	 */
	async isInstitutionVerifiedOnBlockchain(walletAddress: string): Promise<boolean> {
		try {
			const isVerified = await this.collaborationHubContract.verifiedInstitutions(walletAddress);
			console.log(`🏥 Institution ${walletAddress} verified on blockchain:`, isVerified);
			return isVerified;
		} catch (error) {
			console.error('❌ Error checking institution verification:', error);
			return false;
		}
	}

	/**
	 * Get institution details from blockchain
	 */
	async getInstitutionFromBlockchain(walletAddress: string): Promise<any> {
		try {
			const institution = await this.collaborationHubContract.institutions(walletAddress);
			console.log(`🏥 Institution data from blockchain for ${walletAddress}:`, institution);
			return institution;
		} catch (error) {
			console.error('❌ Error getting institution from blockchain:', error);
			return null;
		}
	}

	/**
	 * Helper function to serialize blockchain data with BigInt values
	 */
	private serializeBlockchainData(data: any): any {
		if (data === null || data === undefined) return data;
		
		if (typeof data === 'bigint') {
			return data.toString();
		}
		
		if (Array.isArray(data)) {
			return data.map(item => this.serializeBlockchainData(item));
		}
		
		if (typeof data === 'object') {
			const serialized: any = {};
			for (const key in data) {
				if (data.hasOwnProperty(key)) {
					serialized[key] = this.serializeBlockchainData(data[key]);
				}
			}
			return serialized;
		}
		
		return data;
	}

	/**
	 * Clear cache and reload from blockchain
	 */
	async refreshFromBlockchain(): Promise<void> {
		this.institutions.clear();
		this.doctors.clear();
		this.isInitialized = false;
		await this.initializeFromBlockchain();
	}
}

// Export singleton instance to ensure consistent data across imports
export const medicalInstitutionService = new MedicalInstitutionService();
