<script lang="ts">
	import { onMount } from 'svelte';
	import type { MedicalCase } from '$lib/services/caseMatchingService';
	import type {
		PatternAnalysisResult,
		PatternMatch
	} from '$lib/services/patternRecognitionService';
	import { patternRecognitionService } from '$lib/services/patternRecognitionService';
	import { diagnosticMetricsService } from '$lib/services/diagnosticMetricsService';

	// Component props
	interface Props {
		onAnalysisComplete?: (result: PatternAnalysisResult) => void;
		showRealTimeUpdates?: boolean;
	}

	let { onAnalysisComplete, showRealTimeUpdates = true }: Props = $props();

	// Form state
	let isAnalyzing = $state(false);
	let currentAnalysis = $state<PatternAnalysisResult | null>(null);
	let analysisHistory = $state<PatternAnalysisResult[]>([]);
	let selectedTemplate = $state('custom');

	// Medical case form data
	let caseForm = $state({
		patientId: '',
		chiefComplaint: '',
		symptoms: [''],
		demographics: {
			age: 45,
			gender: 'female' as const,
			ethnicity: 'Caucasian'
		},
		medicalHistory: [''],
		currentMedications: [''],
		vitalSigns: {
			temperature: 37.0,
			bloodPressure: '120/80',
			heartRate: 72,
			respiratoryRate: 16,
			oxygenSaturation: 98
		},
		specialty: 'internal_medicine'
	});

	// Predefined case templates
	const caseTemplates = {
		rare_disease: {
			name: 'Rare Disease Case',
			chiefComplaint: 'Progressive muscle weakness and multisystem symptoms over 8 months',
			symptoms: [
				'muscle weakness',
				'chronic fatigue',
				'joint hypermobility',
				'skin hyperelasticity',
				'easy bruising',
				'cardiac murmur'
			],
			medicalHistory: [
				'No significant past medical history',
				'Family history of connective tissue disorders'
			],
			specialty: 'rheumatology'
		},
		cardiac_emergency: {
			name: 'Cardiac Emergency',
			chiefComplaint: 'Severe chest pain with radiation to left arm for 2 hours',
			symptoms: [
				'crushing chest pain',
				'shortness of breath',
				'nausea',
				'diaphoresis',
				'left arm numbness'
			],
			medicalHistory: ['Hypertension', 'Hyperlipidemia', 'Family history of CAD'],
			specialty: 'cardiology'
		},
		neurological_case: {
			name: 'Neurological Symptoms',
			chiefComplaint: 'Progressive cognitive decline and movement abnormalities over 6 months',
			symptoms: [
				'memory loss',
				'involuntary movements',
				'behavioral changes',
				'difficulty with coordination',
				'personality changes'
			],
			medicalHistory: [
				'No significant neurological history',
				'Family history of neurodegenerative disease'
			],
			specialty: 'neurology'
		},
		autoimmune_case: {
			name: 'Autoimmune Presentation',
			chiefComplaint: 'Joint pain, fatigue, and skin rash for several weeks',
			symptoms: [
				'joint pain',
				'morning stiffness',
				'malar rash',
				'photosensitivity',
				'chronic fatigue',
				'low-grade fever'
			],
			medicalHistory: ['No significant autoimmune history', 'Maternal history of lupus'],
			specialty: 'rheumatology'
		}
	};

	onMount(() => {
		loadAnalysisHistory();
	});

	function loadAnalysisHistory() {
		// In real app, this would load from localStorage or database
		const stored = localStorage.getItem('ai-pattern-analysis-history');
		if (stored) {
			try {
				analysisHistory = JSON.parse(stored);
			} catch (e) {
				console.warn('Failed to load analysis history:', e);
			}
		}
	}

	function saveAnalysisHistory() {
		localStorage.setItem('ai-pattern-analysis-history', JSON.stringify(analysisHistory));
	}

	function applyTemplate() {
		if (selectedTemplate === 'custom') return;

		const template = caseTemplates[selectedTemplate as keyof typeof caseTemplates];
		if (template) {
			caseForm.chiefComplaint = template.chiefComplaint;
			caseForm.symptoms = [...template.symptoms];
			caseForm.medicalHistory = [...template.medicalHistory];
			caseForm.specialty = template.specialty;
		}
	}

	function addSymptom() {
		caseForm.symptoms = [...caseForm.symptoms, ''];
	}

	function removeSymptom(index: number) {
		caseForm.symptoms = caseForm.symptoms.filter((_, i) => i !== index);
	}

	function addMedicalHistory() {
		caseForm.medicalHistory = [...caseForm.medicalHistory, ''];
	}

	function removeMedicalHistory(index: number) {
		caseForm.medicalHistory = caseForm.medicalHistory.filter((_, i) => i !== index);
	}

	function addMedication() {
		caseForm.currentMedications = [...caseForm.currentMedications, ''];
	}

	function removeMedication(index: number) {
		caseForm.currentMedications = caseForm.currentMedications.filter((_, i) => i !== index);
	}

	async function analyzeCase() {
		if (!caseForm.chiefComplaint || caseForm.symptoms.filter((s) => s.trim()).length === 0) {
			alert('Please provide chief complaint and at least one symptom');
			return;
		}

		try {
			isAnalyzing = true;
			currentAnalysis = null;

			// Create medical case object
			const medicalCase: MedicalCase = {
				id: `case_${Date.now()}`,
				patientId: caseForm.patientId || `P-${Date.now()}`,
				hospitalId: 'demo_hospital',
				chiefComplaint: caseForm.chiefComplaint,
				symptoms: caseForm.symptoms.filter((s) => s.trim()),
				demographics: {
					age: caseForm.demographics.age,
					gender: caseForm.demographics.gender,
					ethnicity: caseForm.demographics.ethnicity,
					weight: 70, // Default values
					height: 170
				},
				medicalHistory: caseForm.medicalHistory.filter((h) => h.trim()),
				currentMedications: caseForm.currentMedications.filter((m) => m.trim()),
				allergies: [], // Could add this to form
				vitalSigns: {
					...caseForm.vitalSigns,
					oxygenSaturation: 98 // Default
				},
				timestamp: new Date(),
				urgency: 'routine' as const,
				specialty: caseForm.specialty,
				createdAt: new Date(),
				updatedAt: new Date()
			};

			// Run pattern analysis
			const result = await patternRecognitionService.analyzeCase(medicalCase);
			currentAnalysis = result;

			// Process through dashboard service for additional insights
			await diagnosticMetricsService.processNewCase(medicalCase);

			// Add to history
			analysisHistory = [result, ...analysisHistory.slice(0, 9)]; // Keep last 10
			saveAnalysisHistory();

			// Callback for parent component
			if (onAnalysisComplete) {
				onAnalysisComplete(result);
			}
		} catch (error) {
			console.error('Pattern analysis failed:', error);
			alert('Analysis failed. Please try again.');
		} finally {
			isAnalyzing = false;
		}
	}

	function clearForm() {
		caseForm = {
			patientId: '',
			chiefComplaint: '',
			symptoms: [''],
			demographics: {
				age: 45,
				gender: 'female',
				ethnicity: 'Caucasian'
			},
			medicalHistory: [''],
			currentMedications: [''],
			vitalSigns: {
				temperature: 37.0,
				bloodPressure: '120/80',
				heartRate: 72,
				respiratoryRate: 16,
				oxygenSaturation: 98
			},
			specialty: 'internal_medicine'
		};
		selectedTemplate = 'custom';
		currentAnalysis = null;
	}

	function getPatternTypeIcon(type: string) {
		switch (type) {
			case 'rare_disease':
				return '🔬';
			case 'symptom_cluster':
				return '🎯';
			case 'treatment_response':
				return '💊';
			case 'genetic_marker':
				return '🧬';
			default:
				return '🔍';
		}
	}

	function getUrgencyClass(urgency: string) {
		switch (urgency) {
			case 'critical':
				return 'text-red-600 bg-red-50';
			case 'high':
				return 'text-orange-600 bg-orange-50';
			case 'medium':
				return 'text-yellow-600 bg-yellow-50';
			case 'low':
				return 'text-green-600 bg-green-50';
			default:
				return 'text-gray-600 bg-gray-50';
		}
	}
</script>

<div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
	<!-- Case Input Form -->
	<div class="bg-white rounded-xl shadow-sm border p-6">
		<h3 class="text-lg font-semibold text-gray-900 mb-6">Medical Case Input</h3>

		<!-- Template Selection -->
		<div class="mb-6">
			<label for="template" class="block text-sm font-medium text-gray-700 mb-2">
				Case Template
			</label>
			<div class="flex gap-2">
				<select
					id="template"
					bind:value={selectedTemplate}
					onchange={applyTemplate}
					class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
				>
					<option value="custom">Custom Case</option>
					<option value="rare_disease">Rare Disease Case</option>
					<option value="cardiac_emergency">Cardiac Emergency</option>
					<option value="neurological_case">Neurological Symptoms</option>
					<option value="autoimmune_case">Autoimmune Presentation</option>
				</select>
				<button
					onclick={clearForm}
					class="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
				>
					Clear
				</button>
			</div>
		</div>

		<!-- Patient Info -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
			<div>
				<label for="patientId" class="block text-sm font-medium text-gray-700 mb-1">
					Patient ID
				</label>
				<input
					type="text"
					id="patientId"
					bind:value={caseForm.patientId}
					placeholder="P-2024-001"
					class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
				/>
			</div>
			<div>
				<label for="specialty" class="block text-sm font-medium text-gray-700 mb-1">
					Specialty
				</label>
				<select
					id="specialty"
					bind:value={caseForm.specialty}
					class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
				>
					<option value="internal_medicine">Internal Medicine</option>
					<option value="cardiology">Cardiology</option>
					<option value="neurology">Neurology</option>
					<option value="rheumatology">Rheumatology</option>
					<option value="endocrinology">Endocrinology</option>
					<option value="oncology">Oncology</option>
					<option value="emergency_medicine">Emergency Medicine</option>
				</select>
			</div>
		</div>

		<!-- Chief Complaint -->
		<div class="mb-6">
			<label for="chiefComplaint" class="block text-sm font-medium text-gray-700 mb-1">
				Chief Complaint *
			</label>
			<textarea
				id="chiefComplaint"
				bind:value={caseForm.chiefComplaint}
				rows="2"
				class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
				placeholder="Patient's primary concern or presenting problem..."
			></textarea>
		</div>

		<!-- Symptoms -->
		<div class="mb-6">
			<div class="flex items-center justify-between mb-2">
				<label class="block text-sm font-medium text-gray-700"> Symptoms * </label>
				<button onclick={addSymptom} class="text-sm text-blue-600 hover:text-blue-700 font-medium">
					+ Add Symptom
				</button>
			</div>
			<div class="space-y-2">
				{#each caseForm.symptoms as symptom, index}
					<div class="flex gap-2">
						<input
							type="text"
							bind:value={caseForm.symptoms[index]}
							placeholder="Enter symptom..."
							class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						/>
						{#if caseForm.symptoms.length > 1}
							<button
								onclick={() => removeSymptom(index)}
								class="px-3 py-2 text-red-600 hover:text-red-700 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
							>
								×
							</button>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- Demographics -->
		<div class="mb-6">
			<h4 class="text-sm font-medium text-gray-700 mb-3">Demographics</h4>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div>
					<label for="age" class="block text-sm font-medium text-gray-600 mb-1">Age</label>
					<input
						type="number"
						id="age"
						bind:value={caseForm.demographics.age}
						min="0"
						max="120"
						class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
					/>
				</div>
				<div>
					<label for="gender" class="block text-sm font-medium text-gray-600 mb-1">Gender</label>
					<select
						id="gender"
						bind:value={caseForm.demographics.gender}
						class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
					>
						<option value="female">Female</option>
						<option value="male">Male</option>
						<option value="other">Other</option>
					</select>
				</div>
				<div>
					<label for="ethnicity" class="block text-sm font-medium text-gray-600 mb-1"
						>Ethnicity</label
					>
					<input
						type="text"
						id="ethnicity"
						bind:value={caseForm.demographics.ethnicity}
						class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
					/>
				</div>
			</div>
		</div>

		<!-- Medical History -->
		<div class="mb-6">
			<div class="flex items-center justify-between mb-2">
				<label class="block text-sm font-medium text-gray-700"> Medical History </label>
				<button
					onclick={addMedicalHistory}
					class="text-sm text-blue-600 hover:text-blue-700 font-medium"
				>
					+ Add History
				</button>
			</div>
			<div class="space-y-2">
				{#each caseForm.medicalHistory as history, index}
					<div class="flex gap-2">
						<input
							type="text"
							bind:value={caseForm.medicalHistory[index]}
							placeholder="Enter medical history..."
							class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						/>
						{#if caseForm.medicalHistory.length > 1}
							<button
								onclick={() => removeMedicalHistory(index)}
								class="px-3 py-2 text-red-600 hover:text-red-700 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
							>
								×
							</button>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- Current Medications -->
		<div class="mb-6">
			<div class="flex items-center justify-between mb-2">
				<label class="block text-sm font-medium text-gray-700"> Current Medications </label>
				<button
					onclick={addMedication}
					class="text-sm text-blue-600 hover:text-blue-700 font-medium"
				>
					+ Add Medication
				</button>
			</div>
			<div class="space-y-2">
				{#each caseForm.currentMedications as medication, index}
					<div class="flex gap-2">
						<input
							type="text"
							bind:value={caseForm.currentMedications[index]}
							placeholder="Enter medication..."
							class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						/>
						{#if caseForm.currentMedications.length > 1}
							<button
								onclick={() => removeMedication(index)}
								class="px-3 py-2 text-red-600 hover:text-red-700 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
							>
								×
							</button>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- Vital Signs -->
		<div class="mb-6">
			<h4 class="text-sm font-medium text-gray-700 mb-3">Vital Signs</h4>
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
				<div>
					<label for="temperature" class="block text-xs font-medium text-gray-600 mb-1"
						>Temp (°C)</label
					>
					<input
						type="number"
						id="temperature"
						bind:value={caseForm.vitalSigns.temperature}
						step="0.1"
						class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
					/>
				</div>
				<div>
					<label for="bloodPressure" class="block text-xs font-medium text-gray-600 mb-1">BP</label>
					<input
						type="text"
						id="bloodPressure"
						bind:value={caseForm.vitalSigns.bloodPressure}
						placeholder="120/80"
						class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
					/>
				</div>
				<div>
					<label for="heartRate" class="block text-xs font-medium text-gray-600 mb-1">HR</label>
					<input
						type="number"
						id="heartRate"
						bind:value={caseForm.vitalSigns.heartRate}
						class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
					/>
				</div>
				<div>
					<label for="respiratoryRate" class="block text-xs font-medium text-gray-600 mb-1"
						>RR</label
					>
					<input
						type="number"
						id="respiratoryRate"
						bind:value={caseForm.vitalSigns.respiratoryRate}
						class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
					/>
				</div>
			</div>
		</div>

		<!-- Analyze Button -->
		<button
			onclick={analyzeCase}
			disabled={isAnalyzing}
			class="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
				   text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2
				   transition-colors duration-200"
		>
			{#if isAnalyzing}
				<div
					class="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"
				></div>
				Analyzing Patterns...
			{:else}
				🧠 Run AI Pattern Analysis
			{/if}
		</button>
	</div>

	<!-- Analysis Results -->
	<div class="bg-white rounded-xl shadow-sm border p-6">
		<h3 class="text-lg font-semibold text-gray-900 mb-6">Analysis Results</h3>

		{#if currentAnalysis}
			<div class="space-y-6">
				<!-- Overall Results -->
				<div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
					<div class="flex items-center justify-between mb-2">
						<h4 class="font-semibold text-gray-900">Overall Analysis</h4>
						<div class="flex items-center gap-3">
							<span class="text-2xl font-bold text-blue-600"
								>{currentAnalysis.confidenceScore.toFixed(1)}%</span
							>
							<span
								class={`px-3 py-1 rounded-full text-sm font-medium ${getUrgencyClass(currentAnalysis.urgencyLevel)}`}
							>
								{currentAnalysis.urgencyLevel.toUpperCase()}
							</span>
						</div>
					</div>
					<p class="text-sm text-gray-600">
						Analyzed in {currentAnalysis.analysisMetadata.processingTime}ms with {currentAnalysis.analysisMetadata.accuracyAchieved.toFixed(
							1
						)}% accuracy
					</p>
				</div>

				<!-- Identified Patterns -->
				{#if currentAnalysis.identifiedPatterns.length > 0}
					<div>
						<h4 class="font-semibold text-gray-900 mb-3">🔍 Identified Patterns</h4>
						<div class="space-y-3">
							{#each currentAnalysis.identifiedPatterns as pattern}
								<div class="border rounded-lg p-4 bg-gray-50">
									<div class="flex items-start gap-3">
										<span class="text-2xl">{getPatternTypeIcon(pattern.patternType)}</span>
										<div class="flex-1">
											<div class="flex items-center justify-between mb-2">
												<h5 class="font-medium text-gray-900 capitalize">
													{pattern.patternType.replace('_', ' ')}
												</h5>
												<span
													class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium"
												>
													{pattern.confidence.toFixed(1)}%
												</span>
											</div>
											<p class="text-gray-700 text-sm mb-2">{pattern.description}</p>
											{#if pattern.recommendedActions.length > 0}
												<div>
													<h6 class="text-xs font-medium text-gray-600 mb-1">
														Recommended Actions:
													</h6>
													<ul class="text-xs text-gray-600 space-y-1">
														{#each pattern.recommendedActions as action}
															<li class="flex items-center gap-1">
																<span class="w-1 h-1 bg-gray-400 rounded-full"></span>
																{action}
															</li>
														{/each}
													</ul>
												</div>
											{/if}
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Differential Diagnoses -->
				{#if currentAnalysis.recommendedDifferentials.length > 0}
					<div>
						<h4 class="font-semibold text-gray-900 mb-3">🎯 Differential Diagnoses</h4>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
							{#each currentAnalysis.recommendedDifferentials as diagnosis}
								<div class="flex items-center gap-2 p-2 bg-gray-50 rounded">
									<span class="w-2 h-2 bg-blue-500 rounded-full"></span>
									<span class="text-sm text-gray-700">{diagnosis}</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Suggested Tests -->
				{#if currentAnalysis.suggestedTests.length > 0}
					<div>
						<h4 class="font-semibold text-gray-900 mb-3">🧪 Suggested Tests</h4>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
							{#each currentAnalysis.suggestedTests as test}
								<div class="flex items-center gap-2 p-2 bg-green-50 rounded">
									<span class="w-2 h-2 bg-green-500 rounded-full"></span>
									<span class="text-sm text-gray-700">{test}</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{:else}
			<div class="text-center py-12">
				<span class="text-6xl mb-4 block">🔬</span>
				<h4 class="text-xl font-semibold text-gray-700 mb-2">Ready for Pattern Analysis</h4>
				<p class="text-gray-500">
					Fill out the medical case form and click "Run AI Pattern Analysis" to see results
				</p>
			</div>
		{/if}
	</div>
</div>

<!-- Analysis History (if there are previous analyses) -->
{#if analysisHistory.length > 0 && !currentAnalysis}
	<div class="mt-6 bg-white rounded-xl shadow-sm border p-6">
		<h3 class="text-lg font-semibold text-gray-900 mb-4">Recent Analysis History</h3>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each analysisHistory.slice(0, 6) as analysis}
				<div
					class="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
					onclick={() => (currentAnalysis = analysis)}
				>
					<div class="flex items-center justify-between mb-2">
						<span class="text-sm font-medium text-gray-900">Case: {analysis.case.id.slice(-8)}</span
						>
						<span class="text-sm font-bold text-blue-600"
							>{analysis.confidenceScore.toFixed(1)}%</span
						>
					</div>
					<p class="text-xs text-gray-600 mb-2 line-clamp-2">{analysis.case.chiefComplaint}</p>
					<div class="flex items-center justify-between text-xs">
						<span class="text-gray-500">{analysis.identifiedPatterns.length} patterns</span>
						<span class={`px-2 py-1 rounded ${getUrgencyClass(analysis.urgencyLevel)}`}>
							{analysis.urgencyLevel}
						</span>
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}
