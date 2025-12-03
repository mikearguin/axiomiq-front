import { Nango } from '@nangohq/node';

const nango = new Nango({ secretKey: process.env.NANGO_SECRET_KEY! });

export { nango };

// Available integrations for AxiomIQ platform
export const AVAILABLE_INTEGRATIONS = {
  // CRM & Sales
  hubspot: { name: 'HubSpot', category: 'crm', scopes: ['contacts', 'deals'] },
  salesforce: { name: 'Salesforce', category: 'crm', scopes: ['api'] },
  pipedrive: { name: 'Pipedrive', category: 'crm', scopes: ['deals:read'] },

  // Communication
  gmail: { name: 'Gmail', category: 'email', scopes: ['gmail.send', 'gmail.readonly'] },
  slack: { name: 'Slack', category: 'messaging', scopes: ['chat:write', 'channels:read'] },

  // Marketing
  mailchimp: { name: 'Mailchimp', category: 'marketing', scopes: ['campaigns'] },
  linkedin: { name: 'LinkedIn', category: 'social', scopes: ['w_member_social'] },

  // Productivity
  notion: { name: 'Notion', category: 'productivity', scopes: ['read', 'write'] },
  googleSheets: { name: 'Google Sheets', category: 'productivity', scopes: ['spreadsheets'] },
  googleCalendar: { name: 'Google Calendar', category: 'productivity', scopes: ['calendar'] },

  // Billing & Finance
  stripe: { name: 'Stripe', category: 'billing', scopes: ['read_write'] },
  quickbooks: { name: 'QuickBooks', category: 'accounting', scopes: ['accounting'] },

  // Project Management
  linear: { name: 'Linear', category: 'pm', scopes: ['read', 'write'] },
  asana: { name: 'Asana', category: 'pm', scopes: ['default'] },
  jira: { name: 'Jira', category: 'pm', scopes: ['read:jira-work', 'write:jira-work'] },
};

// Helper to make authenticated API calls through Nango
export async function nangoProxy<T = any>(params: {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  providerConfigKey: string;
  connectionId: string;
  data?: any;
  headers?: Record<string, string>;
}): Promise<T> {
  const response = await nango.proxy({
    method: params.method,
    endpoint: params.endpoint,
    providerConfigKey: params.providerConfigKey,
    connectionId: params.connectionId,
    data: params.data,
    headers: params.headers,
  });

  return response.data as T;
}

// Connect a new integration for a tenant
export async function connectIntegration(
  tenantId: string,
  userId: string,
  provider: keyof typeof AVAILABLE_INTEGRATIONS
) {
  const connectionId = `${tenantId}-${provider}`;

  // Create session token for frontend OAuth flow
  const session = await nango.createConnectSession({
    end_user: {
      id: userId,
      email: '', // Will be filled from Clerk
      display_name: '',
    },
    allowed_integrations: [provider],
  });

  return session.data.token;
}

// Check if a connection is valid
export async function checkConnection(
  providerConfigKey: string,
  connectionId: string
): Promise<boolean> {
  try {
    await nango.getConnection(providerConfigKey, connectionId);
    return true;
  } catch {
    return false;
  }
}

// Get raw access token (if needed for custom API calls)
export async function getAccessToken(
  providerConfigKey: string,
  connectionId: string
): Promise<string | null> {
  try {
    const connection = await nango.getConnection(providerConfigKey, connectionId);
    // Handle different credential types
    const credentials = connection.credentials as any;
    return credentials.access_token || credentials.accessToken || null;
  } catch {
    return null;
  }
}

// Get access token for making API calls (alias)
export async function getIntegrationToken(
  tenantId: string,
  provider: string
): Promise<string | null> {
  const connectionId = `${tenantId}-${provider}`;
  return getAccessToken(provider, connectionId);
}

// Proxy API request through Nango (handles auth automatically)
export async function proxyIntegrationRequest(
  tenantId: string,
  provider: string,
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any
) {
  const connectionId = `${tenantId}-${provider}`;

  return nango.proxy({
    method,
    endpoint,
    providerConfigKey: provider,
    connectionId,
    data,
  });
}