// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DelegationRegistry {
    mapping(address => address) public delegatedTo;

    function delegate(address to) external {
        delegatedTo[msg.sender] = to;
    }

    function revoke() external {
        delegatedTo[msg.sender] = address(0);
    }
}
