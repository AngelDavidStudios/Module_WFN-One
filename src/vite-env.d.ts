/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_COGNITO_USER_POOL_ID: string;
  readonly VITE_COGNITO_USER_POOL_CLIENT_ID: string;
  readonly VITE_COGNITO_IDENTITY_POOL_ID: string;
  readonly VITE_COGNITO_DOMAIN: string;
  readonly VITE_OAUTH_REDIRECT_SIGN_IN: string;
  readonly VITE_OAUTH_REDIRECT_SIGN_OUT: string;
  readonly VITE_OAUTH_RESPONSE_TYPE: string;
  readonly VITE_OAUTH_SCOPES: string;
  readonly VITE_AWS_REGION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
