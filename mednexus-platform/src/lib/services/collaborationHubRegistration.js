import { ethers } from 'ethers';
import { walletStore, walletManager } from '$lib/wallet';
import MedicalCollaborationHubABI from '$lib/ABIs/MedicalCollaborationHub.json';

const COLLABORATION_HUB_ADDRESS = '0xe3259D46d5A4F900B5f9D1289CBf9791D9cc8b59';

class CollaborationHubRegistration {
    constructor() {
        this.contract = null;
    }

    async initialize() {
        const signer = await walletManager.getSigner();
        if (!signer) throw new Error('Wallet not connected');
        
        this.contract = new ethers.Contract(
            COLLABORATION_HUB_ADDRESS,
            MedicalCollaborationHubABI,
            signer
        );
    }

    // Step 1: Commit registration
    async commitInstitutionRegistration(name, country, specialties, nonce) {
        await this.initialize();
        const signer = await this.contract.runner;
        const address = await signer.getAddress();
        
        // Create commit hash: keccak256(name, country, nonce, address)
        const commitHash = ethers.keccak256(
            ethers.solidityPacked(
                ["string", "string", "uint256", "address"],
                [name, country, nonce, address]
            )
        );
        
        console.log('Committing registration with hash:', commitHash);
        const tx = await this.contract.commitRegistration(commitHash);
        await tx.wait();
        
        return {
            success: true,
            txHash: tx.hash,
            commitHash,
            message: 'Commit successful! Wait 1 hour before revealing.'
        };
    }

    // Step 2: Reveal registration (after 1 hour)
    async revealInstitutionRegistration(name, country, specialties, nonce) {
        await this.initialize();
        
        console.log('Revealing registration...');
        const tx = await this.contract.registerInstitution(
            name,
            country,
            specialties,
            nonce,
            { value: ethers.parseEther('0.002') } // INSTITUTION_STAKE
        );
        
        await tx.wait();
        
        return {
            success: true,
            txHash: tx.hash,
            message: 'Institution registered on MedicalCollaborationHub!'
        };
    }

    // Helper: Check if commit exists and time remaining
    async checkCommitStatus() {
        await this.initialize();
        const signer = await this.contract.runner;
        const address = await signer.getAddress();
        
        // These would be contract view functions if they existed
        // For now, just return guidance
        return {
            hasCommit: false,
            timeRemaining: 0,
            canReveal: false
        };
    }
}

export const collaborationHubRegistration = new CollaborationHubRegistration();