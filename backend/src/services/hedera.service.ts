import { 
  Client, 
  ContractExecuteTransaction, 
  ContractFunctionParameters,
  AccountId,
  PrivateKey
} from "@hashgraph/sdk";

export class HederaDAOService {
  private client: Client;
  private contractId: string;

  constructor() {
    this.client = Client.forMainnet();
    // In production, these should be securely injected
    this.client.setOperator(
      AccountId.fromString(process.env.OPERATOR_ID || '0.0.X'),
      PrivateKey.fromString(process.env.OPERATOR_KEY || '')
    );
    this.contractId = process.env.DAO_CONTRACT_ID || '';
  }

  /**
   * 1. Create On-Chain Proposal (Hash Storage)
   * Invoked after IPFS upload.
   */
  async createProposal(ipfsCid: string, startTime: number, endTime: number) {
    const tx = new ContractExecuteTransaction()
      .setContractId(this.contractId)
      .setGas(1000000)
      .setFunction(
        "createProposal",
        new ContractFunctionParameters()
          .addString(ipfsCid)
          .addUint256(startTime)
          .addUint256(endTime)
      );
    
    const response = await tx.execute(this.client);
    const receipt = await response.getReceipt(this.client);
    return response.transactionId.toString();
  }

  /**
   * 2. Execute Passed Proposal 
   * (Triggered by the Multisig Service after gathering signatures)
   */
  async executeProposal(proposalId: number, signatures: string[]) {
    // Pass the signatures to the smart contract for verification if it's an on-chain multisig,
    // or if the backend operator is trusted to execute after off-chain threshold is met.
    const contractParams = new ContractFunctionParameters()
      .addUint256(proposalId)
    // .addBytesArray(signatures.map(sig => Buffer.from(sig, 'hex'))) -> Depends on ABI
      
    const tx = new ContractExecuteTransaction()
      .setContractId(this.contractId)
      .setGas(2000000) // Execution gas
      .setFunction("executeProposal", contractParams);
      
    const response = await tx.execute(this.client);
    return response.transactionId.toString();
  }
}
