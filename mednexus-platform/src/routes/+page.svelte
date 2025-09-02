<script>
	import WalletConnect from '$lib/components/WalletConnect.svelte';
	import { onMount } from 'svelte';
	import { enhancedOGStorageService } from '$lib/services/ogStorage';
	import { medicalAuthorityService } from '$lib/services/medicalAuthority';

	let storageReady = $state(false);
	let authorityReady = $state(false);

	onMount(async () => {
		// Initialize core services
		try {
			await enhancedOGStorageService.init();
			storageReady = true;
		} catch (error) {
			console.error('Storage init failed:', error);
		}

		try {
			await medicalAuthorityService.initialize();
			authorityReady = true;
		} catch (error) {
			console.error('Authority init failed:', error);
		}
	});
</script>

<main>
	<header class="header">
		<h1>MedNexus Platform</h1>
		<p>Global Medical Intelligence Ecosystem</p>
		<p>Powered by 0G Chain Infrastructure</p>
	</header>
	
	<WalletConnect />
	
	<section class="status-grid">
		<div class="status-card">
			<h3>0G Storage Service</h3>
			<div class="status {storageReady ? 'ready' : 'loading'}">
				{storageReady ? 'Ready' : 'Initializing...'}
			</div>
			<p>Encrypted medical data storage with HIPAA compliance</p>
		</div>

		<div class="status-card">
			<h3>Medical Authority Network</h3>
			<div class="status {authorityReady ? 'ready' : 'loading'}">
				{authorityReady ? 'Ready' : 'Initializing...'}
			</div>
			<p>Global medical licensing validation system</p>
		</div>

		<div class="status-card">
			<h3>Smart Contracts</h3>
			<div class="status ready">Ready</div>
			<p>Medical verification and collaboration contracts deployed</p>
		</div>

		<div class="status-card">
			<h3>Multi-Wallet Support</h3>
			<div class="status ready">Ready</div>
			<p>Reown AppKit integration with multiple wallet providers</p>
		</div>
	</section>

	<section class="platform-grid">
		<a href="/verification" class="platform-card">
			<h3>Medical Verification</h3>
			<p>Verify medical institutions and credentials using blockchain technology</p>
			<span class="link-indicator">Access Verification System</span>
		</a>

		<a href="/storage" class="platform-card">
			<h3>Medical Data Storage</h3>
			<p>Secure, encrypted storage for medical data with granular access controls</p>
			<span class="link-indicator">Manage Medical Data</span>
		</a>

		<a href="/monitoring" class="platform-card">
			<h3>System Monitoring</h3>
			<p>Real-time monitoring of platform services and network status</p>
			<span class="link-indicator">View System Status</span>
		</a>

		<a href="/test" class="platform-card">
			<h3>Test Interface</h3>
			<p>Testing interface for smart contract interactions and functionality</p>
			<span class="link-indicator">Open Test Console</span>
		</a>
	</section>
	
	<section class="info-section">
		<h2>Platform Overview</h2>
		<p>
			MedNexus creates the world's first seamless global medical intelligence ecosystem, 
			enabling hospitals, research institutions, and medical professionals worldwide to 
			collaborate securely while maintaining complete privacy and regulatory compliance.
		</p>
		
		<div class="contract-info">
			<h3>Deployed Contracts on 0G Chain Galileo Testnet</h3>
			<div class="contract-list">
				<div class="contract-item">
					<span class="contract-name">Medical Collaboration Hub</span>
					<span class="contract-address">0xdcEcd3Cf494069f9FB5614e05Efa4Fa45C4f949c</span>
				</div>
				<div class="contract-item">
					<span class="contract-name">Medical Verification</span>
					<span class="contract-address">0x2b83DDc5D0dd317D2A1e4adA44819b26CA54A652</span>
				</div>
				<div class="contract-item">
					<span class="contract-name">Medical Intelligence INFT</span>
					<span class="contract-address">0xe3259D46d5A4F900B5f9D1289CBf9791D9cc8b59</span>
				</div>
			</div>
			<div class="network-info">
				<p><strong>Network:</strong> 0G Chain Galileo Testnet</p>
				<p><strong>Chain ID:</strong> 16601</p>
				<p><strong>RPC:</strong> https://evmrpc-testnet.0g.ai</p>
			</div>
		</div>
	</section>
</main>

<style>
	main {
		max-width: 1200px;
		margin: 0 auto;
		padding: 20px;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		line-height: 1.6;
	}

	.header {
		text-align: center;
		margin-bottom: 40px;
		padding: 40px 0;
		background: #f8f9fa;
		border-radius: 8px;
	}

	.header h1 {
		font-size: 2.5rem;
		color: #2c3e50;
		margin-bottom: 8px;
		font-weight: 600;
	}

	.header p {
		color: #6c757d;
		margin: 4px 0;
		font-size: 1.1rem;
	}

	.status-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 20px;
		margin: 40px 0;
	}

	.status-card {
		background: white;
		border: 1px solid #e9ecef;
		border-radius: 8px;
		padding: 24px;
		box-shadow: 0 2px 4px rgba(0,0,0,0.04);
	}

	.status-card h3 {
		color: #2c3e50;
		margin-bottom: 12px;
		font-size: 1.2rem;
		font-weight: 600;
	}

	.status-card p {
		color: #6c757d;
		font-size: 0.9rem;
		margin-top: 8px;
	}

	.status {
		display: inline-block;
		padding: 4px 12px;
		border-radius: 16px;
		font-size: 0.85rem;
		font-weight: 500;
		margin-bottom: 8px;
	}

	.status.ready {
		background: #d4edda;
		color: #155724;
	}

	.status.loading {
		background: #fff3cd;
		color: #856404;
	}

	.platform-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 24px;
		margin: 40px 0;
	}

	.platform-card {
		background: white;
		border: 1px solid #e9ecef;
		border-radius: 8px;
		padding: 24px;
		text-decoration: none;
		color: inherit;
		transition: all 0.2s ease;
		box-shadow: 0 2px 4px rgba(0,0,0,0.04);
	}

	.platform-card:hover {
		border-color: #007bff;
		box-shadow: 0 4px 12px rgba(0,123,255,0.15);
		transform: translateY(-2px);
	}

	.platform-card h3 {
		color: #2c3e50;
		margin-bottom: 12px;
		font-size: 1.3rem;
		font-weight: 600;
	}

	.platform-card p {
		color: #6c757d;
		margin-bottom: 16px;
		line-height: 1.5;
	}

	.link-indicator {
		color: #007bff;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.info-section {
		background: #f8f9fa;
		border-radius: 8px;
		padding: 32px;
		margin-top: 40px;
	}

	.info-section h2 {
		color: #2c3e50;
		margin-bottom: 16px;
		font-size: 1.8rem;
		font-weight: 600;
	}

	.info-section p {
		color: #495057;
		line-height: 1.6;
		margin-bottom: 24px;
	}

	.contract-info {
		background: white;
		border: 1px solid #dee2e6;
		border-radius: 6px;
		padding: 24px;
	}

	.contract-info h3 {
		color: #2c3e50;
		margin-bottom: 16px;
		font-size: 1.2rem;
		font-weight: 600;
	}

	.contract-list {
		margin-bottom: 20px;
	}

	.contract-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 0;
		border-bottom: 1px solid #f1f3f4;
	}

	.contract-item:last-child {
		border-bottom: none;
	}

	.contract-name {
		font-weight: 500;
		color: #2c3e50;
	}

	.contract-address {
		font-family: 'Courier New', monospace;
		font-size: 0.85rem;
		color: #6c757d;
		background: #f8f9fa;
		padding: 4px 8px;
		border-radius: 4px;
	}

	.network-info {
		padding-top: 16px;
		border-top: 1px solid #f1f3f4;
	}

	.network-info p {
		margin: 4px 0;
		font-size: 0.9rem;
		color: #6c757d;
	}

	.network-info strong {
		color: #2c3e50;
	}

	@media (max-width: 768px) {
		.header h1 {
			font-size: 2rem;
		}
		
		.platform-grid {
			grid-template-columns: 1fr;
		}
		
		.status-grid {
			grid-template-columns: 1fr;
		}

		.contract-item {
			flex-direction: column;
			align-items: flex-start;
			gap: 8px;
		}
	}
</style>
