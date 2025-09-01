<script>
	import { onMount } from 'svelte';
	import { 
		walletConnected, 
		userAddress, 
		isOwner, 
		networkCorrect,
		isConnecting,
		connectWallet, 
		disconnectWallet, 
		switchToZeroGChain,
		getBalance,
		initializeWallet
	} from '../config/wallet.ts';

	let balance = $state('0');
	let showBalance = $state(false);

	onMount(async () => {
		// Initialize wallet on component mount
		await initializeWallet();
	});

	async function handleConnect() {
		const result = await connectWallet();
		if (result.success) {
			console.log('Connected to wallet:', result.address);
			await loadBalance();
		} else {
			console.error('Failed to connect:', result.error);
		}
	}

	async function handleDisconnect() {
		const result = await disconnectWallet();
		if (result.success) {
			balance = '0';
			showBalance = false;
		}
	}

	async function handleNetworkSwitch() {
		const result = await switchToZeroGChain();
		if (!result.success) {
			console.error('Failed to switch network:', result.error);
		}
	}

	async function loadBalance() {
		if ($userAddress) {
			const result = await getBalance($userAddress);
			if (result.success) {
				balance = result.formatted;
				showBalance = true;
			}
		}
	}

	async function toggleBalance() {
		if (showBalance) {
			showBalance = false;
		} else {
			await loadBalance();
		}
	}
</script>

<div class="wallet-connect">
	<h2>MedNexus Wallet</h2>
	
	{#if $walletConnected}
		<div class="connected-info">
			<p><strong>Connected:</strong> {$userAddress.slice(0, 6)}...{$userAddress.slice(-4)}</p>
			
			{#if $isOwner}
				<p class="owner-badge">🔑 Contract Owner</p>
			{/if}
			
			{#if !$networkCorrect}
				<div class="network-warning">
					<p>⚠️ Wrong Network</p>
					<button onclick={handleNetworkSwitch} class="btn btn-warning">
						Switch to 0G Chain
					</button>
				</div>
			{:else}
				<p class="network-ok">✅ Connected to 0G Chain</p>
			{/if}
			
			<div class="balance-section">
				<button onclick={toggleBalance} class="btn btn-secondary">
					{showBalance ? 'Hide Balance' : 'Show Balance'}
				</button>
				{#if showBalance}
					<p><strong>Balance:</strong> {balance} ETH</p>
				{/if}
			</div>
			
			<button onclick={handleDisconnect} class="btn btn-danger">
				Disconnect Wallet
			</button>
		</div>
	{:else}
		<div class="connect-section">
			<p>Connect your wallet to interact with MedNexus</p>
			<button 
				onclick={handleConnect} 
				disabled={$isConnecting}
				class="btn btn-primary"
			>
				{$isConnecting ? 'Connecting...' : 'Connect MetaMask'}
			</button>
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

	.owner-badge {
		color: #d4af37;
		font-weight: bold;
	}

	.network-warning {
		padding: 10px;
		background: #fff3cd;
		border: 1px solid #ffeaa7;
		border-radius: 4px;
	}

	.network-ok {
		color: #28a745;
		font-weight: bold;
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
