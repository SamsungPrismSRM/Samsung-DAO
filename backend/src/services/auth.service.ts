import { PrismaClient, Role } from '@prisma/client';
import { deriveHQ } from '../utils/deriveHQ';

const prisma = new PrismaClient();

export class AuthService {
  static async councilLogin(firebaseUser: { uid: string; email: string }, timezone: string = 'UTC') {
    const { uid: firebaseUid, email } = firebaseUser;

    // Derive HQ
    const hq = deriveHQ(email, timezone);
    const alias = `${hq}_COUNCIL`;
    if (!hq) {
      throw new Error('HQ missing');
    }

    // Ensure user exists or create
    let user = await prisma.user.findUnique({
      where: { firebase_uid: firebaseUid }
    });

    if (!user) {
      console.log('Creating user WITHOUT wallet');
      console.log('Wallet will be attached later');
      user = await prisma.user.create({
        data: {
          firebase_uid: firebaseUid,
          email,
          name: alias,
          role: Role.COUNCIL,
          hq,
          alias
        }
      });
    } else {
      // Update if they got a new HQ or alias, though normally it is deterministic
      if (user.hq !== hq || user.alias !== alias) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { hq, alias }
        });
      }
    }

    // Check if the HQ wallet is already provisioned
    const hqWallet = await prisma.hQWallet.findFirst({
      where: { hq }
    });

    const isWalletCreated = !!hqWallet;
    if (hqWallet && user.hq_wallet_id !== hqWallet.id) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          hq_wallet_id: hqWallet.id,
          is_wallet_created: true
        }
      });
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        hq: user.hq,
        alias: user.alias,
      },
      walletDetails: hqWallet,
      isWalletCreated
    };
  }
}
