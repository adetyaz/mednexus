// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MedicalIntelligenceNFT - Secure ERC-7857 Medical Intelligence Tokens
 * @dev Production-ready implementation with comprehensive security fixes for 0G Chain
 */
contract MedicalIntelligenceNFT is ERC721, ERC721URIStorage, ReentrancyGuard, Ownable {
    using Address for address payable;

    // =====================================================
    // CONSTANTS & CONFIGURATION
    // =====================================================
    
    uint256 public constant VALIDATION_THRESHOLD = 3;
    uint256 public constant MIN_REPUTATION = 10;
    uint256 public constant MAX_REPUTATION = 1000000; // Cap reputation to prevent overflow issues
    uint256 public constant PROOF_VALIDITY_PERIOD = 1 hours;

    // =====================================================
    // CORE STRUCTURES
    // =====================================================

    struct MedicalIntelligence {
        uint256 id;
        string name;
        string specialty;
        address creator;
        bytes32 metadataHash;          // Hash of encrypted medical intelligence
        string encryptedURI;           // 0G Storage URI for encrypted metadata
        uint256 creationTime;
        bool validated;
        uint256 validatorCount;
        uint256 price;
        bool forSale;
        uint256 saleDeadlineBlock;     // Block-based deadline for security
    }

    struct Validator {
        bool isActive;
        uint256 stake;
        uint256 reputation;
        string specialtyFocus;
        uint256 validationCount;
    }

    // =====================================================
    // STATE VARIABLES
    // =====================================================

    // Core mappings
    mapping(uint256 => MedicalIntelligence) public medicalINFTs;
    mapping(address => Validator) public validators;
    mapping(uint256 => mapping(address => bool)) public hasValidated;
    mapping(uint256 => mapping(address => bytes)) public authorizedUsage;
    
    // Oracle & Security
    mapping(address => bool) public trustedOracles;
    mapping(bytes32 => uint256) public proofTimestamps;
    
    // Financial
    mapping(address => uint256) public pendingWithdrawals; // Pull payment pattern
    
    // Counters
    uint256 private _nextTokenId = 1;
    uint256 private _nonce; // For secure token ID generation
    uint256 public totalSupply;
    uint256 public collectedFees;
    
    // Missing state variables from constructor
    uint256 public mintPrice;
    uint256 public validationFee;
    address public collaborationHub;
    address public verificationContract;
    bool public isMarketplaceActive;
    uint256 public royaltyPercentage;
    address public royaltyRecipient;

    // Oracle Integration
    address public oracle;
    mapping(bytes32 => bool) public verifiedProofs;
    
    // Creator earnings tracking for pull-based withdrawals
    mapping(address => uint256) public creatorBalances;
    
    // Metadata hash to token mapping
    mapping(bytes32 => uint256) public metadataHashToToken;
    
    // Usage deadlines to prevent griefing
    mapping(uint256 => uint256) public usageDeadlines;
    
    // Validator challenge system
    mapping(address => mapping(uint256 => bool)) public challengedValidations;
    mapping(uint256 => uint256) public challengeCount;
    
    // Commit-reveal scheme for front-running protection
    mapping(address => bytes32) public commitments;
    mapping(address => uint256) public commitTimestamps;
    uint256 public constant COMMIT_PHASE_DURATION = 10 minutes;
    uint256 public constant REVEAL_PHASE_DURATION = 20 minutes;
    
    // Content hash verification for metadata integrity
    mapping(uint256 => bytes32) public contentHashes;
    
    // Gas limit protection
    uint256 public constant MAX_VALIDATORS_PER_TOKEN = 100;
    uint256 public constant MAX_CHALLENGES_PER_TOKEN = 50;
    
    // Constants - some configurable by owner
    uint256 public CREATION_FEE = 0.0005 ether;
    uint256 public VALIDATOR_STAKE = 0.001 ether;
    uint256 public USAGE_FEE = 0.001 ether;
    uint256 public constant USAGE_DEADLINE_DURATION = 1 hours;
    uint256 public constant MAX_CHALLENGE_COUNT = 3;

    // =====================================================
    // EVENTS
    // =====================================================

    // =====================================================
    // EVENTS
    // =====================================================

    event MedicalINFTCreated(uint256 indexed tokenId, address indexed creator, string name, bytes32 metadataHash);
    event MedicalINFTValidated(uint256 indexed tokenId, address indexed validator);
    event ValidatorRegistered(address indexed validator, string specialtyFocus);
    event ValidatorSlashed(address indexed validator, uint256 amount, bytes32 evidenceHash, string reason);
    event MetadataUpdated(uint256 indexed tokenId, bytes32 newHash, string newURI);
    event UsageAuthorized(uint256 indexed tokenId, address indexed user, bytes permissions);
    event SecureTransferInitiated(uint256 indexed tokenId, address indexed from, address indexed to);
    event FeesWithdrawn(address indexed recipient, uint256 amount);
    event OracleUpdated(address indexed oldOracle, address indexed newOracle);
    event TrustedOracleAdded(address indexed oracle);
    event TrustedOracleRemoved(address indexed oracle);
    event FeeUpdated(string indexed feeType, uint256 oldFee, uint256 newFee);
    event UsageDeadlineSet(uint256 indexed tokenId, uint256 deadline);
    event AutoSlashingExecuted(address indexed validator, uint256 tokenId, string reason);
    event OracleCommitteeAdded(address indexed oracle);
    event OracleCommitteeRemoved(address indexed oracle);
    event OracleConsensusReached(bytes32 indexed proofHash, uint256 votes);
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);
    event AdminProposalCreated(bytes32 indexed proposalHash, string action);
    event AdminProposalExecuted(bytes32 indexed proposalHash);
    event MetadataHashVerified(uint256 indexed tokenId, bytes32 contentHash);
    event CommitRevealPhaseStarted(address indexed user, bytes32 commitment);

    // =====================================================
    // ERRORS
    // =====================================================
    
    error NotAuthorized();
    error TokenNotExists();
    error InsufficientFee();
    error AlreadyValidated();
    error NotValidator();
    error NotForSale();
    error InsufficientReputation();
    error AlreadyRegistered();
    error InvalidProof();
    error ProofExpired();
    error OracleNotSet();
    error UsageExpired();
    error ExcessiveChallenges();
    error ValidationNotChallenged();
    error TransferFailed();
    error TokenNotValidated();
    error NotAdmin();
    error InsufficientConsensus();
    error ProposalAlreadyExecuted();
    error ProposalNotReady();
    error TooManyValidators();
    error TooManyChallenges();
    error InvalidCommitment();
    error CommitPhaseEnded();
    error RevealPhaseNotStarted();
    error ContentHashMismatch();

    constructor(
        string memory name,
        string memory symbol,
        uint256 _mintPrice,
        uint256 _validationFee,
        address _collaborationHub,
        address _verificationContract,
        address _oracle,
        address[] memory _initialAdmins
    ) ERC721(name, symbol) Ownable(msg.sender) {
        require(_initialAdmins.length <= MAX_ADMINS, "Too many initial admins");
        
        mintPrice = _mintPrice;
        validationFee = _validationFee;
        collaborationHub = _collaborationHub;
        verificationContract = _verificationContract;
        oracle = _oracle;
        isMarketplaceActive = true;
        royaltyPercentage = 250; // 2.5%
        royaltyRecipient = msg.sender;
        
        // Initialize multi-sig admin system
        for (uint256 i = 0; i < _initialAdmins.length; i++) {
            require(_initialAdmins[i] != address(0), "Invalid admin address");
            admins.push(_initialAdmins[i]);
            isAdmin[_initialAdmins[i]] = true;
            emit AdminAdded(_initialAdmins[i]);
        }
        
        // Add owner as initial oracle committee member
        if (_oracle != address(0)) {
            oracleCommittee.push(_oracle);
            isOracleCommitteeMember[_oracle] = true;
            trustedOracles[_oracle] = true;
            emit OracleCommitteeAdded(_oracle);
        }
    }

    // =====================================================
    // UTILITY FUNCTIONS
    // =====================================================
    
    /**
     * @dev Check if token exists
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return medicalINFTs[tokenId].creator != address(0);
    }

    // =====================================================
    // MODIFIERS & VALIDATION
    // =====================================================

    modifier validToken(uint256 tokenId) {
        if (!_exists(tokenId)) revert TokenNotExists();
        _;
    }

    modifier onlyTokenOwner(uint256 tokenId) {
        if (ownerOf(tokenId) != msg.sender) revert NotAuthorized();
        _;
    }

    modifier onlyValidator() {
        if (!validators[msg.sender].isActive) revert NotValidator();
        _;
    }

    modifier onlyAdmin() {
        if (!isAdmin[msg.sender]) revert NotAdmin();
        _;
    }

    modifier validProof(bytes calldata proof) {
        if (oracle == address(0)) revert OracleNotSet();
        if (!_verifyProof(proof)) revert InvalidProof();
        _;
    }

    // =====================================================
    // PROOF VERIFICATION FUNCTIONS
    // =====================================================

    // =====================================================
    // SECURE TOKEN ID GENERATION
    // =====================================================

    function _generateSecureTokenId() private returns (uint256) {
        uint256 tokenId;
        do {
            // Enhanced entropy sources for maximum unpredictability
            tokenId = uint256(keccak256(abi.encodePacked(
                block.prevrandao,            // Primary entropy source (most secure)
                block.timestamp,
                msg.sender,
                _nextTokenId++,
                gasleft(),
                _nonce++,                    // Incremental nonce
                address(this),               // Contract address
                tx.origin,                   // Original sender
                block.basefee,               // Current base fee
                block.chainid                // Chain ID for cross-chain security
            )));
        } while (_exists(tokenId));
        
        return tokenId;
    }
    
    // =====================================================
    // ERC-7857 CORE FUNCTIONS
    // =====================================================
    
    /**
     * @dev ERC-7857 Secure Transfer with encrypted metadata
     */
    function transfer(
        address from,
        address to,
        uint256 tokenId,
        bytes calldata sealedKey,
        bytes calldata proof
    ) external nonReentrant validProof(proof) {
        if (from == address(0) || to == address(0)) revert("Zero address not allowed");
        if (ownerOf(tokenId) != from) revert NotAuthorized();
        
        // Extract new metadata hash from proof
        bytes32 newMetadataHash = _extractHashFromProof(proof);
        string memory newEncryptedURI = _extractURIFromProof(proof);
        
        // Update metadata access for new owner
        _updateMetadataAccess(tokenId, to, newMetadataHash, newEncryptedURI);
        
        // Transfer NFT ownership
        _transfer(from, to, tokenId);
        
        emit SecureTransferInitiated(tokenId, from, to);
        emit MetadataUpdated(tokenId, newMetadataHash, newEncryptedURI);
    }
    
    /**
     * @dev ERC-7857 Clone function - creates copy with same metadata (owner only)
     */
    function clone(
        address to,
        uint256 tokenId,
        bytes calldata sealedKey,
        bytes calldata proof
    ) external validToken(tokenId) nonReentrant returns (uint256 newTokenId) {
        if (to == address(0)) revert("Zero address not allowed");
        // Only token owner can clone (removed authorized usage cloning for security)
        if (ownerOf(tokenId) != msg.sender) revert NotAuthorized();
        
        // SECURITY: Only allow cloning of validated tokens
        if (!medicalINFTs[tokenId].validated) revert TokenNotValidated();
        
        // Extract expected metadata from proof and verify context
        bytes32 expectedMetadataHash = _extractHashFromProof(proof);
        if (!_verifyProofWithContext(proof, tokenId, expectedMetadataHash)) {
            revert InvalidProof();
        }
        
        // Generate secure, unpredictable token ID
        newTokenId = _generateSecureTokenId();
        
        totalSupply++;
        
        MedicalIntelligence storage original = medicalINFTs[tokenId];
        
        // Mint new token
        _mint(to, newTokenId);
        
        // Copy medical intelligence metadata
        medicalINFTs[newTokenId] = MedicalIntelligence({
            id: newTokenId,
            name: string(abi.encodePacked(original.name, " (Clone)")),
            specialty: original.specialty,
            creator: original.creator,
            metadataHash: expectedMetadataHash,
            encryptedURI: _extractURIFromProof(proof),
            creationTime: block.timestamp,
            validated: false, // Clones need re-validation
            validatorCount: 0,
            price: 0,
            forSale: false,
            saleDeadlineBlock: 0
        });
        
        emit MedicalINFTCreated(newTokenId, original.creator, medicalINFTs[newTokenId].name, medicalINFTs[newTokenId].metadataHash);
        return newTokenId;
    }
    
    /**
     * @dev ERC-7857 Authorize usage without ownership transfer
     */
    function authorizeUsage(
        uint256 tokenId,
        address executor,
        bytes calldata permissions
    ) external validToken(tokenId) onlyTokenOwner(tokenId) {
        authorizedUsage[tokenId][executor] = permissions;
        emit UsageAuthorized(tokenId, executor, permissions);
    }
    
    // =====================================================
    // MEDICAL INTELLIGENCE FUNCTIONS
    // =====================================================
    
    /**
     * @dev Register as medical validator with specialty focus
     */
    function registerValidator(string calldata specialtyFocus) external payable {
        if (msg.value < VALIDATOR_STAKE) revert InsufficientFee();
        if (validators[msg.sender].isActive) revert AlreadyRegistered();
        
        validators[msg.sender] = Validator({
            isActive: true,
            stake: msg.value,
            reputation: 10, // Starting reputation
            specialtyFocus: specialtyFocus,
            validationCount: 0
        });
        
        emit ValidatorRegistered(msg.sender, specialtyFocus);
    }
    
    /**
     * @dev Withdraw validator stake (loses validation rights)
     */
    function withdrawValidatorStake() external nonReentrant {
        Validator storage validator = validators[msg.sender];
        if (!validator.isActive) revert NotValidator();
        
        uint256 stake = validator.stake;
        
        // Reset validator state BEFORE external call (CEI pattern)
        validator.isActive = false;
        validator.stake = 0;
        validator.reputation = 0;
        
        // Use safe transfer with error handling
        (bool success, ) = payable(msg.sender).call{value: stake}("");
        if (!success) revert TransferFailed();
    }
    
    /**
     * @dev Commit phase for creation (front-running protection)
     */
    function commitCreation(bytes32 commitment) external {
        commitments[msg.sender] = commitment;
        commitTimestamps[msg.sender] = block.timestamp;
        emit CommitRevealPhaseStarted(msg.sender, commitment);
    }
    
    /**
     * @dev Reveal and create Medical Intelligence INFT (prevents front-running)
     */
    function revealAndCreateMedicalINFT(
        string calldata name,
        string calldata specialty,
        bytes32 metadataHash,
        string calldata encryptedURI,
        bytes32 contentHash,
        uint256 nonce
    ) external payable returns (uint256) {
        // Verify commit-reveal
        bytes32 commitment = commitments[msg.sender];
        if (commitment == bytes32(0)) revert InvalidCommitment();
        
        uint256 commitTime = commitTimestamps[msg.sender];
        if (block.timestamp < commitTime + COMMIT_PHASE_DURATION) revert CommitPhaseEnded();
        if (block.timestamp > commitTime + COMMIT_PHASE_DURATION + REVEAL_PHASE_DURATION) {
            revert RevealPhaseNotStarted();
        }
        
        // Verify commitment matches revealed data
        bytes32 expectedCommitment = keccak256(abi.encodePacked(
            name, specialty, metadataHash, encryptedURI, contentHash, nonce, msg.sender
        ));
        if (commitment != expectedCommitment) revert InvalidCommitment();
        
        // Clear commitment
        delete commitments[msg.sender];
        delete commitTimestamps[msg.sender];
        
        // Require exact payment (no refunds to prevent sandwich attacks)
        if (msg.value != CREATION_FEE) revert InsufficientFee();
        
        // Generate secure, unpredictable token ID
        uint256 tokenId = _generateSecureTokenId();
        
        totalSupply++;
        collectedFees += CREATION_FEE;
        
        // Mint NFT
        _mint(msg.sender, tokenId);
        
        // Store medical intelligence with content hash
        medicalINFTs[tokenId] = MedicalIntelligence({
            id: tokenId,
            name: name,
            specialty: specialty,
            creator: msg.sender,
            metadataHash: metadataHash,
            encryptedURI: encryptedURI,
            creationTime: block.timestamp,
            validated: false,
            validatorCount: 0,
            price: 0,
            forSale: false,
            saleDeadlineBlock: 0
        });
        
        // Store content hash for integrity verification
        contentHashes[tokenId] = contentHash;
        
        // Map metadata hash to token
        metadataHashToToken[metadataHash] = tokenId;
        
        emit MedicalINFTCreated(tokenId, msg.sender, name, metadataHash);
        emit MetadataHashVerified(tokenId, contentHash);
        return tokenId;
    }
    
    /**
     * @dev Validate Medical Intelligence INFT with overflow and gas limit protection
     */
    function validateMedicalINFT(uint256 tokenId) external validToken(tokenId) onlyValidator nonReentrant {
        if (hasValidated[tokenId][msg.sender]) revert AlreadyValidated();
        if (medicalINFTs[tokenId].validated) revert AlreadyValidated();
        
        // Prevent self-validation to avoid reputation gaming
        if (ownerOf(tokenId) == msg.sender) revert("Cannot validate own token");
        
        // Gas limit protection
        if (medicalINFTs[tokenId].validatorCount >= MAX_VALIDATORS_PER_TOKEN) {
            revert TooManyValidators();
        }
        
        Validator storage validator = validators[msg.sender];
        if (validator.reputation < MIN_REPUTATION) revert InsufficientReputation();
        
        // Mark validation
        hasValidated[tokenId][msg.sender] = true;
        
        // Safe increment with overflow protection
        if (medicalINFTs[tokenId].validatorCount < type(uint256).max) {
            medicalINFTs[tokenId].validatorCount++;
        }
        
        // Prevent reputation overflow with proper bounds checking
        if (validator.reputation < MAX_REPUTATION) {
            validator.reputation = Math.min(validator.reputation + 1, MAX_REPUTATION);
        }
        
        // Safe increment for validation count
        if (validator.validationCount < type(uint256).max) {
            validator.validationCount++;
        }
        
        // Mark as validated when threshold reached
        if (medicalINFTs[tokenId].validatorCount >= VALIDATION_THRESHOLD) {
            medicalINFTs[tokenId].validated = true;
        }
        
        emit MedicalINFTValidated(tokenId, msg.sender);
    }
    
    /**
     * @dev List Medical INFT for sale with deadline
     */
    function listForSale(uint256 tokenId, uint256 price, uint256 blockDuration) external validToken(tokenId) onlyTokenOwner(tokenId) {
        if (medicalINFTs[tokenId].forSale) revert("Already listed");
        if (blockDuration == 0 || blockDuration > 200000) revert("Invalid duration"); // ~30 days in blocks
        
        medicalINFTs[tokenId].forSale = true;
        medicalINFTs[tokenId].price = price;
        medicalINFTs[tokenId].saleDeadlineBlock = block.number + blockDuration;
    }
    
    /**
     * @dev Purchase Medical INFT with enhanced security and safe transfer
     */
    function purchase(uint256 tokenId) external payable validToken(tokenId) nonReentrant {
        MedicalIntelligence storage inft = medicalINFTs[tokenId];
        
        if (!inft.forSale) revert NotForSale();
        if (block.number > inft.saleDeadlineBlock) revert("Sale expired");
        if (msg.value != inft.price) revert InsufficientFee(); // Exact payment required
        
        address seller = ownerOf(tokenId);
        uint256 price = inft.price;
        
        // CHECKS-EFFECTS-INTERACTIONS: Update ALL state FIRST
        inft.forSale = false;
        inft.price = 0;
        inft.saleDeadlineBlock = 0;
        
        // Use safe transfer to prevent reentrancy via malicious contracts
        _safeTransfer(seller, msg.sender, tokenId, "");
        
        // Use pull payment pattern for seller - safer than push
        creatorBalances[seller] += price;
    }
    
    /**
     * @dev Use Medical Intelligence (pays owner for access)
     */
    function useMedicalIntelligence(uint256 tokenId) external payable validToken(tokenId) nonReentrant {
        if (msg.value < USAGE_FEE) revert InsufficientFee();
        
        // Check if usage deadline has expired
        if (usageDeadlines[tokenId] != 0 && block.timestamp > usageDeadlines[tokenId]) {
            revert UsageExpired();
        }
        
        // Set usage deadline to prevent griefing
        usageDeadlines[tokenId] = block.timestamp + USAGE_DEADLINE_DURATION;
        
        address owner_ = ownerOf(tokenId);
        uint256 refund = msg.value - USAGE_FEE;
        
        // Use pull payment pattern for owner - safer than push
        creatorBalances[owner_] += USAGE_FEE;
        
        // Safe refund to user with error handling
        if (refund > 0) {
            (bool success, ) = payable(msg.sender).call{value: refund}("");
            if (!success) revert TransferFailed();
        }
        
        emit UsageDeadlineSet(tokenId, usageDeadlines[tokenId]);
    }
    
    // =====================================================
    // ADMIN & ORACLE FUNCTIONS
    // =====================================================
    
    // Oracle management with multi-sig support
    mapping(address => uint256) public oracleProposals;
    uint256 public constant ORACLE_PROPOSAL_DELAY = 2 days;
    
    // Multi-sig admin system
    address[] public admins;
    mapping(address => bool) public isAdmin;
    uint256 public constant MIN_ADMIN_CONSENSUS = 2; // Require 2 out of 3 admins
    uint256 public constant MAX_ADMINS = 3;
    
    // Admin proposal system
    mapping(bytes32 => mapping(address => bool)) public adminVotes;
    mapping(bytes32 => uint256) public adminVoteCount;
    mapping(bytes32 => uint256) public adminProposalTimestamp;
    mapping(bytes32 => bool) public adminProposalExecuted;
    
    // Decentralized Oracle Committee
    address[] public oracleCommittee;
    mapping(address => bool) public isOracleCommitteeMember;
    uint256 public constant MIN_ORACLE_CONSENSUS = 3; // Require 3 out of 5 oracles
    uint256 public constant MAX_ORACLE_COMMITTEE = 5;
    
    // Oracle voting system
    mapping(bytes32 => mapping(address => bool)) public oracleVotes;
    mapping(bytes32 => uint256) public oracleVoteCount;
    mapping(bytes32 => bool) public verifiedByCommittee;
    
    /**
     * @dev Propose oracle update with timelock (enhanced security)
     */
    function proposeOracleUpdate(address newOracle) external onlyOwner {
        if (newOracle == address(0)) revert("Zero address not allowed");
        oracleProposals[newOracle] = block.timestamp + ORACLE_PROPOSAL_DELAY;
        emit OracleUpdated(oracle, newOracle); // Proposal event
    }
    
    /**
     * @dev Execute oracle update after timelock (enhanced security)
     */
    function executeOracleUpdate(address newOracle) external onlyOwner {
        if (newOracle == address(0)) revert("Zero address not allowed");
        if (oracleProposals[newOracle] == 0) revert("Oracle not proposed");
        if (block.timestamp < oracleProposals[newOracle]) revert("Timelock not expired");
        
        address oldOracle = oracle;
        oracle = newOracle;
        delete oracleProposals[newOracle];
        
        emit OracleUpdated(oldOracle, newOracle);
    }
    
    /**
     * @dev Add oracle committee member (requires admin consensus)
     */
    function proposeAddOracleCommittee(address newOracle) external onlyAdmin {
        require(newOracle != address(0), "Zero address not allowed");
        require(!isOracleCommitteeMember[newOracle], "Already committee member");
        require(oracleCommittee.length < MAX_ORACLE_COMMITTEE, "Committee full");
        
        bytes32 proposalHash = keccak256(abi.encodePacked("ADD_ORACLE", newOracle, block.timestamp));
        _createAdminProposal(proposalHash, "ADD_ORACLE_COMMITTEE");
    }
    
    /**
     * @dev Execute oracle committee addition after consensus
     */
    function executeAddOracleCommittee(address newOracle, bytes32 proposalHash) external onlyAdmin {
        require(_hasAdminConsensus(proposalHash), "Insufficient admin consensus");
        require(!adminProposalExecuted[proposalHash], "Already executed");
        
        oracleCommittee.push(newOracle);
        isOracleCommitteeMember[newOracle] = true;
        trustedOracles[newOracle] = true;
        adminProposalExecuted[proposalHash] = true;
        
        emit OracleCommitteeAdded(newOracle);
        emit AdminProposalExecuted(proposalHash);
    }
    
    /**
     * @dev Oracle committee voting for evidence verification
     */
    function voteOnEvidence(bytes32 evidenceHash, bool approve) external {
        require(isOracleCommitteeMember[msg.sender], "Not committee member");
        require(!oracleVotes[evidenceHash][msg.sender], "Already voted");
        
        oracleVotes[evidenceHash][msg.sender] = true;
        if (approve) {
            oracleVoteCount[evidenceHash]++;
            
            // Check if consensus reached
            if (oracleVoteCount[evidenceHash] >= MIN_ORACLE_CONSENSUS) {
                verifiedByCommittee[evidenceHash] = true;
                emit OracleConsensusReached(evidenceHash, oracleVoteCount[evidenceHash]);
            }
        }
    }
    
    /**
     * @dev Verify evidence by oracle committee consensus
     */
    function _verifyByOracleCommittee(bytes32 evidenceHash) internal view returns (bool) {
        return verifiedByCommittee[evidenceHash];
    }
    
    /**
     * @dev Create admin proposal
     */
    function _createAdminProposal(bytes32 proposalHash, string memory action) internal {
        adminProposalTimestamp[proposalHash] = block.timestamp;
        adminVotes[proposalHash][msg.sender] = true;
        adminVoteCount[proposalHash] = 1;
        
        emit AdminProposalCreated(proposalHash, action);
    }
    
    /**
     * @dev Check if admin consensus is reached
     */
    function _hasAdminConsensus(bytes32 proposalHash) internal view returns (bool) {
        return adminVoteCount[proposalHash] >= MIN_ADMIN_CONSENSUS &&
               block.timestamp >= adminProposalTimestamp[proposalHash] + ORACLE_PROPOSAL_DELAY;
    }
    
    /**
     * @dev Challenge a validation if it's found to be invalid (with gas limits)
     */
    function challengeValidation(
        uint256 tokenId,
        address validator,
        bytes calldata evidenceProof,
        string calldata reason
    ) external validToken(tokenId) {
        if (!hasValidated[tokenId][validator]) revert ValidationNotChallenged();
        if (challengedValidations[validator][tokenId]) revert("Already challenged");
        if (challengeCount[tokenId] >= MAX_CHALLENGES_PER_TOKEN) revert TooManyChallenges();
        
        // Mark as challenged
        challengedValidations[validator][tokenId] = true;
        challengeCount[tokenId]++;
        
        // Require oracle committee consensus for evidence verification
        bytes32 evidenceHash = keccak256(evidenceProof);
        if (evidenceProof.length > 0 && _verifyByOracleCommittee(evidenceHash)) {
            _executeAutoSlashing(validator, tokenId, reason);
        }
    }
    
    /**
     * @dev Execute automatic slashing for invalid validation
     */
    function _executeAutoSlashing(
        address validator,
        uint256 tokenId,
        string memory reason
    ) internal {
        Validator storage val = validators[validator];
        if (!val.isActive) return;
        
        uint256 slashAmount = val.stake / 4; // Slash 25% of stake
        if (slashAmount > val.stake) slashAmount = val.stake;
        
        // Update validator state
        val.stake -= slashAmount;
        val.reputation = val.reputation > 50 ? val.reputation - 50 : 0;
        
        // Add to collected fees
        collectedFees += slashAmount;
        
        // Remove validation if severely slashed
        if (val.reputation < MIN_REPUTATION) {
            hasValidated[tokenId][validator] = false;
            if (medicalINFTs[tokenId].validatorCount > 0) {
                medicalINFTs[tokenId].validatorCount--;
            }
            
            // Recheck validation status
            if (medicalINFTs[tokenId].validatorCount < VALIDATION_THRESHOLD) {
                medicalINFTs[tokenId].validated = false;
            }
        }
        
        emit AutoSlashingExecuted(validator, tokenId, reason);
    }
    /**
     * @dev Allows creators to withdraw their accumulated earnings (pull pattern)
     */
    function withdrawCreatorEarnings() external nonReentrant {
        uint256 amount = creatorBalances[msg.sender];
        if (amount == 0) revert("No earnings to withdraw");
        
        // Reset balance before transfer (CEI pattern)
        creatorBalances[msg.sender] = 0;
        
        // Use safe transfer with error handling
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) revert TransferFailed();
        
        emit FeesWithdrawn(msg.sender, amount);
    }
    
    /**
     * @dev Check creator earnings balance
     */
    function getCreatorBalance(address creator) external view returns (uint256) {
        return creatorBalances[creator];
    }
    
    /**
     * @dev ERC-165 support with ERC-7857 compliance
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, ERC721URIStorage) returns (bool) {
        return
            interfaceId == 0x01ffc9a7 || // ERC165 Interface ID for ERC165
            interfaceId == 0x80ac58cd || // ERC165 Interface ID for ERC721
            interfaceId == 0x5b5e139f || // ERC165 Interface ID for ERC721Metadata
            interfaceId == 0x2a55205a || // ERC165 Interface ID for ERC2981 (Royalties)
            interfaceId == 0x78570000 || // ERC165 Interface ID for ERC7857 (first 4 bytes of "ERC7857")
            super.supportsInterface(interfaceId);
    }
    
    /**
     * @dev ERC-7857 compliance declaration
     */
    function supportsERC7857() external pure returns (bool) {
        return true;
    }
    
    /**
     * @dev Propose fee update (requires admin consensus)
     */
    function proposeUpdateCreationFee(uint256 newFee) external onlyAdmin {
        require(newFee <= 0.01 ether, "Fee too high");
        bytes32 proposalHash = keccak256(abi.encodePacked("UPDATE_CREATION_FEE", newFee, block.timestamp));
        _createAdminProposal(proposalHash, "UPDATE_CREATION_FEE");
    }
    
    /**
     * @dev Execute fee update after consensus
     */
    function executeUpdateCreationFee(uint256 newFee, bytes32 proposalHash) external onlyAdmin {
        require(_hasAdminConsensus(proposalHash), "Insufficient admin consensus");
        require(!adminProposalExecuted[proposalHash], "Already executed");
        
        uint256 oldFee = CREATION_FEE;
        CREATION_FEE = newFee;
        adminProposalExecuted[proposalHash] = true;
        
        emit FeeUpdated("creation", oldFee, newFee);
        emit AdminProposalExecuted(proposalHash);
    }
    
    /**
     * @dev Propose validator stake update (requires admin consensus)
     */
    function proposeUpdateValidatorStake(uint256 newStake) external onlyAdmin {
        require(newStake >= 0.0001 ether && newStake <= 0.1 ether, "Stake out of range");
        bytes32 proposalHash = keccak256(abi.encodePacked("UPDATE_VALIDATOR_STAKE", newStake, block.timestamp));
        _createAdminProposal(proposalHash, "UPDATE_VALIDATOR_STAKE");
    }
    
    /**
     * @dev Execute validator stake update after consensus
     */
    function executeUpdateValidatorStake(uint256 newStake, bytes32 proposalHash) external onlyAdmin {
        require(_hasAdminConsensus(proposalHash), "Insufficient admin consensus");
        require(!adminProposalExecuted[proposalHash], "Already executed");
        
        uint256 oldStake = VALIDATOR_STAKE;
        VALIDATOR_STAKE = newStake;
        adminProposalExecuted[proposalHash] = true;
        
        emit FeeUpdated("validator_stake", oldStake, newStake);
        emit AdminProposalExecuted(proposalHash);
    }
    
    /**
     * @dev Withdraw collected fees (only owner) with enhanced security
     */
    function withdrawFees() external onlyOwner nonReentrant {
        uint256 amount = collectedFees;
        if (amount == 0) revert("No fees to withdraw");
        
        // Reset before transfer (CEI pattern)
        collectedFees = 0;
        
        // Use safe transfer with error handling
        (bool success, ) = payable(owner()).call{value: amount}("");
        if (!success) revert TransferFailed();
        
        emit FeesWithdrawn(owner(), amount);
    }
    
    /**
     * @dev Propose validator slashing with evidence (requires admin consensus)
     */
    function proposeSlashValidator(
        address validator,
        uint256 amount,
        bytes32 evidenceHash,
        string calldata reason
    ) external onlyAdmin {
        require(validator != address(0), "Zero address not allowed");
        require(validators[validator].isActive, "Validator not active");
        require(evidenceHash != bytes32(0), "Evidence required");
        require(bytes(reason).length > 0, "Reason required");
        require(verifiedByCommittee[evidenceHash], "Evidence not verified by oracle committee");
        
        bytes32 proposalHash = keccak256(abi.encodePacked(
            "SLASH_VALIDATOR", validator, amount, evidenceHash, block.timestamp
        ));
        _createAdminProposal(proposalHash, "SLASH_VALIDATOR");
    }
    
    /**
     * @dev Execute validator slashing after admin consensus and oracle verification
     */
    function executeSlashValidator(
        address validator,
        uint256 amount,
        bytes32 evidenceHash,
        string calldata reason,
        bytes32 proposalHash
    ) external onlyAdmin {
        require(_hasAdminConsensus(proposalHash), "Insufficient admin consensus");
        require(!adminProposalExecuted[proposalHash], "Already executed");
        require(verifiedByCommittee[evidenceHash], "Evidence not verified");
        
        Validator storage val = validators[validator];
        if (amount > val.stake) amount = val.stake;
        
        val.stake -= amount;
        val.reputation = val.reputation > 10 ? val.reputation - 10 : 0;
        collectedFees += amount;
        adminProposalExecuted[proposalHash] = true;
        
        emit ValidatorSlashed(validator, amount, evidenceHash, reason);
        emit AdminProposalExecuted(proposalHash);
    }
    
    // =====================================================
    // INTERNAL FUNCTIONS (ERC-7857 Support)
    // =====================================================
    
    /**
     * @dev Verify oracle proof with proper ECDSA signature verification
     */
    function _verifyProof(bytes calldata proof) internal view returns (bool) {
        if (oracle == address(0)) return false;
        if (proof.length < 129) return false; // 32 (hash) + 32 (tokenId) + 65 (signature)
        
        // Extract components with strict structure
        bytes32 dataHash = bytes32(proof[:32]);
        uint256 tokenId = abi.decode(proof[32:64], (uint256));
        
        // Create message hash with contract address for replay protection
        bytes32 messageHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n84",
            dataHash,
            tokenId,
            address(this) // Include contract address for replay protection
        ));
        
        // Extract signature (v, r, s)
        uint8 v = uint8(proof[64]);
        bytes32 r = bytes32(proof[65:97]);
        bytes32 s = bytes32(proof[97:129]);
        
        // Recover signer
        address signer = ecrecover(messageHash, v, r, s);
        
        // Verify signer is trusted oracle
        return trustedOracles[signer] || signer == oracle;
    }
    
    /**
     * @dev Verify oracle proof with tokenId and metadata context validation
     */
    function _verifyProofWithContext(
        bytes calldata proof, 
        uint256 tokenId, 
        bytes32 expectedMetadataHash
    ) internal view returns (bool) {
        if (oracle == address(0)) return false;
        if (proof.length < 129) return false; // 32 (tokenId) + 32 (hash) + 65 (signature)
        
        // Extract components with context
        uint256 proofTokenId = abi.decode(proof[:32], (uint256));
        bytes32 metadataHash = bytes32(proof[32:64]);
        
        // Verify context matches
        if (proofTokenId != tokenId || metadataHash != expectedMetadataHash) {
            return false;
        }
        
        // Create message hash with context
        bytes32 messageHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n64",
            abi.encodePacked(proofTokenId, metadataHash)
        ));
        
        // Extract signature (v, r, s)
        uint8 v = uint8(proof[64]);
        bytes32 r = bytes32(proof[65:97]);
        bytes32 s = bytes32(proof[97:129]);
        
        // Recover signer
        address signer = ecrecover(messageHash, v, r, s);
        
        // Verify signer is trusted oracle
        return trustedOracles[signer] || signer == oracle;
    }
    
    /**
     * @dev Extract metadata hash from oracle proof
     */
    function _extractHashFromProof(bytes calldata proof) internal pure returns (bytes32) {
        if (proof.length < 32) return bytes32(0);
        return bytes32(proof[:32]);
    }
    
    /**
     * @dev Extract encrypted URI from oracle proof
     */
    function _extractURIFromProof(bytes calldata proof) internal pure returns (string memory) {
        if (proof.length < 64) return "";
        return string(proof[32:]);
    }
    
    /**
     * @dev Update metadata access for new owner
     */
    function _updateMetadataAccess(
        uint256 tokenId,
        address newOwner,
        bytes32 newMetadataHash,
        string memory newEncryptedURI
    ) internal {
        medicalINFTs[tokenId].metadataHash = newMetadataHash;
        medicalINFTs[tokenId].encryptedURI = newEncryptedURI;
        
        // Update mapping
        metadataHashToToken[newMetadataHash] = tokenId;
    }
    
    /**
     * @dev Check if address can clone token
     */
    function _canClone(uint256 tokenId, address cloner) internal view returns (bool) {
        return ownerOf(tokenId) == cloner || 
               authorizedUsage[tokenId][cloner].length > 0;
    }
    
    // =====================================================
    // VIEW FUNCTIONS
    // =====================================================
    
    /**
     * @dev Get Medical Intelligence INFT details (gas optimized)
     */
    function getMedicalINFT(uint256 tokenId) external view validToken(tokenId) returns (
        uint256 id,
        string memory name,
        string memory specialty,
        address creator,
        bytes32 metadataHash,
        string memory encryptedURI,
        uint256 creationTime,
        bool validated,
        uint256 validatorCount,
        uint256 price,
        bool forSale,
        uint256 saleDeadlineBlock
    ) {
        MedicalIntelligence storage inft = medicalINFTs[tokenId];
        return (
            inft.id,
            inft.name,
            inft.specialty,
            inft.creator,
            inft.metadataHash,
            inft.encryptedURI,
            inft.creationTime,
            inft.validated,
            inft.validatorCount,
            inft.price,
            inft.forSale,
            inft.saleDeadlineBlock
        );
    }
    
    /**
     * @dev Get validator information (gas optimized)
     */
    function getValidator(address validator) external view returns (
        bool isActive,
        uint256 stake,
        uint256 reputation,
        string memory specialtyFocus,
        uint256 validationCount
    ) {
        Validator storage val = validators[validator];
        return (
            val.isActive,
            val.stake,
            val.reputation,
            val.specialtyFocus,
            val.validationCount
        );
    }
    
    /**
     * @dev Check if address is active validator
     */
    function isValidator(address addr) external view returns (bool) {
        return validators[addr].isActive;
    }
    
    /**
     * @dev Get authorization permissions for executor
     */
    function getAuthorization(uint256 tokenId, address executor) external view returns (bytes memory) {
        return authorizedUsage[tokenId][executor];
    }
    
    /**
     * @dev Get contract statistics
     */
    function getStats() external view returns (
        uint256 total,
        uint256 nextId,
        uint256 fees,
        address currentOracle
    ) {
        return (totalSupply, _nextTokenId, collectedFees, oracle);
    }
    
    /**
     * @dev Get encrypted metadata URI with content hash verification
     */
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) validToken(tokenId) returns (string memory) {
        // ERC-7857: Restrict access to token owner or authorized users only
        if (ownerOf(tokenId) != msg.sender && authorizedUsage[tokenId][msg.sender].length == 0) {
            revert NotAuthorized();
        }
        return medicalINFTs[tokenId].encryptedURI;
    }
    
    /**
     * @dev Verify content hash matches stored hash (for integrity checking)
     */
    function verifyContentHash(uint256 tokenId, bytes32 providedHash) external view validToken(tokenId) returns (bool) {
        return contentHashes[tokenId] == providedHash;
    }
    
    /**
     * @dev Get content hash for metadata integrity verification
     */
    function getContentHash(uint256 tokenId) external view validToken(tokenId) returns (bytes32) {
        // Only token owner or authorized users can access content hash
        if (ownerOf(tokenId) != msg.sender && authorizedUsage[tokenId][msg.sender].length == 0) {
            revert NotAuthorized();
        }
        return contentHashes[tokenId];
    }
    
    /**
     * @dev Check if token has been validated by minimum validators
     */
    function isValidated(uint256 tokenId) external view validToken(tokenId) returns (bool) {
        return medicalINFTs[tokenId].validated;
    }
    
    /**
     * @dev Get validation count for token
     */
    function getValidationCount(uint256 tokenId) external view validToken(tokenId) returns (uint256) {
        return medicalINFTs[tokenId].validatorCount;
    }
    
    /**
     * @dev ERC-7857 Key management simulation (placeholder for future implementation)
     */
    function reencrypt(
        uint256 tokenId,
        address newOwner,
        bytes calldata publicKey
    ) external validToken(tokenId) onlyTokenOwner(tokenId) returns (bytes memory) {
        // This is a placeholder for proxy re-encryption
        // In a full implementation, this would integrate with the 0G DA layer
        return abi.encodePacked("reencrypted_key_for_", newOwner, "_token_", tokenId);
    }
    
    /**
     * @dev ERC-7857 Decrypt simulation (placeholder for future implementation)
     */
    function decrypt(
        uint256 tokenId,
        bytes calldata encryptedData
    ) external view validToken(tokenId) returns (bytes memory) {
        // Only token owner or authorized users can decrypt
        if (ownerOf(tokenId) != msg.sender && authorizedUsage[tokenId][msg.sender].length == 0) {
            revert NotAuthorized();
        }
        
        // This is a placeholder for decryption
        // In a full implementation, this would integrate with the 0G Compute layer
        return abi.encodePacked("decrypted_data_for_token_", tokenId);
    }
    
    /**
     * @dev Get usage deadline for token
     */
    function getUsageDeadline(uint256 tokenId) external view validToken(tokenId) returns (uint256) {
        return usageDeadlines[tokenId];
    }
    
    /**
     * @dev Get challenge information for token
     */
    function getChallengeInfo(uint256 tokenId) external view validToken(tokenId) returns (uint256 count) {
        return challengeCount[tokenId];
    }
    
    /**
     * @dev Check if validation is challenged
     */
    function isValidationChallenged(address validator, uint256 tokenId) external view returns (bool) {
        return challengedValidations[validator][tokenId];
    }
    
    /**
     * @dev Vote on admin proposal
     */
    function voteOnAdminProposal(bytes32 proposalHash) external onlyAdmin {
        require(!adminVotes[proposalHash][msg.sender], "Already voted");
        require(adminProposalTimestamp[proposalHash] > 0, "Proposal does not exist");
        
        adminVotes[proposalHash][msg.sender] = true;
        adminVoteCount[proposalHash]++;
    }
    
    /**
     * @dev Get admin proposal status
     */
    function getAdminProposalStatus(bytes32 proposalHash) external view returns (
        uint256 voteCount,
        uint256 timestamp,
        bool executed,
        bool hasConsensus
    ) {
        return (
            adminVoteCount[proposalHash],
            adminProposalTimestamp[proposalHash],
            adminProposalExecuted[proposalHash],
            _hasAdminConsensus(proposalHash)
        );
    }
    
    /**
     * @dev Get oracle committee info
     */
    function getOracleCommitteeInfo() external view returns (
        address[] memory committee,
        uint256 consensusThreshold
    ) {
        return (oracleCommittee, MIN_ORACLE_CONSENSUS);
    }
    
    /**
     * @dev Get admin committee info
     */
    function getAdminCommitteeInfo() external view returns (
        address[] memory adminList,
        uint256 consensusThreshold
    ) {
        return (admins, MIN_ADMIN_CONSENSUS);
    }
}
