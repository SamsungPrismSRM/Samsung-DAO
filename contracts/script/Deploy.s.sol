// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {SPUToken} from "../src/SPUToken.sol";
import {VotingEngine} from "../src/VotingEngine.sol";
import {Governance} from "../src/Governance.sol";

contract Deploy is Script {
    function run() public {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        console.log("Deployer:", deployer);

        vm.startBroadcast(deployerKey);

        // 1. Deploy SPU Token (ERC20Votes)
        SPUToken spuToken = new SPUToken();
        console.log("Deployed SPUToken at:", address(spuToken));

        // 2. Deploy a placeholder timelock (deployer acts as timelock for now)
        address timelockAddr = deployer;
        console.log("Timelock (placeholder):", timelockAddr);

        // 3. Deploy Governance (needs voting address — use placeholder, update later)
        //    We deploy Governance first with a placeholder voting address,
        //    then deploy VotingEngine with the real Governance address.
        Governance governance = new Governance(
            address(0), // voting — will be set after VotingEngine deploys
            timelockAddr,
            address(spuToken)
        );
        console.log("Deployed Governance at:", address(governance));

        // 4. Deploy VotingEngine with SPUToken + Governance
        VotingEngine votingEngine = new VotingEngine(
            address(spuToken),
            address(governance)
        );
        console.log("Deployed VotingEngine at:", address(votingEngine));

        // 5. Grant ORACLE_ROLE on SPUToken to deployer (so oracle backend can propose syncs)
        spuToken.grantRole(spuToken.ORACLE_ROLE(), deployer);
        console.log("Granted ORACLE_ROLE to:", deployer);

        // 6. Grant VALIDATOR_ROLE on SPUToken to deployer (for confirmSync)
        spuToken.grantRole(spuToken.VALIDATOR_ROLE(), deployer);
        console.log("Granted VALIDATOR_ROLE to:", deployer);

        vm.stopBroadcast();

        console.log("========================================");
        console.log("DEPLOYMENT COMPLETE");
        console.log("========================================");
        console.log("SPUToken:      ", address(spuToken));
        console.log("Governance:    ", address(governance));
        console.log("VotingEngine:  ", address(votingEngine));
        console.log("Timelock:      ", timelockAddr);
        console.log("========================================");
    }
}
