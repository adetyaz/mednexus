---
sidebar_position: 3
---

import LoomVideo from '@site/src/components/LoomVideo';

# Smart Contract Architecture

## Live Mainnet Deployments

Watch these contracts being created live on 0G Chain mainnet:

<LoomVideo 
  videoId="9b671efeb2754b148e25a4e93cfb15f5"
  title="Clinical Trials Contract Creation on Mainnet"
/>

<LoomVideo 
  videoId="d401a266efd447288a3af679a243d96c"
  title="Research Collaboration Contract Creation on Mainnet"
/>

<LoomVideo 
  videoId="09b8b1c37f0a4664a5d492e4e5b10c49"
  title="Medical Institution Registration on Mainnet"
/>

## Deployed Contracts on 0G Chain Mainnet

### 📋 **Contract Addresses**

```
MedicalVerification:        0x2b83DDc5D0dd317D2A1e4adA44819b26CA54A652
MedicalCollaborationHub:    0xe3259D46d5A4F900B5f9D1289CBf9791D9cc8b59
ClinicalTrialHub:           0x55bA3CCf5Ac075D107e9F1843a5f3abea3C050a2
ResearchCollaborationHub:   0x035F1565aeeB03DF80Dfe65aeBF0d03Bec5bf696
MedicalIntelligenceINFT:    0xe3259D46d5A4F900B5f9D1289CBf9791D9cc8b59
```

## 🏥 **MedicalVerification Contract**

### **What It Does**

Creates a decentralized network for verifying medical institutions and healthcare professionals without relying on centralized authorities. Think of it as a "medical credential blockchain" where hospitals and medical boards can verify each other's legitimacy.

### **Core Purpose**

Solves the global problem of medical credential verification across borders. When a hospital in Nigeria wants to collaborate with one in Germany, how do they verify each other's credentials? MedicalVerification provides cryptographic proof of medical legitimacy.

### **0G Chain Integration**

- **Smart Contract Logic**: Handles verification workflows, staking mechanisms, and reputation scoring
- **Immutable Records**: All verification decisions permanently stored on 0G Chain
- **Gas Efficiency**: Optimized for high-volume medical institution onboarding

### **0G Storage Integration**

- **Credential Documents**: Encrypted medical licenses and certifications stored off-chain
- **Evidence Packages**: Supporting documentation for verification decisions
- **Audit Trails**: Complete verification history with tamper-proof storage

**Live Mainnet:**

```
0G Storage Hash 1: 0xe5024b735fe1995aa8215ae71673a0e1a027f6b3220309f603a9e588b9d3d62c
0G Storage Hash 2: 0x974f98de97debffd7ae2c09548f92924de9897b76025734f1d9d2a16d9e90366
```

### **0G Compute Integration**

- **Automated Verification**: AI-powered analysis of medical credentials and documents
- **Risk Assessment**: ML models for detecting fraudulent medical institutions
- **Pattern Recognition**: Identifying verification patterns across global medical networks

### **Key Features**

- **Institution Registration**: Hospitals register with cryptographic credential hashes
- **Verifier Network**: Medical authorities stake tokens to become verifiers
- **Reputation System**: Track successful verifications and reputation scores
- **Pure Decentralization**: No governance backdoors or centralized control points

### **Core Functions**

```solidity
// Register medical institution
function registerInstitution(
    string calldata _name,
    string calldata _country,
    bytes32 _credentialHash
) external payable

// Register as medical verifier
function registerVerifier(
    string calldata _name,
    string calldata _region,
    bytes32 _credentialHash
) external payable

// Verify institution credentials
function verifyInstitution(
    address _institution,
    bool _approved,
    bytes32 _evidenceHash
) external

// Get contract statistics
function getContractStats() external view returns (
    uint256 totalInstitutions,
    uint256 totalVerifiers,
    uint256 verifiedInstitutionsCount,
    uint256 totalStaked
)
```

### **Data Structures**

```solidity
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
```

## 🤝 **MedicalCollaborationHub Contract**

### **What It Does**

Orchestrates global medical collaboration by connecting verified doctors and institutions for cross-border patient care. This is the "collaboration engine" that enables a doctor in New York to instantly consult with specialists in Tokyo about a rare case.

### **Core Purpose**

Breaks down the barriers that prevent global medical collaboration. Traditionally, international medical consultation involves months of bureaucracy, legal paperwork, and credential verification. MedicalCollaborationHub reduces this to minutes through automated smart contract workflows.

### **0G Chain Integration**

- **Identity Management**: Secure doctor and institution identity verification on-chain
- **Consent Workflows**: Patient consent management with granular permissions
- **Payment Escrow**: Automated payment distribution for international consultations
- **Reputation Tracking**: Cross-border medical collaboration reputation system

### **0G Storage Integration**

- **Medical Cases**: Encrypted patient data with granular access controls
- **Consultation Records**: Secure storage of cross-border medical consultations
- **Agreement Documents**: International medical collaboration agreements and contracts
- **Consent Artifacts**: Immutable patient consent records with audit trails

### **0G Compute Integration** (Active Development)

- **Case Matching**: AI-powered matching of patient cases with relevant global specialists
- **Language Translation**: Medical translation preserving clinical accuracy
- **Risk Assessment**: Automated evaluation of cross-border collaboration risks
- **Outcome Analysis**: ML analysis of collaboration outcomes for continuous improvement

### **Key Features**

- **Doctor Registration**: Medical professionals register with institutional backing and staking
- **Staking Mechanism**: 0.0005 0G economic security for doctor registration
- **Cross-Border Agreements**: Automated international medical collaboration frameworks
- **Medical Case Management**: Secure patient case sharing with granular consent controls

### **Core Functions**

```solidity
// Register medical institution
function registerInstitution(
    string calldata _name,
    string calldata _country,
    string[] calldata _specialties
) external payable

// Register doctor with institution backing
function registerDoctor(
    string calldata _name,
    string calldata _specialty,
    string calldata _licenseNumber,
    address _institutionAddress
) external payable

// Create cross-border medical agreement
function createMedicalAgreement(
    address[] calldata _institutions,
    string[] calldata _countries,
    string calldata _agreementType,
    bytes32 _termsHash,
    uint256 _duration
) external returns (bytes32)

// Register medical case with consent
function registerMedicalCase(
    bytes32 _caseHash,
    address _patientProxy,
    MedicalConsent calldata _consent,
    address[] calldata _authorizedInstitutions
) external
```

### **Data Structures**

```solidity
struct MedicalInstitution {
    string name;
    string country;
    string[] specialties;
    address institutionAddress;
    uint128 registrationDate;
    uint128 lastActivity;
    bool isVerified;
    bool isActive;
    uint256 collaborationCount;
    uint256 reputationScore;
}

struct MedicalProfessional {
    string name;
    string specialty;
    string licenseNumber;
    address doctorAddress;
    address institutionAddress;
    uint128 registrationDate;
    bool isVerified;
    bool isActive;
    uint256 consultationCount;
    uint256 reputationScore;
}

struct MedicalConsent {
    bool diagnosticSharing;
    bool treatmentSharing;
    bool researchParticipation;
    bool globalConsultation;
    bool emergencyAccess;
    uint128 consentExpiry;
    string[] restrictedRegions;
    string consentLevel;
}
```

## 🧬 **ClinicalTrialHub Contract**

### **What It Does**

Manages multi-institutional clinical trials through automated smart contract coordination. Imagine coordinating a drug trial across 50 hospitals in 10 countries - ClinicalTrialHub handles participant enrollment, protocol compliance, and outcome tracking automatically.

### **Core Purpose**

Solves the massive coordination challenges in clinical research. Traditional clinical trials involve months of legal agreements, manual participant tracking, and complex data aggregation across institutions. This contract automates the entire process while maintaining data integrity and regulatory compliance.

### **0G Chain Integration**

- **Protocol Management**: Immutable clinical trial protocols and amendments
- **Participant Consent**: Blockchain-based informed consent with audit trails
- **Milestone Tracking**: Automated trial phase progression and checkpoint validation
- **Regulatory Compliance**: Built-in compliance monitoring for international trial regulations

### **0G Storage Integration**

- **Trial Data**: Encrypted participant data with institutional access controls
- **Protocol Documents**: Complete trial protocols, amendments, and regulatory approvals
- **Outcome Datasets**: Secure storage of trial results and statistical analyses
- **Audit Documentation**: Comprehensive audit trails for regulatory inspection

### **0G Compute Integration**

- **Participant Matching**: AI-powered patient recruitment across global populations
- **Statistical Analysis**: Automated statistical analysis of trial outcomes
- **Safety Monitoring**: Real-time analysis of adverse events and safety signals
- **Protocol Optimization**: ML-driven optimization of trial design and endpoints

### **Key Features**

- **Trial Registration**: Register clinical trials with immutable protocol details
- **Participant Management**: Automated enrollment and tracking across institutions
- **Multi-Institutional Coordination**: Seamless cross-border research collaboration
- **Outcome Tracking**: Immutable trial results with cryptographic data integrity

## 🔬 **ResearchCollaborationHub Contract**

### **What It Does**

Facilitates collaborative medical research between institutions by automating partnership agreements, data sharing protocols, and intellectual property management. Think of it as "GitHub for medical research" but with legal frameworks and economic incentives built-in.

### **Core Purpose**

Eliminates the friction in multi-institutional medical research collaboration. Currently, setting up a research partnership between hospitals involves months of legal negotiations, complex data sharing agreements, and unclear IP ownership. This contract automates these processes while ensuring fair collaboration.

### **0G Chain Integration**

- **Research Agreements**: Smart contract-based partnership agreements between institutions
- **IP Management**: Automated intellectual property tracking and revenue distribution
- **Milestone Payments**: Automated funding distribution based on research progress
- **Publication Rights**: Transparent co-authorship and citation tracking

### **0G Storage Integration**

- **Research Datasets**: Encrypted collaborative research data with controlled access
- **Publication Drafts**: Version-controlled collaborative research manuscripts
- **Agreement Documents**: Complete research partnership agreements and amendments
- **Outcome Archives**: Long-term preservation of research outputs and supporting data

### **0G Compute Integration**

- **Research Matching**: AI-powered matching of complementary research interests
- **Collaboration Analytics**: Analysis of successful research partnership patterns
- **Impact Assessment**: ML analysis of research collaboration outcomes
- **Resource Optimization**: Optimal allocation of research resources across institutions

### **Key Features**

- **Research Project Creation**: Define and manage collaborative research initiatives
- **Institutional Partnerships**: Automated partnership agreements between research institutions
- **Data Sharing Agreements**: Secure, compliant research data collaboration protocols
- **Publication Management**: Transparent tracking of research outputs, citations, and impact

## 🎓 **MedicalIntelligenceINFT Contract**

### **What It Does**

Creates the world's first marketplace for tokenized medical expertise through Medical Intelligence INFTs. These are not just digital collectibles - they're executable AI models containing actual medical knowledge that can diagnose, recommend treatments, and guide medical decisions.

### **Core Purpose**

Solves the problem of medical knowledge hoarding and creates liquid markets for medical expertise. Currently, a breakthrough diagnostic algorithm developed at Mayo Clinic stays at Mayo Clinic. With Medical Intelligence INFTs, this expertise becomes a tradeable digital asset that can benefit patients worldwide while compensating the creators.

### **0G Chain Integration**

- **INFT Minting**: ERC-7857 compliant tokenization of medical AI models
- **Ownership Transfer**: Secure transfer of both token ownership AND underlying medical intelligence
- **Usage Licensing**: Smart contract-based licensing of medical knowledge assets
- **Revenue Distribution**: Automated royalty payments to medical knowledge creators

### **0G Storage Integration**

- **AI Model Storage**: Encrypted medical AI models with secure metadata management
- **Training Data**: Anonymized medical datasets used for INFT training
- **Validation Records**: Complete validation and peer review documentation
- **Usage Analytics**: Comprehensive usage statistics and outcome tracking

### **0G Compute Integration** (Core Feature)

- **AI Model Execution**: Direct execution of Medical Intelligence INFTs for real medical cases
- **Continuous Learning**: AI models improve through usage while preserving privacy
- **Performance Analytics**: ML analysis of INFT effectiveness across different medical contexts
- **Model Optimization**: Automated improvement of medical intelligence based on outcomes

### **Key Features**

- **Medical INFT Creation**: Tokenize diagnostic protocols, treatment algorithms, and medical expertise
- **Validation System**: Comprehensive peer review and medical validation of tokenized knowledge
- **Usage Tracking**: Real-time monitoring of INFT utilization and clinical effectiveness
- **Revenue Distribution**: Automated royalty sharing for medical knowledge creators and validators

### **Core Functions**

```solidity
// Create medical intelligence NFT
function revealAndCreateMedicalINFT(
    string calldata name,
    string calldata specialty,
    bytes32 metadataHash,
    string calldata encryptedURI,
    bytes32 contentHash,
    uint256 nonce
) external returns (uint256)

// Use medical intelligence
function useMedicalIntelligence(uint256 tokenId) external payable

// Validate medical INFT
function validateMedicalINFT(uint256 tokenId) external

// Register as validator
function registerValidator(string calldata specialtyFocus) external payable
```

## 🔗 **Contract Interactions**

### **Cross-Contract Integration**

- **MedicalVerification** ↔ **MedicalCollaborationHub**: Institution verification status
- **MedicalCollaborationHub** ↔ **MedicalIntelligenceINFT**: Doctor verification for INFT creation
- **ClinicalTrialHub** ↔ **ResearchCollaborationHub**: Research coordination and trial management

### **Blockchain Integration**

- **Network**: 0G Chain Mainnet (Chain ID: 16661)
- **Gas Optimization**: Efficient struct packing and batch operations
- **Security**: ReentrancyGuard, ECDSA signatures, and stake-based verification
- **Upgradability**: Immutable contracts with no governance backdoors

## 📊 **Implementation Statistics**

- **Total Deployed Contracts**: 5
- **Deployment Block**: 326165
- **Total Contract Functions**: 50+ public functions
- **Security Features**: ReentrancyGuard, ECDSA verification, staking mechanisms
- **Gas Efficiency**: Optimized structs and batch operations
