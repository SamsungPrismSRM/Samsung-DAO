// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {DelegationRegistry} from "../src/DelegationRegistry.sol";

contract DelegationRegistryTest is Test {
    DelegationRegistry public registry;

    address user1 = makeAddr("user1");
    address user2 = makeAddr("user2");
    address delegate1 = makeAddr("delegate1");
    address delegate2 = makeAddr("delegate2");

    function setUp() public {
        registry = new DelegationRegistry();
    }

    function test_DelegateToAddress() public {
        vm.prank(user1);
        registry.delegate(delegate1);
        assertEq(registry.delegatedTo(user1), delegate1);
    }

    function test_RevokeDelegate() public {
        vm.prank(user1);
        registry.delegate(delegate1);

        vm.prank(user1);
        registry.revoke();

        assertEq(registry.delegatedTo(user1), address(0));
    }

    function test_ChangeDelegation() public {
        vm.prank(user1);
        registry.delegate(delegate1);
        assertEq(registry.delegatedTo(user1), delegate1);

        vm.prank(user1);
        registry.delegate(delegate2);
        assertEq(registry.delegatedTo(user1), delegate2);
    }

    function test_IndependentDelegations() public {
        vm.prank(user1);
        registry.delegate(delegate1);

        vm.prank(user2);
        registry.delegate(delegate2);

        assertEq(registry.delegatedTo(user1), delegate1);
        assertEq(registry.delegatedTo(user2), delegate2);
    }

    function test_RevokeWithoutDelegateIsNoop() public {
        vm.prank(user1);
        registry.revoke(); // Should not revert
        assertEq(registry.delegatedTo(user1), address(0));
    }

    function test_DefaultDelegationIsZeroAddress() public view {
        assertEq(registry.delegatedTo(user1), address(0));
    }

    /// @dev Fuzz: delegating always stores the correct address
    function testFuzz_DelegateStoresCorrectAddress(address delegatee) public {
        vm.prank(user1);
        registry.delegate(delegatee);
        assertEq(registry.delegatedTo(user1), delegatee);
    }
}
