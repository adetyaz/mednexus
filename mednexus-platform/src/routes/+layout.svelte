<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { walletStore } from '$lib/wallet';
	import { accessControl } from '$lib/services/accessControl';
	import WalletConnect from '$lib/components/WalletConnect.svelte';

	let { children } = $props();

	// Base navigation items
	const baseNavItems = [
		{ href: '/', label: 'Home', icon: 'home' },
		{ href: '/verification', label: 'Verify Credentials', icon: 'verify' },
		{ href: '/register', label: 'Register', icon: 'register' },
		{ href: '/storage', label: 'Document Storage', icon: 'storage' },
		{ href: '/monitoring', label: 'Monitoring', icon: 'monitor' }
	];

	// Dashboard navigation items (shown based on user role)
	const dashboardNavItems = [
		{
			href: '/dashboard/doctor',
			label: 'Doctor Dashboard',
			icon: 'doctor',
			roles: ['doctor', 'senior_doctor', 'department_head']
		},
		{
			href: '/dashboard/hospital',
			label: 'Hospital Dashboard',
			icon: 'hospital',
			roles: ['hospital_admin', 'department_head']
		}
	];

	// Reactive state
	let currentUser = $state(accessControl.getCurrentUser());
	let userRole = $derived(currentUser?.role?.id ?? '');

	// Combine navigation items based on user authentication and role
	let navItems = $derived([
		...baseNavItems,
		...(currentUser && userRole
			? dashboardNavItems.filter((item) => item.roles.includes(userRole))
			: [])
	]);

	// Separate dashboard items for special styling
	let dashboardItems = $derived(
		currentUser && userRole ? dashboardNavItems.filter((item) => item.roles.includes(userRole)) : []
	);

	// Update reactive state when user changes
	$effect(() => {
		currentUser = accessControl.getCurrentUser();
	});

	function isActive(href: string) {
		if (href === '/') {
			return page.url.pathname === '/';
		}
		return page.url.pathname.startsWith(href);
	}

	// Initialize user session on mount
	import { onMount } from 'svelte';
	onMount(async () => {
		if ($walletStore.isConnected && $walletStore.address && !currentUser) {
			try {
				await accessControl.setCurrentUser($walletStore.address);
			} catch (error) {
				console.error('Failed to initialize user session:', error);
			}
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen flex flex-col bg-gray-50">
	<!-- Navigation Header -->
	<nav class="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
		<div class="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
			<div class="flex items-center gap-3 font-semibold text-xl text-gray-900">
				<h1 class="text-xl font-bold text-gray-900">MedNexus</h1>
				<span class="bg-blue-500 text-white px-2 py-0.5 rounded text-xs font-medium">Beta</span>
				</div>

				<div class="hidden md:flex items-center gap-4">
					{#each baseNavItems as item}
						<a
							href={item.href}
							class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-all duration-200 {isActive(item.href) ? 'bg-blue-50 text-blue-700 font-semibold' : ''}"
							data-sveltekit-preload-data="hover"
						>
							{item.label}
						</a>
					{/each}

					<!-- Dashboard Section -->
					{#if dashboardItems.length > 0}
						<div class="flex gap-2 ml-4 pl-4 border-l border-gray-200">
							{#each dashboardItems as item}
								<a
									href={item.href}
									class="bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg transition-all duration-200 hover:bg-emerald-600 {isActive(item.href) ? 'bg-emerald-700' : ''}"
									data-sveltekit-preload-data="hover"
								>
									{item.label}
								</a>
							{/each}
						</div>
					{/if}
				</div>

				<div class="flex items-center gap-4">
					{#if currentUser}
						<div class="hidden md:flex flex-col items-end gap-0.5">
							<span class="text-sm font-semibold text-gray-900">{currentUser.profile.name}</span>
							<span class="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">{currentUser.role.name}</span>
						</div>
					{/if}
					<div class="flex items-center gap-2 text-sm">
						{#if $walletStore.isConnected}
							<span class="text-emerald-500 text-xs">●</span>
							<span class="text-gray-600 font-mono text-xs">
								{$walletStore.address?.slice(0, 6)}...{$walletStore.address?.slice(-4)}
							</span>
						{:else}
							<WalletConnect />
						{/if}
					</div>
				</div>

				<!-- Mobile menu button - you can add this later if needed -->
			</div>

			<!-- Mobile navigation - you can add this later if needed -->
		</nav>

		<!-- Main Content -->
		<main class="flex-1 w-full max-w-6xl mx-auto p-4">
			{@render children?.()}
		</main>
	</div>


