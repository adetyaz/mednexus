<script lang="ts">
	import { onMount } from 'svelte';
	import { ipProtectionService } from '$lib/services/ipProtectionService';
	import { drugDiscoveryService } from '$lib/services/drugDiscoveryService';
	import type {
		PatentApplication,
		LicensingAgreement,
		IPPortfolio
	} from '$lib/services/ipProtectionService';
	import type { DrugDiscoveryProject, DrugCompound } from '$lib/services/drugDiscoveryService';
	import {
		Lightbulb,
		FileText,
		TrendingUp,
		DollarSign,
		Award,
		Users,
		FlaskConical,
		Pill,
		ShoppingCart,
		Eye,
		CheckCircle,
		Clock,
		Building2,
		Target,
		Zap,
		BarChart3,
		Globe,
		Lock,
		Unlock,
		ArrowUpRight
	} from '@lucide/svelte'; // State
	let activeTab = $state<'overview' | 'patents' | 'drugs' | 'licensing'>('overview');
	let patents = $state<PatentApplication[]>([]);
	let licenses = $state<LicensingAgreement[]>([]);
	let drugProjects = $state<DrugDiscoveryProject[]>([]);
	let compounds = $state<DrugCompound[]>([]);
	let selectedPatent = $state<PatentApplication | null>(null);
	let selectedProject = $state<DrugDiscoveryProject | null>(null);
	let selectedCompound = $state<DrugCompound | null>(null);
	let filterType = $state<string>('all');
	let filterStage = $state<string>('all');

	// Load data on mount
	onMount(() => {
		loadData();
	});

	function loadData() {
		patents = ipProtectionService.getAllPatents();
		licenses = ipProtectionService.getAllLicenses();
		drugProjects = drugDiscoveryService.getAllProjects();
		compounds = drugDiscoveryService.getAllCompounds();
	}

	// Computed values
	const totalRevenue = $derived(() => {
		return licenses.reduce((sum, l) => sum + l.financial.totalRevenueGenerated, 0);
	});

	const totalPatentValuation = $derived(() => {
		return patents.reduce((sum, p) => sum + (p.commercial.valuationEstimate || 0), 0);
	});

	const totalDrugFunding = $derived(() => {
		return drugProjects.reduce((sum, p) => sum + p.funding.totalBudget, 0);
	});

	const activePatents = $derived(() => {
		return patents.filter((p) => ['filed', 'pending', 'granted'].includes(p.filing.status));
	});

	const activeLicenses = $derived(() => {
		return licenses.filter((l) => l.status === 'active');
	});

	const filteredPatents = $derived(() => {
		if (filterType === 'all') return patents;
		return patents.filter((p) => p.innovation.type === filterType);
	});

	const filteredProjects = $derived(() => {
		return drugProjects;
	});

	const filteredCompounds = $derived(() => {
		if (filterStage === 'all') return compounds;
		return compounds.filter((c) => c.development.stage === filterStage);
	});

	// Helper functions
	function formatCurrency(amount: number, currency: string = 'USD'): string {
		if (amount >= 1000000) {
			return `$${(amount / 1000000).toFixed(1)}M`;
		} else if (amount >= 1000) {
			return `$${(amount / 1000).toFixed(0)}K`;
		}
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

	function getStatusColor(status: string): string {
		const colors: Record<string, string> = {
			draft: 'bg-gray-100 text-gray-800',
			filed: 'bg-blue-100 text-blue-800',
			pending: 'bg-yellow-100 text-yellow-800',
			granted: 'bg-green-100 text-green-800',
			active: 'bg-green-100 text-green-800',
			discovery: 'bg-purple-100 text-purple-800',
			preclinical: 'bg-blue-100 text-blue-800',
			clinical: 'bg-orange-100 text-orange-800',
			approved: 'bg-green-100 text-green-800'
		};
		return colors[status] || 'bg-gray-100 text-gray-800';
	}

	function getTypeIcon(type: string) {
		switch (type) {
			case 'drug':
				return Pill;
			case 'device':
				return Target;
			case 'method':
				return FlaskConical;
			case 'diagnostic':
				return Eye;
			case 'software':
				return Zap;
			case 'combination':
				return Award;
			default:
				return Lightbulb;
		}
	}

	function getTypeLabel(type: string): string {
		return type
			.split('_')
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join(' ');
	}

	function viewPatentDetails(patent: PatentApplication) {
		selectedPatent = patent;
		selectedProject = null;
		selectedCompound = null;
	}

	function viewProjectDetails(project: DrugDiscoveryProject) {
		selectedProject = project;
		selectedPatent = null;
		selectedCompound = null;
	}

	function viewCompoundDetails(compound: DrugCompound) {
		selectedCompound = compound;
		selectedPatent = null;
		selectedProject = null;
	}
</script>

<div class="min-h-screen bg-gray-50 p-6">
	<div class="max-w-7xl mx-auto">
		<!-- Header -->
		<div class="mb-8">
			<div class="flex items-center gap-3 mb-2">
				<div
					class="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center"
				>
					<Lightbulb class="w-7 h-7 text-white" />
				</div>
				<div>
					<h1 class="text-3xl font-bold text-gray-900">Innovation Marketplace</h1>
					<p class="text-gray-600">
						Intellectual property licensing and drug discovery collaboration
					</p>
				</div>
			</div>
		</div>

		{#if activeTab === 'overview'}
			<!-- Overview Dashboard -->
			<div class="space-y-6">
				<!-- Key Metrics -->
				<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
					<div class="bg-white rounded-xl shadow-sm border p-6">
						<div class="flex items-center justify-between mb-2">
							<Award class="w-8 h-8 text-purple-600" />
							<span class="text-2xl font-bold text-gray-900">{activePatents().length}</span>
						</div>
						<p class="text-sm text-gray-600">Active Patents</p>
						<p class="text-xs text-green-600 mt-1">
							+{patents.filter((p) => p.filing.status === 'granted').length} granted
						</p>
					</div>

					<div class="bg-white rounded-xl shadow-sm border p-6">
						<div class="flex items-center justify-between mb-2">
							<FlaskConical class="w-8 h-8 text-blue-600" />
							<span class="text-2xl font-bold text-gray-900">{drugProjects.length}</span>
						</div>
						<p class="text-sm text-gray-600">Drug Projects</p>
						<p class="text-xs text-blue-600 mt-1">
							{compounds.length} compounds
						</p>
					</div>

					<div class="bg-white rounded-xl shadow-sm border p-6">
						<div class="flex items-center justify-between mb-2">
							<DollarSign class="w-8 h-8 text-green-600" />
							<span class="text-2xl font-bold text-gray-900">
								{formatCurrency(totalRevenue())}
							</span>
						</div>
						<p class="text-sm text-gray-600">Licensing Revenue</p>
						<p class="text-xs text-green-600 mt-1">
							{activeLicenses().length} active licenses
						</p>
					</div>

					<div class="bg-white rounded-xl shadow-sm border p-6">
						<div class="flex items-center justify-between mb-2">
							<TrendingUp class="w-8 h-8 text-orange-600" />
							<span class="text-2xl font-bold text-gray-900">
								{formatCurrency(totalPatentValuation())}
							</span>
						</div>
						<p class="text-sm text-gray-600">Portfolio Value</p>
						<p class="text-xs text-orange-600 mt-1">
							{patents.filter((p) => p.inftTokenization).length} tokenized
						</p>
					</div>
				</div>

				<!-- Featured Patents -->
				<div class="bg-white rounded-xl shadow-sm border">
					<div class="p-6 border-b">
						<div class="flex items-center justify-between">
							<h2 class="text-lg font-semibold text-gray-900">Featured Patents</h2>
							<button
								onclick={() => (activeTab = 'patents')}
								class="text-sm text-blue-600 hover:text-blue-700 font-medium"
							>
								View All →
							</button>
						</div>
					</div>
					<div class="p-6">
						<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
							{#each patents.slice(0, 3) as patent}
								{@const Icon = getTypeIcon(patent.innovation.type)}
								<button
									onclick={() => viewPatentDetails(patent)}
									class="text-left border rounded-lg p-4 hover:shadow-md transition-shadow"
								>
									<div class="flex items-start gap-3 mb-3">
										<div
											class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0"
										>
											<Icon class="w-5 h-5 text-purple-600" />
										</div>
										<div class="flex-1 min-w-0">
											<h3 class="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
												{patent.title}
											</h3>
											<span
												class="text-xs px-2 py-1 rounded {getStatusColor(patent.filing.status)}"
											>
												{patent.filing.status}
											</span>
										</div>
									</div>
									<div class="space-y-2">
										<div class="flex items-center justify-between text-sm">
											<span class="text-gray-600">Valuation</span>
											<span class="font-semibold text-gray-900">
												{formatCurrency(patent.commercial.valuationEstimate || 0)}
											</span>
										</div>
										<div class="flex items-center justify-between text-sm">
											<span class="text-gray-600">Licensing Interest</span>
											<span class="font-semibold text-gray-900">
												{patent.commercial.licensingInterest} inquiries
											</span>
										</div>
										{#if patent.inftTokenization}
											<div class="flex items-center gap-1 text-xs text-purple-600">
												<Unlock class="w-3 h-3" />
												<span>INFT Tokenized</span>
											</div>
										{/if}
									</div>
								</button>
							{/each}
						</div>
					</div>
				</div>

				<!-- Active Drug Discovery Projects -->
				<div class="bg-white rounded-xl shadow-sm border">
					<div class="p-6 border-b">
						<div class="flex items-center justify-between">
							<h2 class="text-lg font-semibold text-gray-900">Drug Discovery Pipeline</h2>
							<button
								onclick={() => (activeTab = 'drugs')}
								class="text-sm text-blue-600 hover:text-blue-700 font-medium"
							>
								View All →
							</button>
						</div>
					</div>
					<div class="p-6">
						<div class="space-y-4">
							{#each drugProjects as project}
								<button
									onclick={() => viewProjectDetails(project)}
									class="w-full text-left border rounded-lg p-4 hover:shadow-md transition-shadow"
								>
									<div class="flex items-start justify-between mb-3">
										<div>
											<h3 class="font-medium text-gray-900 mb-1">{project.title}</h3>
											<p class="text-sm text-gray-600">{project.therapeuticArea.disease}</p>
										</div>
										<span class="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
											{project.timeline.currentPhase}
										</span>
									</div>

									<div class="grid grid-cols-4 gap-4 mb-3">
										<div class="bg-purple-50 rounded p-2">
											<p class="text-xs text-gray-600">Screened</p>
											<p class="text-lg font-bold text-purple-600">
												{(project.compounds.totalScreened / 1000).toFixed(0)}K
											</p>
										</div>
										<div class="bg-blue-50 rounded p-2">
											<p class="text-xs text-gray-600">Hits</p>
											<p class="text-lg font-bold text-blue-600">
												{project.compounds.hits}
											</p>
										</div>
										<div class="bg-green-50 rounded p-2">
											<p class="text-xs text-gray-600">Leads</p>
											<p class="text-lg font-bold text-green-600">
												{project.compounds.leads}
											</p>
										</div>
										<div class="bg-orange-50 rounded p-2">
											<p class="text-xs text-gray-600">Candidates</p>
											<p class="text-lg font-bold text-orange-600">
												{project.compounds.candidates}
											</p>
										</div>
									</div>

									<div class="flex items-center justify-between text-sm">
										<div class="flex items-center gap-4">
											<span class="flex items-center gap-1 text-gray-600">
												<Building2 class="w-4 h-4" />
												{project.team.collaborators.length + 1} institutions
											</span>
											{#if project.team.pharmaPartner}
												<span class="flex items-center gap-1 text-green-600">
													<CheckCircle class="w-4 h-4" />
													{project.team.pharmaPartner.companyName}
												</span>
											{/if}
										</div>
										<span class="font-semibold text-gray-900">
											{formatCurrency(project.funding.totalBudget)}
										</span>
									</div>
								</button>
							{/each}
						</div>
					</div>
				</div>

				<!-- Active Licensing Deals -->
				<div class="bg-white rounded-xl shadow-sm border">
					<div class="p-6 border-b">
						<div class="flex items-center justify-between">
							<h2 class="text-lg font-semibold text-gray-900">Active Licensing Agreements</h2>
							<button
								onclick={() => (activeTab = 'licensing')}
								class="text-sm text-blue-600 hover:text-blue-700 font-medium"
							>
								View All →
							</button>
						</div>
					</div>
					<div class="p-6">
						<div class="space-y-3">
							{#each activeLicenses() as license}
								{@const patent = patents.find((p) => p.patentId === license.patentId)}
								{#if patent}
									<div class="border rounded-lg p-4">
										<div class="flex items-start justify-between mb-2">
											<div class="flex-1">
												<h3 class="font-medium text-gray-900 text-sm mb-1">
													{patent.title}
												</h3>
												<div class="flex items-center gap-3 text-xs text-gray-600">
													<span>{license.licensor.name}</span>
													<span>→</span>
													<span>{license.licensee.name}</span>
												</div>
											</div>
											<span
												class="text-xs px-2 py-1 bg-green-100 text-green-800 rounded capitalize"
											>
												{license.terms.type}
											</span>
										</div>

										<div class="grid grid-cols-3 gap-4 mt-3">
											<div>
												<p class="text-xs text-gray-600">Upfront Fee</p>
												<p class="font-semibold text-gray-900">
													{formatCurrency(license.financial.upfrontFee)}
												</p>
											</div>
											<div>
												<p class="text-xs text-gray-600">Royalty Rate</p>
												<p class="font-semibold text-gray-900">
													{license.financial.royaltyRate}%
												</p>
											</div>
											<div>
												<p class="text-xs text-gray-600">Total Revenue</p>
												<p class="font-semibold text-green-600">
													{formatCurrency(license.financial.totalRevenueGenerated)}
												</p>
											</div>
										</div>

										<div class="mt-3 pt-3 border-t">
											<div class="flex items-center gap-2">
												<div class="flex-1 bg-gray-200 rounded-full h-2">
													<div
														class="bg-green-600 h-2 rounded-full transition-all"
														style="width: {(license.financial.milestonePayments.filter(
															(m) => m.achieved
														).length /
															license.financial.milestonePayments.length) *
															100}%"
													></div>
												</div>
												<span class="text-xs text-gray-600">
													{license.financial.milestonePayments.filter((m) => m.achieved).length}/
													{license.financial.milestonePayments.length} milestones
												</span>
											</div>
										</div>
									</div>
								{/if}
							{/each}
						</div>
					</div>
				</div>
			</div>
		{:else if activeTab === 'patents'}
			<!-- Patents Tab -->
			<div class="space-y-6">
				<!-- Tabs Navigation -->
				<div class="bg-white rounded-xl shadow-sm border p-4">
					<div class="flex gap-4 border-b pb-2">
						<button
							onclick={() => (activeTab = 'overview')}
							class="pb-2 px-1 text-sm font-medium text-gray-600 hover:text-gray-900"
						>
							← Back to Overview
						</button>
					</div>
				</div>

				<!-- Filters -->
				<div class="bg-white rounded-xl shadow-sm border p-4">
					<div class="flex items-center gap-4">
						<label class="flex items-center gap-2">
							<span class="text-sm text-gray-700">Type:</span>
							<select bind:value={filterType} class="text-sm border rounded px-3 py-1.5">
								<option value="all">All Types</option>
								<option value="drug">Drug</option>
								<option value="device">Device</option>
								<option value="method">Method</option>
								<option value="diagnostic">Diagnostic</option>
								<option value="software">Software</option>
								<option value="combination">Combination</option>
							</select>
						</label>
					</div>
				</div>

				<!-- Patents Grid -->
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{#each filteredPatents() as patent}
						{@const Icon = getTypeIcon(patent.innovation.type)}
						<div class="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
							<div class="p-6">
								<div class="flex items-start gap-3 mb-4">
									<div
										class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0"
									>
										<Icon class="w-6 h-6 text-purple-600" />
									</div>
									<div class="flex-1 min-w-0">
										<h3 class="font-semibold text-gray-900 mb-1">{patent.title}</h3>
										<p class="text-sm text-gray-600 line-clamp-2">{patent.abstract}</p>
									</div>
								</div>

								<div class="flex items-center gap-2 mb-4">
									<span class="text-xs px-2 py-1 rounded {getStatusColor(patent.filing.status)}">
										{patent.filing.status}
									</span>
									<span class="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
										{getTypeLabel(patent.innovation.type)}
									</span>
									{#if patent.inftTokenization}
										<span
											class="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded flex items-center gap-1"
										>
											<Unlock class="w-3 h-3" />
											INFT
										</span>
									{/if}
								</div>

								<div class="space-y-2 mb-4">
									<div class="flex justify-between text-sm">
										<span class="text-gray-600">Application Number</span>
										<span class="font-mono text-xs text-gray-900">{patent.applicationNumber}</span>
									</div>
									<div class="flex justify-between text-sm">
										<span class="text-gray-600">Inventors</span>
										<span class="text-gray-900">{patent.inventors.length}</span>
									</div>
									<div class="flex justify-between text-sm">
										<span class="text-gray-600">Claims</span>
										<span class="text-gray-900">{patent.claims.totalCount}</span>
									</div>
									{#if patent.priorArt.searchCompleted}
										<div class="flex justify-between text-sm">
											<span class="text-gray-600">Novelty Score</span>
											<span class="font-semibold text-green-600"
												>{patent.priorArt.noveltyScore}%</span
											>
										</div>
									{/if}
								</div>

								<div class="border-t pt-4">
									<div class="flex items-center justify-between mb-3">
										<span class="text-sm font-medium text-gray-700">Commercial Potential</span>
										<span class="text-lg font-bold text-gray-900">
											{formatCurrency(patent.commercial.valuationEstimate || 0)}
										</span>
									</div>
									<div class="grid grid-cols-2 gap-3 mb-3">
										<div class="bg-blue-50 rounded p-2">
											<p class="text-xs text-gray-600">Market Size</p>
											<p class="font-semibold text-blue-600">
												{formatCurrency(patent.commercial.marketSize)}
											</p>
										</div>
										<div class="bg-green-50 rounded p-2">
											<p class="text-xs text-gray-600">Licensing Interest</p>
											<p class="font-semibold text-green-600">
												{patent.commercial.licensingInterest} inquiries
											</p>
										</div>
									</div>
								</div>

								<button
									onclick={() => viewPatentDetails(patent)}
									class="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
								>
									View Details
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{:else if activeTab === 'drugs'}
			<!-- Drug Discovery Tab -->
			<div class="space-y-6">
				<!-- Tabs Navigation -->
				<div class="bg-white rounded-xl shadow-sm border p-4">
					<div class="flex gap-4 border-b pb-2">
						<button
							onclick={() => (activeTab = 'overview')}
							class="pb-2 px-1 text-sm font-medium text-gray-600 hover:text-gray-900"
						>
							← Back to Overview
						</button>
					</div>
				</div>

				<!-- Projects -->
				<div class="space-y-4">
					{#each filteredProjects() as project}
						<div class="bg-white rounded-xl shadow-sm border">
							<div class="p-6">
								<div class="flex items-start justify-between mb-4">
									<div class="flex-1">
										<h3 class="text-xl font-bold text-gray-900 mb-2">{project.title}</h3>
										<p class="text-gray-600 mb-3">{project.description}</p>
										<div class="flex items-center gap-3">
											<span class="text-sm px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
												{project.therapeuticArea.disease}
											</span>
											<span class="text-sm px-3 py-1 bg-purple-100 text-purple-800 rounded-full">
												{project.timeline.currentPhase}
											</span>
										</div>
									</div>
									<button
										onclick={() => viewProjectDetails(project)}
										class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
									>
										View Details
									</button>
								</div>

								<!-- Pipeline Statistics -->
								<div class="grid grid-cols-4 gap-4 mb-4">
									<div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
										<p class="text-sm text-gray-700 mb-1">Screened</p>
										<p class="text-2xl font-bold text-purple-600">
											{(project.compounds.totalScreened / 1000).toFixed(0)}K
										</p>
										<p class="text-xs text-gray-600 mt-1">compounds</p>
									</div>
									<div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
										<p class="text-sm text-gray-700 mb-1">Hits</p>
										<p class="text-2xl font-bold text-blue-600">
											{project.compounds.hits}
										</p>
										<p class="text-xs text-gray-600 mt-1">
											{((project.compounds.hits / project.compounds.totalScreened) * 100).toFixed(
												2
											)}% hit rate
										</p>
									</div>
									<div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
										<p class="text-sm text-gray-700 mb-1">Leads</p>
										<p class="text-2xl font-bold text-green-600">
											{project.compounds.leads}
										</p>
										<p class="text-xs text-gray-600 mt-1">optimized</p>
									</div>
									<div class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
										<p class="text-sm text-gray-700 mb-1">Candidates</p>
										<p class="text-2xl font-bold text-orange-600">
											{project.compounds.candidates}
										</p>
										<p class="text-xs text-gray-600 mt-1">selected</p>
									</div>
								</div>

								<!-- Milestones Progress -->
								<div class="border-t pt-4">
									<h4 class="font-medium text-gray-900 mb-3">Development Milestones</h4>
									<div class="space-y-2">
										{#each Object.entries(project.milestones) as [key, milestone]}
											<div class="flex items-center gap-3">
												{#if milestone.completed}
													<CheckCircle class="w-5 h-5 text-green-600" />
												{:else}
													<Clock class="w-5 h-5 text-gray-400" />
												{/if}
												<div class="flex-1">
													<span class="text-sm text-gray-900 capitalize">
														{key.replace(/([A-Z])/g, ' $1').trim()}
													</span>
													{#if milestone.date}
														<span class="text-xs text-gray-500 ml-2">
															{formatDate(milestone.date)}
														</span>
													{/if}
												</div>
											</div>
										{/each}
									</div>
								</div>

								<!-- Funding & Team -->
								<div class="grid grid-cols-2 gap-6 mt-4 pt-4 border-t">
									<div>
										<h4 class="font-medium text-gray-900 mb-2">Funding</h4>
										<div class="space-y-2">
											<div class="flex justify-between text-sm">
												<span class="text-gray-600">Total Budget</span>
												<span class="font-semibold text-gray-900">
													{formatCurrency(project.funding.totalBudget)}
												</span>
											</div>
											<div class="flex justify-between text-sm">
												<span class="text-gray-600">Spent</span>
												<span class="font-semibold text-gray-900">
													{formatCurrency(project.funding.spent)}
												</span>
											</div>
											{#if project.team.pharmaPartner}
												<div class="mt-2 p-2 bg-green-50 rounded">
													<p class="text-xs text-gray-600">Pharma Partner</p>
													<p class="font-semibold text-green-700">
														{project.team.pharmaPartner.companyName}
													</p>
													<p class="text-xs text-gray-600">
														{formatCurrency(project.team.pharmaPartner.funding)} funding
													</p>
												</div>
											{/if}
										</div>
									</div>
									<div>
										<h4 class="font-medium text-gray-900 mb-2">Collaboration</h4>
										<div class="space-y-1">
											<div class="text-sm">
												<span class="font-semibold text-gray-900">Lead:</span>
												<span class="text-gray-600 ml-1"
													>{project.team.leadInstitution.institutionName}</span
												>
											</div>
											<div class="text-sm">
												<span class="font-semibold text-gray-900">Partners:</span>
												<span class="text-gray-600 ml-1"
													>{project.team.collaborators.length} institutions</span
												>
											</div>
											{#if project.intellectualProperty.patents.length > 0}
												<div class="mt-2 p-2 bg-purple-50 rounded">
													<p class="text-xs text-gray-600">IP Portfolio</p>
													<p class="font-semibold text-purple-700">
														{project.intellectualProperty.patents.length} patents
													</p>
												</div>
											{/if}
										</div>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>

				<!-- Compounds Section -->
				<div class="bg-white rounded-xl shadow-sm border">
					<div class="p-6 border-b">
						<div class="flex items-center justify-between">
							<h2 class="text-lg font-semibold text-gray-900">Lead Compounds</h2>
							<select bind:value={filterStage} class="text-sm border rounded px-3 py-1.5">
								<option value="all">All Stages</option>
								<option value="discovery">Discovery</option>
								<option value="hit_validation">Hit Validation</option>
								<option value="lead_optimization">Lead Optimization</option>
								<option value="preclinical">Preclinical</option>
								<option value="clinical">Clinical</option>
							</select>
						</div>
					</div>
					<div class="p-6">
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							{#each filteredCompounds() as compound}
								<button
									onclick={() => viewCompoundDetails(compound)}
									class="text-left border rounded-lg p-4 hover:shadow-md transition-shadow"
								>
									<div class="flex items-start justify-between mb-2">
										<div>
											<p class="font-mono text-sm font-semibold text-gray-900">
												{compound.internalId}
											</p>
											<p class="text-xs text-gray-600">{compound.target.name}</p>
										</div>
										<span
											class="text-xs px-2 py-1 rounded {getStatusColor(compound.development.stage)}"
										>
											{getTypeLabel(compound.development.stage)}
										</span>
									</div>

									<div class="space-y-2 mb-3">
										<div class="flex justify-between text-xs">
											<span class="text-gray-600">Molecular Weight</span>
											<span class="font-mono text-gray-900"
												>{compound.structure.molecularWeight.toFixed(1)}</span
											>
										</div>
										<div class="flex justify-between text-xs">
											<span class="text-gray-600">QED Score</span>
											<span class="font-semibold text-gray-900"
												>{compound.properties.qed.toFixed(2)}</span
											>
										</div>
										{#if compound.screening.inVitro.length > 0}
											<div class="flex justify-between text-xs">
												<span class="text-gray-600">IC50</span>
												<span class="font-semibold text-green-600">
													{compound.screening.inVitro[0].ic50} nM
												</span>
											</div>
										{/if}
									</div>

									{#if compound.computeNetwork.gpuHoursUsed > 0}
										<div class="bg-blue-50 rounded p-2 text-xs">
											<span class="text-blue-700">
												0G Compute: {compound.computeNetwork.gpuHoursUsed} GPU hours
											</span>
										</div>
									{/if}
								</button>
							{/each}
						</div>
					</div>
				</div>
			</div>
		{:else if activeTab === 'licensing'}
			<!-- Licensing Tab -->
			<div class="space-y-6">
				<!-- Tabs Navigation -->
				<div class="bg-white rounded-xl shadow-sm border p-4">
					<div class="flex gap-4 border-b pb-2">
						<button
							onclick={() => (activeTab = 'overview')}
							class="pb-2 px-1 text-sm font-medium text-gray-600 hover:text-gray-900"
						>
							← Back to Overview
						</button>
					</div>
				</div>

				<!-- Revenue Analytics -->
				<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div class="bg-white rounded-xl shadow-sm border p-6">
						<div class="flex items-center justify-between mb-2">
							<DollarSign class="w-8 h-8 text-green-600" />
							<span class="text-2xl font-bold text-gray-900">
								{formatCurrency(totalRevenue())}
							</span>
						</div>
						<p class="text-sm text-gray-600">Total Revenue</p>
					</div>

					<div class="bg-white rounded-xl shadow-sm border p-6">
						<div class="flex items-center justify-between mb-2">
							<FileText class="w-8 h-8 text-blue-600" />
							<span class="text-2xl font-bold text-gray-900">{licenses.length}</span>
						</div>
						<p class="text-sm text-gray-600">Total Agreements</p>
					</div>

					<div class="bg-white rounded-xl shadow-sm border p-6">
						<div class="flex items-center justify-between mb-2">
							<TrendingUp class="w-8 h-8 text-purple-600" />
							<span class="text-2xl font-bold text-gray-900">{activeLicenses().length}</span>
						</div>
						<p class="text-sm text-gray-600">Active Licenses</p>
					</div>
				</div>

				<!-- Licensing Agreements -->
				<div class="space-y-4">
					{#each licenses as license}
						{@const patent = patents.find((p) => p.patentId === license.patentId)}
						{#if patent}
							<div class="bg-white rounded-xl shadow-sm border p-6">
								<div class="flex items-start justify-between mb-4">
									<div class="flex-1">
										<h3 class="font-semibold text-gray-900 mb-2">{patent.title}</h3>
										<div class="flex items-center gap-4 text-sm text-gray-600">
											<span class="flex items-center gap-1">
												<Building2 class="w-4 h-4" />
												{license.licensor.name}
											</span>
											<ArrowUpRight class="w-4 h-4" />
											<span class="flex items-center gap-1">
												<Building2 class="w-4 h-4" />
												{license.licensee.name}
											</span>
										</div>
									</div>
									<span
										class="text-xs px-3 py-1 rounded {getStatusColor(license.status)} capitalize"
									>
										{license.status}
									</span>
								</div>

								<div class="grid grid-cols-4 gap-4 mb-4">
									<div class="bg-blue-50 rounded p-3">
										<p class="text-xs text-gray-600">Upfront Fee</p>
										<p class="font-bold text-blue-600">
											{formatCurrency(license.financial.upfrontFee)}
										</p>
									</div>
									<div class="bg-green-50 rounded p-3">
										<p class="text-xs text-gray-600">Royalty Rate</p>
										<p class="font-bold text-green-600">
											{license.financial.royaltyRate}%
										</p>
									</div>
									<div class="bg-purple-50 rounded p-3">
										<p class="text-xs text-gray-600">Total Revenue</p>
										<p class="font-bold text-purple-600">
											{formatCurrency(license.financial.totalRevenueGenerated)}
										</p>
									</div>
									<div class="bg-orange-50 rounded p-3">
										<p class="text-xs text-gray-600">License Type</p>
										<p class="font-bold text-orange-600 capitalize">
											{license.terms.type}
										</p>
									</div>
								</div>

								<div class="border-t pt-4">
									<h4 class="font-medium text-gray-900 mb-3">Milestone Payments</h4>
									<div class="space-y-2">
										{#each license.financial.milestonePayments as milestone, idx}
											<div class="flex items-center gap-3">
												{#if milestone.achieved}
													<CheckCircle class="w-5 h-5 text-green-600" />
												{:else}
													<Clock class="w-5 h-5 text-gray-400" />
												{/if}
												<div class="flex-1">
													<div class="flex items-center justify-between">
														<span class="text-sm text-gray-900">{milestone.milestone}</span>
														<span class="font-semibold text-gray-900">
															{formatCurrency(milestone.amount)}
														</span>
													</div>
													{#if milestone.achievedDate}
														<p class="text-xs text-gray-500">
															Achieved {formatDate(milestone.achievedDate)}
														</p>
													{/if}
												</div>
											</div>
										{/each}
									</div>
								</div>

								<div class="mt-4 pt-4 border-t flex items-center justify-between">
									<div class="text-sm text-gray-600">
										<span>Duration: {license.terms.duration} years</span>
										<span class="mx-2">•</span>
										<span>Territory: {license.terms.territory.join(', ')}</span>
									</div>
									<div class="text-xs text-gray-500">
										Smart Contract: {license.blockchainProof.smartContractAddress.slice(0, 10)}...
									</div>
								</div>
							</div>
						{/if}
					{/each}
				</div>
			</div>
		{/if}

		<!-- Quick Action Tabs -->
		<div
			class="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-lg border px-2 py-2 flex gap-2"
		>
			<button
				onclick={() => (activeTab = 'overview')}
				class="px-6 py-2 rounded-full text-sm font-medium transition-colors {activeTab ===
				'overview'
					? 'bg-blue-600 text-white'
					: 'text-gray-700 hover:bg-gray-100'}"
			>
				Overview
			</button>
			<button
				onclick={() => (activeTab = 'patents')}
				class="px-6 py-2 rounded-full text-sm font-medium transition-colors {activeTab === 'patents'
					? 'bg-blue-600 text-white'
					: 'text-gray-700 hover:bg-gray-100'}"
			>
				Patents
			</button>
			<button
				onclick={() => (activeTab = 'drugs')}
				class="px-6 py-2 rounded-full text-sm font-medium transition-colors {activeTab === 'drugs'
					? 'bg-blue-600 text-white'
					: 'text-gray-700 hover:bg-gray-100'}"
			>
				Drug Discovery
			</button>
			<button
				onclick={() => (activeTab = 'licensing')}
				class="px-6 py-2 rounded-full text-sm font-medium transition-colors {activeTab ===
				'licensing'
					? 'bg-blue-600 text-white'
					: 'text-gray-700 hover:bg-gray-100'}"
			>
				Licensing
			</button>
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

	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
