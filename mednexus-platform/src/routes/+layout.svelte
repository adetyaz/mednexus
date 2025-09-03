<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { walletStore } from '$lib/wallet';

	let { children } = $props();

	// Navigation items
	const navItems = [
		{ href: '/', label: 'Home', icon: 'home' },
		{ href: '/storage', label: 'Upload Files', icon: 'storage' },
		{ href: '/verification', label: 'Verify Credentials', icon: 'verify' }
	];

	function isActive(href: string) {
		if (href === '/') {
			return $page.url.pathname === '/';
		}
		return $page.url.pathname.startsWith(href);
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>MedNexus - Decentralized Medical Intelligence Platform</title>
</svelte:head>

<div class="app-layout">
	<!-- Navigation Header -->
	<nav class="main-nav">
		<div class="nav-container">
			<div class="nav-brand">
				<h1>MedNexus</h1>
				<span class="beta-tag">Beta</span>
			</div>

			<div class="nav-links">
				{#each navItems as item}
					<a
						href={item.href}
						class="nav-link"
						class:active={isActive(item.href)}
						data-sveltekit-preload-data="hover"
					>
						<span class="nav-icon {item.icon}"></span>
						{item.label}
					</a>
				{/each}
			</div>

			<div class="nav-actions">
				{#if $walletStore.isConnected}
					<div class="wallet-info">
						<span class="wallet-address">{$walletStore.address?.substring(0, 8)}...</span>
						<span class="wallet-status connected">Connected</span>
					</div>
				{:else}
					<button class="connect-wallet-btn" onclick={() => goto('/verification')}>
						Connect Wallet
					</button>
				{/if}
			</div>
		</div>
	</nav>

	<!-- Main Content -->
	<main class="main-content">
		{@render children?.()}
	</main>
</div>

<style>
	.app-layout {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.main-nav {
		background: #ffffff;
		border-bottom: 1px solid #e2e8f0;
		position: sticky;
		top: 0;
		z-index: 100;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.nav-container {
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 2rem;
	}

	.nav-brand {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.nav-brand h1 {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1e293b;
		margin: 0;
	}

	.beta-tag {
		background: #3b82f6;
		color: white;
		font-size: 0.7rem;
		padding: 0.2rem 0.4rem;
		border-radius: 0.25rem;
		font-weight: 500;
	}

	.nav-links {
		display: flex;
		gap: 2rem;
		align-items: center;
	}

	.nav-link {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		text-decoration: none;
		color: #64748b;
		font-weight: 500;
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		transition: all 0.2s;
	}

	.nav-link:hover {
		color: #3b82f6;
		background: #f1f5f9;
	}

	.nav-link.active {
		color: #3b82f6;
		background: #dbeafe;
	}

	.nav-icon {
		display: none;
	}

	.nav-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.wallet-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: #f8fafc;
		border-radius: 0.375rem;
		border: 1px solid #e2e8f0;
	}

	.wallet-address {
		font-family: monospace;
		font-size: 0.875rem;
		color: #64748b;
	}

	.wallet-status.connected {
		color: #10b981;
		font-size: 0.8rem;
		font-weight: 500;
	}

	.connect-wallet-btn {
		background: #3b82f6;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s;
	}

	.connect-wallet-btn:hover {
		background: #2563eb;
	}

	.main-content {
		flex: 1;
		background: #f8fafc;
	}

	@media (max-width: 768px) {
		.nav-container {
			padding: 1rem;
		}

		.nav-links {
			gap: 1rem;
		}

		.nav-link {
			padding: 0.5rem;
		}

		.nav-link span {
			display: none;
		}
	}
</style>
