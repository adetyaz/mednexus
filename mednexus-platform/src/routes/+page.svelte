<script>
	import WalletConnect from '$lib/components/WalletConnect.svelte';
</script>

<nav class="main-nav">
	<div class="nav-container">
		<div class="nav-brand">
			<a href="/">MedNexus</a>
		</div>
		<div class="nav-links">
			<a href="/verification">Medical Verification</a>
			<a href="/storage">Data Storage</a>
			<a href="/collaboration">Collaboration Hub</a>
			<a href="/monitoring">System Monitor</a>
		</div>
		<div class="nav-wallet">
			<WalletConnect />
		</div>
	</div>
</nav>

<main>
	<header class="hero">
		<div class="hero-content">
			<h1>Secure Medical Data Platform</h1>
			<p class="tagline">Connecting medical institutions worldwide for better patient outcomes</p>
			<p class="subtitle">HIPAA-compliant data sharing with blockchain verification</p>
			<div class="hero-actions">
				<a href="/verification" class="btn btn-primary">Get Verified</a>
				<a href="/storage" class="btn btn-secondary">Upload Data</a>
			</div>
		</div>
	</header>

	<section class="features">
		<div class="feature-grid">
			<div class="feature">
				<h3>🔐 Secure Data Storage</h3>
				<p>
					Upload medical records, imaging files, lab results, and clinical notes with end-to-end
					encryption on blockchain infrastructure
				</p>
				<a href="/storage" class="feature-link">Access Storage →</a>
			</div>
			<div class="feature">
				<h3>✅ Medical Verification</h3>
				<p>
					Verify medical institutions and healthcare providers with blockchain-based credentials and
					licensing validation
				</p>
				<a href="/verification" class="feature-link">Get Verified →</a>
			</div>
			<div class="feature">
				<h3>🤝 Global Collaboration</h3>
				<p>
					Connect with verified medical professionals worldwide for consultations, research, and
					knowledge sharing
				</p>
				<a href="/collaboration" class="feature-link">Start Collaborating →</a>
			</div>
		</div>
	</section>

	<section class="platform-access">
		<h2>How to Use MedNexus</h2>
		<div class="access-grid">
			<a href="/verification" class="access-card">
				<div class="card-icon">🏥</div>
				<h3>1. Get Institution Verified</h3>
				<p><strong>Who:</strong> Hospitals, clinics, research facilities, medical practices</p>
				<p>
					<strong>What:</strong> Verify your institution's medical license and credentials to access
					the platform
				</p>
				<p>
					<strong>Why:</strong> Ensures only legitimate medical institutions can share sensitive patient
					data
				</p>
			</a>
			<a href="/storage" class="access-card">
				<div class="card-icon">💾</div>
				<h3>2. Store Medical Data</h3>
				<p>
					<strong>What you can upload:</strong> Patient records, X-rays, MRIs, lab results, clinical
					notes, treatment plans
				</p>
				<p>
					<strong>Security:</strong> HIPAA-compliant encryption, blockchain storage, access controls
				</p>
				<p>
					<strong>Benefits:</strong> Secure backup, easy sharing with other verified institutions
				</p>
			</a>
			<a href="/collaboration" class="access-card">
				<div class="card-icon">🌐</div>
				<h3>3. Collaborate Globally</h3>
				<p>
					<strong>Use cases:</strong> Second opinions, research collaboration, specialist consultations
				</p>
				<p><strong>Network:</strong> Connect with verified doctors and institutions worldwide</p>
				<p><strong>Privacy:</strong> Patient consent-based sharing with audit trails</p>
			</a>
			<a href="/monitoring" class="access-card">
				<div class="card-icon">📊</div>
				<h3>4. Monitor System Health</h3>
				<p><strong>For:</strong> IT administrators and compliance officers</p>
				<p>
					<strong>Track:</strong> Data uploads, access logs, security events, system performance
				</p>
				<p><strong>Compliance:</strong> HIPAA audit trails and regulatory reporting</p>
			</a>
		</div>
	</section>

	<section class="wallet-section">
		<h2>Connect Your Wallet</h2>
		<p>Connect your wallet to access the platform</p>
		<WalletConnect />
	</section>
</main>

<style>
	/* Navigation */
	.main-nav {
		background: white;
		border-bottom: 1px solid #e5e7eb;
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.nav-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 4rem;
	}

	.nav-brand a {
		font-size: 1.5rem;
		font-weight: 700;
		color: #2563eb;
		text-decoration: none;
	}

	.nav-links {
		display: flex;
		gap: 2rem;
	}

	.nav-links a {
		color: #4b5563;
		text-decoration: none;
		font-weight: 500;
		transition: color 0.2s;
	}

	.nav-links a:hover {
		color: #2563eb;
	}

	.nav-wallet {
		display: flex;
		align-items: center;
	}

	/* Hero Section Buttons */
	.hero-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
		margin-top: 2rem;
	}

	.btn {
		padding: 0.75rem 2rem;
		border-radius: 0.5rem;
		text-decoration: none;
		font-weight: 600;
		transition: all 0.2s;
		display: inline-block;
	}

	.btn-primary {
		background: white;
		color: #2563eb;
	}

	.btn-primary:hover {
		background: #f8fafc;
		transform: translateY(-2px);
	}

	.btn-secondary {
		background: transparent;
		color: white;
		border: 2px solid white;
	}

	.btn-secondary:hover {
		background: white;
		color: #2563eb;
	}

	main {
		min-height: 100vh;
	}

	.hero {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		text-align: center;
		padding: 80px 20px;
	}

	.hero-content h1 {
		font-size: 3.5rem;
		font-weight: 700;
		margin-bottom: 20px;
		letter-spacing: -0.02em;
	}

	.tagline {
		font-size: 1.4rem;
		margin-bottom: 10px;
		font-weight: 300;
	}

	.subtitle {
		font-size: 1.1rem;
		opacity: 0.9;
		font-weight: 300;
	}

	.features {
		padding: 80px 20px;
		background: #f8f9fa;
		text-align: center;
	}

	.feature-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 40px;
		max-width: 1200px;
		margin: 0 auto;
	}

	.feature h3 {
		color: #2c3e50;
		font-size: 1.3rem;
		margin-bottom: 15px;
		font-weight: 600;
	}

	.feature p {
		color: #666;
		line-height: 1.6;
		font-size: 1rem;
		margin-bottom: 15px;
	}

	.feature-link {
		color: #2563eb;
		text-decoration: none;
		font-weight: 600;
		font-size: 0.9rem;
		transition: color 0.2s;
	}

	.feature-link:hover {
		color: #1d4ed8;
	}

	.platform-access {
		padding: 80px 20px;
		max-width: 1200px;
		margin: 0 auto;
		text-align: center;
	}

	.platform-access h2 {
		color: #2c3e50;
		font-size: 2.5rem;
		margin-bottom: 50px;
		font-weight: 600;
	}

	.access-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 30px;
	}

	.access-card {
		background: white;
		border: 1px solid #e9ecef;
		border-radius: 12px;
		padding: 30px;
		text-decoration: none;
		color: inherit;
		transition: all 0.3s ease;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
		text-align: left;
	}

	.access-card:hover {
		transform: translateY(-5px);
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
		border-color: #667eea;
	}

	.card-icon {
		font-size: 2.5rem;
		margin-bottom: 15px;
		display: block;
	}

	.access-card h3 {
		color: #2c3e50;
		font-size: 1.4rem;
		margin-bottom: 15px;
		font-weight: 600;
	}

	.access-card p {
		color: #666;
		line-height: 1.6;
		margin-bottom: 10px;
		font-size: 0.95rem;
	}

	.access-card p strong {
		color: #2c3e50;
		font-weight: 600;
	}

	.wallet-section {
		background: #f8f9fa;
		padding: 60px 20px;
		text-align: center;
	}

	.wallet-section h2 {
		color: #2c3e50;
		font-size: 2rem;
		margin-bottom: 15px;
		font-weight: 600;
	}

	.wallet-section p {
		color: #666;
		margin-bottom: 30px;
		font-size: 1.1rem;
	}

	@media (max-width: 768px) {
		.nav-links {
			display: none;
		}

		.nav-container {
			padding: 0 1rem;
		}

		.hero-content h1 {
			font-size: 2.5rem;
		}

		.tagline {
			font-size: 1.2rem;
		}

		.hero-actions {
			flex-direction: column;
			align-items: center;
		}

		.btn {
			width: 200px;
			text-align: center;
		}

		.features {
			padding: 50px 20px;
		}

		.platform-access {
			padding: 50px 20px;
		}

		.platform-access h2 {
			font-size: 2rem;
		}

		.access-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
