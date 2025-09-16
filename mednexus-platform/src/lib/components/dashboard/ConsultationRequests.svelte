<script lang="ts">
	import type { Consultation } from '$lib/types/dashboard';
	import { MessageCircle, CheckCircle, XCircle, Eye } from '@lucide/svelte';

	export let consultations: Consultation[];

	function getStatusColor(status: string): string {
		switch (status) {
			case 'active':
				return 'bg-green-100 text-green-800';
			case 'requested':
				return 'bg-orange-100 text-orange-800';
			case 'completed':
				return 'bg-gray-100 text-gray-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function getStatusIcon(status: string) {
		switch (status) {
			case 'active':
				return CheckCircle;
			case 'requested':
				return MessageCircle;
			case 'completed':
				return CheckCircle;
			default:
				return MessageCircle;
		}
	}

	function formatDate(date: Date): string {
		const now = new Date();
		const diffTime = date.getTime() - now.getTime();
		const diffHours = Math.floor(diffTime / (1000 * 60 * 60));

		if (diffHours === 0) return 'Just now';
		if (diffHours === 1) return '1 hour ago';
		if (diffHours > 1 && diffHours < 24) return `${diffHours} hours ago`;
		if (diffHours >= 24) {
			const diffDays = Math.floor(diffHours / 24);
			return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
		}
		return date.toLocaleDateString();
	}
</script>

<div class="p-0">
	{#if consultations.length === 0}
		<div class="flex flex-col items-center justify-center p-12 text-center text-gray-500">
			<MessageCircle class="w-12 h-12 mb-4 opacity-50" />
			<p>No consultation requests</p>
		</div>
	{:else}
		{#each consultations as consultation}
			<div
				class="flex items-center p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors last:border-b-0"
			>
				<div
					class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0 mr-4"
				>
					<MessageCircle class="w-5 h-5" />
				</div>
				<div class="flex-1 min-w-0">
					<div class="flex items-center justify-between mb-1">
						<h4 class="text-sm font-semibold text-gray-900">
							{consultation.specialty} Consultation
						</h4>
						<div
							class="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium capitalize {getStatusColor(
								consultation.status
							)}"
						>
							<svelte:component this={getStatusIcon(consultation.status)} class="w-3 h-3" />
							<span>{consultation.status}</span>
						</div>
					</div>
					<div class="flex items-center gap-4 text-xs text-gray-600 mb-1">
						<span>Dr. {consultation.doctorName}</span>
						<span>{formatDate(consultation.requestedDate)}</span>
					</div>
					<p class="text-xs text-gray-600">Patient ID: {consultation.patientId}</p>
				</div>
				<div class="flex gap-2 ml-4">
					{#if consultation.status === 'requested'}
						<button
							class="w-8 h-8 border-none bg-green-100 hover:bg-green-200 rounded-md flex items-center justify-center text-green-600 hover:text-green-900 transition-colors"
							title="Accept Consultation"
						>
							<CheckCircle class="w-4 h-4" />
						</button>
						<button
							class="w-8 h-8 border-none bg-red-100 hover:bg-red-200 rounded-md flex items-center justify-center text-red-600 hover:text-red-900 transition-colors"
							title="Decline Consultation"
						>
							<XCircle class="w-4 h-4" />
						</button>
					{:else if consultation.status === 'active'}
						<button
							class="w-8 h-8 border-none bg-blue-100 hover:bg-blue-200 rounded-md flex items-center justify-center text-blue-600 hover:text-blue-900 transition-colors"
							title="View Consultation"
						>
							<Eye class="w-4 h-4" />
						</button>
						<button
							class="w-8 h-8 border-none bg-purple-100 hover:bg-purple-200 rounded-md flex items-center justify-center text-purple-600 hover:text-purple-900 transition-colors"
							title="Mark as Complete"
						>
							<CheckCircle class="w-4 h-4" />
						</button>
					{:else}
						<button
							class="w-8 h-8 border-none bg-blue-100 hover:bg-blue-200 rounded-md flex items-center justify-center text-blue-600 hover:text-blue-900 transition-colors"
							title="View Details"
						>
							<Eye class="w-4 h-4" />
						</button>
					{/if}
				</div>
			</div>
		{/each}
	{/if}
</div>

<style>
	@media (max-width: 768px) {
		:global(.consultation-item) {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.75rem;
			padding: 1rem;
		}

		:global(.consultation-icon) {
			margin-right: 0;
		}

		:global(.consultation-header) {
			width: 100%;
		}

		:global(.consultation-meta) {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
		}

		:global(.consultation-actions) {
			width: 100%;
			justify-content: center;
		}
	}

	@media (max-width: 480px) {
		:global(.consultation-specialty) {
			font-size: 0.8rem;
		}

		:global(.consultation-meta) {
			font-size: 0.7rem;
		}

		:global(.patient-info) {
			font-size: 0.7rem;
		}
	}
</style>
