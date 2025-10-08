<script lang="ts">
	import { onMount } from 'svelte';
	import { medicalTranslationService } from '$lib/services/medicalTranslationService';
	import type { SupportedLanguage } from '$lib/services/medicalTranslationService';

	interface Props {
		selectedLanguage?: string;
		compact?: boolean;
		showFullSupport?: boolean; // Only show languages with full medical support
		label?: string;
	}

	let {
		selectedLanguage = 'en',
		compact = false,
		showFullSupport = false,
		label = 'Language'
	}: Props = $props();

	let supportedLanguages = $state<SupportedLanguage[]>([]);
	let isOpen = $state(false);

	onMount(() => {
		supportedLanguages = medicalTranslationService.getSupportedLanguages();

		if (showFullSupport) {
			supportedLanguages = supportedLanguages.filter((lang) => lang.medicalSupport === 'full');
		}
	});

	function selectLanguage(languageCode: string) {
		selectedLanguage = languageCode;
		isOpen = false;
	}

	function getSelectedLanguage(): SupportedLanguage | undefined {
		return supportedLanguages.find((lang) => lang.code === selectedLanguage);
	}

	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		if (!event.target || !(event.target as Element).closest('.language-picker')) {
			isOpen = false;
		}
	}
</script>

<svelte:window on:click={handleClickOutside} />

<div class="language-picker" class:compact>
	{#if !compact}
		<label class="picker-label">{label}:</label>
	{/if}

	<div class="picker-container">
		<button
			class="selected-language"
			class:compact
			on:click|stopPropagation={() => (isOpen = !isOpen)}
			title="Select language for medical translation"
		>
			<span class="language-info">
				<span class="flag">{getSelectedLanguage()?.flag || '🌐'}</span>
				{#if !compact}
					<span class="name">{getSelectedLanguage()?.nativeName || 'Unknown'}</span>
				{/if}
				{#if getSelectedLanguage()?.medicalSupport !== 'full'}
					<span class="support-indicator" title="Limited medical terminology support">
						{getSelectedLanguage()?.medicalSupport}
					</span>
				{/if}
			</span>
			<span class="dropdown-arrow" class:open={isOpen}>▼</span>
		</button>

		{#if isOpen}
			<div class="language-dropdown" class:compact>
				<div class="dropdown-header">Select Medical Language</div>

				<div class="language-list">
					{#each supportedLanguages as language (language.code)}
						<button
							class="language-option"
							class:selected={selectedLanguage === language.code}
							on:click={() => selectLanguage(language.code)}
						>
							<span class="option-content">
								<span class="flag">{language.flag}</span>
								<div class="language-details">
									<span class="name">{language.nativeName}</span>
									<span class="english-name">({language.name})</span>
								</div>
								<div class="support-info">
									<span class="support-level" class:full={language.medicalSupport === 'full'}>
										{language.medicalSupport}
									</span>
									{#if language.medicalSupport === 'full'}
										<span class="checkmark">✓</span>
									{:else if language.medicalSupport === 'partial'}
										<span class="partial-mark">~</span>
									{:else}
										<span class="basic-mark">!</span>
									{/if}
								</div>
							</span>
						</button>
					{/each}
				</div>

				<div class="dropdown-footer">
					<div class="support-legend">
						<div class="legend-item">
							<span class="legend-icon full">✓</span>
							<span class="legend-text">Full medical terminology</span>
						</div>
						<div class="legend-item">
							<span class="legend-icon partial">~</span>
							<span class="legend-text">Partial support</span>
						</div>
						<div class="legend-item">
							<span class="legend-icon basic">!</span>
							<span class="legend-text">Basic translation only</span>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.language-picker {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
	}

	.language-picker.compact {
		gap: 0;
	}

	.picker-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
		white-space: nowrap;
	}

	.picker-container {
		position: relative;
	}

	.selected-language {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		background: white;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 0.875rem;
		min-width: 120px;
		justify-content: space-between;
	}

	.selected-language.compact {
		min-width: auto;
		padding: 0.375rem 0.5rem;
	}

	.selected-language:hover {
		border-color: #9ca3af;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.selected-language:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.language-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.flag {
		font-size: 1.125rem;
	}

	.name {
		font-weight: 500;
		color: #111827;
	}

	.support-indicator {
		font-size: 0.625rem;
		padding: 0.125rem 0.25rem;
		background: #fef3c7;
		color: #92400e;
		border-radius: 8px;
		text-transform: uppercase;
		font-weight: 500;
	}

	.dropdown-arrow {
		color: #6b7280;
		transition: transform 0.2s;
		font-size: 0.75rem;
	}

	.dropdown-arrow.open {
		transform: rotate(180deg);
	}

	.language-dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		z-index: 50;
		margin-top: 0.25rem;
		background: white;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.1),
			0 4px 6px -2px rgba(0, 0, 0, 0.05);
		max-height: 300px;
		overflow-y: auto;
		min-width: 280px;
	}

	.language-dropdown.compact {
		min-width: 240px;
	}

	.dropdown-header {
		padding: 0.75rem 1rem 0.5rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: #374151;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border-bottom: 1px solid #f3f4f6;
	}

	.language-list {
		padding: 0.25rem 0;
	}

	.language-option {
		display: block;
		width: 100%;
		padding: 0.5rem 1rem;
		border: none;
		background: none;
		cursor: pointer;
		text-align: left;
		transition: background-color 0.15s;
	}

	.language-option:hover {
		background: #f9fafb;
	}

	.language-option.selected {
		background: #eff6ff;
		color: #1d4ed8;
	}

	.option-content {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		justify-content: space-between;
	}

	.language-details {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
	}

	.language-details .name {
		font-weight: 500;
		color: #111827;
		font-size: 0.875rem;
	}

	.english-name {
		font-size: 0.75rem;
		color: #6b7280;
	}

	.support-info {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.support-level {
		font-size: 0.625rem;
		padding: 0.125rem 0.375rem;
		border-radius: 8px;
		text-transform: uppercase;
		font-weight: 500;
		background: #fee2e2;
		color: #991b1b;
	}

	.support-level.full {
		background: #dcfce7;
		color: #166534;
	}

	.checkmark,
	.partial-mark,
	.basic-mark {
		font-size: 0.75rem;
		font-weight: bold;
	}

	.checkmark {
		color: #16a34a;
	}

	.partial-mark {
		color: #ca8a04;
	}

	.basic-mark {
		color: #dc2626;
	}

	.dropdown-footer {
		padding: 0.75rem 1rem;
		border-top: 1px solid #f3f4f6;
		background: #f9fafb;
		border-bottom-left-radius: 8px;
		border-bottom-right-radius: 8px;
	}

	.support-legend {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.legend-icon {
		font-size: 0.75rem;
		font-weight: bold;
		width: 1rem;
		text-align: center;
	}

	.legend-icon.full {
		color: #16a34a;
	}

	.legend-icon.partial {
		color: #ca8a04;
	}

	.legend-icon.basic {
		color: #dc2626;
	}

	.legend-text {
		font-size: 0.75rem;
		color: #6b7280;
	}

	/* Scrollbar styling */
	.language-dropdown::-webkit-scrollbar {
		width: 6px;
	}

	.language-dropdown::-webkit-scrollbar-track {
		background: #f1f5f9;
	}

	.language-dropdown::-webkit-scrollbar-thumb {
		background: #cbd5e1;
		border-radius: 3px;
	}

	.language-dropdown::-webkit-scrollbar-thumb:hover {
		background: #94a3b8;
	}

	/* Mobile responsive */
	@media (max-width: 640px) {
		.language-dropdown {
			min-width: 100%;
			max-width: 100vw;
			left: 50%;
			transform: translateX(-50%);
		}

		.option-content {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
		}

		.support-legend {
			flex-direction: row;
			flex-wrap: wrap;
			gap: 0.5rem;
		}
	}
</style>
