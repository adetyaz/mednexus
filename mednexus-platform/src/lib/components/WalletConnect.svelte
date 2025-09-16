<script lang="ts">
	import { walletStore, walletManager, formatAddress } from '$lib/wallet';

	let isLoading = $state(false);

	// Debug logging
	$effect(() => {
		console.log('WalletConnect: walletStore state:', $walletStore);
	});

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
	<button class="wallet-btn connected" onclick={disconnect}>
		{formatAddress($walletStore.address)}
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

	.wallet-btn.connected {
		background: #f0f9ff;
		border-color: #2563eb;
		color: #2563eb;
	}

	.wallet-btn.connected:hover {
		background: #fee2e2;
		border-color: #dc2626;
		color: #dc2626;
	}
</style>
