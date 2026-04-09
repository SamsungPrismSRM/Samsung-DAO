import fs from 'fs';
import path from 'path';
import { createPrivateKey } from 'crypto';
import { DfnsApiClient } from '@dfns/sdk';
import { AsymmetricKeySigner } from '@dfns/sdk-keysigner';

function normalizeEnvValue(value?: string): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function extractOrgIdFromDfnsToken(token: string): string | undefined {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return undefined;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    const appMetadata = payload?.['https://custom/app_metadata'];
    const orgId = typeof appMetadata?.orgId === 'string' ? appMetadata.orgId : undefined;
    return orgId && orgId.startsWith('or-') ? orgId : undefined;
  } catch {
    return undefined;
  }
}

function getPrivateKeyPem(): string {
  const configuredPath = normalizeEnvValue(process.env.DFNS_PRIVATE_KEY_PATH) || './private_key.pem';
  const candidatePaths = [
    path.resolve(process.cwd(), configuredPath),
    path.resolve(__dirname, '../../', configuredPath),
    path.resolve(__dirname, '../../../', configuredPath),
  ];

  for (const candidatePath of candidatePaths) {
    if (fs.existsSync(candidatePath)) {
      const pem = fs.readFileSync(candidatePath, 'utf8').trim();
      if (!pem.includes('-----BEGIN PRIVATE KEY-----') || !pem.includes('-----END PRIVATE KEY-----')) {
        throw new Error(`Invalid PEM format at ${candidatePath}`);
      }
      if (pem.includes('\\n')) {
        throw new Error(`Private key at ${candidatePath} appears escaped/corrupted (contains literal \\n)`);
      }
      // Parse once to fail fast on malformed or mismatched key material.
      createPrivateKey({ key: pem, format: 'pem' });
      return pem;
    }
  }

  throw new Error('DFNS private key not found. Check DFNS_PRIVATE_KEY_PATH.');
}

export function getDfnsClient(): DfnsApiClient {
  const baseUrl = normalizeEnvValue(process.env.DFNS_BASE_URL) || 'https://api.dfns.io';
  const authToken = normalizeEnvValue(process.env.DFNS_API_KEY);
  const credId = normalizeEnvValue(process.env.DFNS_CRED_ID);
  const configuredOrgId = normalizeEnvValue(process.env.DFNS_ORG_ID);

  if (!authToken) {
    throw new Error('DFNS_API_KEY missing');
  }
  if (!credId) {
    throw new Error('DFNS_CRED_ID missing');
  }

  const signer = new AsymmetricKeySigner({
    credId,
    privateKey: getPrivateKeyPem(),
  });

  const tokenOrgId = extractOrgIdFromDfnsToken(authToken);
  const orgId = configuredOrgId.startsWith('or-')
    ? configuredOrgId
    : tokenOrgId;

  if (configuredOrgId && !configuredOrgId.startsWith('or-')) {
    console.warn(`Ignoring invalid DFNS_ORG_ID (${configuredOrgId}). Expected prefix "or-".`);
  }
  if (configuredOrgId && tokenOrgId && configuredOrgId !== tokenOrgId) {
    console.warn(`DFNS_ORG_ID mismatch; using token-scoped org (${tokenOrgId}) instead of configured (${configuredOrgId}).`);
  }

  return new DfnsApiClient({
    baseUrl,
    authToken,
    ...(orgId ? { orgId } : {}),
    signer,
  });
}
