<script lang="ts">
	import { walletStore } from '$lib/wallet';
	import { medicalDocumentManager } from '$lib/services/medicalDocumentManagementService';

	// Import additional icons for document types
	import {
		Building2,
		Upload,
		FolderOpen,
		FileText,
		Microscope,
		Activity,
		Users,
		ArrowLeft,
		CheckCircle,
		Clock,
		Shield,
		MapPin,
		User,
		Plus,
		Download,
		Share2,
		Eye,
		Search,
		Filter,
		BookOpen,
		Clipboard,
		FlaskConical,
		Scan,
		Stethoscope,
		Scissors,
		GraduationCap,
		Building,
		BookMarked
	} from '@lucide/svelte';

	let currentStep = $state<
		'start' | 'select-file' | 'choose-type' | 'choose-access' | 'uploading' | 'success' | 'my-files'
	>('start');
	let selectedFile = $state<File | null>(null);
	let selectedDataType = $state<string>('');
	let selectedCategory = $state<'private' | 'departmental' | 'institutional' | 'shared'>('private');
	let uploading = $state(false);
	let uploadProgress = $state(0);
	let uploadMessage = $state('');
	let userFiles = $state<any>(null);
	let showingCategory = $state<'private' | 'departmental' | 'institutional' | 'shared'>('private');
	let fileStats = $state<any>(null);
	let doctorContext = $state<any>(null);

	// Modal system
	let showModal = $state(false);
	let modalTitle = $state('');
	let modalMessage = $state('');
	let modalType = $state<'info' | 'success' | 'error'>('info');

	// Sharing modal
	let showShareModal = $state(false);
	let shareFile = $state<any>(null);
	let selectedInstitution = $state('');
	let shareMessage = $state('');

	// Reactive variables for wallet connection
	let userConnected = $state(false);
	let userWallet = $state('');

	// Modal helper function
	function showModalMessage(
		title: string,
		message: string,
		type: 'info' | 'success' | 'error' = 'info'
	) {
		modalTitle = title;
		modalMessage = message;
		modalType = type;
		showModal = true;
	}

	// Professional medical document types for institutional use
	const dataTypes = [
		{
			id: 'research_papers',
			name: 'Research Papers',
			description: 'Clinical studies, research findings, medical publications',
			category: 'research',
			icon: FileText
		},
		{
			id: 'clinical_protocols',
			name: 'Clinical Protocols',
			description: 'Treatment guidelines, diagnostic procedures, clinical pathways',
			category: 'clinical',
			icon: Clipboard
		},
		{
			id: 'medical_literature',
			name: 'Medical Literature',
			description: 'Journal articles, medical references, educational materials',
			category: 'research',
			icon: BookOpen
		},
		{
			id: 'drug_trial_data',
			name: 'Drug Trial Data',
			description: 'Clinical trial results, pharmaceutical research, drug studies',
			category: 'research',
			icon: FlaskConical
		},
		{
			id: 'diagnostic_imaging',
			name: 'Diagnostic Imaging',
			description: 'Radiology references, imaging protocols, scan templates',
			category: 'clinical',
			icon: Scan
		},
		{
			id: 'pathology_reports',
			name: 'Pathology Reports',
			description: 'Lab analysis templates, pathology references, specimen protocols',
			category: 'clinical',
			icon: Microscope
		},
		{
			id: 'surgical_procedures',
			name: 'Surgical Procedures',
			description: 'Operative techniques, surgical protocols, procedure documentation',
			category: 'clinical',
			icon: Scissors
		},
		{
			id: 'educational_materials',
			name: 'Educational Materials',
			description: 'Training resources, medical education content, learning modules',
			category: 'institutional',
			icon: GraduationCap
		},
		{
			id: 'administrative_docs',
			name: 'Administrative Documents',
			description: 'Institutional policies, compliance documents, operational procedures',
			category: 'institutional',
			icon: Building
		},
		{
			id: 'case_studies',
			name: 'Case Studies',
			description: 'Medical case analyses, treatment outcomes, clinical examples',
			category: 'research',
			icon: BookMarked
		},
		{
			id: 'medical_dataset',
			name: 'Medical AI Dataset',
			description:
				'Structured medical data for AI training, pattern recognition, diagnostic assistance',
			category: 'research',
			icon: Activity
		}
	];

	// Initialize when institution wallet connects
	$effect(() => {
		// Access wallet store reactively - Svelte 5 automatically tracks this
		if ($walletStore.isConnected && $walletStore.address) {
			userConnected = true;
			userWallet = $walletStore.address;

			// Initialize the document management service
			(async () => {
				try {
					console.log('Initializing Medical Document Management Service...');
					await medicalDocumentManager.initialize();
					console.log('Medical Document Management Service initialized successfully');
				} catch (error) {
					console.error('Failed to initialize Medical Document Management Service:', error);
				}

				// Get doctor context to verify institutional registration
				const address = $walletStore.address;
				if (address) {
					try {
						const context = await medicalDocumentManager.getDoctorContext(address);
						if (context.success) {
							doctorContext = context;
							await loadInstitutionFiles();
							console.log('✅ Doctor context loaded from database:', context.doctor?.name);
						} else {
							console.warn('Doctor not registered with medical institution:', context.message);
							doctorContext = null;
							showModalMessage(
								'Registration Required',
								'Please complete doctor registration first to access document storage.',
								'info'
							);
						}
					} catch (error) {
						console.error('Failed to load doctor context:', error);
						doctorContext = null;
						showModalMessage(
							'Connection Error',
							'Failed to connect to medical database. Please check your connection.',
							'error'
						);
					}
				}
			})();
		} else {
			userConnected = false;
			userWallet = '';
			doctorContext = null;
			currentStep = 'start';
		}
	});

	async function loadInstitutionFiles() {
		if (!userConnected || !doctorContext) return;

		try {
			console.log('Loading institution files for doctor:', doctorContext.doctor?.name);
			const result = await medicalDocumentManager.getDoctorAccessibleDocuments(userWallet);
			if (result.success) {
				userFiles = result.documents;
				console.log('✅ Loaded documents:', result.documents?.length || 0);

				const statsResult = await medicalDocumentManager.getInstitutionStatistics(userWallet);
				if (statsResult.success) {
					fileStats = statsResult.statistics;
					console.log('✅ Loaded statistics:', statsResult.statistics);
				} else {
					console.warn('Failed to load statistics:', statsResult.message);
				}
			} else {
				console.warn('Failed to load documents:', result.message);
				showModalMessage(
					'Loading Error',
					'Failed to load documents. Please try refreshing the page.',
					'error'
				);
			}
		} catch (error) {
			console.error('Error loading institution files:', error);
			showModalMessage(
				'Connection Error',
				'Failed to connect to document storage. Please check your connection.',
				'error'
			);
		}
	}

	function startUpload() {
		if (!userConnected) {
			showModalMessage('Wallet Required', 'Please connect your institution wallet first!', 'error');
			return;
		}

		if (!doctorContext || !doctorContext.success) {
			showModalMessage(
				'Registration Required',
				'Please complete doctor registration before uploading documents.',
				'error'
			);
			return;
		}

		currentStep = 'select-file';
	}

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		selectedFile = target.files?.[0] || null;
		if (selectedFile) {
			currentStep = 'choose-type';
		}
	}

	function selectDataType(typeId: string) {
		selectedDataType = typeId;
		// Proceed to access level selection
		currentStep = 'choose-access';
	}

	async function uploadFile() {
		if (!selectedFile || !selectedDataType || !userConnected) return;

		currentStep = 'uploading';
		uploading = true;
		uploadProgress = 0;

		try {
			// Step 1: Prepare file for institutional storage
			uploadMessage = 'Preparing file for secure institutional storage...';
			uploadProgress = 25;
			await new Promise((resolve) => setTimeout(resolve, 800));

			// Step 2: Upload to decentralized medical storage
			uploadMessage = 'Uploading to decentralized medical network...';
			uploadProgress = 50;

			const result = await medicalDocumentManager.uploadMedicalDocument(selectedFile, userWallet, {
				medicalDataType: selectedDataType,
				medicalSpecialty: doctorContext?.doctor?.medicalSpecialty || 'General Medicine',
				urgencyLevel: 'routine',
				description: `${selectedDataType} document uploaded by ${doctorContext?.doctor?.name || 'Doctor'}`,
				accessLevel: selectedCategory,
				tags: [selectedDataType, selectedCategory]
			});

			if (!result.success) {
				throw new Error(result.message);
			}

			// Step 3: Complete
			uploadMessage = 'Document successfully uploaded and indexed.';
			uploadProgress = 100;
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Reload institution files
			await loadInstitutionFiles();

			currentStep = 'success';
		} catch (error: any) {
			console.error('Upload failed:', error);
			uploadMessage = error.message || 'Upload failed. Please try again or contact IT support.';
		} finally {
			uploading = false;
		}
	}

	function goToMyFiles() {
		currentStep = 'my-files';
	}

	function resetUpload() {
		selectedFile = null;
		selectedDataType = '';
		uploadProgress = 0;
		uploadMessage = '';
		currentStep = 'start';
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

		if (days === 0) return 'Today';
		if (days === 1) return 'Yesterday';
		if (days < 7) return `${days} days ago`;
		return date.toLocaleDateString();
	}

	// Document action functions
	async function viewDocument(file: any) {
		// Show document details in a formatted alert
		const details = `
📄 DOCUMENT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 File Name: ${file.fileName}
🏷️  Type: ${file.medicalDataType}
📏 Size: ${formatFileSize(file.fileSize)}
📅 Uploaded: ${formatDate(file.uploadDate)}
🏥 Department: ${file.departmentId || 'Not specified'}
⚕️  Specialty: ${file.medicalSpecialty || 'Not specified'}
📝 Description: ${file.description || 'No description available'}
✅ Status: ${file.approvalStatus || 'Pending'}
🔐 Access Level: ${file.accessLevel || 'Private'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
		`.trim();

		alert(details);
	}

	function shareDocument(file: any) {
		if (!userWallet) {
			showModalMessage('Wallet Required', 'Please connect your wallet first', 'error');
			return;
		}

		// Open sharing modal
		shareFile = file;
		shareMessage = `Sharing medical document: ${file.fileName}`;
		selectedInstitution = '';
		showShareModal = true;
	}

	async function confirmShare() {
		if (!selectedInstitution) {
			showModalMessage(
				'Institution Required',
				'Please select an institution to share with',
				'error'
			);
			return;
		}

		try {
			showShareModal = false;
			showModalMessage('Sharing Document', 'Processing share request...', 'info');

			const result = await medicalDocumentManager.shareDocument(
				shareFile.fileId,
				userWallet,
				selectedInstitution,
				shareMessage
			);

			if (result.success) {
				showModalMessage(
					'Share Successful',
					`Document shared successfully with the selected institution!`,
					'success'
				);
				// Refresh the file list
				await loadInstitutionFiles();
			} else {
				showModalMessage('Share Failed', `Failed to share document: ${result.message}`, 'error');
			}
		} catch (error) {
			console.error('Share failed:', error);
			showModalMessage('Share Error', 'Failed to share document. Please try again.', 'error');
		}
	}

	async function downloadDocument(file: any) {
		if (!userWallet) {
			showModalMessage('Wallet Required', 'Please connect your wallet first', 'error');
			return;
		}

		try {
			// For now, we'll use a placeholder encryption key
			// In production, this would be retrieved from secure storage
			const encryptionKey = 'placeholder-key';

			const result = await medicalDocumentManager.downloadDocument(
				file.fileId,
				userWallet,
				encryptionKey
			);

			if (result.success && result.fileData) {
				// Create a blob and download the file
				// Convert Uint8Array to proper type for Blob
				const data = new Uint8Array(result.fileData);
				const blob = new Blob([data], { type: 'application/octet-stream' });
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = result.fileName || 'downloaded-file';
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);

				alert(`✅ Document "${result.fileName}" downloaded successfully!`);
			} else {
				alert(`❌ Failed to download document: ${result.message}`);
			}
		} catch (error) {
			console.error('Download failed:', error);
			showModalMessage(
				'Download Failed',
				'Failed to download document. Please try again.',
				'error'
			);
		}
	}
</script>

<!-- Start Screen -->
{#if currentStep === 'start'}
	<div class="screen start-screen">
		<div class="welcome-hero">
			<div class="hero-icon">
				<Building2 size={48} />
			</div>
			<h1>Medical Document Storage</h1>
			<p class="hero-subtitle">Secure decentralized storage for medical institutions</p>
		</div>

		<div class="doctor-info">
			<div class="institution-badge">
				<Building size={20} />
				<div>
					<div class="institution-name">
						{doctorContext?.institution?.name || 'Medical Institution'}
					</div>
					<div class="doctor-details">
						{doctorContext?.doctor?.name ? `Dr. ${doctorContext.doctor.name}` : 'Doctor'} • {doctorContext
							?.doctor?.department || 'General Medicine'}
					</div>
				</div>
			</div>
		</div>

		<div class="actions">
			<button class="big-button upload-button" onclick={startUpload}>
				<div class="button-icon">
					<Upload size={24} />
				</div>
				<div class="button-text">
					<strong>Upload Document</strong>
					<small>Add medical documentation</small>
				</div>
			</button>

			<button class="big-button files-button" onclick={goToMyFiles}>
				<div class="button-icon">
					<FolderOpen size={24} />
				</div>
				<div class="button-text">
					<strong>Document Library</strong>
					<small>{fileStats?.totalDocuments || 0} documents stored</small>
				</div>
			</button>
		</div>

		{#if fileStats && fileStats.totalFiles > 0}
			<div class="quick-stats">
				<div class="stat-card">
					<div class="stat-number">{fileStats.totalFiles}</div>
					<div class="stat-label">Documents</div>
				</div>
				<div class="stat-card">
					<div class="stat-number">{formatFileSize(fileStats.totalSize)}</div>
					<div class="stat-label">Storage Used</div>
				</div>
				<div class="stat-card">
					<div class="stat-number">{fileStats.recentFiles.length}</div>
					<div class="stat-label">Recent</div>
				</div>
			</div>
		{/if}
	</div>
{/if}

<!-- File Selection Screen -->
{#if currentStep === 'select-file'}
	<div class="screen file-select-screen">
		<div class="screen-header">
			<Upload size={20} />
			<h1>Select Document</h1>
		</div>
		<p>Choose the medical document you want to upload to secure storage.</p>

		<div class="file-drop-zone">
			<input
				type="file"
				onchange={handleFileSelect}
				accept=".pdf,.doc,.docx,.txt,.json,.jpg,.png,.jpeg,.dicom,.csv,.xlsx"
				id="file-input"
			/>
			<label for="file-input">
				<div class="drop-icon">
					<FolderOpen size={48} />
				</div>
				<div class="drop-text">
					<strong>Click to select document</strong>
					<small>or drag and drop files here</small>
					<div class="accepted-formats">
						Accepted: PDF, DOC, DOCX, TXT, JSON, Images, DICOM, CSV, XLSX
					</div>
				</div>
			</label>
		</div>

		{#if selectedFile}
			<div class="selected-file">
				<div class="file-preview">
					<div class="file-icon">
						<FileText size={24} />
					</div>
					<div class="file-info">
						<strong>{selectedFile.name}</strong>
						<small>{formatFileSize(selectedFile.size)}</small>
					</div>
				</div>
			</div>
		{/if}

		<div class="screen-actions">
			<button class="back-button" onclick={() => (currentStep = 'start')}>
				<ArrowLeft size={16} /> Back to Home
			</button>
		</div>
	</div>
{/if}

<!-- Document Type Selection Screen -->
{#if currentStep === 'choose-type'}
	<div class="screen type-select-screen">
		<div class="screen-header">
			<Clipboard size={20} />
			<h1>Document Classification</h1>
		</div>
		<p>Select the type of medical document for proper categorization and access control.</p>

		<div class="type-grid">
			{#each dataTypes as type}
				{@const Icon = type.icon}
				<button class="type-card" onclick={() => selectDataType(type.id)}>
					<div class="type-header">
						<div class="type-icon">
							<Icon size={20} />
						</div>
						<div class="type-info">
							<div class="type-name">{type.name}</div>
							<div class="type-category">{type.category}</div>
						</div>
					</div>
					<div class="type-description">{type.description}</div>
				</button>
			{/each}
		</div>

		<div class="screen-actions">
			<button class="back-button" onclick={() => (currentStep = 'select-file')}>
				<ArrowLeft size={16} /> Choose Different File
			</button>
		</div>
	</div>
{/if}

<!-- Access Level Selection Screen -->
{#if currentStep === 'choose-access'}
	<div class="screen access-select-screen">
		<div class="screen-header">
			<Shield size={20} />
			<h1>Document Access Level</h1>
		</div>
		<p>Choose who can access this medical document within your institution.</p>

		<div class="access-options">
			<button
				class="access-card {selectedCategory === 'private' ? 'selected' : ''}"
				onclick={() => (selectedCategory = 'private')}
			>
				<div class="access-header">
					<User size={20} />
					<div class="access-info">
						<div class="access-name">Private</div>
						<div class="access-desc">Only you can access</div>
					</div>
				</div>
				<div class="access-details">
					Document visible only to you. Use for personal notes, drafts, or sensitive information.
				</div>
			</button>

			<button
				class="access-card {selectedCategory === 'departmental' ? 'selected' : ''}"
				onclick={() => (selectedCategory = 'departmental')}
			>
				<div class="access-header">
					<Users size={20} />
					<div class="access-info">
						<div class="access-name">Departmental</div>
						<div class="access-desc">Your department colleagues</div>
					</div>
				</div>
				<div class="access-details">
					Share with your department team. Good for protocols, procedures, and collaborative
					documents.
				</div>
			</button>

			<button
				class="access-card {selectedCategory === 'institutional' ? 'selected' : ''}"
				onclick={() => (selectedCategory = 'institutional')}
			>
				<div class="access-header">
					<Building2 size={20} />
					<div class="access-info">
						<div class="access-name">Institutional</div>
						<div class="access-desc">All hospital staff</div>
					</div>
				</div>
				<div class="access-details">
					Available to all staff at your institution. Use for hospital-wide policies and procedures.
				</div>
			</button>

			<button
				class="access-card {selectedCategory === 'shared' ? 'selected' : ''}"
				onclick={() => (selectedCategory = 'shared')}
			>
				<div class="access-header">
					<Share2 size={20} />
					<div class="access-info">
						<div class="access-name">Shared Research</div>
						<div class="access-desc">Medical network collaboration</div>
					</div>
				</div>
				<div class="access-details">
					Share with partner medical institutions for research and collaboration.
				</div>
			</button>
		</div>

		<div class="screen-actions">
			<button class="back-button" onclick={() => (currentStep = 'choose-type')}>
				<ArrowLeft size={16} /> Change Document Type
			</button>
			<button class="continue-button" onclick={() => uploadFile()}>
				Upload Document <Upload size={16} />
			</button>
		</div>
	</div>
{/if}

<!-- Uploading Screen -->
{#if currentStep === 'uploading'}
	<div class="screen uploading-screen">
		<div class="screen-header">
			<Clock size={20} />
			<h1>Processing Upload</h1>
		</div>
		<p>Your medical document is being securely processed and stored...</p>

		<div class="progress-container">
			<div class="progress-bar">
				<div class="progress-fill" style="width: {uploadProgress}%"></div>
			</div>
			<div class="progress-text">{uploadProgress}%</div>
		</div>

		<div class="upload-message">
			{uploadMessage}
		</div>

		<div class="upload-steps">
			<div class="step {uploadProgress >= 25 ? 'completed' : ''}">
				<Shield size={16} /> Securing document
			</div>
			<div class="step {uploadProgress >= 50 ? 'completed' : ''}">
				<Upload size={16} /> Network upload
			</div>
			<div class="step {uploadProgress >= 75 ? 'completed' : ''}">
				<FolderOpen size={16} /> Indexing
			</div>
			<div class="step {uploadProgress >= 100 ? 'completed' : ''}">
				<CheckCircle size={16} /> Complete
			</div>
		</div>
	</div>
{/if}

<!-- Success Screen -->
{#if currentStep === 'success'}
	<div class="screen success-screen">
		<div class="success-icon">
			<CheckCircle size={48} />
		</div>
		<h1>Document Upload Complete</h1>
		<p>
			Your medical document <strong>{selectedFile?.name}</strong> has been successfully uploaded to the
			secure decentralized network.
		</p>

		<div class="success-details">
			<div class="detail-item">
				<span class="detail-label">
					<Shield size={16} /> Security:
				</span>
				<span class="detail-value">Encrypted and compliant</span>
			</div>
			<div class="detail-item">
				<span class="detail-label">
					<MapPin size={16} /> Storage:
				</span>
				<span class="detail-value">Decentralized medical network</span>
			</div>
			<div class="detail-item">
				<span class="detail-label">
					<Users size={16} /> Access:
				</span>
				<span class="detail-value">Institution controlled</span>
			</div>
			<div class="detail-item">
				<span class="detail-label">
					<Clock size={16} /> Retention:
				</span>
				<span class="detail-value">10 years (institutional standard)</span>
			</div>
		</div>

		<div class="success-actions">
			<button class="big-button" onclick={resetUpload}> Upload Another Document </button>
			<button class="big-button secondary" onclick={goToMyFiles}> View Document Library </button>
		</div>
	</div>
{/if}

<!-- Document Library Screen -->
{#if currentStep === 'my-files'}
	<div class="screen files-screen">
		<div class="files-header">
			<div class="header-title">
				<FolderOpen size={24} />
				<h1>Document Library</h1>
			</div>
			<button class="add-file-btn" onclick={() => (currentStep = 'select-file')}>
				<Plus size={16} /> Add Document
			</button>
		</div>

		<!-- Category Tabs -->
		<div class="category-tabs">
			<button
				class="tab {showingCategory === 'private' ? 'active' : ''}"
				onclick={() => (showingCategory = 'private')}
			>
				<User size={16} /> Private ({userFiles?.privateDocuments?.length || 0})
			</button>
			<button
				class="tab {showingCategory === 'departmental' ? 'active' : ''}"
				onclick={() => (showingCategory = 'departmental')}
			>
				<Users size={16} /> Department ({userFiles?.departmentalDocuments?.length || 0})
			</button>
			<button
				class="tab {showingCategory === 'institutional' ? 'active' : ''}"
				onclick={() => (showingCategory = 'institutional')}
			>
				<Building size={16} /> Hospital ({userFiles?.institutionalDocuments?.length || 0})
			</button>
			<button
				class="tab {showingCategory === 'shared' ? 'active' : ''}"
				onclick={() => (showingCategory = 'shared')}
			>
				<Share2 size={16} /> Shared ({userFiles?.sharedDocuments?.length || 0})
			</button>
		</div>

		<!-- Files List -->
		<div class="files-list">
			{#if userFiles}
				{@const currentFiles =
					showingCategory === 'private'
						? userFiles.privateDocuments
						: showingCategory === 'departmental'
							? userFiles.departmentalDocuments
							: showingCategory === 'institutional'
								? userFiles.institutionalDocuments
								: showingCategory === 'shared'
									? userFiles.sharedDocuments
									: userFiles.publicDocuments}

				{#if currentFiles && currentFiles.length > 0}
					{#each currentFiles as file}
						{@const fileType = dataTypes.find((t) => t.id === file.medicalDataType)}
						<div class="file-item">
							<div class="file-icon">
								{#if fileType && fileType.icon}
									{@const Icon = fileType.icon}
									<Icon size={20} />
								{:else}
									<FileText size={20} />
								{/if}
							</div>
							<div class="file-details">
								<div class="file-name">{file.fileName}</div>
								<div class="file-meta">
									{formatFileSize(file.fileSize)} • {formatDate(file.uploadDate)}
									{#if file.departmentId}
										• {file.departmentId}
									{/if}
									{#if file.approvalStatus === 'pending'}
										• <span class="status pending">Pending Approval</span>
									{:else if file.approvalStatus === 'approved'}
										• <span class="status approved">Approved</span>
									{/if}
								</div>
								<div class="file-type">
									{fileType?.name || file.medicalDataType}
									{#if file.medicalSpecialty}
										• {file.medicalSpecialty}
									{/if}
								</div>
								{#if file.description}
									<div class="file-description">{file.description}</div>
								{/if}
							</div>
							<div class="file-actions">
								<button class="small-btn" onclick={() => viewDocument(file)}>
									<Eye size={14} /> View
								</button>
								<button class="small-btn" onclick={() => shareDocument(file)}>
									<Share2 size={14} /> Share
								</button>
								<button class="small-btn" onclick={() => downloadDocument(file)}>
									<Download size={14} /> Download
								</button>
							</div>
						</div>
					{/each}
				{:else}
					<div class="empty-files">
						<div class="empty-icon">
							{#if showingCategory === 'private'}
								<User size={48} />
							{:else if showingCategory === 'departmental'}
								<Users size={48} />
							{:else if showingCategory === 'institutional'}
								<Building size={48} />
							{:else}
								<Share2 size={48} />
							{/if}
						</div>
						<h3>No {showingCategory} documents yet</h3>
						<p>
							{#if showingCategory === 'private'}
								Your personal medical documents will appear here.
							{:else if showingCategory === 'departmental'}
								Documents shared within your department will appear here.
							{:else if showingCategory === 'institutional'}
								Hospital-wide institutional documents will appear here.
							{:else}
								Documents shared between institutions will appear here.
							{/if}
						</p>
					</div>
				{/if}
			{/if}
		</div>

		<div class="screen-actions">
			<button class="back-button" onclick={() => (currentStep = 'start')}>
				<ArrowLeft size={16} /> Back to Home
			</button>
		</div>
	</div>
{/if}

<!-- Modal Component -->
{#if showModal}
	<div class="modal-overlay" onclick={() => (showModal = false)}>
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header {modalType}">
				<h3>{modalTitle}</h3>
				<button class="modal-close" onclick={() => (showModal = false)}>×</button>
			</div>
			<div class="modal-body">
				<p>{modalMessage}</p>
			</div>
			<div class="modal-actions">
				<button class="modal-button" onclick={() => (showModal = false)}>OK</button>
			</div>
		</div>
	</div>
{/if}

<!-- Share Document Modal -->
{#if showShareModal && shareFile}
	<div class="modal-overlay" onclick={() => (showShareModal = false)}>
		<div class="modal-content share-modal" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h3>🔗 Share Document</h3>
				<button class="modal-close" onclick={() => (showShareModal = false)}>×</button>
			</div>
			<div class="modal-body">
				<div class="share-info">
					<p><strong>Document:</strong> {shareFile.fileName}</p>
					<p><strong>Type:</strong> {shareFile.medicalDataType}</p>
				</div>

				<div class="form-group">
					<label for="institution-select">Select Institution:</label>
					<select id="institution-select" bind:value={selectedInstitution}>
						<option value="">Choose an institution...</option>
						<option value="mercy-general-sf">Mercy General Hospital</option>
						<option value="st-marys-london">St. Mary's Hospital London</option>
						<option value="toronto-general">Toronto General Hospital</option>
						<option value="royal-melbourne">Royal Melbourne Hospital</option>
					</select>
				</div>

				<div class="form-group">
					<label for="share-message">Message (optional):</label>
					<textarea
						id="share-message"
						bind:value={shareMessage}
						placeholder="Add a message about why you're sharing this document..."
						rows="3"
					></textarea>
				</div>
			</div>
			<div class="modal-actions">
				<button class="modal-button secondary" onclick={() => (showShareModal = false)}
					>Cancel</button
				>
				<button class="modal-button primary" onclick={() => confirmShare()}>Share Document</button>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Professional Medical Interface Styles */

	/* Main Container */
	.screen {
		max-width: 900px;
		margin: 0 auto;
		padding: 2rem;
		min-height: 80vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	/* Screen Headers */
	.screen-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.screen-header h1 {
		font-size: 1.75rem;
		margin: 0;
		color: #1f2937;
		font-weight: 600;
	}

	/* Start Screen */
	.welcome-hero {
		text-align: center;
		margin-bottom: 3rem;
	}

	.hero-icon {
		margin-bottom: 1rem;
		color: #3b82f6;
	}

	.welcome-hero h1 {
		font-size: 2rem;
		margin: 0 0 0.5rem 0;
		color: #1f2937;
		font-weight: 600;
	}

	.hero-subtitle {
		font-size: 1rem;
		color: #6b7280;
		margin: 0;
	}

	.connect-wallet {
		text-align: center;
		padding: 2rem;
		background: #f3f4f6;
		border-radius: 1rem;
		border: 2px solid #d1d5db;
		margin-bottom: 2rem;
		max-width: 500px;
	}

	.connect-icon {
		margin-bottom: 1rem;
		color: #3b82f6;
	}

	.connect-wallet h2 {
		color: #374151;
		margin-bottom: 1rem;
		font-size: 1.25rem;
	}

	.help-text {
		color: #6b7280;
		font-weight: 500;
		font-size: 0.875rem;
	}

	.doctor-info {
		margin: 2rem 0;
	}

	.institution-badge {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		padding: 1rem 1.25rem;
		margin: 0 auto;
		max-width: 400px;
	}

	.institution-name {
		font-weight: 600;
		color: #1e293b;
		margin-bottom: 0.25rem;
	}

	.doctor-details {
		font-size: 0.875rem;
		color: #64748b;
	}

	.actions {
		display: flex;
		gap: 2rem;
		flex-wrap: wrap;
		justify-content: center;
		margin-bottom: 2rem;
	}

	.big-button {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 2rem 2.5rem;
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: 1rem;
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
		min-width: 250px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.big-button:hover {
		border-color: #3b82f6;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.upload-button:hover {
		border-color: #059669;
		background: #ecfdf5;
	}

	.files-button:hover {
		border-color: #7c3aed;
		background: #f5f3ff;
	}

	.button-icon {
		color: #3b82f6;
	}

	.button-text strong {
		display: block;
		font-size: 1rem;
		color: #1f2937;
		margin-bottom: 0.25rem;
	}

	.button-text small {
		color: #6b7280;
		font-size: 0.875rem;
	}

	.quick-stats {
		display: flex;
		gap: 1.5rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.stat-card {
		text-align: center;
		padding: 1.5rem;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.75rem;
		min-width: 100px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.stat-number {
		font-size: 2rem;
		font-weight: bold;
		color: #1f2937;
		display: block;
	}

	.stat-label {
		font-size: 0.8rem;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 500;
	}

	/* File Selection */
	.file-drop-zone {
		width: 100%;
		max-width: 600px;
		margin: 2rem 0;
	}

	.file-drop-zone input {
		display: none;
	}

	.file-drop-zone label {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 4rem 2rem;
		border: 3px dashed #d1d5db;
		border-radius: 1rem;
		cursor: pointer;
		transition: all 0.2s;
		background: #fafafa;
	}

	.file-drop-zone label:hover {
		border-color: #3b82f6;
		background: #f8fafc;
	}

	.drop-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
		opacity: 0.7;
	}

	.drop-text strong {
		display: block;
		font-size: 1.3rem;
		color: #1f2937;
		margin-bottom: 0.5rem;
	}

	.drop-text small {
		color: #6b7280;
		margin-bottom: 1rem;
	}

	.accepted-formats {
		font-size: 0.8rem;
		color: #9ca3af;
		text-align: center;
		line-height: 1.4;
	}

	.selected-file {
		margin: 1.5rem 0;
		padding: 1.5rem;
		background: #ecfdf5;
		border: 1px solid #059669;
		border-radius: 0.75rem;
		max-width: 500px;
	}

	.file-preview {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.file-icon {
		font-size: 2rem;
	}

	.file-info strong {
		display: block;
		color: #065f46;
		font-weight: 600;
	}

	.file-info small {
		color: #059669;
	}

	/* Type Selection */
	.type-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
		width: 100%;
		max-width: 1000px;
		margin: 2rem 0;
	}

	.type-card {
		padding: 2rem;
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: 1rem;
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.type-card:hover {
		border-color: #3b82f6;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.type-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.type-icon {
		color: #3b82f6;
	}

	.type-info {
		flex: 1;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.type-name {
		font-weight: 600;
		color: #1f2937;
		font-size: 1rem;
	}

	.type-category {
		font-size: 0.75rem;
		padding: 0.25rem 0.75rem;
		background: #f3f4f6;
		color: #6b7280;
		border-radius: 1rem;
		text-transform: uppercase;
		font-weight: 500;
	}

	.type-description {
		color: #6b7280;
		line-height: 1.5;
		font-size: 0.875rem;
	}

	/* Access Level Selection */
	.access-options {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 600px;
		margin: 2rem 0;
	}

	.access-card {
		padding: 1.5rem;
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: 1rem;
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.access-card:hover {
		border-color: #3b82f6;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.access-card.selected {
		border-color: #059669;
		background: #f0fdf4;
	}

	.access-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.access-info {
		flex: 1;
	}

	.access-name {
		font-weight: 600;
		color: #1f2937;
		font-size: 1rem;
	}

	.access-desc {
		font-size: 0.75rem;
		color: #6b7280;
		margin-top: 0.25rem;
	}

	.access-details {
		color: #6b7280;
		line-height: 1.5;
		font-size: 0.875rem;
	}

	.continue-button {
		background: #059669;
		color: white;
		padding: 0.75rem 2rem;
		border: none;
		border-radius: 0.5rem;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition: background 0.2s;
	}

	.continue-button:hover {
		background: #047857;
	}

	/* Upload Progress */
	.progress-container {
		width: 100%;
		max-width: 500px;
		margin: 2rem 0;
	}

	.progress-bar {
		width: 100%;
		height: 12px;
		background: #e5e7eb;
		border-radius: 6px;
		overflow: hidden;
		margin-bottom: 0.75rem;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #059669, #3b82f6);
		transition: width 0.3s ease;
	}

	.progress-text {
		text-align: center;
		font-weight: 600;
		color: #1f2937;
		font-size: 1.2rem;
	}

	.upload-message {
		text-align: center;
		font-size: 1.1rem;
		color: #4b5563;
		margin: 1.5rem 0 2rem 0;
		min-height: 1.5rem;
	}

	.upload-steps {
		display: flex;
		justify-content: space-between;
		width: 100%;
		max-width: 500px;
		margin: 2rem 0;
		gap: 0.5rem;
	}

	.step {
		text-align: center;
		padding: 0.75rem 0.5rem;
		font-size: 0.875rem;
		color: #9ca3af;
		border-radius: 0.5rem;
		transition: all 0.3s;
		flex: 1;
		font-weight: 500;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.step.completed {
		color: #059669;
		background: #ecfdf5;
		font-weight: 600;
	}

	/* Success Screen */
	.success-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.success-details {
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		border-radius: 0.75rem;
		padding: 2rem;
		margin: 2rem 0;
		width: 100%;
		max-width: 500px;
	}

	.detail-item {
		display: flex;
		justify-content: space-between;
		margin-bottom: 0.75rem;
		padding: 0.5rem 0;
	}

	.detail-item:last-child {
		margin-bottom: 0;
		border-bottom: none;
	}

	.detail-label {
		font-weight: 600;
		color: #065f46;
	}

	.detail-value {
		color: #059669;
		font-weight: 500;
	}

	.success-actions {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.secondary {
		background: #f8fafc;
		color: #374151;
	}

	.secondary:hover {
		background: #e2e8f0;
		border-color: #64748b;
	}

	/* Document Library */
	.files-screen {
		max-width: 1000px;
		align-items: stretch;
		justify-content: flex-start;
		padding-top: 2rem;
	}

	.files-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		margin-bottom: 2rem;
	}

	.header-title {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.header-title h1 {
		font-size: 1.75rem;
		margin: 0;
		color: #1f2937;
		font-weight: 600;
	}

	.add-file-btn {
		background: #059669;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		cursor: pointer;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		transition: background 0.2s;
	}

	.add-file-btn:hover {
		background: #047857;
	}

	.category-tabs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 2rem;
		width: 100%;
		overflow-x: auto;
	}

	.tab {
		flex: 1;
		padding: 0.875rem 1rem;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 0.875rem;
		text-align: center;
		white-space: nowrap;
		min-width: 150px;
		font-weight: 500;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.tab.active {
		background: #3b82f6;
		color: white;
		border-color: #3b82f6;
		font-weight: 600;
	}

	.tab:not(.active):hover {
		background: #e2e8f0;
	}

	.files-list {
		width: 100%;
		margin-bottom: 2rem;
	}

	.file-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.75rem;
		margin-bottom: 0.75rem;
		transition: all 0.2s;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.file-item:hover {
		border-color: #3b82f6;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.file-item .file-icon {
		font-size: 1.5rem;
	}

	.file-details {
		flex: 1;
	}

	.file-name {
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 0.25rem;
		font-size: 1.05rem;
	}

	.file-meta {
		font-size: 0.85rem;
		color: #6b7280;
		margin-bottom: 0.25rem;
	}

	.file-type {
		font-size: 0.8rem;
		color: #059669;
		font-weight: 500;
	}

	.file-actions {
		display: flex;
		gap: 0.5rem;
	}

	.small-btn {
		padding: 0.5rem 1rem;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		cursor: pointer;
		font-size: 0.75rem;
		transition: all 0.2s ease;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 0.375rem;
		color: #374151;
	}

	.small-btn:hover {
		background: #e2e8f0;
		border-color: #94a3b8;
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.small-btn:active {
		transform: translateY(0);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	}

	.empty-files {
		text-align: center;
		padding: 4rem 2rem;
		color: #6b7280;
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.empty-files h3 {
		color: #4b5563;
		margin-bottom: 1rem;
		font-weight: 600;
	}

	.empty-files p {
		line-height: 1.6;
		max-width: 400px;
		margin: 0 auto;
	}

	/* Status indicators */
	.status {
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.status.pending {
		background: #fef3c7;
		color: #d97706;
	}

	.status.approved {
		background: #dcfce7;
		color: #16a34a;
	}

	.file-description {
		font-size: 0.75rem;
		color: #6b7280;
		margin-top: 0.25rem;
		font-style: italic;
	}

	/* Navigation */
	.screen-actions {
		margin-top: auto;
		width: 100%;
		text-align: center;
	}

	.back-button {
		background: none;
		border: none;
		color: #6b7280;
		cursor: pointer;
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		transition: all 0.2s;
		font-size: 0.875rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.back-button:hover {
		background: #f3f4f6;
		color: #374151;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.screen {
			padding: 1rem;
		}

		.type-grid {
			grid-template-columns: 1fr;
		}

		.actions {
			flex-direction: column;
			width: 100%;
		}

		.big-button {
			width: 100%;
		}

		.files-header {
			flex-direction: column;
			gap: 1rem;
			align-items: stretch;
		}

		.category-tabs {
			flex-wrap: wrap;
		}

		.tab {
			flex: none;
			min-width: calc(50% - 0.25rem);
		}

		.file-item {
			flex-direction: column;
			align-items: stretch;
			gap: 1rem;
		}

		.file-actions {
			justify-content: stretch;
		}

		.small-btn {
			flex: 1;
		}

		.success-actions {
			flex-direction: column;
			width: 100%;
		}

		.big-button {
			min-width: auto;
		}
	}

	/* Modal Styles */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal-content {
		background: white;
		border-radius: 1rem;
		max-width: 500px;
		width: 90%;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
	}

	.modal-header {
		padding: 1.5rem 1.5rem 0 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid #e5e7eb;
		margin-bottom: 1rem;
	}

	.modal-header.success {
		color: #059669;
	}

	.modal-header.error {
		color: #ef4444;
	}

	.modal-header.info {
		color: #3b82f6;
	}

	.modal-header h3 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.modal-close {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: #6b7280;
		padding: 0;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.modal-close:hover {
		color: #374151;
	}

	.modal-body {
		padding: 0 1.5rem 1rem 1.5rem;
	}

	.modal-body p {
		margin: 0;
		color: #6b7280;
		line-height: 1.5;
	}

	.modal-actions {
		padding: 1rem 1.5rem 1.5rem 1.5rem;
		display: flex;
		justify-content: flex-end;
	}

	.modal-button {
		background: #3b82f6;
		color: white;
		border: none;
		padding: 0.5rem 1.5rem;
		border-radius: 0.5rem;
		cursor: pointer;
		font-weight: 500;
	}

	.modal-button:hover {
		background: #2563eb;
	}

	.modal-button.secondary {
		background: #f3f4f6;
		color: #374151;
	}

	.modal-button.secondary:hover {
		background: #e5e7eb;
	}

	/* Share Modal Specific Styles */
	.share-modal {
		max-width: 600px;
	}

	.share-info {
		background: #f8fafc;
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
	}

	.share-info p {
		margin: 0.5rem 0;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		color: #374151;
		font-weight: 500;
	}

	.form-group select,
	.form-group textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.875rem;
		transition: border-color 0.2s;
	}

	.form-group select:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.form-group textarea {
		resize: vertical;
	}
</style>
