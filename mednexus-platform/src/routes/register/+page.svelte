<script lang="ts">
	import { walletStore } from '$lib/wallet';
	import { MedicalInstitutionService } from '$lib/services/medicalInstitutionService';
	import {
		generateInstitutionId,
		extractLicensePrefix,
		validateLicenseFormat
	} from '$lib/helpers/institutionHelpers';
	import { supabase } from '$lib/supabase';
	import { Building2, Shield, CheckCircle, AlertCircle } from '@lucide/svelte';

	let submitting = $state(false);
	let showToast = $state(false);
	let toastMessage = $state('');
	let toastType = $state<'success' | 'error' | 'info'>('info');

	// Institution form data
	let institutionData = $state({
		name: '',
		address: '',
		country: 'United Kingdom',
		licenseNumber: '',
		accreditation: '',
		contactPhone: '',
		contactEmail: '',
		emergencyContact: '',
		departments: [] as string[]
	});

	// Generated data (auto-calculated)
	let generatedId = $state('');
	let licensePrefix = $state('');
	let blockchainSuccess = $state(false);
	let transactionHash = $state('');
	let institutionId = $state('');
	let message = $state('');
	let messageType = $state<'success' | 'error'>('success');
	const institutionService = new MedicalInstitutionService();

	// Auto-generate ID and validate license when name or license changes
	$effect(() => {
		if (institutionData.name) {
			generatedId = generateInstitutionId(institutionData.name);
		}
		if (institutionData.licenseNumber) {
			licensePrefix = extractLicensePrefix(institutionData.licenseNumber);
		}
	});

	let userConnected = $state(false);
	let userWallet = $state('');

	// Track wallet connection
	$effect(() => {
		if ($walletStore.isConnected && $walletStore.address) {
			userConnected = true;
			userWallet = $walletStore.address;
		} else {
			userConnected = false;
			userWallet = '';
		}
	});

	async function registerInstitution() {
		if (!userConnected) {
			message = 'Please connect your wallet first';
			messageType = 'error';
			return;
		}

		// Validate license format
		if (!validateLicenseFormat(institutionData.licenseNumber, institutionData.country)) {
			message = `Invalid license format for ${institutionData.country}. Expected format like "UK-NHS-123456"`;
			messageType = 'error';
			return;
		}

		submitting = true;
		message = 'Step 1/2: Registering institution on blockchain...';
		toastMessage = 'Registering institution on blockchain...';
		toastType = 'info';
		showToast = true;
		blockchainSuccess = false;
		transactionHash = '';

		try {
			// STEP 1: Register on blockchain first
			console.log('🔗 Starting blockchain registration...');
			const blockchainResult = await institutionService.registerInstitution({
				name: institutionData.name,
				address: institutionData.address,
				licenseNumber: institutionData.licenseNumber,
				adminWallet: userWallet,
				contactInfo: {
					phone: institutionData.contactPhone,
					email: institutionData.contactEmail
				},
				departments: [],
				verificationDocuments: []
			});

			// Extract blockchain details
			transactionHash = blockchainResult.transactionHash;
			blockchainSuccess = true;

			console.log('✅ Blockchain registration successful:', {
				wallet: blockchainResult.walletAddress,
				txHash: blockchainResult.transactionHash,
				block: blockchainResult.blockNumber
			});

			message = 'Step 2/2: Saving to database...';
			toastMessage = 'Saving to database...';
			toastType = 'info';
			showToast = true;

			// STEP 2: Only after blockchain success, save to database
			console.log('💾 Saving to database after blockchain success...');
			const { data, error } = await supabase.from('medical_institutions').insert({
				id: generatedId,
				name: institutionData.name,
				country: institutionData.country,
				address: institutionData.address,
				license_number: institutionData.licenseNumber,
				accreditation: institutionData.accreditation,
				phone: institutionData.contactPhone,
				email: institutionData.contactEmail,
				emergency_contact: institutionData.emergencyContact,
				wallet_address: blockchainResult.walletAddress,
				transaction_hash: blockchainResult.transactionHash,
				blockchain_registered: true,
				departments: JSON.stringify(institutionData.departments),
				region: institutionData.country === 'United Kingdom' ? 'Europe' : 'Global'
			} as any);

			if (error) {
				console.error('Database save failed:', error);
				message = `Blockchain registration successful but database save failed: ${error.message}`;
				messageType = 'error';
				return;
			}

			institutionId = generatedId;
			message = `✅ Institution "${institutionData.name}" registered successfully!\nID: ${generatedId}\nWallet: ${blockchainResult.walletAddress}\nTransaction: ${blockchainResult.transactionHash}`;
			messageType = 'success';

			// Toast notification for success
			toastMessage = `Institution "${institutionData.name}" registered successfully!`;
			toastType = 'success';
			showToast = true;
			setTimeout(() => (showToast = false), 5000);
		} catch (error: any) {
			console.error('Registration failed:', error);
			if (blockchainSuccess) {
				message = `Blockchain registration successful but database save failed: ${error.message}`;
			} else {
				message = `Blockchain registration failed: ${error.message}`;
			}
			messageType = 'error';

			// Toast notification for error
			toastMessage = `Error: ${message}`;
			toastType = 'error';
			showToast = true;
			setTimeout(() => (showToast = false), 5000);
		} finally {
			submitting = false;
		}
	}
</script>

<div class="registration-container">
	<div class="header">
		<Building2 size={48} />
		<h1>Medical Registration</h1>
		<p>Register your medical institution for secure document storage</p>
	</div>

	{#if !userConnected}
		<div class="connect-wallet">
			<Shield size={32} />
			<h2>Connect Wallet Required</h2>
			<p>Please connect your wallet to proceed with registration.</p>
		</div>
	{:else}
		<!-- Institution Registration -->
		<div class="form-section">
			<div class="step-header">
				<div class="step-icon">
					<Building2 size={24} />
				</div>
				<h2>Register Medical Institution</h2>
				<p>Provide your medical institution's information</p>
			</div>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					registerInstitution();
				}}
			>
				<div class="form-grid">
					<div class="form-group">
						<label for="name">Institution Name *</label>
						<input
							id="name"
							bind:value={institutionData.name}
							type="text"
							required
							placeholder="e.g., St. Mary's Hospital London"
						/>
						{#if generatedId}
							<div class="preview-info">
								<strong>Generated ID:</strong> <code>{generatedId}</code>
							</div>
						{/if}
					</div>

					<div class="form-group">
						<label for="country">Country *</label>
						<select id="country" bind:value={institutionData.country} required>
							<option value="United Kingdom">United Kingdom</option>
							<option value="United States">United States</option>
							<option value="Canada">Canada</option>
							<option value="Australia">Australia</option>
							<option value="Germany">Germany</option>
							<option value="Japan">Japan</option>
						</select>
					</div>

					<div class="form-group">
						<label for="license">Medical License Number *</label>
						<input
							id="license"
							bind:value={institutionData.licenseNumber}
							type="text"
							required
							placeholder="e.g., UK-NHS-007842"
						/>
						{#if licensePrefix}
							<div class="preview-info">
								<strong>License Prefix:</strong> <code>{licensePrefix}</code>
								{#if validateLicenseFormat(institutionData.licenseNumber, institutionData.country)}
									<span class="valid">✅ Valid format</span>
								{:else}
									<span class="invalid">❌ Invalid format for {institutionData.country}</span>
								{/if}
							</div>
						{/if}
					</div>

					<div class="form-group">
						<label for="address">Address *</label>
						<input
							id="address"
							bind:value={institutionData.address}
							type="text"
							required
							placeholder="Full institutional address"
						/>
					</div>

					<div class="form-group">
						<label for="accreditation">Accreditation</label>
						<input
							id="accreditation"
							bind:value={institutionData.accreditation}
							type="text"
							placeholder="e.g., JCAHO, ISO 9001"
						/>
					</div>

					<div class="form-group">
						<label for="phone">Contact Phone *</label>
						<input
							id="phone"
							bind:value={institutionData.contactPhone}
							type="tel"
							required
							placeholder="+1 (555) 123-4567"
						/>
					</div>

					<div class="form-group">
						<label for="email">Contact Email *</label>
						<input
							id="email"
							bind:value={institutionData.contactEmail}
							type="email"
							required
							placeholder="contact@hospital.com"
						/>
					</div>

					<div class="form-group">
						<label for="emergency">Emergency Contact</label>
						<input
							id="emergency"
							bind:value={institutionData.emergencyContact}
							type="text"
							placeholder="Emergency contact information"
						/>
					</div>
				</div>

				<button type="submit" class="submit-btn" disabled={submitting}>
					{#if submitting}
						Registering Institution...
					{:else}
						Register Institution
					{/if}
				</button>
			</form>
		</div>
		{#if showToast}
			<div class={`toast toast-${toastType}`}>{toastMessage}</div>
		{/if}
		<!-- Message Display -->
		{#if message}
			<div class="message {messageType}">
				{#if messageType === 'error'}
					<AlertCircle size={20} />
				{:else}
					<CheckCircle size={20} />
				{/if}
				{message}
			</div>
		{/if}
	{/if}
</div>

<style>
	.registration-container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
	}

	.header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.header h1 {
		font-size: 2rem;
		color: #1e293b;
		margin: 1rem 0;
	}

	.header p {
		color: #64748b;
		font-size: 1.1rem;
	}

	.connect-wallet {
		text-align: center;
		padding: 3rem 2rem;
		background: #f8fafc;
		border-radius: 1rem;
		border: 2px solid #e2e8f0;
	}

	.form-section {
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 1rem;
		padding: 2rem;
		margin-bottom: 2rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.step-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		margin-bottom: 2rem;
	}

	.step-icon {
		background: #dbeafe;
		color: #3b82f6;
		width: 60px;
		height: 60px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 1rem;
	}

	.step-header h2 {
		color: #1e293b;
		margin-bottom: 0.5rem;
	}

	.step-header p {
		color: #64748b;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
	}

	.form-group label {
		font-weight: 600;
		color: #374151;
		margin-bottom: 0.5rem;
	}

	.form-group input,
	.form-group select {
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		font-size: 1rem;
		transition: border-color 0.2s;
	}

	.form-group input:focus,
	.form-group select:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.submit-btn {
		width: 100%;
		padding: 1rem 2rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.submit-btn:hover:not(:disabled) {
		background: #2563eb;
		transform: translateY(-1px);
	}

	.submit-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
		transform: none;
	}

	.toast {
		position: fixed;
		top: 1rem;
		right: 1rem;
		background: white;
		color: #111827;
		padding: 1rem 1.5rem;
		border-radius: 0.5rem;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
		z-index: 1000;
		transition: opacity 0.3s ease;
	}

	.toast-success {
		border-left: 4px solid #4ade80;
	}

	.toast-error {
		border-left: 4px solid #f87171;
	}

	.success-btn {
		display: inline-block;
		padding: 1rem 2rem;
		background: #16a34a;
		color: white;
		text-decoration: none;
		border-radius: 0.5rem;
		font-weight: 600;
		margin-top: 1rem;
		transition: all 0.2s;
	}

	.success-btn:hover {
		background: #15803d;
		transform: translateY(-1px);
	}

	.message {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem;
		border-radius: 0.5rem;
		margin-top: 1rem;
		font-weight: 500;
	}

	.message.success {
		background: #dcfce7;
		color: #16a34a;
		border: 1px solid #bbf7d0;
	}

	.message.error {
		background: #fee2e2;
		color: #dc2626;
		border: 1px solid #fecaca;
	}

	.preview-info {
		margin-top: 0.5rem;
		padding: 0.75rem;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.preview-info code {
		background: #e2e8f0;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-family: monospace;
		font-size: 0.8rem;
	}

	.preview-info .valid {
		color: #16a34a;
		font-weight: 500;
	}

	.preview-info .invalid {
		color: #dc2626;
		font-weight: 500;
	}

	@media (max-width: 768px) {
		.registration-container {
			padding: 1rem;
		}

		.form-grid {
			grid-template-columns: 1fr;
		}

		.header h1 {
			font-size: 1.5rem;
		}
	}
</style>
