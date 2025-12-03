# AxiomIQ TODO List

This document tracks all pending implementation tasks identified during the directory structure refactoring.

---

## 🔴 Critical - Core Infrastructure

These items are blocking core functionality and should be prioritized first.

### 1. Database Setup (Supabase)

**Files affected:**
- `lib/db/supabase/server.ts`
- `lib/db/supabase/admin.ts`

**Tasks:**
- [ ] Implement actual Supabase client with Clerk integration
- [ ] Set up service role client for admin operations
- [ ] Configure Row Level Security (RLS) policies
- [ ] Create database schema (see `supabase/migrations/`)
- [ ] Test connection and authentication flow

**Current state:** Placeholder implementations return mock data

---

### 2. Authentication Integration (Clerk)

**Files affected:**
- `app/api/internal/nango/session/route.ts` (lines 9, 18-19)

**Tasks:**
- [ ] Get user/org ID from Clerk session
- [ ] Extract user email from Clerk
- [ ] Extract user display name from Clerk
- [ ] Implement proper session validation middleware
- [ ] Add Clerk provider to app layout

**Current state:** Using hardcoded placeholder values

---

## 🟡 High Priority - AI & Tools

These enable the core AI agent functionality.

### 3. AI SDK Tool Integration

**Files affected:**
- `lib/ai/tools/gmail.ts` (lines 5, 10, 15, 21)
- `lib/ai/tools/slack.ts` (line 5)
- `lib/ai/tools/hubspot.ts` (line 5)

**Tasks:**
- [ ] Install and configure proper AI SDK tool types
- [ ] Implement `sendEmailTool` with proper AI SDK signature
- [ ] Implement `searchEmailsTool` with proper AI SDK signature
- [ ] Implement `sendSlackMessageTool` with proper AI SDK signature
- [ ] Implement `createHubSpotContactTool` with proper AI SDK signature
- [ ] Implement `searchHubSpotContactsTool` with proper AI SDK signature
- [ ] Connect tools to Supabase for fetching integration connection IDs

**Current state:** Tool functions throw "not yet implemented" errors

**Reference:** AI SDK v5.0.106 is installed, need to configure proper tool signatures

---

### 4. LangGraph Agent Engine

**Files affected:**
- `lib/ai/agents/langgraph-engine.ts` (lines 48, 91, 123, 175-219)

**Tasks:**
- [ ] Implement handoff tools for worker agents (line 48-67)
- [ ] Parse tool call results to determine next action (line 91-104)
- [ ] Create tool registry and map tools to agents (line 123-127)
- [ ] Implement workflow execution with database persistence (line 175-220)
  - Create `loadWorkflow()` function
  - Create `loadTenant()` function
  - Create `createExecution()` function
  - Create `completeExecution()` function

**Current state:** Commented out due to AI SDK type issues

**Dependencies:** Requires AI SDK tools (#3) and database (#1)

---

### 5. AI Provider Registry

**Files affected:**
- `lib/ai/providers/registry.ts` (lines 7, 19, 32)

**Tasks:**
- [ ] Install `@ai-sdk/groq` package
- [ ] Implement tenant-specific API key configuration
- [ ] Add Groq provider to registry when package is installed
- [ ] Store tenant AI keys securely in database
- [ ] Create API key encryption/decryption helpers

**Current state:** Using default providers (reads from environment variables only)

---

## 🟢 Medium Priority - UI & UX

These improve the user experience but aren't blocking.

### 6. UI Components

**Files affected:**
- `components/ui/button.tsx`
- `components/ui/badge.tsx`
- `components/ui/card.tsx`
- `components/ui/use-toast.ts` (line 13)

**Tasks:**
- [ ] Implement proper shadcn/ui button with variants
- [ ] Implement proper shadcn/ui badge with variants
- [ ] Implement proper shadcn/ui card with styling
- [ ] Implement actual toast notification system
- [ ] Add remaining shadcn/ui primitives as needed

**Current state:** Minimal placeholders with no styling

**Recommendation:** Install shadcn/ui CLI and generate proper components

---

## 🔵 Low Priority - Enhancements

Nice to have features that can be implemented later.

### 7. Workflow Execution Features

**Files affected:**
- `lib/ai/agents/langgraph-engine.ts`

**Tasks:**
- [ ] Implement workflow versioning
- [ ] Add workflow execution history tracking
- [ ] Create workflow debugging/replay functionality
- [ ] Add execution metrics and analytics
- [ ] Implement workflow scheduling (cron triggers)

**Current state:** Basic structure in place, execution not implemented

---

### 8. Integration Enhancements

**Tasks:**
- [ ] Add more integration providers beyond Gmail, Slack, HubSpot
- [ ] Implement integration health checks
- [ ] Add integration usage analytics
- [ ] Create integration testing framework
- [ ] Add webhook signature verification for all providers

---

## 📋 Documentation TODOs

### 9. Code Documentation

**Tasks:**
- [ ] Add JSDoc comments to all exported functions
- [ ] Document API routes with OpenAPI/Swagger
- [ ] Create developer guide for adding new tools
- [ ] Create developer guide for adding new integrations
- [ ] Document database schema and relationships

---

## 🎯 Quick Wins

These are small tasks that provide immediate value:

1. **Install missing packages:**
   ```bash
   npm install @ai-sdk/groq
   ```

2. **Set up environment variables:**
   - Add `.env.local` template with all required variables
   - Document each environment variable

3. **Initialize Supabase:**
   - Create Supabase project
   - Run migrations from `supabase/migrations/`
   - Add connection string to `.env.local`

4. **Set up Clerk:**
   - Create Clerk application
   - Configure OAuth providers
   - Add Clerk keys to `.env.local`

5. **Install shadcn/ui:**
   ```bash
   npx shadcn-ui@latest init
   npx shadcn-ui@latest add button badge card toast
   ```

---

## 📊 Implementation Priority Matrix

| Priority | Category | Estimated Effort | Impact |
|----------|----------|-----------------|--------|
| 🔴 Critical | Database Setup | 4-6 hours | High |
| 🔴 Critical | Clerk Integration | 2-3 hours | High |
| 🟡 High | AI SDK Tools | 6-8 hours | High |
| 🟡 High | Agent Engine | 8-12 hours | High |
| 🟡 High | Provider Registry | 2-4 hours | Medium |
| 🟢 Medium | UI Components | 3-4 hours | Medium |
| 🔵 Low | Workflow Features | 8-12 hours | Medium |
| 🔵 Low | Integrations | Ongoing | Low |

---

## 🚀 Suggested Implementation Order

### Phase 1: Foundation (Week 1)
1. Set up Supabase with proper schema
2. Integrate Clerk authentication
3. Install and configure shadcn/ui components
4. Set up all environment variables

### Phase 2: Core Features (Week 2-3)
1. Implement AI SDK tools properly
2. Complete AI provider registry with tenant keys
3. Implement LangGraph agent engine
4. Connect tools to database for integration lookups

### Phase 3: Polish (Week 4)
1. Add workflow execution tracking
2. Implement toast notifications
3. Add error handling and validation
4. Write documentation

---

## 📝 Notes

- All placeholder implementations are marked with `TODO:` comments in the code
- Build succeeds without errors - all TODOs are non-blocking
- Current architecture supports the full AxiomIQ feature set once TODOs are complete
- Type safety is maintained throughout with TypeScript

---

**Last Updated:** December 2, 2025
**Generated by:** Claude Code during directory structure refactoring
