<script>
	import { walletStore } from '$lib/wallet';
	import { collaborationHubRegistration } from '$lib/services/collaborationHubRegistration';

	let isLoading = false;
	let result = null;
	let commitStep = true; // true = commit, false = reveal
	let nonce = Math.floor(Math.random() * 1000000); // Random nonce

	// Your institution data
	const institutionData = {
		name: 'Mayo Clinic Rochester',
		country: 'United States',
		specialties: ['Emergency Medicine', 'Cardiology', 'Oncology']
	};

	async function commitRegistration() {
		isLoading = true;
		result = null;

		try {
			const res = await collaborationHubRegistration.commitInstitutionRegistration(
				institutionData.name,
				institutionData.country,
				institutionData.specialties,
				nonce
			);

			result = {
				type: 'success',
				message: res.message,
				txHash: res.txHash,
				nonce: nonce
			};

			commitStep = false; // Move to reveal step
		} catch (error) {
			result = {
				type: 'error',
				message: error.message
			};
		} finally {
			isLoading = false;
		}
	}

	async function revealRegistration() {
		isLoading = true;
		result = null;

		try {
			const res = await collaborationHubRegistration.revealInstitutionRegistration(
				institutionData.name,
				institutionData.country,
				institutionData.specialties,
				nonce
			);

			result = {
				type: 'success',
				message: res.message + ' You can now register doctors!',
				txHash: res.txHash
			};
		} catch (error) {
			result = {
				type: 'error',
				message: error.message
			};
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Manual Institution Registration</title>
</svelte:head>

<div class="p-6 max-w-2xl mx-auto">
	<h1 class="text-3xl font-bold mb-6">Register Institution on MedicalCollaborationHub</h1>

	<!-- Wallet Connection -->
	<div class="mb-6 p-4 bg-white rounded-lg shadow">
		{#if !$walletStore.isConnected}
			<div class="text-red-600">❌ Wallet not connected</div>
		{:else}
			<div class="text-green-600">
				✅ Connected: {$walletStore.address?.slice(0, 6)}...{$walletStore.address?.slice(-4)}
			</div>
		{/if}
	</div>

	<!-- Institution Data -->
	<div class="mb-6 p-4 bg-gray-50 rounded-lg">
		<h3 class="font-bold mb-2">Institution Data</h3>
		<p><strong>Name:</strong> {institutionData.name}</p>
		<p><strong>Country:</strong> {institutionData.country}</p>
		<p><strong>Specialties:</strong> {institutionData.specialties.join(', ')}</p>
		<p><strong>Nonce:</strong> {nonce}</p>
		<p><strong>Cost:</strong> 0.002 A0GI (only paid in reveal step)</p>
	</div>

	<!-- Process Steps -->
	<div class="mb-6">
		<div class="flex items-center space-x-4">
			<div class="flex items-center">
				<div
					class="w-8 h-8 rounded-full {commitStep
						? 'bg-blue-500'
						: 'bg-green-500'} text-white flex items-center justify-center text-sm font-bold"
				>
					{commitStep ? '1' : '✓'}
				</div>
				<span class="ml-2">Commit Registration</span>
			</div>
			<div class="w-8 h-1 bg-gray-300"></div>
			<div class="flex items-center">
				<div
					class="w-8 h-8 rounded-full {commitStep
						? 'bg-gray-300'
						: 'bg-blue-500'} text-white flex items-center justify-center text-sm font-bold"
				>
					2
				</div>
				<span class="ml-2">Reveal (after 1 hour)</span>
			</div>
		</div>
	</div>

	<!-- Action Buttons -->
	<div class="mb-6">
		{#if commitStep}
			<button
				onclick={commitRegistration}
				disabled={isLoading || !$walletStore.isConnected}
				class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg w-full"
			>
				{isLoading ? 'Committing...' : 'Step 1: Commit Registration (FREE)'}
			</button>
			<p class="text-sm text-gray-600 mt-2">This submits a hash commitment. No fees required.</p>
		{:else}
			<button
				onclick={revealRegistration}
				disabled={isLoading || !$walletStore.isConnected}
				class="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg w-full"
			>
				{isLoading ? 'Revealing...' : 'Step 2: Reveal Registration (0.002 A0GI)'}
			</button>
			<p class="text-sm text-red-600 mt-2">⚠️ Wait 1 hour after commit before clicking this!</p>
		{/if}
	</div>

	<!-- Results -->
	{#if result}
		<div
			class="p-4 rounded-lg {result.type === 'success'
				? 'bg-green-50 border border-green-200'
				: 'bg-red-50 border border-red-200'}"
		>
			<div class="font-bold {result.type === 'success' ? 'text-green-800' : 'text-red-800'}">
				{result.type === 'success' ? '✅ Success' : '❌ Error'}
			</div>
			<p class={result.type === 'success' ? 'text-green-700' : 'text-red-700'}>{result.message}</p>
			{#if result.txHash}
				<p class="text-xs font-mono mt-2">
					TX: <a
						href="https://chainscan-newton.0g.ai/tx/{result.txHash}"
						target="_blank"
						class="text-blue-600 hover:underline"
					>
						{result.txHash.slice(0, 10)}...
					</a>
				</p>
			{/if}
			{#if result.nonce}
				<p class="text-sm mt-2"><strong>Save this nonce:</strong> {result.nonce}</p>
			{/if}
		</div>
	{/if}

	<!-- Instructions -->
	<div class="mt-8 p-4 bg-blue-50 rounded-lg">
		<h3 class="font-bold text-blue-800 mb-2">Instructions</h3>
		<ol class="list-decimal list-inside space-y-1 text-blue-700">
			<li>Click "Commit Registration" (free transaction)</li>
			<li>Wait exactly 1 hour (security requirement)</li>
			<li>Click "Reveal Registration" (pays 0.002 A0GI stake)</li>
			<li>After successful reveal, you can register doctors!</li>
		</ol>
	</div>
</div>
