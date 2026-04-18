// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {SPUToken} from "../src/SPUToken.sol";

contract SPUTokenTest is Test {
    SPUToken public token;

    address admin = address(this);
    address oracle = makeAddr("oracle");
    address validator = makeAddr("validator");
    address user1 = makeAddr("user1");
    address user2 = makeAddr("user2");
    address attacker = makeAddr("attacker");

    function setUp() public {
        token = new SPUToken();
        token.grantRole(token.ORACLE_ROLE(), oracle);
        token.grantRole(token.VALIDATOR_ROLE(), validator);
    }

    // ─── Basic Token Info ─────────────────────────────────────────────────

    function test_TokenNameAndSymbol() public view {
        assertEq(token.name(), "Samsung Participation Unit");
        assertEq(token.symbol(), "SPU");
    }

    function test_InitialSupplyMintedToDeployer() public view {
        assertEq(token.balanceOf(admin), 1_000_000 * 10 ** 18);
    }

    // ─── Oracle: proposeSync ──────────────────────────────────────────────

    function test_OracleProposeSync_AutoApproved_SmallAmount() public {
        // 100 SPU or less auto-approves
        uint256 delta = 50 * 10 ** 18;

        vm.prank(oracle);
        token.proposeSync(user1, delta, true, 0);

        // Should have been auto-approved and minted
        assertEq(token.balanceOf(user1), delta);
    }

    function test_OracleProposeSync_ManualApproval_LargeAmount() public {
        // First give admin a lot of supply so 1% cap is reasonable
        // total supply = 1_000_000 * 10^18, 1% = 10_000 * 10^18
        // delta above 100 SPU threshold but below 1% cap
        uint256 delta = 500 * 10 ** 18; // 500 SPU > 100 threshold → needs validator

        vm.prank(oracle);
        token.proposeSync(user1, delta, true, 0);

        // Should NOT be auto-minted yet
        assertEq(token.balanceOf(user1), 0);

        // Validator confirms
        vm.prank(validator);
        token.confirmSync(user1, 0);

        assertEq(token.balanceOf(user1), delta);
    }

    function test_RevertIf_OracleSyncStaleNonce() public {
        uint256 delta = 50 * 10 ** 18;

        vm.prank(oracle);
        token.proposeSync(user1, delta, true, 0);

        // Try to replay the same nonce
        vm.prank(oracle);
        vm.expectRevert("Stale Nonce / Replay Error");
        token.proposeSync(user1, delta, true, 0);
    }

    function test_RevertIf_NonOracleProposes() public {
        vm.prank(attacker);
        vm.expectRevert();
        token.proposeSync(user1, 50 * 10 ** 18, true, 0);
    }

    function test_RevertIf_ConfirmSyncAlreadyExecuted() public {
        uint256 delta = 50 * 10 ** 18; // auto-approved

        vm.prank(oracle);
        token.proposeSync(user1, delta, true, 0); // auto-executes

        vm.prank(validator);
        vm.expectRevert("Sync already executed");
        token.confirmSync(user1, 0);
    }

    // ─── Burn Sync ────────────────────────────────────────────────────────

    function test_OracleProposeSync_Burn() public {
        // First give user1 some tokens
        token.transfer(user1, 200 * 10 ** 18);

        // Propose a burn (isMint = false)
        uint256 burnAmount = 50 * 10 ** 18; // under auto-approve threshold
        vm.prank(oracle);
        token.proposeSync(user1, burnAmount, false, 0);

        assertEq(token.balanceOf(user1), 150 * 10 ** 18);
    }

    // ─── Circuit Breaker ──────────────────────────────────────────────────

    function test_CircuitBreaker_PausesTransfers() public {
        token.triggerCircuitBreaker("Emergency");

        vm.expectRevert();
        token.transfer(user1, 100);
    }

    function test_CircuitBreaker_RecoverUnpauses() public {
        token.triggerCircuitBreaker("Emergency");
        token.recoverCircuitBreaker();

        // Should work again
        token.transfer(user1, 100);
        assertEq(token.balanceOf(user1), 100);
    }

    function test_RevertIf_NonAdminTripsCircuitBreaker() public {
        vm.prank(attacker);
        vm.expectRevert();
        token.triggerCircuitBreaker("Hack attempt");
    }

    function test_RevertIf_OracleSyncWhenPaused() public {
        token.triggerCircuitBreaker("Paused");

        vm.prank(oracle);
        vm.expectRevert();
        token.proposeSync(user1, 50 * 10 ** 18, true, 0);
    }

    // ─── 1% Mint Cap ─────────────────────────────────────────────────────

    function test_RevertIf_MintExceedsOnePercentCap() public {
        // total supply = 1_000_000 * 10^18
        // 1% = 10_000 SPU
        // Trying to mint 15_000 SPU (above 1%) via confirmSync

        uint256 bigDelta = 15_000 * 10 ** 18; // above 1% of supply

        vm.prank(oracle);
        token.proposeSync(user1, bigDelta, true, 0); // won't auto-approve (>100 SPU)

        vm.prank(validator);
        vm.expectRevert("Violates 1% max mint constraint per tx");
        token.confirmSync(user1, 0);
    }

    // ─── lastMintBlock tracking ───────────────────────────────────────────

    function test_LastMintBlockUpdatedAfterMint() public {
        uint256 delta = 50 * 10 ** 18;
        vm.roll(500);

        vm.prank(oracle);
        token.proposeSync(user1, delta, true, 0);

        assertEq(token.lastMintBlock(user1), 500);
    }

    // ─── Fuzz Tests ───────────────────────────────────────────────────────

    /// @dev Fuzz: any delta <= autoApproveThreshold should auto-approve
    function testFuzz_AutoApproveSmallMint(uint256 delta) public {
        // Bound delta: must be > 0, <= 100 SPU, and <= 1% of total supply
        uint256 totalSupply = token.totalSupply();
        delta = bound(delta, 1, min(token.autoApproveThreshold(), totalSupply / 100));

        vm.prank(oracle);
        token.proposeSync(user1, delta, true, 0);

        assertEq(token.balanceOf(user1), delta);
    }

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}
