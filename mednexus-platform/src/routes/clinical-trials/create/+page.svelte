<script lang="ts">
	import { goto } from '$app/navigation';
	import { clinicalTrialService } from '$lib/services/clinicalTrialService';
	// import { walletManager } from '$lib/wallet'; // Removed - no fake transactions
	import { ArrowLeft, Plus, X, Building2, Users, Calendar, FileText, Wallet } from '@lucide/svelte';

	// Form state
	let formData = $state({
		protocolNumber: '',
		title: '',
		phase: 'phase_1' as 'phase_1' | 'phase_2' | 'phase_3' | 'phase_4',
		condition: '',
		interventionType: 'drug' as 'drug' | 'device' | 'behavioral' | 'procedure' | 'other',
		interventionName: '',
		description: '',
		objectives: {
			primary: '',
			secondary: [] as string[]
		},
		eligibility: {
			minAge: 18,
			maxAge: 65,
			gender: 'all' as 'male' | 'female' | 'all',
			healthyVolunteers: false,
			inclusionCriteria: [] as string[],
			exclusionCriteria: [] as string[]
		},
		targetEnrollment: 100,
		estimatedDuration: 24,
		fundingSource: '',
		fundingAmount: 0,
		principalInvestigator: {
			name: '',
			institution: '',
			email: ''
		},
		sites: [] as Array<{
			name: string;
			location: string;
			targetEnrollment: number;
		}>
	});

	// Temporary input fields for arrays
	let secondaryObjective = $state('');
	let inclusionCriterion = $state('');
	let exclusionCriterion = $state('');
	let siteName = $state('');
	let siteLocation = $state('');
	let siteEnrollment = $state(0);

	let isSubmitting = $state(false);
	let errorMessage = $state('');

	// Add array items
	function addSecondaryObjective() {
		if (secondaryObjective.trim()) {
			formData.objectives.secondary.push(secondaryObjective.trim());
			secondaryObjective = '';
		}
	}

	function removeSecondaryObjective(index: number) {
		formData.objectives.secondary.splice(index, 1);
	}

	function addInclusionCriterion() {
		if (inclusionCriterion.trim()) {
			formData.eligibility.inclusionCriteria.push(inclusionCriterion.trim());
			inclusionCriterion = '';
		}
	}

	function removeInclusionCriterion(index: number) {
		formData.eligibility.inclusionCriteria.splice(index, 1);
	}

	function addExclusionCriterion() {
		if (exclusionCriterion.trim()) {
			formData.eligibility.exclusionCriteria.push(exclusionCriterion.trim());
			exclusionCriterion = '';
		}
	}

	function removeExclusionCriterion(index: number) {
		formData.eligibility.exclusionCriteria.splice(index, 1);
	}

	function addSite() {
		if (siteName.trim() && siteLocation.trim() && siteEnrollment > 0) {
			formData.sites = [
				...formData.sites,
				{
					name: siteName.trim(),
					location: siteLocation.trim(),
					targetEnrollment: siteEnrollment
				}
			];
			siteName = '';
			siteLocation = '';
			siteEnrollment = 0;
		}
	}

	function removeSite(index: number) {
		formData.sites = formData.sites.filter((_, i) => i !== index);
	}

	async function handleSubmit() {
		try {
			isSubmitting = true;
			errorMessage = '';

			// Validate required fields
			if (!formData.protocolNumber || !formData.title || !formData.condition) {
				errorMessage = 'Please fill in all required fields';
				return;
			}

			if (formData.sites.length === 0) {
				errorMessage = 'Please add at least one study site';
				return;
			}

			// Wallet transaction removed - no fake transactions
			// Real blockchain integration will be added later

			// Create the trial

			// Create the trial
			await clinicalTrialService.createTrial({
				protocolNumber: formData.protocolNumber,
				title: formData.title,
				phase: formData.phase,
				condition: formData.condition,
				intervention: {
					type: formData.interventionType,
					name: formData.interventionName,
					description: formData.description
				},
				objectives: formData.objectives,
				eligibility: {
					...formData.eligibility,
					requiredDiagnoses: [formData.condition]
				},
				targetEnrollment: formData.targetEnrollment,
				estimatedDuration: formData.estimatedDuration,
				funding: {
					source: formData.fundingSource,
					totalBudget: formData.fundingAmount,
					currency: 'USD',
					perPatientCost: formData.fundingAmount / formData.targetEnrollment
				},
				principalInvestigator: {
					name: formData.principalInvestigator.name,
					institution: formData.principalInvestigator.institution,
					credentials: ['MD', 'PhD'],
					walletAddress: '' // Will be set from connected wallet if needed
				},
				sites: formData.sites.map((site, idx) => ({
					siteId: `SITE-${Date.now()}-${idx}`,
					institutionId: `INST-${Date.now()}-${idx}`,
					institutionName: site.name,
					location: site.location,
					country: site.location.split(',').pop()?.trim() || 'USA',
					principalInvestigator: formData.principalInvestigator.name,
					status: 'pending' as const,
					enrollmentTarget: site.targetEnrollment,
					currentEnrollment: 0,
					contactInfo: {
						email: formData.principalInvestigator.email,
						phone: '',
						address: site.location
					},
					irbApproval: {
						approved: false,
						approvalDate: new Date().toISOString(),
						expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
						irbName: 'Local IRB',
						protocolNumber: formData.protocolNumber
					},
					lastUpdated: new Date().toISOString()
				}))
			}); // Navigate back to trials list
			goto('/clinical-trials');
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to create trial';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="min-h-screen bg-gray-50 p-6">
	<div class="max-w-5xl mx-auto">
		<!-- Header -->
		<div class="mb-6">
			<button
				onclick={() => goto('/clinical-trials')}
				class="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
			>
				<ArrowLeft class="w-4 h-4" />
				Back to Clinical Trials
			</button>
			<h1 class="text-3xl font-bold text-gray-900">Create New Clinical Trial</h1>
			<p class="text-gray-600 mt-2">
				Register a new multi-institutional clinical trial with AI-powered patient recruitment
			</p>
		</div>

		{#if errorMessage}
			<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
				<p class="text-red-800">{errorMessage}</p>
			</div>
		{/if}

		<form
			onsubmit={(e) => {
				e.preventDefault();
				handleSubmit();
			}}
			class="space-y-6"
		>
			<!-- Basic Information -->
			<div class="bg-white rounded-lg shadow p-6">
				<h2 class="text-xl font-semibold mb-4">Basic Information</h2>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							Protocol Number <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							bind:value={formData.protocolNumber}
							placeholder="e.g., NCT04891234"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							required
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							Phase <span class="text-red-500">*</span>
						</label>
						<select
							bind:value={formData.phase}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							required
						>
							<option value="phase_1">Phase I</option>
							<option value="phase_2">Phase II</option>
							<option value="phase_3">Phase III</option>
							<option value="phase_4">Phase IV</option>
						</select>
					</div>
					<div class="col-span-2">
						<label class="block text-sm font-medium text-gray-700 mb-2">
							Trial Title <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							bind:value={formData.title}
							placeholder="Enter trial title"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							required
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							Condition <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							bind:value={formData.condition}
							placeholder="e.g., Non-Small Cell Lung Cancer"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							required
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2"> Target Enrollment </label>
						<input
							type="number"
							bind:value={formData.targetEnrollment}
							min="1"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							Estimated Duration (months)
						</label>
						<input
							type="number"
							bind:value={formData.estimatedDuration}
							min="1"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
					</div>
				</div>
			</div>

			<!-- Intervention Details -->
			<div class="bg-white rounded-lg shadow p-6">
				<h2 class="text-xl font-semibold mb-4">Intervention Details</h2>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2"> Intervention Type </label>
						<select
							bind:value={formData.interventionType}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						>
							<option value="drug">Drug</option>
							<option value="device">Device</option>
							<option value="behavioral">Behavioral</option>
							<option value="procedure">Procedure</option>
							<option value="other">Other</option>
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2"> Intervention Name </label>
						<input
							type="text"
							bind:value={formData.interventionName}
							placeholder="e.g., Drug name"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
					</div>
					<div class="col-span-2">
						<label class="block text-sm font-medium text-gray-700 mb-2"> Description </label>
						<textarea
							bind:value={formData.description}
							rows="3"
							placeholder="Describe the intervention..."
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						></textarea>
					</div>
				</div>
			</div>

			<!-- Objectives -->
			<div class="bg-white rounded-lg shadow p-6">
				<h2 class="text-xl font-semibold mb-4">Study Objectives</h2>
				<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2"> Primary Objective </label>
						<textarea
							bind:value={formData.objectives.primary}
							rows="2"
							placeholder="Enter primary objective..."
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						></textarea>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							Secondary Objectives
						</label>
						<div class="flex gap-2 mb-2">
							<input
								type="text"
								bind:value={secondaryObjective}
								placeholder="Add secondary objective..."
								class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								onkeydown={(e) =>
									e.key === 'Enter' && (e.preventDefault(), addSecondaryObjective())}
							/>
							<button
								type="button"
								onclick={addSecondaryObjective}
								class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
							>
								<Plus class="w-4 h-4" />
							</button>
						</div>
						<div class="space-y-2">
							{#each formData.objectives.secondary as objective, index}
								<div class="flex items-center gap-2 bg-gray-50 p-2 rounded">
									<span class="flex-1 text-sm">{objective}</span>
									<button
										type="button"
										onclick={() => removeSecondaryObjective(index)}
										class="text-red-600 hover:text-red-700"
									>
										<X class="w-4 h-4" />
									</button>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<!-- Eligibility Criteria -->
			<div class="bg-white rounded-lg shadow p-6">
				<h2 class="text-xl font-semibold mb-4">Eligibility Criteria</h2>
				<div class="space-y-4">
					<div class="grid grid-cols-3 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">Min Age</label>
							<input
								type="number"
								bind:value={formData.eligibility.minAge}
								min="0"
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">Max Age</label>
							<input
								type="number"
								bind:value={formData.eligibility.maxAge}
								min="0"
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">Gender</label>
							<select
								bind:value={formData.eligibility.gender}
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							>
								<option value="all">All</option>
								<option value="male">Male</option>
								<option value="female">Female</option>
							</select>
						</div>
					</div>

					<div>
						<label class="flex items-center gap-2">
							<input type="checkbox" bind:checked={formData.eligibility.healthyVolunteers} />
							<span class="text-sm font-medium text-gray-700">Accept Healthy Volunteers</span>
						</label>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2"> Inclusion Criteria </label>
						<div class="flex gap-2 mb-2">
							<input
								type="text"
								bind:value={inclusionCriterion}
								placeholder="Add inclusion criterion..."
								class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								onkeydown={(e) =>
									e.key === 'Enter' && (e.preventDefault(), addInclusionCriterion())}
							/>
							<button
								type="button"
								onclick={addInclusionCriterion}
								class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
							>
								<Plus class="w-4 h-4" />
							</button>
						</div>
						<div class="space-y-2">
							{#each formData.eligibility.inclusionCriteria as criterion, index}
								<div class="flex items-center gap-2 bg-gray-50 p-2 rounded">
									<span class="flex-1 text-sm">{criterion}</span>
									<button
										type="button"
										onclick={() => removeInclusionCriterion(index)}
										class="text-red-600 hover:text-red-700"
									>
										<X class="w-4 h-4" />
									</button>
								</div>
							{/each}
						</div>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2"> Exclusion Criteria </label>
						<div class="flex gap-2 mb-2">
							<input
								type="text"
								bind:value={exclusionCriterion}
								placeholder="Add exclusion criterion..."
								class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								onkeydown={(e) =>
									e.key === 'Enter' && (e.preventDefault(), addExclusionCriterion())}
							/>
							<button
								type="button"
								onclick={addExclusionCriterion}
								class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
							>
								<Plus class="w-4 h-4" />
							</button>
						</div>
						<div class="space-y-2">
							{#each formData.eligibility.exclusionCriteria as criterion, index}
								<div class="flex items-center gap-2 bg-gray-50 p-2 rounded">
									<span class="flex-1 text-sm">{criterion}</span>
									<button
										type="button"
										onclick={() => removeExclusionCriterion(index)}
										class="text-red-600 hover:text-red-700"
									>
										<X class="w-4 h-4" />
									</button>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<!-- Funding & PI -->
			<div class="bg-white rounded-lg shadow p-6">
				<h2 class="text-xl font-semibold mb-4">Funding & Principal Investigator</h2>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2"> Funding Source </label>
						<input
							type="text"
							bind:value={formData.fundingSource}
							placeholder="e.g., NIH, Private Foundation"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							Funding Amount (USD)
						</label>
						<input
							type="number"
							bind:value={formData.fundingAmount}
							min="0"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							Principal Investigator Name
						</label>
						<input
							type="text"
							bind:value={formData.principalInvestigator.name}
							placeholder="Dr. Name"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2"> Institution </label>
						<input
							type="text"
							bind:value={formData.principalInvestigator.institution}
							placeholder="Institution name"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
					</div>
					<div class="col-span-2">
						<label class="block text-sm font-medium text-gray-700 mb-2"> Email </label>
						<input
							type="email"
							bind:value={formData.principalInvestigator.email}
							placeholder="email@institution.edu"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
					</div>
				</div>
			</div>

			<!-- Study Sites -->
			<div class="bg-white rounded-lg shadow p-6">
				<h2 class="text-xl font-semibold mb-4">
					Study Sites <span class="text-red-500">*</span>
				</h2>
				<div class="space-y-4">
					<div class="grid grid-cols-3 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
							<input
								type="text"
								bind:value={siteName}
								placeholder="Hospital/Center name"
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">Location</label>
							<input
								type="text"
								bind:value={siteLocation}
								placeholder="City, State/Country"
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">Enrollment Target</label>
							<div class="flex gap-2">
								<input
									type="number"
									bind:value={siteEnrollment}
									min="1"
									class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
								<button
									type="button"
									onclick={addSite}
									class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
								>
									<Plus class="w-4 h-4" />
								</button>
							</div>
						</div>
					</div>

					{#if formData.sites.length === 0}
						<p class="text-sm text-gray-500 italic">
							No sites added yet. Please add at least one site.
						</p>
					{:else}
						<div class="space-y-2">
							{#each formData.sites as site, index}
								<div class="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
									<Building2 class="w-5 h-5 text-gray-400" />
									<div class="flex-1">
										<p class="font-medium text-gray-900">{site.name}</p>
										<p class="text-sm text-gray-600">{site.location}</p>
									</div>
									<div class="text-right">
										<p class="text-sm text-gray-600">Target Enrollment</p>
										<p class="font-semibold text-gray-900">{site.targetEnrollment}</p>
									</div>
									<button
										type="button"
										onclick={() => removeSite(index)}
										class="text-red-600 hover:text-red-700"
									>
										<X class="w-5 h-5" />
									</button>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- Submit -->
			<div class="flex justify-end gap-4">
				<button
					type="button"
					onclick={() => goto('/clinical-trials')}
					class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={isSubmitting}
					class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isSubmitting ? 'Creating Trial...' : 'Create Clinical Trial'}
				</button>
			</div>
		</form>
	</div>
</div>
