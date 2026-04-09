import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin focusing on projectId for token verification if no SA is present
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      projectId: 'namoj-551b3',
    });
  } catch (e) {
    console.error("Firebase admin initialization failed", e);
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  console.log("AUTH HEADER:", authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Invalid or missing token' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log("DECODED USER:", decodedToken);
    (req as any).user = { uid: decodedToken.uid, email: decodedToken.email };
    next();
  } catch (error) {
    console.error('Firebase Auth Error:', error);
    return res.status(401).json({ error: 'Invalid or missing token' });
  }
};
