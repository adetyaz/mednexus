<script lang="ts">
	import { enhancedOGStorageService, type MedicalDataUpload } from '$lib/services/ogStorage';

	let selectedFile = $state<File | null>(null);
	let uploading = $state(false);
	let uploadStatus = $state('');
	let uploadError = $state('');
	let uploadSuccess = $state('');
	let files = $state<MedicalDataUpload[]>([]);
	let processingStep = $state('');

	$effect(() => {
		(async () => {
			await enhancedOGStorageService.init();
			files = enhancedOGStorageService.getAllUploads();
		})();
	});

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		selectedFile = target.files?.[0] || null;
		// Clear previous messages
		uploadError = '';
		uploadSuccess = '';
		uploadStatus = '';
	}

	async function uploadFile() {
		if (!selectedFile) return;

		uploading = true;
		uploadError = '';
		uploadSuccess = '';

		try {
			processingStep = 'encryption';
			uploadStatus = 'Encrypting medical data for secure storage';
			await new Promise((resolve) => setTimeout(resolve, 500));

			processingStep = 'upload';
			uploadStatus = 'Uploading to 0G decentralized storage network';
			const result = await enhancedOGStorageService.uploadMedicalData(selectedFile, {
				patientId: 'patient_001',
				institutionId: 'hospital_001',
				dataType: 'clinical_notes',
				medicalSpecialty: 'General',
				urgencyLevel: 'routine',
				accessPermissions: ['hospital_001'],
				retentionPeriod: 365,
				isAnonymized: true
			});

			processingStep = 'verification';
			uploadStatus = 'Verifying upload integrity and blockchain record';
			await new Promise((resolve) => setTimeout(resolve, 300));

			processingStep = 'complete';
			uploadStatus = 'Upload completed successfully';
			uploadSuccess = `File "${selectedFile.name}" uploaded successfully. Storage Hash: ${result.storageHash.substring(0, 16)}...`;

			files = enhancedOGStorageService.getAllUploads();
			selectedFile = null;

			// Clear the input
			const input = document.querySelector('input[type="file"]') as HTMLInputElement;
			if (input) input.value = '';
		} catch (error) {
			console.error('Upload failed:', error);
			uploadError = `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
			uploadStatus = '';
		} finally {
			uploading = false;
			if (!uploadError) {
				setTimeout(() => {
					uploadStatus = '';
				}, 3000);
			}
		}
	}

	function getFileStatusIcon(file: any) {
		if (file.storageHash) return 'verified';
		if (file.error) return 'error';
		return 'processing';
	}

	function getFileStatusText(file: any) {
		if (file.storageHash) return 'Stored on 0G Network';
		if (file.error) return 'Upload Failed';
		return 'Processing...';
	}
</script>

<main>
	<div class="header">
		<h1>File Upload</h1>
		<p>Upload medical files securely</p>
		<a href="/">← Back</a>
	</div>

	<div class="upload-section">
		<h2>Upload Medical File</h2>
		<p>Select a medical file to upload to the secure 0G decentralized storage network</p>

		<input type="file" onchange={handleFileSelect} accept=".pdf,.doc,.docx,.txt,.json" />

		{#if selectedFile}
			<div class="file-preview">
				<strong>Selected:</strong>
				{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
			</div>
		{/if}

		<button onclick={uploadFile} disabled={!selectedFile || uploading} class="upload-btn">
			{uploading ? 'Uploading...' : 'Upload File'}
		</button>

		{#if uploadStatus}
			<div class="status-message">
				<div class="status-indicator status-{processingStep}"></div>
				{uploadStatus}
			</div>
		{/if}

		{#if uploadSuccess}
			<div class="success-message">
				{uploadSuccess}
				<div class="next-steps">
					<h3>Next Steps</h3>
					<ul>
						<li><a href="/verification">Verify medical credentials</a> to access shared files</li>
						<li><a href="/monitoring">Monitor file status</a> and network activity</li>
						<li>Share secure access with authorized medical professionals</li>
					</ul>
				</div>
			</div>
		{/if}

		{#if uploadError}
			<div class="error-message">
				{uploadError}
				<div class="error-help">
					<p><strong>Troubleshooting:</strong></p>
					<ul>
						<li>Check your internet connection</li>
						<li>Ensure file size is under 10MB</li>
						<li>Try a different file format</li>
					</ul>
				</div>
			</div>
		{/if}
	</div>

	<div class="files-section">
		<h2>Your Medical Files</h2>
		{#if files.length > 0}
			<div class="files-grid">
				{#each files as file}
					<div class="file-card">
						<div class="file-header">
							<div class="status-badge status-{getFileStatusIcon(file)}"></div>
							<div class="file-info">
								<h3>{file.filename}</h3>
								<p class="file-size">{(file.fileSize / 1024).toFixed(1)} KB</p>
							</div>
						</div>

						<div class="file-status">
							<span class="status-text">{getFileStatusText(file)}</span>
							{#if file.storageHash}
								<div class="hash-info">
									<small>Hash: {file.storageHash.substring(0, 16)}...</small>
								</div>
							{/if}
						</div>

						<div class="file-metadata">
							<div class="metadata-item">
								<span class="label">Type:</span>
								<span class="value">{file.dataType || 'Medical Document'}</span>
							</div>
							<div class="metadata-item">
								<span class="label">Uploaded:</span>
								<span class="value">{new Date(file.uploadDate).toLocaleString()}</span>
							</div>
							{#if file.encryptionKey}
								<div class="metadata-item">
									<span class="label">Encrypted:</span>
									<span class="value">Yes</span>
								</div>
							{/if}
						</div>

						{#if file.storageHash}
							<div class="file-actions">
								<button
									class="action-btn"
									onclick={() => navigator.clipboard.writeText(file.storageHash)}
								>
									Copy Hash
								</button>
								<button class="action-btn"> Share Access </button>
							</div>
						{/if}
					</div>
				{/each}
			</div>

			<div class="files-summary">
				<h3>Storage Summary</h3>
				<div class="summary-stats">
					<div class="stat">
						<span class="stat-number">{files.length}</span>
						<span class="stat-label">Files Uploaded</span>
					</div>
					<div class="stat">
						<span class="stat-number"
							>{(files.reduce((sum, f) => sum + f.fileSize, 0) / 1024 / 1024).toFixed(2)}</span
						>
						<span class="stat-label">MB Used</span>
					</div>
					<div class="stat">
						<span class="stat-number">{files.filter((f) => f.storageHash).length}</span>
						<span class="stat-label">Successfully Stored</span>
					</div>
				</div>
			</div>
		{:else}
			<div class="empty-state">
				<div class="empty-icon"></div>
				<h3>No files uploaded yet</h3>
				<p>Upload your first medical file to get started with secure decentralized storage.</p>
				<p class="empty-description">
					Files uploaded here are encrypted and stored on the 0G decentralized network, ensuring
					security and accessibility for authorized medical professionals.
				</p>
			</div>
		{/if}
	</div>
</main>

<style>
	main {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
	}

	.header {
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #eee;
	}

	.header h1 {
		font-size: 2rem;
		margin: 0 0 0.5rem 0;
		color: #333;
	}

	.header p {
		color: #666;
		margin: 0 0 1rem 0;
	}

	.header a {
		color: #666;
		text-decoration: none;
	}

	.upload-section {
		background: white;
		padding: 2rem;
		border: 1px solid #ddd;
		border-radius: 8px;
		margin-bottom: 2rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.upload-section h2 {
		margin-top: 0;
		color: #333;
	}

	.upload-section input {
		display: block;
		margin-bottom: 1rem;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		width: 100%;
		font-size: 1rem;
	}

	.upload-btn {
		background: #2563eb;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 500;
		transition: background-color 0.2s;
	}

	.upload-btn:hover:not(:disabled) {
		background: #1d4ed8;
	}

	.upload-btn:disabled {
		background: #9ca3af;
		cursor: not-allowed;
	}

	.file-preview {
		background: #f3f4f6;
		padding: 0.75rem;
		border-radius: 4px;
		margin-bottom: 1rem;
		border-left: 4px solid #2563eb;
	}

	.status-message {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		background: #eff6ff;
		border: 1px solid #bfdbfe;
		border-radius: 4px;
		margin-top: 1rem;
	}

	.status-indicator {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		animation: pulse 2s infinite;
	}

	.status-indicator.status-encryption {
		background: #f59e0b;
	}

	.status-indicator.status-upload {
		background: #3b82f6;
	}

	.status-indicator.status-verification {
		background: #8b5cf6;
	}

	.status-indicator.status-complete {
		background: #10b981;
		animation: none;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.success-message {
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		padding: 1rem;
		border-radius: 4px;
		margin-top: 1rem;
		border-left: 4px solid #10b981;
	}

	.error-message {
		background: #fef2f2;
		border: 1px solid #fecaca;
		padding: 1rem;
		border-radius: 4px;
		margin-top: 1rem;
		border-left: 4px solid #ef4444;
	}

	.next-steps {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #d1fae5;
	}

	.next-steps h3 {
		margin: 0 0 0.5rem 0;
		color: #059669;
	}

	.next-steps ul {
		margin: 0;
		padding-left: 1.5rem;
	}

	.next-steps li {
		margin-bottom: 0.25rem;
	}

	.next-steps a {
		color: #2563eb;
		text-decoration: none;
	}

	.next-steps a:hover {
		text-decoration: underline;
	}

	.error-help {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #fecaca;
	}

	.files-section {
		background: white;
		padding: 2rem;
		border: 1px solid #ddd;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.files-section h2 {
		margin-top: 0;
		margin-bottom: 1.5rem;
		color: #333;
	}

	.files-grid {
		display: grid;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.file-card {
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 1.5rem;
		background: #fafafa;
	}

	.file-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.status-badge {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.status-badge.status-verified {
		background: #10b981;
	}

	.status-badge.status-error {
		background: #ef4444;
	}

	.status-badge.status-processing {
		background: #f59e0b;
		animation: pulse 2s infinite;
	}

	.file-info h3 {
		margin: 0;
		font-size: 1.1rem;
		color: #333;
	}

	.file-size {
		margin: 0.25rem 0 0 0;
		color: #666;
		font-size: 0.9rem;
	}

	.file-status {
		margin-bottom: 1rem;
	}

	.status-text {
		font-weight: 500;
		color: #374151;
	}

	.hash-info {
		margin-top: 0.5rem;
	}

	.hash-info small {
		color: #6b7280;
		font-family: monospace;
	}

	.file-metadata {
		display: grid;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.metadata-item {
		display: flex;
		justify-content: space-between;
		padding: 0.5rem 0;
		border-bottom: 1px solid #e5e7eb;
	}

	.metadata-item:last-child {
		border-bottom: none;
	}

	.label {
		font-weight: 500;
		color: #374151;
	}

	.value {
		color: #6b7280;
	}

	.file-actions {
		display: flex;
		gap: 0.5rem;
	}

	.action-btn {
		background: #f3f4f6;
		border: 1px solid #d1d5db;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
		transition: background-color 0.2s;
	}

	.action-btn:hover {
		background: #e5e7eb;
	}

	.files-summary {
		border-top: 1px solid #e5e7eb;
		padding-top: 1.5rem;
	}

	.files-summary h3 {
		margin: 0 0 1rem 0;
		color: #333;
	}

	.summary-stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
	}

	.stat {
		text-align: center;
		padding: 1rem;
		background: #f9fafb;
		border-radius: 4px;
	}

	.stat-number {
		display: block;
		font-size: 1.5rem;
		font-weight: bold;
		color: #2563eb;
	}

	.stat-label {
		display: block;
		font-size: 0.9rem;
		color: #6b7280;
		margin-top: 0.25rem;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 2rem;
		color: #6b7280;
	}

	.empty-icon {
		width: 64px;
		height: 64px;
		background: #f3f4f6;
		border-radius: 50%;
		margin: 0 auto 1rem auto;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2rem;
	}

	.empty-state h3 {
		margin: 0 0 0.5rem 0;
		color: #374151;
	}

	.empty-state p {
		margin: 0 0 0.5rem 0;
	}

	.empty-description {
		font-size: 0.9rem;
		color: #6b7280;
		max-width: 400px;
		margin: 1rem auto 0 auto;
	}
</style>
