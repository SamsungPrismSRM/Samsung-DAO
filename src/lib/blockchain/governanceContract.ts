import { ethers } from "ethers";

const getProvider = () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
        return new ethers.BrowserProvider((window as any).ethereum);
    }
    return null;
};

// ABI matching your Solidity implementation
const governanceAbi = [
    "function createProposal(string memory title) external",
    "function proposalCount() external view returns (uint)",
    "function proposals(uint) external view returns (uint id, string title, uint start, uint end, bool executed)",
    "function voting() external view returns (address)",
    "function cancelProposal(uint proposalId) external",
    "event ProposalCreated(uint proposalId, string title, uint startBlock, uint endBlock)",
    "event ProposalExecuted(uint proposalId)",
    "event ProposalCanceled(uint proposalId)"
];

const votingAbi = [
    "function vote(uint proposalId, bool support) external",
    "function result(uint proposalId) external view returns (uint forVotes, uint againstVotes)",
    "event VoteCast(address indexed voter, uint proposalId, bool support, uint weight)"
];

const GOVERNANCE_ADDRESS = import.meta.env.VITE_GOVERNANCE_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";

export const getGovernanceContract = async () => {
    const provider = getProvider();
    if (!provider) {
        throw new Error("No Ethereum provider found. Please install MetaMask or connect your wallet.");
    }
    const signer = await provider.getSigner();
    return new ethers.Contract(GOVERNANCE_ADDRESS, governanceAbi, signer);
};

export const getVotingContract = async (governance: ethers.Contract, signer: ethers.Signer) => {
    const votingAddress = await governance.voting();
    return new ethers.Contract(votingAddress, votingAbi, signer);
};

export const createProposal = async (title: string) => {
    try {
        const governance = await getGovernanceContract();
        const tx = await governance.createProposal(title);
        const receipt = await tx.wait();
        return { success: true, txHash: tx.hash, receipt };
    } catch (error) {
        console.error("Error creating proposal:", error);
        throw error;
    }
};

export const vote = async (proposalId: number, support: boolean) => {
    try {
        const provider = getProvider();
        if (!provider) throw new Error("No provider");
        const signer = await provider.getSigner();
        const governance = await getGovernanceContract();
        
        const votingCtr = await getVotingContract(governance, signer);
        const tx = await votingCtr.vote(proposalId, support);
        const receipt = await tx.wait();
        return { success: true, txHash: tx.hash, receipt };
    } catch (error) {
        console.error("Error voting:", error);
        throw error;
    }
};

export const getProposal = async (proposalId: number) => {
    try {
        const provider = getProvider();
        if (!provider) throw new Error("No provider");
        // Use an RPC fallback or just the browser provider
        const governance = new ethers.Contract(GOVERNANCE_ADDRESS, governanceAbi, provider);
        const p = await governance.proposals(proposalId);
        
        return {
            id: Number(p.id),
            title: p.title,
            start: Number(p.start),
            end: Number(p.end),
            executed: p.executed
        };
    } catch (error) {
        console.error("Error fetching proposal:", error);
        throw error;
    }
};

export const cancelProposal = async (proposalId: number) => {
    try {
        const provider = getProvider();
        if (!provider) throw new Error("No provider");
        const signer = await provider.getSigner();
        const governance = await getGovernanceContract();
        
        const tx = await governance.cancelProposal(proposalId);
        const receipt = await tx.wait();
        return { success: true, txHash: tx.hash, receipt };
    } catch (error) {
        console.error("Error canceling proposal:", error);
        throw error;
    }
};
