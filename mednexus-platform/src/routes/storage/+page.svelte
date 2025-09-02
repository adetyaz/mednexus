<script lang="ts">
	import { onMount } from 'svelte';
	import { enhancedOGStorageService } from '$lib/services/ogStorage';

	interface MedicalDataUpload {
		id: string;
		patientId: string;
		institutionId: string;
		dataType: 'clinical_notes' | 'imaging' | 'lab_results' | 'diagnostic_reports' | 'treatment_plans';
		filename: string;
		fileSize: number;
		encryptionKey: string;
		storageHash: string;
		uploadDate: string;
		accessPermissions: string[];
		consentStatus: 'granted' | 'pending' | 'revoked';
		retentionPeriod: number;
		isAnonymized: boolean;
		medicalSpecialty: string;
		urgencyLevel: 'routine' | 'urgent' | 'emergency';
		complianceFlags: string[];
	}

	interface StorageStats {
		totalFiles: number;
		totalSize: string;
		storageUsed: string;
		storageAvailable: string;
		filesThisMonth: number;
		averageFileSize: string;
		complianceStatus: 'compliant' | 'warning' | 'violation';
		lastBackup: string;
	}

	interface StorageInfo {
		ready: boolean;
		storageType: string;
		endpoint: string;
		status: 'connected' | 'disconnected' | 'error';
	}

	let storageInfo = $state<StorageInfo | null>(null);
	let storageStats = $state<StorageStats | null>(null);
	let uploads = $state<MedicalDataUpload[]>([]);
	let selectedFile = $state<File | null>(null);
	let uploadProgress = $state(false);

	onMount(async () => {
		await enhancedOGStorageService.init();
		storageInfo = await enhancedOGStorageService.getStorageInfo();
		storageStats = enhancedOGStorageService.getStorageStats();
		uploads = enhancedOGStorageService.getAllUploads();
	});

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		selectedFile = target.files?.[0] || null;
	}

	async function handleUpload() {
		if (!selectedFile) return;
		
		uploadProgress = true;
		try {
			await enhancedOGStorageService.uploadMedicalData(
				selectedFile,
				{
					patientId: 'patient_' + Math.random().toString(16).substr(2, 8),
					institutionId: 'inst_001',
					dataType: 'clinical_notes',
					medicalSpecialty: 'General Medicine',
					urgencyLevel: 'routine',
					accessPermissions: ['inst_001'],
					retentionPeriod: 365,
					isAnonymized: true
				}
			);
			
			// Refresh data
			storageStats = enhancedOGStorageService.getStorageStats();
			uploads = enhancedOGStorageService.getAllUploads();
			selectedFile = null;
		} catch (error) {
			console.error('Upload failed:', error);
		} finally {
			uploadProgress = false;
		}
	}
</script>

<main>
	<div class="page-header">
		<h1>Medical Data Storage</h1>
		<p>Encrypted medical data storage with HIPAA compliance</p>
		<a href="/" class="back-link">← Back to Home</a>
	</div>

	<div class="storage-dashboard">
		<div class="storage-stats">
			<h2>Storage Overview</h2>
			{#if storageStats}
				<div class="stats-grid">
					<div class="stat-card">
						<span class="stat-number">{storageStats.totalFiles}</span>
						<span class="stat-label">Total Files</span>
					</div>
					<div class="stat-card">
						<span class="stat-number">{storageStats.totalSize}</span>
						<span class="stat-label">Total Size</span>
					</div>
					<div class="stat-card">
						<span class="stat-number">{storageStats.filesThisMonth}</span>
						<span class="stat-label">This Month</span>
					</div>
					<div class="stat-card">
						<span class="stat-number">{storageStats.averageFileSize}</span>
						<span class="stat-label">Avg Size</span>
					</div>
				</div>
			{/if}
		</div>

		<div class="upload-section">
			<h2>Upload Medical Data</h2>
			<div class="upload-form">
				<div class="file-input-wrapper">
					<input 
						type="file" 
						id="file-input"
						onchange={handleFileSelect}
						accept=".pdf,.doc,.docx,.txt,.json"
					/>
					<label for="file-input" class="file-input-label">
						{selectedFile ? selectedFile.name : 'Choose file to upload'}
					</label>
				</div>
				
				<button 
					class="upload-btn" 
					disabled={!selectedFile || uploadProgress}
					onclick={handleUpload}
				>
					{uploadProgress ? 'Uploading...' : 'Upload to 0G Storage'}
				</button>
			</div>
		</div>

		<div class="storage-status">
			<h2>System Status</h2>
			{#if storageInfo}
				<div class="status-items">
					<div class="status-item">
						<span class="status-label">Storage Type</span>
						<span class="status-value">{storageInfo.storageType}</span>
					</div>
					<div class="status-item">
						<span class="status-label">Connection</span>
						<span class="status-value status-{storageInfo.status}">{storageInfo.status}</span>
					</div>
					<div class="status-item">
						<span class="status-label">Endpoint</span>
						<span class="status-value">{storageInfo.endpoint}</span>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<div class="uploads-section">
		<h2>Recent Uploads</h2>
		{#if uploads.length > 0}
			<div class="uploads-table">
				<div class="table-header">
					<span>Filename</span>
					<span>Type</span>
					<span>Size</span>
					<span>Upload Date</span>
					<span>Status</span>
				</div>
				{#each uploads.slice(0, 10) as upload}
					<div class="table-row">
						<span class="filename">{upload.filename}</span>
						<span class="file-type">{upload.dataType.replace('_', ' ')}</span>
						<span class="file-size">{(upload.fileSize / 1024).toFixed(1)} KB</span>
						<span class="upload-date">{new Date(upload.uploadDate).toLocaleDateString()}</span>
						<span class="status-badge {upload.consentStatus}">{upload.consentStatus}</span>
					</div>
				{/each}
			</div>
		{:else}
			<div class="empty-uploads">
				<p>No files uploaded yet</p>
			</div>
		{/if}
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

	.storage-dashboard {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr;
		gap: 24px;
		margin-bottom: 32px;
	}

	.storage-stats,
	.upload-section,
	.storage-status {
		background: white;
		padding: 24px;
		border-radius: 12px;
		border: 1px solid #e5e5e5;
	}

	.storage-stats h2,
	.upload-section h2,
	.storage-status h2,
	.uploads-section h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1a1a1a;
		margin: 0 0 20px 0;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
	}

	.stat-card {
		text-align: center;
		padding: 16px;
		background: #f8f9fa;
		border-radius: 8px;
	}

	.stat-number {
		display: block;
		font-size: 1.5rem;
		font-weight: 600;
		color: #1a1a1a;
		margin-bottom: 4px;
	}

	.stat-label {
		font-size: 0.75rem;
		color: #666;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.upload-form {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.file-input-wrapper {
		position: relative;
	}

	#file-input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}

	.file-input-label {
		display: block;
		padding: 12px 16px;
		background: #f8f9fa;
		border: 2px dashed #d0d0d0;
		border-radius: 8px;
		text-align: center;
		cursor: pointer;
		color: #666;
		transition: all 0.2s ease;
	}

	.file-input-label:hover {
		background: #e9ecef;
		border-color: #999;
	}

	.upload-btn {
		padding: 12px 24px;
		background: #1a1a1a;
		color: white;
		border: none;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.upload-btn:hover:not(:disabled) {
		background: #333;
	}

	.upload-btn:disabled {
		background: #ccc;
		cursor: not-allowed;
	}

	.status-items {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.status-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.status-label {
		font-size: 0.9rem;
		color: #666;
	}

	.status-value {
		font-size: 0.9rem;
		font-weight: 500;
		color: #1a1a1a;
	}

	.status-connected {
		color: #22c55e;
	}

	.uploads-section {
		background: white;
		padding: 24px;
		border-radius: 12px;
		border: 1px solid #e5e5e5;
	}

	.uploads-table {
		display: flex;
		flex-direction: column;
	}

	.table-header,
	.table-row {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
		gap: 16px;
		padding: 12px 0;
		border-bottom: 1px solid #f0f0f0;
	}

	.table-header {
		font-weight: 600;
		color: #1a1a1a;
		font-size: 0.9rem;
	}

	.table-row {
		font-size: 0.875rem;
		color: #666;
	}

	.filename {
		color: #1a1a1a;
		font-weight: 500;
	}

	.status-badge {
		padding: 2px 8px;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 500;
		text-align: center;
	}

	.status-badge.granted {
		background: #dcfce7;
		color: #166534;
	}

	.empty-uploads {
		text-align: center;
		padding: 32px;
		color: #666;
	}

	@media (max-width: 1024px) {
		.storage-dashboard {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 768px) {
		.table-header,
		.table-row {
			grid-template-columns: 1fr;
			gap: 8px;
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
