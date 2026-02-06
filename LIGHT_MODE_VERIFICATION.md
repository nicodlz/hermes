# Light Mode Verification Checklist

## Implementation Status

✅ **ThemeProvider**: Configured with next-themes
✅ **CSS Variables**: Light and dark mode variables defined in index.css
✅ **ModeToggle Component**: Created with dropdown (Light/Dark/System)
✅ **Integration**: 
  - Desktop: AppSidebar (simple toggle)
  - Mobile: AppHeader (dropdown toggle)

## Components to Test

### 1. Dashboard
- [ ] KPI Cards visibility
- [ ] Text contrast (headings, body)
- [ ] Chart components
- [ ] Conversion funnel display
- [ ] Pending tasks section
- [ ] Icons visibility

### 2. Leads Page
- [ ] Search bar
- [ ] Filter controls (Status, Source, Score, Date)
- [ ] Leads table/list
- [ ] Status badges
- [ ] Star icons
- [ ] Action buttons
- [ ] Hover states
- [ ] Dropdown menus

### 3. Lead Detail Page
- [ ] Header section (name, company, score)
- [ ] Status badge
- [ ] Contact information cards
- [ ] Tabs (Overview, Activity, Notes)
- [ ] Manual qualification section
- [ ] Outreach panel
- [ ] History timeline
- [ ] Input fields and forms

### 4. Tasks Page
- [ ] Task cards
- [ ] Status indicators
- [ ] Date badges
- [ ] Action buttons
- [ ] Empty state (if applicable)

### 5. Templates Page
- [ ] Template cards
- [ ] Preview sections
- [ ] Edit buttons
- [ ] Modal dialogs

### 6. Analytics Page
- [ ] Chart components (recharts)
- [ ] Stat cards
- [ ] Filters
- [ ] Date range pickers

### 7. Settings Page
- [ ] Form inputs
- [ ] Labels
- [ ] Buttons
- [ ] Tabs/sections

### 8. UI Components (shadcn/ui)
- [ ] Button variants (default, outline, ghost, destructive)
- [ ] Card components
- [ ] Dropdown menus
- [ ] Dialogs/Modals
- [ ] Input fields
- [ ] Select components
- [ ] Badges
- [ ] Separators
- [ ] Sheets (mobile sidebar)
- [ ] Toasts (sonner)

## Design Requirements

### Text Contrast
- ✅ Headings must be dark enough to read
- ✅ Body text must have sufficient contrast
- ✅ Muted text should still be readable

### Interactive Elements
- ✅ Buttons clearly visible in all states
- ✅ Hover states provide visual feedback
- ✅ Focus states visible for accessibility
- ✅ Disabled states clearly indicated

### Borders & Separators
- ✅ Card borders visible but subtle
- ✅ Section dividers clear
- ✅ Input borders visible

### Icons & Graphics
- ✅ Icons have sufficient contrast
- ✅ Status indicators clearly visible
- ✅ Charts readable with proper colors

## Testing Process

1. Start dev server: `cd apps/web && pnpm dev`
2. Open browser at http://localhost:5173
3. Toggle to light mode
4. Navigate through all pages
5. Test all interactive elements
6. Capture screenshots for each major page
7. Document any issues found

## Known Issues

None identified yet.

## Screenshots Location

Screenshots will be saved to: `/home/ubuntu/.openclaw/workspace/hermes/screenshots/`
- `dashboard-light.png`
- `leads-list-light.png`
- `lead-detail-light.png`
- `tasks-light.png`
- `templates-light.png`
- `analytics-light.png`
- `settings-light.png`

## Adjustments Made

1. **App Header**: Added ModeToggle for mobile users
2. **CSS Variables**: Already properly configured for light/dark modes
3. **Component Styles**: All using semantic color tokens (bg-background, text-foreground, etc.)
