<script lang="ts">
	import { onMount } from 'svelte';
	import { walletStore } from '$lib/wallet';
	import { crossBorderConsultationService } from '$lib/services/crossBorderConsultationService';
	import { MedicalInstitutionService } from '$lib/services/medicalInstitutionService';
	import { supabase } from '$lib/supabase';
	import type { MedicalCase } from '$lib/services/crossBorderConsultationService';

	let activeTab = $state('create');
	let isLoading = $state(false);
	let statusMessage = $state('');

	// Create consultation form
	let consultationForm = $state({
		symptoms: [''],
		chiefComplaint: '',
		duration: '',
		urgency: 'routine' as 'routine' | 'urgent' | 'emergency',
		specialty: 'internal_medicine',
		selectedDoctor: '',
		preferredCountries: ['United Kingdom', 'Germany'],
		patientAge: 45,
		patientGender: 'other'
	});

	// Available doctors loaded from database
	let availableDoctors = $state<any[]>([]);
	let loadingDoctors = $state(false);

	// Get doctors for selected specialty
	let specialtyDoctors = $derived(
		availableDoctors.filter(
			(doctor) =>
				doctor.department?.toLowerCase().replace(/\s+/g, '_') === consultationForm.specialty ||
				doctor.specialization?.toLowerCase().replace(/\s+/g, '_') === consultationForm.specialty
		)
	);

	// Helper functions for country selection
	function toggleCountry(country: string) {
		if (consultationForm.preferredCountries.includes(country)) {
			consultationForm.preferredCountries = consultationForm.preferredCountries.filter(
				(c) => c !== country
			);
		} else {
			consultationForm.preferredCountries = [...consultationForm.preferredCountries, country];
		}
	}

	// Handle doctor selection
	function selectDoctor(doctorId: string) {
		consultationForm.selectedDoctor = doctorId;
		const doctor = specialtyDoctors.find((d) => d.wallet_address === doctorId || d.id === doctorId);
		if (doctor && doctor.medical_institutions) {
			// Automatically set the country based on selected doctor's institution
			consultationForm.preferredCountries = [doctor.medical_institutions.country];
		}
	}

	// Handle specialty change
	function onSpecialtyChange() {
		// Reset doctor selection when specialty changes
		consultationForm.selectedDoctor = '';
		// Reset to default countries
		consultationForm.preferredCountries = ['United Kingdom', 'Germany'];
	}

	// Consultation data loaded from database
	let pendingConsultations = $state<any[]>([]);
	let myConsultations = $state<any[]>([]);
	let loadingConsultations = $state(false);

	const institutionService = new MedicalInstitutionService();

	// Load available doctors from database
	async function loadAvailableDoctors() {
		loadingDoctors = true;
		try {
			// Query doctors from Supabase
			const { data: doctors, error } = await supabase
				.from('medical_doctors')
				.select(
					`
					*,
					medical_institutions (
						name,
						country,
						address
					)
				`
				)
				.eq('verified', true);

			if (error) {
				console.error('Failed to load doctors:', error);
				statusMessage = 'Failed to load available doctors';
				return;
			}

			availableDoctors = doctors || [];
			console.log('✅ Loaded doctors from database:', availableDoctors.length);
		} catch (error) {
			console.error('Error loading doctors:', error);
			statusMessage = 'Error connecting to database';
		} finally {
			loadingDoctors = false;
		}
	}

	// Load consultation data from services
	async function loadConsultations() {
		if (!$walletStore.isConnected || !$walletStore.address) return;

		loadingConsultations = true;
		try {
			// Load pending consultations
			const pendingResult = await crossBorderConsultationService.getPendingConsultationsFor(
				$walletStore.address
			);
			pendingConsultations = pendingResult || [];

			// Load my consultation requests
			const myRequestsResult = await crossBorderConsultationService.getMyConsultationRequests(
				$walletStore.address
			);
			myConsultations = myRequestsResult || [];

			console.log('✅ Loaded consultations:', {
				pending: pendingConsultations.length,
				mine: myConsultations.length
			});
		} catch (error) {
			console.error('Error loading consultations:', error);
			statusMessage = 'Failed to load consultation data';
		} finally {
			loadingConsultations = false;
		}
	}

	// Initialize data when wallet connects
	$effect(() => {
		if ($walletStore.isConnected) {
			loadAvailableDoctors();
			loadConsultations();
		} else {
			availableDoctors = [];
			pendingConsultations = [];
			myConsultations = [];
		}
	});

	function addSymptom() {
		consultationForm.symptoms = [...consultationForm.symptoms, ''];
	}

	function removeSymptom(index: number) {
		consultationForm.symptoms = consultationForm.symptoms.filter((_, i) => i !== index);
	}

	async function createConsultation() {
		if (!$walletStore.isConnected) {
			statusMessage = 'Please connect your wallet first';
			return;
		}

		isLoading = true;
		statusMessage = '';

		try {
			const medicalCase: MedicalCase = {
				id: `case_${Date.now()}`,
				patientId: `P-${Date.now()}`,
				hospitalId: 'current_institution',
				symptoms: consultationForm.symptoms.filter((s) => s.trim()),
				duration: consultationForm.duration,
				previousTreatments: [],
				diagnosticTests: [],
				urgency: consultationForm.urgency,
				specialty: consultationForm.specialty,
				description: consultationForm.chiefComplaint,
				demographics: {
					age: consultationForm.patientAge,
					gender: consultationForm.patientGender
				}
			};

			// Get selected doctor's wallet if available
			const selectedDoctor = specialtyDoctors.find(
				(d) =>
					d.wallet_address === consultationForm.selectedDoctor ||
					d.id === consultationForm.selectedDoctor
			);
			const targetDoctorWallets = selectedDoctor ? [selectedDoctor.wallet_address] : [];

			const request = await crossBorderConsultationService.createConsultationRequest(
				medicalCase,
				consultationForm.specialty,
				consultationForm.preferredCountries,
				consultationForm.urgency,
				$walletStore.address || '',
				targetDoctorWallets
			);

			statusMessage = `Consultation request created successfully! ID: ${request.consultationId}`;
			console.log('Consultation request created:', request);

			// Reset form
			consultationForm = {
				symptoms: [''],
				chiefComplaint: '',
				duration: '',
				urgency: 'routine',
				specialty: 'internal_medicine',
				selectedDoctor: '',
				preferredCountries: ['United Kingdom', 'Germany'],
				patientAge: 45,
				patientGender: 'other'
			};
		} catch (error) {
			console.error('Failed to create consultation:', error);
			statusMessage = 'Failed to create consultation request';
		} finally {
			isLoading = false;
		}
	}

	async function respondToConsultation(consultationId: string, response: 'accept' | 'reject') {
		if (!$walletStore.isConnected) return;

		isLoading = true;
		try {
			const result = await crossBorderConsultationService.respondToConsultation(
				consultationId,
				response,
				$walletStore.address || ''
			);

			if (result.success) {
				statusMessage = `Consultation ${response}ed successfully`;
				// Update local state
				pendingConsultations = pendingConsultations.map((c) =>
					c.id === consultationId ? { ...c, status: response } : c
				);
			} else {
				statusMessage = result.message;
			}
		} catch (error) {
			console.error('Failed to respond to consultation:', error);
			statusMessage = 'Failed to respond to consultation';
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Cross-Border Consultations - MedNexus</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	{#if !$walletStore.isConnected}
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
							Cross-Border Medical Consultations
						</h1>
						<p class="text-gray-600 mt-1">
							Request and provide expert medical consultations worldwide
						</p>
					</div>
					<div
						class="flex items-center space-x-2 bg-green-50 border border-green-200 px-3 py-2 rounded-lg"
					>
						<span class="text-sm font-medium text-green-700"
							>Connected: {$walletStore.address?.slice(0, 6)}...{$walletStore.address?.slice(
								-4
							)}</span
						>
					</div>
				</div>
			</div>

			<!-- Status Message -->
			{#if statusMessage}
				<div
					class="mb-6 p-4 rounded-lg {statusMessage.includes('Failed')
						? 'bg-red-50 text-red-700 border border-red-200'
						: 'bg-green-50 text-green-700 border border-green-200'}"
				>
					{statusMessage}
				</div>
			{/if}

			<!-- Tabs -->
			<div class="mb-8">
				<nav class="flex space-x-8">
					<button
						onclick={() => (activeTab = 'create')}
						class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'create'
							? 'border-blue-500 text-blue-600'
							: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
					>
						Create Consultation
					</button>
					<button
						onclick={() => (activeTab = 'pending')}
						class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'pending'
							? 'border-blue-500 text-blue-600'
							: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
					>
						Pending Requests ({pendingConsultations.length})
					</button>
					<button
						onclick={() => (activeTab = 'my-consultations')}
						class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'my-consultations'
							? 'border-blue-500 text-blue-600'
							: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
					>
						My Consultations ({myConsultations.length})
					</button>
				</nav>
			</div>

			<!-- Tab Content -->
			{#if activeTab === 'create'}
				<!-- Create Consultation Form -->
				<div class="bg-white rounded-lg shadow-sm p-6">
					<h2 class="text-lg font-semibold text-gray-900 mb-6">
						Request International Consultation
					</h2>

					<form
						onsubmit={(e) => {
							e.preventDefault();
							createConsultation();
						}}
					>
						<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
							<!-- Left Column -->
							<div class="space-y-6">
								<!-- Chief Complaint -->
								<div>
									<label for="chiefComplaint" class="block text-sm font-medium text-gray-700 mb-2">
										Chief Complaint *
									</label>
									<textarea
										id="chiefComplaint"
										bind:value={consultationForm.chiefComplaint}
										placeholder="Patient's primary concern (e.g., chest pain, shortness of breath for 2 days)"
										class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										rows="3"
										required
									></textarea>
								</div>

								<!-- Symptoms -->
								<div>
									<div class="flex items-center justify-between mb-2">
										<label class="block text-sm font-medium text-gray-700">Symptoms *</label>
										<button
											type="button"
											onclick={addSymptom}
											class="text-sm text-blue-600 hover:text-blue-700 font-medium"
										>
											+ Add Symptom
										</button>
									</div>
									<div class="space-y-2">
										{#each consultationForm.symptoms as symptom, index}
											<div class="flex gap-2">
												<input
													type="text"
													bind:value={consultationForm.symptoms[index]}
													placeholder="Enter symptom..."
													class="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
													required={index === 0}
												/>
												{#if consultationForm.symptoms.length > 1}
													<button
														type="button"
														onclick={() => removeSymptom(index)}
														class="px-3 text-red-600 hover:text-red-700"
													>
														×
													</button>
												{/if}
											</div>
										{/each}
									</div>
								</div>

								<!-- Duration -->
								<div>
									<label for="duration" class="block text-sm font-medium text-gray-700 mb-2">
										Duration
									</label>
									<input
										type="text"
										id="duration"
										bind:value={consultationForm.duration}
										placeholder="e.g., 2 weeks, 3 days"
										class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									/>
								</div>
							</div>

							<!-- Right Column -->
							<div class="space-y-6">
								<!-- Specialty -->
								<div>
									<label for="specialty" class="block text-sm font-medium text-gray-700 mb-2">
										Target Specialty *
									</label>
									<select
										id="specialty"
										bind:value={consultationForm.specialty}
										onchange={onSpecialtyChange}
										class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										required
									>
										<option value="internal_medicine">Internal Medicine</option>
										<option value="cardiology">Cardiology</option>
										<option value="neurology">Neurology</option>
										<option value="rheumatology">Rheumatology</option>
										<option value="endocrinology">Endocrinology</option>
										<option value="emergency_medicine">Emergency Medicine</option>
										<option value="oncology">Oncology</option>
									</select>
								</div>

								<!-- Available Doctors -->
								{#if specialtyDoctors.length > 0}
									<div>
										<label class="block text-sm font-medium text-gray-700 mb-2">
											Available Specialists
										</label>
										<div class="space-y-2">
											{#each specialtyDoctors as doctor}
												<label
													class="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer {consultationForm.selectedDoctor ===
													doctor.id
														? 'border-blue-500 bg-blue-50'
														: ''}"
												>
													<input
														type="radio"
														name="selectedDoctor"
														value={doctor.id}
														checked={consultationForm.selectedDoctor === doctor.id}
														onchange={() => selectDoctor(doctor.id)}
														class="mt-1 mr-3"
													/>
													<div class="flex-1">
														<div class="font-medium text-gray-900">{doctor.name}</div>
														<div class="text-sm text-gray-600">
															{doctor.medical_institutions?.name || 'Unknown Institution'}
														</div>
														<div class="text-sm text-gray-500 flex items-center mt-1">
															<span class="mr-2"
																>📍 {doctor.medical_institutions?.country || 'Unknown'}</span
															>
															<span class="text-xs bg-gray-100 px-2 py-1 rounded">
																{doctor.wallet_address?.slice(
																	0,
																	6
																)}...{doctor.wallet_address?.slice(-4)}
															</span>
														</div>
													</div>
												</label>
											{/each}
										</div>
									</div>
								{/if}

								<!-- Urgency -->
								<div>
									<label for="urgency" class="block text-sm font-medium text-gray-700 mb-2">
										Urgency Level *
									</label>
									<select
										id="urgency"
										bind:value={consultationForm.urgency}
										class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										required
									>
										<option value="routine">Routine</option>
										<option value="urgent">Urgent</option>
										<option value="emergency">Emergency</option>
									</select>
								</div>

								<!-- Patient Demographics -->
								<div class="grid grid-cols-2 gap-4">
									<div>
										<label for="patientAge" class="block text-sm font-medium text-gray-700 mb-2">
											Patient Age
										</label>
										<input
											type="number"
											id="patientAge"
											bind:value={consultationForm.patientAge}
											min="0"
											max="120"
											class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										/>
									</div>
									<div>
										<label for="patientGender" class="block text-sm font-medium text-gray-700 mb-2">
											Patient Gender
										</label>
										<select
											id="patientGender"
											bind:value={consultationForm.patientGender}
											class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
										>
											<option value="male">Male</option>
											<option value="female">Female</option>
											<option value="other">Other</option>
										</select>
									</div>
								</div>

								<!-- Preferred Countries -->
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-2">
										Preferred Countries
									</label>
									<div class="space-y-2">
										<label class="flex items-center">
											<input
												type="checkbox"
												checked={consultationForm.preferredCountries.includes('United Kingdom')}
												onchange={() => toggleCountry('United Kingdom')}
												class="mr-2"
											/>
											United Kingdom
										</label>
										<label class="flex items-center">
											<input
												type="checkbox"
												checked={consultationForm.preferredCountries.includes('Germany')}
												onchange={() => toggleCountry('Germany')}
												class="mr-2"
											/>
											Germany
										</label>
										<label class="flex items-center">
											<input
												type="checkbox"
												checked={consultationForm.preferredCountries.includes('Canada')}
												onchange={() => toggleCountry('Canada')}
												class="mr-2"
											/>
											Canada
										</label>
									</div>
								</div>
							</div>
						</div>

						<!-- Submit Button -->
						<div class="mt-8 flex justify-end">
							<button
								type="submit"
								disabled={isLoading}
								class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
							>
								{isLoading ? 'Creating...' : 'Request Consultation'}
							</button>
						</div>
					</form>
				</div>
			{:else if activeTab === 'pending'}
				<!-- Pending Consultation Requests -->
				<div class="bg-white rounded-lg shadow-sm p-6">
					<h2 class="text-lg font-semibold text-gray-900 mb-6">Pending Consultation Requests</h2>

					{#if pendingConsultations.length === 0}
						<div class="text-center py-8">
							<p class="text-gray-500">No pending consultation requests</p>
						</div>
					{:else}
						<div class="space-y-4">
							{#each pendingConsultations as consultation}
								<div class="border border-gray-200 rounded-lg p-4">
									<div class="flex items-center justify-between mb-3">
										<div>
											<h3 class="font-medium text-gray-900">Consultation Request</h3>
											<p class="text-sm text-gray-600">
												From: {consultation.originDoctor} • {consultation.country}
											</p>
										</div>
										<div class="flex items-center space-x-2">
											<span
												class="px-2 py-1 text-xs font-medium rounded-full {consultation.urgency ===
												'emergency'
													? 'bg-red-100 text-red-800'
													: consultation.urgency === 'urgent'
														? 'bg-yellow-100 text-yellow-800'
														: 'bg-green-100 text-green-800'}"
											>
												{consultation.urgency}
											</span>
											<span
												class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
											>
												{consultation.specialty}
											</span>
										</div>
									</div>

									<div class="mb-4">
										<h4 class="text-sm font-medium text-gray-700 mb-1">Symptoms:</h4>
										<ul class="text-sm text-gray-600">
											{#each consultation.symptoms as symptom}
												<li>• {symptom}</li>
											{/each}
										</ul>
									</div>

									{#if consultation.status === 'pending'}
										<div class="flex space-x-3">
											<button
												onclick={() => respondToConsultation(consultation.id, 'accept')}
												disabled={isLoading}
												class="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
											>
												Accept
											</button>
											<button
												onclick={() => respondToConsultation(consultation.id, 'reject')}
												disabled={isLoading}
												class="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
											>
												Decline
											</button>
										</div>
									{:else}
										<div class="text-sm text-gray-600">
											Status: <span class="capitalize">{consultation.status}</span>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{:else if activeTab === 'my-consultations'}
				<!-- My Consultations -->
				<div class="bg-white rounded-lg shadow-sm p-6">
					<h2 class="text-lg font-semibold text-gray-900 mb-6">My Consultation Requests</h2>

					{#if myConsultations.length === 0}
						<div class="text-center py-8">
							<p class="text-gray-500">No consultation requests created yet</p>
						</div>
					{:else}
						<div class="space-y-4">
							{#each myConsultations as consultation}
								<div class="border border-gray-200 rounded-lg p-4">
									<div class="flex items-center justify-between mb-3">
										<div>
											<h3 class="font-medium text-gray-900">Consultation #{consultation.id}</h3>
											<p class="text-sm text-gray-600">
												Specialist: {consultation.targetSpecialist}
											</p>
										</div>
										<div class="flex items-center space-x-2">
											<span
												class="px-2 py-1 text-xs font-medium rounded-full {consultation.status ===
												'accepted'
													? 'bg-green-100 text-green-800'
													: consultation.status === 'pending'
														? 'bg-yellow-100 text-yellow-800'
														: 'bg-red-100 text-red-800'}"
											>
												{consultation.status}
											</span>
											<span
												class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
											>
												{consultation.specialty}
											</span>
										</div>
									</div>

									<div class="text-sm text-gray-600">
										Country: {consultation.country} • Urgency: {consultation.urgency}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>
