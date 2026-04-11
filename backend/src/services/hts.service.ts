import { Client, TokenCreateTransaction, PrivateKey, PublicKey, AccountId } from "@hashgraph/sdk";

export class HtsService {
  private client: Client;

  constructor() {
    this.client = Client.forTestnet();
    const operatorId = process.env.HEDERA_OPERATOR_ID;
    const operatorKey = process.env.HEDERA_OPERATOR_KEY;
    if (operatorId && operatorKey) {
        this.client.setOperator(operatorId, operatorKey);
    }
  }

  public async createSPUToken(treasuryAccountId: string, treasuryPrivateKey: string) {
    try {
      const treasuryId = AccountId.fromString(treasuryAccountId);
      const treasuryKey = PrivateKey.fromStringECDSA(treasuryPrivateKey);

      const tokenCreate = new TokenCreateTransaction()
        .setTokenName("Samsung Participation Unit")
        .setTokenSymbol("SPU")
        .setDecimals(18)
        .setInitialSupply(1_000_000n * (10n ** 18n))
        .setTreasuryAccountId(treasuryId)
        .setAdminKey(treasuryKey)
        .setSupplyKey(treasuryKey);

      tokenCreate.freezeWith(this.client);
      
      const sigTx = await tokenCreate.sign(treasuryKey);
      const txResponse = await sigTx.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);

      const tokenId = receipt.tokenId;
      
      return {
        success: true,
        tokenId: tokenId?.toString()
      };
    } catch (error) {
      console.error("Error creating SPU token:", error);
      throw error;
    }
  }

  public async getAccountBalance(accountIdStr: string) {
    try {
      const { AccountBalanceQuery } = await import("@hashgraph/sdk");
      const query = new AccountBalanceQuery().setAccountId(accountIdStr);
      const balance = await query.execute(this.client);
      
      const htsTokenId = process.env.HTS_TOKEN_ID;
      let tokenBalance = 0;
      
      if (htsTokenId && balance.tokens) {
        tokenBalance = Number(balance.tokens.get(htsTokenId) || 0);
      }

      return {
        hbar: balance.hbars.toString(),
        spuToken: tokenBalance
      };
    } catch (error) {
      console.error("Error fetching account balance:", error);
      throw error;
    }
  }

  public async transferHTSToken(toAccountIdStr: string, amount: number) {
    try {
      const { TransferTransaction, AccountId } = await import("@hashgraph/sdk");
      const htsTokenId = process.env.HTS_TOKEN_ID;
      
      if (!htsTokenId) {
        throw new Error("HTS_TOKEN_ID not configured in environment");
      }

      const treasuryId = process.env.HEDERA_OPERATOR_ID;
      if (!treasuryId) {
        throw new Error("HEDERA_OPERATOR_ID not configured");
      }

      const transferTx = new TransferTransaction()
        .addTokenTransfer(htsTokenId, treasuryId, -amount)
        .addTokenTransfer(htsTokenId, toAccountIdStr, amount);

      const txResponse = await transferTx.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);

      return {
        success: true,
        status: receipt.status.toString(),
        txId: txResponse.transactionId.toString()
      };
    } catch (error) {
      console.error("Error transferring HTS Token:", error);
      throw error;
    }
  }
}

export const htsService = new HtsService();
