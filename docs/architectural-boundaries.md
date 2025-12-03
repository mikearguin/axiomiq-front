# Architectural Boundaries

This document defines the import restrictions and boundaries within the AxiomIQ codebase to maintain separation of concerns and enable future extraction of the public API.

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        AXIOMIQ MONOREPO                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Marketing     │  │   Dashboard     │  │  Auth Pages │ │
│  │  (Public Site)  │  │  (Protected)    │  │   (Clerk)   │ │
│  │                 │  │                 │  │             │ │
│  │  app/(marketing)│  │ app/(dashboard) │  │  app/(auth) │ │
│  └────────┬────────┘  └────────┬────────┘  └──────┬──────┘ │
│           │                    │                   │        │
│           └────────────────────┼───────────────────┘        │
│                                │                            │
│           ┌────────────────────▼────────────────────┐       │
│           │         UI LAYER (Browser Only)         │       │
│           │  @/components  @/hooks  @/stores        │       │
│           └────────────────────┬────────────────────┘       │
│                                │                            │
│  ─────────────────────────────────────────────────────────  │
│                                                               │
│           ┌────────────────────▼────────────────────┐       │
│           │          SHARED LAYER                   │       │
│           │    @/types  @/lib/shared  @/config      │       │
│           │   (Can be extracted to npm package)     │       │
│           └────────────────────┬────────────────────┘       │
│                                │                            │
│  ─────────────────────────────────────────────────────────  │
│                                │                            │
│      ┌──────────────┬──────────┼──────────┬──────────────┐ │
│      │              │          │          │              │ │
│  ┌───▼────┐    ┌───▼────┐ ┌───▼────┐ ┌───▼────┐  ┌─────▼──┐
│  │ Public │    │Internal│ │Webhooks│ │  @/lib │  │ @/lib  │
│  │  API   │    │  API   │ │  API   │ │   /ai  │  │  /db   │
│  │  (v1)  │    │(Clerk) │ │(Nango) │ │        │  │        │
│  │        │    │        │ │        │ │integra-│  │        │
│  │External│    │Dashbrd │ │External│ │ tions  │  │        │
│  └────────┘    └────────┘ └────────┘ └────────┘  └────────┘
│                                                               │
│                      API/BACKEND LAYER                        │
└─────────────────────────────────────────────────────────────┘
```

## 🚧 Import Restrictions

### Public API (`app/api/v1/**`) - MOST RESTRICTIVE

**Purpose:** External developers use this API with API keys. Must be completely independent of UI code.

**Can import:**
- ✅ `@/types/*` - Shared TypeScript types
- ✅ `@/lib/shared/*` - Pure utilities with no dependencies
- ✅ `@/lib/api/*` - API-specific utilities
- ✅ `@/lib/ai/*` - AI/ML functionality
- ✅ `@/lib/db/*` - Database clients
- ✅ `@/lib/integrations/*` - Third-party integrations
- ✅ `@/lib/workflows/*` - Workflow execution logic
- ✅ `@/config/*` - Configuration constants

**Cannot import:**
- ❌ `@/components/*` - React components
- ❌ `@/hooks/*` - React hooks
- ❌ `@/stores/*` - Client state management
- ❌ `@/app/(dashboard)/*` - Dashboard pages
- ❌ `@/app/(marketing)/*` - Marketing pages
- ❌ `@/app/api/internal/*` - Internal API (different auth)

**ESLint enforcement:** ✅ Enabled

---

### Internal API (`app/api/internal/**`) - MODERATE RESTRICTIONS

**Purpose:** Dashboard uses this API with Clerk sessions. Tightly coupled to dashboard UX.

**Can import:**
- ✅ Everything that Public API can import
- ✅ `@/components/*` - If needed for server components
- ✅ `@/app/(dashboard)/*` - Can share logic with dashboard

**Cannot import:**
- ⚠️ `@/app/(marketing)/*` - Different layout/context
- ⚠️ `@/app/api/v1/*` - Different auth mechanism

**ESLint enforcement:** ✅ Enabled (warnings)

---

### Webhooks API (`app/api/webhooks/**`) - MODERATE RESTRICTIONS

**Purpose:** External services (Nango, Stripe, etc.) call these endpoints.

**Can import:**
- ✅ Same as Public API

**Cannot import:**
- ❌ Same restrictions as Public API

**ESLint enforcement:** ✅ Enabled

---

### Dashboard Pages (`app/(dashboard)/**`)

**Purpose:** Protected pages requiring authentication.

**Can import:**
- ✅ `@/components/*` - React components
- ✅ `@/hooks/*` - React hooks
- ✅ `@/stores/*` - Client state
- ✅ `@/lib/*` - All utilities
- ✅ `@/types/*` - Shared types

**Cannot import:**
- ⚠️ `@/app/api/v1/*` - Don't import route handlers, use fetch()
- ⚠️ `@/app/api/internal/*` - Don't import route handlers, use fetch()
- ⚠️ `@/app/api/webhooks/*` - Don't import route handlers

**ESLint enforcement:** ✅ Enabled (warnings)

---

### Marketing Pages (`app/(marketing)/**`)

**Purpose:** Public marketing website, no authentication.

**Can import:**
- ✅ `@/components/*` - React components (marketing-specific)
- ✅ `@/lib/shared/*` - Pure utilities
- ✅ `@/types/*` - Shared types

**Cannot import:**
- ⚠️ `@/app/(dashboard)/*` - Different layout/auth
- ⚠️ `@/app/api/*` - Don't import route handlers, use fetch()
- ⚠️ `@/hooks/*` - If dashboard-specific
- ⚠️ `@/stores/*` - If dashboard-specific

**ESLint enforcement:** ✅ Enabled (warnings)

---

## 📁 Directory Purpose & Scope

| Directory | Scope | Can Be Extracted? |
|-----------|-------|-------------------|
| `app/(marketing)/` | Marketing site UI | ❌ Stays with web app |
| `app/(dashboard)/` | Dashboard UI | ❌ Stays with web app |
| `app/api/v1/` | Public API routes | ✅ **Can become separate API** |
| `app/api/internal/` | Internal API routes | ❌ Stays with dashboard |
| `app/api/webhooks/` | Webhook handlers | ⚠️ Could go either way |
| `components/` | React components | ❌ Stays with web app |
| `hooks/` | React hooks | ❌ Stays with web app |
| `stores/` | Client state (Zustand) | ❌ Stays with web app |
| `lib/shared/` | Pure utilities | ✅ **Becomes npm package** |
| `lib/api/` | API-specific logic | ✅ **Goes with API** |
| `lib/ai/` | AI/ML functionality | ✅ **Goes with API** |
| `lib/db/` | Database clients | ✅ **Goes with API** |
| `lib/integrations/` | Third-party integrations | ✅ **Goes with API** |
| `lib/workflows/` | Workflow execution | ✅ **Goes with API** |
| `types/` | TypeScript types | ✅ **Becomes npm package** |
| `config/` | Configuration | ✅ **Becomes npm package** |

## 🔍 Checking Boundaries

### Run ESLint
```bash
npm run lint
```

ESLint will catch violations like:
```
❌ app/api/v1/workflows/route.ts
  Error: Public API (v1) cannot import UI code (@/components/workflow-builder)
  This violates the API/UI boundary.
```

### Manual Verification Script

Run the boundary checker:
```bash
npm run check:boundaries
```

This will scan for:
- Imports of `@/components`, `@/hooks`, `@/stores` in API routes
- Direct imports of API route handlers in pages
- Cross-boundary violations

## 🎯 Design Principles

### 1. **Data Flow Direction**
- Pages/Components → API Routes (via fetch)
- API Routes → Lib (business logic)
- Lib → Database/Integrations
- **Never reverse direction** (API importing from pages)

### 2. **Shared Code Philosophy**
- If code is used by **both API and UI**: put it in `lib/shared/`
- If code is **API-only**: put it in `lib/api/`, `lib/ai/`, etc.
- If code is **UI-only**: put it in `components/`, `hooks/`, `stores/`

### 3. **Future-Proof Extraction**
- Public API code should have **zero knowledge** of the dashboard
- Shared types and utilities should have **zero dependencies** on Next.js
- Database/integration logic should be **framework-agnostic**

## 🚀 Migration Path: Monorepo → Multi-Repo

If/when we separate the API:

### Step 1: Extract Shared Code
```bash
# Create new package
mkdir axiomiq-shared
cp -r lib/shared axiomiq-shared/src
cp -r types axiomiq-shared/src
cp -r config axiomiq-shared/src

# Publish to npm
cd axiomiq-shared
npm publish
```

### Step 2: Extract Public API
```bash
# Create new repo
mkdir axiomiq-api
cp -r app/api/v1 axiomiq-api/src/routes
cp -r lib/api axiomiq-api/src/lib
cp -r lib/ai axiomiq-api/src/lib
cp -r lib/db axiomiq-api/src/lib
cp -r lib/integrations axiomiq-api/src/lib
cp -r lib/workflows axiomiq-api/src/lib

# Install shared package
cd axiomiq-api
npm install @axiomiq/shared
```

### Step 3: Update Web App
```bash
# Remove extracted code
rm -rf app/api/v1
rm -rf lib/api

# Install shared package
npm install @axiomiq/shared

# Update dashboard to call external API
# (Change from /api/v1 to https://api.axiomiq.com/v1)
```

## ✅ Validation Checklist

Before separating the API, ensure:

- [ ] All `app/api/v1/**` files import only from allowed directories
- [ ] No `@/components`, `@/hooks`, `@/stores` in public API
- [ ] All shared types are in `types/` directory
- [ ] All shared utilities are in `lib/shared/`
- [ ] Public API tests pass independently
- [ ] No circular dependencies between API and UI
- [ ] Database migrations are in separate directory
- [ ] Environment variables are documented

## 📚 References

- [AxiomIQ Directory Structure](./directory-structure.md)
- [TODO List](../TODO.md)
- [ESLint Configuration](../eslint.config.mjs)
- [TypeScript Configuration](../tsconfig.json)
