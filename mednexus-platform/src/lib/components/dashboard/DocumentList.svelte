<script lang="ts">
	import type { DocumentSummary } from '$lib/types/dashboard';
	import { FileText, Eye, Download, Share, CheckCircle, Archive } from '@lucide/svelte';

	export let documents: DocumentSummary[];

	function getStatusColor(status: string): string {
		switch (status) {
			case 'active':
				return 'bg-green-100 text-green-800';
			case 'shared':
				return 'bg-blue-100 text-blue-800';
			case 'archived':
				return 'bg-gray-100 text-gray-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function getStatusIcon(status: string) {
		switch (status) {
			case 'active':
				return CheckCircle;
			case 'shared':
				return Share;
			case 'archived':
				return Archive;
			default:
				return FileText;
		}
	}

	function formatDate(date: Date): string {
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<div class="p-0">
	{#if documents.length === 0}
		<div class="flex flex-col items-center justify-center p-12 text-center text-gray-500">
			<FileText class="w-12 h-12 mb-4 opacity-50" />
			<p>No documents found</p>
		</div>
	{:else}
		{#each documents as document}
			<div
				class="flex items-center p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors last:border-b-0"
			>
				<div
					class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0 mr-4"
				>
					<FileText class="w-5 h-5" />
				</div>
				<div class="flex-1 min-w-0">
					<h4 class="text-sm font-semibold text-gray-900 truncate mb-1">{document.name}</h4>
					<div class="flex items-center gap-4 text-xs text-gray-600">
						<span class="bg-gray-100 px-2 py-0.5 rounded-full font-medium">{document.type}</span>
						<span>{document.size}</span>
						<span>{formatDate(document.uploadDate)}</span>
					</div>
				</div>
				<div class="mr-4">
					<div
						class="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium capitalize {getStatusColor(
							document.status
						)}"
					>
						<svelte:component this={getStatusIcon(document.status)} class="w-3 h-3" />
						<span>{document.status}</span>
					</div>
				</div>
				<div class="flex gap-2">
					<button
						class="w-8 h-8 border-none bg-gray-100 hover:bg-gray-200 rounded-md flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
						title="View Document"
					>
						<Eye class="w-4 h-4" />
					</button>
					<button
						class="w-8 h-8 border-none bg-gray-100 hover:bg-gray-200 rounded-md flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
						title="Download Document"
					>
						<Download class="w-4 h-4" />
					</button>
					<button
						class="w-8 h-8 border-none bg-gray-100 hover:bg-gray-200 rounded-md flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
						title="Share Document"
					>
						<Share class="w-4 h-4" />
					</button>
				</div>
			</div>
		{/each}
	{/if}
</div>

<style>
	@media (max-width: 768px) {
		:global(.document-item) {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.75rem;
			padding: 1rem;
		}

		:global(.document-icon) {
			margin-right: 0;
		}

		:global(.document-meta) {
			flex-wrap: wrap;
			gap: 0.5rem;
		}

		:global(.document-actions) {
			width: 100%;
			justify-content: center;
		}
	}

	@media (max-width: 480px) {
		:global(.document-meta) {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
		}

		:global(.document-name) {
			white-space: normal;
		}
	}
</style>
