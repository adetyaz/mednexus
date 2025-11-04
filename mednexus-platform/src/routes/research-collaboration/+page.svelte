<script lang="ts">
	import { onMount } from 'svelte';
	import { researchCoordinationService } from '$lib/services/researchCoordinationService';
	import type {
		ResearchCollaboration,
		EthicsCommitteeApproval,
		ResearchDataset,
		ResearchPublication
	} from '$lib/services/researchCoordinationService';
	import {
		Users,
		FileText,
		Globe,
		CheckCircle,
		Clock,
		Upload,
		BookOpen,
		Building2,
		DollarSign,
		Calendar,
		Database,
		Award,
		TrendingUp
	} from '@lucide/svelte';

	// State
	let collaborations = $state<ResearchCollaboration[]>([]);
	let selectedCollaboration = $state<ResearchCollaboration | null>(null);
	let ethicsApprovals = $state<EthicsCommitteeApproval[]>([]);
	let datasets = $state<ResearchDataset[]>([]);
	let publications = $state<ResearchPublication[]>([]);
	let activeTab = $state<'overview' | 'ethics' | 'data' | 'publications'>('overview');

	// Load data on mount
	onMount(() => {
		loadCollaborations();
	});

	async function loadCollaborations() {
		// Load from both sources - blockchain Supabase data and existing service
		try {
			// Import and load blockchain projects from Supabase
			const { researchProjectService } = await import('$lib/services/researchProjectService');
			const blockchainProjects = await researchProjectService.getProjects({ limit: 20 });

			// Load existing collaborations
			const existingCollaborations = await researchCoordinationService.getAllCollaborations();

			// Combine both data sources
			collaborations = [...existingCollaborations];

			// Add blockchain projects as collaborations
			blockchainProjects.forEach((project) => {
				collaborations.push({
					collaborationId: `blockchain-${project.id}`,
					title: project.title,
					type: 'observational_study' as const,
					status: 'active' as const,
					researchQuestion: project.description,
					hypothesis: project.expected_results || 'To be determined',
					primaryObjectives: project.expected_results ? [project.expected_results] : [],
					secondaryObjectives: [],
					specialty: project.research_field || 'General Medicine',
					keywords: [],
					protocol: {
						title: project.title,
						version: '1.0',
						lastUpdated: new Date(project.updated_at || project.created_at),
						methodology: project.methodology || 'Standard research methodology',
						inclusionCriteria: [],
						exclusionCriteria: [],
						primaryEndpoints: [],
						secondaryEndpoints: [],
						statisticalPlan: 'To be determined',
						dataManagementPlan: 'Standard data management',
						qualityAssurance: []
					},
					ethics: {
						siteSpecificApprovals: new Map(),
						dataProtectionAssessment: true,
						conflictOfInterestDeclared: true
					},
					dataCollection: {
						targetSampleSize: 100,
						currentSampleSize: 0,
						dataQualityScore: 95,
						missingDataPercentage: 0
					},
					results: {
						analysisCompleted: false,
						primaryEndpointsMet: false,
						manuscriptDrafted: false,
						peerReviewed: false,
						published: false
					},
					leadInstitution: {
						institutionId: project.lead_institution_id || 'unknown',
						institutionName: project.medical_institutions?.name || 'Unknown Institution',
						country: 'USA',
						piWallet: project.lead_wallet_address,
						piName: project.medical_doctors?.name || 'Unknown PI'
					},
					collaboratingInstitutions: [],
					funding: {
						totalBudget: project.funding_amount || 0,
						currency: 'USD',
						sources: [
							{
								source: project.funding_source || 'Not specified',
								amount: project.funding_amount || 0,
								type: 'institutional' as const
							}
						]
					},
					timeline: {
						protocolDevelopment: new Date(project.start_date || project.created_at),
						ethicsSubmission: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
						dataCollectionStart: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
						analysisStart: new Date(
							project.expected_end_date || Date.now() + 300 * 24 * 60 * 60 * 1000
						),
						publicationTarget: new Date(
							project.expected_end_date || Date.now() + 365 * 24 * 60 * 60 * 1000
						)
					},
					blockchain: {
						protocolHash: project.data_hash || project.transaction_hash || '',
						registrationTxHash: project.transaction_hash,
						dataProvenanceHashes: [project.transaction_hash || ''],
						publicationHash: undefined
					},
					createdAt: new Date(project.created_at),
					updatedAt: new Date(project.updated_at || project.created_at)
				});
			});

			publications = researchCoordinationService.getAllPublications();

			if (collaborations.length > 0 && !selectedCollaboration) {
				selectCollaboration(collaborations[0]);
			}

			console.log('✅ Loaded collaborations:', collaborations);
		} catch (error) {
			console.error('❌ Failed to load collaborations:', error);
			// Fallback to existing service only
			collaborations = await researchCoordinationService.getAllCollaborations();
			publications = researchCoordinationService.getAllPublications();

			if (collaborations.length > 0 && !selectedCollaboration) {
				selectCollaboration(collaborations[0]);
			}
		}
	}

	function selectCollaboration(collaboration: ResearchCollaboration) {
		selectedCollaboration = collaboration;
		ethicsApprovals = researchCoordinationService.getEthicsApprovals(collaboration.collaborationId);
		datasets = researchCoordinationService.getDatasets(collaboration.collaborationId);
	}

	// Computed values
	const totalInstitutions = $derived(() => {
		const allInstitutions = new Set<string>();
		collaborations.forEach((c) => {
			allInstitutions.add(c.leadInstitution.institutionId);
			c.collaboratingInstitutions.forEach((ci) => allInstitutions.add(ci.institutionId));
		});
		return allInstitutions.size;
	});

	const totalDatasets = $derived(() => {
		let count = 0;
		collaborations.forEach((c) => {
			const colabDatasets = researchCoordinationService.getDatasets(c.collaborationId);
			count += colabDatasets.length;
		});
		return count;
	});

	const totalFunding = $derived(() => {
		return collaborations.reduce((sum, c) => sum + c.funding.totalBudget, 0);
	});

	// Helper functions
	function getStatusColor(status: string): string {
		const colors: Record<string, string> = {
			planning: 'bg-gray-100 text-gray-800',
			ethics_review: 'bg-yellow-100 text-yellow-800',
			active: 'bg-green-100 text-green-800',
			analysis: 'bg-blue-100 text-blue-800',
			publication: 'bg-purple-100 text-purple-800',
			completed: 'bg-indigo-100 text-indigo-800'
		};
		return colors[status] || 'bg-gray-100 text-gray-800';
	}

	function getTypeLabel(type: string): string {
		return type
			.split('_')
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join(' ');
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

	function getDataCollectionProgress(collaboration: ResearchCollaboration): number {
		if (collaboration.dataCollection.targetSampleSize === 0) return 0;
		return Math.round(
			(collaboration.dataCollection.currentSampleSize /
				collaboration.dataCollection.targetSampleSize) *
				100
		);
	}
</script>

<div class="min-h-screen bg-gray-50 p-6">
	<div class="max-w-7xl mx-auto">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-900 mb-2">Research Collaboration Network</h1>
			<p class="text-gray-600">Multi-institutional research coordination and data sharing</p>
		</div>

		<!-- Key Metrics -->
		<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
			<div class="bg-white rounded-xl shadow-sm border p-6">
				<div class="flex items-center justify-between mb-2">
					<Users class="w-8 h-8 text-blue-600" />
					<span class="text-2xl font-bold text-gray-900">{collaborations.length}</span>
				</div>
				<p class="text-sm text-gray-600">Active Collaborations</p>
			</div>

			<div class="bg-white rounded-xl shadow-sm border p-6">
				<div class="flex items-center justify-between mb-2">
					<Building2 class="w-8 h-8 text-purple-600" />
					<span class="text-2xl font-bold text-gray-900">{totalInstitutions()}</span>
				</div>
				<p class="text-sm text-gray-600">Participating Institutions</p>
			</div>

			<div class="bg-white rounded-xl shadow-sm border p-6">
				<div class="flex items-center justify-between mb-2">
					<Database class="w-8 h-8 text-green-600" />
					<span class="text-2xl font-bold text-gray-900">{totalDatasets()}</span>
				</div>
				<p class="text-sm text-gray-600">Research Datasets</p>
			</div>

			<div class="bg-white rounded-xl shadow-sm border p-6">
				<div class="flex items-center justify-between mb-2">
					<DollarSign class="w-8 h-8 text-orange-600" />
					<span class="text-2xl font-bold text-gray-900">
						${(totalFunding() / 1000000).toFixed(1)}M
					</span>
				</div>
				<p class="text-sm text-gray-600">Total Funding</p>
			</div>
		</div>

		<!-- Main Content -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Collaborations List -->
			<div class="lg:col-span-1 bg-white rounded-xl shadow-sm border">
				<div class="p-6 border-b">
					<h2 class="text-lg font-semibold text-gray-900">Research Projects</h2>
				</div>

				<div class="overflow-y-auto max-h-[700px]">
					{#each collaborations as collaboration}
						<button
							onclick={() => selectCollaboration(collaboration)}
							class="w-full p-4 text-left border-b hover:bg-gray-50 transition-colors {selectedCollaboration?.collaborationId ===
							collaboration.collaborationId
								? 'bg-blue-50 border-l-4 border-l-blue-600'
								: ''}"
						>
							<div class="flex items-start justify-between mb-2">
								<h3 class="font-medium text-gray-900 text-sm leading-tight mb-1">
									{collaboration.title}
								</h3>
							</div>

							<div class="flex items-center gap-2 mb-2">
								<span class="text-xs px-2 py-1 rounded {getStatusColor(collaboration.status)}">
									{collaboration.status.replace('_', ' ')}
								</span>
								<span class="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
									{getTypeLabel(collaboration.type)}
								</span>
							</div>

							<div class="flex items-center gap-3 text-xs text-gray-600">
								<span class="flex items-center gap-1">
									<Building2 class="w-3 h-3" />
									{collaboration.collaboratingInstitutions.length + 1} institutions
								</span>
								<span class="flex items-center gap-1">
									<Database class="w-3 h-3" />
									{researchCoordinationService.getDatasets(collaboration.collaborationId).length} datasets
								</span>
							</div>
						</button>
					{/each}
				</div>
			</div>

			<!-- Collaboration Details -->
			<div class="lg:col-span-2 bg-white rounded-xl shadow-sm border">
				{#if selectedCollaboration}
					<div class="p-6 border-b">
						<div class="flex items-start justify-between mb-4">
							<div>
								<h2 class="text-xl font-bold text-gray-900 mb-2">
									{selectedCollaboration.title}
								</h2>
								<p class="text-sm text-gray-600 mb-3">
									{selectedCollaboration.researchQuestion}
								</p>
								<div class="flex items-center gap-3">
									<span
										class="text-xs px-2 py-1 rounded {getStatusColor(selectedCollaboration.status)}"
									>
										{selectedCollaboration.status.replace('_', ' ')}
									</span>
									<span class="text-xs text-gray-600">
										Led by {selectedCollaboration.leadInstitution.institutionName}
									</span>
								</div>
							</div>
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
								onclick={() => (activeTab = 'ethics')}
								class="pb-2 px-1 text-sm font-medium border-b-2 transition-colors {activeTab ===
								'ethics'
									? 'border-blue-600 text-blue-600'
									: 'border-transparent text-gray-600 hover:text-gray-900'}"
							>
								Ethics ({ethicsApprovals.length})
							</button>
							<button
								onclick={() => (activeTab = 'data')}
								class="pb-2 px-1 text-sm font-medium border-b-2 transition-colors {activeTab ===
								'data'
									? 'border-blue-600 text-blue-600'
									: 'border-transparent text-gray-600 hover:text-gray-900'}"
							>
								Datasets ({datasets.length})
							</button>
							<button
								onclick={() => (activeTab = 'publications')}
								class="pb-2 px-1 text-sm font-medium border-b-2 transition-colors {activeTab ===
								'publications'
									? 'border-blue-600 text-blue-600'
									: 'border-transparent text-gray-600 hover:text-gray-900'}"
							>
								Publications
							</button>
						</div>
					</div>

					<div class="p-6 overflow-y-auto max-h-[650px]">
						{#if activeTab === 'overview'}
							<!-- Overview Tab -->
							<div class="space-y-6">
								<!-- Lead Institution -->
								<div class="border rounded-lg p-4">
									<h3 class="font-semibold text-gray-900 mb-3">Lead Institution</h3>
									<div class="flex items-start gap-3">
										<div
											class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"
										>
											<Building2 class="w-5 h-5 text-blue-600" />
										</div>
										<div>
											<p class="font-medium text-gray-900">
												{selectedCollaboration.leadInstitution.institutionName}
											</p>
											<p class="text-sm text-gray-600">
												{selectedCollaboration.leadInstitution.country}
											</p>
											<p class="text-sm text-gray-600 mt-1">
												PI: {selectedCollaboration.leadInstitution.piName}
											</p>
										</div>
									</div>
								</div>

								<!-- Collaborating Institutions -->
								<div class="border rounded-lg p-4">
									<h3 class="font-semibold text-gray-900 mb-3">
										Collaborating Institutions ({selectedCollaboration.collaboratingInstitutions
											.length})
									</h3>
									<div class="space-y-3">
										{#each selectedCollaboration.collaboratingInstitutions as institution}
											<div class="flex items-start justify-between p-3 bg-gray-50 rounded">
												<div>
													<p class="font-medium text-gray-900 text-sm">
														{institution.institutionName}
													</p>
													<p class="text-xs text-gray-600">{institution.country}</p>
													<p class="text-xs text-gray-600 mt-1">
														Local PI: {institution.localPIName}
													</p>
												</div>
												<div class="text-right">
													<span class="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
														{institution.role.replace('_', ' ')}
													</span>
													{#if institution.fundingContribution}
														<p class="text-xs text-gray-600 mt-1">
															{formatCurrency(institution.fundingContribution)}
														</p>
													{/if}
												</div>
											</div>
										{/each}
									</div>
								</div>

								<!-- Research Objectives -->
								<div class="border rounded-lg p-4">
									<h3 class="font-semibold text-gray-900 mb-3">Research Objectives</h3>
									<div class="space-y-3">
										<div>
											<p class="text-xs text-gray-600 mb-1">Primary Objectives</p>
											<ul class="space-y-1">
												{#each selectedCollaboration.primaryObjectives as objective}
													<li class="text-sm text-gray-900 flex items-start gap-2">
														<CheckCircle class="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
														<span>{objective}</span>
													</li>
												{/each}
											</ul>
										</div>
										{#if selectedCollaboration.secondaryObjectives.length > 0}
											<div>
												<p class="text-xs text-gray-600 mb-1">Secondary Objectives</p>
												<ul class="space-y-1">
													{#each selectedCollaboration.secondaryObjectives as objective}
														<li class="text-sm text-gray-700 flex items-start gap-2">
															<span class="text-gray-400 mt-0.5">•</span>
															<span>{objective}</span>
														</li>
													{/each}
												</ul>
											</div>
										{/if}
									</div>
								</div>

								<!-- Data Collection Progress -->
								{#if selectedCollaboration.dataCollection.targetSampleSize > 0}
									<div class="border rounded-lg p-4">
										<h3 class="font-semibold text-gray-900 mb-3">Data Collection Progress</h3>
										<div class="space-y-3">
											<div class="flex justify-between text-sm mb-1">
												<span class="text-gray-600">Sample Size</span>
												<span class="font-medium">
													{selectedCollaboration.dataCollection.currentSampleSize} /
													{selectedCollaboration.dataCollection.targetSampleSize}
												</span>
											</div>
											<div class="w-full bg-gray-200 rounded-full h-3">
												<div
													class="bg-green-600 h-3 rounded-full transition-all"
													style="width: {getDataCollectionProgress(selectedCollaboration)}%"
												></div>
											</div>
											<div class="grid grid-cols-2 gap-4 mt-3">
												<div class="bg-blue-50 rounded p-3">
													<p class="text-xs text-gray-600">Data Quality Score</p>
													<p class="text-lg font-bold text-blue-600">
														{selectedCollaboration.dataCollection.dataQualityScore.toFixed(1)}%
													</p>
												</div>
												<div class="bg-green-50 rounded p-3">
													<p class="text-xs text-gray-600">Completeness</p>
													<p class="text-lg font-bold text-green-600">
														{(
															100 - selectedCollaboration.dataCollection.missingDataPercentage
														).toFixed(1)}%
													</p>
												</div>
											</div>
										</div>
									</div>
								{/if}

								<!-- Funding -->
								<div class="border rounded-lg p-4">
									<h3 class="font-semibold text-gray-900 mb-3">Funding</h3>
									<div class="mb-3">
										<p class="text-xs text-gray-600">Total Budget</p>
										<p class="text-2xl font-bold text-gray-900">
											{formatCurrency(
												selectedCollaboration.funding.totalBudget,
												selectedCollaboration.funding.currency
											)}
										</p>
									</div>
									<div class="space-y-2">
										{#each selectedCollaboration.funding.sources as source}
											<div class="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
												<div>
													<p class="font-medium text-gray-900">{source.source}</p>
													<p class="text-xs text-gray-600 capitalize">{source.type}</p>
												</div>
												<p class="font-semibold text-gray-900">
													{formatCurrency(source.amount, selectedCollaboration.funding.currency)}
												</p>
											</div>
										{/each}
									</div>
								</div>

								<!-- Timeline -->
								<div class="border rounded-lg p-4">
									<h3 class="font-semibold text-gray-900 mb-3">Project Timeline</h3>
									<div class="space-y-3">
										<div class="flex items-start gap-3">
											<div
												class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center"
											>
												<Calendar class="w-4 h-4 text-blue-600" />
											</div>
											<div class="flex-1">
												<p class="text-sm font-medium text-gray-900">Protocol Development</p>
												<p class="text-xs text-gray-600">
													{formatDate(selectedCollaboration.timeline.protocolDevelopment)}
												</p>
											</div>
										</div>
										<div class="flex items-start gap-3">
											<div
												class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center"
											>
												<FileText class="w-4 h-4 text-yellow-600" />
											</div>
											<div class="flex-1">
												<p class="text-sm font-medium text-gray-900">Ethics Submission</p>
												<p class="text-xs text-gray-600">
													{formatDate(selectedCollaboration.timeline.ethicsSubmission)}
												</p>
											</div>
										</div>
										<div class="flex items-start gap-3">
											<div
												class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center"
											>
												<Database class="w-4 h-4 text-green-600" />
											</div>
											<div class="flex-1">
												<p class="text-sm font-medium text-gray-900">Data Collection Start</p>
												<p class="text-xs text-gray-600">
													{formatDate(selectedCollaboration.timeline.dataCollectionStart)}
												</p>
											</div>
										</div>
										<div class="flex items-start gap-3">
											<div
												class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center"
											>
												<BookOpen class="w-4 h-4 text-purple-600" />
											</div>
											<div class="flex-1">
												<p class="text-sm font-medium text-gray-900">Publication Target</p>
												<p class="text-xs text-gray-600">
													{formatDate(selectedCollaboration.timeline.publicationTarget)}
												</p>
											</div>
										</div>
									</div>
								</div>
							</div>
						{:else if activeTab === 'ethics'}
							<!-- Ethics Tab -->
							<div class="space-y-4">
								<div class="flex items-center justify-between mb-4">
									<h3 class="font-semibold text-gray-900">Ethics Approvals</h3>
								</div>

								{#if ethicsApprovals.length > 0}
									<div class="space-y-4">
										{#each ethicsApprovals as approval}
											<div class="border rounded-lg p-4">
												<div class="flex items-start justify-between mb-3">
													<div>
														<h4 class="font-medium text-gray-900">{approval.committee.name}</h4>
														<p class="text-sm text-gray-600">
															{approval.committee.institution}, {approval.committee.country}
														</p>
														<p class="text-xs text-gray-500 mt-1">
															Registration: {approval.committee.registrationNumber}
														</p>
													</div>
													<span
														class="text-xs px-2 py-1 rounded {approval.review.decision ===
														'approved'
															? 'bg-green-100 text-green-800'
															: approval.review.decision === 'pending'
																? 'bg-yellow-100 text-yellow-800'
																: approval.review.decision === 'rejected'
																	? 'bg-red-100 text-red-800'
																	: 'bg-blue-100 text-blue-800'}"
													>
														{approval.review.decision.replace('_', ' ')}
													</span>
												</div>

												<div class="grid grid-cols-2 gap-4 mb-3">
													<div>
														<p class="text-xs text-gray-600">Submission Date</p>
														<p class="text-sm font-medium text-gray-900">
															{formatDate(approval.submission.submissionDate)}
														</p>
													</div>
													{#if approval.approval.approvalDate}
														<div>
															<p class="text-xs text-gray-600">Approval Date</p>
															<p class="text-sm font-medium text-gray-900">
																{formatDate(approval.approval.approvalDate)}
															</p>
														</div>
													{/if}
												</div>

												{#if approval.approval.approvalNumber}
													<div class="bg-green-50 rounded p-3 flex items-center gap-2">
														<CheckCircle class="w-5 h-5 text-green-600" />
														<div>
															<p class="text-sm font-medium text-green-900">
																Approval Number: {approval.approval.approvalNumber}
															</p>
															{#if approval.approval.expiryDate}
																<p class="text-xs text-green-700">
																	Valid until {formatDate(approval.approval.expiryDate)}
																</p>
															{/if}
														</div>
													</div>
												{/if}

												<div class="mt-3 pt-3 border-t">
													<p class="text-xs text-gray-600 mb-1">Blockchain Verification</p>
													<p class="text-xs font-mono text-gray-900 truncate">
														{approval.blockchainProof.txHash}
													</p>
												</div>
											</div>
										{/each}
									</div>
								{:else}
									<div class="text-center py-12 text-gray-500">
										<FileText class="w-12 h-12 mx-auto mb-3 opacity-50" />
										<p>No ethics approvals yet</p>
									</div>
								{/if}
							</div>
						{:else if activeTab === 'data'}
							<!-- Datasets Tab -->
							<div class="space-y-4">
								<div class="flex items-center justify-between mb-4">
									<h3 class="font-semibold text-gray-900">Research Datasets</h3>
								</div>

								{#if datasets.length > 0}
									<div class="space-y-4">
										{#each datasets as dataset}
											<div class="border rounded-lg p-4">
												<div class="flex items-start justify-between mb-3">
													<div>
														<h4 class="font-medium text-gray-900">{dataset.title}</h4>
														<p class="text-sm text-gray-600 mt-1">{dataset.description}</p>
													</div>
													<span
														class="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded capitalize"
													>
														{dataset.dataType}
													</span>
												</div>

												<div class="grid grid-cols-3 gap-4 mb-3">
													<div class="bg-gray-50 rounded p-3">
														<p class="text-xs text-gray-600">Sample Size</p>
														<p class="text-lg font-bold text-gray-900">
															{dataset.sampleSize.toLocaleString()}
														</p>
													</div>
													<div class="bg-blue-50 rounded p-3">
														<p class="text-xs text-gray-600">Completeness</p>
														<p class="text-lg font-bold text-blue-600">
															{dataset.completeness.toFixed(1)}%
														</p>
													</div>
													<div class="bg-green-50 rounded p-3">
														<p class="text-xs text-gray-600">Quality Score</p>
														<p class="text-lg font-bold text-green-600">
															{dataset.qualityScore.toFixed(1)}/100
														</p>
													</div>
												</div>

												<div class="flex items-center gap-4 text-xs text-gray-600 mb-3">
													<span class="flex items-center gap-1">
														<CheckCircle class="w-3 h-3 text-green-600" />
														De-identified
													</span>
													<span class="flex items-center gap-1">
														<CheckCircle class="w-3 h-3 text-green-600" />
														{dataset.encryptionMethod}
													</span>
													<span class="capitalize">{dataset.accessLevel} access</span>
												</div>

												<div class="bg-gray-50 rounded p-3">
													<p class="text-xs text-gray-600 mb-1">Storage Hash (0G Storage)</p>
													<p class="text-xs font-mono text-gray-900 truncate">
														{dataset.storage.storageHash}
													</p>
													<p class="text-xs text-gray-600 mt-2">
														Uploaded {formatDate(dataset.uploadedAt)} •
														{(dataset.storage.size / 1024 / 1024).toFixed(2)} MB
													</p>
												</div>
											</div>
										{/each}
									</div>
								{:else}
									<div class="text-center py-12 text-gray-500">
										<Database class="w-12 h-12 mx-auto mb-3 opacity-50" />
										<p class="mb-2">No datasets uploaded yet</p>
										<button
											class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
										>
											<Upload class="w-4 h-4 inline mr-2" />
											Upload Dataset
										</button>
									</div>
								{/if}
							</div>
						{:else if activeTab === 'publications'}
							<!-- Publications Tab -->
							<div class="space-y-4">
								<div class="flex items-center justify-between mb-4">
									<h3 class="font-semibold text-gray-900">Research Publications</h3>
								</div>

								{#if selectedCollaboration.results.manuscriptDrafted}
									<div class="border rounded-lg p-4 bg-purple-50">
										<div class="flex items-start gap-3">
											<div
												class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center"
											>
												<BookOpen class="w-5 h-5 text-purple-600" />
											</div>
											<div class="flex-1">
												<h4 class="font-medium text-purple-900 mb-1">Manuscript in Progress</h4>
												<p class="text-sm text-purple-800">
													The research team is preparing the manuscript for publication.
												</p>
												<div class="mt-3 flex gap-2">
													{#if selectedCollaboration.results.analysisCompleted}
														<span class="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
															Analysis Complete
														</span>
													{/if}
													{#if selectedCollaboration.results.peerReviewed}
														<span class="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
															Peer Reviewed
														</span>
													{/if}
													{#if selectedCollaboration.results.published}
														<span class="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">
															Published
														</span>
													{/if}
												</div>
											</div>
										</div>
									</div>
								{:else}
									<div class="text-center py-12 text-gray-500">
										<BookOpen class="w-12 h-12 mx-auto mb-3 opacity-50" />
										<p class="mb-2">No publications yet</p>
										<p class="text-sm">
											Publications will appear here once the research is completed
										</p>
									</div>
								{/if}

								<!-- Related Publications -->
								{#if selectedCollaboration && publications.filter((p) => p.collaborationId === selectedCollaboration?.collaborationId).length > 0}
									<div class="border-t pt-4 mt-4">
										<h4 class="font-medium text-gray-900 mb-3">Related Publications</h4>
										<div class="space-y-3">
											{#each publications.filter((p) => p.collaborationId === selectedCollaboration?.collaborationId) as pub}
												<div class="border rounded-lg p-4">
													<h5 class="font-medium text-gray-900 mb-1">{pub.title}</h5>
													<p class="text-sm text-gray-600 mb-2">{pub.venue.name}</p>
													{#if pub.doi}
														<p class="text-xs text-blue-600">DOI: {pub.doi}</p>
													{/if}
													<div class="flex items-center gap-2 mt-2">
														<span
															class="text-xs px-2 py-1 rounded {pub.status === 'published'
																? 'bg-green-100 text-green-800'
																: pub.status === 'accepted'
																	? 'bg-blue-100 text-blue-800'
																	: 'bg-yellow-100 text-yellow-800'}"
														>
															{pub.status.replace('_', ' ')}
														</span>
														{#if pub.openAccess}
															<span class="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
																Open Access
															</span>
														{/if}
													</div>
												</div>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				{:else}
					<div class="p-12 text-center text-gray-500">
						<Users class="w-16 h-16 mx-auto mb-4 opacity-50" />
						<p>Select a collaboration to view details</p>
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
