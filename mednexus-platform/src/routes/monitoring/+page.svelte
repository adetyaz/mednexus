<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		systemMetrics,
		usageAnalytics,
		securityMetrics,
		monitoringService
	} from '$lib/services/monitoring';

	let refreshInterval: NodeJS.Timeout;
	let isLoading = true;

	onMount(async () => {
		// Initialize monitoring
		await monitoringService.initializeMonitoring();
		isLoading = false;

		// Auto-refresh every minute
		refreshInterval = setInterval(async () => {
			// Monitoring service handles automatic updates
		}, 60000);
	});

	onDestroy(() => {
		if (refreshInterval) {
			clearInterval(refreshInterval);
		}
	});

	async function generateReport() {
		const report = await monitoringService.generateReport();
		console.log(report);

		// Download report as file
		const blob = new Blob([report], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `mednexus-report-${new Date().toISOString().split('T')[0]}.txt`;
		a.click();
		URL.revokeObjectURL(url);
	}

	// Format currency
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount);
	}

	// Format percentage
	function formatPercentage(value: number): string {
		return `${value.toFixed(2)}%`;
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
	<div class="mx-auto max-w-7xl">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-900">MedNexus Production Monitoring</h1>
			<p class="mt-2 text-gray-600">Real-time system performance and analytics dashboard</p>

			<div class="mt-4 flex gap-4">
				<button
					on:click={generateReport}
					class="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					Generate Report
				</button>

				<div class="flex items-center gap-2">
					<div class="h-3 w-3 rounded-full bg-green-500"></div>
					<span class="text-sm text-gray-600">All Systems Operational</span>
				</div>
			</div>
		</div>

		{#if isLoading}
			<div class="flex items-center justify-center py-12">
				<div class="text-center">
					<div
						class="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
					></div>
					<p class="mt-2 text-gray-600">Loading monitoring data...</p>
				</div>
			</div>
		{:else}
			<!-- System Metrics Grid -->
			<div class="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
				<!-- Total Transactions -->
				<div class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<div class="rounded-md bg-blue-500 p-3">
								<svg
									class="h-6 w-6 text-white"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
									/>
								</svg>
							</div>
						</div>
						<div class="ml-4">
							<p class="text-sm font-medium text-gray-500">Total Transactions</p>
							<p class="text-2xl font-semibold text-gray-900">
								{$systemMetrics.totalTransactions.toLocaleString()}
							</p>
						</div>
					</div>
				</div>

				<!-- Active Users -->
				<div class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<div class="rounded-md bg-green-500 p-3">
								<svg
									class="h-6 w-6 text-white"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
									/>
								</svg>
							</div>
						</div>
						<div class="ml-4">
							<p class="text-sm font-medium text-gray-500">Active Users</p>
							<p class="text-2xl font-semibold text-gray-900">{$systemMetrics.activeUsers}</p>
						</div>
					</div>
				</div>

				<!-- Cross-Border Consultations -->
				<div class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<div class="rounded-md bg-purple-500 p-3">
								<svg
									class="h-6 w-6 text-white"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"
									/>
								</svg>
							</div>
						</div>
						<div class="ml-4">
							<p class="text-sm font-medium text-gray-500">Cross-Border Consultations</p>
							<p class="text-2xl font-semibold text-gray-900">
								{$systemMetrics.crossBorderConsultations}
							</p>
						</div>
					</div>
				</div>

				<!-- INFT Revenue -->
				<div class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<div class="rounded-md bg-yellow-500 p-3">
								<svg
									class="h-6 w-6 text-white"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
									/>
								</svg>
							</div>
						</div>
						<div class="ml-4">
							<p class="text-sm font-medium text-gray-500">INFT Revenue</p>
							<p class="text-2xl font-semibold text-gray-900">
								{formatCurrency($systemMetrics.inftRevenue)}
							</p>
						</div>
					</div>
				</div>
			</div>

			<!-- System Status Cards -->
			<div class="mb-8 grid gap-6 lg:grid-cols-2">
				<!-- System Health -->
				<div class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">System Health</h3>

					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600">System Uptime</span>
							<div class="flex items-center gap-2">
								<div class="h-2 w-20 bg-gray-200 rounded-full">
									<div
										class="h-2 bg-green-500 rounded-full transition-all duration-300"
										style="width: {$systemMetrics.systemUptime}%"
									></div>
								</div>
								<span class="text-sm font-medium"
									>{formatPercentage($systemMetrics.systemUptime)}</span
								>
							</div>
						</div>

						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600">Average Response Time</span>
							<span class="text-sm font-medium"
								>{$systemMetrics.averageResponseTime.toFixed(0)}ms</span
							>
						</div>

						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600">Data Encryption</span>
							<span class="flex items-center gap-1">
								<div class="h-2 w-2 bg-green-500 rounded-full"></div>
								<span class="text-sm font-medium text-green-600"
									>{$securityMetrics.dataEncryptionStatus}</span
								>
							</span>
						</div>
					</div>
				</div>

				<!-- Security Status -->
				<div class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">Security Status</h3>

					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600">Compliance Score</span>
							<div class="flex items-center gap-2">
								<div class="h-2 w-20 bg-gray-200 rounded-full">
									<div
										class="h-2 bg-green-500 rounded-full transition-all duration-300"
										style="width: {$securityMetrics.complianceScore}%"
									></div>
								</div>
								<span class="text-sm font-medium">{$securityMetrics.complianceScore}%</span>
							</div>
						</div>

						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600">Failed Login Attempts</span>
							<span class="text-sm font-medium">{$securityMetrics.failedLoginAttempts}</span>
						</div>

						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600">Blocked Transactions</span>
							<span class="text-sm font-medium">{$securityMetrics.blockedTransactions}</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Usage Analytics -->
			<div class="mb-8 grid gap-6 lg:grid-cols-2">
				<!-- User Analytics -->
				<div class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">User Analytics</h3>

					<div class="space-y-3">
						<div class="flex justify-between">
							<span class="text-sm text-gray-600">Daily Active Users</span>
							<span class="text-sm font-medium">{$usageAnalytics.dailyActiveUsers}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-sm text-gray-600">Weekly Active Users</span>
							<span class="text-sm font-medium">{$usageAnalytics.weeklyActiveUsers}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-sm text-gray-600">Monthly Active Users</span>
							<span class="text-sm font-medium">{$usageAnalytics.monthlyActiveUsers}</span>
						</div>
					</div>
				</div>

				<!-- Top Specialties -->
				<div class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">Top Medical Specialties</h3>

					<div class="space-y-3">
						{#each $usageAnalytics.topSpecialties as specialty}
							<div class="flex items-center justify-between">
								<span class="text-sm text-gray-600">{specialty.name}</span>
								<div class="flex items-center gap-2">
									<div class="h-2 w-16 bg-gray-200 rounded-full">
										<div
											class="h-2 bg-blue-500 rounded-full transition-all duration-300"
											style="width: {(specialty.usage / 40) * 100}%"
										></div>
									</div>
									<span class="text-sm font-medium">{specialty.usage}%</span>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<!-- Regional Distribution -->
			<div class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">Regional Distribution</h3>

				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{#each $usageAnalytics.regionalDistribution as region}
						<div class="text-center">
							<div class="text-2xl font-bold text-blue-600">{region.percentage}%</div>
							<div class="text-sm text-gray-600">{region.region}</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>
