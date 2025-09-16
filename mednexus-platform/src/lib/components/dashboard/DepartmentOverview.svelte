<script lang="ts">
	import type { DepartmentSummary } from '$lib/types/dashboard';
	import { Building, Eye, Cog, FileText, MessageCircle, User } from '@lucide/svelte';

	export let departments: DepartmentSummary[];

	function getDepartmentColor(index: number): string {
		const colors = [
			'bg-blue-500',
			'bg-green-500',
			'bg-yellow-500',
			'bg-red-500',
			'bg-purple-500',
			'bg-cyan-500',
			'bg-orange-500',
			'bg-lime-500'
		];
		return colors[index % colors.length];
	}
</script>

<div class="p-0">
	{#if departments.length === 0}
		<div class="flex flex-col items-center justify-center p-12 text-center text-gray-500">
			<Building class="w-12 h-12 mb-4 opacity-50" />
			<p>No departments found</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each departments as department, index}
				<div
					class="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1"
				>
					<div class="p-6 {getDepartmentColor(index)} text-white">
						<div class="flex items-center gap-4">
							<div class="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
								<Building class="w-6 h-6" />
							</div>
							<div>
								<h3 class="text-lg font-semibold mb-1">{department.name}</h3>
								<p class="text-sm opacity-90">{department.staffCount} staff members</p>
							</div>
						</div>
					</div>
					<div class="p-6 bg-gray-50">
						<div class="space-y-4">
							<div class="flex justify-between items-center">
								<span class="text-sm text-gray-600 font-medium">Documents</span>
								<div class="flex items-center gap-1">
									<FileText class="w-4 h-4 text-gray-400" />
									<span class="text-sm font-semibold text-gray-900">{department.documentCount}</span
									>
								</div>
							</div>
							<div class="flex justify-between items-center">
								<span class="text-sm text-gray-600 font-medium">Active Consultations</span>
								<div class="flex items-center gap-1">
									<MessageCircle class="w-4 h-4 text-gray-400" />
									<span class="text-sm font-semibold text-gray-900"
										>{department.activeConsultations}</span
									>
								</div>
							</div>
							<div class="flex justify-between items-center">
								<span class="text-sm text-gray-600 font-medium">Head Doctor</span>
								<div class="flex items-center gap-1">
									<User class="w-4 h-4 text-gray-400" />
									<span class="text-sm font-semibold text-gray-900">{department.headDoctor}</span>
								</div>
							</div>
						</div>
					</div>
					<div class="p-6 flex gap-3">
						<button
							class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
						>
							<Eye class="w-4 h-4" />
							View Details
						</button>
						<button
							class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
						>
							<Cog class="w-4 h-4" />
							Manage
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
