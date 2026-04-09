import { WebAuthnSigner } from '@dfns/sdk-browser';

function getRelyingPartyConfig() {
  const id = import.meta.env.VITE_DFNS_RP_ID || window.location.hostname;
  const name = import.meta.env.VITE_DFNS_RP_NAME || 'Samsung DAO Council';
  return { id, name };
}

export function createDfnsWebAuthnSigner() {
  return new WebAuthnSigner({
    relyingParty: getRelyingPartyConfig(),
  });
}

/**
 * Register a new passkey during onboarding using challenge from backend.
 */
export async function registerDfnsPasskey(challenge: unknown) {
  const signer = createDfnsWebAuthnSigner();
  return signer.create(challenge as any);
}

/**
 * Sign a DFNS user action challenge during sensitive operations.
 */
export async function signDfnsUserAction(challenge: unknown) {
  const signer = createDfnsWebAuthnSigner();
  return signer.sign(challenge as any);
}
