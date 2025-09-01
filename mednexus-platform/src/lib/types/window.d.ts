// Global type declarations for browser extensions
declare global {
	interface Window {
		ethereum?: {
			request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
			selectedAddress: string | null;
			chainId: string;
			isMetaMask?: boolean;
		};
	}
}

export {};
