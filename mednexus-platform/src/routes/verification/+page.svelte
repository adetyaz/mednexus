<script lang="ts">
	import {
		medicalAuthorityService,
		type MedicalAuthority,
		type VerificationResult
	} from '$lib/services/medicalAuthority';
	import { hospitalDirectory, type HospitalProfile } from '$lib/services/hospitalDirectory';
	import { MedicalInstitutionService } from '$lib/services/medicalInstitutionService';
	import { walletStore } from '$lib/wallet';
	import { goto } from '$app/navigation';
	import { Building2, CheckCircle, ArrowRight, User, Shield } from '@lucide/svelte';

	let authorities = $state<MedicalAuthority[]>([]);
	let hospitals = $state<HospitalProfile[]>([]);
	let credentialId = $state('');
	let selectedAuthority = $state('');
	let selectedHospital = $state('');
	let holderName = $state('');
	let department = $state('');
	let medicalSpecialty = $state('');
	let institution = $state('');
	let verificationResult = $state<VerificationResult | null>(null);
	let isVerifying = $state(false);
	let errorMessage = $state('');
	let currentStep = $state<'verify' | 'select-hospital' | 'complete'>('verify');
	let isRegistering = $state(false);

	const institutionService = new MedicalInstitutionService();

	$effect(() => {
		(async () => {
			await medicalAuthorityService.initialize();
			authorities = medicalAuthorityService.getActiveAuthorities();
			hospitals = hospitalDirectory.getVerifiedHospitals();
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
			// Call the verification service - this maintains existing blockchain verification
			console.log('Calling verification with data:', {
				licenseNumber: credentialId,
				authorityId: selectedAuthority,
				institution: selectedHospital
					? hospitals.find((h) => h.id === selectedHospital)?.name
					: 'Unknown Institution',
				holderName: holderName
			});

			const result = await medicalAuthorityService.verifyCredential({
				licenseNumber: credentialId,
				authorityId: selectedAuthority,
				institution: selectedHospital
					? hospitals.find((h) => h.id === selectedHospital)?.name
					: 'Unknown Institution',
				holderName: holderName
			});

			console.log('Verification completed:', result);
			verificationResult = result;

			// If verification successful, proceed to hospital selection
			if (result.isValid) {
				currentStep = 'select-hospital';
			}
		} catch (error) {
			console.error('Verification failed:', error);
			errorMessage = error instanceof Error ? error.message : 'Verification failed';
		} finally {
			console.log('Verification process completed');
			isVerifying = false;
		}
	}

	async function registerWithHospital() {
		if (!selectedHospital || !department || !medicalSpecialty || !verificationResult) {
			errorMessage = 'Please complete all hospital registration fields';
			return;
		}

		isRegistering = true;
		errorMessage = '';

		try {
			const selectedHospitalData = hospitals.find((h) => h.id === selectedHospital);
			if (!selectedHospitalData) {
				throw new Error('Selected hospital not found');
			}

			// Register the hospital as an institution if it doesn't exist
			let institutionId: string;
			try {
				institutionId = await institutionService.registerInstitution({
					name: selectedHospitalData.name,
					address: selectedHospitalData.address,
					licenseNumber: selectedHospitalData.licenseNumber,
					adminWallet: $walletStore.address!,
					contactInfo: {
						email: selectedHospitalData.contactInfo.email,
						phone: selectedHospitalData.contactInfo.phone,
						website: ''
					},
					departments: selectedHospitalData.departments.map((dept) => ({
						departmentId: `dept_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
						name: dept,
						specialties: [medicalSpecialty],
						doctorCount: 0
					})),
					verificationDocuments: []
				});
			} catch (error: any) {
				// Institution might already exist
				const existingInstitution = institutionService.getInstitution(selectedHospitalData.name);
				if (existingInstitution) {
					institutionId = existingInstitution.institutionId;
				} else {
					throw error;
				}
			}

			// Register the doctor
			await institutionService.registerDoctor({
				doctorWallet: $walletStore.address!,
				institutionId,
				name: holderName,
				medicalLicense: credentialId,
				specialty: medicalSpecialty,
				department,
				profileInfo: {
					email: '', // Can be updated later
					phone: '', // Can be updated later
					yearsExperience: 0, // Default, can be updated later
					education: []
				}
			});

			currentStep = 'complete';
		} catch (error: any) {
			console.error('Hospital registration failed:', error);
			errorMessage = error.message || 'Failed to register with hospital';
		} finally {
			isRegistering = false;
		}
	}

	function goToStorage() {
		goto('/storage');
	}

	function startOver() {
		currentStep = 'verify';
		verificationResult = null;
		errorMessage = '';
		credentialId = '';
		selectedAuthority = '';
		selectedHospital = '';
		holderName = '';
		department = '';
		medicalSpecialty = '';
	}

	// Filter hospitals by country if authority is selected
	const filteredHospitals = $derived(
		selectedAuthority
			? hospitals.filter((h) => {
					const authority = authorities.find((a) => a.id === selectedAuthority);
					return authority ? h.country === authority.country : true;
				})
			: hospitals
	);
</script>

<main>
	<!-- Breadcrumb Navigation -->
	<div class="breadcrumb">
		<a href="/">Home</a>
		<span class="separator">›</span>
		<span class="current">Credential Verification</span>
	</div>

	<div class="page-header">
		<h1>Medical Credential Verification</h1>
		<p>Verify medical licenses and credentials on the blockchain</p>

		<!-- Progress Indicator -->
		<div class="progress-steps">
			<div
				class="step"
				class:active={currentStep === 'verify'}
				class:completed={currentStep !== 'verify'}
			>
				<div class="step-circle">1</div>
				<span>Verify Credentials</span>
			</div>
			<div
				class="step"
				class:active={currentStep === 'select-hospital'}
				class:completed={currentStep === 'complete'}
			>
				<div class="step-circle">2</div>
				<span>Select Hospital</span>
			</div>
			<div class="step" class:active={currentStep === 'complete'}>
				<div class="step-circle">3</div>
				<span>Complete</span>
			</div>
		</div>

		{#if !$walletStore.isConnected}
			<div class="wallet-warning">
				<p>Connect your wallet to verify credentials</p>
			</div>
		{/if}
	</div>

	<div class="content-grid">
		<div class="verification-form">
			{#if currentStep === 'verify'}
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
			{:else if currentStep === 'select-hospital'}
				<h2>Select Hospital</h2>
				<p>Choose the hospital where you want to register your verified credentials.</p>

				{#if errorMessage}
					<div class="error-message">
						{errorMessage}
					</div>
				{/if}

				<form
					onsubmit={(e) => {
						e.preventDefault();
						registerWithHospital();
					}}
				>
					<div class="form-group">
						<label for="hospital-select">Select Hospital *</label>
						<select id="hospital-select" bind:value={selectedHospital} required>
							<option value="">Choose a hospital</option>
							{#each filteredHospitals as hospital}
								<option value={hospital.id}>{hospital.name} - {hospital.country}</option>
							{/each}
						</select>
					</div>

					<div class="form-group">
						<label for="department">Department *</label>
						<input
							type="text"
							id="department"
							bind:value={department}
							placeholder="e.g., Cardiology, Emergency Medicine"
							required
						/>
					</div>

					<div class="form-group">
						<label for="specialty">Medical Specialty *</label>
						<input
							type="text"
							id="specialty"
							bind:value={medicalSpecialty}
							placeholder="e.g., Interventional Cardiology"
							required
						/>
					</div>

					<div class="button-group">
						<button type="button" class="back-btn" onclick={startOver}> Back </button>
						<button type="submit" class="register-btn" disabled={isRegistering}>
							{#if isRegistering}
								Registering...
							{:else}
								Register with Hospital
							{/if}
						</button>
					</div>
				</form>
			{:else if currentStep === 'complete'}
				<h2>Registration Complete!</h2>
				<div class="success-message">
					<div class="success-icon">✓</div>
					<p>
						Your medical credentials have been successfully verified and registered with the
						hospital.
					</p>
					<p>You can now upload and manage medical documents securely.</p>

					<div class="action-buttons">
						<button class="storage-btn" onclick={goToStorage}> Go to Document Storage </button>
						<button class="restart-btn" onclick={startOver}> Verify Another Credential </button>
					</div>
				</div>
			{/if}

			{#if verificationResult && currentStep === 'verify'}
				<div class="verification-result">
					<h3>Verification Result</h3>
					{#if verificationResult.isValid}
						<div class="result-success">
							<p>Credentials verified successfully!</p>
							<div class="result-details">
								<p><strong>Authority:</strong> {verificationResult.authority}</p>
								<p><strong>License Number:</strong> {verificationResult.licenseNumber}</p>
								<p><strong>Status:</strong> {verificationResult.status}</p>
								{#if verificationResult.verificationDate}
									<p>
										<strong>Verified On:</strong>
										{new Date(verificationResult.verificationDate).toLocaleString()}
									</p>
								{/if}
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

	/* Progress Steps Styling */
	.progress-steps {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 2rem;
		margin: 2rem 0;
		padding: 1rem;
		background: #f8fafc;
		border-radius: 12px;
		border: 1px solid #e2e8f0;
	}

	.step {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		opacity: 0.5;
		transition: opacity 0.3s ease;
	}

	.step.active {
		opacity: 1;
	}

	.step.completed {
		opacity: 1;
	}

	.step-circle {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		background: #e2e8f0;
		color: #64748b;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 0.9rem;
		transition: all 0.3s ease;
		border: 2px solid #e2e8f0;
	}

	.step.active .step-circle {
		background: #2563eb;
		color: white;
		border-color: #2563eb;
	}

	.step.completed .step-circle {
		background: #10b981;
		color: white;
		border-color: #10b981;
	}

	.step span {
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
		text-align: center;
		white-space: nowrap;
	}

	.step.active span {
		color: #2563eb;
		font-weight: 600;
	}

	.step.completed span {
		color: #10b981;
		font-weight: 600;
	}

	/* Progress Line */
	.progress-steps {
		position: relative;
	}

	.progress-steps::before {
		content: '';
		position: absolute;
		top: 1.25rem;
		left: 2.5rem;
		right: 2.5rem;
		height: 2px;
		background: #e2e8f0;
		z-index: 0;
	}

	.step {
		position: relative;
		z-index: 1;
		background: #f8fafc;
		padding: 0 0.5rem;
	}

	.step.active ~ .step::before,
	.step.completed ~ .step::before {
		content: '';
		position: absolute;
		top: 1.25rem;
		left: -50%;
		width: 50%;
		height: 2px;
		background: #e2e8f0;
		z-index: 0;
	}

	.step.completed::before {
		content: '';
		position: absolute;
		top: 1.25rem;
		left: -50%;
		width: 100%;
		height: 2px;
		background: #10b981;
		z-index: 0;
	}

	.step.active::before {
		content: '';
		position: absolute;
		top: 1.25rem;
		left: -50%;
		width: 50%;
		height: 2px;
		background: #2563eb;
		z-index: 0;
	}

	.wallet-warning {
		background: #fef3c7;
		border: 1px solid #f59e0b;
		border-radius: 8px;
		padding: 1rem;
		margin: 1rem 0;
		text-align: center;
	}

	.wallet-warning p {
		color: #92400e;
		margin: 0;
		font-weight: 500;
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

	.button-group {
		display: flex;
		gap: 1rem;
		margin-top: 2rem;
	}

	.back-btn {
		flex: 1;
		padding: 12px;
		background: #f3f4f6;
		color: #374151;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.back-btn:hover {
		background: #e5e7eb;
		border-color: #9ca3af;
	}

	.register-btn {
		flex: 2;
		padding: 12px;
		background: #10b981;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.register-btn:hover:not(:disabled) {
		background: #059669;
	}

	.register-btn:disabled {
		background: #9ca3af;
		cursor: not-allowed;
	}

	.success-message {
		text-align: center;
		padding: 2rem;
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		border-radius: 12px;
		margin: 2rem 0;
	}

	.success-icon {
		font-size: 3rem;
		color: #10b981;
		margin-bottom: 1rem;
	}

	.success-message p {
		color: #166534;
		margin: 0.5rem 0;
		font-size: 1rem;
	}

	.action-buttons {
		display: flex;
		gap: 1rem;
		margin-top: 2rem;
		justify-content: center;
	}

	.storage-btn {
		padding: 12px 24px;
		background: #2563eb;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.storage-btn:hover {
		background: #1d4ed8;
	}

	.restart-btn {
		padding: 12px 24px;
		background: #f3f4f6;
		color: #374151;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.restart-btn:hover {
		background: #e5e7eb;
		border-color: #9ca3af;
	}

	.error-message {
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 8px;
		padding: 1rem;
		margin: 1rem 0;
		color: #dc2626;
		font-weight: 500;
	}

	.verification-result {
		margin-top: 2rem;
		padding: 1.5rem;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
	}

	.verification-result h3 {
		margin: 0 0 1rem 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: #1a1a1a;
	}

	.result-success {
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		border-radius: 8px;
		padding: 1rem;
	}

	.result-success p {
		color: #166534;
		margin: 0 0 1rem 0;
		font-weight: 500;
	}

	.result-details p {
		margin: 0.25rem 0;
		font-size: 0.9rem;
		color: #374151;
	}

	.result-error {
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 8px;
		padding: 1rem;
	}

	.result-error p {
		color: #dc2626;
		margin: 0.25rem 0;
		font-weight: 500;
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

		.progress-steps {
			flex-direction: column;
			gap: 1rem;
			padding: 1.5rem 1rem;
		}

		.progress-steps::before {
			top: 1.25rem;
			left: 1.25rem;
			right: 1.25rem;
			width: 2px;
			height: calc(100% - 2.5rem);
			transform: rotate(90deg);
			transform-origin: top left;
		}

		.step {
			flex-direction: row;
			justify-content: flex-start;
			gap: 1rem;
			padding: 0.5rem 0;
		}

		.step span {
			text-align: left;
			white-space: normal;
		}

		.step.completed::before,
		.step.active::before {
			top: 1.25rem;
			left: 1.25rem;
			width: 2px;
			height: 50%;
			transform: rotate(90deg);
			transform-origin: top center;
		}
	}
</style>
