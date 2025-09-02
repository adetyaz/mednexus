<script lang="ts">
	import { enhancedOGStorageService } from '$lib/services/ogStorage';

	let selectedFile = $state<File | null>(null);
	let uploading = $state(false);
	let files = $state<any[]>([]);

	$effect(() => {
		(async () => {
			await enhancedOGStorageService.init();
			files = enhancedOGStorageService.getAllUploads();
		})();
	});

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		selectedFile = target.files?.[0] || null;
	}

	async function uploadFile() {
		if (!selectedFile) return;

		uploading = true;
		try {
			await enhancedOGStorageService.uploadMedicalData(selectedFile, {
				patientId: 'patient_001',
				institutionId: 'hospital_001',
				dataType: 'clinical_notes',
				medicalSpecialty: 'General',
				urgencyLevel: 'routine',
				accessPermissions: ['hospital_001'],
				retentionPeriod: 365,
				isAnonymized: true
			});

			files = enhancedOGStorageService.getAllUploads();
			selectedFile = null;
		} finally {
			uploading = false;
		}
	}
</script>

<main>
	<div class="header">
		<h1>File Upload</h1>
		<p>Upload medical files securely</p>
		<a href="/">← Back</a>
	</div>

	<div class="upload-section">
		<input type="file" onchange={handleFileSelect} />
		<button onclick={uploadFile} disabled={!selectedFile || uploading}>
			{uploading ? 'Uploading...' : 'Upload File'}
		</button>
	</div>

	<div class="files-section">
		<h2>Uploaded Files</h2>
		{#if files.length > 0}
			{#each files as file}
				<div class="file-item">
					<span>{file.filename}</span>
					<span>{(file.fileSize / 1024).toFixed(1)} KB</span>
				</div>
			{/each}
		{:else}
			<p>No files uploaded</p>
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
	}

	.upload-section input {
		display: block;
		margin-bottom: 1rem;
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		width: 100%;
	}

	.upload-section button {
		background: #333;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		cursor: pointer;
	}

	.upload-section button:disabled {
		background: #ccc;
		cursor: not-allowed;
	}

	.files-section h2 {
		margin-bottom: 1rem;
		color: #333;
	}

	.file-item {
		display: flex;
		justify-content: space-between;
		padding: 0.75rem;
		border: 1px solid #eee;
		border-radius: 4px;
		margin-bottom: 0.5rem;
		background: white;
	}

	.files-section p {
		color: #666;
		font-style: italic;
	}
</style>
