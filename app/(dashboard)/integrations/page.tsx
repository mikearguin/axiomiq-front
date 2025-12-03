import { createClerkSupabaseServerClient } from '@/lib/db/supabase/server';
import { ConnectIntegration } from '@/components/integrations/connect-integration';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Available integrations configuration
const AVAILABLE_INTEGRATIONS = [
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Send and read emails',
    category: 'Email',
    icon: '📧',
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Manage calendar events',
    category: 'Productivity',
    icon: '📅',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send notifications and messages',
    category: 'Messaging',
    icon: '💬',
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'CRM and lead management',
    category: 'CRM',
    icon: '🎯',
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Documentation and wikis',
    category: 'Productivity',
    icon: '📝',
  },
  {
    id: 'linear',
    name: 'Linear',
    description: 'Issue tracking and project management',
    category: 'Project Management',
    icon: '📋',
  },
];

export default async function IntegrationsPage() {
  const supabase = await createClerkSupabaseServerClient();
  
  // Get existing connections
  const { data: connections } = await supabase
    .from('integrations')
    .select('*')
    .eq('status', 'active');

  const connectedProviders = new Set(connections?.map(c => c.provider) || []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-muted-foreground">
          Connect your tools to power your workflows
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {AVAILABLE_INTEGRATIONS.map((integration) => {
          const isConnected = connectedProviders.has(integration.id);
          
          return (
            <Card key={integration.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{integration.icon}</span>
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      <CardDescription>{integration.description}</CardDescription>
                    </div>
                  </div>
                  {isConnected && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Connected
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{integration.category}</Badge>
                  {isConnected ? (
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  ) : (
                    <ConnectIntegration
                      integrationId={integration.id}
                      integrationName={integration.name}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}