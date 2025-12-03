import { nangoProxy } from '@/lib/integrations/nango/client';
// import { tool } from 'ai';
import { z } from 'zod';

// TODO: Implement AI SDK tools when proper types are available

// Get connection ID for the current tenant
async function getHubSpotConnectionId(ownerId: string): Promise<string | null> {
  return `${ownerId}-hubspot`;
}

export const createHubSpotContactTool = (ownerId: string) => {
  throw new Error('Tool not yet implemented - AI SDK configuration required');
};

export const searchHubSpotContactsTool = (ownerId: string) => {
  throw new Error('Tool not yet implemented - AI SDK configuration required');
};
