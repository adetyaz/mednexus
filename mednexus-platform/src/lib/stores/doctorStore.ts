import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { walletStore } from '$lib/wallet';
import { medicalDocumentManager } from '$lib/services/medicalDocumentManagementService';
import type { VerifiedDoctor } from '$lib/services/medicalInstitutionService';

interface DoctorContext {
	success: boolean;
	doctor?: VerifiedDoctor;
	institution?: any;
	message?: string;
}

interface DoctorStoreState {
	context: DoctorContext | null;
	isLoading: boolean;
	lastCheckedAddress: string | null;
}

// Create the store
const createDoctorStore = () => {
	const { subscribe, set, update } = writable<DoctorStoreState>({
		context: null,
		isLoading: false,
		lastCheckedAddress: null
	});

	return {
		subscribe,
		
		// Load doctor context for a given address
		async loadContext(address: string): Promise<void> {
			if (!address || !browser) return;
			
			update(state => ({ ...state, isLoading: true }));
			
			try {
				const context = await medicalDocumentManager.getDoctorContext(address);
				update(state => ({
					...state,
					context,
					isLoading: false,
					lastCheckedAddress: address
				}));
			} catch (error) {
				console.error('Failed to load doctor context:', error);
				update(state => ({
					...state,
					context: { success: false, message: 'Failed to load doctor information' },
					isLoading: false,
					lastCheckedAddress: address
				}));
			}
		},

		// Clear context (e.g., when wallet disconnects)
		clear(): void {
			set({
				context: null,
				isLoading: false,
				lastCheckedAddress: null
			});
		},

		// Force refresh context
		async refresh(): Promise<void> {
			update(state => ({ ...state, lastCheckedAddress: null }));
			// This will trigger a reload in the derived store below
		}
	};
};

export const doctorStore = createDoctorStore();

// Derived store that automatically loads context when wallet changes
export const doctorContext = derived(
	[doctorStore, walletStore],
	([$doctorStore, $walletStore]) => {
		// If wallet is connected and we haven't checked this address yet, load context
		if (
			$walletStore.isConnected && 
			$walletStore.address && 
			$walletStore.address !== $doctorStore.lastCheckedAddress
		) {
			doctorStore.loadContext($walletStore.address);
		}
		
		// If wallet disconnected, clear context
		if (!$walletStore.isConnected && $doctorStore.context) {
			doctorStore.clear();
		}

		// Return current context
		return $doctorStore.context;
	}
);

// Derived store for checking if onboarding is needed
export const needsOnboarding = derived(
	[doctorContext, walletStore],
	([$doctorContext, $walletStore]) => {
		return $walletStore.isConnected && (!$doctorContext || !$doctorContext.success);
	}
);

// Derived store for loading state
export const doctorLoading = derived(
	doctorStore,
	$doctorStore => $doctorStore.isLoading
);