// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TimelockController {
    uint public delay = 48 hours;

    mapping(bytes32 => uint) public queued;

    function queue(bytes32 txHash) external {
        queued[txHash] = block.timestamp + delay;
    }

    function execute(bytes32 txHash) external {
        require(block.timestamp >= queued[txHash], "Too early");
        // Execution logic goes here
    }
}
