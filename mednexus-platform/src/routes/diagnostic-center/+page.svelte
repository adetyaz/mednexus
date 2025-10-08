<script lang="ts">
	import { onMount } from 'svelte';
	import { walletStore, walletManager } from '$lib/wallet';
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
		// First, ensure wallet is connected and trigger connection if needed
		if (!$walletStore.isConnected) {
			console.log('🔗 Connecting wallet for 0G Compute analysis...');
			try {
				await walletManager.connect();
				// Wait for wallet connection
				await new Promise((resolve) => {
					const unsubscribe = walletStore.subscribe((wallet) => {
						if (wallet.isConnected && wallet.address) {
							console.log('✅ Wallet connected, proceeding with analysis...');
							unsubscribe();
							resolve(true);
						}
					});
				});
			} catch (error) {
				console.error('Failed to connect wallet:', error);
				return;
			}
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

	/**
	 * Navigate to consultation page with pre-filled case data
	 */
	async function navigateToConsultation(analysisResult: PatternAnalysisResult) {
		try {
			console.log('🩺 Starting expert consultation request...');

		// Convert analysis result back to medical case format for consultation
		const consultationCase = {
			id: analysisResult.case?.id || `case_${Date.now()}`,
			patientId: analysisResult.case?.patientId || `P-${Date.now()}`,
			hospitalId: analysisResult.case?.hospitalId || 'current_institution',
			symptoms: analysisResult.case?.symptoms || [],
			duration: '2 weeks', // Default, could be extracted from case
			previousTreatments: analysisResult.case?.medicalHistory || [],
			diagnosticTests: [],
			urgency: (analysisResult.case?.urgency as 'routine' | 'urgent' | 'emergency') || 'routine',
			specialty: analysisResult.case?.specialty || 'Internal Medicine',
			description: analysisResult.case?.chiefComplaint || 'Analysis case',
			demographics: {
				age: analysisResult.case?.demographics?.age || 0,
				gender: analysisResult.case?.demographics?.gender || 'other'
			}
		};			// Store the case and analysis for the consultation page
			sessionStorage.setItem('pendingConsultationCase', JSON.stringify(consultationCase));
			sessionStorage.setItem('aiAnalysisResult', JSON.stringify(analysisResult));

			// Navigate to consultations page
			window.location.href = '/consultations?fromDiagnosis=true';
		} catch (error) {
			console.error('Failed to initiate consultation:', error);
			alert('Failed to start consultation. Please try again.');
		}
	}

	/**
	 * View similar cases (placeholder for future implementation)
	 */
	function viewRelatedCases(analysisResult: PatternAnalysisResult) {
		console.log('🔍 Viewing related cases for:', analysisResult.case?.chiefComplaint || 'Unknown case');

		// For now, show a simple alert with case information
		const patterns =
			analysisResult.identifiedPatterns?.map((p) => p.description).join('\n- ') ||
			'No specific patterns identified';

		alert(`Related Cases & Documents:

Chief Complaint: ${analysisResult.case?.chiefComplaint || 'Not specified'}

Identified Patterns:
- ${patterns}

Differential Diagnoses:
- ${(analysisResult.recommendedDifferentials ?? []).slice(0, 3).join('\n- ')}

This feature will be enhanced to show:
• Similar cases from the medical network
• Related research papers and protocols
• Expert opinions on similar presentations

For now, you can request an expert consultation to discuss similar cases.`);
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

					<!-- Demo and Analyze Buttons -->
					<div class="flex justify-end gap-3">
						<!-- <button
							onclick={loadDemoCADCase}
							class="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center gap-2"
							type="button"
						>
							📋 Load Demo Case
						</button> -->
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

									<!-- Consultation Integration Section -->
									{#if (result.confidenceScore ?? 0) > 0}
										<div class="mt-6 pt-4 border-t border-gray-200">
											<h4 class="font-medium text-gray-900 mb-3 text-sm">
												🤝 Expert Consultation Available
											</h4>

											<div class="bg-blue-50 rounded-lg p-4">
												<div class="flex items-start gap-3">
													<div class="flex-shrink-0">
														<svg
															class="w-5 h-5 text-blue-600 mt-0.5"
															xmlns="http://www.w3.org/2000/svg"
															fill="none"
															viewBox="0 0 24 24"
															stroke-width="1.5"
															stroke="currentColor"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
															/>
														</svg>
													</div>
													<div class="flex-1">
														<p class="text-sm text-blue-900 mb-3">
															Connect with expert doctors who have experience with similar cases.
															Our AI analysis has been integrated to help specialists understand
															your case better.
														</p>

														<div class="flex flex-wrap gap-2">
															<button
																onclick={() => navigateToConsultation(result)}
																class="inline-flex items-center gap-1.5 bg-blue-600 text-white text-xs px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
															>
																<svg
																	class="w-3 h-3"
																	xmlns="http://www.w3.org/2000/svg"
																	fill="none"
																	viewBox="0 0 24 24"
																	stroke-width="1.5"
																	stroke="currentColor"
																>
																	<path
																		stroke-linecap="round"
																		stroke-linejoin="round"
																		d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
																	/>
																</svg>
																Request Expert Consultation
															</button>

															<button
																onclick={() => viewRelatedCases(result)}
																class="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-md hover:bg-gray-200 transition-colors"
															>
																<svg
																	class="w-3 h-3"
																	xmlns="http://www.w3.org/2000/svg"
																	fill="none"
																	viewBox="0 0 24 24"
																	stroke-width="1.5"
																	stroke="currentColor"
																>
																	<path
																		stroke-linecap="round"
																		stroke-linejoin="round"
																		d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
																	/>
																</svg>
																View Similar Cases
															</button>
														</div>

														{#if (result.identifiedPatterns ?? []).length > 0}
															<div class="mt-3 pt-3 border-t border-blue-200">
																<p class="text-xs text-blue-700 mb-2">
																	<strong>AI Analysis Ready:</strong>
																	{(result.identifiedPatterns ?? []).length} patterns identified with {(result.confidenceScore ?? 0).toFixed(
																		1
																	)}% confidence
																</p>
																<div class="flex flex-wrap gap-1">
																	{#each (result.identifiedPatterns ?? []).slice(0, 3) as pattern}
																		<span
																			class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full"
																		>
																			{pattern.patternType.replace('_', ' ')}
																		</span>
																	{/each}
																</div>
															</div>
														{/if}
													</div>
												</div>
											</div>
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
