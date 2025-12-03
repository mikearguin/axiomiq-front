import { nangoProxy } from '@/lib/integrations/nango/client';
// import { tool } from 'ai';
import { z } from 'zod';

// TODO: Implement AI SDK tools when proper types are available
// The AI SDK tool() function requires specific signatures that need to be configured

// Get connection ID for the current tenant
async function getGmailConnectionId(ownerId: string): Promise<string | null> {
  // TODO: Import and use createServiceRoleClient from @/lib/db/supabase/admin
  return `${ownerId}-gmail`;
}

// Tool: Send Email
// TODO: Uncomment and implement when AI SDK types are properly configured
export const sendEmailTool = (ownerId: string) => {
  throw new Error('Tool not yet implemented - AI SDK configuration required');
};

// Tool: Search Emails
// TODO: Uncomment and implement when AI SDK types are properly configured
export const searchEmailsTool = (ownerId: string) => {
  throw new Error('Tool not yet implemented - AI SDK configuration required');
};
