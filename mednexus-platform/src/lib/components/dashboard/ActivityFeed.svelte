<script lang="ts">
	import type { Activity } from '$lib/types/dashboard';
	import { Upload, Share, Eye, MessageCircle, CheckCircle, Clock } from '@lucide/svelte';

	export let activities: Activity[];

	function getActivityIcon(type: string) {
		switch (type) {
			case 'upload':
				return Upload;
			case 'share':
				return Share;
			case 'access':
				return Eye;
			case 'consultation':
				return MessageCircle;
			default:
				return CheckCircle;
		}
	}

	function getActivityColor(type: string): string {
		switch (type) {
			case 'upload':
				return 'bg-green-100 text-green-600';
			case 'share':
				return 'bg-blue-100 text-blue-600';
			case 'access':
				return 'bg-orange-100 text-orange-600';
			case 'consultation':
				return 'bg-purple-100 text-purple-600';
			default:
				return 'bg-gray-100 text-gray-600';
		}
	}

	function formatTimestamp(timestamp: Date): string {
		const now = new Date();
		const diffTime = now.getTime() - timestamp.getTime();
		const diffMinutes = Math.floor(diffTime / (1000 * 60));
		const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

		if (diffMinutes < 1) return 'Just now';
		if (diffMinutes < 60) return `${diffMinutes}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 7) return `${diffDays}d ago`;

		return timestamp.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}
</script>

<div class="p-0">
	{#if activities.length === 0}
		<div class="flex flex-col items-center justify-center p-12 text-center text-gray-500">
			<Clock class="w-12 h-12 mb-4 opacity-50" />
			<p>No recent activity</p>
		</div>
	{:else}
		{#each activities as activity}
			<div
				class="flex items-start p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors last:border-b-0"
			>
				<div
					class="w-8 h-8 rounded-full flex items-center justify-center {getActivityColor(
						activity.type
					)} flex-shrink-0 mr-4 mt-0.5"
				>
					<svelte:component this={getActivityIcon(activity.type)} class="w-4 h-4" />
				</div>
				<div class="flex-1 min-w-0">
					<p class="text-sm text-gray-900 mb-1 leading-relaxed">{activity.description}</p>
					<div class="flex items-center gap-3 text-xs text-gray-600">
						<span class="font-medium">{activity.user}</span>
						<span class="opacity-80">{formatTimestamp(activity.timestamp)}</span>
					</div>
				</div>
			</div>
		{/each}
	{/if}
</div>

<style>
	@media (max-width: 768px) {
		:global(.activity-item) {
			padding: 1rem;
		}

		:global(.activity-meta) {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
		}
	}

	@media (max-width: 480px) {
		:global(.activity-description) {
			font-size: 0.8rem;
		}

		:global(.activity-meta) {
			font-size: 0.7rem;
		}
	}
</style>
