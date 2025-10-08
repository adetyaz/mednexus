<!--
	Medical Translation UI Component
	Wave 2: Multi-language medical terminology processing
	Real-time translation display for cross-border medical collaboration
-->

<script lang="ts">
	import { onMount } from 'svelte';
	import { medicalTranslationService } from '$lib/services/medicalTranslationService';
	import type {
		SupportedLanguage,
		MedicalTranslation
	} from '$lib/services/medicalTranslationService';

	interface Props {
		originalText?: string;
		sourceLanguage?: string;
		targetLanguage?: string;
		medicalContext?:
			| 'diagnosis'
			| 'symptoms'
			| 'treatment'
			| 'medication'
			| 'procedure'
			| 'general';
		urgency?: 'routine' | 'urgent' | 'emergency';
		caseId?: string | undefined;
		showLanguageSelector?: boolean;
		showConfidence?: boolean;
		autoTranslate?: boolean;
	}

	let {
		originalText = '',
		sourceLanguage = 'en',
		targetLanguage = 'es',
		medicalContext = 'general',
		urgency = 'routine',
		caseId = undefined,
		showLanguageSelector = true,
		showConfidence = true,
		autoTranslate = false
	}: Props = $props();

	let supportedLanguages = $state<SupportedLanguage[]>([]);
	let translation = $state<MedicalTranslation | null>(null);
	let isTranslating = $state(false);
	let translationError = $state('');

	onMount(async () => {
		supportedLanguages = medicalTranslationService.getSupportedLanguages();

		if (autoTranslate && originalText) {
			await translateText();
		}
	});

	async function translateText() {
		if (!originalText.trim()) return;

		isTranslating = true;
		translationError = '';

		try {
			translation = await medicalTranslationService.translateMedicalText({
				text: originalText,
				sourceLanguage,
				targetLanguage,
				medicalContext,
				urgency,
				caseId
			});
		} catch (error: any) {
			translationError = error.message || 'Translation failed';
			console.error('Translation error:', error);
		} finally {
			isTranslating = false;
		}
	}

	function getLanguageFlag(languageCode: string): string {
		const language = supportedLanguages.find((lang) => lang.code === languageCode);
		return language?.flag || '🌐';
	}

	function getLanguageName(languageCode: string): string {
		const language = supportedLanguages.find((lang) => lang.code === languageCode);
		return language?.nativeName || languageCode;
	}

	function getConfidenceClass(confidence: number): string {
		if (confidence >= 95) return 'confidence-excellent';
		if (confidence >= 85) return 'confidence-good';
		if (confidence >= 70) return 'confidence-fair';
		return 'confidence-poor';
	}

	function getMedicalTermsDisplay(translation: MedicalTranslation): string {
		const terms = translation.medicalTerms.filter((term) => term.icd10Code || term.snomedCode);
		return terms.length > 0 ? `${terms.length} medical terms identified` : '';
	}

	// Reactive effects
	$effect(() => {
		if (originalText && autoTranslate && sourceLanguage !== targetLanguage) {
			translateText();
		}
	});
</script>

<div class="medical-translation-component">
	{#if showLanguageSelector}
		<div class="language-selector">
			<div class="language-input">
				<label for="source-language">From:</label>
				<select
					id="source-language"
					bind:value={sourceLanguage}
					onchange={() => autoTranslate && translateText()}
				>
					{#each supportedLanguages as lang (lang.code)}
						<option value={lang.code}>
							{lang.flag}
							{lang.nativeName}
							{#if lang.medicalSupport !== 'full'}
								({lang.medicalSupport})
							{/if}
						</option>
					{/each}
				</select>
			</div>

			<div class="translation-arrow">
				<button
					class="swap-languages"
					onclick={() => {
						const temp = sourceLanguage;
						sourceLanguage = targetLanguage;
						targetLanguage = temp;
						if (autoTranslate) translateText();
					}}
					title="Swap languages"
				>
					↔️
				</button>
			</div>

			<div class="language-input">
				<label for="target-language">To:</label>
				<select
					id="target-language"
					bind:value={targetLanguage}
					onchange={() => autoTranslate && translateText()}
				>
					{#each supportedLanguages as lang (lang.code)}
						<option value={lang.code}>
							{lang.flag}
							{lang.nativeName}
							{#if lang.medicalSupport !== 'full'}
								({lang.medicalSupport})
							{/if}
						</option>
					{/each}
				</select>
			</div>
		</div>
	{/if}

	<div class="translation-content">
		<div class="original-text">
			<div class="text-header">
				<span class="language-indicator">
					{getLanguageFlag(sourceLanguage)}
					{getLanguageName(sourceLanguage)}
				</span>
				<span class="context-indicator">
					Context: {medicalContext}
					{#if urgency !== 'routine'}
						<span class="urgency-indicator urgency-{urgency}">{urgency}</span>
					{/if}
				</span>
			</div>
			<div class="text-content original">
				{originalText}
			</div>
		</div>

		{#if sourceLanguage !== targetLanguage}
			<div class="translation-controls">
				{#if !autoTranslate}
					<button
						class="translate-button"
						onclick={translateText}
						disabled={isTranslating || !originalText.trim()}
					>
						{#if isTranslating}
							<span class="spinner"></span>
							Translating via 0G Compute...
						{:else}
							🌐 Translate to {getLanguageName(targetLanguage)}
						{/if}
					</button>
				{/if}
			</div>

			{#if translation}
				<div class="translated-text">
					<div class="text-header">
						<span class="language-indicator">
							{getLanguageFlag(targetLanguage)}
							{getLanguageName(targetLanguage)}
						</span>
						{#if showConfidence}
							<span class="confidence-indicator {getConfidenceClass(translation.confidence)}">
								{translation.confidence}% confidence
							</span>
						{/if}
					</div>
					<div class="text-content translated">
						{translation.translatedText}
					</div>

					{#if translation.medicalTerms.length > 0}
						<div class="medical-terms">
							<div class="terms-header">
								<span class="terms-count">
									{getMedicalTermsDisplay(translation)}
								</span>
								{#if translation.reviewStatus === 'pending'}
									<span class="review-status pending"> ⚠️ Pending medical review </span>
								{:else if translation.reviewStatus === 'verified'}
									<span class="review-status verified"> ✅ Medically verified </span>
								{/if}
							</div>

							<details class="terms-details">
								<summary>View Medical Terms</summary>
								<div class="terms-list">
									{#each translation.medicalTerms as term}
										<div class="medical-term">
											<div class="term-pair">
												<span class="original-term">{term.original}</span>
												<span class="arrow">→</span>
												<span class="translated-term">{term.translated}</span>
											</div>
											<div class="term-info">
												{#if term.icd10Code}
													<span class="code icd10">ICD-10: {term.icd10Code}</span>
												{/if}
												{#if term.snomedCode}
													<span class="code snomed">SNOMED: {term.snomedCode}</span>
												{/if}
												<span class="confidence">{term.confidence}%</span>
											</div>
										</div>
									{/each}
								</div>
							</details>
						</div>
					{/if}
				</div>
			{/if}

			{#if translationError}
				<div class="translation-error">
					<span class="error-icon">❌</span>
					<span class="error-message">{translationError}</span>
					<button class="retry-button" onclick={translateText}> 🔄 Retry </button>
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	.medical-translation-component {
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		padding: 1rem;
		margin: 1rem 0;
		background: white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.language-selector {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
		padding: 0.5rem;
		background: #f8f9fa;
		border-radius: 6px;
	}

	.language-input {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
	}

	.language-input label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #666;
	}

	.language-input select {
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 0.875rem;
		background: white;
	}

	.translation-arrow {
		display: flex;
		align-items: center;
		margin-top: 1.25rem;
	}

	.swap-languages {
		background: #007bff;
		color: white;
		border: none;
		border-radius: 50%;
		width: 2rem;
		height: 2rem;
		cursor: pointer;
		font-size: 0.875rem;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color 0.2s;
	}

	.swap-languages:hover {
		background: #0056b3;
	}

	.translation-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.text-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
		padding: 0.25rem 0;
		border-bottom: 1px solid #eee;
	}

	.language-indicator {
		font-weight: 500;
		color: #007bff;
	}

	.context-indicator {
		font-size: 0.75rem;
		color: #666;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.urgency-indicator {
		padding: 0.125rem 0.375rem;
		border-radius: 10px;
		font-size: 0.65rem;
		font-weight: 500;
		text-transform: uppercase;
	}

	.urgency-urgent {
		background: #fff3cd;
		color: #856404;
		border: 1px solid #ffeaa7;
	}

	.urgency-emergency {
		background: #f8d7da;
		color: #721c24;
		border: 1px solid #f5c6cb;
	}

	.text-content {
		padding: 0.75rem;
		border-radius: 4px;
		line-height: 1.5;
		font-size: 0.95rem;
	}

	.text-content.original {
		background: #f8f9fa;
		border-left: 4px solid #007bff;
	}

	.text-content.translated {
		background: #e8f5e8;
		border-left: 4px solid #28a745;
	}

	.translation-controls {
		display: flex;
		justify-content: center;
		margin: 0.5rem 0;
	}

	.translate-button {
		background: #007bff;
		color: white;
		border: none;
		padding: 0.625rem 1.25rem;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.875rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition: all 0.2s;
	}

	.translate-button:hover:not(:disabled) {
		background: #0056b3;
		transform: translateY(-1px);
	}

	.translate-button:disabled {
		background: #6c757d;
		cursor: not-allowed;
	}

	.spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid transparent;
		border-top: 2px solid currentColor;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.confidence-indicator {
		font-size: 0.75rem;
		padding: 0.125rem 0.375rem;
		border-radius: 10px;
		font-weight: 500;
	}

	.confidence-excellent {
		background: #d4edda;
		color: #155724;
		border: 1px solid #c3e6cb;
	}

	.confidence-good {
		background: #d1ecf1;
		color: #0c5460;
		border: 1px solid #bee5eb;
	}

	.confidence-fair {
		background: #fff3cd;
		color: #856404;
		border: 1px solid #ffeaa7;
	}

	.confidence-poor {
		background: #f8d7da;
		color: #721c24;
		border: 1px solid #f5c6cb;
	}

	.medical-terms {
		margin-top: 1rem;
		padding: 0.75rem;
		background: #f8f9fa;
		border-radius: 6px;
		border: 1px solid #e9ecef;
	}

	.terms-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.terms-count {
		font-size: 0.875rem;
		color: #666;
		font-weight: 500;
	}

	.review-status {
		font-size: 0.75rem;
		padding: 0.125rem 0.375rem;
		border-radius: 10px;
		font-weight: 500;
	}

	.review-status.pending {
		background: #fff3cd;
		color: #856404;
	}

	.review-status.verified {
		background: #d4edda;
		color: #155724;
	}

	.terms-details {
		font-size: 0.875rem;
	}

	.terms-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.medical-term {
		padding: 0.5rem;
		background: white;
		border-radius: 4px;
		border: 1px solid #e9ecef;
	}

	.term-pair {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
	}

	.original-term {
		font-weight: 500;
		color: #007bff;
	}

	.arrow {
		color: #666;
	}

	.translated-term {
		font-weight: 500;
		color: #28a745;
	}

	.term-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.75rem;
		color: #666;
	}

	.code {
		padding: 0.125rem 0.25rem;
		border-radius: 3px;
		font-family: monospace;
	}

	.code.icd10 {
		background: #e3f2fd;
		color: #1565c0;
	}

	.code.snomed {
		background: #f3e5f5;
		color: #7b1fa2;
	}

	.translation-error {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		background: #f8d7da;
		color: #721c24;
		border: 1px solid #f5c6cb;
		border-radius: 6px;
		margin-top: 1rem;
	}

	.retry-button {
		background: #dc3545;
		color: white;
		border: none;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.75rem;
		margin-left: auto;
	}

	.retry-button:hover {
		background: #c82333;
	}

	@media (max-width: 768px) {
		.language-selector {
			flex-direction: column;
			gap: 0.5rem;
		}

		.translation-arrow {
			margin: 0;
		}

		.swap-languages {
			transform: rotate(90deg);
		}

		.text-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
		}
	}
</style>
