<script>
	import WalletConnect from '$lib/components/WalletConnect.svelte';
</script>

<main>
	<header class="hero">
		<div class="hero-content">
			<h1>MedNexus</h1>
			<p class="tagline">Medical Data Platform</p>
			<p class="subtitle">Secure, verified, compliant</p>
			<div class="hero-actions">
				<a href="/verification" class="btn btn-primary">Get Started</a>
				<a href="/storage" class="btn btn-secondary">Upload Files</a>
			</div>
		</div>
	</header>

	<section class="features">
		<div class="feature-grid">
			<div class="feature">
				<h3>Upload</h3>
				<p>Upload medical files securely</p>
				<a href="/storage" class="feature-link">Go to Upload →</a>
			</div>
			<div class="feature">
				<h3>Verification</h3>
				<p>Verify medical credentials</p>
				<a href="/verification" class="feature-link">Get Verified →</a>
			</div>
			<div class="feature">
				<h3>Monitoring</h3>
				<p>Check system status</p>
				<a href="/monitoring" class="feature-link">View Status →</a>
			</div>
		</div>
	</section>
</main>

<style>
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

	@media (max-width: 768px) {
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
	}
</style>
