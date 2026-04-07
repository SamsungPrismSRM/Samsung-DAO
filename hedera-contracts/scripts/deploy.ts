import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer ? deployer.address : "Default Hardhat Account");

  // 1. Deploy TimelockController
  const TimelockController = await ethers.getContractFactory("TimelockController");
  const timelock = await TimelockController.deploy();
  await timelock.waitForDeployment();
  console.log("TimelockController deployed to:", await timelock.getAddress());

  // 2. Deploy DelegationReg
  const DelegationReg = await ethers.getContractFactory("DelegationReg");
  const delegation = await DelegationReg.deploy();
  await delegation.waitForDeployment();
  const delegationAddress = await delegation.getAddress();
  console.log("DelegationReg deployed to:", delegationAddress);

  // 3. Deploy VotingEngine
  const VotingEngine = await ethers.getContractFactory("VotingEngine");
  const votingEngine = await VotingEngine.deploy(delegationAddress);
  await votingEngine.waitForDeployment();
  const votingEngineAddress = await votingEngine.getAddress();
  console.log("VotingEngine deployed to:", votingEngineAddress);

  // 4. Deploy Governance (Council is deployer for MVP)
  const councilAddress = deployer ? deployer.address : "0x0000000000000000000000000000000000000000"; // Fallback for local node
  const Governance = await ethers.getContractFactory("Governance");
  const governance = await Governance.deploy(votingEngineAddress, councilAddress);
  await governance.waitForDeployment();
  console.log("Governance deployed to:", await governance.getAddress());

  // 5. Deploy LotteryManager
  const LotteryManager = await ethers.getContractFactory("LotteryManager");
  const lotteryManager = await LotteryManager.deploy();
  await lotteryManager.waitForDeployment();
  console.log("LotteryManager deployed to:", await lotteryManager.getAddress());
  
  console.log("\n--- Deployment Complete ---");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
