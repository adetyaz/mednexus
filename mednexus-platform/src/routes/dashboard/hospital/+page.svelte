<script lang="ts">
	import { onMount } from 'svelte';
	import type {
		HospitalDashboardData,
		DepartmentSummary,
		StaffSummary,
		Activity
	} from '$lib/types/dashboard';
	import { walletStore } from '$lib/wallet';
	import StatsCard from '$lib/components/dashboard/StatsCard.svelte';
	import DepartmentOverview from '$lib/components/dashboard/DepartmentOverview.svelte';
	import DepartmentManagement from '$lib/components/dashboard/DepartmentManagement.svelte';
	import StaffManagement from '$lib/components/dashboard/StaffManagement.svelte';
	import ActivityFeed from '$lib/components/dashboard/ActivityFeed.svelte';
	import DocumentList from '$lib/components/dashboard/DocumentList.svelte';
	import ComplianceStatus from '$lib/components/dashboard/ComplianceStatus.svelte';
	import {
		medicalInstitutionService,
		type Department
	} from '$lib/services/medicalInstitutionService';
	import { supabase } from '$lib/supabase';

	let dashboardData = $state<HospitalDashboardData | null>(null);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let showDepartmentModal = $state(false);
	let currentInstitutionId = $state<string>('');
	let currentInstitutionDepartments = $state<Department[]>([]);

	onMount(() => {
		loadDashboardData();
	});

	async function loadDashboardData(): Promise<void> {
		try {
			const walletAddress = $walletStore.address;
			if (!walletAddress) {
				error = 'Please connect your wallet';
				isLoading = false;
				return;
			}

			// Load institution data from Supabase
			const { data: institutions, error: instError } = (await supabase
				.from('medical_institutions')
				.select('*')
				.eq('wallet_address', walletAddress)
				.single()) as { data: any; error: any };

			if (instError || !institutions) {
				error =
					'No institution found for this wallet address. Please ensure your wallet is registered with an institution.';
				isLoading = false;
				return;
			}

			currentInstitutionId = institutions.id;

			// Parse departments from JSON
			let departments = institutions.departments || [];

			// Handle different department formats
			if (typeof departments === 'string') {
				try {
					departments = JSON.parse(departments);
				} catch {
					departments = [];
				}
			}

			// Ensure departments is an array
			if (!Array.isArray(departments)) {
				departments = [];
			}

			currentInstitutionDepartments = departments.map((dept: any) => ({
				departmentId: dept.id || dept.departmentId || `dept_${Date.now()}_${Math.random()}`,
				name: typeof dept === 'string' ? dept : dept.name || 'Unknown Department',
				headOfDepartment: dept.head || dept.headOfDepartment,
				specialties: Array.isArray(dept.specialties) ? dept.specialties : [],
				doctorCount: 0
			}));

			// TODO: Load doctors when the relationship is properly defined
			const doctors: any[] = [];

			dashboardData = {
				user: {
					walletAddress,
					role: {
						id: 'admin',
						name: 'Hospital Admin',
						description: 'Hospital Administrator',
						permissions: [],
						level: 5
					},
					institutionId: institutions.name,
					lastLogin: new Date(),
					profile: {
						name: institutions.name,
						email: institutions.email || '',
						licenseNumber: institutions.license_number || ''
					},
					isActive: true
				},
				stats: {
					totalDocuments: 0,
					documentsThisMonth: 0,
					sharedDocuments: 0,
					pendingApprovals: 0,
					storageUsed: '0 GB',
					storageLimit: '10 GB',
					totalStaff: doctors?.length || 0,
					activeDepartments: currentInstitutionDepartments.length,
					totalPatients: 0,
					complianceScore: 100
				},
				departments: currentInstitutionDepartments.map((dept) => ({
					id: dept.departmentId,
					name: dept.name,
					staffCount: dept.doctorCount,
					documentCount: 0,
					activeConsultations: 0,
					headDoctor: dept.headOfDepartment || 'TBD'
				})),
				staff:
					doctors?.map((doctor) => ({
						id: doctor.id,
						name: doctor.name,
						role: 'Doctor',
						department: doctor.department,
						status: 'active',
						lastActivity: new Date(doctor.updated_at)
					})) || [],
				recentActivity: [],
				complianceStatus: {
					hipaa: 'compliant' as const,
					gdpr: 'compliant' as const,
					lastAudit: new Date(Date.now() - 2592000000),
					nextAudit: new Date(Date.now() + 2592000000)
				}
			};

			isLoading = false;
		} catch (err) {
			console.error('Failed to load dashboard data:', err);
			error = err instanceof Error ? err.message : 'Failed to load dashboard data';
			isLoading = false;
		}
	}

	function refreshDashboard(): void {
		isLoading = true;
		error = null;
		loadDashboardData();
	}

	async function handleDepartmentAdded() {
		// Refresh dashboard data to show new department
		await refreshDashboard();
	}

	async function handleDepartmentUpdated(department: Department) {
		// Handle department update - refresh dashboard
		await refreshDashboard();
	}
</script>

<svelte:head>
	<title>Hospital Dashboard - MedNexus</title>
</svelte:head>

<div class="hospital-dashboard">
	{#if isLoading}
		<div class="loading-container">
			<div class="loading-spinner"></div>
			<p>Loading hospital dashboard...</p>
		</div>
	{:else if error}
		<div class="error-container">
			<div class="error-message">
				<h3>Error Loading Dashboard</h3>
				<p>{error}</p>
				<button class="btn btn-primary" onclick={refreshDashboard}> Try Again </button>
			</div>
		</div>
	{:else if dashboardData}
		<!-- Header -->
		<div class="dashboard-header">
			<div class="header-content">
				<h1>Hospital Administration Dashboard</h1>
				<p class="role-badge">{dashboardData.user.role.name}</p>
				<p class="institution-info">
					Institution: {dashboardData.user.institutionId} | Last login: {dashboardData.user.lastLogin.toLocaleDateString()}
				</p>
			</div>
			<div class="header-actions">
				<button class="btn btn-outline" onclick={refreshDashboard}>
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
				<button class="btn btn-primary">
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path d="M12 5v14M5 12h14" />
					</svg>
					Add Staff
				</button>
			</div>
		</div>

		<!-- Stats Overview -->
		<div class="stats-grid">
			<StatsCard
				title="Total Staff"
				value={dashboardData.stats.totalStaff.toString()}
				change="+2 this month"
				changeType="positive"
				icon="users"
			/>
			<StatsCard
				title="Active Departments"
				value={dashboardData.stats.activeDepartments.toString()}
				change="All operational"
				changeType="neutral"
				icon="building"
			/>
			<StatsCard
				title="Total Patients"
				value={dashboardData.stats.totalPatients.toString()}
				change="+15%"
				changeType="positive"
				icon="user"
			/>
			<StatsCard
				title="Compliance Score"
				value={`${dashboardData.stats.complianceScore}%`}
				change="Excellent"
				changeType="positive"
				icon="shield"
			/>
			<StatsCard
				title="Documents This Month"
				value={dashboardData.stats.documentsThisMonth.toString()}
				change="+12%"
				changeType="positive"
				icon="document"
			/>
			<StatsCard
				title="Pending Approvals"
				value={dashboardData.stats.pendingApprovals.toString()}
				change="3 urgent"
				changeType="warning"
				icon="clock"
			/>
		</div>

		<!-- Main Content Grid -->
		<div class="dashboard-grid">
			<!-- Department Overview -->
			<div class="dashboard-section">
				<div class="section-header">
					<h2>Department Overview</h2>
					<button onclick={() => (showDepartmentModal = true)} class="btn btn-sm btn-outline">
						Manage Departments
					</button>
				</div>
				<DepartmentOverview departments={dashboardData.departments} />
			</div>

			<!-- Staff Management -->
			<div class="dashboard-section">
				<div class="section-header">
					<h2>Staff Management</h2>
					<button class="btn btn-sm btn-outline">View All Staff</button>
				</div>
				<StaffManagement staff={dashboardData.staff} />
			</div>

			<!-- Compliance Status -->
			<div class="dashboard-section">
				<div class="section-header">
					<h2>Compliance Status</h2>
					<button class="btn btn-sm btn-outline">View Reports</button>
				</div>
				<ComplianceStatus status={dashboardData.complianceStatus} />
			</div>

			<!-- Recent Activity -->
			<div class="dashboard-section">
				<div class="section-header">
					<h2>Recent Activity</h2>
					<button class="btn btn-sm btn-outline">View Timeline</button>
				</div>
				<ActivityFeed activities={dashboardData.recentActivity} />
			</div>
		</div>
	{:else}
		<div class="no-data">
			<h3>No Dashboard Data Available</h3>
			<p>Please ensure your wallet is connected and try refreshing the page.</p>
		</div>
	{/if}
</div>

<!-- Department Management Modal -->
{#if currentInstitutionId}
	<DepartmentManagement
		bind:isOpen={showDepartmentModal}
		departments={currentInstitutionDepartments}
		institutionId={currentInstitutionId}
		ondepartmentadded={handleDepartmentAdded}
		ondepartmentupdated={handleDepartmentUpdated}
		onclose={() => (showDepartmentModal = false)}
	/>
{/if}

<style>
	.hospital-dashboard {
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

	.institution-info {
		color: #6b7280;
		font-size: 0.875rem;
		margin: 0;
	}

	.header-actions {
		display: flex;
		gap: 1rem;
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
		.hospital-dashboard {
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
