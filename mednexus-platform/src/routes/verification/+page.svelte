<script lang="ts">
	import { MedicalInstitutionService } from '$lib/services/medicalInstitutionService';
	import { walletStore } from '$lib/wallet';
	import { goto } from '$app/navigation';
	import { Building2, CheckCircle, User, Shield } from '@lucide/svelte';

	// Form data
	let doctorName = $state('');
	let medicalLicense = $state('');
	let specialty = $state('');
	let department = $state('');
	let selectedInstitutionId = $state('');

	// State management
	let institutions = $state<any[]>([]);
	let errorMessage = $state('');
	let successMessage = $state('');
	let currentStep = $state<'form' | 'blockchain' | 'complete'>('form');
	let isRegistering = $state(false);
	let transactionHash = $state('');

	const institutionService = new MedicalInstitutionService();

	// Load verified institutions from database
	$effect(() => {
		(async () => {
			try {
				institutions = await institutionService.getVerifiedInstitutionsFromDB();
			} catch (error) {
				console.error('Failed to load institutions:', error);
				errorMessage = 'Failed to load institutions';
			}
		})();
	});

	async function registerDoctor(event: SubmitEvent) {
		event.preventDefault();

		if (!doctorName || !medicalLicense || !specialty || !department || !selectedInstitutionId) {
			errorMessage = 'Please fill in all required fields';
			return;
		}

		if (!$walletStore.isConnected) {
			errorMessage = 'Please connect your wallet first';
			return;
		}

		isRegistering = true;
		errorMessage = '';
		successMessage = '';
		currentStep = 'blockchain';

		try {
			const result = await institutionService.registerDoctor({
				name: doctorName,
				medicalLicenseNumber: medicalLicense,
				medicalSpecialty: specialty,
				department,
				institutionId: selectedInstitutionId,
				yearsOfExperience: 0,
				contactInfo: {
					email: '',
					phone: ''
				},
				profileInfo: {
					education: []
				}
			});

			transactionHash = result.transactionHash;
			successMessage = 'Doctor registered successfully on blockchain and database';
			currentStep = 'complete';
		} catch (error) {
			console.error('Doctor registration failed:', error);
			errorMessage = error instanceof Error ? error.message : 'Registration failed';
			currentStep = 'form';
		} finally {
			isRegistering = false;
		}
	}

	function goToDashboard() {
		goto('/dashboard');
	}

	function startOver() {
		currentStep = 'form';
		errorMessage = '';
		successMessage = '';
		doctorName = '';
		medicalLicense = '';
		specialty = '';
		department = '';
		selectedInstitutionId = '';
		transactionHash = '';
	}

	// Get departments for selected institution
	const availableDepartments = $derived.by(() => {
		if (!selectedInstitutionId) return [];
		const institution = institutions.find((inst) => inst.id === selectedInstitutionId);
		return institution?.departments || [];
	});
</script>

<main class="max-w-7xl mx-auto px-6 py-8">
	<!-- Breadcrumb Navigation -->
	<nav class="flex mb-8" aria-label="Breadcrumb">
		<ol class="flex items-center space-x-2 text-sm text-gray-500">
			<li><a href="/" class="hover:text-blue-600">Home</a></li>
			<li><span class="mx-2">›</span></li>
			<li class="text-gray-900 font-medium">Doctor Registration</li>
		</ol>
	</nav>

	<div class="mb-8 pb-6 border-b border-gray-200">
		<h1 class="text-3xl font-bold text-gray-900 mb-2">Doctor Registration</h1>
		<p class="text-gray-600">Register as a verified doctor on the blockchain</p>

		<!-- Progress Indicator -->
		<div class="flex justify-center items-center gap-8 mt-8 p-4 bg-gray-50 rounded-xl border">
			<div class="flex flex-col items-center gap-2 opacity-100">
				<div
					class="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm border-2 transition-all {currentStep ===
					'form'
						? 'bg-blue-600 text-white border-blue-600'
						: 'bg-green-500 text-white border-green-500'}"
				>
					1
				</div>
				<span
					class="text-sm font-medium text-center whitespace-nowrap {currentStep === 'form'
						? 'text-blue-600'
						: 'text-green-600'}"
				>
					Registration Form
				</span>
			</div>
			<div
				class="flex flex-col items-center gap-2 {currentStep === 'form'
					? 'opacity-50'
					: 'opacity-100'}"
			>
				<div
					class="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm border-2 transition-all {currentStep ===
					'form'
						? 'bg-gray-200 text-gray-500 border-gray-300'
						: currentStep === 'blockchain'
							? 'bg-blue-600 text-white border-blue-600'
							: 'bg-green-500 text-white border-green-500'}"
				>
					2
				</div>
				<span
					class="text-sm font-medium text-center whitespace-nowrap {currentStep === 'form'
						? 'text-gray-400'
						: currentStep === 'blockchain'
							? 'text-blue-600'
							: 'text-green-600'}"
				>
					Blockchain Registration
				</span>
			</div>
			<div
				class="flex flex-col items-center gap-2 {currentStep === 'complete'
					? 'opacity-100'
					: 'opacity-50'}"
			>
				<div
					class="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm border-2 transition-all {currentStep ===
					'complete'
						? 'bg-green-500 text-white border-green-500'
						: 'bg-gray-200 text-gray-500 border-gray-300'}"
				>
					3
				</div>
				<span
					class="text-sm font-medium text-center whitespace-nowrap {currentStep === 'complete'
						? 'text-green-600'
						: 'text-gray-400'}"
				>
					Complete
				</span>
			</div>
		</div>

		{#if !$walletStore.isConnected}
			<div class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
				<p class="text-yellow-800 font-medium">Connect your wallet to register as a doctor</p>
			</div>
		{/if}
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
		<div class="lg:col-span-2">
			<div class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
				{#if currentStep === 'form'}
					<h2 class="text-xl font-semibold text-gray-900 mb-6">Doctor Registration Form</h2>

					{#if errorMessage}
						<div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
							<p class="text-red-800 font-medium">{errorMessage}</p>
						</div>
					{/if}

					<form onsubmit={registerDoctor} class="space-y-6">
						<div>
							<label for="doctor-name" class="block text-sm font-medium text-gray-700 mb-2">
								Doctor Name *
							</label>
							<input
								type="text"
								id="doctor-name"
								bind:value={doctorName}
								placeholder="Enter your full name"
								required
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>

						<div>
							<label for="medical-license" class="block text-sm font-medium text-gray-700 mb-2">
								Medical License Number *
							</label>
							<input
								type="text"
								id="medical-license"
								bind:value={medicalLicense}
								placeholder="Enter your medical license number"
								required
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>

						<div>
							<label for="institution-select" class="block text-sm font-medium text-gray-700 mb-2">
								Select Institution *
							</label>
							<select
								id="institution-select"
								bind:value={selectedInstitutionId}
								required
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							>
								<option value="">Choose an institution</option>
								{#each institutions as institution}
									<option value={institution.id}>{institution.name}</option>
								{/each}
							</select>
						</div>

						<div>
							<label for="department-select" class="block text-sm font-medium text-gray-700 mb-2">
								Department *
							</label>
							<select
								id="department-select"
								bind:value={department}
								required
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							>
								<option value="">Select department</option>
								{#each availableDepartments as dept}
									<option value={dept}>{dept}</option>
								{/each}
							</select>
						</div>

						<div>
							<label for="specialty" class="block text-sm font-medium text-gray-700 mb-2">
								Medical Specialty *
							</label>
							<input
								type="text"
								id="specialty"
								bind:value={specialty}
								placeholder="e.g., Cardiology, Emergency Medicine"
								required
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>

						<button
							type="submit"
							disabled={isRegistering || !$walletStore.isConnected}
							class="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
						>
							{#if isRegistering}
								Registering...
							{:else}
								Register Doctor
							{/if}
						</button>
					</form>
				{:else if currentStep === 'blockchain'}
					<h2 class="text-xl font-semibold text-gray-900 mb-6">Blockchain Registration</h2>
					<div class="text-center py-8 bg-blue-50 rounded-lg">
						<div
							class="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-blue-600 rounded-full mb-4"
							role="status"
							aria-label="loading"
						></div>
						<p class="text-gray-700 mb-2">Registering doctor on blockchain...</p>
						<p class="text-gray-500 text-sm">
							This requires 0.0005 A0GI stake and may take a few moments.
						</p>
					</div>
				{:else if currentStep === 'complete'}
					<h2 class="text-xl font-semibold text-gray-900 mb-6">Registration Complete!</h2>
					<div class="text-center py-8 bg-green-50 rounded-lg border border-green-200">
						<div class="text-4xl text-green-600 mb-4">✓</div>
						<p class="text-green-800 font-medium mb-2">
							Your doctor registration has been completed successfully!
						</p>
						<p class="text-green-700 mb-6">
							You are now registered on the blockchain and can access medical services.
						</p>

						{#if transactionHash}
							<div class="mt-4 p-4 bg-gray-50 rounded-lg border">
								<p class="font-medium text-gray-900 mb-2">Transaction Hash:</p>
								<code
									class="block bg-gray-800 text-green-400 p-2 rounded text-xs font-mono break-all"
									>{transactionHash}</code
								>
							</div>
						{/if}

						<div class="flex gap-4 mt-6 justify-center">
							<button
								onclick={goToDashboard}
								class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
							>
								Go to Dashboard
							</button>
							<button
								onclick={startOver}
								class="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-6 rounded-lg border transition-colors"
							>
								Register Another Doctor
							</button>
						</div>
					</div>
				{/if}

				{#if successMessage}
					<div class="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
						<p class="text-green-800 font-medium">{successMessage}</p>
					</div>
				{/if}
			</div>
		</div>

		<div class="lg:col-span-1">
			<div class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
				<h2 class="text-xl font-semibold text-gray-900 mb-6">Available Institutions</h2>
				<div class="space-y-4">
					{#each institutions as institution}
						<div class="bg-gray-50 rounded-lg p-4 border">
							<h3 class="font-medium text-gray-900 mb-1">{institution.name}</h3>
							<p class="text-gray-600 text-sm mb-3">{institution.address}</p>
							<div class="flex items-center gap-2 mb-3">
								<span class="text-xs font-medium text-green-700">Verified</span>
								<div class="w-2 h-2 bg-green-500 rounded-full"></div>
							</div>
							<div class="text-sm text-gray-700">
								<strong class="font-medium">Departments:</strong>
								<ul class="mt-1 pl-4 space-y-1">
									{#each institution.departments.slice(0, 3) as dept}
										<li class="text-xs">• {dept}</li>
									{/each}
									{#if institution.departments.length > 3}
										<li class="text-xs text-gray-500">
											• +{institution.departments.length - 3} more
										</li>
									{/if}
								</ul>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</main>
