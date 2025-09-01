/**
 * Wallet Configuration and Reactive Stores
 */

import { writable } from 'svelte/store';
import { walletManager } from '../wallet';

// Reactive stores
export const walletConnected = writable(false);
export const userAddress = writable('');
export const isOwner = writable(false);
export const networkCorrect = writable(false);
export const isConnecting = writable(false);

// Wallet functions
export async function connectWallet() {
	isConnecting.set(true);
	try {
		const connected = await walletManager.connect();
		if (connected) {
			walletConnected.set(true);
			const address = await walletManager.getAddress();
			userAddress.set(address || '');

			// Check network
			const balance = await walletManager.getBalance();
			networkCorrect.set(!!balance);
		}
		return connected;
	} catch (error) {
		console.error('Wallet connection failed:', error);
		return false;
	} finally {
		isConnecting.set(false);
	}
}

export async function disconnectWallet() {
	walletManager.disconnect();
	walletConnected.set(false);
	userAddress.set('');
	isOwner.set(false);
	networkCorrect.set(false);
}

export async function switchToZeroGChain() {
	try {
		await walletManager.switchNetwork();
		networkCorrect.set(true);
	} catch (error) {
		console.error('Network switch failed:', error);
		networkCorrect.set(false);
	}
}

export async function getBalance() {
	try {
		return await walletManager.getBalance();
	} catch (error) {
		console.error('Failed to get balance:', error);
		return '0';
	}
}

export async function initializeWallet() {
	try {
		return await walletManager.connect();
	} catch (error) {
		console.error('Failed to initialize wallet:', error);
		throw error;
	}
}

export function getWalletManager() {
	return walletManager;
}

export default {
	walletConnected,
	userAddress,
	isOwner,
	networkCorrect,
	isConnecting,
	connectWallet,
	disconnectWallet,
	switchToZeroGChain,
	getBalance,
	initializeWallet,
	getWalletManager
};
