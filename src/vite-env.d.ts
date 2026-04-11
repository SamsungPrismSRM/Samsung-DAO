/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DFNS_RP_ID?: string;
  readonly VITE_DFNS_RP_NAME?: string;
  /** Comma-separated email domains allowed for Google sign-in (default: samsung.com) */
  readonly VITE_SAMSUNG_SSO_EMAIL_SUFFIXES?: string;
  /** Google OAuth hosted-domain hint; default samsung.com */
  readonly VITE_SAMSUNG_GOOGLE_WORKSPACE_DOMAIN?: string;
  /** WalletConnect Cloud project id (required for HashPack / HashConnect on profile) */
  readonly VITE_WALLETCONNECT_PROJECT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
