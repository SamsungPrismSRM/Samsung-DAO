// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "openzeppelin-contracts/contracts/token/ERC20/extensions/ERC20Votes.sol";

interface IGovernance {
    function proposals(uint proposalId) external view returns (uint id, string memory title, uint startBlock, uint endBlock, bool executed, bool canceled);
}

interface ISPUToken {
    function getPastVotes(address account, uint256 blockNumber) external view returns (uint256);
    function getPastTotalSupply(uint256 blockNumber) external view returns (uint256);
    function lastMintBlock(address account) external view returns (uint256);
}

contract VotingEngine {
    struct Vote {
        uint forVotes;
        uint againstVotes;
        mapping(address => bool) voted;
    }

    mapping(uint => Vote) public votes;
    ISPUToken public spuToken;
    IGovernance public governance;

    uint public constant QUORUM_NUMERATOR = 10; // 10% Quorum required
    uint public constant QUORUM_DENOMINATOR = 100;
    uint public constant MINT_COOLDOWN = 100; // Explicit Voting Delay (Blocks)

    event VoteCast(address indexed voter, uint proposalId, bool support, uint weight);

    constructor(address _spuToken, address _governance) {
        spuToken = ISPUToken(_spuToken);
        governance = IGovernance(_governance);
    }

    function vote(uint proposalId, bool support) external {
        (, , uint startBlock, uint endBlock, bool executed, bool canceled) = governance.proposals(proposalId);
        
        require(!executed && !canceled, "Proposal inactive");
        require(block.number >= startBlock, "Review delay active");
        require(block.number <= endBlock, "Voting ended");
        
        Vote storage v = votes[proposalId];
        require(!v.voted[msg.sender], "Already voted");
        require(block.number >= spuToken.lastMintBlock(msg.sender) + MINT_COOLDOWN, "Mint cooldown active");

        uint weight = spuToken.getPastVotes(msg.sender, startBlock);
        require(weight > 0, "No voting power");

        v.voted[msg.sender] = true;

        if (support) v.forVotes += weight;
        else v.againstVotes += weight;

        emit VoteCast(msg.sender, proposalId, support, weight);
    }

    function result(uint proposalId) external view returns (uint, uint) {
        return (votes[proposalId].forVotes, votes[proposalId].againstVotes);
    }

    function isPassed(uint proposalId) external view returns (bool) {
        (, , uint startBlock, uint endBlock, , ) = governance.proposals(proposalId);
        require(block.number > endBlock, "Voting active");

        uint f = votes[proposalId].forVotes;
        uint a = votes[proposalId].againstVotes;
        
        uint totalVotes = f + a;
        uint quorum = (spuToken.getPastTotalSupply(startBlock) * QUORUM_NUMERATOR) / QUORUM_DENOMINATOR;
        
        return (totalVotes >= quorum) && (f > a);
    }
}
