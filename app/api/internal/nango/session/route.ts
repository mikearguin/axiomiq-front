import { NextRequest, NextResponse } from 'next/server';
import { nango } from '@/lib/integrations/nango/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { allowedIntegrations } = body;

    // TODO: Get user/org ID from Clerk session
    // For now, using a placeholder
    const userId = 'user-123';
    const orgId = 'org-123';

    // Create session token
    const session = await nango.createConnectSession({
      end_user: {
        id: orgId || userId,
        email: 'user@example.com', // TODO: Get from Clerk
        display_name: 'User Name', // TODO: Get from Clerk
      },
      allowed_integrations: allowedIntegrations || undefined,
    });

    return NextResponse.json({ sessionToken: session.data.token });
  } catch (error) {
    console.error('Error creating Nango session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
