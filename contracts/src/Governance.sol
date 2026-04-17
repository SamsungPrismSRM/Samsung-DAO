// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "openzeppelin-contracts/contracts/access/AccessControl.sol";
import "openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

interface IVoting {
    function isPassed(uint proposalId) external view returns (bool);
}

contract Governance is AccessControl, ReentrancyGuard {
    bytes32 public constant COUNCIL_ROLE = keccak256("COUNCIL_ROLE");
    enum Scope { LOCAL, GLOBAL }
    
    struct Proposal {
        uint id;
        string title;
        Scope scope;
        uint256 regionId; // 0 for GLOBAL
        uint startBlock;
        uint endBlock;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
        bool canceled;
    }

    uint public proposalCount;
    mapping(uint => Proposal) public proposals;

    address public voting;
    address public timelock;
    IERC20 public spuToken;
    mapping(address => uint256) public userRegion;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    uint public proposalThreshold = 100 * 10**18; // 100 SPU required to propose
    uint public reviewDelay = 100; // Blocks until voting snapshot begins
    uint public votingPeriod = 5760; // Blocks for voting

    event ProposalCreated(uint proposalId, Scope scope, uint256 regionId);
    event VoteCast(uint proposalId, address voter, bool support, uint256 weight);
    event ProposalExecuted(uint proposalId);
    event ProposalCanceled(uint proposalId);

    constructor(address _voting, address _timelock, address _spuToken) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(COUNCIL_ROLE, msg.sender);
        voting = _voting;
        timelock = _timelock;
        spuToken = IERC20(_spuToken);
    }

    function setUserRegion(address user, uint256 regionId) external onlyRole(COUNCIL_ROLE) {
        require(regionId <= 3, "Invalid region");
        userRegion[user] = regionId;
    }

    function createProposal(string memory title, Scope scope, uint256 regionId) external nonReentrant {
        require(spuToken.balanceOf(msg.sender) >= proposalThreshold, "Below proposal threshold");
        if (scope == Scope.GLOBAL) {
            require(regionId == 0, "GLOBAL must use region 0");
        } else {
            require(regionId > 0, "LOCAL requires region");
            require(userRegion[msg.sender] == regionId, "Cross-region proposal blocked");
        }
        
        proposalCount++;
        uint start = block.number + reviewDelay;
        uint end = start + votingPeriod;

        proposals[proposalCount] = Proposal({
            id: proposalCount,
            title: title,
            scope: scope,
            regionId: regionId,
            startBlock: start,
            endBlock: end,
            forVotes: 0,
            againstVotes: 0,
            executed: false,
            canceled: false
        });

        emit ProposalCreated(proposalCount, scope, regionId);
    }

    function vote(uint proposalId, bool support) external nonReentrant {
        Proposal storage p = proposals[proposalId];
        require(p.id != 0, "Proposal not found");
        require(!p.executed && !p.canceled, "Invalid state");
        require(block.number >= p.startBlock && block.number <= p.endBlock, "Voting closed");
        require(!hasVoted[proposalId][msg.sender], "Already voted");
        if (p.scope == Scope.LOCAL) {
            require(userRegion[msg.sender] == p.regionId, "Not allowed");
        }

        hasVoted[proposalId][msg.sender] = true;
        uint256 weight = spuToken.balanceOf(msg.sender);
        require(weight > 0, "No voting weight");
        if (support) {
            p.forVotes += weight;
        } else {
            p.againstVotes += weight;
        }

        emit VoteCast(proposalId, msg.sender, support, weight);
    }

    function executeProposal(uint proposalId) external onlyRole(COUNCIL_ROLE) nonReentrant {
        Proposal storage p = proposals[proposalId];
        require(!p.executed && !p.canceled, "Invalid state");
        require(block.number > p.endBlock, "Voting active");
        require(p.forVotes > p.againstVotes || IVoting(voting).isPassed(proposalId), "Proposal failed to pass/quorum");
        
        p.executed = true;
        
        // HTS treasury transfer executed strictly safely off-chain via DFNS 
        // after this is emitted mirroring actual execute state.
        
        emit ProposalExecuted(proposalId);
    }

    function cancelProposal(uint proposalId) external onlyRole(COUNCIL_ROLE) {
        Proposal storage p = proposals[proposalId];
        require(!p.executed && !p.canceled, "Invalid state");
        p.canceled = true;
        emit ProposalCanceled(proposalId);
    }
}
