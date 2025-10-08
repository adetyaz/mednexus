<script lang="ts">
	import { onMount } from 'svelte';
	import { walletStore } from '$lib/wallet';
	import { goto } from '$app/navigation';
	import { medicalDocumentManager } from '$lib/services/medicalDocumentManagementService';

	let loading = $state(true);
	let doctorContext = $state<any>(null);

	// Available features for doctors
	const doctorFeatures = [
		{
			title: 'Medical Storage',
			description: 'Upload, manage, and access your medical documents securely',
			href: '/storage',
			icon: '📁',
			available: true
		},
		{
			title: 'Document Verification',
			description: 'Verify medical credentials and institutional documents',
			href: '/verification',
			icon: '✅',
			available: true
		},
		{
			title: 'Cross-Border Consultation',
			description: 'Request consultations from specialists worldwide',
			href: '/consultations',
			icon: '🌍',
			available: true
		},
		{
			title: 'AI Pattern Recognition',
			description: 'AI-powered analysis of medical cases and patterns',
			href: '#ai-analysis',
			icon: '🧠',
			available: false
		}
	];

	onMount(async () => {
		// Load doctor context if wallet is connected
		if ($walletStore.isConnected && $walletStore.address) {
			try {
				const context = await medicalDocumentManager.getDoctorContext($walletStore.address);
				if (context.success) {
					doctorContext = context;
				}
			} catch (error) {
				console.error('Failed to load doctor context:', error);
			}
		}

		setTimeout(() => {
			loading = false;
		}, 500);
	});

	function navigateToFeature(feature: (typeof doctorFeatures)[0]) {
		if (feature.available) {
			goto(feature.href);
		}
	}
</script>

<svelte:head>
	<title>Doctor Dashboard - MedNexus</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	{#if loading}
		<div class="flex items-center justify-center min-h-screen">
			<div class="text-center">
				<div
					class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
				></div>
				<p class="mt-4 text-gray-600">Loading your dashboard...</p>
			</div>
		</div>
	{:else if !$walletStore.isConnected}
		<div class="flex items-center justify-center min-h-screen">
			<div class="text-center bg-white p-8 rounded-lg shadow-lg max-w-md mx-4">
				<div
					class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
				>
					<svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
						></path>
					</svg>
				</div>
				<h3 class="text-xl font-semibold text-gray-900 mb-2">Wallet Connection Required</h3>
				<p class="text-gray-600 mb-6">Please connect your wallet to access the doctor dashboard.</p>
				<a
					href="/"
					class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
				>
					Connect Wallet
				</a>
			</div>
		</div>
	{:else}
		<!-- Main Dashboard Content -->
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<!-- Header -->
			<div class="bg-white rounded-lg shadow-sm p-6 mb-8">
				<div class="flex items-center justify-between">
					<div>
						{#if doctorContext && doctorContext.doctor}
							<h1 class="text-2xl font-bold text-gray-900">
								Welcome, Dr. {doctorContext.doctor.name}
							</h1>
							<div class="flex items-center space-x-4 mt-2">
								<div class="flex items-center space-x-2 text-sm text-gray-600">
									<svg
										class="w-4 h-4 text-blue-600"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-1-8h1m-1 4h1"
										></path>
									</svg>
									<span class="font-medium">{doctorContext.doctor.department}</span>
								</div>
								<div class="flex items-center space-x-2 text-sm text-gray-600">
									<svg
										class="w-4 h-4 text-green-600"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-1-8h1m-1 4h1"
										></path>
									</svg>
									<span>{doctorContext.doctor.specialty}</span>
								</div>
								{#if doctorContext.doctor.verificationStatus === 'verified'}
									<span
										class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
									>
										<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M5 13l4 4L19 7"
											></path>
										</svg>
										Verified Doctor
									</span>
								{/if}
							</div>
							{#if doctorContext.institution}
								<p class="text-gray-600 mt-1 text-sm">
									<svg
										class="w-4 h-4 inline mr-1"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-1-8h1m-1 4h1"
										></path>
									</svg>
									{doctorContext.institution.name}
								</p>
							{/if}
						{:else}
							<h1 class="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
							<p class="text-gray-600 mt-1">Access your medical tools and features</p>
						{/if}
					</div>
					<div
						class="flex items-center space-x-2 bg-green-50 border border-green-200 px-3 py-2 rounded-lg"
					>
						<div class="w-2 h-2 bg-green-500 rounded-full"></div>
						<span class="text-sm font-medium text-green-700">Connected</span>
						<span class="text-sm font-mono text-green-600">
							{$walletStore.address?.slice(0, 6)}...{$walletStore.address?.slice(-4)}
						</span>
					</div>
				</div>
			</div>

			<!-- Verification Status Section -->
			{#if !doctorContext || !doctorContext.doctor}
				<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
					<div class="flex items-start">
						<div class="flex-shrink-0">
							<svg
								class="w-6 h-6 text-yellow-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.19 2.5 1.732 2.5z"
								></path>
							</svg>
						</div>
						<div class="ml-3 flex-1">
							<h3 class="text-sm font-medium text-yellow-800">Doctor Verification Required</h3>
							<div class="mt-2 text-sm text-yellow-700">
								<p>
									To access full functionality and have your name displayed, please complete doctor
									verification and institutional registration.
								</p>
							</div>
						
						</div>
					</div>
				</div>
			{/if}

			<!-- Features Grid -->
			<div class="mb-8">
				<div class="flex items-center justify-between mb-6">
					<h2 class="text-lg font-semibold text-gray-900">Available Features</h2>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					{#each doctorFeatures as feature}
						<div
							class="bg-white rounded-lg shadow-sm border transition-all duration-200 {feature.available
								? 'hover:shadow-md hover:border-blue-300 cursor-pointer'
								: 'opacity-75'}"
							class:cursor-pointer={feature.available}
							onclick={() => navigateToFeature(feature)}
							role={feature.available ? 'button' : ''}
						>
							<div class="p-6">
								<div class="flex items-center justify-between mb-4">
									<div class="text-3xl">{feature.icon}</div>
									{#if feature.available}
										<span
											class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
										>
											Available
										</span>
									{:else}
										<span
											class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
										>
											Coming Soon
										</span>
									{/if}
								</div>

								<h3 class="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
								<p class="text-gray-600 text-sm mb-4">{feature.description}</p>

								{#if feature.available}
									<div class="flex items-center text-blue-600 text-sm font-medium">
										<span>Access Feature</span>
										<svg class="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M9 5l7 7-7 7"
											></path>
										</svg>
									</div>
								{:else}
									<div class="text-gray-400 text-sm font-medium">Coming Soon</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Quick Actions -->
			<div class="bg-white rounded-lg shadow-sm p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					<a
						href="/storage"
						class="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
					>
						<div class="text-2xl mr-4">📁</div>
						<div>
							<div class="font-medium text-gray-900">Upload Documents</div>
							<div class="text-sm text-gray-600">Store medical files securely</div>
						</div>
					</a>

					<a
						href="/verification"
						class="flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200"
					>
						<div class="text-2xl mr-4">✅</div>
						<div>
							<div class="font-medium text-gray-900">Verify Credentials</div>
							<div class="text-sm text-gray-600">Validate medical documents</div>
						</div>
					</a>

					<button
						class="flex items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 cursor-not-allowed opacity-60"
						disabled
					>
						<div class="text-2xl mr-4">🌍</div>
						<div>
							<div class="font-medium text-gray-900">Global Consultation</div>
							<div class="text-sm text-gray-600">Coming Soon</div>
						</div>
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
