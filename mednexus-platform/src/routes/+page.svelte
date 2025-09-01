<!-- 
  MedNexus Platform - Wave 2 Implementation Demo
  Day 3: 0G Storage Integration
  Day 4: Medical Intelligence INFT Testing
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { ogStorageService, type MedicalDataUpload } from '$lib/services/ogStorage';
  import { medicalINFTService, type MedicalCase } from '$lib/services/medicalINFT';

  // Component state
  let storageStatus = { isConnected: false, networkInfo: 'Initializing...', endpoint: '' };
  let inftStatus = { isConnected: false, contractAddress: 'N/A', networkInfo: '', totalINFTs: 0 };
  
  // File upload state
  let selectedFile: File | null = null;
  let uploadProgress = '';
  let uploadResult: any = null;

  // Medical case state
  let medicalCase: MedicalCase = {
    caseId: '',
    title: '',
    description: '',
    patientData: {
      age: 0,
      gender: '',
      symptoms: [],
      medicalHistory: []
    },
    diagnosticData: {
      labResults: [],
      imagingResults: [],
      geneticMarkers: []
    },
    metadata: {
      hospitalId: '',
      department: '',
      specialty: '',
      timestamp: Date.now(),
      urgencyLevel: 'medium'
    }
  };

  let inftCreationProgress = '';
  let inftResult: any = null;

  // Initialize services on component mount
  onMount(async () => {
    // Initialize 0G Storage
    try {
      await ogStorageService.initialize();
      storageStatus = await ogStorageService.getStorageStatus();
    } catch (error) {
      console.error('Failed to initialize 0G Storage:', error);
    }

    // Initialize Medical INFT service (without signer for now)
    try {
      inftStatus = await medicalINFTService.getContractStatus();
    } catch (error) {
      console.error('Failed to get INFT status:', error);
    }
  });

  // Handle file selection
  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    selectedFile = target.files?.[0] || null;
  }

  // Upload medical data to 0G Storage
  async function uploadMedicalData() {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    uploadProgress = 'Preparing upload...';
    
    const uploadData: MedicalDataUpload = {
      file: selectedFile,
      patientId: 'patient_001',
      dataType: 'scan',
      metadata: {
        hospitalId: 'demo_hospital',
        department: 'radiology',
        timestamp: Date.now(),
        encryptionMethod: 'AES-GCM-256'
      }
    };

    try {
      uploadProgress = 'Encrypting and uploading...';
      uploadResult = await ogStorageService.uploadMedicalData(uploadData);
      uploadProgress = 'Upload completed successfully!';
    } catch (error) {
      uploadProgress = `Upload failed: ${error}`;
      console.error('Upload error:', error);
    }
  }

  // Create Medical Intelligence INFT
  async function createMedicalINFT() {
    if (!medicalCase.title || !medicalCase.description) {
      alert('Please fill in case title and description');
      return;
    }

    inftCreationProgress = 'Preparing Medical Intelligence INFT...';
    
    // Generate unique case ID
    medicalCase.caseId = `case_${Date.now()}`;
    medicalCase.metadata.timestamp = Date.now();

    try {
      inftCreationProgress = 'Creating INFT on blockchain...';
      inftResult = await medicalINFTService.createMedicalINFT(medicalCase);
      inftCreationProgress = 'Medical Intelligence INFT created successfully!';
    } catch (error) {
      inftCreationProgress = `INFT creation failed: ${error}`;
      console.error('INFT creation error:', error);
    }
  }

  // Add symptom to the list
  function addSymptom() {
    const symptom = (document.getElementById('symptomInput') as HTMLInputElement)?.value;
    if (symptom && !medicalCase.patientData.symptoms.includes(symptom)) {
      medicalCase.patientData.symptoms = [...medicalCase.patientData.symptoms, symptom];
      (document.getElementById('symptomInput') as HTMLInputElement).value = '';
    }
  }

  // Remove symptom from the list
  function removeSymptom(index: number) {
    medicalCase.patientData.symptoms = medicalCase.patientData.symptoms.filter((_, i) => i !== index);
  }
</script>

<svelte:head>
  <title>MedNexus - Wave 2 Implementation Demo</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
  <div class="max-w-6xl mx-auto">
    <!-- Header -->
    <div class="text-center mb-12">
      <h1 class="text-4xl font-bold text-gray-800 mb-4">
        🏥 MedNexus Platform
      </h1>
      <p class="text-xl text-gray-600 mb-2">
        Wave 2 Implementation Demo
      </p>
      <div class="flex justify-center space-x-8 text-sm text-gray-500">
        <span>📅 Day 3: 0G Storage Integration</span>
        <span>🏆 Day 4: Medical Intelligence INFTs</span>
      </div>
    </div>

    <!-- Status Cards -->
    <div class="grid md:grid-cols-2 gap-6 mb-12">
      <!-- 0G Storage Status -->
      <div class="bg-white rounded-xl shadow-lg p-6">
        <h3 class="text-xl font-semibold text-gray-800 mb-4">
          🗄️ 0G Storage Status
        </h3>
        <div class="space-y-2">
          <div class="flex justify-between">
            <span>Connection:</span>
            <span class="{storageStatus.isConnected ? 'text-green-600' : 'text-red-600'}">
              {storageStatus.isConnected ? '✅ Connected' : '❌ Disconnected'}
            </span>
          </div>
          <div class="flex justify-between">
            <span>Network:</span>
            <span class="text-gray-600">{storageStatus.networkInfo}</span>
          </div>
          <div class="flex justify-between">
            <span>Endpoint:</span>
            <span class="text-gray-600 text-xs">{storageStatus.endpoint}</span>
          </div>
        </div>
      </div>

      <!-- Medical INFT Status -->
      <div class="bg-white rounded-xl shadow-lg p-6">
        <h3 class="text-xl font-semibold text-gray-800 mb-4">
          🏆 Medical Intelligence INFT Status
        </h3>
        <div class="space-y-2">
          <div class="flex justify-between">
            <span>Connection:</span>
            <span class="{inftStatus.isConnected ? 'text-green-600' : 'text-red-600'}">
              {inftStatus.isConnected ? '✅ Ready' : '❌ Not Connected'}
            </span>
          </div>
          <div class="flex justify-between">
            <span>Network:</span>
            <span class="text-gray-600">{inftStatus.networkInfo}</span>
          </div>
          <div class="flex justify-between">
            <span>Total INFTs:</span>
            <span class="text-gray-600">{inftStatus.totalINFTs}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Day 3: 0G Storage Integration -->
    <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
      <h2 class="text-2xl font-bold text-gray-800 mb-6">
        📤 Day 3: Medical Data Upload (0G Storage)
      </h2>
      
      <div class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Select Medical File
          </label>
          <input 
            type="file" 
            on:change={handleFileSelect}
            accept=".jpg,.jpeg,.png,.pdf,.dcm"
            class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {#if selectedFile}
            <p class="text-sm text-gray-600 mt-2">
              Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
            </p>
          {/if}
        </div>

        <button 
          on:click={uploadMedicalData}
          disabled={!selectedFile}
          class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          🔐 Encrypt & Upload to 0G Storage
        </button>

        {#if uploadProgress}
          <div class="p-4 bg-blue-50 rounded-lg">
            <p class="text-blue-800">{uploadProgress}</p>
          </div>
        {/if}

        {#if uploadResult}
          <div class="p-4 bg-green-50 rounded-lg">
            <h4 class="font-semibold text-green-800 mb-2">Upload Successful!</h4>
            <div class="text-sm text-green-700 space-y-1">
              <p><strong>Content Hash:</strong> {uploadResult.contentHash.substring(0, 20)}...</p>
              <p><strong>Storage URI:</strong> {uploadResult.storageUri}</p>
              <p><strong>Data Hash:</strong> {uploadResult.dataHash.substring(0, 20)}...</p>
              <p><strong>Encryption:</strong> {uploadResult.metadata.encryptionMethod}</p>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Day 4: Medical Intelligence INFT Creation -->
    <div class="bg-white rounded-xl shadow-lg p-8">
      <h2 class="text-2xl font-bold text-gray-800 mb-6">
        🏆 Day 4: Create Medical Intelligence INFT
      </h2>
      
      <div class="grid md:grid-cols-2 gap-8">
        <!-- Case Information -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-gray-700">Case Information</h3>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Case Title</label>
            <input 
              bind:value={medicalCase.title}
              placeholder="e.g., Rare Cardiac Arrhythmia Case"
              class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea 
              bind:value={medicalCase.description}
              placeholder="Detailed case description..."
              rows="3"
              class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <input 
                bind:value={medicalCase.metadata.department}
                placeholder="e.g., Cardiology"
                class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
              <input 
                bind:value={medicalCase.metadata.specialty}
                placeholder="e.g., Electrophysiology"
                class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Urgency Level</label>
            <select 
              bind:value={medicalCase.metadata.urgencyLevel}
              class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <!-- Patient Data -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-gray-700">Patient Information</h3>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input 
                type="number"
                bind:value={medicalCase.patientData.age}
                placeholder="45"
                class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select 
                bind:value={medicalCase.patientData.gender}
                class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Symptoms</label>
            <div class="flex gap-2 mb-2">
              <input 
                id="symptomInput"
                placeholder="Add symptom"
                class="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button 
                on:click={addSymptom}
                class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Add
              </button>
            </div>
            <div class="flex flex-wrap gap-2">
              {#each medicalCase.patientData.symptoms as symptom, index}
                <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  {symptom}
                  <button on:click={() => removeSymptom(index)} class="text-blue-600 hover:text-blue-800">×</button>
                </span>
              {/each}
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Hospital ID</label>
            <input 
              bind:value={medicalCase.metadata.hospitalId}
              placeholder="e.g., johns_hopkins_001"
              class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div class="mt-8">
        <button 
          on:click={createMedicalINFT}
          class="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700"
        >
          🏆 Create Medical Intelligence INFT
        </button>

        {#if inftCreationProgress}
          <div class="mt-4 p-4 bg-purple-50 rounded-lg">
            <p class="text-purple-800">{inftCreationProgress}</p>
          </div>
        {/if}

        {#if inftResult}
          <div class="mt-4 p-4 bg-green-50 rounded-lg">
            <h4 class="font-semibold text-green-800 mb-2">Medical Intelligence INFT Created!</h4>
            <div class="text-sm text-green-700 space-y-1">
              <p><strong>Token ID:</strong> {inftResult.tokenId}</p>
              <p><strong>Transaction Hash:</strong> {inftResult.transactionHash.substring(0, 20)}...</p>
              <p><strong>IPFS URI:</strong> {inftResult.ipfsUri}</p>
              <p><strong>Revenue Share:</strong> {inftResult.revenueShare}% to original hospital</p>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
	main {
		max-width: 800px;
		margin: 0 auto;
		padding: 20px;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	h1 {
		color: #2c3e50;
		text-align: center;
		margin-bottom: 10px;
	}

	.info-section {
		margin-top: 40px;
		padding: 20px;
		background: #f8f9fa;
		border-radius: 8px;
	}

	.contract-info {
		margin-top: 20px;
		padding: 15px;
		background: #e9ecef;
		border-radius: 6px;
		border-left: 4px solid #007bff;
	}

	.contract-info p {
		margin: 5px 0;
		font-family: 'Courier New', monospace;
		font-size: 14px;
	}

	p {
		text-align: center;
		color: #666;
		margin: 5px 0 20px 0;
	}

	.info-section p {
		text-align: left;
		line-height: 1.6;
	}

	h2, h3 {
		color: #2c3e50;
		margin-bottom: 15px;
	}
</style>
