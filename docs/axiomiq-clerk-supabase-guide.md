# AxiomIQ: Clerk + Supabase Integration Guide

## Overview

This guide walks through integrating Clerk authentication with your existing Supabase project for AxiomIQ. The architecture uses:
- **Clerk**: Authentication, user management, organizations (tenants)
- **Supabase**: Database, RLS policies, storage, real-time

## Prerequisites

- [ ] Existing Vercel project with axiomiq.app domain
- [ ] Existing Supabase project integration
- [ ] Node.js 18+ installed

---

## Part 1: Clerk Setup

### Step 1: Create Clerk Application

1. Go to [clerk.com](https://clerk.com) and sign up
2. Create a new application named "AxiomIQ"
3. Select your authentication methods:
   - ✅ Email (recommended)
   - ✅ Google OAuth
   - ✅ GitHub OAuth (good for developer audience)
   - ✅ Microsoft (for enterprise later)

### Step 2: Get API Keys

In your Clerk Dashboard:
1. Go to **API Keys**
2. Copy:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

### Step 3: Enable Organizations

1. Go to **Configure** → **Settings** (under Organization management)
2. Toggle **Enable Organizations**
3. Configure settings:
   - Allow Personal Accounts: **ON** (for initial testing)
   - Default membership limit: **5** (free tier) or **Unlimited** (pro)
   - Deletable organizations: **ON**

### Step 4: Configure Clerk for Supabase

1. Go to **Configure** → **JWT Templates**
2. Click **New Template**
3. Select **Supabase** from the list
4. This creates a template that includes:
   ```json
   {
     "aud": "authenticated",
     "role": "authenticated",
     "email": "{{user.primary_email_address}}",
     "user_metadata": {
       "full_name": "{{user.full_name}}"
     }
   }
   ```
5. **Important**: Add organization claims by editing the template:
   ```json
   {
     "aud": "authenticated",
     "role": "authenticated",
     "email": "{{user.primary_email_address}}",
     "o": {
       "id": "{{org.id}}",
       "slug": "{{org.slug}}",
       "role": "{{org.role}}"
     },
     "user_metadata": {
       "full_name": "{{user.full_name}}"
     }
   }
   ```

### Step 5: Get Supabase Integration Values

1. In Clerk Dashboard, go to **Configure** → **Integrations** → **Supabase**
2. Note your **Clerk Domain** (e.g., `clerk.axiomiq.app`)
3. Copy the **JWKS URL** (e.g., `https://clerk.axiomiq.app/.well-known/jwks.json`)

---

## Part 2: Supabase Configuration

### Step 1: Add Clerk as Third-Party Auth Provider

1. In Supabase Dashboard, go to **Authentication** → **Sign In / Up**
2. Scroll to **Third Party Auth**
3. Click **Add provider**
4. Select **Clerk**
5. Enter:
   - **Domain**: Your Clerk domain (e.g., `clerk.axiomiq.app`)
   
Supabase will now verify JWTs using Clerk's JWKS endpoint.

### Step 2: Update RLS Policies for Multi-Tenancy

Create a helper function that extracts the owner ID (organization or user):

```sql
-- Helper function to get the current owner ID
-- Returns organization ID if active, otherwise user ID
CREATE OR REPLACE FUNCTION requesting_owner_id()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (SELECT auth.jwt() -> 'o' ->> 'id'),  -- Organization ID if present
    (SELECT auth.jwt() ->> 'sub')          -- User ID as fallback
  );
$$ LANGUAGE sql STABLE;

-- Helper function to get just the user ID (for user-specific data)
CREATE OR REPLACE FUNCTION requesting_user_id()
RETURNS TEXT AS $$
  SELECT auth.jwt() ->> 'sub';
$$ LANGUAGE sql STABLE;

-- Helper function to get organization role
CREATE OR REPLACE FUNCTION requesting_org_role()
RETURNS TEXT AS $$
  SELECT auth.jwt() -> 'o' ->> 'role';
$$ LANGUAGE sql STABLE;

-- Helper function to check if user has org admin role
CREATE OR REPLACE FUNCTION is_org_admin()
RETURNS BOOLEAN AS $$
  SELECT (auth.jwt() -> 'o' ->> 'role') = 'org:admin';
$$ LANGUAGE sql STABLE;
```

### Step 3: Create Core Tables with RLS

```sql
-- =====================================================
-- TENANTS TABLE (Organizations synced from Clerk)
-- =====================================================
CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,  -- Clerk organization ID
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    plan VARCHAR(50) DEFAULT 'free',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Tenants can only see their own tenant
CREATE POLICY "Users can view their own tenant"
ON tenants FOR SELECT
TO authenticated
USING (id = requesting_owner_id());

-- Only allow inserts via webhook (service role)
CREATE POLICY "Service role can manage tenants"
ON tenants FOR ALL
TO service_role
USING (true);

-- =====================================================
-- USERS TABLE (Synced from Clerk)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,  -- Clerk user ID
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can view themselves
CREATE POLICY "Users can view themselves"
ON users FOR SELECT
TO authenticated
USING (id = requesting_user_id());

-- Service role for webhook syncs
CREATE POLICY "Service role can manage users"
ON users FOR ALL
TO service_role
USING (true);

-- =====================================================
-- WORKFLOWS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id TEXT NOT NULL,  -- Tenant (org) or user ID
    name VARCHAR(255) NOT NULL,
    description TEXT,
    definition JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'draft',
    trigger_type VARCHAR(50),
    trigger_config JSONB DEFAULT '{}',
    created_by TEXT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

-- Users can view workflows belonging to their current context
CREATE POLICY "Users can view their workflows"
ON workflows FOR SELECT
TO authenticated
USING (owner_id = requesting_owner_id());

-- Users can create workflows in their current context
CREATE POLICY "Users can create workflows"
ON workflows FOR INSERT
TO authenticated
WITH CHECK (owner_id = requesting_owner_id());

-- Users can update their own workflows
CREATE POLICY "Users can update their workflows"
ON workflows FOR UPDATE
TO authenticated
USING (owner_id = requesting_owner_id());

-- Only org admins can delete workflows
CREATE POLICY "Admins can delete workflows"
ON workflows FOR DELETE
TO authenticated
USING (
    owner_id = requesting_owner_id() 
    AND (is_org_admin() OR requesting_org_role() IS NULL)
);

-- =====================================================
-- AGENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL DEFAULT 'worker',
    system_prompt TEXT NOT NULL,
    model_config JSONB NOT NULL DEFAULT '{}',
    tools JSONB DEFAULT '[]',
    created_by TEXT REFERENCES users(id),
    is_template BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their agents"
ON agents FOR SELECT
TO authenticated
USING (owner_id = requesting_owner_id());

CREATE POLICY "Users can create agents"
ON agents FOR INSERT
TO authenticated
WITH CHECK (owner_id = requesting_owner_id());

CREATE POLICY "Users can update their agents"
ON agents FOR UPDATE
TO authenticated
USING (owner_id = requesting_owner_id());

CREATE POLICY "Admins can delete agents"
ON agents FOR DELETE
TO authenticated
USING (
    owner_id = requesting_owner_id() 
    AND (is_org_admin() OR requesting_org_role() IS NULL)
);

-- =====================================================
-- WORKFLOW EXECUTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id TEXT NOT NULL,
    workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    trigger_type VARCHAR(50),
    trigger_data JSONB DEFAULT '{}',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    token_usage JSONB DEFAULT '{}',
    cost_usd DECIMAL(10, 6),
    error_message TEXT,
    metadata JSONB DEFAULT '{}'
);

ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their executions"
ON workflow_executions FOR SELECT
TO authenticated
USING (owner_id = requesting_owner_id());

CREATE POLICY "Users can create executions"
ON workflow_executions FOR INSERT
TO authenticated
WITH CHECK (owner_id = requesting_owner_id());

-- =====================================================
-- API KEYS TABLE (for AI providers)
-- =====================================================
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    key_encrypted TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by TEXT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Only org admins can view API keys
CREATE POLICY "Admins can view API keys"
ON api_keys FOR SELECT
TO authenticated
USING (
    owner_id = requesting_owner_id() 
    AND (is_org_admin() OR requesting_org_role() IS NULL)
);

CREATE POLICY "Admins can manage API keys"
ON api_keys FOR ALL
TO authenticated
USING (
    owner_id = requesting_owner_id() 
    AND (is_org_admin() OR requesting_org_role() IS NULL)
);
```

---

## Part 3: Next.js Integration

### Step 1: Install Dependencies

```bash
pnpm add @clerk/nextjs @supabase/supabase-js @supabase/ssr
```

### Step 2: Environment Variables

Add to your `.env.local`:

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Only for server-side/webhooks
```

### Step 3: Clerk Middleware

Create `middleware.ts` in your project root:

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/pricing',
  '/docs(.*)',
  '/blog(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
]);

// Routes that require an organization context
const requiresOrg = createRouteMatcher([
  '/dashboard(.*)',
  '/workflows(.*)',
  '/agents(.*)',
  '/tools(.*)',
  '/settings/team(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  // Allow public routes
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  // Protect all other routes
  const { userId, orgId } = await auth.protect();

  // If route requires org but user doesn't have one, redirect to org selection
  if (requiresOrg(request) && !orgId) {
    const orgSelection = new URL('/select-org', request.url);
    return NextResponse.redirect(orgSelection);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
```

### Step 4: Clerk Provider Layout

Update `app/layout.tsx`:

```typescript
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

### Step 5: Supabase Client with Clerk Token

Create `lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr';
import { useSession } from '@clerk/nextjs';

export function createClerkSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Hook for client components
export function useSupabaseClient() {
  const { session } = useSession();

  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      accessToken: async () => {
        return session?.getToken({ template: 'supabase' }) ?? null;
      },
    }
  );

  return client;
}
```

Create `lib/supabase/server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { auth } from '@clerk/nextjs/server';

export async function createClerkSupabaseServerClient() {
  const { getToken } = await auth();
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component - ignore
          }
        },
      },
      accessToken: async () => {
        return (await getToken({ template: 'supabase' })) ?? null;
      },
    }
  );
}

// Service role client for webhooks/admin operations
export function createServiceRoleClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  );
}
```

### Step 6: Auth Pages

Create `app/sign-in/[[...sign-in]]/page.tsx`:

```typescript
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  );
}
```

Create `app/sign-up/[[...sign-up]]/page.tsx`:

```typescript
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp />
    </div>
  );
}
```

Create `app/select-org/page.tsx`:

```typescript
import { OrganizationList } from '@clerk/nextjs';

export default function SelectOrgPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Select or Create a Workspace</h1>
      <p className="text-muted-foreground">
        Choose an existing workspace or create a new one to get started.
      </p>
      <OrganizationList
        afterSelectOrganizationUrl="/dashboard"
        afterCreateOrganizationUrl="/dashboard"
      />
    </div>
  );
}
```

### Step 7: Dashboard with Organization Switcher

Create `app/dashboard/layout.tsx`:

```typescript
import { OrganizationSwitcher, UserButton } from '@clerk/nextjs';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-gray-50 p-4">
        <div className="mb-8">
          <h1 className="text-xl font-bold">AxiomIQ</h1>
        </div>
        
        {/* Organization Switcher */}
        <div className="mb-6">
          <OrganizationSwitcher
            appearance={{
              elements: {
                rootBox: 'w-full',
                organizationSwitcherTrigger: 'w-full justify-between',
              },
            }}
            afterSelectOrganizationUrl="/dashboard"
            afterCreateOrganizationUrl="/dashboard"
          />
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          <a href="/dashboard" className="block rounded px-3 py-2 hover:bg-gray-200">
            Dashboard
          </a>
          <a href="/workflows" className="block rounded px-3 py-2 hover:bg-gray-200">
            Workflows
          </a>
          <a href="/agents" className="block rounded px-3 py-2 hover:bg-gray-200">
            Agents
          </a>
          <a href="/tools" className="block rounded px-3 py-2 hover:bg-gray-200">
            Tools
          </a>
          <a href="/knowledge" className="block rounded px-3 py-2 hover:bg-gray-200">
            Knowledge Base
          </a>
          <a href="/settings" className="block rounded px-3 py-2 hover:bg-gray-200">
            Settings
          </a>
        </nav>

        {/* User Button at Bottom */}
        <div className="absolute bottom-4 left-4">
          <UserButton afterSignOutUrl="/" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
```

### Step 8: Clerk Webhooks for Supabase Sync

Create `app/api/webhooks/clerk/route.ts`:

```typescript
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    throw new Error('Missing CLERK_WEBHOOK_SECRET');
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return new Response('Webhook verification failed', { status: 400 });
  }

  const supabase = createServiceRoleClient();

  // Handle different event types
  switch (evt.type) {
    case 'user.created':
    case 'user.updated': {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;
      const primaryEmail = email_addresses.find(e => e.id === evt.data.primary_email_address_id);
      
      await supabase.from('users').upsert({
        id,
        email: primaryEmail?.email_address || '',
        full_name: [first_name, last_name].filter(Boolean).join(' '),
        avatar_url: image_url,
        updated_at: new Date().toISOString(),
      });
      break;
    }

    case 'user.deleted': {
      await supabase.from('users').delete().eq('id', evt.data.id);
      break;
    }

    case 'organization.created':
    case 'organization.updated': {
      const { id, name, slug } = evt.data;
      
      await supabase.from('tenants').upsert({
        id,
        name,
        slug,
        updated_at: new Date().toISOString(),
      });
      break;
    }

    case 'organization.deleted': {
      await supabase.from('tenants').delete().eq('id', evt.data.id);
      break;
    }
  }

  return new Response('OK', { status: 200 });
}
```

### Step 9: Configure Clerk Webhooks

1. In Clerk Dashboard, go to **Configure** → **Webhooks**
2. Click **Add Endpoint**
3. Enter URL: `https://axiomiq.app/api/webhooks/clerk`
4. Select events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
   - `organization.created`
   - `organization.updated`
   - `organization.deleted`
5. Copy the **Signing Secret** to your `CLERK_WEBHOOK_SECRET` env var

---

## Part 4: Testing the Integration

### Step 1: Local Testing

1. Run your dev server:
   ```bash
   pnpm dev
   ```

2. Visit `http://localhost:3000/sign-up`
3. Create an account
4. You should be redirected to create/select an organization
5. Create an organization (this is your first tenant!)

### Step 2: Verify Supabase Sync

1. Check Supabase Dashboard → Table Editor
2. Verify `users` table has your user
3. Verify `tenants` table has your organization

### Step 3: Test RLS Policies

In Supabase SQL Editor:

```sql
-- Test as your user (replace with actual Clerk user ID)
-- This simulates a request with a valid JWT

-- Should return your tenant
SELECT * FROM tenants;

-- Create a test workflow
INSERT INTO workflows (owner_id, name, definition)
VALUES ('org_xxx', 'Test Workflow', '{}');

-- Should return only your workflows
SELECT * FROM workflows;
```

---

## Part 5: Vercel Deployment

### Step 1: Add Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

### Step 2: Deploy

```bash
git add .
git commit -m "Add Clerk authentication"
git push
```

### Step 3: Update Clerk Production Settings

1. In Clerk Dashboard, switch to **Production** instance
2. Update allowed origins to include `axiomiq.app`
3. Update webhook URL to production endpoint

---

## Summary: What You Get

After this integration, you have:

✅ **User Authentication**: Sign up, sign in, social login, MFA
✅ **Organization Management**: Create teams, invite members, switch contexts
✅ **Multi-Tenant Database**: RLS policies isolate data by organization
✅ **Synced Data**: Clerk users/orgs automatically sync to Supabase
✅ **Role-Based Access**: Admin vs member roles for organizations
✅ **Beautiful UI**: Clerk's pre-built components with customization

Your AxiomIQ users can:
1. Sign up with email or social login
2. Create their workspace (organization)
3. Invite team members
4. Switch between personal and team contexts
5. All while data stays properly isolated in Supabase

---

## Next Steps

1. [ ] Customize Clerk appearance to match AxiomIQ brand
2. [ ] Add custom organization metadata (plan, settings)
3. [ ] Implement billing integration (Clerk + Stripe)
4. [ ] Set up domain verification for enterprise SSO
5. [ ] Add onboarding flow after organization creation
