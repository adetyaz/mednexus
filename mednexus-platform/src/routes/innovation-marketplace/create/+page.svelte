<script lang="ts">
	import { goto } from '$app/navigation';
	import { ipProtectionService } from '$lib/services/ipProtectionService';
	// import { walletManager } from '$lib/wallet'; // Removed - no fake transactions
	import {
		ArrowLeft,
		FileText,
		Users,
		DollarSign,
		Shield,
		Coins,
		AlertCircle,
		CheckCircle,
		Upload,
		Calendar
	} from '@lucide/svelte';

	// Form state
	let formData = $state({
		innovationType: 'patent' as 'patent' | 'research_data' | 'clinical_protocol',
		title: '',
		description: '',
		inventors: [] as string[],
		institution: '',
		valuationAmount: 0,
		royaltyRate: 5,
		licensingTerms: {
			exclusive: false,
			territoryRestrictions: '',
			fieldOfUse: ''
		},
		documents: [] as Array<{
			name: string;
			type: string;
		}>
	});

	let inventor = $state('');
	let documentName = $state('');
	let documentType = $state('patent_application');
	let isSubmitting = $state(false);
	let error = $state('');
	let currentStep = $state(1);

	// Add inventor
	function addInventor() {
		if (inventor.trim()) {
			formData.inventors.push(inventor.trim());
			inventor = '';
		}
	}

	function removeInventor(index: number) {
		formData.inventors.splice(index, 1);
	}

	// Add document
	function addDocument() {
		if (documentName.trim()) {
			formData.documents.push({
				name: documentName.trim(),
				type: documentType
			});
			documentName = '';
		}
	}

	function removeDocument(index: number) {
		formData.documents.splice(index, 1);
	}

	// Validation
	function validateStep(step: number): boolean {
		if (step === 1) {
			return !!(formData.innovationType && formData.title && formData.description);
		} else if (step === 2) {
			return !!(
				formData.inventors.length > 0 &&
				formData.institution &&
				formData.valuationAmount > 0
			);
		} else if (step === 3) {
			return !!(
				formData.royaltyRate > 0 &&
				formData.licensingTerms.fieldOfUse &&
				formData.documents.length > 0
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

	function getInnovationTypeLabel(type: string): string {
		const labels: Record<string, string> = {
			patent: 'Patent',
			research_data: 'Research Data',
			clinical_protocol: 'Clinical Protocol'
		};
		return labels[type] || type;
	}

	// Submit form
	async function handleSubmit() {
		if (!validateStep(3)) {
			error = 'Please fill in all required fields';
			return;
		}

		isSubmitting = true;
		error = '';

		try {
			// Wallet transaction removed - no fake transactions
			// Real blockchain integration will be added later

			const inftData = {
				innovationType: formData.innovationType,
				title: formData.title,
				description: formData.description,
				inventors: formData.inventors.map((name) => ({
					name,
					affiliation: formData.institution,
					contribution: 'Co-inventor'
				})),
				assignees: [
					{
						name: formData.institution,
						type: 'institution' as const,
						ownershipPercentage: 100
					}
				],
				filingDetails: {
					filingDate: new Date().toISOString(),
					applicationNumber: `INFT-${Date.now()}`,
					jurisdiction: 'US',
					status: 'pending' as const
				},
				claims: [
					{
						claimNumber: 1,
						claimText: formData.description,
						claimType: 'independent' as const
					}
				],
				commercialization: {
					marketSize: formData.valuationAmount,
					targetIndustries: ['Healthcare', 'Pharmaceuticals'],
					competitiveAdvantages: ['Novel approach', 'Improved efficacy'],
					estimatedRevenue: {
						year1: formData.valuationAmount * 0.1,
						year5: formData.valuationAmount * 0.5,
						year10: formData.valuationAmount
					}
				},
				licensingTerms: {
					available: true,
					exclusivity: formData.licensingTerms.exclusive ? 'exclusive' : ('non_exclusive' as const),
					minimumRoyalty: formData.royaltyRate,
					upfrontFee: formData.valuationAmount * 0.05,
					milestonePayments: [
						{
							milestone: 'First Clinical Trial',
							payment: formData.valuationAmount * 0.1
						},
						{
							milestone: 'Regulatory Approval',
							payment: formData.valuationAmount * 0.2
						}
					],
					territory: formData.licensingTerms.territoryRestrictions || 'Worldwide',
					fieldOfUse: formData.licensingTerms.fieldOfUse
				}
			};

			// In a real implementation, this would create the INFT on blockchain
			// For now, we'll just show success and navigate back
			console.log('Creating INFT with data:', inftData);

			// Navigate back to innovation marketplace
			goto('/innovation-marketplace');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create INFT';
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
				onclick={() => goto('/innovation-marketplace')}
				class="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
			>
				<ArrowLeft class="w-4 h-4" />
				Back to Innovation Marketplace
			</button>
			<h1 class="text-3xl font-bold text-gray-900">Create Innovation NFT (INFT)</h1>
			<p class="text-gray-600 mt-2">Tokenize your intellectual property on the blockchain</p>
		</div>

		<!-- Progress Steps -->
		<div class="mb-8">
			<div class="flex items-center justify-between">
				{#each [1, 2, 3] as step}
					<div class="flex items-center flex-1">
						<div
							class="w-10 h-10 rounded-full flex items-center justify-center font-bold {currentStep >=
							step
								? 'bg-purple-600 text-white'
								: 'bg-gray-200 text-gray-600'}"
						>
							{step}
						</div>
						{#if step < 3}
							<div
								class="flex-1 h-1 mx-2 {currentStep > step ? 'bg-purple-600' : 'bg-gray-200'}"
							></div>
						{/if}
					</div>
				{/each}
			</div>
			<div class="flex justify-between mt-2">
				<span
					class="text-sm {currentStep === 1 ? 'text-purple-600 font-semibold' : 'text-gray-600'}"
					>Innovation Details</span
				>
				<span
					class="text-sm {currentStep === 2 ? 'text-purple-600 font-semibold' : 'text-gray-600'}"
					>Ownership & Valuation</span
				>
				<span
					class="text-sm {currentStep === 3 ? 'text-purple-600 font-semibold' : 'text-gray-600'}"
					>Licensing & Documents</span
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
				<!-- Step 1: Innovation Details -->
				{#if currentStep === 1}
					<div class="space-y-6">
						<h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
							<FileText class="w-5 h-5" />
							Innovation Details
						</h2>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Innovation Type <span class="text-red-500">*</span>
							</label>
							<select
								bind:value={formData.innovationType}
								class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
							>
								<option value="patent">Patent</option>
								<option value="research_data">Research Data</option>
								<option value="clinical_protocol">Clinical Protocol</option>
							</select>
							<p class="mt-1 text-xs text-gray-500">
								Select the type of intellectual property you want to tokenize
							</p>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Innovation Title <span class="text-red-500">*</span>
							</label>
							<input
								type="text"
								bind:value={formData.title}
								placeholder="Enter a descriptive title"
								class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
								required
							/>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Description <span class="text-red-500">*</span>
							</label>
							<textarea
								bind:value={formData.description}
								placeholder="Provide a detailed description of the innovation, its applications, and benefits"
								rows="6"
								class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
								required
							></textarea>
						</div>

						<div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
							<div class="flex gap-3">
								<Shield class="w-5 h-5 text-purple-600 mt-0.5" />
								<div>
									<h4 class="font-semibold text-purple-900">Blockchain Protection</h4>
									<p class="text-sm text-purple-700 mt-1">
										Your innovation will be tokenized as an INFT on the 0G blockchain, providing
										immutable proof of ownership and enabling fractional licensing.
									</p>
								</div>
							</div>
						</div>
					</div>
				{/if}

				<!-- Step 2: Ownership & Valuation -->
				{#if currentStep === 2}
					<div class="space-y-6">
						<h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
							<Users class="w-5 h-5" />
							Ownership & Valuation
						</h2>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Inventors / Creators <span class="text-red-500">*</span>
							</label>
							<div class="flex gap-2">
								<input
									type="text"
									bind:value={inventor}
									placeholder="Add inventor name"
									class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
									onkeydown={(e) => e.key === 'Enter' && addInventor()}
								/>
								<button
									type="button"
									onclick={addInventor}
									class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
								>
									Add
								</button>
							</div>
							{#if formData.inventors.length > 0}
								<div class="mt-3 space-y-2">
									{#each formData.inventors as inv, i}
										<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
											<span class="text-sm text-gray-700">{inv}</span>
											<button
												type="button"
												onclick={() => removeInventor(i)}
												class="text-red-600 hover:text-red-800 text-sm"
											>
												Remove
											</button>
										</div>
									{/each}
								</div>
							{:else}
								<p class="mt-2 text-sm text-gray-500">
									No inventors added yet (at least 1 required)
								</p>
							{/if}
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Institution / Organization <span class="text-red-500">*</span>
							</label>
							<input
								type="text"
								bind:value={formData.institution}
								placeholder="e.g., Johns Hopkins University"
								class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
								required
							/>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Estimated Market Value (USD) <span class="text-red-500">*</span>
							</label>
							<div class="relative">
								<DollarSign class="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
								<input
									type="number"
									bind:value={formData.valuationAmount}
									min="0"
									step="10000"
									placeholder="0"
									class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
									required
								/>
							</div>
							<p class="mt-1 text-xs text-gray-500">
								Estimated market value or commercialization potential
							</p>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Royalty Rate (%) <span class="text-red-500">*</span>
							</label>
							<input
								type="number"
								bind:value={formData.royaltyRate}
								min="0"
								max="100"
								step="0.1"
								placeholder="5"
								class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
								required
							/>
							<p class="mt-1 text-xs text-gray-500">
								Percentage of revenue paid to IP owners from licensing
							</p>
						</div>
					</div>
				{/if}

				<!-- Step 3: Licensing & Documents -->
				{#if currentStep === 3}
					<div class="space-y-6">
						<h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
							<Coins class="w-5 h-5" />
							Licensing Terms
						</h2>

						<div>
							<label class="flex items-center gap-2">
								<input
									type="checkbox"
									bind:checked={formData.licensingTerms.exclusive}
									class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
								/>
								<span class="text-sm font-medium text-gray-700">Exclusive License</span>
							</label>
							<p class="mt-1 text-xs text-gray-500 ml-6">
								Grant exclusive rights to a single licensee
							</p>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Field of Use <span class="text-red-500">*</span>
							</label>
							<input
								type="text"
								bind:value={formData.licensingTerms.fieldOfUse}
								placeholder="e.g., Pharmaceutical therapeutics, Medical devices"
								class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
								required
							/>
							<p class="mt-1 text-xs text-gray-500">
								Specify the fields or industries where the license applies
							</p>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Territory Restrictions
							</label>
							<input
								type="text"
								bind:value={formData.licensingTerms.territoryRestrictions}
								placeholder="e.g., North America, Worldwide"
								class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
							/>
							<p class="mt-1 text-xs text-gray-500">Leave blank for worldwide rights</p>
						</div>

						<div class="border-t pt-6">
							<h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
								<Upload class="w-5 h-5" />
								Supporting Documents
							</h3>

							<div class="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-3">
								<div class="grid grid-cols-2 gap-3 mb-3">
									<input
										type="text"
										bind:value={documentName}
										placeholder="Document name"
										class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
									/>
									<select
										bind:value={documentType}
										class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
									>
										<option value="patent_application">Patent Application</option>
										<option value="technical_specification">Technical Specification</option>
										<option value="research_publication">Research Publication</option>
										<option value="clinical_data">Clinical Data</option>
										<option value="other">Other</option>
									</select>
								</div>
								<button
									type="button"
									onclick={addDocument}
									class="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
								>
									Add Document
								</button>
							</div>

							{#if formData.documents.length > 0}
								<div class="space-y-2">
									{#each formData.documents as doc, i}
										<div class="flex items-center justify-between p-3 bg-white border rounded-lg">
											<div class="flex items-center gap-3">
												<FileText class="w-4 h-4 text-gray-400" />
												<div>
													<p class="text-sm font-medium text-gray-900">{doc.name}</p>
													<p class="text-xs text-gray-500">
														{doc.type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
													</p>
												</div>
											</div>
											<button
												type="button"
												onclick={() => removeDocument(i)}
												class="text-red-600 hover:text-red-800 text-sm"
											>
												Remove
											</button>
										</div>
									{/each}
								</div>
							{:else}
								<p class="text-sm text-gray-500 text-center py-4">
									No documents added yet (at least 1 required)
								</p>
							{/if}
						</div>

						<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
							<div class="flex gap-3">
								<Coins class="w-5 h-5 text-blue-600 mt-0.5" />
								<div>
									<h4 class="font-semibold text-blue-900">INFT Tokenization</h4>
									<p class="text-sm text-blue-700 mt-1">
										Your innovation will be minted as an INFT, enabling fractional ownership,
										automated royalty distribution, and transparent licensing on the blockchain.
									</p>
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
							class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
								Creating INFT...
							{:else}
								<CheckCircle class="w-4 h-4" />
								Create INFT
							{/if}
						</button>
					{/if}
				</div>
			</form>
		</div>
	</div>
</div>
