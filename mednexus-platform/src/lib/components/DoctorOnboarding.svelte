<script lang="ts">
	import { walletStore } from '$lib/wallet';
	import { doctorContext, needsOnboarding } from '$lib/stores/doctorStore';
	import type { VerifiedDoctor } from '$lib/services/medicalInstitutionService';

	interface DoctorOnboardingProps {
		showOnPages?: ('dashboard' | 'consultations' | 'documents')[];
		demoDoctor?: {
			walletAddress: string;
			name: string;
			medicalLicenseNumber: string;
			institution: string;
			medicalSpecialty: string;
		} | null;
	}

	let { showOnPages = ['dashboard', 'consultations'], demoDoctor = null }: DoctorOnboardingProps =
		$props();

	// Demo doctors data (can be imported from a shared location)
	const DEMO_DOCTORS = [
		{
			walletAddress: '0x99BD4BDD7A9c22E2a35F09A6Bd17f038D5E5eB87',
			name: 'Dr. Sarah Johnson',
			medicalLicenseNumber: 'CA-MD-789012',
			institution: 'Mercy General Hospital',
			medicalSpecialty: 'Interventional Cardiology'
		},
		{
			walletAddress: '0x59A0B39f49EBe851c97E654166A480E7d41122c6',
			name: 'Dr. Michael Chen',
			medicalLicenseNumber: 'UK-GMC-456789',
			institution: "St. Mary's Hospital London",
			medicalSpecialty: 'Emergency Medicine'
		},
		{
			walletAddress: '0x8D8f96F92de3CbBc9b3c1048bDf3ce08DF7B1a40',
			name: 'Dr. Emily Rodriguez',
			medicalLicenseNumber: 'ON-CPSO-123456',
			institution: 'Toronto General Hospital',
			medicalSpecialty: 'Cardiothoracic Surgery'
		}
	];

	let currentDemoDoctor = $derived(
		demoDoctor || DEMO_DOCTORS.find((d) => d.walletAddress === $walletStore.address)
	);
</script>

// Doctor Onboarding Notification Component // Use this to show onboarding guidance across different
pages

{#if $needsOnboarding}
	<div class="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
		<div class="flex items-start">
			<div class="flex-shrink-0">
				<svg class="h-8 w-8 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
					<path
						fill-rule="evenodd"
						d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
						clip-rule="evenodd"
					/>
				</svg>
			</div>
			<div class="ml-4 flex-1">
				{#if currentDemoDoctor}
					<h3 class="text-lg font-semibold text-amber-800 mb-2">
						Welcome {currentDemoDoctor.name}! 👨‍⚕️
					</h3>
					<div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
						<p class="text-sm text-blue-800">
							<strong>🎯 Demo Account Detected:</strong> We recognize you as
							<strong>{currentDemoDoctor.name}</strong>
							from <strong>{currentDemoDoctor.institution}</strong>
							({currentDemoDoctor.medicalSpecialty}).
						</p>
					</div>
					<p class="text-amber-700 mb-4">
						To access full platform features and interact with other demo doctors, complete the
						verification process with your demo credentials.
					</p>
				{:else}
					<h3 class="text-lg font-semibold text-amber-800 mb-2">
						Welcome! Complete Your Doctor Verification 👨‍⚕️
					</h3>
					<p class="text-amber-700 mb-4">
						To access platform features and have your professional name displayed, complete doctor
						verification and institutional registration.
					</p>
				{/if}

				<div class="space-y-3 mb-6">
					<div class="flex items-center text-sm text-amber-700">
						<span class="mr-3">1️⃣</span>
						<span
							><strong>Verify Medical License:</strong> Validate credentials with recognized medical
							authorities</span
						>
					</div>
					<div class="flex items-center text-sm text-amber-700">
						<span class="mr-3">2️⃣</span>
						<span
							><strong>Join Medical Institution:</strong> Register with your hospital or clinic</span
						>
					</div>
					<div class="flex items-center text-sm text-amber-700">
						<span class="mr-3">3️⃣</span>
						<span
							><strong>Access Platform Features:</strong> Upload documents, send consultations, collaborate
							globally</span
						>
					</div>
				</div>

				<div class="flex flex-col sm:flex-row gap-3">
					<a
						href="/verification"
						class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
					>
						<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						Start Verification Process
					</a>
					<a
						href="/register"
						class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
					>
						<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
							/>
						</svg>
						Join Institution
					</a>
				</div>

				{#if currentDemoDoctor}
					<div class="mt-4 text-xs text-amber-600">
						💡 <strong>Demo Tip:</strong> Use license number
						<code class="bg-amber-100 px-1 rounded">{currentDemoDoctor.medicalLicenseNumber}</code>
						and select
						<code class="bg-amber-100 px-1 rounded">{currentDemoDoctor.institution}</code> during verification.
					</div>
				{:else}
					<div class="mt-4 text-xs text-amber-600">
						💡 <strong>Note:</strong> Verification typically takes 5-10 minutes. You'll need your medical
						license number and institutional affiliation.
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
