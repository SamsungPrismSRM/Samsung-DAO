// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {Governance} from "../src/Governance.sol";
import {SPUToken} from "../src/SPUToken.sol";
import {VotingEngine} from "../src/VotingEngine.sol";

contract GovernanceTest is Test {
    Governance public governance;
    SPUToken public spuToken;
    VotingEngine public votingEngine;

    address admin = address(this);
    address council = makeAddr("council");
    address member1 = makeAddr("member1");
    address member2 = makeAddr("member2");
    address poorUser = makeAddr("poorUser"); // has no SPU

    uint256 constant PROPOSAL_THRESHOLD = 100 * 10 ** 18;
    uint256 constant VOTE_AMOUNT = 200 * 10 ** 18;

    function setUp() public {
        // Deploy contracts
        spuToken = new SPUToken();
        governance = new Governance(address(0), admin, address(spuToken));
        votingEngine = new VotingEngine(address(spuToken), address(governance));

        // Grant council role
        governance.grantRole(governance.COUNCIL_ROLE(), council);

        // Grant oracle role to admin so we can mint SPU to test users
        spuToken.grantRole(spuToken.ORACLE_ROLE(), admin);
        spuToken.grantRole(spuToken.VALIDATOR_ROLE(), admin);

        // Give member1 and member2 enough SPU to propose and vote
        // We do this by transferring from deployer's initial mint
        spuToken.transfer(member1, VOTE_AMOUNT);
        spuToken.transfer(member2, VOTE_AMOUNT);

        // Set user regions (1 = region 1)
        vm.prank(council);
        governance.setUserRegion(member1, 1);

        vm.prank(council);
        governance.setUserRegion(member2, 1);
    }

    // ─── Proposal Creation ────────────────────────────────────────────────

    function test_CreateGlobalProposal() public {
        vm.prank(member1);
        governance.createProposal("Enable Dark Mode", Governance.Scope.GLOBAL, 0);

        (uint id, string memory title, , , , , , , , ) = governance.proposals(1);
        assertEq(id, 1);
        assertEq(title, "Enable Dark Mode");
        assertEq(governance.proposalCount(), 1);
    }

    function test_CreateLocalProposal() public {
        vm.prank(member1);
        governance.createProposal("Local Feature Request", Governance.Scope.LOCAL, 1);

        (uint id, , Governance.Scope scope, uint256 regionId, , , , , , ) = governance.proposals(1);
        assertEq(id, 1);
        assertEq(uint(scope), uint(Governance.Scope.LOCAL));
        assertEq(regionId, 1);
    }

    function test_RevertIf_BelowProposalThreshold() public {
        // poorUser has 0 SPU — should revert
        vm.prank(poorUser);
        vm.expectRevert("Below proposal threshold");
        governance.createProposal("Will Fail", Governance.Scope.GLOBAL, 0);
    }

    function test_RevertIf_GlobalProposalWithNonZeroRegion() public {
        vm.prank(member1);
        vm.expectRevert("GLOBAL must use region 0");
        governance.createProposal("Bad Global", Governance.Scope.GLOBAL, 1);
    }

    function test_RevertIf_LocalProposalWithZeroRegion() public {
        vm.prank(member1);
        vm.expectRevert("LOCAL requires region");
        governance.createProposal("Bad Local", Governance.Scope.LOCAL, 0);
    }

    function test_RevertIf_CrossRegionProposal() public {
        // member1 is in region 1, trying to create local proposal for region 2
        vm.prank(member1);
        vm.expectRevert("Cross-region proposal blocked");
        governance.createProposal("Wrong Region", Governance.Scope.LOCAL, 2);
    }

    // ─── Voting ───────────────────────────────────────────────────────────

    function test_VoteOnProposal() public {
        // Create proposal
        vm.prank(member1);
        governance.createProposal("Feature Vote", Governance.Scope.GLOBAL, 0);

        // Fast forward past review delay
        (, , , , uint startBlock, , , , , ) = governance.proposals(1);
        vm.roll(startBlock);

        // Vote
        vm.prank(member1);
        governance.vote(1, true);

        (, , , , , , uint256 forVotes, , , ) = governance.proposals(1);
        assertGt(forVotes, 0);
    }

    function test_RevertIf_VoteTwice() public {
        vm.prank(member1);
        governance.createProposal("Feature Vote", Governance.Scope.GLOBAL, 0);

        (, , , , uint startBlock, , , , , ) = governance.proposals(1);
        vm.roll(startBlock);

        vm.prank(member1);
        governance.vote(1, true);

        // Second vote should fail
        vm.prank(member1);
        vm.expectRevert("Already voted");
        governance.vote(1, true);
    }

    function test_RevertIf_VoteBeforeStart() public {
        vm.prank(member1);
        governance.createProposal("Early Vote", Governance.Scope.GLOBAL, 0);

        // Don't roll blocks — still in review delay
        vm.prank(member2);
        vm.expectRevert("Voting closed");
        governance.vote(1, true);
    }

    function test_RevertIf_VoteAfterEnd() public {
        vm.prank(member1);
        governance.createProposal("Late Vote", Governance.Scope.GLOBAL, 0);

        (, , , , , uint endBlock, , , , ) = governance.proposals(1);
        vm.roll(endBlock + 1);

        vm.prank(member2);
        vm.expectRevert("Voting closed");
        governance.vote(1, true);
    }

    function test_RevertIf_LocalVoteWrongRegion() public {
        // member1 is region 1, creates local proposal
        vm.prank(member1);
        governance.createProposal("Local Vote", Governance.Scope.LOCAL, 1);

        // Set member2 to a different region
        vm.prank(council);
        governance.setUserRegion(member2, 2);

        (, , , , uint startBlock, , , , , ) = governance.proposals(1);
        vm.roll(startBlock);

        vm.prank(member2);
        vm.expectRevert("Not allowed");
        governance.vote(1, true);
    }

    // ─── Execution ────────────────────────────────────────────────────────

    function test_ExecutePassedProposal() public {
        vm.prank(member1);
        governance.createProposal("Execute Me", Governance.Scope.GLOBAL, 0);

        (, , , , uint startBlock, uint endBlock, , , , ) = governance.proposals(1);
        vm.roll(startBlock);

        vm.prank(member1);
        governance.vote(1, true);

        vm.roll(endBlock + 1);

        vm.prank(council);
        governance.executeProposal(1);

        (, , , , , , , , bool executed, ) = governance.proposals(1);
        assertTrue(executed);
    }

    function test_RevertIf_ExecuteBeforeVotingEnds() public {
        vm.prank(member1);
        governance.createProposal("Too Early", Governance.Scope.GLOBAL, 0);

        (, , , , uint startBlock, , , , , ) = governance.proposals(1);
        vm.roll(startBlock);

        vm.prank(member1);
        governance.vote(1, true);

        // Still within voting period
        vm.prank(council);
        vm.expectRevert("Voting active");
        governance.executeProposal(1);
    }

    function test_RevertIf_ExecuteFailedProposal() public {
        vm.prank(member1);
        governance.createProposal("Will Fail", Governance.Scope.GLOBAL, 0);

        // Vote AGAINST
        (, , , , uint startBlock, uint endBlock, , , , ) = governance.proposals(1);
        vm.roll(startBlock);

        vm.prank(member1);
        governance.vote(1, false);

        vm.roll(endBlock + 1);

        vm.prank(council);
        vm.expectRevert();
        governance.executeProposal(1);
    }

    // ─── Cancellation ────────────────────────────────────────────────────

    function test_CancelProposal() public {
        vm.prank(member1);
        governance.createProposal("Cancel Me", Governance.Scope.GLOBAL, 0);

        vm.prank(council);
        governance.cancelProposal(1);

        (, , , , , , , , , bool canceled) = governance.proposals(1);
        assertTrue(canceled);
    }

    function test_RevertIf_CancelByNonCouncil() public {
        vm.prank(member1);
        governance.createProposal("Cancel Me", Governance.Scope.GLOBAL, 0);

        vm.prank(member2); // Not council
        vm.expectRevert();
        governance.cancelProposal(1);
    }

    function test_RevertIf_CancelAlreadyCanceled() public {
        vm.prank(member1);
        governance.createProposal("Cancel Me", Governance.Scope.GLOBAL, 0);

        vm.prank(council);
        governance.cancelProposal(1);

        vm.prank(council);
        vm.expectRevert("Invalid state");
        governance.cancelProposal(1);
    }

    // ─── Region Management ────────────────────────────────────────────────

    function test_SetUserRegion() public {
        address newUser = makeAddr("newUser");
        vm.prank(council);
        governance.setUserRegion(newUser, 2);
        assertEq(governance.userRegion(newUser), 2);
    }

    function test_RevertIf_InvalidRegion() public {
        address newUser = makeAddr("newUser");
        vm.prank(council);
        vm.expectRevert("Invalid region");
        governance.setUserRegion(newUser, 99);
    }
}
