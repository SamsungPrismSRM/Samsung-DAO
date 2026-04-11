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
}