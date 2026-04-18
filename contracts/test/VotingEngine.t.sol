// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {VotingEngine} from "../src/VotingEngine.sol";
import {SPUToken} from "../src/SPUToken.sol";

// ─── NOTE ─────────────────────────────────────────────────────────────────────
// VotingEngine's IGovernance interface declares proposals() as returning 6 fields:
//   (id, title, startBlock, endBlock, executed, canceled)
// But Governance's actual public mapping getter returns 10 fields (includes scope,
// regionId, forVotes, againstVotes). This ABI mismatch causes integration tests
// to revert. Fix: use MockGovernance matching VotingEngine's IGovernance exactly.
// ─────────────────────────────────────────────────────────────────────────────

contract MockGovernance {
    struct ProposalData {
        uint id;
        string title;
        uint startBlock;
        uint endBlock;
        bool executed;
        bool canceled;
    }

    mapping(uint => ProposalData) private _proposals;
    uint public count;

    function createProposal(uint startBlock, uint endBlock) external returns (uint) {
        count++;
        _proposals[count] = ProposalData({
            id: count,
            title: "Mock Proposal",
            startBlock: startBlock,
            endBlock: endBlock,
            executed: false,
            canceled: false
        });
        return count;
    }

    function cancelProposal(uint id) external { _proposals[id].canceled = true; }
    function executeProposal(uint id) external { _proposals[id].executed = true; }

    function proposals(uint proposalId)
        external view
        returns (uint id, string memory title, uint startBlock, uint endBlock, bool executed, bool canceled)
    {
        ProposalData storage p = _proposals[proposalId];
        return (p.id, p.title, p.startBlock, p.endBlock, p.executed, p.canceled);
    }
}

contract VotingEngineTest is Test {
    SPUToken public spuToken;
    MockGovernance public mockGov;
    VotingEngine public votingEngine;

    address admin = address(this);
    address voter1 = makeAddr("voter1");
    address voter2 = makeAddr("voter2");
    address voter3 = makeAddr("voter3");

    uint256 constant TOKEN_AMOUNT = 500 * 10 ** 18;
    // MINT_COOLDOWN in VotingEngine is 100 blocks
    uint256 constant MINT_COOLDOWN = 100;

    function setUp() public {
        // Start at a high block number so we never underflow when subtracting cooldown offsets
        vm.roll(1000);

        spuToken = new SPUToken();
        mockGov = new MockGovernance();
        votingEngine = new VotingEngine(address(spuToken), address(mockGov));

        // Distribute tokens — lastMintBlock stays 0 because transfer() doesn't set it
        spuToken.transfer(voter1, TOKEN_AMOUNT);
        spuToken.transfer(voter2, TOKEN_AMOUNT);
        spuToken.transfer(voter3, TOKEN_AMOUNT);

        // ERC20Votes: must self-delegate to checkpoint voting power
        vm.prank(voter1); spuToken.delegate(voter1);
        vm.prank(voter2); spuToken.delegate(voter2);
        vm.prank(voter3); spuToken.delegate(voter3);

        // Roll forward past the cooldown window so voters can vote freely
        // (lastMintBlock[voters] = 0, cooldown = 100, current block must be >= 100)
        vm.roll(1200);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────

    /// Creates a proposal with voting starting 10 blocks from now, lasting 100 blocks
    function _makeProposal() internal returns (uint id, uint startBlock, uint endBlock) {
        startBlock = block.number + 10;
        endBlock = startBlock + 100;
        id = mockGov.createProposal(startBlock, endBlock);
    }

    function _rollToVoting(uint startBlock) internal {
        vm.roll(startBlock + 1);
    }

    // ─── Vote Casting ─────────────────────────────────────────────────────

    function test_CastVoteFor() public {
        (uint id, uint startBlock, ) = _makeProposal();
        _rollToVoting(startBlock);

        vm.prank(voter1);
        votingEngine.vote(id, true);

        (uint forVotes, uint againstVotes) = votingEngine.result(id);
        assertGt(forVotes, 0);
        assertEq(againstVotes, 0);
    }

    function test_CastVoteAgainst() public {
        (uint id, uint startBlock, ) = _makeProposal();
        _rollToVoting(startBlock);

        vm.prank(voter1);
        votingEngine.vote(id, false);

        (uint forVotes, uint againstVotes) = votingEngine.result(id);
        assertEq(forVotes, 0);
        assertGt(againstVotes, 0);
    }

    function test_MultipleVoters() public {
        (uint id, uint startBlock, ) = _makeProposal();
        _rollToVoting(startBlock);

        vm.prank(voter1); votingEngine.vote(id, true);
        vm.prank(voter2); votingEngine.vote(id, true);
        vm.prank(voter3); votingEngine.vote(id, false);

        (uint forVotes, uint againstVotes) = votingEngine.result(id);
        assertGt(forVotes, againstVotes);
    }

    function test_RevertIf_VoteTwice() public {
        (uint id, uint startBlock, ) = _makeProposal();
        _rollToVoting(startBlock);

        vm.prank(voter1); votingEngine.vote(id, true);

        vm.prank(voter1);
        vm.expectRevert("Already voted");
        votingEngine.vote(id, true);
    }

    function test_RevertIf_VoteDuringReviewDelay() public {
        (uint id, , ) = _makeProposal();
        // Do NOT roll — still inside review delay

        vm.prank(voter1);
        vm.expectRevert("Review delay active");
        votingEngine.vote(id, true);
    }

    function test_RevertIf_VoteAfterVotingPeriod() public {
        (uint id, , uint endBlock) = _makeProposal();
        vm.roll(endBlock + 1);

        vm.prank(voter1);
        vm.expectRevert("Voting ended");
        votingEngine.vote(id, true);
    }

    function test_RevertIf_VoteOnCanceledProposal() public {
        (uint id, uint startBlock, ) = _makeProposal();
        mockGov.cancelProposal(id);
        _rollToVoting(startBlock);

        vm.prank(voter1);
        vm.expectRevert("Proposal inactive");
        votingEngine.vote(id, true);
    }

    function test_RevertIf_VoteOnExecutedProposal() public {
        (uint id, uint startBlock, ) = _makeProposal();
        mockGov.executeProposal(id);
        _rollToVoting(startBlock);

        vm.prank(voter1);
        vm.expectRevert("Proposal inactive");
        votingEngine.vote(id, true);
    }

    // ─── Mint Cooldown Protection ─────────────────────────────────────────

    function test_RevertIf_MintCooldownNotOver() public {
        spuToken.grantRole(spuToken.ORACLE_ROLE(), admin);

        // Create proposal — starts 10 blocks from now (block 1210)
        (uint id, uint startBlock, ) = _makeProposal();

        // Mint to voter1 just 50 blocks before startBlock
        // lastMintBlock[voter1] = startBlock - 50
        // at voting time (startBlock + 1), elapsed = 51 blocks < cooldown 100 → should revert
        vm.roll(startBlock - 50);
        vm.prank(admin);
        spuToken.proposeSync(voter1, 10 * 10 ** 18, true, 0); // auto-approved, sets lastMintBlock

        _rollToVoting(startBlock);

        vm.prank(voter1);
        vm.expectRevert("Mint cooldown active");
        votingEngine.vote(id, true);
    }

    function test_VoteSucceeds_AfterMintCooldownElapsed() public {
        spuToken.grantRole(spuToken.ORACLE_ROLE(), admin);

        // Create proposal
        (uint id, uint startBlock, ) = _makeProposal();

        // Mint to voter1 200 blocks before startBlock — well past the 100-block cooldown
        vm.roll(startBlock - 200);
        vm.prank(admin);
        spuToken.proposeSync(voter1, 10 * 10 ** 18, true, 0);

        // Roll to voting — elapsed = 201 blocks > 100 cooldown ✓
        _rollToVoting(startBlock);

        vm.prank(voter1);
        votingEngine.vote(id, true);

        (uint forVotes, ) = votingEngine.result(id);
        assertGt(forVotes, 0);
    }

    // ─── isPassed / Quorum ────────────────────────────────────────────────

    function test_IsPassed_False_WhenQuorumNotMet() public {
        (uint id, uint startBlock, uint endBlock) = _makeProposal();
        _rollToVoting(startBlock);

        // voter1 has 500 SPU; total supply ~1M; quorum = 10% = 100k → not met
        vm.prank(voter1);
        votingEngine.vote(id, true);

        vm.roll(endBlock + 1);
        assertFalse(votingEngine.isPassed(id));
    }

    function test_IsPassed_True_WhenQuorumMet() public {
        // Need >100k SPU voting to meet 10% quorum of ~1M total supply
        uint256 bigAmount = 40_000 * 10 ** 18;
        spuToken.transfer(voter1, bigAmount);
        spuToken.transfer(voter2, bigAmount);
        spuToken.transfer(voter3, bigAmount);

        // Re-delegate to checkpoint the new balances
        vm.prank(voter1); spuToken.delegate(voter1);
        vm.prank(voter2); spuToken.delegate(voter2);
        vm.prank(voter3); spuToken.delegate(voter3);

        (uint id, uint startBlock, uint endBlock) = _makeProposal();
        _rollToVoting(startBlock);

        vm.prank(voter1); votingEngine.vote(id, true);
        vm.prank(voter2); votingEngine.vote(id, true);
        vm.prank(voter3); votingEngine.vote(id, true);

        vm.roll(endBlock + 1);
        assertTrue(votingEngine.isPassed(id));
    }

    function test_IsPassed_False_WhenAgainstWins() public {
        uint256 bigAmount = 40_000 * 10 ** 18;
        spuToken.transfer(voter1, bigAmount);
        spuToken.transfer(voter2, bigAmount);
        spuToken.transfer(voter3, bigAmount);
        vm.prank(voter1); spuToken.delegate(voter1);
        vm.prank(voter2); spuToken.delegate(voter2);
        vm.prank(voter3); spuToken.delegate(voter3);

        (uint id, uint startBlock, uint endBlock) = _makeProposal();
        _rollToVoting(startBlock);

        vm.prank(voter1); votingEngine.vote(id, false);
        vm.prank(voter2); votingEngine.vote(id, false);
        vm.prank(voter3); votingEngine.vote(id, true);

        vm.roll(endBlock + 1);
        assertFalse(votingEngine.isPassed(id));
    }

    function test_RevertIf_IsPassedWhileVotingActive() public {
        (uint id, uint startBlock, ) = _makeProposal();
        _rollToVoting(startBlock);

        vm.prank(voter1);
        votingEngine.vote(id, true);

        vm.expectRevert("Voting active");
        votingEngine.isPassed(id);
    }
}
