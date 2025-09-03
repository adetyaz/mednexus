# MedNexus Platform

A decentralized medical intelligence platform built on 0G Network for secure medical data storage and credential verification.

## Getting Started

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

## Features

### ✅ Working Features

1. **File Upload to 0G Storage**
   - Upload medical files securely to 0G Network
   - Real blockchain integration (not mocked)
   - File encryption and storage verification

2. **Medical Credential Verification**
   - Verify medical licenses and credentials
   - Multiple global medical authorities supported
   - Blockchain-based verification system

3. **Wallet Integration**
   - Connect with Web3 wallets via Reown AppKit
   - Real wallet connectivity for blockchain interactions

## Testing the Platform

### 1. Upload Files
- Navigate to **Upload Files** page
- Connect your wallet first
- Select any file and upload
- File will be stored on 0G Network with encryption

### 2. Verify Medical Credentials

Use these sample credentials to test verification:

#### US Doctor
- **Credential ID:** `MD-123456-US`
- **License Holder Name:** `Dr. Sarah Johnson`
- **Issuing Authority:** `Federation of State Medical Boards (United States)`
- **Institution:** `Johns Hopkins Hospital`

#### UK Physician
- **Credential ID:** `GMC-987654`
- **License Holder Name:** `Dr. James Mitchell`
- **Issuing Authority:** `General Medical Council (United Kingdom)`
- **Institution:** `Royal London Hospital`

#### Canadian Doctor
- **Credential ID:** `CPSO-456789`
- **License Holder Name:** `Dr. Emily Chen`
- **Issuing Authority:** `College of Physicians and Surgeons of Ontario (Canada)`
- **Institution:** `Toronto General Hospital`

**How to Test:**
1. Go to **Verify Credentials** page
2. Fill in any sample credential above
3. Connect your wallet
4. Click "Verify Credentials"
5. System will process and show verification result

## Technical Details

- **Framework:** SvelteKit 5
- **Blockchain:** 0G Network (Chain ID: 16601)
- **Storage:** 0G Storage Network
- **Wallet:** Reown AppKit integration
- **Environment:** Uses proper SvelteKit environment variables

## Environment Variables

Create a `.env` file with:
```bash
PUBLIC_REOWN_PROJECT_ID=your_reown_project_id
PUBLIC_OG_RPC_URL=https://evmrpc-testnet.0g.ai
PUBLIC_OG_CHAIN_ID=16601
PUBLIC_OG_STORAGE_INDEXER=https://indexer-storage-testnet.0g.ai
PUBLIC_OG_STORAGE_RPC=https://rpc-storage-testnet.0g.ai
```

## Contract Addresses (0G Testnet)

- **Medical Verification:** `0x2b83DDc5D0dd317D2A1e4adA44819b26CA54A652`
- **Collaboration Hub:** `0xdcEcd3Cf494069f9FB5614e05Efa4Fa45C4f949c`
- **Medical Intelligence INFT:** `0xe3259D46d5A4F900B5f9D1289CBf9791D9cc8b59`
