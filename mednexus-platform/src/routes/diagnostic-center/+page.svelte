<script lang="ts">
	import { onMount } from 'svelte';
	import { walletStore } from '$lib/wallet';
	import {
		zeroGCaseMatchingService as caseMatchingService,
		type MedicalCase
	} from '$lib/services/caseMatchingService';
	import {
		patternRecognitionService,
		type PatternAnalysisResult
	} from '$lib/services/patternRecognitionService';
	import { medicalDocumentManager } from '$lib/services/medicalDocumentManagementService';

	// Component state
	let isAnalyzing = $state(false);
	let analysisResults = $state<PatternAnalysisResult[]>([]);
	let serviceStatus = $state('Initializing services...');

	// Initialize services on mount
	onMount(async () => {
		try {
			serviceStatus = 'Services initialized successfully';
		} catch (error) {
			console.error('Service initialization failed:', error);
			serviceStatus = 'Service initialization failed - using fallback mode';
		}
	});

	// Patient case data
	let patientCase = $state<Partial<MedicalCase>>({
		chiefComplaint: '',
		symptoms: [''],
		vitalSigns: {
			temperature: 98.6,
			bloodPressure: '',
			heartRate: 70,
			respiratoryRate: 16,
			oxygenSaturation: 98
		},
		demographics: {
			age: 0,
			gender: 'other',
			ethnicity: '',
			weight: 0,
			height: 0
		},
		medicalHistory: [''],
		currentMedications: [],
		allergies: [],
		labResults: {},
		urgency: 'routine'
	});

	// Form management functions
	function addSymptom() {
		patientCase.symptoms = [...(patientCase.symptoms || []), ''];
	}

	function removeSymptom(index: number) {
		patientCase.symptoms = patientCase.symptoms?.filter((_, i) => i !== index) || [];
	}

	function addMedicalHistory() {
		patientCase.medicalHistory = [...(patientCase.medicalHistory || []), ''];
	}

	function removeMedicalHistory(index: number) {
		patientCase.medicalHistory = patientCase.medicalHistory?.filter((_, i) => i !== index) || [];
	}

	function addMedication() {
		patientCase.currentMedications = [...(patientCase.currentMedications || []), ''];
	}

	function removeMedication(index: number) {
		patientCase.currentMedications =
			patientCase.currentMedications?.filter((_, i) => i !== index) || [];
	}

	// Main diagnostic analysis function
	async function runDiagnosticAnalysis() {
		if (!$walletStore.isConnected) {
			alert('Please connect your wallet to access diagnostic services');
			return;
		}

		if (!patientCase.chiefComplaint?.trim()) {
			alert('Please enter the chief complaint');
			return;
		}

		isAnalyzing = true;
		try {
			// Create complete medical case
			const completeCase: MedicalCase = {
				id: `case_${Date.now()}`,
				patientId: `P-${Date.now()}`,
				hospitalId: 'current_institution',
				chiefComplaint: patientCase.chiefComplaint!,
				symptoms: patientCase.symptoms?.filter((s) => s.trim()) || [],
				vitalSigns: patientCase.vitalSigns!,
				demographics: patientCase.demographics!,
				medicalHistory: patientCase.medicalHistory?.filter((h) => h.trim()) || [],
				currentMedications: patientCase.currentMedications?.filter((m) => m.trim()) || [],
				allergies: patientCase.allergies?.filter((a) => a.trim()) || [],
				labResults: patientCase.labResults || {},
				timestamp: new Date(),
				urgency: (patientCase.urgency as any) || 'routine',
				specialty: 'General Medicine',
				createdAt: new Date(),
				updatedAt: new Date()
			};

			console.log('🔍 Starting diagnostic analysis...');

			// Use the real pattern recognition service
			const result = await patternRecognitionService.analyzeCase(completeCase);

			// Add result to results array
			analysisResults = [result, ...analysisResults];

			console.log('✅ Diagnostic analysis complete', result);
		} catch (error: any) {
			console.error('❌ Diagnostic analysis failed:', error);
			alert(`Analysis failed: ${error.message || 'Unknown error'}`);
		} finally {
			isAnalyzing = false;
		}
	}

	// Reset form
	function clearForm() {
		patientCase = {
			chiefComplaint: '',
			symptoms: [''],
			vitalSigns: {
				temperature: 98.6,
				bloodPressure: '',
				heartRate: 70,
				respiratoryRate: 16,
				oxygenSaturation: 98
			},
			demographics: {
				age: 0,
				gender: 'other',
				ethnicity: '',
				weight: 0,
				height: 0
			},
			medicalHistory: [''],
			currentMedications: [],
			allergies: [],
			labResults: {},
			urgency: 'routine'
		};
		analysisResults = [];
	}
</script>

<svelte:head>
	<title>Medical Diagnostic Center - MedNexus</title>
	<meta name="description" content="AI-powered diagnostic analysis for healthcare professionals" />
</svelte:head>

<div class="min-h-screen bg-gray-50 p-6">
	<div class="mx-auto max-w-6xl">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-900">Medical Diagnostic Center</h1>
			<p class="text-gray-600 mt-2">AI-powered diagnostic analysis for healthcare professionals</p>

			<div class="mt-2 text-sm text-gray-500">
				Status: {serviceStatus}
			</div>

			{#if !$walletStore.isConnected}
				<div class="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
					<div class="text-red-800">
						⚠️ Please connect your wallet to access diagnostic services
					</div>
				</div>
			{/if}
		</div>

		<div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
			<!-- Patient Case Input Form -->
			<div class="xl:col-span-2">
				<div class="bg-white rounded-lg shadow-sm border p-6">
					<div class="flex items-center justify-between mb-6">
						<h2 class="text-xl font-semibold text-gray-900">Patient Case Analysis</h2>
						<button
							onclick={clearForm}
							class="text-gray-600 hover:text-gray-800 text-sm"
							type="button"
						>
							Clear Form
						</button>
					</div>

					<!-- Chief Complaint -->
					<div class="mb-6">
						<label for="chief-complaint" class="block text-sm font-medium text-gray-700 mb-2">
							Chief Complaint *
						</label>
						<textarea
							id="chief-complaint"
							bind:value={patientCase.chiefComplaint}
							placeholder="Primary reason for patient visit (e.g., chest pain, shortness of breath for 2 days)"
							class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							rows="3"
							required
						></textarea>
					</div>

					<!-- Symptoms -->
					<div class="mb-6">
						<h3 class="text-sm font-medium text-gray-700 mb-2">Presenting Symptoms</h3>
						{#each patientCase.symptoms || [] as symptom, index}
							<div class="flex gap-2 mb-2">
								<input
									bind:value={patientCase.symptoms![index]}
									placeholder="Describe symptom..."
									class="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
								/>
								{#if (patientCase.symptoms?.length || 0) > 1}
									<button
										onclick={() => removeSymptom(index)}
										class="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
										type="button"
									>
										🗑️
									</button>
								{/if}
							</div>
						{/each}
						<button
							onclick={addSymptom}
							type="button"
							class="text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg text-sm"
						>
							+ Add Symptom
						</button>
					</div>

					<!-- Vital Signs -->
					<div class="mb-6">
						<h3 class="text-sm font-medium text-gray-700 mb-3">Vital Signs</h3>
						<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
							<div>
								<label for="temperature" class="block text-xs text-gray-500 mb-1"
									>Temperature (°F)</label
								>
								<input
									id="temperature"
									type="number"
									bind:value={patientCase.vitalSigns!.temperature}
									class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
									step="0.1"
								/>
							</div>
							<div>
								<label for="blood-pressure" class="block text-xs text-gray-500 mb-1"
									>Blood Pressure</label
								>
								<input
									id="blood-pressure"
									bind:value={patientCase.vitalSigns!.bloodPressure}
									placeholder="120/80"
									class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
								/>
							</div>
							<div>
								<label for="heart-rate" class="block text-xs text-gray-500 mb-1"
									>Heart Rate (bpm)</label
								>
								<input
									id="heart-rate"
									type="number"
									bind:value={patientCase.vitalSigns!.heartRate}
									class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
								/>
							</div>
							<div>
								<label for="oxygen-sat" class="block text-xs text-gray-500 mb-1"
									>O2 Saturation (%)</label
								>
								<input
									id="oxygen-sat"
									type="number"
									bind:value={patientCase.vitalSigns!.oxygenSaturation}
									class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
									max="100"
								/>
							</div>
						</div>
					</div>

					<!-- Demographics -->
					<div class="mb-6">
						<h3 class="text-sm font-medium text-gray-700 mb-3">Patient Demographics</h3>
						<div class="grid grid-cols-2 md:grid-cols-3 gap-4">
							<div>
								<label for="age" class="block text-xs text-gray-500 mb-1">Age</label>
								<input
									id="age"
									type="number"
									bind:value={patientCase.demographics!.age}
									class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
								/>
							</div>
							<div>
								<label for="gender" class="block text-xs text-gray-500 mb-1">Gender</label>
								<select
									id="gender"
									bind:value={patientCase.demographics!.gender}
									class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
								>
									<option value="other">Other/Unspecified</option>
									<option value="male">Male</option>
									<option value="female">Female</option>
								</select>
							</div>
							<div>
								<label for="urgency" class="block text-xs text-gray-500 mb-1">Case Urgency</label>
								<select
									id="urgency"
									bind:value={patientCase.urgency}
									class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
								>
									<option value="routine">Routine</option>
									<option value="urgent">Urgent</option>
									<option value="emergency">Emergency</option>
								</select>
							</div>
						</div>
					</div>

					<!-- Medical History -->
					<div class="mb-6">
						<h3 class="text-sm font-medium text-gray-700 mb-2">Medical History</h3>
						{#each patientCase.medicalHistory || [] as history, index}
							<div class="flex gap-2 mb-2">
								<input
									bind:value={patientCase.medicalHistory![index]}
									placeholder="Previous condition or relevant history..."
									class="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
								/>
								{#if (patientCase.medicalHistory?.length || 0) > 1}
									<button
										onclick={() => removeMedicalHistory(index)}
										class="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
										type="button"
									>
										🗑️
									</button>
								{/if}
							</div>
						{/each}
						<button
							onclick={addMedicalHistory}
							type="button"
							class="text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg text-sm"
						>
							+ Add Medical History
						</button>
					</div>

					<!-- Current Medications -->
					<div class="mb-6">
						<h3 class="text-sm font-medium text-gray-700 mb-2">Current Medications</h3>
						{#each patientCase.currentMedications || [] as medication, index}
							<div class="flex gap-2 mb-2">
								<input
									bind:value={patientCase.currentMedications![index]}
									placeholder="Medication name and dosage..."
									class="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
								/>
								{#if (patientCase.currentMedications?.length || 0) > 0}
									<button
										onclick={() => removeMedication(index)}
										class="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
										type="button"
									>
										🗑️
									</button>
								{/if}
							</div>
						{/each}
						<button
							onclick={addMedication}
							type="button"
							class="text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg text-sm"
						>
							+ Add Medication
						</button>
					</div>

					<!-- Analyze Button -->
					<div class="flex justify-end">
						<button
							onclick={runDiagnosticAnalysis}
							disabled={isAnalyzing ||
								!$walletStore.isConnected ||
								!patientCase.chiefComplaint?.trim()}
							class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
								   text-white font-semibold py-3 px-6 rounded-lg flex items-center gap-2"
							type="button"
						>
							{#if isAnalyzing}
								<div
									class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"
								></div>
								Analyzing...
							{:else}
								🔍 Analyze Case
							{/if}
						</button>
					</div>
				</div>
			</div>

			<!-- Analysis Results -->
			<div class="xl:col-span-1">
				<div class="bg-white rounded-lg shadow-sm border p-6 sticky top-6">
					<h2 class="text-xl font-semibold text-gray-900 mb-6">Analysis Results</h2>

					{#if analysisResults.length === 0}
						<div class="text-center py-8">
							<div class="text-gray-400 mb-4">
								<svg
									class="w-16 h-16 mx-auto"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 5H7a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
									></path>
								</svg>
							</div>
							<p class="text-gray-500">
								Enter patient information and run analysis to see diagnostic suggestions
							</p>
						</div>
					{:else}
						<div class="space-y-4">
							{#each analysisResults as result}
								<div class="border rounded-lg p-4 bg-gray-50">
									<div class="mb-3">
										<div class="flex items-center justify-between mb-2">
											<h3 class="font-semibold text-gray-900">Diagnostic Analysis</h3>
											<span class="text-2xl font-bold text-green-600">
												{result.confidenceScore.toFixed(1)}%
											</span>
										</div>
										<p class="text-sm text-gray-600">{result.case.chiefComplaint}</p>
									</div>

									{#if result.identifiedPatterns?.length > 0}
										<div class="mb-4">
											<h4 class="font-medium text-gray-900 mb-2 text-sm">🔍 Identified Patterns</h4>
											<div class="space-y-2">
												{#each result.identifiedPatterns as pattern}
													<div class="bg-white p-2 rounded border text-sm">
														<div class="flex items-center justify-between mb-1">
															<span class="font-medium capitalize">
																{pattern.patternType.replace('_', ' ')}
															</span>
															<span class="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
																{pattern.confidence}%
															</span>
														</div>
														<p class="text-xs text-gray-600">{pattern.description}</p>
													</div>
												{/each}
											</div>
										</div>
									{/if}

									{#if result.recommendedDifferentials?.length > 0}
										<div class="mb-4">
											<h4 class="font-medium text-gray-900 mb-2 text-sm">
												🎯 Differential Diagnoses
											</h4>
											<ul class="text-sm text-gray-700 space-y-1">
												{#each result.recommendedDifferentials.slice(0, 5) as diagnosis}
													<li class="flex items-center gap-2">
														<span class="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
														{diagnosis}
													</li>
												{/each}
											</ul>
										</div>
									{/if}

									{#if result.suggestedTests?.length > 0}
										<div>
											<h4 class="font-medium text-gray-900 mb-2 text-sm">🧪 Suggested Tests</h4>
											<ul class="text-sm text-gray-700 space-y-1">
												{#each result.suggestedTests.slice(0, 4) as test}
													<li class="flex items-center gap-2">
														<span class="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
														{test}
													</li>
												{/each}
											</ul>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
