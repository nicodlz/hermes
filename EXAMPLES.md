# 🎨 Design Patterns - Before & After Examples

## 📊 Dashboard KPI Cards

### ❌ Before
```tsx
<div className="p-6 rounded-lg border shadow-sm bg-card border-border">
  <span className="text-sm font-medium text-slate-500 dark:text-muted-foreground">
    Total Leads
  </span>
  <div className="text-3xl font-bold text-foreground dark:text-primary-foreground">
    1,234
  </div>
</div>
```

**Problems**:
- `shadow-sm` too subtle
- `text-slate-500 dark:text-muted-foreground` inconsistent
- `text-foreground dark:text-primary-foreground` redundant

### ✅ After
```tsx
<div className="p-6 rounded-lg border shadow-card bg-card border-border">
  <span className="text-sm font-medium text-secondary">
    Total Leads
  </span>
  <div className="text-3xl font-bold text-foreground">
    1,234
  </div>
</div>
```

**Improvements**:
- `shadow-card` visible elevation
- `text-secondary` semantic & works in both modes
- `text-foreground` clean (no dark: variant needed)

---

## 📝 Leads Table

### ❌ Before
```tsx
<table className="w-full">
  <thead className="bg-background dark:bg-card/50 text-left">
    <tr>
      <th className="px-4 py-3 text-sm text-slate-500 dark:text-muted-foreground">
        Lead
      </th>
    </tr>
  </thead>
  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
    <tr className="hover:bg-background dark:hover:bg-card/50">
      <td className="px-4 py-3">
        <div className="font-medium text-foreground dark:text-primary-foreground">
          Lead Title
        </div>
      </td>
    </tr>
  </tbody>
</table>
```

**Problems**:
- `bg-background dark:bg-card/50` confusing hierarchy
- `divide-slate-100 dark:divide-slate-700` inconsistent with theme
- Multiple redundant `dark:` variants

### ✅ After
```tsx
<table className="w-full">
  <thead className="bg-nested text-left border-b border-border">
    <tr>
      <th className="px-4 py-3 text-sm text-secondary">
        Lead
      </th>
    </tr>
  </thead>
  <tbody className="divide-y divide-border">
    <tr className="hover:bg-nested transition-colors">
      <td className="px-4 py-3">
        <div className="font-medium text-foreground">
          Lead Title
        </div>
      </td>
    </tr>
  </tbody>
</table>
```

**Improvements**:
- `bg-nested` clear nested surface
- `divide-border` consistent with theme
- `hover:bg-nested` semantic hover state
- No redundant `dark:` variants

---

## 🏷️ Status Badges

### ❌ Before
```tsx
<span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/20 dark:bg-primary/40 text-primary dark:text-primary">
  Qualified
</span>
```

**Problems**:
- No border (low contrast)
- `dark:text-primary` redundant (primary already works in dark)

### ✅ After
```tsx
<span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30">
  Qualified
</span>
```

**Improvements**:
- `border border-primary/30` adds definition
- No redundant dark variants
- Better contrast and visibility

---

## 📋 Task Cards (Nested Surface)

### ❌ Before
```tsx
<div className="flex items-center gap-3 p-3 rounded-lg bg-background dark:bg-card/50">
  <div className="flex-1">
    <p className="text-sm font-medium text-foreground dark:text-primary-foreground">
      Task Title
    </p>
    <p className="text-xs text-slate-500 dark:text-muted-foreground">
      Company Name
    </p>
  </div>
</div>
```

**Problems**:
- `bg-background dark:bg-card/50` wrong hierarchy (should be nested)
- Inconsistent text classes

### ✅ After
```tsx
<div className="flex items-center gap-3 p-3 rounded-lg bg-nested border border-border">
  <div className="flex-1">
    <p className="text-sm font-medium text-foreground">
      Task Title
    </p>
    <p className="text-xs text-tertiary">
      Company Name
    </p>
  </div>
</div>
```

**Improvements**:
- `bg-nested` correct hierarchy level
- `border border-border` visible separation
- `text-tertiary` semantic metadata text
- Clean, consistent classes

---

## 🎨 Full Page Example

### ✅ Complete Hierarchy
```tsx
<div className="p-8 bg-background">
  {/* Page Header */}
  <div className="mb-6">
    <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
    <p className="text-secondary">SDR performance overview</p>
  </div>

  {/* Card Level 1 */}
  <div className="bg-card rounded-lg border border-border p-6 shadow-card">
    <h2 className="font-semibold mb-4 text-foreground">Conversion Funnel</h2>
    
    {/* Nested Surface (Level 2) */}
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <span className="text-sm text-secondary">New Leads</span>
        <div className="flex-1">
          <div className="h-8 bg-nested rounded-full border border-border">
            {/* Progress bar */}
          </div>
        </div>
        <span className="text-sm text-tertiary">100%</span>
      </div>
    </div>
  </div>
</div>
```

**Hierarchy Levels**:
1. `bg-background` - Page background (#F2F3F5 / #36393F)
2. `bg-card` + `shadow-card` - Main card (#FFFFFF / #2F3136)
3. `bg-nested` - Nested elements (#FAFBFC / #292B2F)

**Text Levels**:
1. `text-foreground` - Main text (#1F2937 / #FFFFFF)
2. `text-secondary` - Labels (#4B5563 / #B9BBBE)
3. `text-tertiary` - Metadata (#6B7280 / #8E9297)

---

## 🔍 CSS Variables Reference

### Surface Colors
```css
/* Light Mode */
--background: 210 13% 96%   /* #F2F3F5 */
--card: 0 0% 100%           /* #FFFFFF */
--nested: 210 20% 99%       /* #FAFBFC */
--border: 210 11% 90%       /* #E3E5E8 */

/* Dark Mode */
--background: 215 8% 23%    /* #36393F */
--card: 225 7% 20%          /* #2F3136 */
--nested: 225 9% 17%        /* #292B2F */
--border: 210 10% 13%       /* #202225 */
```

### Text Colors
```css
/* Light Mode */
--foreground: 217 33% 17%           /* #1F2937 - 11.3:1 */
--foreground-secondary: 215 16% 34% /* #4B5563 - 7.2:1 */
--foreground-tertiary: 217 11% 46%  /* #6B7280 - 5.1:1 */

/* Dark Mode */
--foreground: 0 0% 100%             /* #FFFFFF - 14.5:1 */
--foreground-secondary: 228 6% 73%  /* #B9BBBE - 9.8:1 */
--foreground-tertiary: 220 6% 57%   /* #8E9297 - 6.4:1 */
```

---

## 📐 Custom Utilities

### Backgrounds
```tsx
className="bg-background"  // Page background
className="bg-card"        // Card background
className="bg-nested"      // Nested surface (NEW)
```

### Text
```tsx
className="text-foreground"  // Main text (black/white)
className="text-secondary"   // Labels, subtitles (NEW)
className="text-tertiary"    // Metadata, timestamps (NEW)
```

### Shadows
```tsx
className="shadow-card"       // Card elevation (NEW)
className="shadow-card-hover" // Hover elevation (NEW)
```

---

## ✅ Migration Checklist

When updating a component:

- [ ] Replace `shadow-sm` with `shadow-card`
- [ ] Replace `text-slate-500 dark:text-muted-foreground` with `text-secondary`
- [ ] Replace `text-foreground dark:text-primary-foreground` with `text-foreground`
- [ ] Replace `bg-background dark:bg-card/50` with `bg-nested`
- [ ] Replace `hover:bg-muted dark:hover:bg-card` with `hover:bg-nested`
- [ ] Add `border border-border` to nested surfaces
- [ ] Add `border` to status badges for better contrast

---

## 🎯 Result

**Before**: Flat design, inconsistent classes, poor contrast  
**After**: Clear hierarchy, semantic classes, WCAG AA contrast

Every element now has its proper place in the visual hierarchy! 🎨✨
