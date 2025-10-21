<script lang="ts">
	import { onMount } from 'svelte';
	import { clinicalTrialService } from '$lib/services/clinicalTrialService';
	import type {
		ClinicalTrial,
		RecruitmentMatch,
		TrialParticipant
	} from '$lib/services/clinicalTrialService';
	import {
		Users,
		Activity,
		TrendingUp,
		FileText,
		MapPin,
		Calendar,
		AlertCircle,
		CheckCircle,
		Clock,
		Building2,
		Stethoscope,
		Globe,
		DollarSign,
		Search,
		Filter
	} from '@lucide/svelte';

	// State
	let trials = $state<ClinicalTrial[]>([]);
	let selectedTrial = $state<ClinicalTrial | null>(null);
	let recruitmentMatches = $state<RecruitmentMatch[]>([]);
	let participants = $state<TrialParticipant[]>([]);
	let activeTab = $state<'overview' | 'recruitment' | 'sites' | 'safety'>('overview');
	let filterPhase = $state<string>('all');
	let filterStatus = $state<string>('all');
	let searchQuery = $state('');
	let isLoading = $state(false);

	// Load trials on mount
	onMount(() => {
		loadTrials();
	});

	async function loadTrials() {
		isLoading = true;
		try {
			trials = await clinicalTrialService.getAllTrials();
			if (trials.length > 0 && !selectedTrial) {
				selectTrial(trials[0]);
			}
		} catch (err) {
			console.error('Error loading trials:', err);
		} finally {
			isLoading = false;
		}
	}

	async function selectTrial(trial: ClinicalTrial) {
		selectedTrial = trial;
		isLoading = true;

		// Load trial-specific data
		recruitmentMatches = clinicalTrialService.getRecruitmentMatches(trial.trialId);
		participants = clinicalTrialService.getTrialParticipants(trial.trialId);

		isLoading = false;
	}

	async function findEligiblePatients(trialId: string) {
		isLoading = true;
		try {
			const matches = await clinicalTrialService.findEligiblePatients(trialId, 20);
			recruitmentMatches = matches;
			console.log(`Found ${matches.length} eligible patients`);
		} catch (error) {
			console.error('Error finding patients:', error);
		} finally {
			isLoading = false;
		}
	}

	// Computed values
	const filteredTrials = $derived(() => {
		let filtered = trials;

		if (filterPhase !== 'all') {
			filtered = filtered.filter((t) => t.phase === filterPhase);
		}

		if (filterStatus !== 'all') {
			filtered = filtered.filter((t) => t.status === filterStatus);
		}

		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(t) =>
					t.title.toLowerCase().includes(query) ||
					t.condition.toLowerCase().includes(query) ||
					t.protocolNumber.toLowerCase().includes(query)
			);
		}

		return filtered;
	});

	const totalEnrollment = $derived(() => {
		return trials.reduce((sum, t) => sum + t.enrollment.total, 0);
	});

	const activeTrials = $derived(() => {
		return trials.filter((t) => t.status === 'recruiting' || t.status === 'active').length;
	});

	const totalSites = $derived(() => {
		return trials.reduce((sum, t) => sum + t.sites.length, 0);
	});

	// Helper functions
	function getPhaseLabel(phase: string): string {
		return phase.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
	}

	function getStatusColor(status: string): string {
		const colors: Record<string, string> = {
			planning: 'bg-gray-100 text-gray-800',
			recruiting: 'bg-blue-100 text-blue-800',
			active: 'bg-green-100 text-green-800',
			completed: 'bg-purple-100 text-purple-800',
			suspended: 'bg-yellow-100 text-yellow-800',
			terminated: 'bg-red-100 text-red-800'
		};
		return colors[status] || 'bg-gray-100 text-gray-800';
	}

	function getEnrollmentPercentage(trial: ClinicalTrial): number {
		return Math.round((trial.enrollment.total / trial.design.enrollmentTarget) * 100);
	}

	function formatCurrency(amount: number, currency: string = 'USD'): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: currency,
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	function formatDate(date: Date): string {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<div class="min-h-screen bg-gray-50 p-6">
	<div class="max-w-7xl mx-auto">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-900 mb-2">Clinical Trials Management</h1>
			<p class="text-gray-600">Multi-institutional trial coordination and patient recruitment</p>
		</div>

		<!-- Key Metrics -->
		<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
			<div class="bg-white rounded-xl shadow-sm border p-6">
				<div class="flex items-center justify-between mb-2">
					<FileText class="w-8 h-8 text-blue-600" />
					<span class="text-2xl font-bold text-gray-900">{trials.length}</span>
				</div>
				<p class="text-sm text-gray-600">Active Trials</p>
			</div>

			<div class="bg-white rounded-xl shadow-sm border p-6">
				<div class="flex items-center justify-between mb-2">
					<Users class="w-8 h-8 text-green-600" />
					<span class="text-2xl font-bold text-gray-900">{totalEnrollment()}</span>
				</div>
				<p class="text-sm text-gray-600">Enrolled Patients</p>
			</div>

			<div class="bg-white rounded-xl shadow-sm border p-6">
				<div class="flex items-center justify-between mb-2">
					<Building2 class="w-8 h-8 text-purple-600" />
					<span class="text-2xl font-bold text-gray-900">{totalSites()}</span>
				</div>
				<p class="text-sm text-gray-600">Trial Sites</p>
			</div>

			<div class="bg-white rounded-xl shadow-sm border p-6">
				<div class="flex items-center justify-between mb-2">
					<Activity class="w-8 h-8 text-orange-600" />
					<span class="text-2xl font-bold text-gray-900">{activeTrials()}</span>
				</div>
				<p class="text-sm text-gray-600">Currently Recruiting</p>
			</div>
		</div>

		<!-- Main Content -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Trials List -->
			<div class="lg:col-span-1 bg-white rounded-xl shadow-sm border">
				<div class="p-6 border-b">
					<h2 class="text-lg font-semibold text-gray-900 mb-4">Clinical Trials</h2>

					<!-- Search & Filters -->
					<div class="space-y-3">
						<div class="relative">
							<Search
								class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
							/>
							<input
								type="text"
								bind:value={searchQuery}
								placeholder="Search trials..."
								class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>

						<div class="flex gap-2">
							<select
								bind:value={filterPhase}
								class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
							>
								<option value="all">All Phases</option>
								<option value="phase_1">Phase 1</option>
								<option value="phase_2">Phase 2</option>
								<option value="phase_3">Phase 3</option>
								<option value="phase_4">Phase 4</option>
							</select>

							<select
								bind:value={filterStatus}
								class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
							>
								<option value="all">All Status</option>
								<option value="recruiting">Recruiting</option>
								<option value="active">Active</option>
								<option value="completed">Completed</option>
							</select>
						</div>
					</div>
				</div>

				<!-- Trials List -->
				<div class="overflow-y-auto max-h-[600px]">
					{#each filteredTrials() as trial}
						<button
							onclick={() => selectTrial(trial)}
							class="w-full p-4 text-left border-b hover:bg-gray-50 transition-colors {selectedTrial?.trialId ===
							trial.trialId
								? 'bg-blue-50 border-l-4 border-l-blue-600'
								: ''}"
						>
							<div class="flex items-start justify-between mb-2">
								<div class="flex-1">
									<h3 class="font-medium text-gray-900 text-sm leading-tight mb-1">
										{trial.shortTitle}
									</h3>
									<p class="text-xs text-gray-500">{trial.protocolNumber}</p>
								</div>
								<span class="text-xs px-2 py-1 rounded {getStatusColor(trial.status)}">
									{trial.status}
								</span>
							</div>

							<div class="flex items-center gap-3 text-xs text-gray-600 mb-2">
								<span class="flex items-center gap-1">
									<Stethoscope class="w-3 h-3" />
									{getPhaseLabel(trial.phase)}
								</span>
								<span class="flex items-center gap-1">
									<Users class="w-3 h-3" />
									{trial.enrollment.total}/{trial.design.enrollmentTarget}
								</span>
							</div>

							<!-- Enrollment Progress Bar -->
							<div class="w-full bg-gray-200 rounded-full h-2">
								<div
									class="bg-blue-600 h-2 rounded-full transition-all"
									style="width: {getEnrollmentPercentage(trial)}%"
								></div>
							</div>
						</button>
					{/each}

					{#if filteredTrials().length === 0}
						<div class="p-8 text-center text-gray-500">
							<FileText class="w-12 h-12 mx-auto mb-3 opacity-50" />
							<p>No trials found</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- Trial Details -->
			<div class="lg:col-span-2 bg-white rounded-xl shadow-sm border">
				{#if selectedTrial}
					<div class="p-6 border-b">
						<div class="flex items-start justify-between mb-4">
							<div>
								<h2 class="text-xl font-bold text-gray-900 mb-1">
									{selectedTrial.title}
								</h2>
								<div class="flex items-center gap-3 text-sm text-gray-600">
									<span class="flex items-center gap-1">
										<FileText class="w-4 h-4" />
										{selectedTrial.protocolNumber}
									</span>
									<span class="flex items-center gap-1">
										<Calendar class="w-4 h-4" />
										Started {formatDate(selectedTrial.timeline.startDate)}
									</span>
								</div>
							</div>
							<span class="text-sm px-3 py-1 rounded {getStatusColor(selectedTrial.status)}">
								{selectedTrial.status}
							</span>
						</div>

						<!-- Tabs -->
						<div class="flex gap-4 border-b">
							<button
								onclick={() => (activeTab = 'overview')}
								class="pb-2 px-1 text-sm font-medium border-b-2 transition-colors {activeTab ===
								'overview'
									? 'border-blue-600 text-blue-600'
									: 'border-transparent text-gray-600 hover:text-gray-900'}"
							>
								Overview
							</button>
							<button
								onclick={() => (activeTab = 'recruitment')}
								class="pb-2 px-1 text-sm font-medium border-b-2 transition-colors {activeTab ===
								'recruitment'
									? 'border-blue-600 text-blue-600'
									: 'border-transparent text-gray-600 hover:text-gray-900'}"
							>
								Recruitment ({recruitmentMatches.length})
							</button>
							<button
								onclick={() => (activeTab = 'sites')}
								class="pb-2 px-1 text-sm font-medium border-b-2 transition-colors {activeTab ===
								'sites'
									? 'border-blue-600 text-blue-600'
									: 'border-transparent text-gray-600 hover:text-gray-900'}"
							>
								Sites ({selectedTrial.sites.length})
							</button>
							<button
								onclick={() => (activeTab = 'safety')}
								class="pb-2 px-1 text-sm font-medium border-b-2 transition-colors {activeTab ===
								'safety'
									? 'border-blue-600 text-blue-600'
									: 'border-transparent text-gray-600 hover:text-gray-900'}"
							>
								Safety
							</button>
						</div>
					</div>

					<div class="p-6 overflow-y-auto max-h-[600px]">
						{#if activeTab === 'overview'}
							<!-- Overview Tab -->
							<div class="space-y-6">
								<!-- Key Information -->
								<div class="grid grid-cols-2 gap-4">
									<div class="bg-gray-50 rounded-lg p-4">
										<p class="text-xs text-gray-600 mb-1">Phase</p>
										<p class="font-semibold text-gray-900">{getPhaseLabel(selectedTrial.phase)}</p>
									</div>
									<div class="bg-gray-50 rounded-lg p-4">
										<p class="text-xs text-gray-600 mb-1">Condition</p>
										<p class="font-semibold text-gray-900">{selectedTrial.condition}</p>
									</div>
									<div class="bg-gray-50 rounded-lg p-4">
										<p class="text-xs text-gray-600 mb-1">Intervention</p>
										<p class="font-semibold text-gray-900">{selectedTrial.intervention.name}</p>
									</div>
									<div class="bg-gray-50 rounded-lg p-4">
										<p class="text-xs text-gray-600 mb-1">Study Type</p>
										<p class="font-semibold text-gray-900 capitalize">
											{selectedTrial.design.studyType}
										</p>
									</div>
								</div>

								<!-- Enrollment Progress -->
								<div class="border rounded-lg p-4">
									<h3 class="font-semibold text-gray-900 mb-4">Enrollment Progress</h3>
									<div class="space-y-3">
										<div class="flex justify-between text-sm mb-1">
											<span class="text-gray-600">Total Enrolled</span>
											<span class="font-medium"
												>{selectedTrial.enrollment.total} / {selectedTrial.design
													.enrollmentTarget}</span
											>
										</div>
										<div class="w-full bg-gray-200 rounded-full h-3">
											<div
												class="bg-blue-600 h-3 rounded-full transition-all"
												style="width: {getEnrollmentPercentage(selectedTrial)}%"
											></div>
										</div>

										<div class="grid grid-cols-3 gap-4 mt-4">
											<div class="text-center p-3 bg-blue-50 rounded">
												<p class="text-2xl font-bold text-blue-600">
													{selectedTrial.enrollment.screened}
												</p>
												<p class="text-xs text-gray-600">Screened</p>
											</div>
											<div class="text-center p-3 bg-green-50 rounded">
												<p class="text-2xl font-bold text-green-600">
													{selectedTrial.enrollment.randomized}
												</p>
												<p class="text-xs text-gray-600">Randomized</p>
											</div>
											<div class="text-center p-3 bg-purple-50 rounded">
												<p class="text-2xl font-bold text-purple-600">
													{selectedTrial.enrollment.completed}
												</p>
												<p class="text-xs text-gray-600">Completed</p>
											</div>
										</div>
									</div>
								</div>

								<!-- Principal Investigator -->
								<div class="border rounded-lg p-4">
									<h3 class="font-semibold text-gray-900 mb-3">Principal Investigator</h3>
									<div class="flex items-start gap-3">
										<div
											class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"
										>
											<Stethoscope class="w-5 h-5 text-blue-600" />
										</div>
										<div>
											<p class="font-medium text-gray-900">
												{selectedTrial.principalInvestigator.name}
											</p>
											<p class="text-sm text-gray-600">
												{selectedTrial.principalInvestigator.institution}
											</p>
											<div class="flex gap-2 mt-1">
												{#each selectedTrial.principalInvestigator.credentials as credential}
													<span class="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded"
														>{credential}</span
													>
												{/each}
											</div>
										</div>
									</div>
								</div>

								<!-- Funding -->
								<div class="border rounded-lg p-4">
									<h3 class="font-semibold text-gray-900 mb-3">Funding</h3>
									<div class="flex items-center justify-between mb-2">
										<span class="text-sm text-gray-600">Total Budget</span>
										<span class="text-lg font-bold text-gray-900">
											{formatCurrency(
												selectedTrial.funding.totalBudget,
												selectedTrial.funding.currency
											)}
										</span>
									</div>
									<div class="flex items-center justify-between mb-2">
										<span class="text-sm text-gray-600">Source</span>
										<span class="text-sm font-medium text-gray-900"
											>{selectedTrial.funding.source}</span
										>
									</div>
									<div class="flex items-center justify-between">
										<span class="text-sm text-gray-600">Per Patient Cost</span>
										<span class="text-sm font-medium text-gray-900">
											{formatCurrency(
												selectedTrial.funding.perPatientCost,
												selectedTrial.funding.currency
											)}
										</span>
									</div>
								</div>

								<!-- Regulatory Status -->
								<div class="border rounded-lg p-4">
									<h3 class="font-semibold text-gray-900 mb-3">Regulatory Approvals</h3>
									<div class="space-y-2">
										<div class="flex items-center justify-between">
											<span class="text-sm text-gray-600">IRB Approved</span>
											{#if selectedTrial.regulatory.irbApproved}
												<CheckCircle class="w-5 h-5 text-green-600" />
											{:else}
												<Clock class="w-5 h-5 text-yellow-600" />
											{/if}
										</div>
										{#if selectedTrial.regulatory.fdaApproved !== undefined}
											<div class="flex items-center justify-between">
												<span class="text-sm text-gray-600">FDA Approved</span>
												{#if selectedTrial.regulatory.fdaApproved}
													<CheckCircle class="w-5 h-5 text-green-600" />
												{:else}
													<Clock class="w-5 h-5 text-yellow-600" />
												{/if}
											</div>
										{/if}
										{#if selectedTrial.regulatory.emaApproved !== undefined}
											<div class="flex items-center justify-between">
												<span class="text-sm text-gray-600">EMA Approved</span>
												{#if selectedTrial.regulatory.emaApproved}
													<CheckCircle class="w-5 h-5 text-green-600" />
												{:else}
													<Clock class="w-5 h-5 text-yellow-600" />
												{/if}
											</div>
										{/if}
									</div>
								</div>
							</div>
						{:else if activeTab === 'recruitment'}
							<!-- Recruitment Tab -->
							<div class="space-y-4">
								<div class="flex items-center justify-between mb-4">
									<h3 class="font-semibold text-gray-900">Patient Recruitment</h3>
									<button
										onclick={() => selectedTrial && findEligiblePatients(selectedTrial.trialId)}
										disabled={isLoading}
										class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
									>
										{isLoading ? 'Searching...' : 'Find Eligible Patients'}
									</button>
								</div>

								{#if recruitmentMatches.length > 0}
									<div class="space-y-3">
										{#each recruitmentMatches as match}
											<div class="border rounded-lg p-4 hover:border-blue-300 transition-colors">
												<div class="flex items-start justify-between mb-3">
													<div>
														<p class="font-medium text-gray-900">Patient {match.patientId}</p>
														<p class="text-sm text-gray-600">Institution: {match.institutionId}</p>
													</div>
													<div class="flex items-center gap-2">
														<div class="text-right">
															<p class="text-xs text-gray-600">Match Score</p>
															<p class="text-lg font-bold text-green-600">{match.matchScore}%</p>
														</div>
														<span
															class="text-xs px-2 py-1 rounded {match.status === 'potential'
																? 'bg-blue-100 text-blue-800'
																: match.status === 'enrolled'
																	? 'bg-green-100 text-green-800'
																	: match.status === 'declined'
																		? 'bg-red-100 text-red-800'
																		: 'bg-gray-100 text-gray-800'}"
														>
															{match.status}
														</span>
													</div>
												</div>

												<!-- Eligibility Criteria -->
												<div class="space-y-1 mb-3">
													{#each match.eligibilityCriteria as criterion}
														<div class="flex items-center gap-2 text-sm">
															{#if criterion.met}
																<CheckCircle class="w-4 h-4 text-green-600 flex-shrink-0" />
															{:else}
																<AlertCircle class="w-4 h-4 text-red-600 flex-shrink-0" />
															{/if}
															<span class="text-gray-700"
																>{criterion.criterion}:
																<span class="font-medium">{criterion.value}</span></span
															>
														</div>
													{/each}
												</div>

												<!-- AI Analysis -->
												<div class="bg-blue-50 rounded p-3 text-sm">
													<p class="font-medium text-blue-900 mb-1">AI Analysis</p>
													<p class="text-blue-800 text-xs">
														Confidence: {Math.round(match.aiAnalysis.confidence * 100)}%
													</p>
													<ul class="mt-2 space-y-1">
														{#each match.aiAnalysis.reasonsForMatch.slice(0, 2) as reason}
															<li class="text-blue-700 text-xs flex items-start gap-1">
																<span class="mt-0.5">•</span>
																<span>{reason}</span>
															</li>
														{/each}
													</ul>
												</div>
											</div>
										{/each}
									</div>
								{:else}
									<div class="text-center py-12 text-gray-500">
										<Users class="w-12 h-12 mx-auto mb-3 opacity-50" />
										<p class="mb-2">No recruitment matches found</p>
										<p class="text-sm">
											Click "Find Eligible Patients" to start AI-powered recruitment
										</p>
									</div>
								{/if}
							</div>
						{:else if activeTab === 'sites'}
							<!-- Sites Tab -->
							<div class="space-y-4">
								<h3 class="font-semibold text-gray-900 mb-4">Trial Sites</h3>

								<div class="grid gap-4">
									{#each selectedTrial.sites as site}
										<div class="border rounded-lg p-4">
											<div class="flex items-start justify-between mb-3">
												<div class="flex items-start gap-3">
													<div
														class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"
													>
														<Building2 class="w-5 h-5 text-purple-600" />
													</div>
													<div>
														<h4 class="font-medium text-gray-900">{site.institutionName}</h4>
														<p class="text-sm text-gray-600 flex items-center gap-1">
															<MapPin class="w-3 h-3" />
															{site.country}
														</p>
													</div>
												</div>
												<span
													class="text-xs px-2 py-1 rounded {site.status === 'active'
														? 'bg-green-100 text-green-800'
														: site.status === 'suspended'
															? 'bg-yellow-100 text-yellow-800'
															: site.status === 'pending'
																? 'bg-blue-100 text-blue-800'
																: 'bg-gray-100 text-gray-800'}"
												>
													{site.status}
												</span>
											</div>

											<div class="grid grid-cols-2 gap-4 mb-3">
												<div>
													<p class="text-xs text-gray-600">Principal Investigator</p>
													<p class="text-sm font-medium text-gray-900">
														{site.principalInvestigator}
													</p>
												</div>
												<div>
													<p class="text-xs text-gray-600">Site Coordinator</p>
													<p class="text-sm font-medium text-gray-900">
														{site.contactInfo.coordinatorName}
													</p>
												</div>
											</div>

											<div class="mb-3">
												<div class="flex justify-between text-sm mb-1">
													<span class="text-gray-600">Enrollment</span>
													<span class="font-medium"
														>{site.currentEnrollment} / {site.enrollmentTarget}</span
													>
												</div>
												<div class="w-full bg-gray-200 rounded-full h-2">
													<div
														class="bg-purple-600 h-2 rounded-full transition-all"
														style="width: {Math.round(
															(site.currentEnrollment / site.enrollmentTarget) * 100
														)}%"
													></div>
												</div>
											</div>

											{#if site.irbApprovalNumber}
												<div class="flex items-center gap-2 text-xs text-gray-600">
													<CheckCircle class="w-4 h-4 text-green-600" />
													<span>IRB: {site.irbApprovalNumber}</span>
													{#if site.irbApprovalDate}
														<span>• Approved {formatDate(site.irbApprovalDate)}</span>
													{/if}
												</div>
											{/if}
										</div>
									{/each}
								</div>
							</div>
						{:else if activeTab === 'safety'}
							<!-- Safety Tab -->
							<div class="space-y-4">
								<div class="flex items-center justify-between mb-4">
									<h3 class="font-semibold text-gray-900">Safety Monitoring</h3>
									<span class="text-xs px-3 py-1 bg-green-100 text-green-800 rounded-full">
										{selectedTrial.enrollment.withdrawn} withdrawals
									</span>
								</div>

								<!-- Safety Metrics -->
								<div class="grid grid-cols-3 gap-4">
									<div class="border rounded-lg p-4 text-center">
										<p class="text-2xl font-bold text-gray-900">{participants.length}</p>
										<p class="text-xs text-gray-600 mt-1">Active Participants</p>
									</div>
									<div class="border rounded-lg p-4 text-center">
										<p class="text-2xl font-bold text-yellow-600">
											{participants.reduce((sum, p) => sum + p.adverseEvents.length, 0)}
										</p>
										<p class="text-xs text-gray-600 mt-1">Adverse Events</p>
									</div>
									<div class="border rounded-lg p-4 text-center">
										<p class="text-2xl font-bold text-red-600">0</p>
										<p class="text-xs text-gray-600 mt-1">Serious AEs</p>
									</div>
								</div>

								<!-- Data Safety Monitoring -->
								<div class="border rounded-lg p-4 bg-green-50">
									<div class="flex items-start gap-3">
										<CheckCircle class="w-5 h-5 text-green-600 mt-0.5" />
										<div>
											<p class="font-medium text-green-900">
												Data Safety Monitoring Committee Active
											</p>
											<p class="text-sm text-green-700 mt-1">
												Regular safety reviews conducted. No safety signals detected.
											</p>
										</div>
									</div>
								</div>

								<!-- Regulatory Reporting -->
								<div class="border rounded-lg p-4">
									<h4 class="font-medium text-gray-900 mb-3">Regulatory Reporting</h4>
									<div class="space-y-2 text-sm">
										<div class="flex items-center justify-between">
											<span class="text-gray-600">IRB Annual Report</span>
											<span class="text-green-600 flex items-center gap-1">
												<CheckCircle class="w-4 h-4" />
												Current
											</span>
										</div>
										<div class="flex items-center justify-between">
											<span class="text-gray-600">FDA Safety Reports</span>
											<span class="text-green-600 flex items-center gap-1">
												<CheckCircle class="w-4 h-4" />
												Up to date
											</span>
										</div>
										<div class="flex items-center justify-between">
											<span class="text-gray-600">EMA Safety Reports</span>
											<span class="text-green-600 flex items-center gap-1">
												<CheckCircle class="w-4 h-4" />
												Up to date
											</span>
										</div>
									</div>
								</div>

								<!-- Recent Adverse Events -->
								{#if participants.some((p) => p.adverseEvents.length > 0)}
									<div class="border rounded-lg p-4">
										<h4 class="font-medium text-gray-900 mb-3">Recent Adverse Events</h4>
										<div class="space-y-2">
											{#each participants.slice(0, 3) as participant}
												{#each participant.adverseEvents.slice(0, 1) as ae}
													<div class="bg-yellow-50 rounded p-3 text-sm">
														<div class="flex items-center justify-between mb-1">
															<span class="font-medium text-yellow-900"
																>Participant {participant.participantId.slice(-8)}</span
															>
															<span
																class="text-xs px-2 py-0.5 bg-yellow-200 text-yellow-800 rounded"
															>
																{ae.event.severity}
															</span>
														</div>
														<p class="text-yellow-800">{ae.event.description}</p>
													</div>
												{/each}
											{/each}
										</div>
									</div>
								{:else}
									<div class="text-center py-8 text-gray-500">
										<AlertCircle class="w-12 h-12 mx-auto mb-3 opacity-50" />
										<p>No adverse events reported</p>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				{:else}
					<div class="p-12 text-center text-gray-500">
						<FileText class="w-16 h-16 mx-auto mb-4 opacity-50" />
						<p>Select a trial to view details</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	/* Custom scrollbar */
	:global(.overflow-y-auto::-webkit-scrollbar) {
		width: 6px;
	}

	:global(.overflow-y-auto::-webkit-scrollbar-track) {
		background: #f1f1f1;
	}

	:global(.overflow-y-auto::-webkit-scrollbar-thumb) {
		background: #888;
		border-radius: 3px;
	}

	:global(.overflow-y-auto::-webkit-scrollbar-thumb:hover) {
		background: #555;
	}
</style>
