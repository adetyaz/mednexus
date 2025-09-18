<script lang="ts">
	import { onMount } from 'svelte';
	import { walletStore } from '$lib/wallet';
	import { doctorContext, needsOnboarding } from '$lib/stores/doctorStore';
	import {
		crossBorderConsultationService,
		type MedicalCase
	} from '$lib/services/crossBorderConsultationService';
	import { medicalDocumentManager } from '$lib/services/medicalDocumentManagementService';
	import { medicalAuthorityService } from '$lib/services/medicalAuthority';

	// Demo doctors data from scripts
	const DEMO_DOCTORS = [
		{
			walletAddress: '0x99BD4BDD7A9c22E2a35F09A6Bd17f038D5E5eB87',
			name: 'Dr. Sarah Johnson',
			medicalLicenseNumber: 'CA-MD-789012',
			institutionId: 'mercy-general-sf',
			institution: 'Mercy General Hospital',
			department: 'Cardiology',
			medicalSpecialty: 'Interventional Cardiology',
			yearsOfExperience: 15,
			country: 'United States',
			contactInfo: {
				phone: '+1 (415) 567-8920',
				email: 'sarah.johnson@mercygeneral.org'
			},
			verificationStatus: 'verified'
		},
		{
			walletAddress: '0x59A0B39f49EBe851c97E654166A480E7d41122c6',
			name: 'Dr. Michael Chen',
			medicalLicenseNumber: 'UK-GMC-456789',
			institutionId: 'st-marys-london',
			institution: "St. Mary's Hospital London",
			department: 'Emergency Medicine',
			medicalSpecialty: 'Emergency Medicine',
			yearsOfExperience: 10,
			country: 'United Kingdom',
			contactInfo: {
				phone: '+44 20 3312 6700',
				email: 'michael.chen@stmarys.nhs.uk'
			},
			verificationStatus: 'verified'
		},
		{
			walletAddress: '0x8D8f96F92de3CbBc9b3c1048bDf3ce08DF7B1a40',
			name: 'Dr. Emily Rodriguez',
			medicalLicenseNumber: 'ON-CPSO-123456',
			institutionId: 'toronto-general',
			institution: 'Toronto General Hospital',
			department: 'Cardiac Surgery',
			medicalSpecialty: 'Cardiothoracic Surgery',
			yearsOfExperience: 20,
			country: 'Canada',
			contactInfo: {
				phone: '+1 (416) 340-4850',
				email: 'emily.rodriguez@uhn.ca'
			},
			verificationStatus: 'verified'
		}
	];

	let loading = $state(true);
	let isCredentialVerified = $state(false);
	let activeConsultations = $state<any[]>([]);
	let pendingConsultations = $state<any[]>([]);
	let availableSpecialists = $state<any[]>([]);
	let selectedCase = $state<any>(null);
	let currentStep = $state<'cases' | 'specialists' | 'request' | 'confirm'>('cases');
	let consultationForm = $state({
		specialty: '',
		urgency: 'routine' as 'routine' | 'urgent' | 'emergency',
		countries: [] as string[],
		consultationType: 'second_opinion' as 'second_opinion' | 'expertise' | 'treatment_plan'
	});

	// Available medical cases (simplified for demo)
	let medicalCases = $state<any[]>([]);

	const urgencyOptions = [
		{ value: 'routine', label: 'Routine', color: 'bg-blue-100 text-blue-800' },
		{ value: 'urgent', label: 'Urgent', color: 'bg-yellow-100 text-yellow-800' },
		{ value: 'emergency', label: 'Emergency', color: 'bg-red-100 text-red-800' }
	];

	const specialtyOptions = [
		'Cardiology',
		'Neurology',
		'Oncology',
		'Orthopedics',
		'Pediatrics',
		'Dermatology',
		'Psychiatry',
		'Radiology',
		'Pathology',
		'Surgery'
	];

	const countryOptions = [
		{ code: 'US', name: 'United States' },
		{ code: 'UK', name: 'United Kingdom' },
		{ code: 'CA', name: 'Canada' },
		{ code: 'DE', name: 'Germany' },
		{ code: 'JP', name: 'Japan' },
		{ code: 'AU', name: 'Australia' },
		{ code: 'SG', name: 'Singapore' }
	];

	onMount(async () => {
		try {
			if ($walletStore.isConnected && $walletStore.address) {
				// Initialize medical authority service
				await medicalAuthorityService.initialize();

				// Check if this wallet is one of our demo doctors
				const demoDoctor = DEMO_DOCTORS.find((d) => d.walletAddress === $walletStore.address);
				if (demoDoctor) {
					console.log(`🎯 Demo doctor detected: ${demoDoctor.name}`);

					// Check if demo doctor has verified credentials
					isCredentialVerified = medicalAuthorityService.hasValidMedicalLicense(demoDoctor.name);
					console.log(
						`📜 Credential verification status for ${demoDoctor.name}:`,
						isCredentialVerified
					);
				}

				// Load demo medical cases
				await loadMedicalCases();

				// Load active consultations
				await loadActiveConsultations();

				// Load pending consultation requests for current doctor
				await loadPendingConsultations();
			}
		} catch (error) {
			console.error('Failed to load consultation data:', error);
		} finally {
			loading = false;
		}
	});

	async function loadMedicalCases() {
		// Demo medical cases - in real implementation, these would come from the medical records system
		medicalCases = [
			{
				id: 'case_001',
				patientId: 'patient_anonymous_001',
				hospitalId: 'hospital_001',
				symptoms: ['Chronic fatigue', 'Joint pain', 'Skin rash'],
				duration: '6 months',
				previousTreatments: ['Anti-inflammatory drugs', 'Physical therapy'],
				diagnosticTests: ['Blood work', 'X-rays', 'MRI'],
				urgency: 'routine',
				specialty: 'Rheumatology',
				description: 'Complex autoimmune presentation requiring specialist consultation',
				demographics: {
					age: 35,
					gender: 'Female'
				}
			},
			{
				id: 'case_002',
				patientId: 'patient_anonymous_002',
				hospitalId: 'hospital_002',
				symptoms: ['Severe headaches', 'Vision changes', 'Nausea'],
				duration: '2 weeks',
				previousTreatments: ['Pain medication', 'Observation'],
				diagnosticTests: ['CT scan', 'Blood work'],
				urgency: 'urgent',
				specialty: 'Neurology',
				description: 'Neurological symptoms requiring urgent specialist evaluation',
				demographics: {
					age: 42,
					gender: 'Male'
				}
			},
			{
				id: 'case_003',
				patientId: 'patient_anonymous_003',
				hospitalId: 'hospital_003',
				symptoms: ['Chest pain', 'Shortness of breath', 'Irregular heartbeat'],
				duration: '3 days',
				previousTreatments: ['Aspirin', 'Rest'],
				diagnosticTests: ['ECG', 'Chest X-ray', 'Blood work'],
				urgency: 'emergency',
				specialty: 'Cardiology',
				description: 'Cardiac symptoms requiring immediate specialist consultation',
				demographics: {
					age: 58,
					gender: 'Male'
				}
			}
		];
	}

	async function loadActiveConsultations() {
		try {
			// In real implementation, this would load from the cross-border consultation service
			activeConsultations = [];
		} catch (error) {
			console.error('Failed to load active consultations:', error);
		}
	}

	async function loadPendingConsultations() {
		try {
			if ($walletStore.address) {
				const pending = await crossBorderConsultationService.getPendingConsultationsFor(
					$walletStore.address
				);
				pendingConsultations = pending;
			}
		} catch (error) {
			console.error('Failed to load pending consultations:', error);
			pendingConsultations = [];
		}
	}

	async function respondToConsultation(
		consultationId: string,
		response: 'accept' | 'reject',
		reason?: string
	) {
		try {
			loading = true;
			await crossBorderConsultationService.respondToConsultation(
				consultationId,
				response,
				$walletStore.address || '',
				reason
			);

			// Reload pending consultations
			await loadPendingConsultations();

			console.log(`Consultation ${response}ed successfully`);
		} catch (error) {
			console.error('Failed to respond to consultation:', error);
		} finally {
			loading = false;
		}
	}

	function selectCase(medicalCase: any) {
		selectedCase = medicalCase;
		consultationForm.specialty = medicalCase.specialty;
		consultationForm.urgency = medicalCase.urgency;
		currentStep = 'specialists';
	}

	async function findSpecialists() {
		if (!consultationForm.specialty || consultationForm.countries.length === 0) {
			return;
		}

		loading = true;
		try {
			// Filter demo doctors excluding current user and match by specialty/country
			availableSpecialists = DEMO_DOCTORS.filter(
				(doctor) =>
					// Exclude current user
					doctor.walletAddress !== $walletStore.address &&
					// Match specialty (broad matching)
					(doctor.medicalSpecialty.includes(consultationForm.specialty) ||
						consultationForm.specialty.includes(doctor.department) ||
						doctor.department.includes(consultationForm.specialty)) &&
					// Match countries
					consultationForm.countries.some(
						(countryCode) =>
							countryOptions.find((c) => c.code === countryCode)?.name === doctor.country
					)
			).map((doctor) => ({
				id: doctor.walletAddress,
				walletAddress: doctor.walletAddress,
				wallet: doctor.walletAddress, // Add short reference
				name: doctor.name,
				specialty: doctor.medicalSpecialty,
				department: doctor.department,
				country: doctor.country,
				institution: doctor.institution,
				experience: `${doctor.yearsOfExperience} years`,
				rating: 4.8 + Math.random() * 0.2, // Demo rating
				availability: 'Available within 24-48 hours',
				languages: ['English'],
				contactInfo: doctor.contactInfo,
				verificationStatus: doctor.verificationStatus
			}));

			currentStep = 'request';
		} catch (error) {
			console.error('Failed to find specialists:', error);
		} finally {
			loading = false;
		}
	}

	async function createConsultationRequest() {
		if (!selectedCase || availableSpecialists.length === 0) return;

		loading = true;
		try {
			// Get target doctor wallets from available specialists
			const targetDoctorWallets = availableSpecialists.map((spec) => spec.wallet);

			const request = await crossBorderConsultationService.createConsultationRequest(
				selectedCase,
				consultationForm.specialty,
				consultationForm.countries.map(
					(code) => countryOptions.find((c) => c.code === code)?.name || code
				),
				consultationForm.urgency,
				$walletStore.address || '', // requesting doctor wallet (Sarah Johnson)
				targetDoctorWallets // array of target doctor wallets
			);

			console.log('Consultation request created:', request);

			// Add to active consultations
			activeConsultations = [
				...activeConsultations,
				{
					id: request.consultationId,
					case: selectedCase,
					specialists: availableSpecialists,
					status: 'pending',
					createdAt: new Date().toISOString(),
					urgency: consultationForm.urgency
				}
			];

			// Reset form
			currentStep = 'cases';
			selectedCase = null;
			consultationForm = {
				specialty: '',
				urgency: 'routine',
				countries: [],
				consultationType: 'second_opinion'
			};
		} catch (error) {
			console.error('Failed to create consultation request:', error);
		} finally {
			loading = false;
		}
	}

	function resetForm() {
		currentStep = 'cases';
		selectedCase = null;
		availableSpecialists = [];
		consultationForm = {
			specialty: '',
			urgency: 'routine',
			countries: [],
			consultationType: 'second_opinion'
		};
	}
</script>

<svelte:head>
	<title>Cross-Border Consultation - MedNexus</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	{#if loading && currentStep === 'cases'}
		<div class="flex items-center justify-center min-h-screen">
			<div class="text-center">
				<div
					class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
				></div>
				<p class="mt-4 text-gray-600">Loading consultation system...</p>
			</div>
		</div>
	{:else if !$walletStore.isConnected}
		<div class="flex items-center justify-center min-h-screen">
			<div class="text-center bg-white p-8 rounded-lg shadow-lg max-w-md mx-4">
				<div
					class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
				>
					<svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
						></path>
					</svg>
				</div>
				<h3 class="text-xl font-semibold text-gray-900 mb-2">Wallet Connection Required</h3>
				<p class="text-gray-600 mb-6">
					Please connect your wallet to access cross-border consultations.
				</p>
				<a
					href="/"
					class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
				>
					Connect Wallet
				</a>
			</div>
		</div>
	{:else}
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<!-- Header -->
			<div class="bg-white rounded-lg shadow-sm p-6 mb-8">
				<div class="flex items-center justify-between">
					<div>
						<h1 class="text-2xl font-bold text-gray-900 flex items-center">
							<span class="text-3xl mr-3">🌍</span>
							Cross-Border Consultation
						</h1>
						<p class="text-gray-600 mt-1">Request consultations from specialists worldwide</p>
					</div>
					<div
						class="flex items-center space-x-2 bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg"
					>
						<span class="text-sm font-medium text-blue-700">Global Network</span>
						<span
							class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
						>
							Active
						</span>
					</div>
				</div>
			</div>

			<!-- Doctor Onboarding Check -->
			{#if !isCredentialVerified || !$doctorContext?.success}
				{@const currentDemoDoctor = DEMO_DOCTORS.find(
					(d) => d.walletAddress === $walletStore.address
				)}
				{@const needsCredentialVerification = !isCredentialVerified}
				{@const needsInstitutionalRegistration = !$doctorContext?.success}

				<div class="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
					<div class="flex items-start">
						<div class="flex-shrink-0">
							<svg class="h-8 w-8 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						<div class="ml-4 flex-1">
							{#if currentDemoDoctor}
								<h3 class="text-lg font-semibold text-amber-800 mb-2">
									Welcome {currentDemoDoctor.name}! 👨‍⚕️
								</h3>
								<div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
									<p class="text-sm text-blue-800">
										<strong>🎯 Demo Account Detected:</strong> We recognize you as
										<strong>{currentDemoDoctor.name}</strong>
										from <strong>{currentDemoDoctor.institution}</strong>
										({currentDemoDoctor.medicalSpecialty}).
									</p>
								</div>

								<!-- Verification Status -->
								<div class="space-y-2 mb-4">
									<div class="flex items-center text-sm">
										{#if isCredentialVerified}
											<svg
												class="w-4 h-4 text-green-600 mr-2"
												fill="currentColor"
												viewBox="0 0 20 20"
											>
												<path
													fill-rule="evenodd"
													d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
													clip-rule="evenodd"
												/>
											</svg>
											<span class="text-green-700">✅ Medical license verified</span>
										{:else}
											<svg
												class="w-4 h-4 text-amber-600 mr-2"
												fill="currentColor"
												viewBox="0 0 20 20"
											>
												<path
													fill-rule="evenodd"
													d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
													clip-rule="evenodd"
												/>
											</svg>
											<span class="text-amber-700">⏳ Medical license verification needed</span>
										{/if}
									</div>
									<div class="flex items-center text-sm">
										{#if $doctorContext?.success}
											<svg
												class="w-4 h-4 text-green-600 mr-2"
												fill="currentColor"
												viewBox="0 0 20 20"
											>
												<path
													fill-rule="evenodd"
													d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
													clip-rule="evenodd"
												/>
											</svg>
											<span class="text-green-700">✅ Institution registration complete</span>
										{:else}
											<svg
												class="w-4 h-4 text-amber-600 mr-2"
												fill="currentColor"
												viewBox="0 0 20 20"
											>
												<path
													fill-rule="evenodd"
													d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
													clip-rule="evenodd"
												/>
											</svg>
											<span class="text-amber-700">⏳ Institution registration needed</span>
										{/if}
									</div>
								</div>

								<p class="text-amber-700 mb-4">
									{#if needsCredentialVerification && needsInstitutionalRegistration}
										Complete both credential verification and institution registration to access
										cross-border consultations.
									{:else if needsCredentialVerification}
										Complete credential verification to continue with institution registration.
									{:else if needsInstitutionalRegistration}
										Complete institution registration to access cross-border consultations and send
										requests to other doctors.
									{/if}
								</p>
							{:else}
								<h3 class="text-lg font-semibold text-amber-800 mb-2">
									Welcome! Complete Your Doctor Verification 👨‍⚕️
								</h3>
								<p class="text-amber-700 mb-4">
									To access cross-border consultations and have your professional name displayed,
									you'll need to complete doctor verification and institutional registration.
								</p>
							{/if}

							<div class="space-y-3 mb-6">
								<div class="flex items-center text-sm text-amber-700">
									<span class="mr-3">1️⃣</span>
									<span
										><strong>Verify Medical License:</strong> Validate your credentials with recognized
										medical authorities</span
									>
								</div>
								<div class="flex items-center text-sm text-amber-700">
									<span class="mr-3">2️⃣</span>
									<span
										><strong>Join Medical Institution:</strong> Register with your hospital or clinic</span
									>
								</div>
								<div class="flex items-center text-sm text-amber-700">
									<span class="mr-3">3️⃣</span>
									<span
										><strong>Access Global Network:</strong> Send and receive consultation requests worldwide</span
									>
								</div>
							</div>

							<div class="flex flex-col sm:flex-row gap-3">
								{#if needsCredentialVerification}
									<a
										href="/verification"
										class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
									>
										<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
										{isCredentialVerified ? 'Credentials Verified ✓' : 'Start Verification Process'}
									</a>
								{/if}
								{#if needsInstitutionalRegistration}
									<a
										href="/register"
										class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
									>
										<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
											/>
										</svg>
										{$doctorContext?.success ? 'Institution Registered ✓' : 'Join Institution'}
									</a>
								{/if}
							</div>

							{#if currentDemoDoctor}
								<div class="mt-4 text-xs text-amber-600">
									💡 <strong>Demo Tip:</strong> Use license number
									<code class="bg-amber-100 px-1 rounded"
										>{currentDemoDoctor.medicalLicenseNumber}</code
									>
									and select
									<code class="bg-amber-100 px-1 rounded">{currentDemoDoctor.institution}</code> during
									verification.
								</div>
							{:else}
								<div class="mt-4 text-xs text-amber-600">
									💡 <strong>Note:</strong> Verification typically takes 5-10 minutes. You'll need your
									medical license number and institutional affiliation.
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/if}

			<!-- Progress Steps -->
			<div class="bg-white rounded-lg shadow-sm p-6 mb-8">
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-4">
						<div class="flex items-center">
							<div
								class="flex items-center justify-center w-8 h-8 rounded-full {currentStep ===
								'cases'
									? 'bg-blue-600 text-white'
									: 'bg-gray-200 text-gray-600'}"
							>
								1
							</div>
							<span
								class="ml-2 text-sm font-medium {currentStep === 'cases'
									? 'text-blue-600'
									: 'text-gray-500'}">Select Case</span
							>
						</div>
						<div class="w-16 h-1 bg-gray-200 rounded">
							<div
								class="h-1 bg-blue-600 rounded transition-all duration-300"
								style="width: {['specialists', 'request', 'confirm'].includes(currentStep)
									? '100%'
									: '0%'}"
							></div>
						</div>
						<div class="flex items-center">
							<div
								class="flex items-center justify-center w-8 h-8 rounded-full {currentStep ===
								'specialists'
									? 'bg-blue-600 text-white'
									: 'bg-gray-200 text-gray-600'}"
							>
								2
							</div>
							<span
								class="ml-2 text-sm font-medium {currentStep === 'specialists'
									? 'text-blue-600'
									: 'text-gray-500'}">Find Specialists</span
							>
						</div>
						<div class="w-16 h-1 bg-gray-200 rounded">
							<div
								class="h-1 bg-blue-600 rounded transition-all duration-300"
								style="width: {['request', 'confirm'].includes(currentStep) ? '100%' : '0%'}"
							></div>
						</div>
						<div class="flex items-center">
							<div
								class="flex items-center justify-center w-8 h-8 rounded-full {currentStep ===
								'request'
									? 'bg-blue-600 text-white'
									: 'bg-gray-200 text-gray-600'}"
							>
								3
							</div>
							<span
								class="ml-2 text-sm font-medium {currentStep === 'request'
									? 'text-blue-600'
									: 'text-gray-500'}">Create Request</span
							>
						</div>
					</div>
					{#if currentStep !== 'cases'}
						<button
							onclick={resetForm}
							class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200"
						>
							Start Over
						</button>
					{/if}
				</div>
			</div>

			<!-- Step Content -->
			{#if currentStep === 'cases'}
				<!-- Step 1: Select Medical Case -->
				<div class="grid grid-cols-1 gap-8">
					<!-- Active Consultations -->
					{#if activeConsultations.length > 0}
						<div class="bg-white rounded-lg shadow-sm p-6">
							<h2 class="text-lg font-semibold text-gray-900 mb-4">Active Consultations</h2>
							<div class="space-y-4">
								{#each activeConsultations as consultation}
									<div class="border rounded-lg p-4 bg-gray-50">
										<div class="flex items-center justify-between">
											<div>
												<h3 class="font-medium text-gray-900">
													Case: {consultation.case?.description}
												</h3>
												<p class="text-sm text-gray-600">
													Specialists: {consultation.specialists?.length} contacted
												</p>
											</div>
											<div class="flex items-center space-x-2">
												<span
													class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {consultation.urgency ===
													'emergency'
														? 'bg-red-100 text-red-800'
														: consultation.urgency === 'urgent'
															? 'bg-yellow-100 text-yellow-800'
															: 'bg-blue-100 text-blue-800'}"
												>
													{consultation.urgency}
												</span>
												<span
													class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
												>
													{consultation.status}
												</span>
											</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Pending Consultation Requests -->
					{#if pendingConsultations.length > 0}
						<div class="bg-white rounded-lg shadow-sm p-6">
							<h2 class="text-lg font-semibold text-gray-900 mb-4">
								Pending Consultation Requests
								<span
									class="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
								>
									{pendingConsultations.length} requests
								</span>
							</h2>
							<div class="space-y-4">
								{#each pendingConsultations as consultation}
									<div class="border rounded-lg p-4 bg-orange-50 border-orange-200">
										<div class="flex items-start justify-between">
											<div class="flex-1">
												<h3 class="font-medium text-gray-900 mb-2">
													{consultation.specialty} Consultation Request
												</h3>
												<div class="space-y-2 text-sm text-gray-600">
													<p>
														<span class="font-medium">From:</span>
														{DEMO_DOCTORS.find(
															(d) => d.walletAddress === consultation.requestingDoctorWallet
														)?.name || consultation.requestingDoctorWallet}
													</p>
													<p>
														<span class="font-medium">Urgency:</span>
														<span
															class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {consultation.urgency ===
															'emergency'
																? 'bg-red-100 text-red-800'
																: consultation.urgency === 'urgent'
																	? 'bg-yellow-100 text-yellow-800'
																	: 'bg-blue-100 text-blue-800'}"
														>
															{consultation.urgency}
														</span>
													</p>
													<p>
														<span class="font-medium">Countries:</span>
														{consultation.countries?.join(', ')}
													</p>
													{#if consultation.case}
														<p>
															<span class="font-medium">Case:</span>
															{consultation.case.description}
														</p>
														<p>
															<span class="font-medium">Symptoms:</span>
															{consultation.case.symptoms?.join(', ')}
														</p>
													{/if}
												</div>
											</div>
											<div class="flex flex-col space-y-2 ml-4">
												<button
													onclick={() =>
														respondToConsultation(consultation.consultationId, 'accept')}
													class="px-3 py-1 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors duration-200"
													disabled={loading}
												>
													Accept
												</button>
												<button
													onclick={() => {
														const reason = prompt(
															'Please provide a reason for rejection (optional):'
														);
														respondToConsultation(
															consultation.consultationId,
															'reject',
															reason || undefined
														);
													}}
													class="px-3 py-1 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors duration-200"
													disabled={loading}
												>
													Reject
												</button>
											</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Medical Cases -->
					<div class="bg-white rounded-lg shadow-sm p-6">
						<h2 class="text-lg font-semibold text-gray-900 mb-4">
							Select Medical Case for Consultation
						</h2>
						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{#each medicalCases as medicalCase}
								<div
									class="border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-blue-300 hover:shadow-md"
									onclick={() => selectCase(medicalCase)}
									onkeydown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.preventDefault();
											selectCase(medicalCase);
										}
									}}
									role="button"
									tabindex="0"
								>
									<div class="flex items-center justify-between mb-3">
										<h3 class="font-medium text-gray-900">Case #{medicalCase.id}</h3>
										<span
											class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {urgencyOptions.find(
												(u) => u.value === medicalCase.urgency
											)?.color}"
										>
											{urgencyOptions.find((u) => u.value === medicalCase.urgency)?.label}
										</span>
									</div>
									<p class="text-sm text-gray-600 mb-2">{medicalCase.description}</p>
									<div class="text-xs text-gray-500">
										<p><strong>Specialty:</strong> {medicalCase.specialty}</p>
										<p><strong>Duration:</strong> {medicalCase.duration}</p>
										<p>
											<strong>Symptoms:</strong>
											{medicalCase.symptoms.slice(0, 2).join(', ')}{medicalCase.symptoms.length > 2
												? '...'
												: ''}
										</p>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			{:else if currentStep === 'specialists'}
				<!-- Step 2: Configure Consultation -->
				<div class="bg-white rounded-lg shadow-sm p-6">
					<h2 class="text-lg font-semibold text-gray-900 mb-6">Configure Consultation Request</h2>

					{#if selectedCase}
						<div class="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
							<h3 class="font-medium text-blue-900 mb-2">Selected Case: #{selectedCase.id}</h3>
							<p class="text-sm text-blue-700">{selectedCase.description}</p>
						</div>
					{/if}

					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<!-- Specialty -->
						<div>
							<label for="specialty-select" class="block text-sm font-medium text-gray-700 mb-2"
								>Medical Specialty</label
							>
							<select
								id="specialty-select"
								bind:value={consultationForm.specialty}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							>
								<option value="">Select specialty</option>
								{#each specialtyOptions as specialty}
									<option value={specialty}>{specialty}</option>
								{/each}
							</select>
						</div>

						<!-- Urgency -->
						<div>
							<label for="urgency-select" class="block text-sm font-medium text-gray-700 mb-2"
								>Urgency Level</label
							>
							<select
								id="urgency-select"
								bind:value={consultationForm.urgency}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							>
								{#each urgencyOptions as option}
									<option value={option.value}>{option.label}</option>
								{/each}
							</select>
						</div>

						<!-- Countries -->
						<div class="md:col-span-2">
							<fieldset>
								<legend class="block text-sm font-medium text-gray-700 mb-2"
									>Preferred Countries</legend
								>
								<div class="grid grid-cols-2 md:grid-cols-4 gap-2">
									{#each countryOptions as country}
										<label class="flex items-center">
											<input
												type="checkbox"
												bind:group={consultationForm.countries}
												value={country.code}
												class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
											/>
											<span class="ml-2 text-sm text-gray-700">{country.name}</span>
										</label>
									{/each}
								</div>
							</fieldset>
						</div>

						<!-- Consultation Type -->
						<div class="md:col-span-2">
							<fieldset>
								<legend class="block text-sm font-medium text-gray-700 mb-2"
									>Consultation Type</legend
								>
								<div class="flex space-x-4">
									<label class="flex items-center">
										<input
											type="radio"
											bind:group={consultationForm.consultationType}
											value="second_opinion"
											class="text-blue-600 focus:ring-blue-500"
										/>
										<span class="ml-2 text-sm text-gray-700">Second Opinion</span>
									</label>
									<label class="flex items-center">
										<input
											type="radio"
											bind:group={consultationForm.consultationType}
											value="expertise"
											class="text-blue-600 focus:ring-blue-500"
										/>
										<span class="ml-2 text-sm text-gray-700">Expert Consultation</span>
									</label>
									<label class="flex items-center">
										<input
											type="radio"
											bind:group={consultationForm.consultationType}
											value="treatment_plan"
											class="text-blue-600 focus:ring-blue-500"
										/>
										<span class="ml-2 text-sm text-gray-700">Treatment Planning</span>
									</label>
								</div>
							</fieldset>
						</div>
					</div>

					<div class="mt-6 flex justify-end">
						<button
							onclick={findSpecialists}
							disabled={!consultationForm.specialty || consultationForm.countries.length === 0}
							class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
						>
							Find Specialists
						</button>
					</div>
				</div>
			{:else if currentStep === 'request'}
				<!-- Step 3: Review and Create Request -->
				<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
					<!-- Available Specialists -->
					<div class="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
						<h2 class="text-lg font-semibold text-gray-900 mb-4">
							Available Specialists ({availableSpecialists.length})
						</h2>

						{#if loading}
							<div class="text-center py-8">
								<div
									class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
								></div>
								<p class="mt-2 text-gray-600">Finding specialists...</p>
							</div>
						{:else if availableSpecialists.length === 0}
							<div class="text-center py-8 text-gray-500">
								<p>No specialists found for the selected criteria.</p>
								<button
									onclick={() => (currentStep = 'specialists')}
									class="mt-4 text-blue-600 hover:text-blue-700"
								>
									Modify search criteria
								</button>
							</div>
						{:else}
							<div class="space-y-4">
								{#each availableSpecialists as specialist}
									<div
										class="border rounded-lg p-4 hover:border-blue-300 transition-all duration-200"
									>
										<div class="flex items-center justify-between">
											<div class="flex-1">
												<h3 class="font-medium text-gray-900">{specialist.name}</h3>
												<p class="text-sm text-gray-600">{specialist.institution}</p>
												<div class="mt-2 flex items-center space-x-4 text-xs text-gray-500">
													<span>📍 {specialist.country}</span>
													<span>⭐ {specialist.rating}/5.0</span>
													<span>🗓️ {specialist.availability}</span>
												</div>
												<div class="mt-1 text-xs text-gray-500">
													<span>🗣️ {specialist.languages.join(', ')}</span>
													<span class="ml-4">📚 {specialist.experience}</span>
												</div>
											</div>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>

					<!-- Request Summary -->
					<div class="bg-white rounded-lg shadow-sm p-6">
						<h3 class="text-lg font-semibold text-gray-900 mb-4">Request Summary</h3>

						{#if selectedCase}
							<div class="space-y-4">
								<div>
									<h4 class="text-sm font-medium text-gray-700">Medical Case</h4>
									<p class="text-sm text-gray-600">#{selectedCase.id}</p>
									<p class="text-xs text-gray-500 mt-1">{selectedCase.description}</p>
								</div>

								<div>
									<h4 class="text-sm font-medium text-gray-700">Specialty</h4>
									<p class="text-sm text-gray-600">{consultationForm.specialty}</p>
								</div>

								<div>
									<h4 class="text-sm font-medium text-gray-700">Urgency</h4>
									<span
										class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {urgencyOptions.find(
											(u) => u.value === consultationForm.urgency
										)?.color}"
									>
										{urgencyOptions.find((u) => u.value === consultationForm.urgency)?.label}
									</span>
								</div>

								<div>
									<h4 class="text-sm font-medium text-gray-700">Target Countries</h4>
									<p class="text-sm text-gray-600">
										{consultationForm.countries
											.map((code) => countryOptions.find((c) => c.code === code)?.name)
											.join(', ')}
									</p>
								</div>

								<div>
									<h4 class="text-sm font-medium text-gray-700">Consultation Type</h4>
									<p class="text-sm text-gray-600 capitalize">
										{consultationForm.consultationType.replace('_', ' ')}
									</p>
								</div>
							</div>

							<button
								onclick={createConsultationRequest}
								disabled={loading || availableSpecialists.length === 0}
								class="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
							>
								{#if loading}
									Creating Request...
								{:else}
									Create Consultation Request
								{/if}
							</button>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
