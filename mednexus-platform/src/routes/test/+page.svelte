<script lang="ts">
  import { walletManager } from '$lib/wallet';
  import { storageHelper } from '$lib/storage';
  import { contractManager } from '$lib/contract';
  import type { ContractInfo } from '$lib/types';

  let walletConnected = $state(false);
  let walletAddress = $state('');
  let walletBalance = $state('');
  let contractInfo = $state<ContractInfo | null>(null);
  let storageInfo = $state<any>(null);
  let isLoading = $state(false);

  // Initialize storage when component mounts
  $effect(() => {
    (async () => {
      await storageHelper.init();
      storageInfo = await storageHelper.getStorageInfo();
    })();
  });

  // Subscribe to wallet state changes
  $effect(() => {
    const unsubscribe = walletManager.walletStore.subscribe((state) => {
      walletConnected = state.isConnected;
      walletAddress = state.address || '';
      walletBalance = state.balance || '0';
    });
    
    return unsubscribe;
  });

  async function connectWallet() {
    isLoading = true;
    try {
      await walletManager.connect();
      // The wallet state will be updated automatically via AppKit subscriptions
    } catch (error) {
      console.error('Wallet connection failed:', error);
    }
    isLoading = false;
  }

  async function testContract() {
    if (!walletConnected) return;
    
    isLoading = true;
    try {
      // Use the existing deployed contract
      await contractManager.init('0x035F1565aeeB03DF80Dfe65aeBF0d03Bec5bf696');
      contractInfo = await contractManager.getContractInfo();
    } catch (error) {
      console.error('Contract test failed:', error);
    }
    isLoading = false;
  }
</script>

<div class="p-6 max-w-4xl mx-auto">
  <h1 class="text-3xl font-bold mb-6">MedNexus - Day 1 Setup Test</h1>
  
  <!-- Wallet Section -->
  <div class="bg-white shadow rounded-lg p-4 mb-4">
    <h2 class="text-xl font-semibold mb-3">Wallet Connection</h2>
    
    {#if !walletConnected}
      <button 
        onclick={connectWallet}
        disabled={isLoading}
        class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? 'Connecting...' : 'Connect Wallet'}
      </button>
    {:else}
      <div class="space-y-2">
        <p><strong>Address:</strong> {walletAddress}</p>
        <p><strong>Balance:</strong> {walletBalance} OG</p>
        <p class="text-green-600">✅ Connected to 0G Galileo Testnet</p>
      </div>
    {/if}
  </div>

  <!-- Storage Section -->
  <div class="bg-white shadow rounded-lg p-4 mb-4">
    <h2 class="text-xl font-semibold mb-3">0G Storage</h2>
    
    {#if storageInfo}
      <div class="space-y-2">
        <p><strong>Status:</strong> {storageInfo.ready ? '✅ Ready' : '❌ Not Ready'}</p>
        <p><strong>Type:</strong> {storageInfo.storageType}</p>
      </div>
    {:else}
      <p>Loading storage info...</p>
    {/if}
  </div>

  <!-- Contract Section -->
  <div class="bg-white shadow rounded-lg p-4 mb-4">
    <h2 class="text-xl font-semibold mb-3">Smart Contract</h2>
    
    {#if walletConnected}
      <button 
        onclick={testContract}
        disabled={isLoading}
        class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 mb-3"
      >
        {isLoading ? 'Testing...' : 'Test Contract'}
      </button>
      
      {#if contractInfo}
        <div class="space-y-2">
          <p><strong>Contract Owner:</strong> {contractInfo.owner}</p>
          <p><strong>Paused:</strong> {contractInfo.paused ? 'Yes' : 'No'}</p>
          <p><strong>Total Institutions:</strong> {contractInfo.institutions}</p>
          <p><strong>Total Verifiers:</strong> {contractInfo.verifiers}</p>
          <p><strong>Contract Balance:</strong> {contractInfo.balance} OG</p>
          <p class="text-green-600">✅ Contract interaction working</p>
        </div>
      {/if}
    {:else}
      <p class="text-gray-500">Connect wallet first to test contract</p>
    {/if}
  </div>

  <!-- Progress Section -->
  <div class="bg-gray-50 rounded-lg p-4">
    <h2 class="text-xl font-semibold mb-3">Wave 2 Progress</h2>
    
    <div class="space-y-2">
      <div class="flex items-center">
        <span class="text-green-600 mr-2">✅</span>
        <span>Smart Contracts: All Core Contracts Deployed</span>
      </div>
      <div class="flex items-center">
        <span class="text-green-600 mr-2">✅</span>
        <span>Wallet Integration: Multi-wallet Support Active</span>
      </div>
      <div class="flex items-center">
        <span class="text-green-600 mr-2">✅</span>
        <span>0G Chain Integration: Galileo Testnet Connected</span>
      </div>
      <div class="flex items-center">
        <span class="text-green-600 mr-2">✅</span>
        <span>Platform Monitoring: Real-time Analytics Dashboard</span>
      </div>
      <div class="flex items-center">
        <span class="text-orange-500 mr-2">🔄</span>
        <span>Medical Authority Network: In Development</span>
      </div>
      <div class="flex items-center">
        <span class="text-orange-500 mr-2">🔄</span>
        <span>INFT Marketplace: UI Implementation</span>
      </div>
    </div>
    
    <div class="mt-4 bg-blue-50 p-3 rounded-lg">
      <p class="text-sm text-blue-800">
        <strong>Wave 2 Status:</strong> Core infrastructure complete. 
        Medical interfaces and 0G Storage integration in progress.
      </p>
    </div>
  </div>
</div>
