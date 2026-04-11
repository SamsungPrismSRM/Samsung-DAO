import { getDfnsClient } from '../lib/dfnsClient';

export class DfnsService {
  private static buildDfnsError(operation: string, error: unknown): Error {
    const err = error as { message?: string; statusCode?: number; status?: number; error?: { message?: string } };
    const status = err.statusCode || err.status;
    const message = err.error?.message || err.message || 'Unknown DFNS error';
    return new Error(`${operation} failed${status ? ` (HTTP ${status})` : ''}: ${message}`);
  }

  static async createCouncilWallet(hq: string): Promise<{
    walletId: string;
    hederaAccountId: string;
  }> {
    try {
      const dfns = getDfnsClient();
      const wallet = await dfns.wallets.createWallet({
        body: {
          network: 'Hedera',
          name: `SAMSUNG_${hq}_TREASURY`,
        }
      });

      return {
        walletId: wallet.id,
        hederaAccountId: wallet.address || '0.0.0',
      };
    } catch (error) {
      throw this.buildDfnsError('DFNS create wallet', error);
    }
  }

  static async createSigningRequest(params: {
    walletId: string;
    to: string;
    amount: string;
    memo?: string;
  }): Promise<{
    requestId: string;
    status: string;
  }> {
    try {
      const dfns = getDfnsClient();
      const tx = await dfns.wallets.transferAsset({
        walletId: params.walletId,
        body: {
          kind: 'Native',
          to: params.to,
          amount: params.amount,
          memo: params.memo,
        }
      });

      return {
        requestId: tx.id,
        status: tx.status || 'PENDING',
      };
    } catch (error) {
      throw this.buildDfnsError('DFNS signing request', error);
    }
  }

  static async executeTreasuryTransfer(walletId: string, to: string, amount: string): Promise<any> {
    try {
      const apiKey = process.env.DFNS_API_KEY;
      if (!apiKey) {
        throw new Error("DFNS_API_KEY is not configured for bearer token auth");
      }

      // Execute bearer token authorized REST call to trigger automated treasury withdrawal.
      // (This overrides the standard MPC prompt by asserting Admin API permissions locally).
      const axios = (await import('axios')).default;
      const response = await axios.post(
        `https://api.dfns.io/wallets/${walletId}/transfers`,
        {
          kind: 'Native',
          to,
          amount,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      throw this.buildDfnsError('DFNS Execute Treasury Transfer', error);
    }
  }
}