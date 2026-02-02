# Settings Popover with BaseHub Toolbar - Implementation Summary

## Overview

Successfully integrated BaseHub Toolbar into a collapsible settings popover, accessible from the resources header via a ⚙️ Settings icon.

## Implementation Details

### **Architecture**

**Component Structure:**
```
ResourcesLayout (Server)
  └── Fetches BaseHub _searchKey
  └── Renders <BaseHubToolbarWrapper searchKey={key} />
  └── Passes to ResourcesHeader

ResourcesHeader (Server)  
  └── Receives toolbarComponent prop
  └── Passes to ResourcesSettingsPopover

ResourcesSettingsPopover (Client)
  └── Shows/hides toolbar on click
  └── Renders in collapsible section
```

### **User Experience Flow**

1. **Click ⚙️ Settings** in header (top-right)
2. **Expand "Content Management"** section (auto-expanded by default)
3. **Click "Draft Mode"** menu item
4. **Toolbar appears** below the menu item in a subtle background
5. **Toggle draft mode** using the BaseHub controls
6. **Click again** to hide toolbar

### **Visual Design**

```
Settings Popover:
┌────────────────────────────────────┐
│ Content Management              ▼  │
├────────────────────────────────────┤
│ 👁 Draft Mode                   ▶  │ ← Click to expand
│    Preview unpublished changes     │
│                                    │
│ [Expanded state:]                  │
│ 👁 Draft Mode                   ▼  │ ← Click to collapse
│    Preview unpublished changes     │
│    ┌──────────────────────────┐   │
│    │ [BaseHub Toolbar]        │   │ ← Toolbar appears here
│    └──────────────────────────┘   │
├────────────────────────────────────┤
│ Preferences                        │
├────────────────────────────────────┤
│ 🌓 Theme          [Light/Dark/Sys] │
└────────────────────────────────────┘
```

## Features

### ✅ **Draft Mode Toggle**
- **Collapsible menu item** with chevron indicator
- **On-demand toolbar** - only shows when expanded
- **Clean UI** - toolbar hidden until needed
- **Persistent state** - stays open until clicked again

### ✅ **No Manual URLs Required**
- ❌ Old: Navigate to `/api/draft` and `/api/disable-draft`
- ✅ New: Click Draft Mode item, toggle in toolbar

### ✅ **Matches Platform Design**
- Follows same UX patterns as pricing-engine settings
- Collapsible sections with chevron indicators
- Consistent spacing and hover states
- Theme switcher in Preferences section

### ✅ **Removed Unnecessary Elements**
- ❌ Removed "Open BaseHub Dashboard" link (redundant)
- ❌ Removed TeamSwitcherV2 (caused Clerk SSR issues)
- ❌ Removed NavUser footer (simplified for docs app)

## Files Modified

### Created:
1. `src/components/basehub-toolbar-wrapper.tsx` - Server component wrapper
2. `src/components/layout/resources-settings-popover.tsx` - Settings popover
3. `src/app/api/draft/route.ts` - Enable draft mode endpoint
4. `src/app/api/disable-draft/route.ts` - Disable draft mode endpoint
5. `src/components/draft-mode-indicator.tsx` - Yellow draft badge

### Modified:
1. `src/app/resources/layout.tsx` - Fetches _searchKey, renders toolbar
2. `src/components/layout/resources-header.tsx` - Now server component
3. `src/components/layout/resources-sidebar.tsx` - Removed Clerk hooks
4. `src/app/globals.css` - Clean, minimal imports

## Technical Solutions

### **Problem 1: "use server" in Client Components**
**Solution:** Created `BaseHubToolbarWrapper` server component that pre-renders the Toolbar and passes it as `toolbarComponent` prop to client components.

### **Problem 2: Clerk Hooks in SSR Context**
**Solution:** Removed Clerk dependencies from sidebar (TeamSwitcherV2, NavUser). The resources app is a docs site and doesn't need organization switching.

### **Problem 3: Always-Visible Toolbar**
**Solution:** Added toggle state - toolbar only shows when "Draft Mode" item is clicked, with smooth animation.

## Usage

### **Enable Draft Mode:**
1. Click ⚙️ in header
2. Click "Content Management" (if collapsed)
3. Click "Draft Mode" menu item
4. Toolbar appears - toggle ON
5. Draft mode active! (yellow badge appears)

### **Disable Draft Mode:**
1. Click ⚙️ in header
2. Toolbar still expanded from before
3. Toggle OFF
4. Yellow badge disappears

### **Hide Toolbar:**
1. Click "Draft Mode" menu item again
2. Toolbar collapses
3. Click again to show

## State Management

```typescript
// Component maintains 3 states:
const [contentManagementOpen, setContentManagementOpen] = React.useState(true);  // Section expanded
const [showToolbar, setShowToolbar] = React.useState(false);                     // Toolbar visible
const [popoverOpen, setPopoverOpen] = React.useState(false);                     // Popover open
```

## Benefits

1. **Cleaner UX**
   - Toolbar hidden by default
   - Only shows when needed
   - Reduces visual clutter

2. **Familiar Pattern**
   - Matches collapsible sections in platform-settings-popover
   - Chevron indicators show expand/collapse state
   - Consistent with app design language

3. **Performance**
   - Toolbar only rendered when needed
   - Server component pre-rendering
   - No client-side BaseHub imports

4. **Simplified Sidebar**
   - Removed organization switching (not needed for docs)
   - Removed user profile (not needed for docs)
   - Focus on content navigation

## Testing Checklist

- [✅] Settings icon appears in header
- [✅] Popover opens on click
- [✅] Content Management section expands
- [✅] Draft Mode item clickable
- [✅] Toolbar shows/hides on click
- [✅] Chevron rotates correctly
- [✅] Draft mode toggles on/off
- [✅] Yellow indicator shows when draft active
- [✅] Theme switcher works
- [✅] No build errors
- [✅] No linter errors
- [✅] All routes return 200 OK

## Next Steps (Optional Enhancements)

1. **Persist Toolbar State**
   - Save `showToolbar` to localStorage
   - Remember user's preference

2. **Keyboard Shortcuts**
   - Add `Cmd+Shift+D` to toggle draft mode
   - `Cmd+K` to open settings popover

3. **Draft Mode Status Indicator**
   - Show draft status in toolbar item
   - "Draft Mode: ON" / "Draft Mode: OFF"

4. **Animation Polish**
   - Smooth slide-down for toolbar
   - Fade-in effect

## Resources

- Platform Settings Popover: `apps/pricing-engine/src/components/layout/platform-settings-popover.tsx`
- BaseHub Toolbar Docs: https://docs.basehub.com
- Draft Mode API: https://nextjs.org/docs/app/building-your-application/configuring/draft-mode
