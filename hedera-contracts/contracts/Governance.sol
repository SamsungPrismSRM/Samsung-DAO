// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IVotingEngine {
    function getProposalVotes(uint256 proposalId) external view returns (uint256 forVotes, uint256 againstVotes);
}

contract Governance {
    uint256 public proposalCount;
    
    struct Proposal {
        uint256 id;
        address proposer;
        string data; // Content JSON stringifed containing UI attributes
        bool executed;
    }
    
    mapping(uint256 => Proposal) public proposals;
    
    IVotingEngine public votingEngine;
    address public council; // Simulating DFNS Council / Timelock layer for MVP Execute Auth
    
    event ProposalCreated(uint256 indexed proposalId, address proposer, string data);
    event ProposalExecuted(uint256 indexed proposalId);
    
    modifier onlyCouncil() {
        require(msg.sender == council, "Governance: Only council can execute");
        _;
    }
    
    constructor(address _votingEngine, address _council) {
        votingEngine = IVotingEngine(_votingEngine);
        council = _council;
    }
    
    function createProposal(string memory data) external returns (uint256) {
        proposalCount++;
        proposals[proposalCount] = Proposal({
            id: proposalCount,
            proposer: msg.sender,
            data: data,
            executed: false
        });
        
        emit ProposalCreated(proposalCount, msg.sender, data);
        return proposalCount;
    }
    
    function executeProposal(uint256 proposalId) external onlyCouncil {
        Proposal storage p = proposals[proposalId];
        require(!p.executed, "Governance: metadata already executed");
        require(p.id != 0, "Governance: proposal not found");
        
        (uint256 forVotes, uint256 againstVotes) = votingEngine.getProposalVotes(proposalId);
        require(forVotes > againstVotes, "Governance: proposal did not pass quorum/votes");
        
        p.executed = true;
        
        emit ProposalExecuted(proposalId);
    }
    
    function getProposal(uint256 proposalId) external view returns (uint256 id, address proposer, string memory data, bool executed) {
        Proposal storage p = proposals[proposalId];
        return (p.id, p.proposer, p.data, p.executed);
    }
}
