<script lang="ts">
	import { goto } from '$app/navigation';
	import { researchCoordinationService } from '$lib/services/researchCoordinationService';
	import { researchProjectService } from '$lib/services/researchProjectService';
	import { walletStore, walletManager } from '$lib/wallet';
	import {
		ArrowLeft,
		Users,
		Building2,
		FileText,
		DollarSign,
		Calendar,
		AlertCircle,
		CheckCircle,
		Plus,
		X
	} from '@lucide/svelte';

	// Form state
	let formData = $state({
		title: '',
		type: 'observational_study' as
			| 'observational_study'
			| 'systematic_review'
			| 'meta_analysis'
			| 'registry_study'
			| 'case_series',
		description: '',
		objectives: [] as string[],
		leadInstitution: {
			name: '',
			location: '',
			principalInvestigator: ''
		},
		collaboratingInstitutions: [] as Array<{
			name: string;
			location: string;
			role: string;
		}>,
		fundingSource: '',
		totalBudget: 0,
		duration: 24
	});

	let objective = $state('');
	let collaboratorName = $state('');
	let collaboratorLocation = $state('');
	let collaboratorRole = $state('');
	let isSubmitting = $state(false);
	let error = $state('');
	let currentStep = $state(1);

	// Helper function to get type label
	function getTypeLabel(type: string): string {
		const typeMap: Record<string, string> = {
			observational_study: 'Observational Study',
			systematic_review: 'Systematic Review',
			meta_analysis: 'Meta-Analysis',
			registry_study: 'Registry Study',
			case_series: 'Case Series'
		};
		return typeMap[type] || 'Other';
	}

	// Add objective
	function addObjective() {
		if (objective.trim()) {
			formData.objectives.push(objective.trim());
			objective = '';
		}
	}

	function removeObjective(index: number) {
		formData.objectives.splice(index, 1);
	}

	// Add collaborating institution
	function addCollaborator() {
		if (collaboratorName.trim() && collaboratorLocation.trim() && collaboratorRole.trim()) {
			formData.collaboratingInstitutions.push({
				name: collaboratorName.trim(),
				location: collaboratorLocation.trim(),
				role: collaboratorRole.trim()
			});
			collaboratorName = '';
			collaboratorLocation = '';
			collaboratorRole = '';
		}
	}

	function removeCollaborator(index: number) {
		formData.collaboratingInstitutions.splice(index, 1);
	}

	// Validation
	function validateStep(step: number): boolean {
		if (step === 1) {
			return !!(formData.title && formData.type && formData.description);
		} else if (step === 2) {
			return !!(
				formData.leadInstitution.name &&
				formData.leadInstitution.location &&
				formData.leadInstitution.principalInvestigator &&
				formData.objectives.length > 0
			);
		} else if (step === 3) {
			return !!(
				formData.fundingSource &&
				formData.totalBudget > 0 &&
				formData.duration > 0 &&
				formData.collaboratingInstitutions.length > 0
			);
		}
		return false;
	}

	function nextStep() {
		if (validateStep(currentStep)) {
			currentStep++;
		}
	}

	function previousStep() {
		currentStep--;
	}

	// Submit form
	async function handleSubmit() {
		if (!validateStep(3)) {
			error = 'Please fill in all required fields';
			return;
		}

		if (!$walletStore.isConnected) {
			error = 'Please connect your wallet first';
			return;
		}

		isSubmitting = true;
		error = '';

		try {
			// Prepare blockchain project data
			const projectData = {
				title: formData.title,
				description: formData.description,
				researchField: getTypeLabel(formData.type),
				projectType: 'Research Collaboration',
				expectedResults: formData.objectives.join(', '),
				methodology: formData.description,
				fundingSource: formData.fundingSource,
				fundingAmount: formData.totalBudget,
				visibility: 'collaborative' as const,
				collaboratingInstitutions: formData.collaboratingInstitutions.map((inst) => inst.name),
				teamMembers: [formData.leadInstitution.principalInvestigator]
			};

			console.log('🚀 Creating research project on blockchain...', projectData);

			// Create on blockchain and save to database
			const result = await researchProjectService.createProject(projectData);

			console.log('✅ Blockchain result:', result.blockchain);
			console.log('✅ Database result:', result.database);

			if (result.blockchain.success && result.database.success) {
				console.log('✅ Research project created successfully!');
				console.log('🔗 Transaction Hash:', result.blockchain.txHash);
				console.log('📦 Block Number:', result.blockchain.blockNumber);
				console.log('🆔 Project ID:', result.blockchain.projectId);
				console.log('💾 Database ID:', result.database.projectId);

				// Navigate back to collaborations list
				goto('/research-collaboration');
			} else {
				error = `Failed to create project: ${result.blockchain.error || result.database.error}`;
			}
		} catch (err) {
			console.error('❌ Creation failed:', err);
			error = err instanceof Error ? err.message : 'Failed to create collaboration';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="min-h-screen bg-gray-50 py-8">
	<div class="max-w-4xl mx-auto px-4">
		<!-- Header -->
		<div class="mb-8">
			<button
				onclick={() => goto('/research-collaboration')}
				class="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
			>
				<ArrowLeft class="w-4 h-4" />
				Back to Research Collaborations
			</button>
			<h1 class="text-3xl font-bold text-gray-900">Create Research Collaboration</h1>
			<p class="text-gray-600 mt-2">
				Set up a new blockchain-verified multi-institutional research project
			</p>
		</div>

		<!-- Wallet Connection -->
		{#if !$walletStore.isConnected}
			<div class="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
				<div class="flex items-center justify-between">
					<div>
						<h3 class="text-lg font-semibold text-amber-800">Wallet Required</h3>
						<p class="text-amber-700 mt-1">
							Connect your wallet to create blockchain-verified research collaborations (0.001 A0GI
							fee)
						</p>
					</div>
					<button
						onclick={() => walletManager.connect()}
						class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
					>
						Connect Wallet
					</button>
				</div>
			</div>
		{:else}
			<div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
				<div class="flex items-center">
					<CheckCircle class="w-5 h-5 text-green-400 mr-3" />
					<div>
						<h3 class="text-sm font-medium text-green-800">Wallet Connected</h3>
						<p class="text-sm text-green-700">
							{$walletStore.address?.slice(0, 6)}...{$walletStore.address?.slice(-4)}
						</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Progress Steps -->
		<div class="mb-8">
			<div class="flex items-center justify-between">
				{#each [1, 2, 3] as step}
					<div class="flex items-center flex-1">
						<div
							class="w-10 h-10 rounded-full flex items-center justify-center font-bold {currentStep >=
							step
								? 'bg-blue-600 text-white'
								: 'bg-gray-200 text-gray-600'}"
						>
							{step}
						</div>
						{#if step < 3}
							<div
								class="flex-1 h-1 mx-2 {currentStep > step ? 'bg-blue-600' : 'bg-gray-200'}"
							></div>
						{/if}
					</div>
				{/each}
			</div>
			<div class="flex justify-between mt-2">
				<span class="text-sm {currentStep === 1 ? 'text-blue-600 font-semibold' : 'text-gray-600'}"
					>Basic Info</span
				>
				<span class="text-sm {currentStep === 2 ? 'text-blue-600 font-semibold' : 'text-gray-600'}"
					>Lead & Objectives</span
				>
				<span class="text-sm {currentStep === 3 ? 'text-blue-600 font-semibold' : 'text-gray-600'}"
					>Collaborators & Funding</span
				>
			</div>
		</div>

		<!-- Form -->
		<div class="bg-white rounded-lg shadow-md p-6">
			{#if error}
				<div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
					<AlertCircle class="w-5 h-5 text-red-600 mt-0.5" />
					<div>
						<h4 class="font-semibold text-red-900">Error</h4>
						<p class="text-sm text-red-700">{error}</p>
					</div>
				</div>
			{/if}

			<form onsubmit={(e) => e.preventDefault()}>
				<!-- Step 1: Basic Information -->
				{#if currentStep === 1}
					<div class="space-y-6">
						<h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
							<FileText class="w-5 h-5" />
							Basic Information
						</h2>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Project Title <span class="text-red-500">*</span>
							</label>
							<input
								type="text"
								bind:value={formData.title}
								placeholder="Enter collaboration title"
								class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								required
							/>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Research Type <span class="text-red-500">*</span>
							</label>
							<select
								bind:value={formData.type}
								class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							>
								<option value="observational_study">Observational Study</option>
								<option value="systematic_review">Systematic Review</option>
								<option value="meta_analysis">Meta-Analysis</option>
								<option value="registry_study">Registry Study</option>
								<option value="case_series">Case Series</option>
							</select>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Project Description <span class="text-red-500">*</span>
							</label>
							<textarea
								bind:value={formData.description}
								placeholder="Describe the research project and its goals"
								rows="5"
								class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								required
							></textarea>
						</div>
					</div>
				{/if}

				<!-- Step 2: Lead Institution & Objectives -->
				{#if currentStep === 2}
					<div class="space-y-6">
						<h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
							<Building2 class="w-5 h-5" />
							Lead Institution & Objectives
						</h2>

						<div class="border rounded-lg p-4 bg-gray-50">
							<h3 class="font-semibold text-gray-900 mb-4">Lead Institution</h3>

							<div class="space-y-4">
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-2">
										Institution Name <span class="text-red-500">*</span>
									</label>
									<input
										type="text"
										bind:value={formData.leadInstitution.name}
										placeholder="e.g., Johns Hopkins University"
										class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
										required
									/>
								</div>

								<div>
									<label class="block text-sm font-medium text-gray-700 mb-2">
										Location <span class="text-red-500">*</span>
									</label>
									<input
										type="text"
										bind:value={formData.leadInstitution.location}
										placeholder="e.g., Baltimore, MD, USA"
										class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
										required
									/>
								</div>

								<div>
									<label class="block text-sm font-medium text-gray-700 mb-2">
										Principal Investigator <span class="text-red-500">*</span>
									</label>
									<input
										type="text"
										bind:value={formData.leadInstitution.principalInvestigator}
										placeholder="e.g., Dr. Sarah Johnson"
										class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
										required
									/>
								</div>
							</div>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Research Objectives <span class="text-red-500">*</span>
							</label>
							<div class="flex gap-2">
								<input
									type="text"
									bind:value={objective}
									placeholder="Add research objective"
									class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									onkeydown={(e) => e.key === 'Enter' && addObjective()}
								/>
								<button
									type="button"
									onclick={addObjective}
									class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
								>
									<Plus class="w-4 h-4" />
									Add
								</button>
							</div>
							{#if formData.objectives.length > 0}
								<div class="mt-3 space-y-2">
									{#each formData.objectives as obj, i}
										<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
											<span class="text-sm text-gray-700">{obj}</span>
											<button
												type="button"
												onclick={() => removeObjective(i)}
												class="text-red-600 hover:text-red-800"
											>
												<X class="w-4 h-4" />
											</button>
										</div>
									{/each}
								</div>
							{:else}
								<p class="mt-2 text-sm text-gray-500">No objectives added yet</p>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Step 3: Collaborators & Funding -->
				{#if currentStep === 3}
					<div class="space-y-6">
						<h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
							<Users class="w-5 h-5" />
							Collaborating Institutions
						</h2>

						<div class="border rounded-lg p-4 bg-gray-50">
							<h3 class="font-semibold text-gray-900 mb-4">Add Collaborator</h3>
							<div class="grid grid-cols-3 gap-3 mb-3">
								<input
									type="text"
									bind:value={collaboratorName}
									placeholder="Institution name"
									class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
								<input
									type="text"
									bind:value={collaboratorLocation}
									placeholder="Location"
									class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
								<input
									type="text"
									bind:value={collaboratorRole}
									placeholder="Role (e.g., Data Collection)"
									class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
							</div>
							<button
								type="button"
								onclick={addCollaborator}
								class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
							>
								<Plus class="w-4 h-4" />
								Add Collaborator
							</button>
						</div>

						{#if formData.collaboratingInstitutions.length > 0}
							<div class="space-y-2">
								{#each formData.collaboratingInstitutions as collaborator, i}
									<div class="flex items-center justify-between p-4 bg-white border rounded-lg">
										<div>
											<h4 class="font-semibold text-gray-900">{collaborator.name}</h4>
											<p class="text-sm text-gray-600">{collaborator.location}</p>
											<p class="text-xs text-gray-500 mt-1">Role: {collaborator.role}</p>
										</div>
										<button
											type="button"
											onclick={() => removeCollaborator(i)}
											class="text-red-600 hover:text-red-800"
										>
											<X class="w-5 h-5" />
										</button>
									</div>
								{/each}
							</div>
						{:else}
							<p class="text-sm text-gray-500 text-center py-4">
								No collaborators added yet (at least 1 required)
							</p>
						{/if}

						<div class="border-t pt-6">
							<h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
								<DollarSign class="w-5 h-5" />
								Funding Information
							</h3>

							<div class="grid grid-cols-2 gap-4">
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-2">
										Funding Source <span class="text-red-500">*</span>
									</label>
									<input
										type="text"
										bind:value={formData.fundingSource}
										placeholder="e.g., NIH, Private Grant"
										class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
										required
									/>
								</div>

								<div>
									<label class="block text-sm font-medium text-gray-700 mb-2">
										Total Budget (USD) <span class="text-red-500">*</span>
									</label>
									<input
										type="number"
										bind:value={formData.totalBudget}
										min="0"
										step="1000"
										placeholder="0"
										class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
										required
									/>
								</div>

								<div class="col-span-2">
									<label class="block text-sm font-medium text-gray-700 mb-2">
										Duration (months) <span class="text-red-500">*</span>
									</label>
									<input
										type="number"
										bind:value={formData.duration}
										min="1"
										placeholder="24"
										class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
										required
									/>
								</div>
							</div>
						</div>
					</div>
				{/if}

				<!-- Navigation Buttons -->
				<div class="flex justify-between mt-8 pt-6 border-t">
					<button
						type="button"
						onclick={previousStep}
						disabled={currentStep === 1}
						class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Previous
					</button>

					{#if currentStep < 3}
						<button
							type="button"
							onclick={nextStep}
							disabled={!validateStep(currentStep)}
							class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Next
						</button>
					{:else}
						<button
							type="button"
							onclick={handleSubmit}
							disabled={isSubmitting || !validateStep(3)}
							class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
						>
							{#if isSubmitting}
								Creating...
							{:else}
								<CheckCircle class="w-4 h-4" />
								Create Collaboration
							{/if}
						</button>
					{/if}
				</div>
			</form>
		</div>
	</div>
</div>
