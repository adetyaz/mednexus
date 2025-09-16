<script lang="ts">
	import type { StaffSummary } from '$lib/types/dashboard';
	import { Users, CheckCircle, XCircle, Eye, MessageCircle, Edit } from '@lucide/svelte';

	export let staff: StaffSummary[];

	function getStatusColor(status: string): string {
		switch (status) {
			case 'active':
				return 'bg-green-100 text-green-800';
			case 'inactive':
				return 'bg-gray-100 text-gray-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function getStatusIcon(status: string) {
		switch (status) {
			case 'active':
				return CheckCircle;
			case 'inactive':
				return XCircle;
			default:
				return CheckCircle;
		}
	}

	function formatLastActivity(date: Date): string {
		const now = new Date();
		const diffTime = now.getTime() - date.getTime();
		const diffMinutes = Math.floor(diffTime / (1000 * 60));
		const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

		if (diffMinutes < 1) return 'Just now';
		if (diffMinutes < 60) return `${diffMinutes}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 7) return `${diffDays}d ago`;

		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<div class="p-0">
	{#if staff.length === 0}
		<div class="flex flex-col items-center justify-center p-12 text-center text-gray-500">
			<Users class="w-12 h-12 mb-4 opacity-50" />
			<p>No staff members found</p>
		</div>
	{:else}
		{#each staff as member}
			<div
				class="flex items-center p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors last:border-b-0"
			>
				<div
					class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-4 flex-shrink-0"
				>
					{member.name
						.split(' ')
						.map((n) => n[0])
						.join('')}
				</div>
				<div class="flex-1 min-w-0">
					<div class="flex items-center justify-between mb-1">
						<h4 class="text-sm font-semibold text-gray-900">{member.name}</h4>
						<div
							class="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium capitalize {getStatusColor(
								member.status
							)}"
						>
							<svelte:component this={getStatusIcon(member.status)} class="w-3 h-3" />
							<span>{member.status}</span>
						</div>
					</div>
					<div class="flex items-center gap-4 text-xs text-gray-600 mb-1">
						<span class="bg-gray-100 px-2 py-0.5 rounded-full font-medium">{member.role}</span>
						<span>{member.department}</span>
					</div>
					<p class="text-xs text-gray-500">
						Last active: {formatLastActivity(member.lastActivity)}
					</p>
				</div>
				<div class="flex gap-2 ml-4">
					<button
						class="w-8 h-8 border-none bg-blue-100 hover:bg-blue-200 rounded-md flex items-center justify-center text-blue-600 hover:text-blue-900 transition-colors"
						title="View Profile"
					>
						<Eye class="w-4 h-4" />
					</button>
					<button
						class="w-8 h-8 border-none bg-green-100 hover:bg-green-200 rounded-md flex items-center justify-center text-green-600 hover:text-green-900 transition-colors"
						title="Send Message"
					>
						<MessageCircle class="w-4 h-4" />
					</button>
					<button
						class="w-8 h-8 border-none bg-yellow-100 hover:bg-yellow-200 rounded-md flex items-center justify-center text-yellow-600 hover:text-yellow-900 transition-colors"
						title="Edit Staff"
					>
						<Edit class="w-4 h-4" />
					</button>
				</div>
			</div>
		{/each}
	{/if}
</div>

<style>
	@media (max-width: 768px) {
		:global(.staff-item) {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.75rem;
			padding: 1rem;
		}

		:global(.staff-avatar) {
			margin-right: 0;
		}

		:global(.staff-header) {
			width: 100%;
		}

		:global(.staff-meta) {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
		}

		:global(.staff-actions) {
			width: 100%;
			justify-content: center;
		}
	}

	@media (max-width: 480px) {
		:global(.staff-name) {
			font-size: 0.8rem;
		}

		:global(.staff-meta) {
			font-size: 0.7rem;
		}

		:global(.last-activity) {
			font-size: 0.7rem;
		}
	}
</style>
