// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ClinicalTrialHub - Simple Clinical Trial Management
 * @dev Minimal clinical trial contract for 0G Chain
 */
contract ClinicalTrialHub is ReentrancyGuard, Ownable {
    
    uint256 public constant TRIAL_FEE = 0.001 ether;
    
    enum TrialStatus { ACTIVE, COMPLETED, SUSPENDED }
    
    struct ClinicalTrial {
        bytes32 id;
        string title;
        string description;
        address sponsor;
        TrialStatus status;
        uint256 createdAt;
        bytes32 dataHash;
    }
    
    mapping(bytes32 => ClinicalTrial) public trials;
    mapping(address => bytes32[]) public userTrials;
    bytes32[] public allTrials;
    
    uint256 public totalTrials;
    uint256 public collectedFees;
    
    event TrialCreated(bytes32 indexed trialId, string title, address indexed sponsor);
    event TrialUpdated(bytes32 indexed trialId, TrialStatus status);
    
    constructor() Ownable(msg.sender) {}
    
    function createTrial(
        string calldata title,
        string calldata description,
        bytes32 dataHash
    ) external payable nonReentrant returns (bytes32 trialId) {
        require(msg.value >= TRIAL_FEE, "Insufficient fee");
        require(bytes(title).length > 0, "Title required");
        
        trialId = keccak256(abi.encodePacked(title, msg.sender, block.timestamp));
        
        trials[trialId] = ClinicalTrial({
            id: trialId,
            title: title,
            description: description,
            sponsor: msg.sender,
            status: TrialStatus.ACTIVE,
            createdAt: block.timestamp,
            dataHash: dataHash
        });
        
        allTrials.push(trialId);
        userTrials[msg.sender].push(trialId);
        
        totalTrials++;
        collectedFees += msg.value;
        
        emit TrialCreated(trialId, title, msg.sender);
        return trialId;
    }
    
    function updateTrialStatus(bytes32 trialId, TrialStatus newStatus) external {
        require(trials[trialId].sponsor == msg.sender, "Not trial sponsor");
        trials[trialId].status = newStatus;
        emit TrialUpdated(trialId, newStatus);
    }
    
    function getTrial(bytes32 trialId) external view returns (
        string memory title,
        string memory description,
        address sponsor,
        TrialStatus status,
        uint256 createdAt
    ) {
        ClinicalTrial memory trial = trials[trialId];
        return (trial.title, trial.description, trial.sponsor, trial.status, trial.createdAt);
    }
    
    function getUserTrials(address user) external view returns (bytes32[] memory) {
        return userTrials[user];
    }
    
    function getAllTrials() external view returns (bytes32[] memory) {
        return allTrials;
    }
    
    function withdrawFees() external onlyOwner {
        uint256 amount = collectedFees;
        collectedFees = 0;
        payable(owner()).transfer(amount);
    }
}