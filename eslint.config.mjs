import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  // ========================================
  // API BOUNDARY RESTRICTIONS
  // ========================================
  // These rules enforce architectural boundaries to prepare for potential
  // future separation of the public API into its own repository.

  {
    // Public API routes - MOST RESTRICTIVE
    // Can only import: types, lib/shared, lib/api, lib/ai, lib/db, lib/integrations
    files: ["app/api/v1/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group: ["@/components/*", "@/hooks/*", "@/stores/*"],
            message: "❌ Public API (v1) cannot import UI code. This violates the API/UI boundary. Use @/lib/api/* or @/lib/shared/* instead."
          },
          {
            group: ["@/app/(dashboard)/*", "@/app/(marketing)/*"],
            message: "❌ Public API (v1) cannot import from app pages. This violates the API/UI boundary."
          },
          {
            group: ["@/app/api/internal/*"],
            message: "❌ Public API (v1) cannot import from internal API. These have different auth mechanisms."
          }
        ]
      }]
    }
  },

  {
    // Internal API routes - MODERATE RESTRICTIONS
    // Can import: everything except marketing pages
    files: ["app/api/internal/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group: ["@/app/(marketing)/*"],
            message: "⚠️ Internal API should not import marketing pages. Consider moving shared logic to @/lib/shared/*"
          },
          {
            group: ["@/app/api/v1/*"],
            message: "⚠️ Internal API should not import from public API v1. Create shared utilities in @/lib/api/* instead."
          }
        ]
      }]
    }
  },

  {
    // Webhook routes - MODERATE RESTRICTIONS
    // Can only import: types, lib/shared, lib/api, lib/db, lib/integrations
    files: ["app/api/webhooks/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group: ["@/components/*", "@/hooks/*", "@/stores/*"],
            message: "❌ Webhook handlers cannot import UI code. Use @/lib/api/* or @/lib/shared/* instead."
          },
          {
            group: ["@/app/(dashboard)/*", "@/app/(marketing)/*"],
            message: "❌ Webhook handlers cannot import from app pages."
          }
        ]
      }]
    }
  },

  {
    // Dashboard pages - Can import UI code but not other API routes
    files: ["app/(dashboard)/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group: ["@/app/api/v1/*", "@/app/api/webhooks/*"],
            message: "⚠️ Dashboard pages should not import API route handlers. Make API requests via fetch() instead."
          }
        ]
      }]
    }
  },

  {
    // Marketing pages - Can import UI code but not dashboard or API
    files: ["app/(marketing)/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group: ["@/app/(dashboard)/*"],
            message: "⚠️ Marketing pages should not import dashboard code. They have different layouts and auth."
          },
          {
            group: ["@/app/api/*"],
            message: "⚠️ Marketing pages should not import API route handlers. Make API requests via fetch() instead."
          }
        ]
      }]
    }
  }
]);

export default eslintConfig;
