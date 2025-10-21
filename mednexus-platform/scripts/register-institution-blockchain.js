// Script to register your institution on the blockchain
// Run this before trying to register doctors

import { MedicalInstitutionService } from '../src/lib/services/medicalInstitutionService.js';
import { walletManager } from '../src/lib/wallet.js';

async function registerInstitutionOnBlockchain() {
    try {
        // Connect wallet first
        console.log('🔗 Connecting wallet...');
        // You'll need to connect your wallet in the UI first
        
        const institutionService = new MedicalInstitutionService();
        
        // Your institution data (adjust as needed)
        const institutionData = {
            name: 'Your Hospital Name',
            address: 'Your Hospital Address',
            licenseNumber: 'YOUR-LICENSE-NUMBER',
            adminWallet: 'YOUR_WALLET_ADDRESS', // The wallet address that should own this institution
            contactInfo: {
                email: 'admin@yourhospital.com',
                phone: '+1-555-123-4567'
            },
            departments: [
                'Emergency Medicine',
                'Cardiology',
                'Internal Medicine'
            ],
            verificationDocuments: [] // Add IPFS hashes if you have verification docs
        };
        
        console.log('🏥 Registering institution on blockchain...');
        const result = await institutionService.registerInstitution(institutionData);
        
        console.log('✅ Institution registered successfully!');
        console.log('Transaction Hash:', result.transactionHash);
        console.log('Institution ID:', result.institutionId);
        
        // Now you need to update your database to mark the institution as blockchain_registered
        console.log('\n📝 Next steps:');
        console.log('1. Update your database institution record:');
        console.log(`   SET blockchain_registered = true, transaction_hash = '${result.transactionHash}'`);
        console.log('2. Now you can register doctors for this institution');
        
    } catch (error) {
        console.error('❌ Institution registration failed:', error.message);
        
        if (error.message.includes('execution reverted')) {
            console.log('\n💡 Possible reasons:');
            console.log('- Institution already registered with this wallet');
            console.log('- Invalid license number format');
            console.log('- Insufficient gas or network issues');
        }
    }
}

// Run the registration
registerInstitutionOnBlockchain();