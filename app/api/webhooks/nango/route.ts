import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/db/supabase/admin';

// Nango webhook payload types
interface NangoAuthWebhook {
  type: 'auth';
  connectionId: string;
  providerConfigKey: string;
  provider: string;
  environment: 'dev' | 'prod';
  success: boolean;
  operation: 'creation' | 'override' | 'unknown';
  error?: string;
  endUser?: {
    endUserId: string;
    organizationId?: string;
  };
}

export async function POST(request: Request) {
  try {
    const payload: NangoAuthWebhook = await request.json();
    
    // Only process successful auth events
    if (payload.type !== 'auth' || !payload.success) {
      return NextResponse.json({ received: true });
    }

    const supabase = createServiceRoleClient();
    
    // Determine owner (org or user)
    const ownerId = payload.endUser?.organizationId || payload.endUser?.endUserId;
    
    if (!ownerId) {
      console.error('No owner ID in Nango webhook');
      return NextResponse.json({ error: 'Missing owner ID' }, { status: 400 });
    }

    // Upsert the integration connection
    const { error } = await supabase
      .from('integrations')
      .upsert({
        owner_id: ownerId,
        provider: payload.providerConfigKey,
        nango_connection_id: payload.connectionId,
        status: 'active',
        connected_at: new Date().toISOString(),
      }, {
        onConflict: 'owner_id,provider',
      });

    if (error) {
      console.error('Error saving integration:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Nango webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}