'use client';

import { useState } from 'react';
import Nango from '@nangohq/frontend';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface ConnectIntegrationProps {
  integrationId: string;
  integrationName: string;
  onSuccess?: (connectionId: string) => void;
}

export function ConnectIntegration({
  integrationId,
  integrationName,
  onSuccess,
}: ConnectIntegrationProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    setIsConnecting(true);

    try {
      // 1. Get session token from your backend
      const sessionRes = await fetch('/api/internal/nango/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allowedIntegrations: [integrationId],
        }),
      });

      if (!sessionRes.ok) {
        throw new Error('Failed to create session');
      }

      const { sessionToken } = await sessionRes.json();

      // 2. Initialize Nango with session token
      const nango = new Nango({
        connectSessionToken: sessionToken,
      });

      // 3. Open Connect UI
      const connect = nango.openConnectUI({
        onEvent: (event) => {
          if (event.type === 'connect') {
            // User successfully connected
            toast({
              title: 'Connected!',
              description: `Successfully connected to ${integrationName}`,
            });
            onSuccess?.(event.payload.connectionId);
          } else if (event.type === 'close') {
            // User closed the modal
            setIsConnecting(false);
          }
        },
      });

    } catch (error) {
      console.error('Connection error:', error);
      toast({
        title: 'Connection Failed',
        description: 'Could not connect to the integration. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Button onClick={handleConnect} disabled={isConnecting}>
      {isConnecting ? 'Connecting...' : `Connect ${integrationName}`}
    </Button>
  );
}
