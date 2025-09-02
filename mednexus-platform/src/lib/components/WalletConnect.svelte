<script lang="ts">
	import { walletManager, formatAddress, formatBalance } from '$lib/wallet';

	let showBalance = $state(false);
	let walletState = $state({
		isConnected: false,
		address: null as string | null,
		balance: '0',
		chainId: null as number | null,
		error: null as string | null,
		isLoading: false
	});

	// Subscribe to wallet store changes
	$effect(() => {
		const unsubscribe = walletManager.walletStore.subscribe((state) => {
			walletState = { 
				...state, 
				error: walletState.error, 
				isLoading: walletState.isLoading 
			};
		});
		
		return unsubscribe;
	});

	async function handleConnect() {
		try {
			walletState = { ...walletState, isLoading: true, error: null };
			await walletManager.connect();
			console.log('Connected to wallet');
		} catch (error) {
			console.error('Failed to connect:', error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			walletState = { ...walletState, error: errorMessage, isLoading: false };
		}
	}

	async function handleDisconnect() {
		try {
			await walletManager.disconnect();
			showBalance = false;
			console.log('Wallet disconnected');
		} catch (error) {
			console.error('Failed to disconnect:', error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			walletState = { ...walletState, error: errorMessage };
		}
	}

	async function handleNetworkSwitch() {
		try {
			await walletManager.switchToOGChain();
		} catch (error) {
			console.error('Failed to switch network:', error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			walletState = { ...walletState, error: errorMessage };
		}
	}

	function toggleBalance() {
		showBalance = !showBalance;
	}
	
	function isOnCorrectNetwork(chainId: number | null): boolean {
		return chainId === 16601; // 0G Galileo testnet
	}
</script>

<div class="wallet-connect">
	<h2>MedNexus Wallet</h2>
	
	{#if walletState.isConnected}
		<div class="connected-info">
			<p><strong>Connected:</strong> {formatAddress(walletState.address || '')}</p>
			<p><strong>Wallet:</strong> MetaMask</p>
			
			{#if !isOnCorrectNetwork(walletState.chainId)}
				<div class="network-warning">
					<p>⚠️ Wrong Network - Please switch to 0G Galileo Testnet</p>
					<button onclick={handleNetworkSwitch} class="btn btn-warning">
						Switch to 0G Chain
					</button>
				</div>
			{:else}
				<p class="network-ok">✅ Connected to 0G Galileo Testnet</p>
			{/if}
			
			{#if walletState.error}
				<div class="error-message">
					<p>⚠️ {walletState.error}</p>
				</div>
			{/if}
			
			<div class="balance-section">
				<button onclick={toggleBalance} class="btn btn-secondary">
					{showBalance ? 'Hide Balance' : 'Show Balance'}
				</button>
				{#if showBalance}
					<p><strong>Balance:</strong> {formatBalance(walletState.balance)}</p>
				{/if}
			</div>
			
			<button onclick={handleDisconnect} class="btn btn-danger">
				Disconnect Wallet
			</button>
		</div>
	{:else}
		<div class="connect-section">
			<p>Connect your wallet to interact with MedNexus on 0G Galileo Testnet</p>
			<button 
				onclick={handleConnect} 
				disabled={walletState.isLoading}
				class="btn btn-primary"
			>
				{walletState.isLoading ? 'Connecting...' : 'Connect MetaMask'}
			</button>
			
			{#if walletState.error}
				<div class="error-message">
					<p>❌ {walletState.error}</p>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.wallet-connect {
		padding: 20px;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		margin: 20px 0;
		background: #f9f9f9;
	}

	.connected-info {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.network-warning {
		padding: 10px;
		background: #fff3cd;
		border: 1px solid #ffeaa7;
		border-radius: 4px;
		margin: 10px 0;
	}

	.network-ok {
		color: #28a745;
		font-weight: bold;
		margin: 10px 0;
	}

	.error-message {
		padding: 10px;
		background: #f8d7da;
		border: 1px solid #f5c6cb;
		border-radius: 4px;
		margin: 10px 0;
		color: #721c24;
	}

	.balance-section {
		margin: 10px 0;
	}

	.btn {
		padding: 8px 16px;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-weight: bold;
		transition: background-color 0.2s;
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-primary {
		background-color: #007bff;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background-color: #0056b3;
	}

	.btn-secondary {
		background-color: #6c757d;
		color: white;
	}

	.btn-secondary:hover {
		background-color: #545b62;
	}

	.btn-warning {
		background-color: #ffc107;
		color: black;
	}

	.btn-warning:hover {
		background-color: #e0a800;
	}

	.btn-danger {
		background-color: #dc3545;
		color: white;
	}

	.btn-danger:hover {
		background-color: #c82333;
	}

	.connect-section {
		text-align: center;
	}

	h2 {
		margin-top: 0;
		color: #333;
	}

	p {
		margin: 5px 0;
	}
</style>
