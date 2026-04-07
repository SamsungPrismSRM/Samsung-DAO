import { ethers } from 'ethers';
import { useCallback } from 'react';

// Hardcoded EVM Contract Addresses for MVP interaction
export const GOVERNANCE_ADDRESS = '0x0000000000000000000000000000000000000000'; // Override with actual
export const VOTING_ENGINE_ADDRESS = '0x0000000000000000000000000000000000000000'; // Override with actual

const GOVERNANCE_ABI = [
  "function createProposal(string memory data) external returns (uint256)",
  "function executeProposal(uint256 proposalId) external",
  "function getProposal(uint256 proposalId) external view returns (uint256, address, string memory, bool)"
];

const VOTING_ENGINE_ABI = [
  "function castVote(uint256 proposalId, uint8 support) external",
  "function getProposalVotes(uint256 proposalId) external view returns (uint256, uint256)"
];

export function useGovernanceContracts(provider: ethers.BrowserProvider | null) {
  
  const createProposal = useCallback(async (data: string) => {
    if (!provider) throw new Error("Provider not connected");
    const signer = await provider.getSigner();
    const governance = new ethers.Contract(GOVERNANCE_ADDRESS, GOVERNANCE_ABI, signer);
    
    // Send transaction to Hedera EVM
    const tx = await governance.createProposal(data);
    await tx.wait(); // Wait for confirmation
    return tx.hash;
  }, [provider]);

  const castVote = useCallback(async (proposalId: number, support: 0 | 1) => {
    if (!provider) throw new Error("Provider not connected");
    const signer = await provider.getSigner();
    const voting = new ethers.Contract(VOTING_ENGINE_ADDRESS, VOTING_ENGINE_ABI, signer);
    
    const tx = await voting.castVote(proposalId, support);
    await tx.wait();
    return tx.hash;
  }, [provider]);

  const executeProposal = useCallback(async (proposalId: number) => {
    // Using provider signer. In production, this would use DFNS delegated MPC Signer logic.
    if (!provider) throw new Error("Provider not connected");
    const executor = await provider.getSigner();
    
    const governance = new ethers.Contract(GOVERNANCE_ADDRESS, GOVERNANCE_ABI, executor);
    const tx = await governance.executeProposal(proposalId);
    await tx.wait();
    return tx.hash;
  }, [provider]);

  return { createProposal, castVote, executeProposal };
}
