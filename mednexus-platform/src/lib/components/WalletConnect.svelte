<script lang="ts">
	import { walletManager, formatAddress } from '$lib/wallet';

	let walletState = $state({
		isConnected: false,
		address: null as string | null,
		isLoading: false
	});

	$effect(() => {
		const unsubscribe = walletManager.walletStore.subscribe((state) => {
			walletState.isConnected = state.isConnected;
			walletState.address = state.address;
		});
		return unsubscribe;
	});

	async function connect() {
		walletState.isLoading = true;
		try {
			await walletManager.connect();
		} catch (error) {
			console.error('Connect failed:', error);
		}
		walletState.isLoading = false;
	}

	async function disconnect() {
		try {
			await walletManager.disconnect();
		} catch (error) {
			console.error('Disconnect failed:', error);
		}
	}
</script>

{#if walletState.isConnected}
	<button class="wallet-btn connected" onclick={disconnect}>
		{formatAddress(walletState.address || '')}
	</button>
{:else}
	<button class="wallet-btn" onclick={connect} disabled={walletState.isLoading}>
		{walletState.isLoading ? 'Connecting...' : 'Connect'}
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
