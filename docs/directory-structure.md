axiomiq/
├── app/                              # Next.js App Router
│   │
│   ├── (marketing)/                  # Public marketing pages (no auth)
│   │   ├── layout.tsx
│   │   ├── page.tsx                  # Landing page
│   │   ├── pricing/
│   │   │   └── page.tsx
│   │   ├── docs/
│   │   │   └── [...slug]/
│   │   │       └── page.tsx
│   │   └── blog/
│   │       └── [...slug]/
│   │           └── page.tsx
│   │
│   ├── (auth)/                       # Auth pages (Clerk)
│   │   ├── sign-in/
│   │   │   └── [[...sign-in]]/
│   │   │       └── page.tsx
│   │   ├── sign-up/
│   │   │   └── [[...sign-up]]/
│   │   │       └── page.tsx
│   │   └── select-org/
│   │       └── page.tsx
│   │
│   ├── (dashboard)/                  # Protected dashboard (requires auth)
│   │   ├── layout.tsx                # Dashboard shell with sidebar
│   │   ├── dashboard/
│   │   │   └── page.tsx              # Overview/home
│   │   ├── workflows/
│   │   │   ├── page.tsx              # List workflows
│   │   │   ├── new/
│   │   │   │   └── page.tsx          # Create workflow
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # View/edit workflow
│   │   │       ├── builder/
│   │   │       │   └── page.tsx      # Visual workflow builder
│   │   │       └── runs/
│   │   │           └── page.tsx      # Execution history
│   │   ├── agents/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── tools/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── integrations/
│   │   │   ├── page.tsx              # Connected integrations
│   │   │   └── [provider]/
│   │   │       └── page.tsx          # Integration settings
│   │   ├── knowledge/
│   │   │   ├── page.tsx              # Knowledge base
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── analytics/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       ├── page.tsx              # General settings
│   │       ├── team/
│   │       │   └── page.tsx          # Team/org management
│   │       ├── billing/
│   │       │   └── page.tsx
│   │       ├── api-keys/
│   │       │   └── page.tsx          # Manage API keys
│   │       └── developer/
│   │           └── page.tsx          # Developer settings
│   │
│   ├── api/                          # API Routes
│   │   │
│   │   ├── v1/                       # ═══ PUBLIC API (versioned) ═══
│   │   │   │                         # External developers use these
│   │   │   │                         # Auth: API Key in header
│   │   │   │
│   │   │   ├── workflows/
│   │   │   │   ├── route.ts          # GET (list), POST (create)
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── route.ts      # GET, PUT, DELETE
│   │   │   │   │   ├── trigger/
│   │   │   │   │   │   └── route.ts  # POST - trigger workflow
│   │   │   │   │   └── runs/
│   │   │   │   │       └── route.ts  # GET - list runs
│   │   │   │   └── runs/
│   │   │   │       └── [runId]/
│   │   │   │           └── route.ts  # GET - run details
│   │   │   │
│   │   │   ├── agents/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts
│   │   │   │       └── invoke/
│   │   │   │           └── route.ts  # POST - invoke agent
│   │   │   │
│   │   │   ├── tools/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts
│   │   │   │       └── execute/
│   │   │   │           └── route.ts  # POST - execute tool
│   │   │   │
│   │   │   ├── knowledge/
│   │   │   │   ├── route.ts
│   │   │   │   ├── search/
│   │   │   │   │   └── route.ts      # POST - semantic search
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   │
│   │   │   └── chat/
│   │   │       └── route.ts          # POST - chat completions API
│   │   │
│   │   ├── internal/                 # ═══ PRIVATE API ═══
│   │   │   │                         # Dashboard uses these
│   │   │   │                         # Auth: Clerk session
│   │   │   │
│   │   │   ├── workflows/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts
│   │   │   │       ├── duplicate/
│   │   │   │       │   └── route.ts
│   │   │   │       └── versions/
│   │   │   │           └── route.ts
│   │   │   │
│   │   │   ├── agents/
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── tools/
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── integrations/
│   │   │   │   ├── route.ts          # List connected integrations
│   │   │   │   └── [provider]/
│   │   │   │       ├── route.ts      # GET, DELETE
│   │   │   │       └── test/
│   │   │   │           └── route.ts  # POST - test connection
│   │   │   │
│   │   │   ├── knowledge/
│   │   │   │   ├── route.ts
│   │   │   │   ├── upload/
│   │   │   │   │   └── route.ts      # POST - upload documents
│   │   │   │   └── sync/
│   │   │   │       └── route.ts      # POST - trigger sync
│   │   │   │
│   │   │   ├── analytics/
│   │   │   │   ├── overview/
│   │   │   │   │   └── route.ts
│   │   │   │   └── usage/
│   │   │   │       └── route.ts
│   │   │   │
│   │   │   ├── settings/
│   │   │   │   ├── route.ts
│   │   │   │   └── api-keys/
│   │   │   │       ├── route.ts      # GET, POST
│   │   │   │       └── [id]/
│   │   │   │           └── route.ts  # DELETE, regenerate
│   │   │   │
│   │   │   └── nango/
│   │   │       └── session/
│   │   │           └── route.ts      # POST - get Nango session token
│   │   │
│   │   └── webhooks/                 # ═══ INBOUND WEBHOOKS ═══
│   │       │                         # External services call these
│   │       │                         # Auth: Signature verification
│   │       │
│   │       ├── clerk/
│   │       │   └── route.ts          # Clerk user/org events
│   │       ├── nango/
│   │       │   └── route.ts          # Nango connection events
│   │       ├── stripe/
│   │       │   └── route.ts          # Stripe payment events
│   │       └── [provider]/
│   │           └── route.ts          # Dynamic webhook handlers
│   │
│   └── globals.css
│
├── components/                       # React Components
│   ├── ui/                           # shadcn/ui primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   │
│   ├── layout/                       # Layout components
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   ├── nav-item.tsx
│   │   └── org-switcher.tsx
│   │
│   ├── workflows/                    # Workflow-specific components
│   │   ├── workflow-card.tsx
│   │   ├── workflow-list.tsx
│   │   └── builder/
│   │       ├── canvas.tsx
│   │       ├── node-palette.tsx
│   │       ├── nodes/
│   │       │   ├── trigger-node.tsx
│   │       │   ├── agent-node.tsx
│   │       │   ├── tool-node.tsx
│   │       │   ├── condition-node.tsx
│   │       │   └── ...
│   │       └── panels/
│   │           ├── node-config-panel.tsx
│   │           └── execution-panel.tsx
│   │
│   ├── agents/
│   │   ├── agent-card.tsx
│   │   ├── agent-form.tsx
│   │   └── model-selector.tsx
│   │
│   ├── tools/
│   │   ├── tool-card.tsx
│   │   └── tool-form.tsx
│   │
│   ├── integrations/
│   │   ├── integration-card.tsx
│   │   ├── connect-button.tsx
│   │   └── integration-list.tsx
│   │
│   └── common/
│       ├── data-table.tsx
│       ├── empty-state.tsx
│       ├── loading.tsx
│       └── error-boundary.tsx
│
├── lib/                              # Core Libraries & Utilities
│   │
│   ├── api/                          # API utilities
│   │   ├── middleware/
│   │   │   ├── auth.ts               # Clerk auth middleware
│   │   │   ├── api-key.ts            # API key validation
│   │   │   ├── rate-limit.ts         # Rate limiting
│   │   │   └── webhook.ts            # Webhook signature verification
│   │   ├── errors.ts                 # API error classes
│   │   └── response.ts               # Standardized responses
│   │
│   ├── auth/                         # Authentication
│   │   ├── clerk.ts                  # Clerk helpers
│   │   └── api-keys.ts               # API key management
│   │
│   ├── db/                           # Database
│   │   ├── supabase/
│   │   │   ├── client.ts             # Browser client
│   │   │   ├── server.ts             # Server client (with Clerk)
│   │   │   └── admin.ts              # Service role client
│   │   ├── queries/
│   │   │   ├── workflows.ts
│   │   │   ├── agents.ts
│   │   │   ├── tools.ts
│   │   │   ├── executions.ts
│   │   │   └── integrations.ts
│   │   └── schema.ts                 # Type definitions
│   │
│   ├── ai/                           # AI/LLM
│   │   ├── providers/
│   │   │   ├── registry.ts           # Provider registry
│   │   │   └── config.ts             # Model configurations
│   │   ├── agents/
│   │   │   ├── supervisor.ts         # Supervisor agent
│   │   │   ├── worker.ts             # Worker agent base
│   │   │   └── types.ts
│   │   └── tools/
│   │       ├── registry.ts           # Tool registry
│   │       ├── gmail.ts
│   │       ├── slack.ts
│   │       ├── hubspot.ts
│   │       └── ...
│   │
│   ├── workflows/                    # Workflow Engine
│   │   ├── engine.ts                 # Main execution engine
│   │   ├── executor.ts               # Step executor
│   │   ├── scheduler.ts              # Cron/scheduled runs
│   │   ├── nodes/
│   │   │   ├── trigger.ts
│   │   │   ├── agent.ts
│   │   │   ├── tool.ts
│   │   │   ├── condition.ts
│   │   │   └── ...
│   │   └── types.ts
│   │
│   ├── integrations/                 # External Integrations
│   │   ├── nango/
│   │   │   ├── client.ts             # Nango SDK wrapper
│   │   │   └── proxy.ts              # API proxy helper
│   │   └── providers/
│   │       ├── gmail.ts
│   │       ├── slack.ts
│   │       └── ...
│   │
│   ├── knowledge/                    # RAG/Knowledge Base
│   │   ├── embeddings.ts             # Generate embeddings
│   │   ├── pinecone.ts               # Vector DB client
│   │   ├── chunker.ts                # Document chunking
│   │   └── retriever.ts              # RAG retrieval
│   │
│   ├── billing/                      # Billing/Stripe
│   │   ├── stripe.ts
│   │   └── usage.ts
│   │
│   └── utils/                        # General Utilities
│       ├── encryption.ts             # API key encryption
│       ├── validation.ts             # Zod schemas
│       └── helpers.ts
│
├── hooks/                            # React Hooks
│   ├── use-workflows.ts
│   ├── use-agents.ts
│   ├── use-integrations.ts
│   └── use-supabase.ts
│
├── stores/                           # State Management (Zustand)
│   ├── workflow-builder.ts           # Builder canvas state
│   └── user-preferences.ts
│
├── types/                            # TypeScript Types
│   ├── api.ts                        # API request/response types
│   ├── database.ts                   # Database row types
│   ├── workflow.ts                   # Workflow definitions
│   └── index.ts
│
├── config/                           # Configuration
│   ├── site.ts                       # Site metadata
│   ├── nav.ts                        # Navigation config
│   └── integrations.ts               # Available integrations
│
├── public/                           # Static Assets
│   ├── logo.svg
│   └── integrations/
│       ├── gmail.svg
│       ├── slack.svg
│       └── ...
│
├── supabase/                         # Supabase
│   ├── migrations/                   # SQL migrations
│   │   ├── 00001_initial_schema.sql
│   │   ├── 00002_rls_policies.sql
│   │   └── ...
│   ├── functions/                    # Edge Functions (optional)
│   └── config.toml
│
├── middleware.ts                     # Next.js Middleware
│                                     # - Route protection
│                                     # - Multi-tenant routing
│
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── .env.local