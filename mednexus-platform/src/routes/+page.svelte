<script lang="ts">
	import WalletConnect from '$lib/components/WalletConnect.svelte';
	import { walletStore } from '$lib/wallet';
	import { accessControl } from '$lib/services/accessControl';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { DashboardUser } from '$lib/types/dashboard';

	let currentUser: DashboardUser | null = $state(null);
	let userRole: string | null = $state(null);

	// Check for authenticated user and redirect to appropriate dashboard
	onMount(async () => {
		if ($walletStore.isConnected && $walletStore.address) {
			try {
				const user = accessControl.getCurrentUser();
				if (user) {
					currentUser = user;
					userRole = user.role.id;
					// Auto-redirect to dashboard after authentication
					setTimeout(() => {
						if (userRole && ['doctor', 'senior_doctor', 'department_head'].includes(userRole)) {
							goto('/dashboard/doctor');
						} else if (userRole && ['hospital_admin', 'department_head'].includes(userRole)) {
							goto('/dashboard/hospital');
						}
					}, 1000); // Brief delay to show success message
				}
			} catch (error) {
				console.error('Failed to check user session:', error);
			}
		}
	});

	function getDashboardUrl() {
		if (!currentUser || !userRole) return null;

		if (['doctor', 'senior_doctor', 'department_head'].includes(userRole)) {
			return '/dashboard/doctor';
		} else if (['hospital_admin', 'department_head'].includes(userRole)) {
			return '/dashboard/hospital';
		}
		return null;
	}

	function getDashboardLabel() {
		if (!currentUser || !userRole) return '';

		if (['doctor', 'senior_doctor', 'department_head'].includes(userRole)) {
			return 'Doctor Dashboard';
		} else if (['hospital_admin', 'department_head'].includes(userRole)) {
			return 'Hospital Dashboard';
		}
		return '';
	}
</script>

<main class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
	<!-- Hero Section -->
	<section class="container mx-auto px-4 py-16">
		<div class="text-center mb-12">
			<h1 class="text-5xl font-bold text-gray-900 mb-6">MedNexus Platform</h1>
			<p class="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
				Revolutionary healthcare collaboration platform powered by blockchain technology. Secure
				medical data sharing, intelligent NFTs, and seamless collaboration between healthcare
				professionals.
			</p>
			<WalletConnect />
		</div>
	</section>

	<!-- Dashboard Access Section (for authenticated users) -->
	{#if $walletStore.isConnected && currentUser}
		<section class="container mx-auto px-4 py-8">
			<div class="max-w-4xl mx-auto">
				<div class="bg-white rounded-lg shadow-lg p-8 text-center">
					<div class="mb-6">
						<h2 class="text-3xl font-bold text-gray-900 mb-2">
							Welcome back, {currentUser?.profile?.name || 'Healthcare Professional'}!
						</h2>
						<p class="text-gray-600">
							You are logged in as a <span class="font-semibold text-blue-600"
								>{userRole?.replace('_', ' ').toUpperCase()}</span
							>
						</p>
					</div>

					{#if getDashboardUrl()}
						<div class="mb-6">
							<p class="text-lg text-gray-700 mb-4">
								Ready to access your dashboard? Click below to continue to your personalized
								workspace.
							</p>
							<a
								href={getDashboardUrl()}
								class="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
							>
								<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
									></path>
								</svg>
								Go to {getDashboardLabel()}
							</a>
						</div>
					{/if}

					<div class="text-sm text-gray-500">
						<p>Auto-redirecting to your dashboard in a moment...</p>
					</div>
				</div>
			</div>
		</section>
	{/if}

	<!-- Features Section -->
	<section class="container mx-auto px-4 py-16">
		<div class="text-center mb-12">
			<h2 class="text-3xl font-bold text-gray-900 mb-4">Platform Features</h2>
			<p class="text-gray-600 max-w-2xl mx-auto">
				Discover the powerful features that make MedNexus the leading healthcare collaboration
				platform
			</p>
		</div>

		<div class="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
			<div class="bg-white rounded-lg shadow-lg p-6 text-center">
				<div
					class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"
				>
					<svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
						></path>
					</svg>
				</div>
				<h3 class="text-xl font-semibold text-gray-900 mb-2">Medical Verification</h3>
				<p class="text-gray-600">
					Secure verification of medical credentials and documents using blockchain technology
				</p>
			</div>

			<div class="bg-white rounded-lg shadow-lg p-6 text-center">
				<div
					class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
				>
					<svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 10V3L4 14h7v7l9-11h-7z"
						></path>
					</svg>
				</div>
				<h3 class="text-xl font-semibold text-gray-900 mb-2">Intelligence NFTs</h3>
				<p class="text-gray-600">
					Tokenize medical intelligence and research data as unique, tradable NFTs
				</p>
			</div>

			<div class="bg-white rounded-lg shadow-lg p-6 text-center">
				<div
					class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4"
				>
					<svg
						class="w-8 h-8 text-purple-600"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
						></path>
					</svg>
				</div>
				<h3 class="text-xl font-semibold text-gray-900 mb-2">Collaboration Hub</h3>
				<p class="text-gray-600">
					Seamless collaboration between healthcare professionals and institutions
				</p>
			</div>
		</div>
	</section>

	<!-- Connect Wallet Section (for non-authenticated users) -->
	{#if !$walletStore.isConnected}
		<section class="container mx-auto px-4 py-16">
			<div class="max-w-4xl mx-auto text-center">
				<div class="bg-white rounded-lg shadow-lg p-8">
					<h2 class="text-3xl font-bold text-gray-900 mb-4">Get Started Today</h2>
					<p class="text-gray-600 mb-6">
						Connect your wallet to access the MedNexus platform and explore your personalized
						healthcare dashboard.
					</p>
					<div class="flex justify-center">
						<WalletConnect />
					</div>
				</div>
			</div>
		</section>
	{/if}
</main>

<style>
	/* Modern Tailwind-based styles are handled by the classes above */
	/* Additional custom styles if needed */

	/* Custom animations for dashboard access section */
	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Apply fade-in animation to dashboard access section */
	section:has(.bg-white.rounded-lg.shadow-lg) {
		animation: fadeInUp 0.6s ease-out;
	}
</style>
