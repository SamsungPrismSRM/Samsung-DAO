// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Treasury {
    address public admin;

    constructor() {
        admin = msg.sender;
    }

    function executeTransfer(address to, uint amount) external {
        require(msg.sender == admin, "Not admin");
        
        // NOTE:
        // Real HTS transfers handled via Hedera SDK backend
        // This contract acts as approval layer only
    }
}
