<script lang="ts">
	import { medicalAuthorityService, type MedicalAuthority } from '$lib/services/medicalAuthority';
	import { walletStore } from '$lib/wallet';

	let authorities = $state<MedicalAuthority[]>([]);
	let credentialId = $state('');
	let selectedAuthority = $state('');
	let institution = $state('');
	let holderName = $state('');
	let verificationResult = $state<any>(null);
	let isVerifying = $state(false);
	let errorMessage = $state('');

	$effect(() => {
		(async () => {
			await medicalAuthorityService.initialize();
			authorities = medicalAuthorityService.getActiveAuthorities();
		})();
	});

	async function verifyCredentials(event: SubmitEvent) {
		event.preventDefault();
		console.log('Verify credentials button clicked');

		if (!credentialId || !selectedAuthority || !holderName) {
			errorMessage = 'Please fill in all required fields';
			console.log('Missing fields:', { credentialId, selectedAuthority, holderName });
			return;
		}

		if (!$walletStore.isConnected) {
			errorMessage = 'Please connect your wallet first';
			console.log('Wallet not connected');
			return;
		}

		console.log('Starting verification process...');
		isVerifying = true;
		errorMessage = '';
		verificationResult = null;

		try {
			// Call the verification service
			console.log('Calling verification with data:', {
				licenseNumber: credentialId,
				authorityId: selectedAuthority,
				institution: institution || 'Unknown Institution',
				holderName: holderName
			});

			const result = await medicalAuthorityService.verifyCredential({
				licenseNumber: credentialId,
				authorityId: selectedAuthority,
				institution: institution || 'Unknown Institution',
				holderName: holderName
			});

			console.log('Verification completed:', result);
			verificationResult = result;
		} catch (error) {
			console.error('Verification failed:', error);
			errorMessage = error instanceof Error ? error.message : 'Verification failed';
		} finally {
			console.log('Verification process completed');
			isVerifying = false;
		}
	}
</script>

<main>
	<div class="page-header">
		<h1>Medical Credential Verification</h1>
		<p>Verify medical licenses and credentials on the blockchain</p>

		{#if !$walletStore.isConnected}
			<div class="wallet-warning">
				<p>Connect your wallet to verify credentials</p>
			</div>
		{/if}
	</div>

	<div class="content-grid">
		<div class="verification-form">
			<h2>Verify Credentials</h2>

			{#if errorMessage}
				<div class="error-message">
					{errorMessage}
				</div>
			{/if}

			<form onsubmit={verifyCredentials}>
				<div class="form-group">
					<label for="credential-id">Credential ID *</label>
					<input
						type="text"
						id="credential-id"
						bind:value={credentialId}
						placeholder="Enter credential identifier"
						required
					/>
				</div>

				<div class="form-group">
					<label for="holder-name">License Holder Name *</label>
					<input
						type="text"
						id="holder-name"
						bind:value={holderName}
						placeholder="Enter license holder's full name"
						required
					/>
				</div>

				<div class="form-group">
					<label for="authority">Issuing Authority *</label>
					<select id="authority" bind:value={selectedAuthority} required>
						<option value="">Select authority</option>
						{#each authorities as authority}
							<option value={authority.id}>{authority.name} ({authority.country})</option>
						{/each}
					</select>
				</div>

				<div class="form-group">
					<label for="institution">Institution</label>
					<input
						type="text"
						id="institution"
						bind:value={institution}
						placeholder="Institution name (optional)"
					/>
				</div>

				<button
					type="submit"
					class="verify-btn"
					disabled={isVerifying || !$walletStore.isConnected}
				>
					{#if isVerifying}
						Verifying...
					{:else}
						Verify Credentials
					{/if}
				</button>
			</form>

			{#if verificationResult}
				<div class="verification-result">
					<h3>Verification Result</h3>
					{#if verificationResult.isValid}
						<div class="result-success">
							<p>Credentials verified successfully!</p>
							<div class="result-details">
								<p><strong>Authority:</strong> {verificationResult.authority}</p>
								<p><strong>License Number:</strong> {verificationResult.licenseNumber}</p>
								<p><strong>Status:</strong> {verificationResult.status}</p>
								<p>
									<strong>Verified On:</strong>
									{new Date(verificationResult.verificationDate).toLocaleString()}
								</p>
							</div>
						</div>
					{:else}
						<div class="result-error">
							<p>Credential verification failed</p>
							<p>{verificationResult.reason || 'Invalid or expired credentials'}</p>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<div class="authorities-list">
			<h2>Supported Authorities</h2>
			<div class="authorities-grid">
				{#each authorities as authority}
					<div class="authority-card">
						<h3>{authority.name}</h3>
						<p class="authority-country">{authority.country}</p>
						<div class="authority-stats">
							<span class="stat">Active</span>
							<span class="stat-dot active"></span>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</main>

<style>
	main {
		max-width: 1200px;
		margin: 0 auto;
		padding: 24px;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.page-header {
		margin-bottom: 32px;
		padding-bottom: 24px;
		border-bottom: 1px solid #e5e5e5;
	}

	.page-header h1 {
		font-size: 2rem;
		font-weight: 600;
		color: #1a1a1a;
		margin: 0 0 8px 0;
	}

	.page-header p {
		color: #666;
		margin: 0 0 16px 0;
	}

	.content-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 32px;
	}

	.verification-form {
		background: white;
		padding: 24px;
		border-radius: 12px;
		border: 1px solid #e5e5e5;
	}

	.verification-form h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1a1a1a;
		margin: 0 0 24px 0;
	}

	.form-group {
		margin-bottom: 20px;
	}

	.form-group label {
		display: block;
		font-size: 0.9rem;
		font-weight: 500;
		color: #333;
		margin-bottom: 6px;
	}

	.form-group input,
	.form-group select {
		width: 100%;
		padding: 12px;
		border: 1px solid #d0d0d0;
		border-radius: 6px;
		font-size: 0.9rem;
		background: white;
	}

	.verify-btn {
		width: 100%;
		padding: 12px;
		background: #1a1a1a;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.verify-btn:hover {
		background: #333;
	}

	.authorities-list h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1a1a1a;
		margin: 0 0 24px 0;
	}

	.authorities-grid {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.authority-card {
		background: white;
		padding: 16px;
		border-radius: 8px;
		border: 1px solid #e5e5e5;
	}

	.authority-card h3 {
		font-size: 1rem;
		font-weight: 500;
		color: #1a1a1a;
		margin: 0 0 4px 0;
	}

	.authority-country {
		color: #666;
		font-size: 0.875rem;
		margin: 0 0 8px 0;
	}

	.authority-stats {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.stat {
		font-size: 0.75rem;
		color: #22c55e;
		font-weight: 500;
	}

	.stat-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #22c55e;
	}

	@media (max-width: 768px) {
		.content-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
