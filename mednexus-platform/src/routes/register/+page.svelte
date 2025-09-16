<script lang="ts">
	import { walletStore } from '$lib/wallet';
	import { MedicalInstitutionService } from '$lib/services/medicalInstitutionService';
	import { Building2, User, Shield, CheckCircle, AlertCircle } from '@lucide/svelte';

	let currentStep = $state<'register-institution' | 'register-doctor' | 'success'>(
		'register-institution'
	);
	let submitting = $state(false);
	let message = $state('');
	let messageType = $state<'success' | 'error'>('success');

	// Institution form data
	let institutionData = $state({
		name: '',
		address: '',
		licenseNumber: '',
		accreditation: '',
		contactPhone: '',
		contactEmail: '',
		emergencyContact: ''
	});

	// Doctor form data
	let doctorData = $state({
		name: '',
		medicalLicenseNumber: '',
		medicalSpecialty: '',
		department: '',
		yearsOfExperience: 0,
		contactPhone: '',
		contactEmail: ''
	});

	let institutionId = $state('');
	const institutionService = new MedicalInstitutionService();

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

		submitting = true;
		message = '';

		try {
			institutionId = await institutionService.registerInstitution({
				name: institutionData.name,
				address: institutionData.address,
				licenseNumber: institutionData.licenseNumber,
				adminWallet: userWallet,
				contactInfo: {
					phone: institutionData.contactPhone,
					email: institutionData.contactEmail
				},
				departments: [
					{
						departmentId: `dept_${Date.now()}`,
						name: doctorData.department,
						specialties: [doctorData.medicalSpecialty],
						doctorCount: 1
					}
				], // Default department from doctor data
				verificationDocuments: []
			});

			message = `Institution registered successfully! ID: ${institutionId}`;
			messageType = 'success';

			// Auto-proceed to doctor registration
			setTimeout(() => {
				currentStep = 'register-doctor';
				message = '';
			}, 2000);
		} catch (error: any) {
			message = error.message || 'Failed to register institution';
			messageType = 'error';
		} finally {
			submitting = false;
		}
	}

	async function registerDoctor() {
		if (!userConnected || !institutionId) {
			message = 'Please complete institution registration first';
			messageType = 'error';
			return;
		}

		submitting = true;
		message = '';

		try {
			await institutionService.registerDoctor({
				doctorWallet: userWallet,
				institutionId,
				name: doctorData.name,
				medicalLicense: doctorData.medicalLicenseNumber,
				specialty: doctorData.medicalSpecialty,
				department: doctorData.department,
				profileInfo: {
					phone: doctorData.contactPhone,
					email: doctorData.contactEmail,
					yearsExperience: doctorData.yearsOfExperience,
					education: []
				}
			});

			message = 'Doctor registration successful! You can now use the document storage system.';
			messageType = 'success';
			currentStep = 'success';
		} catch (error: any) {
			message = error.message || 'Failed to register doctor';
			messageType = 'error';
		} finally {
			submitting = false;
		}
	}
</script>

<div class="registration-container">
	<div class="header">
		<Building2 size={48} />
		<h1>Medical Registration</h1>
		<p>Register your medical institution and doctor credentials for secure document storage</p>
	</div>

	{#if !userConnected}
		<div class="connect-wallet">
			<Shield size={32} />
			<h2>Connect Wallet Required</h2>
			<p>Please connect your wallet to proceed with registration.</p>
		</div>
	{:else}
		<!-- Institution Registration -->
		{#if currentStep === 'register-institution'}
			<div class="form-section">
				<div class="step-header">
					<div class="step-icon">
						<Building2 size={24} />
					</div>
					<h2>Step 1: Register Medical Institution</h2>
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
								placeholder="e.g., General Hospital"
							/>
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
							<label for="license">Medical License Number *</label>
							<input
								id="license"
								bind:value={institutionData.licenseNumber}
								type="text"
								required
								placeholder="Institutional license number"
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
		{/if}

		<!-- Doctor Registration -->
		{#if currentStep === 'register-doctor'}
			<div class="form-section">
				<div class="step-header">
					<div class="step-icon">
						<User size={24} />
					</div>
					<h2>Step 2: Register Doctor Credentials</h2>
					<p>Provide your medical credentials and specialization</p>
				</div>

				<form
					onsubmit={(e) => {
						e.preventDefault();
						registerDoctor();
					}}
				>
					<div class="form-grid">
						<div class="form-group">
							<label for="doctorName">Doctor Name *</label>
							<input
								id="doctorName"
								bind:value={doctorData.name}
								type="text"
								required
								placeholder="Dr. John Smith"
							/>
						</div>

						<div class="form-group">
							<label for="medicalLicense">Medical License Number *</label>
							<input
								id="medicalLicense"
								bind:value={doctorData.medicalLicenseNumber}
								type="text"
								required
								placeholder="MD-123456"
							/>
						</div>

						<div class="form-group">
							<label for="specialty">Medical Specialty *</label>
							<select id="specialty" bind:value={doctorData.medicalSpecialty} required>
								<option value="">Select Specialty</option>
								<option value="Cardiology">Cardiology</option>
								<option value="Neurology">Neurology</option>
								<option value="Orthopedics">Orthopedics</option>
								<option value="Pediatrics">Pediatrics</option>
								<option value="Internal Medicine">Internal Medicine</option>
								<option value="Surgery">Surgery</option>
								<option value="Emergency Medicine">Emergency Medicine</option>
								<option value="Radiology">Radiology</option>
								<option value="Pathology">Pathology</option>
								<option value="General Practice">General Practice</option>
								<option value="Other">Other</option>
							</select>
						</div>

						<div class="form-group">
							<label for="department">Department *</label>
							<input
								id="department"
								bind:value={doctorData.department}
								type="text"
								required
								placeholder="e.g., Cardiology, Emergency"
							/>
						</div>

						<div class="form-group">
							<label for="experience">Years of Experience *</label>
							<input
								id="experience"
								bind:value={doctorData.yearsOfExperience}
								type="number"
								min="0"
								max="50"
								required
								placeholder="5"
							/>
						</div>

						<div class="form-group">
							<label for="doctorPhone">Contact Phone *</label>
							<input
								id="doctorPhone"
								bind:value={doctorData.contactPhone}
								type="tel"
								required
								placeholder="+1 (555) 123-4567"
							/>
						</div>

						<div class="form-group">
							<label for="doctorEmail">Contact Email *</label>
							<input
								id="doctorEmail"
								bind:value={doctorData.contactEmail}
								type="email"
								required
								placeholder="doctor@hospital.com"
							/>
						</div>
					</div>

					<button type="submit" class="submit-btn" disabled={submitting}>
						{#if submitting}
							Registering Doctor...
						{:else}
							Register Doctor
						{/if}
					</button>
				</form>
			</div>
		{/if}

		<!-- Success Screen -->
		{#if currentStep === 'success'}
			<div class="success-section">
				<CheckCircle size={64} />
				<h2>Registration Complete!</h2>
				<p>Your medical institution and doctor credentials have been successfully registered.</p>
				<p>You can now access the document storage system.</p>

				<a href="/storage" class="success-btn"> Go to Document Storage </a>
			</div>
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

	.success-section {
		text-align: center;
		padding: 3rem 2rem;
		background: #f0fdf4;
		border: 2px solid #bbf7d0;
		border-radius: 1rem;
		color: #15803d;
	}

	.success-section h2 {
		margin: 1rem 0;
		color: #15803d;
	}

	.success-section p {
		margin-bottom: 1rem;
		color: #16a34a;
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
