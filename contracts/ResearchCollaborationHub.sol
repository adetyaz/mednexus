// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ResearchCollaborationHub - Simple Research Project Management
 * @dev Minimal research collaboration contract for 0G Chain
 */
contract ResearchCollaborationHub is ReentrancyGuard, Ownable {
    
    uint256 public constant PROJECT_FEE = 0.001 ether;
    
    enum ProjectStatus { ACTIVE, COMPLETED, SUSPENDED }
    
    struct ResearchProject {
        bytes32 id;
        string title;
        string description;
        address lead;
        ProjectStatus status;
        uint256 createdAt;
        bytes32 dataHash;
    }
    
    mapping(bytes32 => ResearchProject) public projects;
    mapping(address => bytes32[]) public userProjects;
    bytes32[] public allProjects;
    
    uint256 public totalProjects;
    uint256 public collectedFees;
    
    event ProjectCreated(bytes32 indexed projectId, string title, address indexed lead);
    event ProjectUpdated(bytes32 indexed projectId, ProjectStatus status);
    
    constructor() Ownable(msg.sender) {}
    
    function createProject(
        string calldata title,
        string calldata description,
        bytes32 dataHash
    ) external payable nonReentrant returns (bytes32 projectId) {
        require(msg.value >= PROJECT_FEE, "Insufficient fee");
        require(bytes(title).length > 0, "Title required");
        
        projectId = keccak256(abi.encodePacked(title, msg.sender, block.timestamp));
        
        projects[projectId] = ResearchProject({
            id: projectId,
            title: title,
            description: description,
            lead: msg.sender,
            status: ProjectStatus.ACTIVE,
            createdAt: block.timestamp,
            dataHash: dataHash
        });
        
        allProjects.push(projectId);
        userProjects[msg.sender].push(projectId);
        
        totalProjects++;
        collectedFees += msg.value;
        
        emit ProjectCreated(projectId, title, msg.sender);
        return projectId;
    }
    
    function updateProjectStatus(bytes32 projectId, ProjectStatus newStatus) external {
        require(projects[projectId].lead == msg.sender, "Not project lead");
        projects[projectId].status = newStatus;
        emit ProjectUpdated(projectId, newStatus);
    }
    
    function getProject(bytes32 projectId) external view returns (
        string memory title,
        string memory description,
        address lead,
        ProjectStatus status,
        uint256 createdAt
    ) {
        ResearchProject memory project = projects[projectId];
        return (project.title, project.description, project.lead, project.status, project.createdAt);
    }
    
    function getUserProjects(address user) external view returns (bytes32[] memory) {
        return userProjects[user];
    }
    
    function getAllProjects() external view returns (bytes32[] memory) {
        return allProjects;
    }
    
    function withdrawFees() external onlyOwner {
        uint256 amount = collectedFees;
        collectedFees = 0;
        payable(owner()).transfer(amount);
    }
}