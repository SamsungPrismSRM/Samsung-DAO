import { ethers } from "ethers";

// Using dynamic window typing for ethereum to avoid TS errors
const getProvider = () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
        return new ethers.BrowserProvider((window as any).ethereum);
    }
    return null;
};

// ABI for the Governance contract methods used by UI
const governanceAbi = [
    "function createProposal(string memory title, uint8 scope, uint256 regionId) external",
    "function proposalCount() external view returns (uint)",
    "function proposals(uint) external view returns (uint id, string title, uint start, uint end, bool executed)"
];

const GOVERNANCE_ADDRESS = import.meta.env.VITE_GOVERNANCE_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";

export const getGovernanceContract = async () => {
    const provider = getProvider();
    if (!provider) {
        throw new Error("No Ethereum provider found. Please install MetaMask or similar wallet.");
    }
    const signer = await provider.getSigner();
    const governance = new ethers.Contract(GOVERNANCE_ADDRESS, governanceAbi, signer);
    return governance;
};

export const createProposal = async (title: string, scope = 1, regionId = 0) => {
    try {
        const governance = await getGovernanceContract();
        const tx = await governance.createProposal(title, scope, regionId);
        await tx.wait();
        return { success: true, txHash: tx.hash };
    } catch (error) {
        console.error("Error creating proposal:", error);
        throw error;
    }
};
