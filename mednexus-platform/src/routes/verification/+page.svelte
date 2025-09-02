<script lang="ts">
	import { onMount } from 'svelte';
	import { medicalAuthorityService, type MedicalAuthority } from '$lib/services/medicalAuthority';

	let authorities = $state<MedicalAuthority[]>([]);

	onMount(async () => {
		await medicalAuthorityService.initialize();
		authorities = medicalAuthorityService.getActiveAuthorities();
	});
</script>

<main>
	<div class="page-header">
		<h1>Medical Verification</h1>
		<p>Global medical licensing and credential validation system</p>
		<a href="/" class="back-link">← Back to Home</a>
	</div>

	<div class="content-grid">
		<div class="verification-form">
			<h2>Verify Credentials</h2>
			<form>
				<div class="form-group">
					<label for="credential-id">Credential ID</label>
					<input type="text" id="credential-id" placeholder="Enter credential identifier" />
				</div>
				
				<div class="form-group">
					<label for="authority">Issuing Authority</label>
					<select id="authority">
						<option value="">Select authority</option>
						{#each authorities as authority}
							<option value={authority.id}>{authority.name} ({authority.country})</option>
						{/each}
					</select>
				</div>
				
				<div class="form-group">
					<label for="institution">Institution</label>
					<input type="text" id="institution" placeholder="Institution name" />
				</div>
				
				<button type="submit" class="verify-btn">Verify Credentials</button>
			</form>
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

	.back-link {
		color: #666;
		text-decoration: none;
		font-size: 0.9rem;
	}

	.back-link:hover {
		color: #333;
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
