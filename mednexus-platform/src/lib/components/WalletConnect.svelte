<script lang="ts">
	import { walletStore, walletManager, formatAddress } from '$lib/wallet';

	let isLoading = $state(false);

	async function connect() {
		console.log('WalletConnect: Connect button clicked');
		isLoading = true;
		try {
			await walletManager.connect();
			console.log('WalletConnect: Connect successful');
		} catch (error) {
			console.error('WalletConnect: Connect failed:', error);
		}
		isLoading = false;
	}

	async function disconnect() {
		console.log('WalletConnect: Disconnect button clicked');
		try {
			await walletManager.disconnect();
			console.log('WalletConnect: Disconnect successful');
		} catch (error) {
			console.error('WalletConnect: Disconnect failed:', error);
		}
	}
</script>

{#if $walletStore.isConnected}
	<button
		class="flex items-center space-x-2 bg-green-50 border border-green-200 px-3 py-2 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors duration-200"
		onclick={disconnect}
		title="Click to disconnect wallet"
	>
		<span class="flex h-2 w-2">
			<span class="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"
			></span>
			<span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
		</span>
		<span class="text-sm font-mono text-green-700">
			{$walletStore.address?.slice(0, 6)}...{$walletStore.address?.slice(-4)}
		</span>
		<span
			class="text-green-500 hover:text-red-500 ml-1 opacity-50 hover:opacity-100 transition-all duration-200"
			>×</span
		>
	</button>
{:else}
	<button class="wallet-btn" onclick={connect} disabled={isLoading}>
		{isLoading ? 'Connecting...' : 'Connect Wallet'}
	</button>
{/if}

<style>
	.wallet-btn {
		padding: 0.5rem 1rem;
		border: 1px solid #ddd;
		border-radius: 6px;
		background: white;
		color: #333;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.wallet-btn:hover {
		border-color: #2563eb;
		color: #2563eb;
	}

	.wallet-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.wallet-connected-container {
		position: relative;
	}

	.wallet-btn.connected {
		background: #f0f9ff;
		border-color: #2563eb;
		color: #2563eb;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding-right: 0.75rem;
	}

	.wallet-btn.connected:hover {
		background: #fee2e2;
		border-color: #dc2626;
		color: #dc2626;
	}

	.address {
		flex: 1;
	}

	.disconnect-icon {
		font-size: 1.2rem;
		font-weight: bold;
		opacity: 0.5;
		transition: opacity 0.2s ease;
	}

	.wallet-btn.connected:hover .disconnect-icon {
		opacity: 1;
	}
</style>
