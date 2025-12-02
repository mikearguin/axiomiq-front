// lib/integrations/nango-client.ts

import { Nango } from '@nangohq/node';

const nango = new Nango({ secretKey: process.env.NANGO_SECRET_KEY! });

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

// Get access token for making API calls
export async function getIntegrationToken(
  tenantId: string,
  provider: string
): Promise<string | null> {
  try {
    const connectionId = `${tenantId}-${provider}`;
    const connection = await nango.getConnection(provider, connectionId);
    return connection.credentials.access_token;
  } catch {
    return null;
  }
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