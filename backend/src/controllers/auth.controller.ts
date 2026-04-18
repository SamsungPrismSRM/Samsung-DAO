import { Request, Response } from 'express';
import type { User } from '@prisma/client';
import { AuthService } from '../services/auth.service';
import { assertFirebaseGoogleIsSamsungSso } from '../utils/samsung-sso';
import { auditService } from '../services/audit.service';

type AuthedRequest = Request & {
  user?: { uid: string; email?: string; name?: string; signInProvider?: string };
};

function memberUserJson(user: User) {
  return {
    id: user.id,
    firebase_uid: user.firebase_uid,
    name: user.name,
    nickname: user.nickname,
    email: user.email,
    department: user.department,
    role: user.role,
    assigned_hq: user.hq,
    is_wallet_created: user.is_wallet_created,
    is_onboarded: user.is_onboarded,
    created_at: user.created_at.toISOString(),
  };
}

export const AuthController = {
  async memberLogin(req: Request, res: Response) {
    try {
      const authReq = req as Request & { user?: { uid: string; email?: string; name?: string } };
      if (!authReq.user?.uid) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const email = authReq.user.email;
      if (!email) {
        return res.status(400).json({
          error: 'Your Firebase account must include an email. Add one in Firebase or use Google sign-in.',
        });
      }

      const user = await AuthService.memberLogin({
        uid: authReq.user.uid,
        email,
        name: authReq.user.name,
      });

      void auditService.logAction({
        userId: user.id,
        action: 'USER_LOGIN',
        entityType: 'USER',
        entityId: user.id,
        metadata: { email: user.email, role: user.role, method: 'member' },
        ipAddress: req.ip,
      });

      return res.json({ user: memberUserJson(user) });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Internal Server Error';
      if (message === 'COUNCIL_ACCOUNT') {
        return res.status(400).json({
          error: 'This account is registered as council HQ. Use council sign-in from the auth page.',
        });
      }
      console.error('MEMBER LOGIN ERROR:', err);
      return res.status(500).json({ error: message });
    }
  },

  async memberOnboard(req: Request, res: Response) {
    try {
      const authReq = req as Request & { user?: { uid: string } };
      if (!authReq.user?.uid) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const nickname = typeof req.body?.nickname === 'string' ? req.body.nickname : '';
      if (!nickname.trim()) {
        return res.status(400).json({ error: 'Nickname is required' });
      }

      const user = await AuthService.memberOnboard(authReq.user.uid, nickname);
      void auditService.logAction({
        userId: user.id,
        action: 'USER_ONBOARD',
        entityType: 'USER',
        entityId: user.id,
        metadata: { nickname, email: user.email },
        ipAddress: req.ip,
      });
      return res.json({ user: memberUserJson(user) });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Internal Server Error';
      const status = message === 'User not found' ? 404 : message.includes('only for members') ? 403 : 500;
      console.error('MEMBER ONBOARD ERROR:', err);
      return res.status(status).json({ error: message });
    }
  },

  async councilLogin(req: Request, res: Response) {
    try {
      const authReq = req as AuthedRequest;

      if (!authReq.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { email, uid, signInProvider } = authReq.user;
      if (!email) {
        return res.status(400).json({ error: "Email missing from token" });
      }

      const sso = assertFirebaseGoogleIsSamsungSso(signInProvider, email);
      if (!sso.ok) {
        return res.status(sso.status).json({ error: sso.error });
      }

      console.log("Processing Council Login for:", email);

      const timezone = req.body.timezone || "UTC";

      const result = await AuthService.councilLogin({ uid, email }, timezone);

      void auditService.logAction({
        userId: result.user.id,
        action: 'COUNCIL_LOGIN',
        entityType: 'USER',
        entityId: result.user.id,
        metadata: { email: result.user.email, hq: result.user.hq, timezone },
        ipAddress: req.ip,
      });

      return res.json({
        user: result.user,
        hq: result.user.hq,
        alias: result.user.alias,
        walletExists: result.isWalletCreated
      });

    } catch (err: any) {
      console.error("COUNCIL LOGIN ERROR:", err);
      return res.status(err.message?.includes('Invalid HQ') ? 400 : 500).json({
        error: err.message || "Internal Server Error"
      });
    }
  }
};
