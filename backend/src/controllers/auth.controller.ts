import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { deriveHQ } from '../utils/deriveHQ';

const prisma = new PrismaClient();

export const AuthController = {
  async councilLogin(req: Request, res: Response) {
    try {
      const authReq = req as any; // Due to firebase-admin middleware attachment
      
      if (!authReq.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      console.log("REQ USER:", authReq.user);

      const { email, uid } = authReq.user;

      if (!email) {
        return res.status(400).json({ error: "Email missing from token" });
      }

      console.log("EMAIL:", email);
      console.log("UID:", uid);


      const timezone = req.body.timezone || "UTC";

      const hq = deriveHQ(email, timezone);
      const alias = `${hq}_COUNCIL`;

      console.log("HQ BEING USED:", hq);
      if (!hq) {
        return res.status(400).json({ error: "HQ missing" });
      }

      // Validate HQ exists in master table
      const hqExists = await prisma.hQ.findUnique({ where: { id: hq } });
      if (!hqExists) {
        return res.status(400).json({ error: `Invalid HQ: ${hq}. Not found in master HQ table.` });
      }

      let user = await prisma.user.findUnique({
        where: { email }
      });

      if (user) {
        user = await prisma.user.update({
          where: { email },
          data: {
            firebase_uid: uid,
            role: "COUNCIL",
            hq,
            alias
          }
        });
      } else {
        console.log("Creating user WITHOUT wallet");
        console.log("Wallet will be attached later");
        user = await prisma.user.create({
          data: {
            firebase_uid: uid,
            email,
            name: alias,
            role: "COUNCIL",
            hq,
            alias
          }
        });
      }

      const hqWallet = await prisma.hQWallet.findFirst({
        where: { hq }
      });

      if (hqWallet && user.hq_wallet_id !== hqWallet.id) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            hq_wallet_id: hqWallet.id,
            is_wallet_created: true
          }
        });
      }

      return res.json({
        user,
        hq,
        alias,
        walletExists: !!hqWallet
      });

    } catch (err: any) {
      console.error("COUNCIL LOGIN ERROR:", err);
      return res.status(500).json({
        error: err.message || "Internal Server Error"
      });
    }
  }
};
