# Resources Settings Popover Guide

## Overview

The resources app now includes a comprehensive **Settings Popover** accessible from the header, providing quick access to:
- **BaseHub Draft Mode** - Toggle preview of unpublished changes
- **BaseHub Dashboard** - Direct link to edit content
- **Theme Preferences** - Light/Dark/System theme switcher

## Location

The settings popover is accessed via a **⚙️ Settings icon** in the top-right corner of the resources header, next to the workspace switcher.

## Features

### 1. Content Management Section

#### **Draft Mode Toggle** 👁
- **What it does**: Lets you preview uncommitted changes from BaseHub without publishing
- **How to use**: 
  - Click the toggle switch to enable/disable draft mode
  - When enabled, a yellow "Draft Mode Active" indicator appears in the bottom-right
  - Edit content in BaseHub and see changes immediately
  - No need to navigate to `/api/draft` manually anymore!

#### **BaseHub Dashboard Link** 📄
- Quick access to your "brrrr-pricing-engine-resources" repository
- Opens in a new tab
- Direct link: https://basehub.com/dashboard

### 2. Preferences Section

#### **Theme Switcher** 🌓
- Light mode
- Dark mode  
- System (follows OS preference)
- Changes apply instantly across the app

## Usage Flow

### Quick Draft Preview Workflow

**Before (Old Way):**
1. Navigate to `http://localhost:3001/api/draft`
2. Edit content in BaseHub
3. Refresh to see changes
4. Navigate to `/api/disable-draft` when done

**Now (New Way):**
1. Click ⚙️ Settings icon in header
2. Toggle "Draft Mode" switch
3. Edit content in BaseHub - changes appear instantly
4. Toggle off when done ✨

### Complete Content Creation Workflow

1. **Open Settings**
   - Click the ⚙️ Settings icon in the header

2. **Enable Draft Mode**
   - In "Content Management" section
   - Toggle the Draft Mode switch to ON
   - Yellow indicator appears confirming draft mode is active

3. **Edit Content**
   - Click "Open BaseHub Dashboard" in settings popover
   - Or directly visit https://basehub.com/dashboard
   - Navigate to "brrrr-pricing-engine-resources"
   - Create or edit documents
   - **Save changes** (but don't commit yet)

4. **Preview Changes**
   - Return to your resources app
   - Navigate to the page you edited
   - See your uncommitted changes in real-time
   - Make adjustments as needed

5. **Publish**
   - When satisfied with changes, commit in BaseHub
   - Return to resources app
   - Open Settings, toggle Draft Mode OFF
   - Changes now visible to all users

## Visual Design

### Settings Popover Layout

```
┌─────────────────────────────────────┐
│  Content Management              ▼  │
├─────────────────────────────────────┤
│  👁  Draft Mode                      │
│      Preview unpublished changes    │
│      [BaseHub Toolbar Component]    │
│                                     │
│  📄  Open BaseHub Dashboard         │
│                                     │
├─────────────────────────────────────┤
│  Preferences                        │
├─────────────────────────────────────┤
│  🌓  Theme          [Light/Dark/Sys]│
│                                     │
└─────────────────────────────────────┘
```

### Settings Icon in Header

```
┌─────────────────────────────────────────────────────┐
│ ☰  |  Lender Resources              ⚙️  [Workspace] │
└─────────────────────────────────────────────────────┘
      ↑                                  ↑
   Sidebar                          Settings
   Trigger                          Popover
```

## Technical Details

### Components

**ResourcesSettingsPopover** (`src/components/layout/resources-settings-popover.tsx`)
- Main settings popover component
- Uses shadcn/ui Popover and Collapsible components
- Integrates BaseHub Toolbar
- Includes ThemeSwitch

**ResourcesHeader** (`src/components/layout/resources-header.tsx`)
- Site header component
- Renders settings popover with trigger button
- Receives `searchKey` prop from layout for BaseHub integration

**Layout** (`src/app/resources/layout.tsx`)
- Fetches BaseHub `_searchKey` for Toolbar
- Passes searchKey to header component
- Maintains draft mode state

### BaseHub Toolbar Integration

The BaseHub Toolbar component is embedded directly in the settings popover:

```tsx
<Toolbar searchKey={searchKey} />
```

**Benefits:**
- ✅ No manual API route navigation
- ✅ Visual toggle switch for draft mode
- ✅ Integrated with existing UI patterns
- ✅ Accessible from anywhere in the app
- ✅ Consistent with pricing-engine app UX

### Props

**ResourcesSettingsPopover Props:**

```typescript
interface ResourcesSettingsPopoverProps {
  trigger?: React.ReactNode;        // Custom trigger (default: Settings icon)
  open?: boolean;                   // Controlled open state
  onOpenChange?: (open: boolean) => void;  // Open state change handler
  searchKey?: string;               // BaseHub search key for Toolbar
}
```

**ResourcesHeader Props:**

```typescript
interface ResourcesHeaderProps {
  breadcrumb?: React.ReactNode;     // Custom breadcrumb component
  title?: string;                   // Page title (default: "Lender Resources")
  searchKey?: string;               // BaseHub search key
}
```

## Customization

### Adding New Settings Sections

To add a new section to the settings popover:

```tsx
// In resources-settings-popover.tsx

{/* New Section */}
<Collapsible
  open={newSectionOpen}
  onOpenChange={setNewSectionOpen}
>
  <CollapsibleTrigger asChild>
    <button className="flex w-full items-center justify-between px-3 py-2 hover:bg-accent/50">
      <p className="text-xs font-medium text-muted-foreground">
        New Section
      </p>
      <ChevronRight className={`h-3.5 w-3.5 transition-transform ${newSectionOpen ? "rotate-90" : ""}`} />
    </button>
  </CollapsibleTrigger>
  <CollapsibleContent>
    <div className="px-1 pb-2">
      {/* Your settings items */}
    </div>
  </CollapsibleContent>
</Collapsible>
```

### Custom Trigger Button

You can provide a custom trigger:

```tsx
<ResourcesSettingsPopover
  trigger={
    <button className="custom-button">
      Custom Settings
    </button>
  }
/>
```

## Comparison with Pricing Engine

The Resources Settings Popover follows the same UX pattern as the Pricing Engine's Platform Settings Popover:

| Feature | Pricing Engine | Resources App |
|---------|---------------|---------------|
| Trigger Icon | ⚙️ Settings | ⚙️ Settings |
| Location | Header (top-right) | Header (top-right) |
| Sections | Org Settings, Integrations, White Label, Preferences | Content Management, Preferences |
| Collapsible | ✅ Yes | ✅ Yes |
| Theme Switch | ✅ Yes | ✅ Yes |
| Special Features | Template Studio, Integrations | BaseHub Toolbar, Draft Mode |

## Keyboard Shortcuts

The settings popover responds to standard keyboard navigation:

- **Space/Enter** - Toggle collapsible sections
- **Tab** - Navigate between items
- **Escape** - Close popover
- **Arrow Keys** - Navigate within sections (when focused)

## Accessibility

The settings popover includes proper ARIA attributes:

- ✅ `aria-label` on settings trigger
- ✅ Keyboard navigation support
- ✅ Focus management
- ✅ Screen reader friendly
- ✅ Proper role attributes

## Best Practices

1. **Keep Settings Minimal**
   - Only include frequently accessed settings
   - Link to full settings pages for complex configurations

2. **Provide Visual Feedback**
   - Active states for toggles
   - Hover states for clickable items
   - Loading states when appropriate

3. **Maintain Consistency**
   - Follow the same patterns as pricing-engine
   - Use consistent spacing and styling
   - Match icon usage across apps

4. **Performance**
   - Settings popover only mounts when opened
   - Lazy load heavy components if needed
   - Optimize re-renders with proper state management

## Troubleshooting

### Settings Icon Not Showing

**Solution:** Check that `mounted` state is true and component is rendered client-side.

### BaseHub Toolbar Not Working

**Symptoms:** Draft mode toggle doesn't appear or doesn't work

**Solutions:**
1. Verify `searchKey` is being passed to popover
2. Check BaseHub token in `.env.local`
3. Ensure `_searchKey` is queried in layout
4. Check browser console for BaseHub errors

### Theme Switch Not Working

**Solution:** Ensure `next-themes` is properly configured and ThemeProvider wraps the app.

### Popover Positioning Issues

**Solution:** Adjust `side`, `align`, and `sideOffset` props on PopoverContent:

```tsx
<PopoverContent
  side="bottom"     // top, right, bottom, left
  align="end"       // start, center, end
  sideOffset={8}    // Distance from trigger
/>
```

## Resources

- [shadcn/ui Popover](https://ui.shadcn.com/docs/components/popover)
- [BaseHub Toolbar Documentation](https://docs.basehub.com)
- [Radix UI Popover](https://www.radix-ui.com/primitives/docs/components/popover)
- Platform Settings Popover: `apps/pricing-engine/src/components/layout/platform-settings-popover.tsx`
