// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MedicalDataStorage - Secure Medical Data Management with 0G Storage
 * @dev Manages encrypted medical data storage with 0G Storage integration
 */
contract MedicalDataStorage is ReentrancyGuard, Ownable {
    
    struct MedicalData {
        bytes32 dataHash;           // Hash of encrypted medical data
        string storageUri;          // 0G Storage URI
        address institution;        // Hospital/institution that uploaded
        address patient;            // Patient (proxy) address
        uint256 timestamp;          // Upload timestamp
        bool isActive;              // Data availability status
        string[] authorizedUsers;   // Authorized medical professionals
        string dataType;            // Type of medical data (scan, record, etc.)
        string encryptionKey;       // Encrypted key for data access
    }
    
    struct PatientConsent {
        address patient;
        mapping(address => bool) authorizedInstitutions;
        mapping(string => bool) authorizedDataTypes;
        uint256 consentTimestamp;
        uint256 expiryTimestamp;
        bool isActive;
    }
    
    // Storage mappings
    mapping(bytes32 => MedicalData) public medicalRecords;
    mapping(address => PatientConsent) public patientConsents;
    mapping(address => bool) public verifiedInstitutions;
    mapping(address => string[]) public institutionDataHashes;
    mapping(address => string[]) public patientDataHashes;
    
    // Events
    event MedicalDataUploaded(
        bytes32 indexed dataHash,
        address indexed institution,
        address indexed patient,
        string dataType,
        string storageUri
    );
    
    event PatientConsentGranted(
        address indexed patient,
        address indexed institution,
        string[] dataTypes,
        uint256 expiryTimestamp
    );
    
    event PatientConsentRevoked(
        address indexed patient,
        address indexed institution
    );
    
    event DataAccessRequested(
        bytes32 indexed dataHash,
        address indexed requester,
        address indexed patient
    );
    
    // Modifiers
    modifier onlyVerifiedInstitution() {
        require(verifiedInstitutions[msg.sender], "Institution not verified");
        _;
    }
    
    modifier onlyAuthorizedAccess(bytes32 dataHash, address accessor) {
        MedicalData memory data = medicalRecords[dataHash];
        require(data.isActive, "Data not available");
        require(
            data.institution == accessor || 
            patientConsents[data.patient].authorizedInstitutions[accessor],
            "Access not authorized"
        );
        _;
    }
    
    constructor(address initialOwner) Ownable(initialOwner) {}
    
    /**
     * @dev Verify a medical institution
     */
    function verifyInstitution(address institution) external onlyOwner {
        verifiedInstitutions[institution] = true;
    }
    
    /**
     * @dev Remove verification from an institution
     */
    function revokeInstitutionVerification(address institution) external onlyOwner {
        verifiedInstitutions[institution] = false;
    }
    
    /**
     * @dev Upload encrypted medical data to 0G Storage
     */
    function uploadMedicalData(
        bytes32 dataHash,
        string memory storageUri,
        address patient,
        string memory dataType,
        string memory encryptedKey,
        string[] memory authorizedUsers
    ) external onlyVerifiedInstitution nonReentrant {
        require(bytes(storageUri).length > 0, "Storage URI required");
        require(patient != address(0), "Patient address required");
        require(bytes(dataType).length > 0, "Data type required");
        
        // Ensure patient has given consent for this data type
        require(
            patientConsents[patient].authorizedDataTypes[dataType] ||
            patientConsents[patient].authorizedInstitutions[msg.sender],
            "Patient consent required"
        );
        
        medicalRecords[dataHash] = MedicalData({
            dataHash: dataHash,
            storageUri: storageUri,
            institution: msg.sender,
            patient: patient,
            timestamp: block.timestamp,
            isActive: true,
            authorizedUsers: authorizedUsers,
            dataType: dataType,
            encryptionKey: encryptedKey
        });
        
        // Add to institution and patient indexes
        institutionDataHashes[msg.sender].push(string(abi.encodePacked(dataHash)));
        patientDataHashes[patient].push(string(abi.encodePacked(dataHash)));
        
        emit MedicalDataUploaded(dataHash, msg.sender, patient, dataType, storageUri);
    }
    
    /**
     * @dev Grant consent for medical data sharing
     */
    function grantConsent(
        address institution,
        string[] memory dataTypes,
        uint256 expiryTimestamp
    ) external {
        require(verifiedInstitutions[institution], "Institution not verified");
        require(expiryTimestamp > block.timestamp, "Expiry must be in future");
        
        PatientConsent storage consent = patientConsents[msg.sender];
        consent.patient = msg.sender;
        consent.authorizedInstitutions[institution] = true;
        consent.consentTimestamp = block.timestamp;
        consent.expiryTimestamp = expiryTimestamp;
        consent.isActive = true;
        
        // Authorize specific data types
        for (uint i = 0; i < dataTypes.length; i++) {
            consent.authorizedDataTypes[dataTypes[i]] = true;
        }
        
        emit PatientConsentGranted(msg.sender, institution, dataTypes, expiryTimestamp);
    }
    
    /**
     * @dev Revoke consent for medical data sharing
     */
    function revokeConsent(address institution) external {
        PatientConsent storage consent = patientConsents[msg.sender];
        consent.authorizedInstitutions[institution] = false;
        
        emit PatientConsentRevoked(msg.sender, institution);
    }
    
    /**
     * @dev Request access to medical data
     */
    function requestDataAccess(
        bytes32 dataHash
    ) external view onlyAuthorizedAccess(dataHash, msg.sender) returns (
        string memory storageUri,
        string memory encryptedKey,
        string memory dataType,
        uint256 timestamp
    ) {
        MedicalData memory data = medicalRecords[dataHash];
        return (data.storageUri, data.encryptionKey, data.dataType, data.timestamp);
    }
    
    /**
     * @dev Get medical data metadata (without sensitive info)
     */
    function getDataMetadata(bytes32 dataHash) external view returns (
        address institution,
        address patient,
        string memory dataType,
        uint256 timestamp,
        bool isActive
    ) {
        MedicalData memory data = medicalRecords[dataHash];
        return (data.institution, data.patient, data.dataType, data.timestamp, data.isActive);
    }
    
    /**
     * @dev Get all data hashes for an institution
     */
    function getInstitutionData(address institution) external view returns (string[] memory) {
        return institutionDataHashes[institution];
    }
    
    /**
     * @dev Get all data hashes for a patient
     */
    function getPatientData(address patient) external view returns (string[] memory) {
        return patientDataHashes[patient];
    }
    
    /**
     * @dev Check if patient has given consent to institution
     */
    function checkConsent(address patient, address institution) external view returns (bool) {
        PatientConsent storage consent = patientConsents[patient];
        return consent.isActive && 
               consent.authorizedInstitutions[institution] && 
               consent.expiryTimestamp > block.timestamp;
    }
    
    /**
     * @dev Emergency data deactivation (for compliance)
     */
    function deactivateData(bytes32 dataHash) external {
        MedicalData storage data = medicalRecords[dataHash];
        require(
            data.institution == msg.sender || data.patient == msg.sender || owner() == msg.sender,
            "Not authorized to deactivate"
        );
        data.isActive = false;
    }
}
