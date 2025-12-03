# AxiomIQ Architecture

## 🏗️ Overview

AxiomIQ is currently a **monorepo** with clear architectural boundaries that enable future extraction of the public API if needed.

## 📐 Key Principles

1. **Separation of Concerns** - API, UI, and shared logic are clearly separated
2. **Type Safety** - TypeScript path restrictions enforce boundaries
3. **Future-Proof** - Public API can be extracted without major refactoring
4. **Progressive Enhancement** - Start simple, scale when needed

## 🔄 Current State: Monorepo

```
axiomiq-front/
├── app/
│   ├── (marketing)/          # Public website
│   ├── (dashboard)/          # Protected dashboard
│   ├── api/
│   │   ├── v1/              # 🔐 Public API (API keys)
│   │   ├── internal/        # 🔐 Internal API (Clerk sessions)
│   │   └── webhooks/        # 🔐 Webhooks (external services)
├── lib/
│   ├── shared/              # ✅ Can be npm package
│   ├── api/                 # ✅ Goes with API extraction
│   ├── ai/                  # ✅ Goes with API extraction
│   ├── db/                  # ✅ Goes with API extraction
│   └── integrations/        # ✅ Goes with API extraction
├── types/                   # ✅ Can be npm package
└── components/              # ❌ Stays with web app
```

## 🎯 Import Restrictions

### What Can Import What?

| From | Can Import | Cannot Import |
|------|-----------|---------------|
| `app/api/v1/` | types, lib/shared, lib/api, lib/ai, lib/db | components, hooks, stores, app pages |
| `app/api/internal/` | Almost everything | marketing pages, v1 API |
| `app/api/webhooks/` | Same as v1 | Same as v1 |
| `app/(dashboard)/` | components, hooks, all lib | API route handlers |
| `app/(marketing)/` | components, lib/shared | dashboard, API handlers |
| `lib/shared/` | Pure utils only | React, Next.js, anything framework-specific |

### Enforcement

✅ **ESLint** - Run `npm run lint` to check violations
✅ **TypeScript** - Path aliases guide proper imports
✅ **Script** - Run `npm run check:boundaries` for comprehensive check

## 🚀 Migration Path

### When to Separate API

Separate when you hit **any** of these:

- [ ] 100+ external API customers
- [ ] 1M+ API requests per month
- [ ] Need different scaling for API vs UI
- [ ] Building mobile app or CLI tool
- [ ] Team grows to 10+ engineers
- [ ] Enterprise customers need dedicated API SLA

### How to Separate

**Phase 1: Prepare (Current)**
- ✅ Maintain clear boundaries
- ✅ Use ESLint to prevent violations
- ✅ Put shared code in `lib/shared/`
- ✅ Document boundaries

**Phase 2: Extract Shared Package**
```bash
# Create @axiomiq/shared
1. Extract lib/shared/ → @axiomiq/shared
2. Extract types/ → @axiomiq/shared/types
3. Publish to npm
4. Update imports in both repos
```

**Phase 3: Extract API**
```bash
# Create axiomiq-api repo
1. Move app/api/v1/ → axiomiq-api/src
2. Move lib/api, lib/ai, lib/db, lib/integrations
3. Install @axiomiq/shared
4. Deploy separately
```

**Phase 4: Update Web App**
```bash
# Update axiomiq-web
1. Remove app/api/v1/
2. Install @axiomiq/shared
3. Update API calls: /api/v1 → https://api.axiomiq.com/v1
4. Keep app/api/internal/ (tightly coupled to dashboard)
```

## 📚 Documentation

- [Architectural Boundaries](docs/architectural-boundaries.md) - Detailed rules
- [Directory Structure](docs/directory-structure.md) - Full structure guide
- [lib/shared README](lib/shared/README.md) - Shared code guidelines
- [TODO List](TODO.md) - Implementation tasks

## 🔍 Validation

### Check Boundaries
```bash
npm run check:boundaries
```

### Run Linter
```bash
npm run lint
```

### Build
```bash
npm run build
```

All three should pass with zero violations.

## 💡 Best Practices

### DO ✅
- Use `@/lib/shared/*` for code used by both API and UI
- Use `@/lib/api/*` for API-specific business logic
- Make API requests from pages using `fetch()`, not direct imports
- Keep pure utilities framework-agnostic
- Document architectural decisions

### DON'T ❌
- Import `@/components` from `app/api/v1/`
- Import API route handlers from pages
- Put Next.js-specific code in `lib/shared/`
- Mix authentication mechanisms (API keys vs sessions)
- Create circular dependencies

## 🏆 Success Metrics

Current architecture is working if:

- ✅ ESLint passes with no boundary violations
- ✅ `npm run check:boundaries` passes
- ✅ Public API has zero UI imports
- ✅ Shared code has zero framework dependencies
- ✅ Team understands and follows boundaries

## 🤝 Contributing

When adding new code:

1. **Check** which layer it belongs to
2. **Use** the appropriate path alias (`@/lib/api/*` vs `@/components/*`)
3. **Run** `npm run lint` before committing
4. **Test** that boundaries are respected

## 📞 Questions?

See [docs/architectural-boundaries.md](docs/architectural-boundaries.md) for the complete guide.
