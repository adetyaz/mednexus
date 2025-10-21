<script lang="ts">
	import type { DepartmentSummary } from '$lib/types/dashboard';
	import { Building, Eye, Cog, FileText, MessageCircle, User } from '@lucide/svelte';

	export let departments: DepartmentSummary[];

	function getDepartmentColor(index: number): string {
		const colors = [
			'#3b82f6', // blue
			'#10b981', // green
			'#f59e0b', // yellow
			'#ef4444', // red
			'#8b5cf6', // purple
			'#06b6d4', // cyan
			'#f97316', // orange
			'#84cc16' // lime
		];
		return colors[index % colors.length];
	}
</script>

<div class="department-overview">
	{#if departments.length === 0}
		<div class="empty-state">
			<Building class="empty-icon" />
			<p>No departments found</p>
		</div>
	{:else}
		<div class="departments-grid">
			{#each departments as department, index}
				<div class="department-card">
					<div class="department-header" style="background-color: {getDepartmentColor(index)}">
						<div class="header-content">
							<div class="department-icon">
								<Building />
							</div>
							<div class="department-info">
								<h3 class="department-name">{department.name}</h3>
								<p class="staff-count">{department.staffCount} staff members</p>
							</div>
						</div>
					</div>
					<div class="department-stats">
						<div class="stat-item">
							<span class="stat-label">Documents</span>
							<div class="stat-value">
								<FileText class="stat-icon" />
								<span>{department.documentCount}</span>
							</div>
						</div>
						<div class="stat-item">
							<span class="stat-label">Active Consultations</span>
							<div class="stat-value">
								<MessageCircle class="stat-icon" />
								<span>{department.activeConsultations}</span>
							</div>
						</div>
						<div class="stat-item">
							<span class="stat-label">Head Doctor</span>
							<div class="stat-value">
								<User class="stat-icon" />
								<span>{department.headDoctor}</span>
							</div>
						</div>
					</div>
					<div class="department-actions">
						<button class="action-btn secondary">
							<Eye />
							View Details
						</button>
						<button class="action-btn primary">
							<Cog />
							Manage
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.department-overview {
		padding: 1.5rem;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem;
		text-align: center;
		color: #6b7280;
	}

	.empty-icon {
		width: 48px;
		height: 48px;
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.departments-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: 1.5rem;
	}

	.department-card {
		background: white;
		border-radius: 12px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease;
		overflow: hidden;
	}

	.department-card:hover {
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		transform: translateY(-2px);
	}

	.department-header {
		padding: 1.5rem;
		color: white;
	}

	.header-content {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.department-icon {
		width: 48px;
		height: 48px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.department-icon :global(svg) {
		width: 24px;
		height: 24px;
	}

	.department-info {
		flex: 1;
	}

	.department-name {
		font-size: 1.125rem;
		font-weight: 600;
		margin: 0 0 0.25rem 0;
		line-height: 1.4;
	}

	.staff-count {
		font-size: 0.875rem;
		margin: 0;
		opacity: 0.9;
	}

	.department-stats {
		padding: 1.5rem;
		background: #f9fafb;
		border-top: 1px solid #e5e7eb;
	}

	.stat-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.stat-item:last-child {
		margin-bottom: 0;
	}

	.stat-label {
		font-size: 0.875rem;
		color: #6b7280;
		font-weight: 500;
	}

	.stat-value {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: #1f2937;
	}

	.stat-icon {
		width: 16px;
		height: 16px;
		color: #9ca3af;
	}

	.department-actions {
		padding: 1.5rem;
		display: flex;
		gap: 0.75rem;
		border-top: 1px solid #e5e7eb;
	}

	.action-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border-radius: 8px;
		font-weight: 500;
		font-size: 0.875rem;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.action-btn :global(svg) {
		width: 16px;
		height: 16px;
	}

	.action-btn.secondary {
		background: #f3f4f6;
		color: #374151;
	}

	.action-btn.secondary:hover {
		background: #e5e7eb;
	}

	.action-btn.primary {
		background: #3b82f6;
		color: white;
	}

	.action-btn.primary:hover {
		background: #2563eb;
	}

	@media (max-width: 768px) {
		.department-overview {
			padding: 1rem;
		}

		.departments-grid {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		.department-header {
			padding: 1rem;
		}

		.department-stats {
			padding: 1rem;
		}

		.department-actions {
			padding: 1rem;
		}
	}
</style>
