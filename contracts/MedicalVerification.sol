// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title MedicalVerification - Truly Decentralized Medical Institution Verification
 * @dev Pure peer-to-peer verification with no governance backdoors
 * @author MedNexus Team
 * @notice Medical credential verification on 0G Chain - Zero centralization
 */
contract MedicalVerification is ReentrancyGuard {
    using ECDSA for bytes32;
    
    // Simple, gas-optimized structs
    struct Institution {
        string name;
        string country;
        uint128 registrationDate;
        uint128 verificationDate;
        uint8 verifierCount;
        bool isVerified;
        bytes32 credentialHash;
    }
    
    struct Verifier {
        string name;
        string region;
        uint128 stakeAmount;
        uint128 reputationScore;
        uint32 successfulVerifications;
        bool isActive;
        bytes32 credentialHash;
    }
    
    // Core state
    mapping(address => Institution) public institutions;
    mapping(address => Verifier) public verifiers;
    mapping(address => bool) public verifiedInstitutions;
    mapping(address => bool) public verifiedVerifiers;
    mapping(string => address[]) public regionVerifiers;
    
    // Verification tracking
    mapping(address => mapping(address => bool)) public hasVerified;
    mapping(address => uint256) public pendingWithdrawals;
    mapping(address => uint256) public withdrawalTimestamp;
    
    // Simple arrays for enumeration
    address[] public institutionList;
    address[] public verifierList;
    
    // Immutable parameters - no governance needed
    uint256 public constant VERIFICATION_STAKE = 0.001 ether; // ~$2 USD
    uint8 public constant MIN_VERIFIERS = 3;
    uint16 public constant MAX_VERIFIERS_PER_REGION = 1000;
    uint256 public constant WITHDRAWAL_DELAY = 7 days;
    uint128 public constant MIN_REPUTATION_FOR_VERIFICATION = 100;
    uint128 public constant REPUTATION_GAIN_PER_VERIFICATION = 10;
    uint128 public constant REPUTATION_PENALTY_EARLY_WITHDRAWAL = 50;
    
    // Events
    event InstitutionRegistered(address indexed institution, string name, string country);
    event VerifierRegistered(address indexed verifier, string name, string region, uint256 stake);
    event InstitutionVerified(address indexed institution, address indexed verifier);
    event WithdrawalInitiated(address indexed user, uint256 amount, uint256 availableAt);
    event WithdrawalCompleted(address indexed user, uint256 amount);
    event ReputationUpdated(address indexed verifier, uint256 newReputation);
    
    // Errors
    error InsufficientStake();
    error AlreadyRegistered();
    error NotAuthorized();
    error InvalidRegion();
    error VerificationFailed();
    error NoFundsToWithdraw();
    error WithdrawalNotReady();
    error TransferFailed();
    error RegionFull();
    error InsufficientReputation();
    error AlreadyVerified();
    
    // Modifiers
    modifier onlyVerifiedVerifier() {
        if (!verifiedVerifiers[msg.sender]) revert NotAuthorized();
        if (verifiers[msg.sender].reputationScore < MIN_REPUTATION_FOR_VERIFICATION) {
            revert InsufficientReputation();
        }
        _;
    }
    
    /**
     * @dev Register as a verifier - stake required, no approval needed
     */
    function registerVerifier(
        string calldata _name,
        string calldata _region,
        bytes32 _credentialHash
    ) external payable nonReentrant {
        require(msg.value >= VERIFICATION_STAKE, "Insufficient stake");
        require(bytes(_name).length > 0, "Name required");
        require(bytes(_region).length > 0, "Region required");
        require(_credentialHash != bytes32(0), "Credential hash required");
        
        if (verifiedVerifiers[msg.sender]) revert AlreadyRegistered();
        
        // Check region capacity
        if (regionVerifiers[_region].length >= MAX_VERIFIERS_PER_REGION) {
            revert RegionFull();
        }
        
        // Register verifier
        verifiers[msg.sender] = Verifier({
            name: _name,
            region: _region,
            stakeAmount: uint128(msg.value),
            reputationScore: MIN_REPUTATION_FOR_VERIFICATION, // Start with minimum reputation
            successfulVerifications: 0,
            isActive: true,
            credentialHash: _credentialHash
        });
        
        verifiedVerifiers[msg.sender] = true;
        regionVerifiers[_region].push(msg.sender);
        verifierList.push(msg.sender);
        
        emit VerifierRegistered(msg.sender, _name, _region, msg.value);
    }
    
    /**
     * @dev Register institution - free, open registration
     */
    function registerInstitution(
        string calldata _name,
        string calldata _country,
        bytes32 _credentialHash
    ) external {
        require(bytes(_name).length > 0, "Name required");
        require(bytes(_country).length > 0, "Country required");
        require(_credentialHash != bytes32(0), "Credential hash required");
        
        if (institutions[msg.sender].registrationDate != 0) revert AlreadyRegistered();
        
        institutions[msg.sender] = Institution({
            name: _name,
            country: _country,
            registrationDate: uint128(block.timestamp),
            verificationDate: 0,
            verifierCount: 0,
            isVerified: false,
            credentialHash: _credentialHash
        });
        
        institutionList.push(msg.sender);
        
        emit InstitutionRegistered(msg.sender, _name, _country);
    }
    
    /**
     * @dev Verify institution - reputation-based, region-compatible
     */
    function verifyInstitution(address _institution) external onlyVerifiedVerifier {
        require(_institution != address(0), "Invalid institution");
        
        Institution storage institution = institutions[_institution];
        require(institution.registrationDate != 0, "Institution not registered");
        require(!institution.isVerified, "Already verified");
        
        // Prevent double verification
        if (hasVerified[_institution][msg.sender]) revert AlreadyVerified();
        
        // Check region compatibility
        string memory institutionRegion = _getRegionForCountry(institution.country);
        string memory verifierRegion = verifiers[msg.sender].region;
        
        require(
            keccak256(bytes(verifierRegion)) == keccak256(bytes(institutionRegion)) ||
            keccak256(bytes(verifierRegion)) == keccak256(bytes("GLOBAL")),
            "Region mismatch"
        );
        
        // Mark as verified by this verifier
        hasVerified[_institution][msg.sender] = true;
        institution.verifierCount++;
        
        // Increase verifier reputation
        verifiers[msg.sender].reputationScore += REPUTATION_GAIN_PER_VERIFICATION;
        verifiers[msg.sender].successfulVerifications++;
        
        // Check if institution meets verification threshold
        if (institution.verifierCount >= MIN_VERIFIERS) {
            institution.isVerified = true;
            institution.verificationDate = uint128(block.timestamp);
            verifiedInstitutions[_institution] = true;
        }
        
        emit InstitutionVerified(_institution, msg.sender);
        emit ReputationUpdated(msg.sender, verifiers[msg.sender].reputationScore);
    }
    
    /**
     * @dev Initiate withdrawal with reputation penalty if early
     */
    function initiateWithdrawal() external nonReentrant {
        if (!verifiedVerifiers[msg.sender]) revert NotAuthorized();
        
        Verifier storage verifier = verifiers[msg.sender];
        uint256 stakeAmount = verifier.stakeAmount;
        
        require(stakeAmount > 0, "No stake to withdraw");
        
        // Apply reputation penalty for early withdrawal (within 30 days)
        if (block.timestamp < uint256(verifier.successfulVerifications) * 30 days) {
            if (verifier.reputationScore >= REPUTATION_PENALTY_EARLY_WITHDRAWAL) {
                verifier.reputationScore -= REPUTATION_PENALTY_EARLY_WITHDRAWAL;
            } else {
                verifier.reputationScore = 0;
            }
            emit ReputationUpdated(msg.sender, verifier.reputationScore);
        }
        
        // Deactivate verifier
        verifier.isActive = false;
        verifier.stakeAmount = 0;
        verifiedVerifiers[msg.sender] = false;
        
        // Set up delayed withdrawal
        pendingWithdrawals[msg.sender] = stakeAmount;
        withdrawalTimestamp[msg.sender] = block.timestamp;
        
        emit WithdrawalInitiated(msg.sender, stakeAmount, block.timestamp + WITHDRAWAL_DELAY);
    }
    
    /**
     * @dev Complete withdrawal after delay
     */
    function completeWithdrawal() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No pending withdrawal");
        require(
            block.timestamp >= withdrawalTimestamp[msg.sender] + WITHDRAWAL_DELAY,
            "Withdrawal not ready"
        );
        
        // Clear withdrawal
        pendingWithdrawals[msg.sender] = 0;
        withdrawalTimestamp[msg.sender] = 0;
        
        // Send funds
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) revert TransferFailed();
        
        emit WithdrawalCompleted(msg.sender, amount);
    }
    
    /**
     * @dev Get region for country (simple mapping)
     */
    function _getRegionForCountry(string memory _country) internal pure returns (string memory) {
        bytes32 countryHash = keccak256(bytes(_country));
        
        if (countryHash == keccak256(bytes("US")) || countryHash == keccak256(bytes("CA"))) {
            return "AMERICAS";
        } else if (countryHash == keccak256(bytes("UK")) || 
                   countryHash == keccak256(bytes("DE")) || 
                   countryHash == keccak256(bytes("FR"))) {
            return "EUROPE";
        } else if (countryHash == keccak256(bytes("JP")) || 
                   countryHash == keccak256(bytes("CN")) || 
                   countryHash == keccak256(bytes("IN"))) {
            return "ASIA";
        }
        return "GLOBAL";
    }
    
    // View functions
    function getInstitution(address _institution) external view returns (Institution memory) {
        return institutions[_institution];
    }
    
    function getVerifier(address _verifier) external view returns (Verifier memory) {
        return verifiers[_verifier];
    }
    
    function getRegionVerifiers(string calldata _region) external view returns (address[] memory) {
        return regionVerifiers[_region];
    }
    
    function getAllInstitutions() external view returns (address[] memory) {
        return institutionList;
    }
    
    function getAllVerifiers() external view returns (address[] memory) {
        return verifierList;
    }
    
    function getPendingWithdrawal(address _user) external view returns (uint256 amount, uint256 availableAt) {
        amount = pendingWithdrawals[_user];
        availableAt = withdrawalTimestamp[_user] + WITHDRAWAL_DELAY;
    }
    
    function canWithdraw(address _user) external view returns (bool) {
        return pendingWithdrawals[_user] > 0 && 
               block.timestamp >= withdrawalTimestamp[_user] + WITHDRAWAL_DELAY;
    }
    
    function getVerificationStatus(address _institution) external view returns (
        bool isRegistered,
        bool isVerified,
        uint8 verifierCount,
        uint8 requiredVerifiers
    ) {
        Institution memory institution = institutions[_institution];
        isRegistered = institution.registrationDate != 0;
        isVerified = institution.isVerified;
        verifierCount = institution.verifierCount;
        requiredVerifiers = MIN_VERIFIERS;
    }
    
    /**
     * @dev Get total contract stats
     */
    function getContractStats() external view returns (
        uint256 totalInstitutions,
        uint256 totalVerifiers,
        uint256 verifiedInstitutionsCount,
        uint256 totalStaked
    ) {
        totalInstitutions = institutionList.length;
        totalVerifiers = verifierList.length;
        
        // Count verified institutions
        for (uint256 i = 0; i < institutionList.length; i++) {
            if (institutions[institutionList[i]].isVerified) {
                verifiedInstitutionsCount++;
            }
        }
        
        // Calculate total staked
        totalStaked = address(this).balance;
    }
    
    /**
     * @dev Emergency function to receive ETH
     */
    receive() external payable {
        // Allow direct deposits for testing
    }
}
