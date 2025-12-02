// workflows/axiomiq-bootstrap/definitions.ts

export const AXIOMIQ_BOOTSTRAP_WORKFLOWS = {
  // =====================================================
  // LEAD GENERATION WORKFLOW
  // =====================================================
  
  leadGenerationPipeline: {
    name: 'Lead Generation Pipeline',
    description: 'Automated lead research, scoring, and outreach sequence',
    trigger: {
      type: 'schedule',
      config: { cron: '0 9 * * 1-5', timezone: 'America/New_York' }, // 9am ET weekdays
    },
    definition: {
      nodes: [
        {
          id: 'trigger',
          type: 'trigger',
          data: { type: 'schedule' },
        },
        {
          id: 'research',
          type: 'agent',
          data: {
            agentId: 'leadResearcher',
            inputMapping: { 
              targetCriteria: '{{trigger.criteria}}',
              batchSize: 10,
            },
          },
        },
        {
          id: 'score',
          type: 'transform',
          data: {
            transformType: 'code',
            expression: `
              // Score leads based on research
              return leads.map(lead => ({
                ...lead,
                score: calculateLeadScore(lead),
                tier: lead.score > 80 ? 'hot' : lead.score > 50 ? 'warm' : 'cold'
              }));
            `,
          },
        },
        {
          id: 'filter',
          type: 'condition',
          data: {
            conditionType: 'expression',
            expression: '{{lead.score}} > 50',
            branches: [
              { id: 'qualified', label: 'Qualified', condition: 'true' },
              { id: 'nurture', label: 'Nurture', condition: 'false' },
            ],
          },
        },
        {
          id: 'writeOutreach',
          type: 'agent',
          data: {
            agentId: 'outreachWriter',
            inputMapping: { leadData: '{{lead}}' },
          },
        },
        {
          id: 'sendEmail',
          type: 'tool',
          data: {
            toolId: 'gmail_send',
            inputMapping: {
              to: '{{lead.email}}',
              subject: '{{outreach.subject}}',
              body: '{{outreach.body}}',
            },
          },
        },
        {
          id: 'logToCRM',
          type: 'tool',
          data: {
            toolId: 'hubspot_create_contact',
            inputMapping: { contactData: '{{lead}}' },
          },
        },
      ],
      edges: [
        { source: 'trigger', target: 'research' },
        { source: 'research', target: 'score' },
        { source: 'score', target: 'filter' },
        { source: 'filter', target: 'writeOutreach', sourceHandle: 'qualified' },
        { source: 'writeOutreach', target: 'sendEmail' },
        { source: 'sendEmail', target: 'logToCRM' },
      ],
    },
  },

  // =====================================================
  // CONTENT PIPELINE WORKFLOW
  // =====================================================

  weeklyContentPipeline: {
    name: 'Weekly Content Pipeline',
    description: 'Automated content ideation, creation, and scheduling',
    trigger: {
      type: 'schedule',
      config: { cron: '0 10 * * 1', timezone: 'America/New_York' }, // Monday 10am
    },
    definition: {
      nodes: [
        {
          id: 'trigger',
          type: 'trigger',
          data: { type: 'schedule' },
        },
        {
          id: 'strategy',
          type: 'agent',
          data: {
            agentId: 'contentStrategist',
            inputMapping: { 
              week: '{{trigger.week}}',
              contentPillars: '{{config.contentPillars}}',
            },
          },
        },
        {
          id: 'parallel',
          type: 'parallel',
          data: {
            branches: ['blog', 'social'],
          },
        },
        {
          id: 'blog',
          type: 'agent',
          data: {
            agentId: 'blogWriter',
            inputMapping: { brief: '{{strategy.blogBrief}}' },
          },
        },
        {
          id: 'social',
          type: 'agent',
          data: {
            agentId: 'socialMediaWriter',
            inputMapping: { brief: '{{strategy.socialBrief}}' },
          },
        },
        {
          id: 'review',
          type: 'humanInput',
          data: {
            prompt: 'Review and approve content for publishing',
            assignTo: 'content_team',
            timeoutHours: 48,
          },
        },
        {
          id: 'schedule',
          type: 'tool',
          data: {
            toolId: 'content_scheduler',
            inputMapping: { 
              blogPost: '{{blog.output}}',
              socialPosts: '{{social.output}}',
              schedule: '{{strategy.schedule}}',
            },
          },
        },
      ],
      edges: [
        { source: 'trigger', target: 'strategy' },
        { source: 'strategy', target: 'parallel' },
        { source: 'parallel', target: 'blog', sourceHandle: 'blog' },
        { source: 'parallel', target: 'social', sourceHandle: 'social' },
        { source: 'blog', target: 'review' },
        { source: 'social', target: 'review' },
        { source: 'review', target: 'schedule' },
      ],
    },
  },

  // =====================================================
  // CUSTOMER SUPPORT WORKFLOW
  // =====================================================

  supportTicketHandler: {
    name: 'Support Ticket Handler',
    description: 'Automated support ticket triage, response, and escalation',
    trigger: {
      type: 'webhook',
      config: { 
        path: '/webhooks/support',
        source: 'intercom', // or zendesk, freshdesk, etc.
      },
    },
    definition: {
      nodes: [
        {
          id: 'trigger',
          type: 'trigger',
          data: { type: 'webhook' },
        },
        {
          id: 'classify',
          type: 'agent',
          data: {
            agentId: 'supportAgent',
            inputMapping: { 
              ticket: '{{trigger.body}}',
              action: 'classify',
            },
          },
        },
        {
          id: 'route',
          type: 'condition',
          data: {
            conditionType: 'expression',
            expression: '{{classify.category}}',
            branches: [
              { id: 'billing', label: 'Billing', condition: 'billing' },
              { id: 'technical', label: 'Technical', condition: 'technical' },
              { id: 'feature', label: 'Feature Request', condition: 'feature' },
              { id: 'general', label: 'General', condition: 'general' },
            ],
          },
        },
        {
          id: 'billingEscalate',
          type: 'tool',
          data: {
            toolId: 'slack_notify',
            inputMapping: {
              channel: '#billing-support',
              message: 'New billing ticket: {{ticket.summary}}',
            },
          },
        },
        {
          id: 'technicalRespond',
          type: 'agent',
          data: {
            agentId: 'supportAgent',
            inputMapping: { 
              ticket: '{{trigger.body}}',
              action: 'respond',
            },
          },
        },
        {
          id: 'featureLog',
          type: 'tool',
          data: {
            toolId: 'linear_create_issue',
            inputMapping: {
              title: '{{ticket.subject}}',
              description: '{{ticket.body}}',
              labels: ['feature-request', 'from-support'],
            },
          },
        },
        {
          id: 'sendResponse',
          type: 'tool',
          data: {
            toolId: 'intercom_reply',
            inputMapping: {
              conversationId: '{{ticket.id}}',
              message: '{{response.message}}',
            },
          },
        },
      ],
      edges: [
        { source: 'trigger', target: 'classify' },
        { source: 'classify', target: 'route' },
        { source: 'route', target: 'billingEscalate', sourceHandle: 'billing' },
        { source: 'route', target: 'technicalRespond', sourceHandle: 'technical' },
        { source: 'route', target: 'featureLog', sourceHandle: 'feature' },
        { source: 'route', target: 'technicalRespond', sourceHandle: 'general' },
        { source: 'technicalRespond', target: 'sendResponse' },
      ],
    },
  },

  // =====================================================
  // NEW USER ONBOARDING WORKFLOW
  // =====================================================

  newUserOnboarding: {
    name: 'New User Onboarding',
    description: 'Guided onboarding sequence for new signups',
    trigger: {
      type: 'event',
      config: { 
        source: 'clerk',
        eventType: 'user.created',
      },
    },
    definition: {
      nodes: [
        {
          id: 'trigger',
          type: 'trigger',
          data: { type: 'event' },
        },
        {
          id: 'createTenant',
          type: 'tool',
          data: {
            toolId: 'axiomiq_create_tenant',
            inputMapping: {
              userId: '{{trigger.user.id}}',
              email: '{{trigger.user.email}}',
              name: '{{trigger.user.firstName}}',
            },
          },
        },
        {
          id: 'sendWelcome',
          type: 'tool',
          data: {
            toolId: 'email_send',
            inputMapping: {
              to: '{{trigger.user.email}}',
              template: 'welcome_email',
              variables: { name: '{{trigger.user.firstName}}' },
            },
          },
        },
        {
          id: 'scheduleFollowup',
          type: 'tool',
          data: {
            toolId: 'scheduler_create',
            inputMapping: {
              workflowId: 'onboardingFollowup',
              runAt: '{{now + 24h}}',
              input: { userId: '{{trigger.user.id}}' },
            },
          },
        },
        {
          id: 'notifyTeam',
          type: 'tool',
          data: {
            toolId: 'slack_notify',
            inputMapping: {
              channel: '#new-signups',
              message: '🎉 New signup: {{trigger.user.email}}',
            },
          },
        },
      ],
      edges: [
        { source: 'trigger', target: 'createTenant' },
        { source: 'createTenant', target: 'sendWelcome' },
        { source: 'sendWelcome', target: 'scheduleFollowup' },
        { source: 'scheduleFollowup', target: 'notifyTeam' },
      ],
    },
  },

  // =====================================================
  // DAILY METRICS DIGEST
  // =====================================================

  dailyMetricsDigest: {
    name: 'Daily Metrics Digest',
    description: 'Automated daily report on key platform metrics',
    trigger: {
      type: 'schedule',
      config: { cron: '0 8 * * *', timezone: 'America/New_York' }, // 8am ET daily
    },
    definition: {
      nodes: [
        {
          id: 'trigger',
          type: 'trigger',
          data: { type: 'schedule' },
        },
        {
          id: 'gatherMetrics',
          type: 'agent',
          data: {
            agentId: 'analyticsReporter',
            inputMapping: { 
              reportType: 'daily',
              date: '{{trigger.date}}',
            },
          },
        },
        {
          id: 'checkAlerts',
          type: 'condition',
          data: {
            conditionType: 'expression',
            expression: '{{metrics.hasAlerts}}',
            branches: [
              { id: 'hasAlerts', label: 'Has Alerts', condition: 'true' },
              { id: 'normal', label: 'Normal', condition: 'false' },
            ],
          },
        },
        {
          id: 'sendAlertSlack',
          type: 'tool',
          data: {
            toolId: 'slack_notify',
            inputMapping: {
              channel: '#alerts',
              message: '⚠️ Metrics Alert:\n{{metrics.alertSummary}}',
            },
          },
        },
        {
          id: 'sendDigest',
          type: 'tool',
          data: {
            toolId: 'slack_notify',
            inputMapping: {
              channel: '#daily-metrics',
              message: '📊 Daily Metrics:\n{{metrics.summary}}',
            },
          },
        },
      ],
      edges: [
        { source: 'trigger', target: 'gatherMetrics' },
        { source: 'gatherMetrics', target: 'checkAlerts' },
        { source: 'checkAlerts', target: 'sendAlertSlack', sourceHandle: 'hasAlerts' },
        { source: 'checkAlerts', target: 'sendDigest', sourceHandle: 'normal' },
        { source: 'sendAlertSlack', target: 'sendDigest' },
      ],
    },
  },
};