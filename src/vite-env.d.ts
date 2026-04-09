/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DFNS_RP_ID?: string;
  readonly VITE_DFNS_RP_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
