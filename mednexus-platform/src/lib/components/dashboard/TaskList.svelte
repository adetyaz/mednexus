<script lang="ts">
	import type { Task } from '$lib/types/dashboard';
	import { CheckCircle, AlertTriangle, Clock, Edit, SquareCheck } from '@lucide/svelte';

	export let tasks: Task[];

	function getPriorityColor(priority: string): string {
		switch (priority) {
			case 'urgent':
				return 'bg-red-100 text-red-800';
			case 'high':
				return 'bg-orange-100 text-orange-800';
			case 'medium':
				return 'bg-blue-100 text-blue-800';
			case 'low':
				return 'bg-green-100 text-green-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function getPriorityIcon(priority: string) {
		switch (priority) {
			case 'urgent':
				return AlertTriangle;
			case 'high':
				return AlertTriangle;
			case 'medium':
				return Clock;
			case 'low':
				return CheckCircle;
			default:
				return CheckCircle;
		}
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'completed':
				return 'text-green-600';
			case 'in-progress':
				return 'text-blue-600';
			case 'pending':
				return 'text-orange-600';
			default:
				return 'text-gray-600';
		}
	}

	function formatDate(date: Date): string {
		const now = new Date();
		const diffTime = date.getTime() - now.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		if (diffDays === 0) return 'Today';
		if (diffDays === 1) return 'Tomorrow';
		if (diffDays === -1) return 'Yesterday';
		if (diffDays > 0) return `In ${diffDays} days`;
		return `${Math.abs(diffDays)} days ago`;
	}

	function isOverdue(task: Task): boolean {
		return task.status !== 'completed' && task.dueDate < new Date();
	}
</script>

<div class="p-0">
	{#if tasks.length === 0}
		<div class="flex flex-col items-center justify-center p-12 text-center text-gray-500">
			<SquareCheck class="w-12 h-12 mb-4 opacity-50" />
			<p>No pending tasks</p>
		</div>
	{:else}
		{#each tasks as task}
			<div
				class="flex items-start p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors last:border-b-0 {isOverdue(
					task
				)
					? 'bg-red-50 border-l-4 border-l-red-500'
					: ''}"
			>
				<div class="mr-4 mt-1">
					<div
						class="w-8 h-8 rounded-full flex items-center justify-center {getPriorityColor(
							task.priority
						)}"
					>
						<svelte:component this={getPriorityIcon(task.priority)} class="w-4 h-4" />
					</div>
				</div>
				<div class="flex-1 min-w-0">
					<h4 class="text-sm font-semibold text-gray-900 mb-1">{task.title}</h4>
					<p class="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</p>
					<div class="flex items-center gap-4 text-xs">
						<span class="text-gray-500">Due: {formatDate(task.dueDate)}</span>
						<span class="font-medium capitalize {getStatusColor(task.status)}">
							{task.status.replace('-', ' ')}
						</span>
					</div>
				</div>
				<div class="flex gap-2 ml-4">
					{#if task.status !== 'completed'}
						<button
							class="w-8 h-8 border-none bg-green-100 hover:bg-green-200 rounded-md flex items-center justify-center text-green-600 hover:text-green-900 transition-colors"
							title="Mark as Complete"
						>
							<CheckCircle class="w-4 h-4" />
						</button>
					{/if}
					<button
						class="w-8 h-8 border-none bg-blue-100 hover:bg-blue-200 rounded-md flex items-center justify-center text-blue-600 hover:text-blue-900 transition-colors"
						title="Edit Task"
					>
						<Edit class="w-4 h-4" />
					</button>
				</div>
			</div>
		{/each}
	{/if}
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	@media (max-width: 768px) {
		:global(.task-item) {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.75rem;
			padding: 1rem;
		}

		:global(.task-priority) {
			margin-right: 0;
			align-self: flex-start;
		}

		:global(.task-meta) {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
		}

		:global(.task-actions) {
			width: 100%;
			justify-content: center;
		}
	}
</style>
