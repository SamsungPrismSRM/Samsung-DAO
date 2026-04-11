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
    
    struct Proposal {
        uint id;
        string title;
        uint startBlock;
        uint endBlock;
        bool executed;
        bool canceled;
    }

    uint public proposalCount;
    mapping(uint => Proposal) public proposals;

    address public voting;
    address public timelock;
    IERC20 public spuToken;

    uint public proposalThreshold = 100 * 10**18; // 100 SPU required to propose
    uint public reviewDelay = 100; // Blocks until voting snapshot begins
    uint public votingPeriod = 5760; // Blocks for voting

    event ProposalCreated(uint proposalId, string title, uint startBlock, uint endBlock);
    event ProposalExecuted(uint proposalId);
    event ProposalCanceled(uint proposalId);

    constructor(address _voting, address _timelock, address _spuToken) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(COUNCIL_ROLE, msg.sender);
        voting = _voting;
        timelock = _timelock;
        spuToken = IERC20(_spuToken);
    }

    function createProposal(string memory title) external nonReentrant {
        require(spuToken.balanceOf(msg.sender) >= proposalThreshold, "Below proposal threshold");
        
        proposalCount++;
        uint start = block.number + reviewDelay;
        uint end = start + votingPeriod;

        proposals[proposalCount] = Proposal({
            id: proposalCount,
            title: title,
            startBlock: start,
            endBlock: end,
            executed: false,
            canceled: false
        });

        emit ProposalCreated(proposalCount, title, start, end);
    }

    function executeProposal(uint proposalId) external onlyRole(COUNCIL_ROLE) nonReentrant {
        Proposal storage p = proposals[proposalId];
        require(!p.executed && !p.canceled, "Invalid state");
        require(block.number > p.endBlock, "Voting active");
        require(IVoting(voting).isPassed(proposalId), "Proposal failed to pass/quorum");
        
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
