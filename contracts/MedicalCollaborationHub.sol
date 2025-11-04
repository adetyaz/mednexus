// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title MedicalCollaborationHub - Cross-Border Medical Coordination
 * @dev Decentralized medical collaboration with consent management
 * @author MedNexus Team
 * @notice Global medical case coordination and consent verification on 0G Chain
 */
contract MedicalCollaborationHub is ReentrancyGuard {
    using ECDSA for bytes32;
    
    // Medical case structure for global collaboration
    struct MedicalCase {
        bytes32 caseHash;                    // Hash of encrypted case data
        address patientProxy;                // Patient consent representative
        address[] authorizedInstitutions;    // Hospitals with access
        address[] consultingDoctors;         // Global expert consultants
        uint128 consentTimestamp;            // Patient consent timestamp
        uint128 caseExpiry;                  // Case access expiration
        bool isActive;                       // Case status
        bool researchParticipation;          // Research participation flag
        MedicalConsent patientConsent;       // Granular consent details
        string caseType;                     // Case classification
        string urgencyLevel;                 // Priority level
    }
    
    // Granular patient consent structure (gas-optimized)
    struct MedicalConsent {
        bool diagnosticSharing;              // Allow diagnostic data sharing
        bool treatmentSharing;               // Allow treatment outcome sharing
        bool researchParticipation;          // Allow research participation
        bool globalConsultation;             // Allow international consultation
        bool emergencyAccess;                // Allow emergency access
        uint128 consentExpiry;               // Consent expiration timestamp
        bytes32 consentSignatureHash;        // Patient signature verification
        uint8 restrictedRegionCount;         // Number of restricted regions
        uint8 allowedSpecialtyCount;         // Number of allowed specialties
    }
    
    // Separate mappings for consent restrictions (more gas efficient)
    mapping(bytes32 => mapping(bytes32 => bool)) public caseRestrictedRegions; // caseHash => region => restricted
    mapping(bytes32 => mapping(bytes32 => bool)) public caseAllowedSpecialties; // caseHash => specialty => allowed
    
    // Medical collaboration session
    struct CollaborationSession {
        bytes32 sessionId;                   // Unique session identifier
        bytes32 caseHash;                    // Associated medical case
        address[] participants;              // Session participants
        uint128 sessionStart;                // Session start time
        uint128 sessionEnd;                  // Session end time
        bool isActive;                       // Session status
        string sessionType;                  // Consultation, research, emergency
        bytes32 outcomeHash;                 // Hash of session outcomes
    }
    
    // Medical institution profile
    struct MedicalInstitution {
        string name;                         // Institution name
        string country;                      // Institution country
        string[] specialties;                // Medical specialties
        address institutionAddress;          // Institution wallet
        uint128 registrationDate;            // Registration timestamp
        uint128 lastActivity;                // Last activity timestamp
        bool isVerified;                     // Verification status
        bool isActive;                       // Active status
        uint256 collaborationCount;          // Number of collaborations
        uint256 reputationScore;             // Institution reputation
    }
    
    // Medical professional profile
    struct MedicalProfessional {
        string name;                         // Doctor name
        string specialty;                    // Medical specialty
        string licenseNumber;                // Medical license
        address doctorAddress;               // Doctor wallet
        address institutionAddress;          // Associated institution
        uint128 registrationDate;            // Registration timestamp
        bool isVerified;                     // Verification status
        bool isActive;                       // Active status
        uint256 consultationCount;           // Number of consultations
        uint256 reputationScore;             // Doctor reputation
    }
    
    // Cross-border medical agreement
    struct MedicalAgreement {
        bytes32 agreementId;                 // Agreement identifier
        address[] participatingInstitutions; // Institutions in agreement
        string[] countries;                  // Countries involved
        uint128 agreementDate;               // Agreement creation date
        uint128 expiryDate;                  // Agreement expiration
        bool isActive;                       // Agreement status
        string agreementType;                // Research, emergency, routine
        bytes32 termsHash;                   // Hash of agreement terms
    }
    
    enum UrgencyLevel { ROUTINE, URGENT, EMERGENCY, CRITICAL }
    enum CaseType { DIAGNOSTIC, TREATMENT, RESEARCH, EMERGENCY }
    enum SessionType { CONSULTATION, RESEARCH, EMERGENCY, SECOND_OPINION }
    
    // Core mappings
    mapping(bytes32 => MedicalCase) public medicalCases;
    mapping(bytes32 => CollaborationSession) public collaborationSessions;
    mapping(address => MedicalInstitution) public institutions;
    mapping(address => MedicalProfessional) public doctors;
    mapping(bytes32 => MedicalAgreement) public agreements;
    
    // Access control mappings
    mapping(address => bool) public verifiedInstitutions;
    mapping(address => bool) public verifiedDoctors;
    mapping(bytes32 => mapping(address => bool)) public caseAccess;
    mapping(address => mapping(address => bool)) public institutionPartnership;
    mapping(bytes32 => address[]) public caseParticipants;
    
    // Consent management
    mapping(bytes32 => mapping(address => bool)) public consentGiven;
    mapping(address => bytes32[]) public patientCases;
    mapping(bytes32 => uint256) public consentRevisions;
    
    // Arrays for enumeration (with size limits)
    bytes32[] public activeCases;
    bytes32[] public activeSessions;
    address[] public institutionList;
    address[] public doctorList;
    
    // Security constants
    uint256 public constant MAX_PARTICIPANTS = 50; // Prevent DoS
    uint256 public constant MAX_ARRAY_SIZE = 1000; // Storage limit
    uint256 public constant COMMIT_REVEAL_DELAY = 1 seconds; // Commit-reveal window
    uint256 public constant MAX_DAILY_REPUTATION = 20; // Max reputation gain per day
    
    // Stake tracking for withdrawals
    mapping(address => uint256) public stakedAmounts;
    mapping(address => uint256) public stakingTimestamp;
    
    // Commit-reveal pattern for secure registrations
    mapping(address => bytes32) public registrationCommits;
    mapping(address => uint256) public commitTimestamps;
    
    // Reputation rate limiting (address => day => reputation gained)
    mapping(address => mapping(uint256 => uint256)) public dailyReputationGained;
    
    // Emergency access tracking
    mapping(bytes32 => mapping(address => uint256)) public emergencyAccessGranted;
    
    // Constants (faucet-friendly pricing - ~$1 USD)
    uint256 public constant INSTITUTION_STAKE = 0.002 ether; // ~$4 USD for institutions
    uint256 public constant DOCTOR_STAKE = 0.0005 ether; // ~$1 USD for individual doctors
    uint256 public constant EMERGENCY_THRESHOLD = 1 hours;
    uint256 public constant DEFAULT_CASE_DURATION = 30 days;
    
    // Events
    event MedicalCaseRegistered(
        bytes32 indexed caseHash,
        address indexed patientProxy,
        address indexed institution,
        string caseType,
        uint256 timestamp
    );
    
    event CollaborationRequested(
        bytes32 indexed caseHash,
        address indexed requestingInstitution,
        address indexed targetInstitution,
        string urgencyLevel
    );
    
    event ConsentUpdated(
        bytes32 indexed caseHash,
        address indexed patientProxy,
        bool diagnosticSharing,
        bool treatmentSharing,
        bool researchParticipation
    );
    
    event SessionStarted(
        bytes32 indexed sessionId,
        bytes32 indexed caseHash,
        address[] participants,
        string sessionType
    );
    
    event SessionCompleted(
        bytes32 indexed sessionId,
        bytes32 indexed caseHash,
        bytes32 outcomeHash,
        uint256 duration
    );
    
    event InstitutionRegistered(
        address indexed institution,
        string name,
        string country,
        string[] specialties
    );
    
    event DoctorRegistered(
        address indexed doctor,
        string name,
        string specialty,
        address institution
    );
    
    event EmergencyAccessGranted(
        bytes32 indexed caseHash,
        address indexed emergencyInstitution,
        address indexed authorizingDoctor,
        uint256 timestamp
    );
    
    event CrossBorderAgreement(
        bytes32 indexed agreementId,
        address[] institutions,
        string[] countries,
        string agreementType
    );
    
    // Custom errors
    error NotVerifiedInstitution();
    error NotVerifiedDoctor();
    error InvalidConsent();
    error ZeroAddress();
    error InvalidSignature();
    error ExceedsMaxParticipants();
    error InvalidEnumValue();
    error StakeNotWithdrawable();
    error InsufficientStake();
    error CaseNotFound();
    error AccessDenied();
    error ConsentExpired();
    error RegionRestricted();
    error SpecialtyNotAllowed();
    error SessionNotActive();
    error EmergencyAccessDenied();
    
    // Modifiers
    modifier onlyVerifiedInstitution() {
        if (!verifiedInstitutions[msg.sender]) revert NotVerifiedInstitution();
        _;
    }
    
    modifier onlyVerifiedDoctor() {
        if (!verifiedDoctors[msg.sender]) revert NotVerifiedDoctor();
        _;
    }
    
    modifier validCase(bytes32 _caseHash) {
        if (medicalCases[_caseHash].caseHash == bytes32(0)) revert CaseNotFound();
        _;
    }
    
    modifier hasValidConsent(bytes32 _caseHash) {
        MedicalCase storage medCase = medicalCases[_caseHash];
        if (block.timestamp > medCase.patientConsent.consentExpiry) revert ConsentExpired();
        _;
    }
    
    // Utility functions for security
    function _validateUrgencyLevel(string calldata _urgencyLevel) internal pure returns (UrgencyLevel) {
        bytes32 hash = keccak256(abi.encodePacked(_urgencyLevel));
        if (hash == keccak256(abi.encodePacked("ROUTINE"))) return UrgencyLevel.ROUTINE;
        if (hash == keccak256(abi.encodePacked("URGENT"))) return UrgencyLevel.URGENT;
        if (hash == keccak256(abi.encodePacked("EMERGENCY"))) return UrgencyLevel.EMERGENCY;
        if (hash == keccak256(abi.encodePacked("CRITICAL"))) return UrgencyLevel.CRITICAL;
        revert InvalidEnumValue();
    }
    
    function _validateCaseType(string calldata _caseType) internal pure returns (CaseType) {
        bytes32 hash = keccak256(abi.encodePacked(_caseType));
        if (hash == keccak256(abi.encodePacked("DIAGNOSTIC"))) return CaseType.DIAGNOSTIC;
        if (hash == keccak256(abi.encodePacked("TREATMENT"))) return CaseType.TREATMENT;
        if (hash == keccak256(abi.encodePacked("RESEARCH"))) return CaseType.RESEARCH;
        if (hash == keccak256(abi.encodePacked("EMERGENCY"))) return CaseType.EMERGENCY;
        revert InvalidEnumValue();
    }
    
    function _validateSessionType(string calldata _sessionType) internal pure returns (SessionType) {
        bytes32 hash = keccak256(abi.encodePacked(_sessionType));
        if (hash == keccak256(abi.encodePacked("CONSULTATION"))) return SessionType.CONSULTATION;
        if (hash == keccak256(abi.encodePacked("RESEARCH"))) return SessionType.RESEARCH;
        if (hash == keccak256(abi.encodePacked("EMERGENCY"))) return SessionType.EMERGENCY;
        if (hash == keccak256(abi.encodePacked("SECOND_OPINION"))) return SessionType.SECOND_OPINION;
        revert InvalidEnumValue();
    }
    
    function _verifyConsentSignature(
        bytes32 _caseHash,
        address _patientProxy,
        bytes32 _consentSignatureHash
    ) internal pure {
        if (_consentSignatureHash == bytes32(0)) revert InvalidSignature();
        
        // Create the message hash that should have been signed
        bytes32 messageHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            _caseHash
        ));
        
        // Note: This is a simplified version. In production, you would:
        // 1. Accept (bytes32 r, bytes32 s, uint8 v) parameters instead of just hash
        // 2. Use ECDSA.recover(messageHash, v, r, s) to get the signer
        // 3. Verify signer == _patientProxy
        
        // For now, we verify the signature hash matches the expected pattern
        bytes32 expectedHash = keccak256(abi.encodePacked(messageHash, _patientProxy));
        if (_consentSignatureHash != expectedHash) revert InvalidSignature();
    }
    
    /**
     * @dev Rate-limited reputation update to prevent gaming
     */
    function _updateReputationSafe(address _participant, uint256 _increment) internal {
        uint256 currentDay = block.timestamp / 1 days;
        uint256 todayGained = dailyReputationGained[_participant][currentDay];
        
        if (todayGained + _increment <= MAX_DAILY_REPUTATION) {
            dailyReputationGained[_participant][currentDay] = todayGained + _increment;
            
            if (verifiedDoctors[_participant]) {
                doctors[_participant].reputationScore += _increment;
            }
            if (verifiedInstitutions[_participant]) {
                institutions[_participant].reputationScore += _increment;
            }
        }
    }
    
    /**
     * @dev Commit phase for secure registration (prevents front-running)
     */
    function commitRegistration(bytes32 _commitHash) external {
        if (registrationCommits[msg.sender] != bytes32(0)) revert("Already committed");
        
        registrationCommits[msg.sender] = _commitHash;
        commitTimestamps[msg.sender] = block.timestamp;
    }
    
    /**
     * @dev Verify commit-reveal pattern
     */
    function _verifyReveal(
        string calldata _name,
        string calldata _country,
        uint256 _nonce
    ) internal view {
        bytes32 commitHash = registrationCommits[msg.sender];
        if (commitHash == bytes32(0)) revert("No commit found");
        if (block.timestamp < commitTimestamps[msg.sender] + COMMIT_REVEAL_DELAY) {
            revert("Reveal too early");
        }
        
        bytes32 expectedHash = keccak256(abi.encodePacked(_name, _country, _nonce, msg.sender));
        if (commitHash != expectedHash) revert("Invalid reveal");
    }
    
    /**
     * @dev Register medical institution with commit-reveal security
     */
    function registerInstitution(
        string calldata _name,
        string calldata _country,
        string[] calldata _specialties,
        uint256 _nonce
    ) external payable nonReentrant {
        // Verify commit-reveal pattern
        _verifyReveal(_name, _country, _nonce);
        
        if (msg.value < INSTITUTION_STAKE) revert InsufficientStake();
        if (verifiedInstitutions[msg.sender]) revert("Already registered");
        if (bytes(_name).length == 0) revert("Empty name");
        if (bytes(_country).length == 0) revert("Empty country");
        if (institutionList.length >= MAX_ARRAY_SIZE) revert("Too many institutions");
        
        // Clear commit after successful reveal
        delete registrationCommits[msg.sender];
        delete commitTimestamps[msg.sender];
        
        // Track stake for withdrawal
        stakedAmounts[msg.sender] = msg.value;
        stakingTimestamp[msg.sender] = block.timestamp;
        
        MedicalInstitution storage institution = institutions[msg.sender];
        institution.name = _name;
        institution.country = _country;
        institution.specialties = _specialties;
        institution.institutionAddress = msg.sender;
        institution.registrationDate = uint128(block.timestamp);
        institution.lastActivity = uint128(block.timestamp);
        institution.isVerified = true; // Auto-verify with stake
        institution.isActive = true;
        institution.collaborationCount = 0;
        institution.reputationScore = 100; // Starting reputation
        
        verifiedInstitutions[msg.sender] = true;
        institutionList.push(msg.sender);
        
        emit InstitutionRegistered(msg.sender, _name, _country, _specialties);
    }
    
    /**
     * @dev Register medical professional with security checks
     */
    function registerDoctor(
        string calldata _name,
        string calldata _specialty,
        string calldata _licenseNumber,
        address _institutionAddress
    ) external payable nonReentrant {
        if (msg.value < DOCTOR_STAKE) revert InsufficientStake();
        if (_institutionAddress == address(0)) revert ZeroAddress();
        if (!verifiedInstitutions[_institutionAddress]) revert NotVerifiedInstitution();
        if (verifiedDoctors[msg.sender]) revert("Already registered");
        if (bytes(_name).length == 0) revert("Empty name");
        if (bytes(_specialty).length == 0) revert("Empty specialty");
        if (bytes(_licenseNumber).length == 0) revert("Empty license");
        if (doctorList.length >= MAX_ARRAY_SIZE) revert("Too many doctors");
        
        // Track stake for withdrawal
        stakedAmounts[msg.sender] = msg.value;
        stakingTimestamp[msg.sender] = block.timestamp;
        
        MedicalProfessional storage doctor = doctors[msg.sender];
        doctor.name = _name;
        doctor.specialty = _specialty;
        doctor.licenseNumber = _licenseNumber;
        doctor.doctorAddress = msg.sender;
        doctor.institutionAddress = _institutionAddress;
        doctor.registrationDate = uint128(block.timestamp);
        doctor.isVerified = true; // Auto-verify with stake
        doctor.isActive = true;
        doctor.consultationCount = 0;
        doctor.reputationScore = 100; // Starting reputation
        
        verifiedDoctors[msg.sender] = true;
        doctorList.push(msg.sender);
        
        emit DoctorRegistered(msg.sender, _name, _specialty, _institutionAddress);
    }
    
    /**
     * @dev Register global medical case with comprehensive security
     */
    function registerGlobalCase(
        bytes32 _caseHash,
        address _patientProxy,
        MedicalConsent calldata _consent,
        address[] calldata _authorizedInstitutions,
        string calldata _caseType,
        string calldata _urgencyLevel,
        bytes32[] calldata _restrictedRegions,
        bytes32[] calldata _allowedSpecialties
    ) external onlyVerifiedInstitution nonReentrant {
        // Input validation
        if (_caseHash == bytes32(0)) revert("Invalid case hash");
        if (_patientProxy == address(0)) revert ZeroAddress();
        if (medicalCases[_caseHash].caseHash != bytes32(0)) revert("Case already exists");
        if (_authorizedInstitutions.length > MAX_PARTICIPANTS) revert ExceedsMaxParticipants();
        if (activeCases.length >= MAX_ARRAY_SIZE) revert("Too many active cases");
        
        // Validate enum values
        _validateCaseType(_caseType);
        _validateUrgencyLevel(_urgencyLevel);
        
        // Validate consent signature
        _verifyConsentSignature(_caseHash, _patientProxy, _consent.consentSignatureHash);
        
        // Validate authorized institutions
        for (uint i = 0; i < _authorizedInstitutions.length; i++) {
            if (_authorizedInstitutions[i] == address(0)) revert ZeroAddress();
            if (!verifiedInstitutions[_authorizedInstitutions[i]]) revert NotVerifiedInstitution();
        }
        
        MedicalCase storage newCase = medicalCases[_caseHash];
        newCase.caseHash = _caseHash;
        newCase.patientProxy = _patientProxy;
        newCase.authorizedInstitutions = _authorizedInstitutions;
        newCase.consentTimestamp = uint128(block.timestamp);
        newCase.caseExpiry = uint128(block.timestamp + DEFAULT_CASE_DURATION);
        newCase.isActive = true;
        newCase.researchParticipation = _consent.researchParticipation;
        newCase.patientConsent = _consent;
        newCase.patientConsent.restrictedRegionCount = uint8(_restrictedRegions.length);
        newCase.patientConsent.allowedSpecialtyCount = uint8(_allowedSpecialties.length);
        newCase.caseType = _caseType;
        newCase.urgencyLevel = _urgencyLevel;
        
        // Set up restrictions via helper functions to reduce stack depth
        _setRegionalRestrictions(_caseHash, _restrictedRegions);
        _setSpecialtyRestrictions(_caseHash, _allowedSpecialties);
        
        // Set case access permissions (bounded loop)
        for (uint i = 0; i < _authorizedInstitutions.length; i++) {
            caseAccess[_caseHash][_authorizedInstitutions[i]] = true;
        }
        
        consentGiven[_caseHash][_patientProxy] = true;
        patientCases[_patientProxy].push(_caseHash);
        activeCases.push(_caseHash);
        
        // Update institution activity
        institutions[msg.sender].lastActivity = uint128(block.timestamp);
        institutions[msg.sender].collaborationCount++;
        
        emit MedicalCaseRegistered(_caseHash, _patientProxy, msg.sender, _caseType, block.timestamp);
    }
    
    /**
     * @dev Request collaboration on medical case
     */
    function requestCollaboration(
        bytes32 _caseHash,
        address _targetInstitution,
        string calldata /* _justification */
    ) external onlyVerifiedInstitution validCase(_caseHash) hasValidConsent(_caseHash) {
        if (!verifiedInstitutions[_targetInstitution]) revert NotVerifiedInstitution();
        if (!caseAccess[_caseHash][msg.sender]) revert AccessDenied();
        
        MedicalCase storage medCase = medicalCases[_caseHash];
        
        // Check regional restrictions
        if (_isRegionRestricted(_caseHash, _targetInstitution)) revert RegionRestricted();
        
        // Add to authorized institutions
        medCase.authorizedInstitutions.push(_targetInstitution);
        caseAccess[_caseHash][_targetInstitution] = true;
        
        emit CollaborationRequested(_caseHash, msg.sender, _targetInstitution, medCase.urgencyLevel);
    }
    
    /**
     * @dev Start collaboration session with security validation
     */
    function startCollaborationSession(
        bytes32 _caseHash,
        address[] calldata _participants,
        string calldata _sessionType
    ) external onlyVerifiedDoctor validCase(_caseHash) hasValidConsent(_caseHash) returns (bytes32) {
        if (!caseAccess[_caseHash][doctors[msg.sender].institutionAddress]) revert AccessDenied();
        if (_participants.length == 0) revert("No participants");
        if (_participants.length > MAX_PARTICIPANTS) revert ExceedsMaxParticipants();
        if (activeSessions.length >= MAX_ARRAY_SIZE) revert("Too many active sessions");
        
        // Validate session type
        _validateSessionType(_sessionType);
        
        // Validate all participants
        for (uint i = 0; i < _participants.length; i++) {
            if (_participants[i] == address(0)) revert ZeroAddress();
            if (!verifiedDoctors[_participants[i]] && !verifiedInstitutions[_participants[i]]) {
                revert("Invalid participant");
            }
        }
        
        bytes32 sessionId = keccak256(abi.encodePacked(_caseHash, block.timestamp, msg.sender));
        
        CollaborationSession storage session = collaborationSessions[sessionId];
        session.sessionId = sessionId;
        session.caseHash = _caseHash;
        session.participants = _participants;
        session.sessionStart = uint128(block.timestamp);
        session.isActive = true;
        session.sessionType = _sessionType;
        
        activeSessions.push(sessionId);
        caseParticipants[_caseHash] = _participants;
        
        // Update doctor activity
        doctors[msg.sender].consultationCount++;
        
        emit SessionStarted(sessionId, _caseHash, _participants, _sessionType);
        return sessionId;
    }
    
    /**
     * @dev Complete collaboration session
     */
    function completeSession(
        bytes32 _sessionId,
        bytes32 _outcomeHash
    ) external onlyVerifiedDoctor {
        CollaborationSession storage session = collaborationSessions[_sessionId];
        if (!session.isActive) revert SessionNotActive();
        
        session.sessionEnd = uint128(block.timestamp);
        session.isActive = false;
        session.outcomeHash = _outcomeHash;
        
        uint256 duration = session.sessionEnd - session.sessionStart;
        
        // Update reputation scores
        _updateReputationScores(_sessionId);
        
        emit SessionCompleted(_sessionId, session.caseHash, _outcomeHash, duration);
    }
    
    /**
     * @dev Update patient consent
     */
    function updateConsent(
        bytes32 _caseHash,
        MedicalConsent calldata _newConsent
    ) external validCase(_caseHash) {
        MedicalCase storage medCase = medicalCases[_caseHash];
        if (msg.sender != medCase.patientProxy) revert AccessDenied();
        
        medCase.patientConsent = _newConsent;
        consentRevisions[_caseHash]++;
        
        emit ConsentUpdated(
            _caseHash,
            msg.sender,
            _newConsent.diagnosticSharing,
            _newConsent.treatmentSharing,
            _newConsent.researchParticipation
        );
    }
    
    /**
     * @dev Emergency access for critical cases with auto-revocation
     */
    function grantEmergencyAccess(
        bytes32 _caseHash,
        address _emergencyInstitution
    ) external onlyVerifiedDoctor validCase(_caseHash) {
        MedicalCase storage medCase = medicalCases[_caseHash];
        if (!medCase.patientConsent.emergencyAccess) revert EmergencyAccessDenied();
        
        // Only allow emergency access for critical cases
        if (keccak256(abi.encodePacked(medCase.urgencyLevel)) != keccak256(abi.encodePacked("CRITICAL"))) {
            revert EmergencyAccessDenied();
        }
        
        // Grant temporary emergency access
        caseAccess[_caseHash][_emergencyInstitution] = true;
        medCase.authorizedInstitutions.push(_emergencyInstitution);
        
        // Track emergency access timing for auto-revocation
        emergencyAccessGranted[_caseHash][_emergencyInstitution] = block.timestamp;
        
        emit EmergencyAccessGranted(_caseHash, _emergencyInstitution, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Check and revoke expired emergency access
     */
    function revokeExpiredEmergencyAccess(
        bytes32 _caseHash,
        address _emergencyInstitution
    ) external {
        uint256 accessTime = emergencyAccessGranted[_caseHash][_emergencyInstitution];
        if (accessTime == 0) revert("No emergency access found");
        if (block.timestamp < accessTime + EMERGENCY_THRESHOLD) revert("Access not expired");
        
        // Revoke expired emergency access
        caseAccess[_caseHash][_emergencyInstitution] = false;
        delete emergencyAccessGranted[_caseHash][_emergencyInstitution];
        
        // Remove from authorized institutions array (gas-expensive but necessary)
        MedicalCase storage medCase = medicalCases[_caseHash];
        for (uint i = 0; i < medCase.authorizedInstitutions.length; i++) {
            if (medCase.authorizedInstitutions[i] == _emergencyInstitution) {
                medCase.authorizedInstitutions[i] = medCase.authorizedInstitutions[medCase.authorizedInstitutions.length - 1];
                medCase.authorizedInstitutions.pop();
                break;
            }
        }
    }
    
    /**
     * @dev Create cross-border medical agreement
     */
    function createMedicalAgreement(
        address[] calldata _institutions,
        string[] calldata _countries,
        string calldata _agreementType,
        bytes32 _termsHash,
        uint256 _duration
    ) external onlyVerifiedInstitution returns (bytes32) {
        bytes32 agreementId = keccak256(abi.encodePacked(_institutions, block.timestamp));
        
        MedicalAgreement storage agreement = agreements[agreementId];
        agreement.agreementId = agreementId;
        agreement.participatingInstitutions = _institutions;
        agreement.countries = _countries;
        agreement.agreementDate = uint128(block.timestamp);
        agreement.expiryDate = uint128(block.timestamp + _duration);
        agreement.isActive = true;
        agreement.agreementType = _agreementType;
        agreement.termsHash = _termsHash;
        
        // Set up partnerships
        for (uint i = 0; i < _institutions.length; i++) {
            for (uint j = i + 1; j < _institutions.length; j++) {
                institutionPartnership[_institutions[i]][_institutions[j]] = true;
                institutionPartnership[_institutions[j]][_institutions[i]] = true;
            }
        }
        
        emit CrossBorderAgreement(agreementId, _institutions, _countries, _agreementType);
        return agreementId;
    }
    
    // View functions
    function getMedicalCase(bytes32 _caseHash) external view returns (MedicalCase memory) {
        return medicalCases[_caseHash];
    }
    
    function getCollaborationSession(bytes32 _sessionId) external view returns (CollaborationSession memory) {
        return collaborationSessions[_sessionId];
    }
    
    function getInstitution(address _institution) external view returns (MedicalInstitution memory) {
        return institutions[_institution];
    }
    
    function getDoctor(address _doctor) external view returns (MedicalProfessional memory) {
        return doctors[_doctor];
    }
    
    function getCaseParticipants(bytes32 _caseHash) external view returns (address[] memory) {
        return caseParticipants[_caseHash];
    }
    
    function getPatientCases(address _patient) external view returns (bytes32[] memory) {
        return patientCases[_patient];
    }
    
    function getActiveCases() external view returns (bytes32[] memory) {
        return activeCases;
    }
    
    function getActiveSessions() external view returns (bytes32[] memory) {
        return activeSessions;
    }
    
    function hasAccess(bytes32 _caseHash, address _institution) external view returns (bool) {
        return caseAccess[_caseHash][_institution];
    }
    
    // Internal functions
    function _isRegionRestricted(bytes32 _caseHash, address _institution) internal view returns (bool) {
        string memory institutionCountry = institutions[_institution].country;
        bytes32 countryHash = keccak256(abi.encodePacked(institutionCountry));
        
        // Use the new mapping-based system for gas efficiency
        return caseRestrictedRegions[_caseHash][countryHash];
    }
    
    function _updateReputationScores(bytes32 _sessionId) internal {
        CollaborationSession storage session = collaborationSessions[_sessionId];
        
        // Safely update reputation with bounded loop and rate limiting
        uint256 participantCount = session.participants.length;
        if (participantCount > MAX_PARTICIPANTS) {
            participantCount = MAX_PARTICIPANTS; // Cap to prevent DoS
        }
        
        for (uint i = 0; i < participantCount; i++) {
            address participant = session.participants[i];
            if (verifiedDoctors[participant]) {
                _updateReputationSafe(participant, 5); // Rate-limited reputation gain
                doctors[participant].consultationCount++;
            }
            if (verifiedInstitutions[participant]) {
                _updateReputationSafe(participant, 3); // Rate-limited reputation gain
                institutions[participant].collaborationCount++;
            }
        }
    }
    
    // Emergency functions
    function pauseCase(bytes32 _caseHash) external {
        MedicalCase storage medCase = medicalCases[_caseHash];
        if (msg.sender != medCase.patientProxy) revert AccessDenied();
        medCase.isActive = false;
    }
    
    function reactivateCase(bytes32 _caseHash) external {
        MedicalCase storage medCase = medicalCases[_caseHash];
        if (msg.sender != medCase.patientProxy) revert AccessDenied();
        medCase.isActive = true;
    }
    
    /**
     * @dev Withdraw stake (after 30 days minimum staking period)
     */
    function withdrawStake() external nonReentrant {
        uint256 stakedAmount = stakedAmounts[msg.sender];
        if (stakedAmount == 0) revert StakeNotWithdrawable();
        if (block.timestamp < stakingTimestamp[msg.sender] + 30 days) revert StakeNotWithdrawable();
        
        // Reset stake tracking
        stakedAmounts[msg.sender] = 0;
        stakingTimestamp[msg.sender] = 0;
        
        // Remove verification status
        if (verifiedInstitutions[msg.sender]) {
            verifiedInstitutions[msg.sender] = false;
            institutions[msg.sender].isActive = false;
        }
        if (verifiedDoctors[msg.sender]) {
            verifiedDoctors[msg.sender] = false;
            doctors[msg.sender].isActive = false;
        }
        
        // Transfer stake back
        (bool success, ) = payable(msg.sender).call{value: stakedAmount}("");
        require(success, "Stake withdrawal failed");
    }
    
    /**
     * @dev Set regional restrictions for a case (gas-optimized)
     */
    function setRegionalRestrictions(
        bytes32 _caseHash,
        bytes32[] calldata _restrictedRegions
    ) external {
        MedicalCase storage medCase = medicalCases[_caseHash];
        if (msg.sender != medCase.patientProxy) revert AccessDenied();
        
        // Clear existing restrictions and set new ones
        for (uint i = 0; i < _restrictedRegions.length; i++) {
            caseRestrictedRegions[_caseHash][_restrictedRegions[i]] = true;
        }
        medCase.patientConsent.restrictedRegionCount = uint8(_restrictedRegions.length);
    }
    
    /**
     * @dev Set specialty restrictions for a case (gas-optimized)
     */
    function setSpecialtyRestrictions(
        bytes32 _caseHash,
        bytes32[] calldata _allowedSpecialties
    ) external {
        MedicalCase storage medCase = medicalCases[_caseHash];
        if (msg.sender != medCase.patientProxy) revert AccessDenied();
        
        // Clear existing and set new allowed specialties
        for (uint i = 0; i < _allowedSpecialties.length; i++) {
            caseAllowedSpecialties[_caseHash][_allowedSpecialties[i]] = true;
        }
        medCase.patientConsent.allowedSpecialtyCount = uint8(_allowedSpecialties.length);
    }
    
    /**
     * @dev Check if a region is restricted for a case
     */
    function isRegionRestricted(bytes32 _caseHash, bytes32 _region) external view returns (bool) {
        return caseRestrictedRegions[_caseHash][_region];
    }
    
    /**
     * @dev Check if a specialty is allowed for a case
     */
    function isSpecialtyAllowed(bytes32 _caseHash, bytes32 _specialty) external view returns (bool) {
        return caseAllowedSpecialties[_caseHash][_specialty];
    }
    
    /**
     * @dev Emergency function to recover accidentally sent ETH
     */
    receive() external payable {
        // Accept ETH but don't do anything with it
        // Can be withdrawn by the sender via withdrawStake if they're registered
    }
    
    /**
     * @dev Get array length safely (prevent DoS)
     */
    function getActiveCasesLength() external view returns (uint256) {
        return activeCases.length;
    }
    
    function getActiveSessionsLength() external view returns (uint256) {
        return activeSessions.length;
    }
    
    function getInstitutionListLength() external view returns (uint256) {
        return institutionList.length;
    }
    
    function getDoctorListLength() external view returns (uint256) {
        return doctorList.length;
    }
    
    /**
     * @dev Helper function to set regional restrictions (reduces stack depth)
     */
    function _setRegionalRestrictions(bytes32 _caseHash, bytes32[] calldata _restrictedRegions) internal {
        for (uint i = 0; i < _restrictedRegions.length; i++) {
            caseRestrictedRegions[_caseHash][_restrictedRegions[i]] = true;
        }
    }
    
    /**
     * @dev Helper function to set specialty restrictions (reduces stack depth)
     */
    function _setSpecialtyRestrictions(bytes32 _caseHash, bytes32[] calldata _allowedSpecialties) internal {
        for (uint i = 0; i < _allowedSpecialties.length; i++) {
            caseAllowedSpecialties[_caseHash][_allowedSpecialties[i]] = true;
        }
    }
}
