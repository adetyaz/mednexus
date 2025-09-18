<script lang="ts">
	import { onMount } from 'svelte';
	import type {
		DashboardMetrics,
		AIInsight,
		CaseProcessingStatus,
		DashboardNotification
	} from '$lib/services/diagnosticMetricsService';
	import { diagnosticMetricsService } from '$lib/services/diagnosticMetricsService';

	// Component props
	interface Props {
		showPerformanceCharts?: boolean;
		compactView?: boolean;
	}

	let { showPerformanceCharts = true, compactView = false }: Props = $props();

	// Dashboard state
	let metrics = $state<DashboardMetrics | null>(null);
	let insights = $state<AIInsight[]>([]);
	let notifications = $state<DashboardNotification[]>([]);
	let processingCases = $state<CaseProcessingStatus[]>([]);
	let performanceData = $state<any>(null);
	let featureUtilization = $state<any>(null);
	let isLoading = $state(true);

	// Real-time updates
	let unsubscribeUpdates: (() => void) | null = null;
	let lastUpdateTime = $state(new Date());

	onMount(() => {
		loadDashboardData();

		// Subscribe to real-time updates
		unsubscribeUpdates = diagnosticMetricsService.subscribeToUpdates((update) => {
			handleRealtimeUpdate(update);
			lastUpdateTime = new Date();
		});

		// Auto-refresh every minute
		const refreshInterval = setInterval(() => {
			loadDashboardData();
		}, 60000);

		return () => {
			if (unsubscribeUpdates) {
				unsubscribeUpdates();
			}
			clearInterval(refreshInterval);
		};
	});

	async function loadDashboardData() {
		try {
			isLoading = true;

			// Load all dashboard data in parallel
			const [
				metricsData,
				insightsData,
				notificationsData,
				processingData,
				performanceAnalytics,
				utilizationData
			] = await Promise.all([
				diagnosticMetricsService.getDashboardMetrics(),
				diagnosticMetricsService.getAIInsights(15),
				diagnosticMetricsService.getNotifications(false),
				diagnosticMetricsService.getActiveProcessingStatuses(),
				showPerformanceCharts ? diagnosticMetricsService.getPerformanceAnalytics() : null,
				diagnosticMetricsService.getFeatureUtilization()
			]);

			metrics = metricsData;
			insights = insightsData;
			notifications = notificationsData.slice(0, 10); // Latest 10
			processingCases = processingData;
			performanceData = performanceAnalytics;
			featureUtilization = utilizationData;
		} catch (error) {
			console.error('Failed to load dashboard data:', error);
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
				insights = [update.data, ...insights].slice(0, 15);
				break;
			case 'notification_added':
				notifications = [update.data, ...notifications].slice(0, 10);
				break;
			case 'case_processing':
			case 'case_completed':
				loadDashboardData(); // Refresh processing data
				break;
		}
	}

	async function markNotificationRead(notificationId: string) {
		await diagnosticMetricsService.markNotificationAsRead(notificationId);
		notifications = notifications.map((n) => (n.id === notificationId ? { ...n, read: true } : n));
	}

	function getPriorityClass(priority: string) {
		switch (priority) {
			case 'critical':
				return 'border-l-red-500 bg-red-50 text-red-900';
			case 'high':
				return 'border-l-orange-500 bg-orange-50 text-orange-900';
			case 'medium':
				return 'border-l-yellow-500 bg-yellow-50 text-yellow-900';
			case 'low':
				return 'border-l-blue-500 bg-blue-50 text-blue-900';
			default:
				return 'border-l-gray-500 bg-gray-50 text-gray-900';
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

	function getNotificationTypeClass(type: string) {
		switch (type) {
			case 'error':
				return 'bg-red-100 text-red-800';
			case 'warning':
				return 'bg-yellow-100 text-yellow-800';
			case 'success':
				return 'bg-green-100 text-green-800';
			case 'info':
				return 'bg-blue-100 text-blue-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}
</script>

<div class="space-y-6">
	<!-- Real-time Status Header -->
	<div class="flex items-center justify-between">
		<div>
			<h2
				class={compactView ? 'text-xl font-bold text-gray-900' : 'text-2xl font-bold text-gray-900'}
			>
				AI Dashboard
			</h2>
			<p class="text-gray-600 text-sm">
				Real-time medical AI insights • Last updated: {lastUpdateTime.toLocaleTimeString()}
				<span class="inline-block w-2 h-2 bg-green-500 rounded-full ml-2 animate-pulse"></span>
			</p>
		</div>

		{#if isLoading}
			<div class="flex items-center text-gray-600">
				<div
					class="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent mr-2"
				></div>
				Loading...
			</div>
		{/if}
	</div>

	<!-- Metrics Grid -->
	{#if metrics}
		<div
			class={`grid ${compactView ? 'grid-cols-2 md:grid-cols-4 gap-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'}`}
		>
			<div class="bg-white p-4 rounded-xl shadow-sm border">
				<div class="flex items-center">
					<div class="p-2 bg-blue-100 rounded-lg">
						<span class="text-xl">📊</span>
					</div>
					<div class="ml-3">
						<p class="text-sm font-medium text-gray-600">Total Cases</p>
						<p class={`${compactView ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>
							{metrics.totalCases.toLocaleString()}
						</p>
					</div>
				</div>
			</div>

			<div class="bg-white p-4 rounded-xl shadow-sm border">
				<div class="flex items-center">
					<div class="p-2 bg-green-100 rounded-lg">
						<span class="text-xl">🎯</span>
					</div>
					<div class="ml-3">
						<p class="text-sm font-medium text-gray-600">AI Accuracy</p>
						<p class={`${compactView ? 'text-xl' : 'text-2xl'} font-bold text-green-600`}>
							{metrics.aiAccuracy.toFixed(1)}%
						</p>
					</div>
				</div>
			</div>

			<div class="bg-white p-4 rounded-xl shadow-sm border">
				<div class="flex items-center">
					<div class="p-2 bg-purple-100 rounded-lg">
						<span class="text-xl">⚡</span>
					</div>
					<div class="ml-3">
						<p class="text-sm font-medium text-gray-600">Active Cases</p>
						<p class={`${compactView ? 'text-xl' : 'text-2xl'} font-bold text-purple-600`}>
							{metrics.activeCases}
						</p>
					</div>
				</div>
			</div>

			<div class="bg-white p-4 rounded-xl shadow-sm border">
				<div class="flex items-center">
					<div class="p-2 bg-orange-100 rounded-lg">
						<span class="text-xl">🌍</span>
					</div>
					<div class="ml-3">
						<p class="text-sm font-medium text-gray-600">Global Consultations</p>
						<p class={`${compactView ? 'text-xl' : 'text-2xl'} font-bold text-orange-600`}>
							{metrics.globalConsultations}
						</p>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Performance Indicators -->
	{#if metrics}
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<div class="bg-white p-4 rounded-xl shadow-sm border">
				<h3 class="font-semibold text-gray-900 mb-3">Processing Performance</h3>
				<div class="space-y-3">
					<div class="flex justify-between items-center">
						<span class="text-sm text-gray-600">Avg Processing Time</span>
						<span class="font-medium">{metrics.averageProcessingTime.toFixed(1)}min</span>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-sm text-gray-600">Cases Processed Today</span>
						<span class="font-medium">{metrics.casesProcessedToday}</span>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-sm text-gray-600">System Load</span>
						<div class="flex items-center gap-2">
							<div class="w-16 bg-gray-200 rounded-full h-2">
								<div
									class={`h-2 rounded-full ${metrics.systemLoad > 80 ? 'bg-red-500' : metrics.systemLoad > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
									style="width: {Math.min(metrics.systemLoad, 100)}%"
								></div>
							</div>
							<span class="text-sm font-medium">{metrics.systemLoad.toFixed(0)}%</span>
						</div>
					</div>
				</div>
			</div>

			<div class="bg-white p-4 rounded-xl shadow-sm border">
				<h3 class="font-semibold text-gray-900 mb-3">Consultation Activity</h3>
				<div class="space-y-3">
					<div class="flex justify-between items-center">
						<span class="text-sm text-gray-600">Active Consultations</span>
						<span class="font-medium text-blue-600">{metrics.activeConsultations}</span>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-sm text-gray-600">Total Consultations</span>
						<span class="font-medium">{metrics.globalConsultations}</span>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-sm text-gray-600">System Uptime</span>
						<span class="font-medium text-green-600">{metrics.uptime.toFixed(1)}h</span>
					</div>
				</div>
			</div>

			<div class="bg-white p-4 rounded-xl shadow-sm border">
				<h3 class="font-semibold text-gray-900 mb-3">Feature Utilization</h3>
				{#if featureUtilization}
					<div class="space-y-2">
						<div class="flex justify-between items-center">
							<span class="text-xs text-gray-600">Similar Case Matching</span>
							<span class="text-xs font-medium">{featureUtilization.similarCaseMatching}%</span>
						</div>
						<div class="w-full bg-gray-200 rounded-full h-1.5">
							<div
								class="bg-blue-500 h-1.5 rounded-full"
								style="width: {featureUtilization.similarCaseMatching}%"
							></div>
						</div>

						<div class="flex justify-between items-center">
							<span class="text-xs text-gray-600">Pattern Recognition</span>
							<span class="text-xs font-medium">{featureUtilization.patternRecognition}%</span>
						</div>
						<div class="w-full bg-gray-200 rounded-full h-1.5">
							<div
								class="bg-green-500 h-1.5 rounded-full"
								style="width: {featureUtilization.patternRecognition}%"
							></div>
						</div>

						<div class="flex justify-between items-center">
							<span class="text-xs text-gray-600">Cross-Border Consultations</span>
							<span class="text-xs font-medium">{featureUtilization.crossBorderConsultations}%</span
							>
						</div>
						<div class="w-full bg-gray-200 rounded-full h-1.5">
							<div
								class="bg-purple-500 h-1.5 rounded-full"
								style="width: {featureUtilization.crossBorderConsultations}%"
							></div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Active Processing & Insights Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Active Processing Cases -->
		<div class="bg-white rounded-xl shadow-sm border p-4">
			<h3 class="font-semibold text-gray-900 mb-4">Active Processing Cases</h3>

			{#if processingCases.length === 0}
				<div class="text-center py-6">
					<span class="text-3xl mb-2 block">⚡</span>
					<p class="text-gray-500 text-sm">No cases currently processing</p>
				</div>
			{:else}
				<div class="space-y-3 max-h-64 overflow-y-auto">
					{#each processingCases as caseStatus}
						<div class="border rounded-lg p-3 bg-gray-50">
							<div class="flex items-center justify-between mb-2">
								<div class="flex items-center gap-2">
									<div
										class={`w-2 h-2 rounded-full ${
											caseStatus.status === 'processing'
												? 'bg-blue-500 animate-pulse'
												: caseStatus.status === 'queued'
													? 'bg-yellow-500'
													: caseStatus.status === 'completed'
														? 'bg-green-500'
														: 'bg-red-500'
										}`}
									></div>
									<span class="font-medium text-sm">{caseStatus.caseId}</span>
								</div>
								<span class="text-xs text-gray-500 capitalize">{caseStatus.status}</span>
							</div>

							<div class="w-full bg-gray-200 rounded-full h-1.5 mb-2">
								<div
									class="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
									style="width: {caseStatus.progress}%"
								></div>
							</div>

							<div class="flex justify-between text-xs text-gray-600">
								<span>{caseStatus.progress}%</span>
								<span>P: {caseStatus.patternsDetected} | S: {caseStatus.similarCasesFound}</span>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Latest AI Insights -->
		<div class="bg-white rounded-xl shadow-sm border p-4">
			<h3 class="font-semibold text-gray-900 mb-4">Latest AI Insights</h3>

			{#if insights.length === 0}
				<div class="text-center py-6">
					<span class="text-3xl mb-2 block">💡</span>
					<p class="text-gray-500 text-sm">No insights available</p>
				</div>
			{:else}
				<div class="space-y-3 max-h-64 overflow-y-auto">
					{#each insights.slice(0, 6) as insight}
						<div class={`border-l-4 pl-3 py-2 rounded-r-lg ${getPriorityClass(insight.priority)}`}>
							<div class="flex items-start gap-2">
								<span class="text-lg">{getInsightTypeIcon(insight.type)}</span>
								<div class="flex-1 min-w-0">
									<p class="font-medium text-sm line-clamp-1">{insight.title}</p>
									<p class="text-xs opacity-80 line-clamp-2 mt-1">{insight.description}</p>
									<div class="flex items-center gap-2 mt-1 text-xs opacity-70">
										<span>{insight.confidence}%</span>
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

	<!-- Notifications Section -->
	{#if notifications.length > 0}
		<div class="bg-white rounded-xl shadow-sm border p-4">
			<h3 class="font-semibold text-gray-900 mb-4">System Notifications</h3>

			<div class="space-y-2 max-h-48 overflow-y-auto">
				{#each notifications.slice(0, 8) as notification}
					<div
						class={`flex items-start gap-3 p-3 rounded-lg ${notification.read ? 'bg-gray-50' : 'bg-blue-50 border border-blue-200'}`}
					>
						<div
							class={`px-2 py-1 rounded text-xs font-medium ${getNotificationTypeClass(notification.type)}`}
						>
							{notification.type}
						</div>
						<div class="flex-1 min-w-0">
							<p
								class={`text-sm ${notification.read ? 'text-gray-700' : 'font-medium text-gray-900'}`}
							>
								{notification.title}
							</p>
							<p class="text-xs text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
							<div class="flex items-center gap-2 mt-2">
								<span class="text-xs text-gray-500"
									>{notification.timestamp.toLocaleTimeString()}</span
								>
								{#if !notification.read}
									<button
										onclick={() => markNotificationRead(notification.id)}
										class="text-xs text-blue-600 hover:text-blue-700 font-medium"
									>
										Mark Read
									</button>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
