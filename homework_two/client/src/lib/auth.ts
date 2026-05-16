import { PublicClientApplication, type Configuration, type AccountInfo, type AuthenticationResult } from '@azure/msal-browser';

// These values come from env vars (set via .env.local) or fall back to dev placeholders.
// Real values are set by the developer per the setup checklist in the plan.
const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID ?? 'YOUR_CLIENT_ID',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID ?? 'common'}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

export const LOGIN_SCOPES = [
  'User.Read',
  'Mail.Read',
  'Mail.Send',
  'Calendars.ReadWrite',
  'Chat.ReadWrite',
  'ChannelMessage.Read.User',
  `499b84ac-1321-427f-aa17-267ca6975798/user_impersonation`,
];

export const GRAPH_SCOPES = ['User.Read', 'Mail.Read', 'Mail.Send', 'Calendars.ReadWrite', 'Chat.ReadWrite', 'ChannelMessage.Read.User'];
export const DEVOPS_SCOPES = ['499b84ac-1321-427f-aa17-267ca6975798/user_impersonation'];

export async function signInWithMicrosoft(): Promise<AuthenticationResult> {
  await msalInstance.initialize();
  return msalInstance.loginPopup({ scopes: LOGIN_SCOPES });
}

export async function getGraphToken(): Promise<string | null> {
  await msalInstance.initialize();
  const accounts = msalInstance.getAllAccounts();
  if (!accounts.length) return null;
  try {
    const result = await msalInstance.acquireTokenSilent({ scopes: GRAPH_SCOPES, account: accounts[0] });
    return result.accessToken;
  } catch {
    return null;
  }
}

export async function getDevOpsToken(): Promise<string | null> {
  await msalInstance.initialize();
  const accounts = msalInstance.getAllAccounts();
  if (!accounts.length) return null;
  try {
    const result = await msalInstance.acquireTokenSilent({ scopes: DEVOPS_SCOPES, account: accounts[0] });
    return result.accessToken;
  } catch {
    return null;
  }
}

export function getMsalAccount(): AccountInfo | null {
  const accounts = msalInstance.getAllAccounts();
  return accounts[0] ?? null;
}

// ── App JWT storage ──────────────────────────────────────────────────────────
const TOKEN_KEY = 'agp_app_token';

export const tokenStorage = {
  get: () => sessionStorage.getItem(TOKEN_KEY),
  set: (token: string) => sessionStorage.setItem(TOKEN_KEY, token),
  clear: () => sessionStorage.removeItem(TOKEN_KEY),
};
