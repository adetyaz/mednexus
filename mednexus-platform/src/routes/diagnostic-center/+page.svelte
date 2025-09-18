<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import type {
		AIInsight,
		DashboardMetrics,
		CaseProcessingStatus
	} from '$lib/services/diagnosticMetricsService';
	import type {
		PatternAnalysisResult,
		PatternMatch
	} from '$lib/services/patternRecognitionService';
	import { diagnosticMetricsService } from '$lib/services/diagnosticMetricsService';
	import { patternRecognitionService } from '$lib/services/patternRecognitionService';

	// Page state
	let isLoading = $state(false);
	let selectedTab = $state('dashboard');
	let metrics = $state<DashboardMetrics | null>(null);
	let insights = $state<AIInsight[]>([]);
	let processingCases = $state<CaseProcessingStatus[]>([]);
	let analysisResults = $state<PatternAnalysisResult[]>([]);

	// Real-time updates
	let unsubscribeUpdates: (() => void) | null = null;

	// Sample medical case for testing
	let sampleCase = $state({
		id: `case_${Date.now()}`,
		patientId: 'P-2024-001',
		hospitalId: 'demo_hospital',
		chiefComplaint: 'Progressive muscle weakness and fatigue over 6 months',
		symptoms: [
			'muscle weakness',
			'chronic fatigue',
			'difficulty walking',
			'joint pain',
			'skin rash',
			'fever episodes'
		],
		vitalSigns: {
			temperature: 37.2,
			bloodPressure: '120/80',
			heartRate: 85,
			respiratoryRate: 16,
			oxygenSaturation: 98
		},
		demographics: {
			age: 34,
			gender: 'female' as const,
			ethnicity: 'Caucasian',
			weight: 65,
			height: 165
		},
		medicalHistory: [
			'No significant past medical history',
			'Family history of autoimmune conditions'
		],
		currentMedications: ['Multivitamin'],
		allergies: ['None known'],
		labResults: {},
		timestamp: new Date(),
		urgency: 'routine' as const,
		specialty: 'Rheumatology',
		createdAt: new Date(),
		updatedAt: new Date()
	});

	onMount(() => {
		loadDashboardData();

		// Subscribe to real-time updates
		unsubscribeUpdates = diagnosticMetricsService.subscribeToUpdates((update) => {
			handleRealtimeUpdate(update);
		});

		return () => {
			if (unsubscribeUpdates) {
				unsubscribeUpdates();
			}
		};
	});

	async function loadDashboardData() {
		try {
			isLoading = true;

			// Load dashboard metrics
			metrics = await diagnosticMetricsService.getDashboardMetrics();

			// Load AI insights
			insights = await diagnosticMetricsService.getAIInsights(20);

			// Load active processing cases
			processingCases = await diagnosticMetricsService.getActiveProcessingStatuses();
		} catch (error) {
			console.error('Failed to load dashboard data:', error);
		} finally {
			isLoading = false;
		}
	}

	async function analyzeTestCase() {
		try {
			isLoading = true;

			// Process case through AI pipeline
			await diagnosticMetricsService.processNewCase(sampleCase);

			// Run pattern analysis
			const result = await patternRecognitionService.analyzeCase(sampleCase);
			analysisResults = [result, ...analysisResults];

			// Refresh dashboard data
			await loadDashboardData();
		} catch (error) {
			console.error('Failed to analyze case:', error);
		} finally {
			isLoading = false;
		}
	}

	function handleRealtimeUpdate(update: any) {
		switch (update.type) {
			case 'metrics_updated':
				metrics = update.data;
				break;
			case 'insight_added':
				insights = [update.data, ...insights].slice(0, 20);
				break;
			case 'case_processing':
			case 'case_completed':
				loadDashboardData(); // Refresh processing cases
				break;
		}
	}

	function getPriorityClass(priority: string) {
		switch (priority) {
			case 'critical':
				return 'border-l-red-500 bg-red-50';
			case 'high':
				return 'border-l-orange-500 bg-orange-50';
			case 'medium':
				return 'border-l-yellow-500 bg-yellow-50';
			case 'low':
				return 'border-l-blue-500 bg-blue-50';
			default:
				return 'border-l-gray-500 bg-gray-50';
		}
	}

	function getInsightTypeIcon(type: string) {
		switch (type) {
			case 'pattern_detected':
				return '🔍';
			case 'rare_disease_alert':
				return '⚠️';
			case 'similar_case_found':
				return '🎯';
			case 'consultation_recommended':
				return '👨‍⚕️';
			default:
				return '💡';
		}
	}
</script>

<svelte:head>
	<title>AI Diagnostic Center - MedNexus</title>
	<meta
		name="description"
		content="Advanced AI-powered medical diagnostics and pattern recognition"
	/>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
	<div class="mx-auto max-w-7xl">
		<!-- Header -->
		<div class="mb-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold text-gray-900">AI Diagnostic Center</h1>
					<p class="text-gray-600 mt-2">
						Advanced medical diagnostics and pattern recognition powered by 0G Network
					</p>
				</div>

				<button
					onclick={analyzeTestCase}
					disabled={isLoading}
					class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
						   text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2
						   transition-colors duration-200"
				>
					{#if isLoading}
						<div
							class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"
						></div>
						Analyzing...
					{:else}
						🩺 Run Diagnostic Analysis
					{/if}
				</button>
			</div>
		</div>

		<!-- Tab Navigation -->
		<div class="mb-6">
			<div class="flex space-x-1 bg-white p-1 rounded-lg shadow-sm">
				<button
					onclick={() => (selectedTab = 'dashboard')}
					class={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors
						   ${
									selectedTab === 'dashboard'
										? 'bg-blue-600 text-white'
										: 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
								}`}
				>
					📊 Diagnostic Dashboard
				</button>
				<button
					onclick={() => (selectedTab = 'analysis')}
					class={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors
						   ${
									selectedTab === 'analysis'
										? 'bg-blue-600 text-white'
										: 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
								}`}
				>
					🔬 Medical Analysis
				</button>
				<button
					onclick={() => (selectedTab = 'insights')}
					class={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors
						   ${
									selectedTab === 'insights'
										? 'bg-blue-600 text-white'
										: 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
								}`}
				>
					🧠 AI Insights
				</button>
			</div>
		</div>

		<!-- Dashboard Tab -->
		{#if selectedTab === 'dashboard'}
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<!-- Metrics Cards -->
				{#if metrics}
					<div class="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
						<div class="bg-white p-6 rounded-xl shadow-sm border">
							<div class="flex items-center">
								<div class="p-2 bg-blue-100 rounded-lg">
									<span class="text-2xl">📋</span>
								</div>
								<div class="ml-4">
									<p class="text-sm font-medium text-gray-600">Cases Analyzed</p>
									<p class="text-2xl font-bold text-gray-900">
										{metrics.totalCases.toLocaleString()}
									</p>
								</div>
							</div>
						</div>

						<div class="bg-white p-6 rounded-xl shadow-sm border">
							<div class="flex items-center">
								<div class="p-2 bg-green-100 rounded-lg">
									<span class="text-2xl">🎯</span>
								</div>
								<div class="ml-4">
									<p class="text-sm font-medium text-gray-600">Diagnostic Accuracy</p>
									<p class="text-2xl font-bold text-green-600">{metrics.aiAccuracy.toFixed(1)}%</p>
								</div>
							</div>
						</div>

						<div class="bg-white p-6 rounded-xl shadow-sm border">
							<div class="flex items-center">
								<div class="p-2 bg-purple-100 rounded-lg">
									<span class="text-2xl">🌍</span>
								</div>
								<div class="ml-4">
									<p class="text-sm font-medium text-gray-600">Global Consultations</p>
									<p class="text-2xl font-bold text-purple-600">{metrics.globalConsultations}</p>
								</div>
							</div>
						</div>

						<div class="bg-white p-6 rounded-xl shadow-sm border">
							<div class="flex items-center">
								<div class="p-2 bg-orange-100 rounded-lg">
									<span class="text-2xl">⏱️</span>
								</div>
								<div class="ml-4">
									<p class="text-sm font-medium text-gray-600">Avg Analysis Time</p>
									<p class="text-2xl font-bold text-orange-600">
										{metrics.averageProcessingTime.toFixed(1)}min
									</p>
								</div>
							</div>
						</div>
					</div>
				{/if}

				<!-- Active Processing Cases -->
				<div class="lg:col-span-2">
					<div class="bg-white rounded-xl shadow-sm border p-6">
						<h3 class="text-lg font-semibold text-gray-900 mb-4">Active Diagnostic Cases</h3>

						{#if processingCases.length === 0}
							<div class="text-center py-8">
								<span class="text-4xl mb-4 block">🩺</span>
								<p class="text-gray-500">No cases currently being analyzed</p>
								<p class="text-sm text-gray-400 mt-2">
									Run a diagnostic analysis to see AI processing in action
								</p>
							</div>
						{:else}
							<div class="space-y-4">
								{#each processingCases as caseStatus}
									<div class="border rounded-lg p-4 bg-gray-50">
										<div class="flex items-center justify-between mb-2">
											<div class="flex items-center gap-3">
												<div
													class={`w-3 h-3 rounded-full ${
														caseStatus.status === 'processing'
															? 'bg-blue-500 animate-pulse'
															: caseStatus.status === 'queued'
																? 'bg-yellow-500'
																: caseStatus.status === 'completed'
																	? 'bg-green-500'
																	: 'bg-red-500'
													}`}
												></div>
												<span class="font-medium text-gray-900">{caseStatus.caseId}</span>
											</div>
											<span class="text-sm text-gray-500 capitalize">{caseStatus.status}</span>
										</div>

										<div class="w-full bg-gray-200 rounded-full h-2 mb-2">
											<div
												class="bg-blue-600 h-2 rounded-full transition-all duration-300"
												style="width: {caseStatus.progress}%"
											></div>
										</div>

										<div class="flex justify-between text-xs text-gray-600">
											<span>Progress: {caseStatus.progress}%</span>
											<span
												>Patterns: {caseStatus.patternsDetected} | Similar: {caseStatus.similarCasesFound}</span
											>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>

				<!-- Recent Insights -->
				<div class="lg:col-span-1">
					<div class="bg-white rounded-xl shadow-sm border p-6">
						<h3 class="text-lg font-semibold text-gray-900 mb-4">Recent Diagnostic Insights</h3>

						{#if insights.length === 0}
							<div class="text-center py-8">
								<span class="text-4xl mb-4 block">🧠</span>
								<p class="text-gray-500">No insights yet</p>
							</div>
						{:else}
							<div class="space-y-3 max-h-96 overflow-y-auto">
								{#each insights.slice(0, 5) as insight}
									<div
										class={`border-l-4 pl-4 py-3 rounded-r-lg ${getPriorityClass(insight.priority)}`}
									>
										<div class="flex items-start gap-2">
											<span class="text-lg">{getInsightTypeIcon(insight.type)}</span>
											<div class="flex-1">
												<p class="font-medium text-gray-900 text-sm">{insight.title}</p>
												<p class="text-gray-600 text-xs mt-1">{insight.description}</p>
												<div class="flex items-center gap-2 mt-2 text-xs text-gray-500">
													<span>Confidence: {insight.confidence}%</span>
													<span>•</span>
													<span>{insight.createdAt.toLocaleTimeString()}</span>
												</div>
											</div>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}

		<!-- Analysis Tab -->
		{#if selectedTab === 'analysis'}
			<div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
				<!-- Analysis Results -->
				<div class="xl:col-span-2">
					<div class="bg-white rounded-xl shadow-sm border p-6">
						<h3 class="text-lg font-semibold text-gray-900 mb-4">Diagnostic Analysis Results</h3>

						{#if analysisResults.length === 0}
							<div class="text-center py-12">
								<span class="text-6xl mb-4 block">🩺</span>
								<h4 class="text-xl font-semibold text-gray-700 mb-2">
									Ready to Analyze Medical Cases
								</h4>
								<p class="text-gray-500 mb-6">
									Click "Run Diagnostic Analysis" to analyze a sample medical case with AI
								</p>
								<div class="bg-blue-50 p-4 rounded-lg text-left max-w-md mx-auto">
									<h5 class="font-medium text-blue-900 mb-2">Sample Case Preview:</h5>
									<p class="text-sm text-blue-800">
										<strong>Chief Complaint:</strong>
										{sampleCase.chiefComplaint}
									</p>
									<p class="text-sm text-blue-800 mt-1">
										<strong>Key Symptoms:</strong>
										{sampleCase.symptoms.slice(0, 3).join(', ')}...
									</p>
								</div>
							</div>
						{:else}
							<div class="space-y-6">
								{#each analysisResults as result}
									<div class="border rounded-lg p-6 bg-gray-50">
										<div class="flex items-start justify-between mb-4">
											<div>
												<h4 class="font-semibold text-gray-900">Case: {result.case.id}</h4>
												<p class="text-gray-600 text-sm mt-1">{result.case.chiefComplaint}</p>
											</div>
											<div class="text-right">
												<div class="text-2xl font-bold text-green-600">
													{result.confidenceScore.toFixed(1)}%
												</div>
												<div class="text-sm text-gray-500">Confidence</div>
											</div>
										</div>

										{#if result.identifiedPatterns.length > 0}
											<div class="mb-4">
												<h5 class="font-medium text-gray-900 mb-2">🔍 Identified Patterns</h5>
												<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
													{#each result.identifiedPatterns as pattern}
														<div class="bg-white p-3 rounded border">
															<div class="flex items-center justify-between mb-2">
																<span class="font-medium text-sm capitalize"
																	>{pattern.patternType.replace('_', ' ')}</span
																>
																<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
																	>{pattern.confidence}%</span
																>
															</div>
															<p class="text-xs text-gray-600">{pattern.description}</p>
														</div>
													{/each}
												</div>
											</div>
										{/if}

										<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
											{#if result.recommendedDifferentials.length > 0}
												<div>
													<h5 class="font-medium text-gray-900 mb-2">🎯 Differential Diagnoses</h5>
													<ul class="text-sm text-gray-700 space-y-1">
														{#each result.recommendedDifferentials as diagnosis}
															<li class="flex items-center gap-2">
																<span class="w-2 h-2 bg-blue-500 rounded-full"></span>
																{diagnosis}
															</li>
														{/each}
													</ul>
												</div>
											{/if}

											{#if result.suggestedTests.length > 0}
												<div>
													<h5 class="font-medium text-gray-900 mb-2">🧪 Suggested Tests</h5>
													<ul class="text-sm text-gray-700 space-y-1">
														{#each result.suggestedTests as test}
															<li class="flex items-center gap-2">
																<span class="w-2 h-2 bg-green-500 rounded-full"></span>
																{test}
															</li>
														{/each}
													</ul>
												</div>
											{/if}
										</div>

										<div
											class="mt-4 pt-4 border-t flex items-center justify-between text-xs text-gray-500"
										>
											<div class="flex items-center gap-4">
												<span
													>Urgency: <span
														class={`font-medium ${
															result.urgencyLevel === 'critical'
																? 'text-red-600'
																: result.urgencyLevel === 'high'
																	? 'text-orange-600'
																	: result.urgencyLevel === 'medium'
																		? 'text-yellow-600'
																		: 'text-green-600'
														}`}>{result.urgencyLevel.toUpperCase()}</span
													></span
												>
												<span>Processing: {result.analysisMetadata.processingTime}ms</span>
											</div>
											<span>Accuracy: {result.analysisMetadata.accuracyAchieved.toFixed(1)}%</span>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}

		<!-- Insights Tab -->
		{#if selectedTab === 'insights'}
			<div class="bg-white rounded-xl shadow-sm border p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-6">All Diagnostic Insights</h3>

				{#if insights.length === 0}
					<div class="text-center py-12">
						<span class="text-6xl mb-4 block">🧠</span>
						<h4 class="text-xl font-semibold text-gray-700 mb-2">No Insights Available</h4>
						<p class="text-gray-500">
							Analyze medical cases to generate AI insights and diagnostic recommendations
						</p>
					</div>
				{:else}
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{#each insights as insight}
							<div class={`border-l-4 p-4 rounded-r-lg ${getPriorityClass(insight.priority)}`}>
								<div class="flex items-start gap-3">
									<span class="text-2xl">{getInsightTypeIcon(insight.type)}</span>
									<div class="flex-1">
										<h4 class="font-semibold text-gray-900 mb-1">{insight.title}</h4>
										<p class="text-gray-600 text-sm mb-3">{insight.description}</p>

										{#if insight.recommendations && insight.recommendations.length > 0}
											<div class="mb-3">
												<h5 class="font-medium text-gray-800 text-xs mb-1">Recommendations:</h5>
												<ul class="space-y-1">
													{#each insight.recommendations as rec}
														<li class="text-xs text-gray-600 flex items-center gap-1">
															<span class="w-1 h-1 bg-gray-400 rounded-full"></span>
															{rec}
														</li>
													{/each}
												</ul>
											</div>
										{/if}

										<div class="flex items-center justify-between text-xs">
											<div class="flex items-center gap-2">
												<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
													{insight.confidence}% confidence
												</span>
												<span
													class={`px-2 py-1 rounded font-medium ${
														insight.priority === 'critical'
															? 'bg-red-100 text-red-800'
															: insight.priority === 'high'
																? 'bg-orange-100 text-orange-800'
																: insight.priority === 'medium'
																	? 'bg-yellow-100 text-yellow-800'
																	: 'bg-blue-100 text-blue-800'
													}`}
												>
													{insight.priority}
												</span>
											</div>
											<span class="text-gray-500">{insight.createdAt.toLocaleTimeString()}</span>
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
