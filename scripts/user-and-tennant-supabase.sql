-- =====================================================
-- TENANT & USER MANAGEMENT
-- =====================================================

-- Tenants (Organizations/Workspaces)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,  -- subdomain
    plan VARCHAR(50) DEFAULT 'free',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (linked to Clerk)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenant Memberships (many-to-many with roles)
CREATE TABLE tenant_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',  -- owner, admin, member, viewer
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, user_id)
);

-- =====================================================
-- WORKFLOW & AGENT DEFINITIONS
-- =====================================================

-- Workflows (the visual flow definitions)
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    definition JSONB NOT NULL,  -- React Flow serialized state
    status VARCHAR(50) DEFAULT 'draft',  -- draft, active, paused, archived
    trigger_type VARCHAR(50),  -- manual, webhook, schedule, event
    trigger_config JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agents (reusable agent definitions)
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,  -- supervisor, worker, specialist
    system_prompt TEXT NOT NULL,
    model_config JSONB NOT NULL,  -- provider, model, temperature, etc.
    tools JSONB DEFAULT '[]',  -- array of tool IDs this agent can use
    created_by UUID REFERENCES users(id),
    is_template BOOLEAN DEFAULT FALSE,  -- marketplace-ready
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tools (individual capabilities)
CREATE TABLE tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,  -- mcp, api, function, integration
    definition JSONB NOT NULL,  -- tool schema, endpoint, etc.
    auth_config JSONB DEFAULT '{}',  -- how to authenticate
    created_by UUID REFERENCES users(id),
    is_template BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- EXECUTION & METRICS
-- =====================================================

-- Workflow Executions (runs)
CREATE TABLE workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL,  -- pending, running, completed, failed, cancelled
    trigger_type VARCHAR(50),
    trigger_data JSONB DEFAULT '{}',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    token_usage JSONB DEFAULT '{}',  -- {prompt: X, completion: Y, total: Z}
    cost_usd DECIMAL(10, 6),
    error_message TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Execution Steps (granular tracking)
CREATE TABLE execution_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID REFERENCES workflow_executions(id) ON DELETE CASCADE,
    step_type VARCHAR(50) NOT NULL,  -- agent, tool, condition, transform
    step_name VARCHAR(255),
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    tool_id UUID REFERENCES tools(id) ON DELETE SET NULL,
    input_data JSONB,
    output_data JSONB,
    status VARCHAR(50) NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    token_usage JSONB DEFAULT '{}',
    error_message TEXT
);

-- Metrics Aggregates (for dashboards)
CREATE TABLE metrics_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL,
    executions_total INTEGER DEFAULT 0,
    executions_success INTEGER DEFAULT 0,
    executions_failed INTEGER DEFAULT 0,
    total_duration_ms BIGINT DEFAULT 0,
    total_tokens BIGINT DEFAULT 0,
    total_cost_usd DECIMAL(12, 6) DEFAULT 0,
    UNIQUE(tenant_id, date, workflow_id)
);

-- =====================================================
-- KNOWLEDGE BASE (RAG)
-- =====================================================

-- Knowledge Sources
CREATE TABLE knowledge_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,  -- file, url, notion, gdrive, manual
    source_config JSONB DEFAULT '{}',
    sync_status VARCHAR(50) DEFAULT 'pending',
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge Documents (chunks indexed in Pinecone)
CREATE TABLE knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    source_id UUID REFERENCES knowledge_sources(id) ON DELETE CASCADE,
    title VARCHAR(500),
    content TEXT,
    metadata JSONB DEFAULT '{}',
    pinecone_ids TEXT[],  -- array of vector IDs
    chunk_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INTEGRATIONS & CREDENTIALS
-- =====================================================

-- Connected Integrations (OAuth via Nango)
CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    provider VARCHAR(100) NOT NULL,  -- gmail, slack, hubspot, etc.
    nango_connection_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    scopes TEXT[],
    connected_by UUID REFERENCES users(id),
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    UNIQUE(tenant_id, provider)
);

-- API Keys (for external services per tenant)
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(100) NOT NULL,  -- openai, anthropic, etc.
    key_encrypted TEXT NOT NULL,  -- encrypted with tenant-specific key
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's tenant IDs
CREATE OR REPLACE FUNCTION get_user_tenant_ids()
RETURNS UUID[] AS $$
BEGIN
    RETURN ARRAY(
        SELECT tenant_id 
        FROM tenant_memberships 
        WHERE user_id = (
            SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example RLS policies (apply to all tenant-scoped tables)
CREATE POLICY "Users can access their tenant data"
ON workflows FOR ALL
TO authenticated
USING (tenant_id = ANY(get_user_tenant_ids()));

CREATE POLICY "Users can access their tenant data"
ON agents FOR ALL
TO authenticated
USING (tenant_id = ANY(get_user_tenant_ids()));

-- Similar policies for all other tenant-scoped tables...