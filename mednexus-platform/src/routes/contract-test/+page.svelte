<script>
	import { walletStore, walletManager } from '$lib/wallet';
	import { contractTestService } from '$lib/services/contractTestService';
	import { testResearchProjects, testClinicalTrials, contractAddresses } from '$lib/data/testData';

	let isLoading = false;
	let results = [];

	function addResult(type, action, data) {
		results = [
			{
				timestamp: new Date().toLocaleString(),
				type,
				action,
				data
			},
			...results.slice(0, 10)
		];
	}

	async function connectWallet() {
		isLoading = true;
		try {
			await walletManager.connect();
			addResult('SUCCESS', 'Wallet Connected', { address: $walletStore.address });
		} catch (error) {
			addResult('ERROR', 'Connection Failed', { error: error.message });
		} finally {
			isLoading = false;
		}
	}

	async function createProject(project) {
		isLoading = true;
		try {
			const result = await contractTestService.createTestProject(project);
			if (result.success) {
				addResult('SUCCESS', 'Project Created', { title: project.title, txHash: result.txHash });
			} else {
				addResult('ERROR', 'Project Failed', { error: result.error });
			}
		} catch (error) {
			addResult('ERROR', 'Project Failed', { error: error.message });
		} finally {
			isLoading = false;
		}
	}

	async function createTrial(trial) {
		isLoading = true;
		try {
			const result = await contractTestService.createTestTrial(trial);
			if (result.success) {
				addResult('SUCCESS', 'Trial Created', { title: trial.title, txHash: result.txHash });
			} else {
				addResult('ERROR', 'Trial Failed', { error: result.error });
			}
		} catch (error) {
			addResult('ERROR', 'Trial Failed', { error: error.message });
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Contract Testing - MedNexus</title>
</svelte:head>

<div class="p-6">
	<h1 class="text-3xl font-bold mb-6">Contract Testing Interface</h1>

	<!-- Wallet Connection -->
	<div class="mb-6 p-4 bg-white rounded-lg shadow">
		<h2 class="text-xl font-bold mb-4">Wallet</h2>
		{#if !$walletStore.isConnected}
			<button
				on:click={connectWallet}
				disabled={isLoading}
				class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded"
			>
				{isLoading ? 'Connecting...' : 'Connect Wallet'}
			</button>
		{:else}
			<div class="text-green-600">
				✅ Connected: {$walletStore.address?.slice(0, 6)}...{$walletStore.address?.slice(-4)}
			</div>
		{/if}
	</div>

	<!-- Test Buttons -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<!-- Research Projects -->
		<div class="p-4 bg-white rounded-lg shadow">
			<h2 class="text-xl font-bold mb-4">Research Projects</h2>
			{#each testResearchProjects as project}
				<div class="mb-4 p-3 border rounded">
					<h3 class="font-semibold">{project.title}</h3>
					<p class="text-sm text-gray-600">{project.description}</p>
					<button
						on:click={() => createProject(project)}
						disabled={isLoading || !$walletStore.isConnected}
						class="mt-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm"
					>
						Create Project
					</button>
				</div>
			{/each}
		</div>

		<!-- Clinical Trials -->
		<div class="p-4 bg-white rounded-lg shadow">
			<h2 class="text-xl font-bold mb-4">Clinical Trials</h2>
			{#each testClinicalTrials as trial}
				<div class="mb-4 p-3 border rounded">
					<h3 class="font-semibold">{trial.title}</h3>
					<p class="text-sm text-gray-600">{trial.description}</p>
					<button
						on:click={() => createTrial(trial)}
						disabled={isLoading || !$walletStore.isConnected}
						class="mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm"
					>
						Create Trial
					</button>
				</div>
			{/each}
		</div>
	</div>

	<!-- Results -->
	<div class="mt-6 p-4 bg-white rounded-lg shadow">
		<h2 class="text-xl font-bold mb-4">Results</h2>
		{#if results.length === 0}
			<p class="text-gray-500">No transactions yet</p>
		{:else}
			<div class="space-y-2">
				{#each results as result}
					<div
						class="p-3 border rounded {result.type === 'SUCCESS'
							? 'border-green-500 bg-green-50'
							: 'border-red-500 bg-red-50'}"
					>
						<div
							class="font-semibold {result.type === 'SUCCESS' ? 'text-green-800' : 'text-red-800'}"
						>
							{result.action}
						</div>
						{#if result.data.title}
							<div class="text-sm">{result.data.title}</div>
						{/if}
						{#if result.data.txHash}
							<div class="text-xs font-mono">TX: {result.data.txHash.slice(0, 10)}...</div>
						{/if}
						{#if result.data.error}
							<div class="text-sm text-red-700">{result.data.error}</div>
						{/if}
						<div class="text-xs text-gray-500">{result.timestamp}</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
