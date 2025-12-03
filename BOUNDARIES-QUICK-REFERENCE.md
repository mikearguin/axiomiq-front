# Architectural Boundaries - Quick Reference

## 🎯 TL;DR

Your code now has **enforced boundaries** to keep the public API separate from UI code, making future extraction easy.

## ⚡ Quick Commands

```bash
# Check for boundary violations
npm run check:boundaries

# Run linter (includes boundary checks)
npm run lint

# Build (TypeScript will catch type errors)
npm run build
```

## 🚦 Import Rules by Location

### When writing code in `app/api/v1/` (Public API)

✅ **Can import:**
```typescript
import { WorkflowDefinition } from '@/types/workflow';
import { validateEmail } from '@/lib/shared/utils';
import { executeWorkflow } from '@/lib/workflows/executor';
import { nango } from '@/lib/integrations/nango/client';
```

❌ **Cannot import:**
```typescript
// ❌ NO UI CODE
import { Button } from '@/components/ui/button';
import { useWorkflow } from '@/hooks/use-workflow';
import { workflowStore } from '@/stores/workflow';

// ❌ NO PAGE CODE
import { WorkflowBuilder } from '@/app/(dashboard)/workflows/builder';
```

---

### When writing code in `app/(dashboard)/` (Dashboard)

✅ **Can import:**
```typescript
import { Button } from '@/components/ui/button';
import { useWorkflow } from '@/hooks/use-workflow';
import { WorkflowDefinition } from '@/types/workflow';
```

❌ **Cannot import:**
```typescript
// ❌ Don't import route handlers - use fetch() instead
import { GET } from '@/app/api/v1/workflows/route';

// ✅ Do this instead:
const response = await fetch('/api/v1/workflows');
```

---

### When writing code in `lib/shared/`

✅ **Can import:**
```typescript
import { z } from 'zod';
import type { WorkflowDefinition } from '@/types/workflow';
```

❌ **Cannot import:**
```typescript
// ❌ NO REACT
import { useState } from 'react';

// ❌ NO NEXT.JS
import { cookies } from 'next/headers';

// ❌ NO UI UTILITIES
import { cn } from '@/lib/utils';
```

---

## 📁 Where to Put New Code?

| I'm writing... | Put it in... | Can import from... |
|---------------|-------------|-------------------|
| React component | `components/` | Other components, hooks, stores |
| React hook | `hooks/` | Components, stores, lib/shared |
| API endpoint | `app/api/v1/` | lib/api, lib/ai, lib/db, types |
| Business logic (API) | `lib/api/` | lib/shared, types |
| Business logic (both) | `lib/shared/` | Pure utils only |
| Database query | `lib/db/` | Supabase client |
| AI/ML code | `lib/ai/` | AI SDKs, lib/shared |
| Type definition | `types/` | Other types |

---

## 🔍 How to Check Violations

### ESLint (Automatic)

ESLint will show errors like:
```
❌ app/api/v1/workflows/route.ts
  Error: Public API (v1) cannot import UI code (@/components/button)
  This violates the API/UI boundary.
```

### Boundary Script

```bash
npm run check:boundaries
```

Output:
```
✅ Public API boundary clean
✅ No internal API imports in public API
✅ Webhooks boundary clean
✅ Dashboard uses proper API calls
✅ Marketing is isolated from Dashboard
✅ lib/shared is framework-agnostic

✅ All boundary checks passed!
```

---

## 🚨 Common Violations & Fixes

### ❌ Problem: Public API importing components

```typescript
// ❌ app/api/v1/workflows/route.ts
import { WorkflowCard } from '@/components/workflow-card';
```

✅ **Fix:** Move shared logic to lib
```typescript
// ✅ lib/api/workflow-helpers.ts
export function formatWorkflowResponse(workflow: Workflow) {
  return { id: workflow.id, name: workflow.name };
}

// ✅ app/api/v1/workflows/route.ts
import { formatWorkflowResponse } from '@/lib/api/workflow-helpers';
```

---

### ❌ Problem: Dashboard importing API route handler

```typescript
// ❌ app/(dashboard)/workflows/page.tsx
import { GET } from '@/app/api/v1/workflows/route';
const data = await GET();
```

✅ **Fix:** Use fetch instead
```typescript
// ✅ app/(dashboard)/workflows/page.tsx
const response = await fetch('/api/v1/workflows');
const data = await response.json();
```

---

### ❌ Problem: lib/shared importing React

```typescript
// ❌ lib/shared/utils/format.ts
import { useState } from 'react';
```

✅ **Fix:** Keep it pure
```typescript
// ✅ lib/shared/utils/format.ts
export function formatDate(date: Date): string {
  return date.toISOString();
}
```

---

## 🎓 Why These Rules?

| Rule | Reason |
|------|--------|
| API can't import UI | So API can be extracted to separate repo |
| Pages can't import route handlers | Prevents tight coupling, enables SSR |
| lib/shared must be pure | Can be published as npm package |

---

## 📚 Full Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - High-level overview
- [docs/architectural-boundaries.md](docs/architectural-boundaries.md) - Complete rules
- [lib/shared/README.md](lib/shared/README.md) - Shared code guidelines

---

## ✅ Pre-Commit Checklist

Before committing:

- [ ] Run `npm run lint` - passes
- [ ] Run `npm run check:boundaries` - passes
- [ ] No `@/components` in `app/api/v1/`
- [ ] No route handler imports in pages
- [ ] No React/Next.js in `lib/shared/`

---

**Last Updated:** December 2, 2025
