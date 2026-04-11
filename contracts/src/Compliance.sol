// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Compliance {
    mapping(address => bool) public whitelisted;
    address public admin;

    constructor() {
        admin = msg.sender;
    }

    function addUser(address user) external {
        require(msg.sender == admin, "Not admin");
        whitelisted[user] = true;
    }

    modifier onlyWhitelisted() {
        require(whitelisted[msg.sender], "Not allowed");
        _;
    }
}
