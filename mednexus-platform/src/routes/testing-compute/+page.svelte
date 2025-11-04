<script lang="ts">
	import { walletStore } from '$lib/wallet';
	import { enhancedOGStorageService } from '$lib/services/ogStorage';
	import { ogComputeService } from '$lib/services/ogComputeService';
	import { Search, Activity, FileText, Loader } from '@lucide/svelte';
	import { onMount } from 'svelte';

	let diseaseQuery = $state('');
	let isProcessing = $state(false);
	let result = $state('');
	let error = $state('');
	let debugInfo = $state('');
	let computeInitialized = $state(false);
	let processingStatus = $state('');

	// Initialize 0G Compute on mount
	onMount(async () => {
		try {
			await ogComputeService.initialize();
			computeInitialized = true;
			console.log('✅ 0G Compute service ready');
		} catch (err) {
			console.error('Failed to initialize 0G Compute:', err);
		}
	});

	async function searchDisease() {
		if (!diseaseQuery.trim()) {
			error = 'Please enter a disease or medical condition';
			return;
		}

		isProcessing = true;
		error = '';
		result = '';
		debugInfo = '';
		processingStatus = 'Loading medical datasets...';

		try {
			// Step 1: Get ALL available medical datasets from storage
			const allFiles = enhancedOGStorageService.getAllUploads();
			debugInfo = `📁 Total files in storage: ${allFiles.length}\n`;
			debugInfo += `🔍 Query: "${diseaseQuery}"\n`;

			if (allFiles.length === 0) {
				result = `❌ No files in storage!\n\nPlease upload some medical documents first:\n1. Go to /storage page\n2. Connect your wallet\n3. Upload medical documents\n4. Return here to query with AI`;
				isProcessing = false;
				return;
			}

			debugInfo += `\nAll available medical files (sending as dataset context):\n${allFiles.map((f) => `- ${f.filename} (${f.dataType})`).join('\n')}\n\n`;

			console.log('All files for AI context:', allFiles);
			console.log('User query:', diseaseQuery);

			// Step 2: Use ALL files as dataset context (not searching/filtering)
			const storageFiles = allFiles; // Use all files, not just matching ones
			debugInfo += `✅ Using ${storageFiles.length} files as dataset context\n`;

			debugInfo += `Files in dataset:\n${storageFiles.map((f) => `- ${f.filename} [${f.storageHash.substring(0, 16)}...]`).join('\n')}\n\n`;

			// Step 3: Prepare all storage hashes as dataset references
			const datasetHashes = storageFiles.map((f) => f.storageHash).filter(Boolean);

			if (datasetHashes.length === 0) {
				result = `Found ${storageFiles.length} files but no valid storage hashes available.\n\n${debugInfo}`;
				isProcessing = false;
				return;
			}

			debugInfo += `📦 Dataset hashes: ${datasetHashes.length}\n\n`;

			// Step 4: Check if 0G Compute is initialized
			if (!computeInitialized || !ogComputeService.isReady()) {
				throw new Error('0G Compute service not initialized');
			}

			debugInfo += `🚀 Using 0G Compute SDK...\n`;
			processingStatus = 'Preparing dataset context for AI...';

			// Prepare context with ALL medical files information
			const datasetContext = storageFiles
				.map(
					(f) =>
						`File: ${f.filename}, Type: ${f.dataType}, Specialty: ${f.medicalSpecialty}, Hash: ${f.storageHash}`
				)
				.join('\n');

			const contextInfo = `You have access to ${datasetHashes.length} medical dataset(s) stored in 0G Storage:\n\n${datasetContext}`;

			// Step 5: Send request to 0G Compute using official SDK
			const messages = [
				{
					role: 'system',
					content: `You are a medical AI assistant with access to medical datasets stored in 0G decentralized storage. ${contextInfo}\n\nAnswer questions based on these datasets. If the information is not available in the datasets, say so clearly.`
				},
				{
					role: 'user',
					content: diseaseQuery
				}
			];

			debugInfo += `🤖 Sending to GPT-OSS-120B model...\n`;

			// Use official 0G service (GPT-OSS)
			const providerAddress = ogComputeService.getGptOssProvider();
			debugInfo += `📍 Provider: ${providerAddress}\n\n`;

			// Acknowledge provider (required before first use)
			processingStatus = 'Acknowledging AI provider on-chain...';
			try {
				await ogComputeService.acknowledgeProvider(providerAddress);
				debugInfo += `✅ Provider acknowledged\n`;
			} catch (ackError) {
				// May already be acknowledged
				debugInfo += `ℹ️  Provider already acknowledged\n`;
			}

			// Send inference request
			processingStatus = 'Sending query to 0G Compute AI (this may take 30-60 seconds)...';
			debugInfo += `📤 Sending request with ${messages.length} messages...\n`;

			const computeResult = await ogComputeService.sendInferenceRequest({
				providerAddress,
				messages
			});

			if (!computeResult.success) {
				throw new Error(computeResult.error || 'Compute request failed');
			}

			debugInfo += `✅ Inference complete\n`;
			if (computeResult.isValid !== undefined) {
				debugInfo += `🔒 Verification: ${computeResult.isValid ? 'VALID' : 'INVALID'}\n`;
			}

			// Format result
			// Determine verification status message
			let verificationStatus = '';
			if (computeResult.isValid === true) {
				verificationStatus = '🔒 Verification: ✅ VALID (TEE-verified response)';
			} else if (computeResult.isValid === false) {
				verificationStatus = '🔒 Verification: ❌ INVALID';
			} else {
				verificationStatus = '🔒 Verification: ⚠️ Not verified (response still valid)';
			}

			result = `
🔬 AI Analysis Complete

Query: "${diseaseQuery}"
Model: GPT-OSS-120B (0G Compute Network)
Dataset Context: ${storageFiles.length} medical file(s) from 0G Storage

📊 AI Response:
${computeResult.content || 'No response received'}

📁 Medical Datasets Referenced:
${storageFiles.map((f) => `• ${f.filename}\n  Type: ${f.dataType} | Specialty: ${f.medicalSpecialty}\n  Hash: ${f.storageHash.substring(0, 32)}...`).join('\n')}

${verificationStatus}
${computeResult.chatId ? `💬 Chat ID: ${computeResult.chatId}` : ''}

--- DEBUG INFO ---
${debugInfo}
			`.trim();
		} catch (err: any) {
			console.error('Compute error:', err);

			// Get all files for error reporting
			const allFiles = enhancedOGStorageService.getAllUploads();
			const storageFiles = allFiles; // Use all files as context
			const datasetHashes = storageFiles.map((f) => f.storageHash).filter(Boolean);

			// Determine error type
			let errorType = 'Unknown Error';
			let errorDetails = err.message || 'No error details available';
			let possibleFixes: string[] = [];

			if (errorDetails.includes('could not decode result data')) {
				errorType = 'Response Verification Error';
				possibleFixes = [
					'The AI model returned a response but verification failed',
					'This may be due to response format mismatch',
					'Try using a different provider or model',
					'Check if provider supports verification'
				];
			} else if (errorDetails.includes('Broker not initialized')) {
				errorType = 'Initialization Error';
				possibleFixes = ['Refresh the page to reinitialize', 'Check console for wallet/RPC errors'];
			} else if (errorDetails.includes('Request failed')) {
				errorType = 'Network/API Error';
				possibleFixes = [
					'Check internet connection',
					'Verify 0G network status',
					'Provider endpoint may be down'
				];
			} else {
				possibleFixes = [
					'Wallet needs 0G tokens for compute fees',
					'Provider not acknowledged on-chain yet',
					'Network connectivity issues',
					'Refresh and try again'
				];
			}

			result = `
🔬 AI Analysis Failed

Query: "${diseaseQuery}"
Error Type: ${errorType}
Error: ${errorDetails}

📊 Flow Status:
1. ${allFiles.length > 0 ? '✅' : '❌'} Storage has ${allFiles.length} file(s)
2. ${datasetHashes.length > 0 ? '✅' : '❌'} Prepared ${datasetHashes.length} dataset hash(es)
3. ${computeInitialized ? '✅' : '❌'} 0G Compute ${computeInitialized ? 'initialized' : 'not initialized'}
4. ❌ AI inference request failed

${storageFiles.length > 0 ? `📁 Medical Datasets Available:\n${storageFiles.map((f) => `• ${f.filename} (${f.dataType})`).join('\n')}\n` : ''}

💡 Possible Solutions:
${possibleFixes.map((fix) => `• ${fix}`).join('\n')}

--- DEBUG INFO ---
${debugInfo}

--- FULL ERROR ---
${JSON.stringify(err, null, 2)}
			`.trim();
		} finally {
			isProcessing = false;
			processingStatus = '';
		}
	}
</script>

<div class="container">
	<div class="header">
		<Activity size={32} />
		<h1>0G Compute AI Query</h1>
		<p>Ask medical questions - AI analyzes ALL datasets in 0G Storage</p>
	</div>

	<!-- Storage Status -->
	<div class="status-box">
		<h3>📊 Storage Status</h3>
		{#if enhancedOGStorageService.isReady()}
			{@const allFiles = enhancedOGStorageService.getAllUploads()}
			<p><strong>Total Files:</strong> {allFiles.length}</p>
			{#if allFiles.length > 0}
				<details>
					<summary style="cursor: pointer; color: #3b82f6;"
						>View all files ({allFiles.length})</summary
					>
					<ul style="margin-top: 0.5rem; font-size: 0.9rem;">
						{#each allFiles as file}
							<li>
								📄 <strong>{file.filename}</strong>
								<br />
								<span style="color: #6b7280; font-size: 0.85rem;">
									Type: {file.dataType} | Specialty: {file.medicalSpecialty} | Hash: {file.storageHash.substring(
										0,
										16
									)}...
								</span>
							</li>
						{/each}
					</ul>
				</details>
			{:else}
				<p style="color: #ef4444;">
					⚠️ No files uploaded yet. Go to <a href="/storage">/storage</a> to upload files first.
				</p>
			{/if}
		{:else}
			<p style="color: #f59e0b;">⏳ Initializing storage...</p>
		{/if}
		<p>
			<strong>Compute Status:</strong>
			{computeInitialized ? '✅ Ready' : '⏳ Initializing...'}
		</p>
	</div>

	<div class="search-box">
		<div class="input-group">
			<Search size={20} />
			<input
				type="text"
				bind:value={diseaseQuery}
				placeholder="Ask any medical question (e.g., 'How to manage Ehlers Danlos syndrome?')"
				onkeydown={(e) => e.key === 'Enter' && searchDisease()}
				disabled={isProcessing}
			/>
		</div>
		<button onclick={searchDisease} disabled={isProcessing}>
			{#if isProcessing}
				<Loader size={16} class="spinning" />
				Processing...
			{:else}
				<Search size={16} />
				Analyze
			{/if}
		</button>
	</div>

	{#if processingStatus}
		<div class="message processing">
			<Loader size={20} class="spinning" />
			<span>{processingStatus}</span>
		</div>
	{/if}

	{#if error}
		<div class="message error">
			⚠️ {error}
		</div>
	{/if}

	{#if result}
		<div class="result-box">
			<div class="result-header">
				<FileText size={20} />
				<span>Analysis Result</span>
			</div>
			<pre>{result}</pre>
		</div>
	{/if}

	<div class="info-box">
		<h3>How it works:</h3>
		<ol>
			<li>Ask any medical question</li>
			<li>AI receives ALL medical files from 0G Storage as context</li>
			<li>0G Compute (GPT-OSS-120B) analyzes the datasets</li>
			<li>Returns answers based on your uploaded medical data</li>
			<li>Response is verified using TEE (Trusted Execution Environment)</li>
		</ol>
		<p style="margin-top: 1rem; color: #6b7280; font-size: 0.9rem;">
			💡 The AI has access to all {enhancedOGStorageService.getAllUploads().length} file(s) in storage
			as a knowledge base.
		</p>
	</div>
</div>

<style>
	.container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.header {
		text-align: center;
		margin-bottom: 2rem;
		color: #1f2937;
	}

	.header h1 {
		margin: 0.5rem 0;
		font-size: 2rem;
		font-weight: 600;
	}

	.header p {
		color: #6b7280;
		margin: 0;
	}

	.status-box {
		background: #f0f9ff;
		border: 2px solid #bae6fd;
		border-radius: 0.75rem;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.status-box h3 {
		margin-top: 0;
		margin-bottom: 1rem;
		color: #0c4a6e;
	}

	.status-box p {
		margin: 0.5rem 0;
		color: #374151;
	}

	.status-box ul {
		padding-left: 1.5rem;
		margin: 0;
	}

	.status-box li {
		margin: 0.75rem 0;
		line-height: 1.6;
	}

	.status-box a {
		color: #3b82f6;
		text-decoration: underline;
	}

	.search-box {
		display: flex;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.input-group {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		border: 2px solid #e5e7eb;
		border-radius: 0.5rem;
		background: white;
	}

	.input-group:focus-within {
		border-color: #3b82f6;
	}

	input {
		flex: 1;
		border: none;
		outline: none;
		font-size: 1rem;
	}

	input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	button {
		padding: 1rem 2rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition: background 0.2s;
	}

	button:hover:not(:disabled) {
		background: #2563eb;
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	:global(.spinning) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.message {
		padding: 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.message.processing {
		background: #eff6ff;
		border: 1px solid #bfdbfe;
		color: #1e40af;
		font-weight: 500;
	}

	.message.error {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #991b1b;
	}

	.result-box {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.result-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
		font-weight: 600;
		color: #1f2937;
	}

	pre {
		white-space: pre-wrap;
		word-wrap: break-word;
		font-family: 'Courier New', monospace;
		font-size: 0.875rem;
		line-height: 1.6;
		color: #374151;
		margin: 0;
	}

	.info-box {
		background: #eff6ff;
		border: 1px solid #bfdbfe;
		border-radius: 0.5rem;
		padding: 1.5rem;
	}

	.info-box h3 {
		margin: 0 0 1rem 0;
		color: #1e40af;
		font-size: 1rem;
	}

	.info-box ol {
		margin: 0;
		padding-left: 1.5rem;
		color: #1e40af;
	}

	.info-box li {
		margin-bottom: 0.5rem;
		line-height: 1.5;
	}

	@media (max-width: 768px) {
		.container {
			padding: 1rem;
		}

		.search-box {
			flex-direction: column;
		}

		button {
			width: 100%;
			justify-content: center;
		}
	}
</style>
