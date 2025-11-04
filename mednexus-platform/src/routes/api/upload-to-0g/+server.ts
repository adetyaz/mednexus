import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Indexer, ZgFile } from '@0glabs/0g-ts-sdk';
import * as ethers from 'ethers';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { env } from '$env/dynamic/private';

const INDEXER_RPC = 'https://indexer-storage-turbo.0g.ai';
const EVM_RPC = 'https://evmrpc.0g.ai';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;

		if (!file) {
			return json({ error: 'No file provided' }, { status: 400 });
		}

		// Check if server wallet private key is configured
		if (!env.OG_STORAGE_PRIVATE_KEY) {
			return json({ 
				error: 'Server wallet not configured. Please add OG_STORAGE_PRIVATE_KEY to .env file.' 
			}, { status: 500 });
		}

		console.log(`📤 Uploading ${file.name} (${file.size} bytes) to 0G Storage...`);

		// Save file temporarily (required for ZgFile.fromFilePath)
		const tempPath = join(tmpdir(), `0g-upload-${Date.now()}-${file.name}`);
		const arrayBuffer = await file.arrayBuffer();
		const uint8Array = new Uint8Array(arrayBuffer);
		await writeFile(tempPath, uint8Array);

		try {
			// Initialize 0G Storage client with server wallet
			const provider = new ethers.JsonRpcProvider(EVM_RPC);
			const signer = new ethers.Wallet(env.OG_STORAGE_PRIVATE_KEY, provider) as any;
			const indexer = new Indexer(INDEXER_RPC);

			const walletAddress = await signer.getAddress();
			console.log(`💰 Server wallet: ${walletAddress}`);
			
			// Check wallet balance
			const balance = await provider.getBalance(walletAddress);
			console.log(`💵 Balance: ${ethers.formatEther(balance)} 0G`);

			if (balance === 0n) {
				throw new Error(
					`Server wallet ${walletAddress} has no 0G tokens. Please fund it at https://faucet.0g.ai/`
				);
			}

			// Create ZgFile from temp file
			console.log('� Creating ZgFile...');
			const zgFile = await ZgFile.fromFilePath(tempPath);
			
			console.log('🌳 Generating merkle tree...');
			const [tree, treeErr] = await zgFile.merkleTree();

			if (treeErr) {
				await zgFile.close();
				throw new Error(`Merkle tree error: ${treeErr.message}`);
			}

			const rootHash = tree?.rootHash() || '';
			console.log(`� Merkle root: ${rootHash}`);
			console.log(`🔐 Submitting transaction to 0G Storage network...`);

			// Upload file to 0G Storage (server wallet pays the fees)
			const [result, uploadErr] = await indexer.upload(zgFile, EVM_RPC, signer);

			if (uploadErr) {
				await zgFile.close();
				throw new Error(`Upload error: ${uploadErr.message}`);
			}

			await zgFile.close();

			const txHash = result?.txHash || '';
			console.log(`✅ Upload successful!`);
			console.log(`🔗 Transaction hash: ${txHash}`);

			return json({
				storageHash: rootHash,
				merkleRoot: rootHash,
				transactionHash: txHash,
				message: 'File uploaded successfully to 0G Storage'
			});

		} finally {
			// Clean up temp file
			try {
				await unlink(tempPath);
			} catch (e) {
				console.error('Failed to delete temp file:', e);
			}
		}

	} catch (error) {
		console.error('❌ 0G Storage upload failed:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Unknown error occurred' },
			{ status: 500 }
		);
	}
};
