<script lang="ts">
	import { onMount } from 'svelte';
	import { accessControl } from '$lib/services/accessControl';
	import type {
		DoctorDashboardData,
		DocumentSummary,
		Task,
		Consultation
	} from '$lib/types/dashboard';
	import { walletStore } from '$lib/wallet';
	import StatsCard from '$lib/components/dashboard/StatsCard.svelte';
	import DocumentList from '$lib/components/dashboard/DocumentList.svelte';
	import TaskList from '$lib/components/dashboard/TaskList.svelte';
	import ConsultationRequests from '$lib/components/dashboard/ConsultationRequests.svelte';
	import ActivityFeed from '$lib/components/dashboard/ActivityFeed.svelte';

	let dashboardData = $state<DoctorDashboardData | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	let user = $derived(accessControl.getCurrentUser());

	onMount(async () => {
		try {
			if (!$walletStore.isConnected || !$walletStore.address) {
				throw new Error('Please connect your wallet to access the dashboard');
			}

			await accessControl.setCurrentUser($walletStore.address);
			await loadDashboardData();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load dashboard';
			console.error('Dashboard error:', err);
		} finally {
			loading = false;
		}
	});

	async function loadDashboardData(): Promise<void> {
		try {
			// In a real implementation, this would fetch data from blockchain/API
			// For now, we'll generate mock data based on user role
			const currentUser = accessControl.getCurrentUser();
			if (!currentUser) throw new Error('User not authenticated');

			dashboardData = await generateMockDashboardData(currentUser);
		} catch (err) {
			console.error('Failed to load dashboard data:', err);
			throw err;
		}
	}

	async function generateMockDashboardData(user: any): Promise<DoctorDashboardData> {
		// Mock data generation - replace with actual API calls
		const recentDocuments: DocumentSummary[] = [
			{
				id: 'doc_001',
				name: 'Patient Record - John Doe',
				type: 'Medical Record',
				uploadDate: new Date(Date.now() - 86400000), // 1 day ago
				status: 'active',
				size: '2.3 MB'
			},
			{
				id: 'doc_002',
				name: 'Lab Results - Jane Smith',
				type: 'Lab Report',
				uploadDate: new Date(Date.now() - 172800000), // 2 days ago
				status: 'shared',
				size: '1.8 MB'
			},
			{
				id: 'doc_003',
				name: 'X-Ray Report - Bob Johnson',
				type: 'Imaging',
				uploadDate: new Date(Date.now() - 259200000), // 3 days ago
				status: 'active',
				size: '5.2 MB'
			}
		];

		const pendingTasks: Task[] = [
			{
				id: 'task_001',
				title: 'Review Lab Results',
				description: 'Review and approve lab results for patient Jane Smith',
				priority: 'high',
				dueDate: new Date(Date.now() + 86400000), // Tomorrow
				status: 'pending'
			},
			{
				id: 'task_002',
				title: 'Update Patient Notes',
				description: 'Update treatment notes for patient John Doe',
				priority: 'medium',
				dueDate: new Date(Date.now() + 172800000), // 2 days
				status: 'in-progress'
			}
		];

		const consultations: Consultation[] = [
			{
				id: 'cons_001',
				patientId: 'pat_001',
				specialty: 'Cardiology',
				status: 'requested',
				requestedDate: new Date(Date.now() - 3600000), // 1 hour ago
				doctorName: 'Dr. Sarah Wilson'
			},
			{
				id: 'cons_002',
				patientId: 'pat_002',
				specialty: 'Neurology',
				status: 'active',
				requestedDate: new Date(Date.now() - 7200000), // 2 hours ago
				doctorName: 'Dr. Michael Chen'
			}
		];

		return {
			user,
			stats: {
				totalDocuments: 45,
				documentsThisMonth: 12,
				sharedDocuments: 8,
				pendingApprovals: 3,
				storageUsed: '156 MB',
				storageLimit: '1 GB'
			},
			recentDocuments,
			pendingTasks,
			consultations,
			departmentActivity: [
				{
					id: 'act_001',
					type: 'upload',
					description: 'Uploaded patient record for John Doe',
					timestamp: new Date(Date.now() - 3600000),
					user: 'Dr. Emily Davis'
				},
				{
					id: 'act_002',
					type: 'share',
					description: 'Shared lab results with cardiology department',
					timestamp: new Date(Date.now() - 7200000),
					user: 'Dr. Michael Chen'
				}
			]
		};
	}

	function refreshDashboard(): void {
		loading = true;
		error = null;
		loadDashboardData().finally(() => (loading = false));
	}
</script>

<svelte:head>
	<title>Doctor Dashboard - MedNexus</title>
</svelte:head>

<div class="doctor-dashboard">
	{#if loading}
		<div class="loading-container">
			<div class="loading-spinner"></div>
			<p>Loading your dashboard...</p>
		</div>
	{:else if error}
		<div class="error-container">
			<div class="error-message">
				<h3>Error Loading Dashboard</h3>
				<p>{error}</p>
				<button class="btn btn-primary" on:click={refreshDashboard}> Try Again </button>
			</div>
		</div>
	{:else if dashboardData}
		<!-- Header -->
		<div class="dashboard-header">
			<div class="header-content">
				<h1>Welcome back, {dashboardData.user.profile.name}!</h1>
				<p class="role-badge">{dashboardData.user.role.name}</p>
				<p class="last-login">Last login: {dashboardData.user.lastLogin.toLocaleDateString()}</p>
			</div>
			<div class="header-actions">
				<button class="btn btn-outline" on:click={refreshDashboard}>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
						<path d="M21 3v5h-5" />
						<path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
						<path d="M8 16H3v5" />
					</svg>
					Refresh
				</button>
			</div>
		</div>

		<!-- Stats Overview -->
		<div class="stats-grid">
			<StatsCard
				title="Total Documents"
				value={dashboardData.stats.totalDocuments.toString()}
				change="+12%"
				changeType="positive"
				icon="document"
			/>
			<StatsCard
				title="This Month"
				value={dashboardData.stats.documentsThisMonth.toString()}
				change="+8%"
				changeType="positive"
				icon="upload"
			/>
			<StatsCard
				title="Shared Documents"
				value={dashboardData.stats.sharedDocuments.toString()}
				change="+15%"
				changeType="positive"
				icon="share"
			/>
			<StatsCard
				title="Pending Approvals"
				value={dashboardData.stats.pendingApprovals.toString()}
				change="2 urgent"
				changeType="warning"
				icon="clock"
			/>
		</div>

		<!-- Main Content Grid -->
		<div class="dashboard-grid">
			<!-- Recent Documents -->
			<div class="dashboard-section">
				<div class="section-header">
					<h2>Recent Documents</h2>
					<a href="/storage" class="view-all-link">View All</a>
				</div>
				<DocumentList documents={dashboardData.recentDocuments} />
			</div>

			<!-- Pending Tasks -->
			<div class="dashboard-section">
				<div class="section-header">
					<h2>Pending Tasks</h2>
					<button class="btn btn-sm btn-outline">View All</button>
				</div>
				<TaskList tasks={dashboardData.pendingTasks} />
			</div>

			<!-- Consultation Requests -->
			<div class="dashboard-section">
				<div class="section-header">
					<h2>Consultation Requests</h2>
					<button class="btn btn-sm btn-outline">Manage</button>
				</div>
				<ConsultationRequests consultations={dashboardData.consultations} />
			</div>

			<!-- Department Activity -->
			<div class="dashboard-section">
				<div class="section-header">
					<h2>Department Activity</h2>
					<button class="btn btn-sm btn-outline">View Timeline</button>
				</div>
				<ActivityFeed activities={dashboardData.departmentActivity} />
			</div>
		</div>
	{:else}
		<div class="no-data">
			<h3>No Dashboard Data Available</h3>
			<p>Please ensure your wallet is connected and try refreshing the page.</p>
		</div>
	{/if}
</div>

<style>
	.doctor-dashboard {
		padding: 2rem;
		max-width: 1400px;
		margin: 0 auto;
		background: #f8fafc;
		min-height: 100vh;
	}

	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 60vh;
		gap: 1rem;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #e2e8f0;
		border-top: 4px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.error-container {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 60vh;
	}

	.error-message {
		background: white;
		padding: 2rem;
		border-radius: 12px;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		text-align: center;
		max-width: 400px;
	}

	.dashboard-header {
		background: white;
		padding: 2rem;
		border-radius: 12px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.header-content h1 {
		margin: 0 0 0.5rem 0;
		font-size: 2rem;
		font-weight: 700;
		color: #1f2937;
	}

	.role-badge {
		background: #dbeafe;
		color: #1d4ed8;
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.875rem;
		font-weight: 500;
		display: inline-block;
		margin-bottom: 0.5rem;
	}

	.last-login {
		color: #6b7280;
		font-size: 0.875rem;
		margin: 0;
	}

	.header-actions .btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.dashboard-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
	}

	.dashboard-section {
		background: white;
		border-radius: 12px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.section-header {
		padding: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.section-header h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #1f2937;
	}

	.view-all-link {
		color: #3b82f6;
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.view-all-link:hover {
		text-decoration: underline;
	}

	.btn {
		padding: 0.5rem 1rem;
		border-radius: 8px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.btn-primary {
		background: #3b82f6;
		color: white;
	}

	.btn-primary:hover {
		background: #2563eb;
	}

	.btn-outline {
		background: white;
		color: #374151;
		border: 1px solid #d1d5db;
	}

	.btn-outline:hover {
		background: #f9fafb;
		border-color: #9ca3af;
	}

	.btn-sm {
		padding: 0.375rem 0.75rem;
		font-size: 0.875rem;
	}

	.no-data {
		text-align: center;
		padding: 4rem 2rem;
		background: white;
		border-radius: 12px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.no-data h3 {
		color: #1f2937;
		margin-bottom: 0.5rem;
	}

	.no-data p {
		color: #6b7280;
	}

	@media (max-width: 1024px) {
		.dashboard-grid {
			grid-template-columns: 1fr;
		}

		.dashboard-header {
			flex-direction: column;
			gap: 1rem;
			text-align: center;
		}
	}

	@media (max-width: 768px) {
		.doctor-dashboard {
			padding: 1rem;
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}

		.dashboard-header {
			padding: 1.5rem;
		}

		.header-content h1 {
			font-size: 1.5rem;
		}
	}
</style>
