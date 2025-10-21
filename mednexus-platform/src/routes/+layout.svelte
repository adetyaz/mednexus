<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { walletStore } from '$lib/wallet';
	import { accessControl } from '$lib/services/accessControl';
	import WalletConnect from '$lib/components/WalletConnect.svelte';

	let { children } = $props();

	// Mobile menu state
	let mobileMenuOpen = $state(false);

	// Dashboard navigation items (shown when wallet is connected)
	const dashboardNavItems = [
		{
			href: '/dashboard/doctor',
			label: 'Doctor Dashboard',
			icon: 'doctor'
		}
	];

	// Only show dashboard items when wallet is connected
	let dashboardItems = $derived($walletStore.isConnected ? dashboardNavItems : []);

	function isActive(href: string) {
		if (href === '/') {
			return page.url.pathname === '/';
		}
		return page.url.pathname.startsWith(href);
	}

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen flex flex-col bg-gray-50">
	<!-- Navigation Header -->
	<nav class="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
		<div class="max-w-7xl mx-auto px-6 lg:px-8">
			<div class="flex items-center justify-between h-16">
				<!-- Logo Section -->
				<div class="flex items-center space-x-4">
					<div class="flex items-center space-x-3">
						<h1 class="text-xl lg:text-2xl font-bold text-blue-600 tracking-tight">MedNexus</h1>
						<span
							class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
							>Beta</span
						>
					</div>
				</div>

				<!-- Main Navigation -->
				<div class="hidden lg:flex items-center space-x-8">
					<a
						href="/"
						class="text-sm font-medium transition-colors duration-200 {isActive('/')
							? 'text-blue-600 border-b-2 border-blue-600 pb-1'
							: 'text-gray-600 hover:text-gray-900'}"
					>
						Home
					</a>
					<a
						href="/storage"
						class="text-sm font-medium transition-colors duration-200 {isActive('/storage')
							? 'text-blue-600 border-b-2 border-blue-600 pb-1'
							: 'text-gray-600 hover:text-gray-900'}"
					>
						Storage
					</a>
					<a
						href="/verification"
						class="text-sm font-medium transition-colors duration-200 {isActive('/verification')
							? 'text-blue-600 border-b-2 border-blue-600 pb-1'
							: 'text-gray-600 hover:text-gray-900'}"
					>
						Verification
					</a>
					<a
						href="/consultations"
						class="text-sm font-medium transition-colors duration-200 {isActive('/consultations')
							? 'text-blue-600 border-b-2 border-blue-600 pb-1'
							: 'text-gray-600 hover:text-gray-900'}"
					>
						Consultations
					</a>
					<a
						href="/diagnostic-center"
						class="text-sm font-medium transition-colors duration-200 {isActive(
							'/diagnostic-center'
						)
							? 'text-blue-600 border-b-2 border-blue-600 pb-1'
							: 'text-gray-600 hover:text-gray-900'}"
					>
						🩺 Diagnostics
					</a>

					<!-- Dashboard Section -->
					{#if dashboardItems.length > 0}
						<div class="flex items-center space-x-2 ml-4 pl-4 border-l border-gray-300">
							{#each dashboardItems as item}
								<a
									href={item.href}
									class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 {isActive(
										item.href
									)
										? 'bg-blue-600 text-white'
										: 'bg-blue-50 text-blue-700 hover:bg-blue-100'}"
								>
									{item.label.replace(' Dashboard', '')}
								</a>
							{/each}
						</div>
					{/if}
				</div>

				<!-- User & Wallet Section -->
				<div class="flex items-center space-x-4">
					<div class="flex items-center">
						<WalletConnect />
					</div>

					<!-- Mobile menu button -->
					<button
						type="button"
						class="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
						onclick={toggleMobileMenu}
						aria-expanded={mobileMenuOpen}
					>
						<span class="sr-only">Open main menu</span>
						{#if mobileMenuOpen}
							<!-- X Icon -->
							<svg
								class="block h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
							>
								<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
							</svg>
						{:else}
							<!-- Hamburger Icon -->
							<svg
								class="block h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
								/>
							</svg>
						{/if}
					</button>
				</div>
			</div>

			<!-- Mobile menu -->
			{#if mobileMenuOpen}
				<div class="lg:hidden">
					<div class="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200 bg-gray-50">
						<!-- Main navigation links -->
						<a
							href="/"
							class="block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 {isActive(
								'/'
							)
								? 'bg-blue-100 text-blue-700'
								: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}"
							onclick={() => (mobileMenuOpen = false)}
						>
							Home
						</a>
						<a
							href="/storage"
							class="block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 {isActive(
								'/storage'
							)
								? 'bg-blue-100 text-blue-700'
								: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}"
							onclick={() => (mobileMenuOpen = false)}
						>
							Storage
						</a>
						<a
							href="/verification"
							class="block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 {isActive(
								'/verification'
							)
								? 'bg-blue-100 text-blue-700'
								: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}"
							onclick={() => (mobileMenuOpen = false)}
						>
							Verification
						</a>
						<a
							href="/consultations"
							class="block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 {isActive(
								'/consultations'
							)
								? 'bg-blue-100 text-blue-700'
								: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}"
							onclick={() => (mobileMenuOpen = false)}
						>
							Consultations
						</a>
						<a
							href="/diagnostic-center"
							class="block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 {isActive(
								'/diagnostic-center'
							)
								? 'bg-blue-100 text-blue-700'
								: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}"
							onclick={() => (mobileMenuOpen = false)}
						>
							🩺 Diagnostic Center
						</a>

						<!-- Dashboard links -->
						{#if dashboardItems.length > 0}
							<div class="pt-4 pb-3 border-t border-gray-200">
								<div class="px-3 pb-2">
									<p class="text-sm font-medium text-gray-500 uppercase tracking-wide">Dashboard</p>
								</div>
								{#each dashboardItems as item}
									<a
										href={item.href}
										class="block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 {isActive(
											item.href
										)
											? 'bg-blue-600 text-white'
											: 'bg-blue-50 text-blue-700 hover:bg-blue-100'}"
										onclick={() => (mobileMenuOpen = false)}
									>
										{item.label.replace(' Dashboard', '')}
									</a>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</nav>

	<!-- Main Content -->
	<main class="flex-1 w-full max-w-7xl mx-auto p-4">
		{@render children?.()}
	</main>
</div>
