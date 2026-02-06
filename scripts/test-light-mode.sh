#!/bin/bash

# Light Mode Testing Script for Hermes CRM
# This script helps verify that light mode works correctly

echo "🎨 Hermes CRM - Light Mode Testing"
echo "=================================="
echo ""

# Check if dev server is running
if ! curl -s http://localhost:5173 > /dev/null 2>&1; then
  echo "❌ Dev server not running!"
  echo "💡 Start it with: cd apps/web && pnpm dev"
  exit 1
fi

echo "✅ Dev server is running at http://localhost:5173"
echo ""

echo "📋 Manual Testing Steps:"
echo ""
echo "1. Open http://localhost:5173 in your browser"
echo "2. Toggle to Light Mode using the theme switcher"
echo "3. Verify the following pages:"
echo "   - Dashboard (charts, KPIs, funnel)"
echo "   - Leads (list, filters, search)"
echo "   - Lead Detail (click on a lead)"
echo "   - Tasks"
echo "   - Templates"
echo "   - Analytics"
echo "   - Settings"
echo ""
echo "4. Check these elements on each page:"
echo "   ✓ Text is readable (good contrast)"
echo "   ✓ Buttons are visible"
echo "   ✓ Borders and separators are visible"
echo "   ✓ Icons are clear"
echo "   ✓ Hover states work"
echo "   ✓ Input fields have visible borders"
echo "   ✓ Dropdowns are readable"
echo ""
echo "5. Test on mobile (resize browser or use dev tools):"
echo "   ✓ Mobile header shows theme toggle"
echo "   ✓ Sidebar opens correctly"
echo "   ✓ All elements are responsive"
echo ""

# Offer to run automated screenshot capture
echo "🤖 Automated Testing:"
echo ""
echo "Run screenshot capture script?"
echo "(Requires Playwright to be installed)"
read -p "Run screenshots? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "📸 Starting screenshot capture..."
  cd "$(dirname "$0")/.."
  node scripts/capture-screenshots.js
else
  echo "⏭️ Skipping automated screenshots"
fi

echo ""
echo "✅ Testing complete!"
echo "📝 Document your findings in LIGHT_MODE_VERIFICATION.md"
