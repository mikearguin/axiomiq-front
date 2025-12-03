# lib/shared

This directory contains code that is **shared between API and UI** and has **zero dependencies** on Next.js-specific features.

## Purpose

Code in this directory can be safely extracted into a separate npm package (`@axiomiq/shared`) if the API is separated into its own repository.

## Rules

✅ **Allowed:**
- Pure utility functions (no side effects)
- Type definitions and interfaces
- Constants and enums
- Validation schemas (Zod)
- Data transformation functions
- Business logic (domain models)

❌ **Not Allowed:**
- React components or hooks
- Next.js-specific imports (`next/*`)
- Database clients or queries
- API route handlers
- UI utilities (tailwind, classnames)
- Browser-only APIs
- Node.js-only APIs (unless properly typed as server-only)

## Examples

### ✅ Good - Pure Utility
```typescript
// lib/shared/utils/validation.ts
import { z } from 'zod';

export const emailSchema = z.string().email();
export function isValidEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}
```

### ✅ Good - Business Logic
```typescript
// lib/shared/domain/workflow.ts
export interface Workflow {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'archived';
}

export function canExecuteWorkflow(workflow: Workflow): boolean {
  return workflow.status === 'active';
}
```

### ❌ Bad - React/UI Dependencies
```typescript
// ❌ Don't do this
import { useState } from 'react';
import { cn } from '@/lib/utils';
```

### ❌ Bad - Next.js Dependencies
```typescript
// ❌ Don't do this
import { cookies } from 'next/headers';
```

## Migration Path

If/when the public API is separated:

1. This directory becomes `@axiomiq/shared` package
2. Both `axiomiq-web` and `axiomiq-api` install it
3. Types remain synchronized
4. Zero code duplication
