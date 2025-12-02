# AxiomIQ Phase 1 MVP: Quick Start Checklist

## Week 0: Pre-Development Setup (Do This First)

### Account Creation
- [ ] **Vercel** - Create Pro account at vercel.com (needed for multi-tenant features)
- [ ] **Supabase** - Create project at supabase.com (free tier works for MVP)
- [ ] **Clerk** - Create application at clerk.com (free tier includes 10K MAU)
- [ ] **Pinecone** - Create index at pinecone.io (free tier includes 100K vectors)
- [ ] **Nango** - Create account at nango.dev (free tier includes 3 integrations)

### AI Provider API Keys
- [ ] **OpenAI** - Get API key from platform.openai.com
- [ ] **Anthropic** - Get API key from console.anthropic.com
- [ ] **Google AI** - Get API key from aistudio.google.com
- [ ] **Groq** - Get API key from console.groq.com (free tier, fast inference)

### Domain Setup
- [ ] Register `axiomiq.com` (or your chosen domain)
- [ ] Register `axiomiq.app` for tenant subdomains
- [ ] Configure DNS to point to Vercel
- [ ] Set up wildcard subdomain (`*.axiomiq.app`)

### Development Environment
- [ ] Node.js 20+ installed
- [ ] pnpm installed (`npm install -g pnpm`)
- [ ] VS Code with recommended extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - Prisma (for schema visualization)
- [ ] Git repository created (GitHub recommended for Vercel integration)

---

## Week 1 Day-by-Day Plan

### Monday: Project Initialization

```bash
# Create Next.js project
pnpm create next-app@latest axiomiq --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

cd axiomiq

# Install core dependencies
pnpm add @clerk/nextjs @supabase/supabase-js @vercel/kv @vercel/blob
pnpm add ai @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google
pnpm add @langchain/langgraph @langchain/core
pnpm add reactflow zustand zod
pnpm add @nangohq/node @nangohq/frontend

# Install UI dependencies
pnpm add class-variance-authority clsx tailwind-merge lucide-react
pnpm dlx shadcn@latest init

# Install dev dependencies
pnpm add -D @types/node typescript
```

### Tuesday: Vercel & Database Setup

1. Push to GitHub
2. Import to Vercel
3. Create Supabase project
4. Run initial migration (from spec document)
5. Configure environment variables in Vercel

### Wednesday: Authentication Setup

```typescript
// middleware.ts - Basic Clerk setup
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/pricing',
  '/docs(.*)',
  '/api/webhooks(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

### Thursday: Multi-Tenant Middleware

```typescript
// middleware.ts - Extended with tenant routing
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  
  // Extract subdomain
  const subdomain = hostname.split('.')[0];
  
  // Skip for main domains
  if (subdomain === 'www' || subdomain === 'axiomiq' || subdomain === 'app') {
    return NextResponse.next();
  }
  
  // Rewrite to tenant-specific route
  const url = request.nextUrl.clone();
  url.pathname = `/domains/${subdomain}${url.pathname}`;
  
  return NextResponse.rewrite(url);
}
```

### Friday: Basic Dashboard Shell

- Set up app layout
- Create navigation components
- Build settings pages skeleton
- Test authentication flow end-to-end

---

## Critical First Decisions

### 1. Domain Strategy
**Recommended**: 
- `axiomiq.com` → Marketing, docs, blog
- `app.axiomiq.com` → Main app login
- `[tenant].axiomiq.app` → Tenant workspaces

### 2. Pricing Model (Placeholder for MVP)
For dogfooding phase, implement usage tracking but no billing:
- Track workflow executions
- Track token usage per provider
- Track storage usage
- Build towards usage-based or seat-based later

### 3. Initial Integrations (Week 11)
Start with these 5:
1. **Gmail** - Email sending/reading
2. **Slack** - Notifications, team comms
3. **HubSpot** - CRM, lead management
4. **Notion** - Documentation, wiki
5. **Linear** - Issue tracking, feedback

### 4. First Agent to Build
**Recommendation**: Start with the Support Agent
- Simpler scope (Q&A pattern)
- Immediate utility (answer your own questions about the platform)
- Tests RAG pipeline
- Foundation for onboarding guide

---

## Cost Estimates (Monthly at MVP Scale)

| Service | Tier | Estimated Cost |
|---------|------|----------------|
| Vercel | Pro | $20/month |
| Supabase | Free → Pro | $0-25/month |
| Clerk | Free tier | $0 |
| Pinecone | Free tier | $0 |
| Nango | Free tier | $0 |
| OpenAI | Usage | ~$50-100/month |
| Anthropic | Usage | ~$30-50/month |
| **Total** | | **~$100-200/month** |

---

## Risk Mitigation

### Technical Risks
| Risk | Mitigation |
|------|------------|
| LangGraph complexity | Start with simple single-agent flows first |
| Multi-tenant data leakage | RLS policies + integration tests |
| AI costs spiral | Implement cost tracking + alerts early |
| Integration failures | Graceful degradation, retry logic |

### Timeline Risks
| Risk | Mitigation |
|------|------------|
| Scope creep | Strict MVP feature list |
| Dependency delays | Parallel workstreams where possible |
| Learning curve | Build prototypes before committing |

---

## Success Criteria for MVP Launch

### Must Have (Week 16)
- [ ] Can create a workflow visually
- [ ] Can define and configure agents
- [ ] Can execute workflows manually
- [ ] Can view execution logs
- [ ] At least 3 integrations working
- [ ] RAG knowledge base functional
- [ ] Multi-tenant isolation verified

### Nice to Have (Post-MVP)
- [ ] Scheduled executions
- [ ] Webhook triggers
- [ ] Advanced analytics
- [ ] Team collaboration features
- [ ] White-label customization

---

## Next Steps After Reading This

1. **Today**: Create accounts (Vercel, Supabase, Clerk)
2. **Tomorrow**: Initialize project, push to GitHub
3. **This Week**: Complete Week 1 foundation setup
4. **Weekly**: Review progress against roadmap
5. **Bi-weekly**: Demo to yourself (dogfooding check)

---

## Resources & References

### Documentation Links
- [Next.js App Router](https://nextjs.org/docs/app)
- [Vercel Platforms Starter Kit](https://github.com/vercel/platforms)
- [Vercel AI SDK](https://ai-sdk.dev)
- [LangGraph](https://langchain-ai.github.io/langgraph/)
- [React Flow](https://reactflow.dev)
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Clerk Multi-Tenant](https://clerk.com/docs/organizations/overview)
- [Nango Docs](https://docs.nango.dev)

### Learning Resources
- [LangChain Academy - LangGraph Course](https://academy.langchain.com)
- [Vercel AI SDK Examples](https://github.com/vercel/ai/tree/main/examples)
- [React Flow Examples](https://reactflow.dev/examples)

### Community & Support
- [Vercel Discord](https://vercel.com/discord)
- [LangChain Discord](https://discord.gg/langchain)
- [Supabase Discord](https://discord.supabase.com)

---

*Keep this checklist handy and check off items as you progress!*
