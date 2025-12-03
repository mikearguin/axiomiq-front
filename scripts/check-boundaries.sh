#!/bin/bash

# ========================================
# Architectural Boundary Checker
# ========================================
# This script verifies that import boundaries are respected
# Run: npm run check:boundaries

set -e

echo "🔍 Checking architectural boundaries..."
echo ""

VIOLATIONS=0

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ========================================
# Check 1: Public API should not import UI code
# ========================================
echo "📦 Checking app/api/v1/ (Public API)..."

UI_IMPORTS_IN_API=$(grep -r "from '@/components\|from '@/hooks\|from '@/stores'" app/api/v1/ 2>/dev/null || true)

if [ -n "$UI_IMPORTS_IN_API" ]; then
  echo -e "${RED}❌ VIOLATION: Public API imports UI code${NC}"
  echo "$UI_IMPORTS_IN_API"
  echo ""
  VIOLATIONS=$((VIOLATIONS + 1))
else
  echo -e "${GREEN}✅ Public API boundary clean${NC}"
fi
echo ""

# ========================================
# Check 2: Public API should not import Internal API
# ========================================
echo "📦 Checking app/api/v1/ for internal API imports..."

INTERNAL_IMPORTS=$(grep -r "from '@/app/api/internal'" app/api/v1/ 2>/dev/null || true)

if [ -n "$INTERNAL_IMPORTS" ]; then
  echo -e "${RED}❌ VIOLATION: Public API imports Internal API${NC}"
  echo "$INTERNAL_IMPORTS"
  echo ""
  VIOLATIONS=$((VIOLATIONS + 1))
else
  echo -e "${GREEN}✅ No internal API imports in public API${NC}"
fi
echo ""

# ========================================
# Check 3: Webhooks should not import UI code
# ========================================
echo "📦 Checking app/api/webhooks/..."

UI_IMPORTS_IN_WEBHOOKS=$(grep -r "from '@/components\|from '@/hooks\|from '@/stores'" app/api/webhooks/ 2>/dev/null || true)

if [ -n "$UI_IMPORTS_IN_WEBHOOKS" ]; then
  echo -e "${RED}❌ VIOLATION: Webhooks import UI code${NC}"
  echo "$UI_IMPORTS_IN_WEBHOOKS"
  echo ""
  VIOLATIONS=$((VIOLATIONS + 1))
else
  echo -e "${GREEN}✅ Webhooks boundary clean${NC}"
fi
echo ""

# ========================================
# Check 4: Dashboard should not import API route handlers
# ========================================
echo "📦 Checking app/(dashboard)/ for API handler imports..."

API_IMPORTS_IN_DASHBOARD=$(grep -r "from '@/app/api/" app/\(dashboard\)/ 2>/dev/null || true)

if [ -n "$API_IMPORTS_IN_DASHBOARD" ]; then
  echo -e "${YELLOW}⚠️  WARNING: Dashboard imports API handlers (use fetch instead)${NC}"
  echo "$API_IMPORTS_IN_DASHBOARD"
  echo ""
else
  echo -e "${GREEN}✅ Dashboard uses proper API calls${NC}"
fi
echo ""

# ========================================
# Check 5: Marketing should not import Dashboard
# ========================================
echo "📦 Checking app/(marketing)/ for dashboard imports..."

DASHBOARD_IMPORTS_IN_MARKETING=$(grep -r "from '@/app/(dashboard)'" app/\(marketing\)/ 2>/dev/null || true)

if [ -n "$DASHBOARD_IMPORTS_IN_MARKETING" ]; then
  echo -e "${YELLOW}⚠️  WARNING: Marketing imports Dashboard code${NC}"
  echo "$DASHBOARD_IMPORTS_IN_MARKETING"
  echo ""
else
  echo -e "${GREEN}✅ Marketing is isolated from Dashboard${NC}"
fi
echo ""

# ========================================
# Check 6: lib/shared should have no Next.js dependencies
# ========================================
echo "📦 Checking lib/shared/ for framework dependencies..."

NEXTJS_IN_SHARED=$(grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" "from 'next/\|from 'react'" lib/shared/ 2>/dev/null || true)

if [ -n "$NEXTJS_IN_SHARED" ]; then
  echo -e "${RED}❌ VIOLATION: lib/shared has framework dependencies${NC}"
  echo "$NEXTJS_IN_SHARED"
  echo ""
  VIOLATIONS=$((VIOLATIONS + 1))
else
  echo -e "${GREEN}✅ lib/shared is framework-agnostic${NC}"
fi
echo ""

# ========================================
# Summary
# ========================================
echo "========================================="
if [ $VIOLATIONS -eq 0 ]; then
  echo -e "${GREEN}✅ All boundary checks passed!${NC}"
  echo ""
  echo "Your code is well-structured for potential API extraction."
  exit 0
else
  echo -e "${RED}❌ Found $VIOLATIONS boundary violation(s)${NC}"
  echo ""
  echo "Please fix these violations to maintain clean architecture."
  echo "See docs/architectural-boundaries.md for guidance."
  exit 1
fi
