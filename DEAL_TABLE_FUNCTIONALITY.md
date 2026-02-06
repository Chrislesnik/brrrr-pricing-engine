# Deal Table Functionality Guide

## Overview

The Deal Pipeline table now has **two separate expandable/interactive features**:

1. **Expandable Rows** → Shows Linear-style Task Tracker (inline expansion)
2. **Comments Button** → Opens Sheet panel with comment thread (side panel)

## Features

### 1. Expandable Row - Task Tracker

**How to Use:**
- Click anywhere on a deal row (except buttons/inputs)
- Row expands to show the **DealTaskTracker** component
- Click again to collapse

**What's Inside:**
- Linear-style underwriting conditions tracker
- Board view (Kanban) or List view
- Task statuses: To Do, In Progress, In Review, Done
- Task properties: Priority, Assignee, Due Date
- Add, edit, and move tasks between statuses

**UI Features:**
- Chevron icon (►) in expand column
- Rotates to (▼) when expanded
- Smooth animation
- 800px max height with scroll

### 2. Comments Button - Sheet Panel

**How to Use:**
- Click the **Comments** button (message icon) in any row
- Sheet slides out from the right
- Shows all comments for that deal
- Type `@` to mention users

**What's Inside:**
- All comments with timestamps
- @mention support with autocomplete
- User avatars
- Send button to submit
- Highlighted mentions in comments

**UI Features:**
- Side panel (Sheet component)
- Doesn't interfere with table
- Deal name in header
- Scrollable comment area
- Fixed input at bottom

## Implementation Details

### State Management

```typescript
// Separate states for each feature
const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set()); // Task tracker
const [commentsSheetDealId, setCommentsSheetDealId] = useState<string | null>(null); // Comments
```

### Column Structure

```
┌──────┬────────┬───────────┬─────────┬──────────┬──────────┐
│Select│ Expand │Loan Number│ Address │  Stage   │ Comments │
│  ☐   │   ►    │  LN-123   │ 123 Main│ Active   │  💬 3    │
└──────┴────────┴───────────┴─────────┴──────────┴──────────┘
         │                                           │
         │                                           │
         └─ Click to expand row                     └─ Click to open sheet
            (shows task tracker)                       (shows comments)
```

### Row Click Behavior

**Will Expand/Collapse Row:**
- Clicking anywhere on the row
- Clicking the expand chevron

**Will NOT Expand Row (ignored):**
- Clicking checkboxes
- Clicking buttons (Comments, Actions menu)
- Clicking inputs or textareas
- Clicking any element with `data-ignore-row-click`

### Components

1. **DealTaskTracker** (`deal-task-tracker.tsx`)
   - Linear-inspired task management
   - Board and List views
   - Task CRUD operations
   - Sample tasks included

2. **CommentThread** (in `deals-data-table.tsx`)
   - Comment display with mentions
   - MentionTextarea for input
   - User notifications

## User Experience Flow

### Typical Workflow

1. **View Deals** → See list of deals in pipeline
2. **Check Tasks** → Click row to expand and view underwriting conditions
3. **Add Tasks** → Create new tasks, set priorities, assign
4. **Move Tasks** → Drag between columns or update status
5. **Collaborate** → Click Comments to discuss, mention team members
6. **Track Progress** → See task completion, comment activity

### Keyboard Shortcuts

- **Enter/Tab** → Submit comment (with Shift for new line)
- **↑/↓ arrows** → Navigate mention dropdown
- **Escape** → Close mention dropdown
- **Click anywhere** → Close expanded row

## Visual States

### Row States

1. **Normal** → White background
2. **Selected** → Highlighted (checkbox checked)
3. **Has Unread Comments** → Light blue tint (`bg-primary/5`)
4. **Expanded** → Shows task tracker below
5. **Hover** → Subtle highlight

### Comment States

1. **Unread** → Red dot badge on comment count
2. **Mentioned** → Blue highlight in comment text
3. **Empty** → "No comments yet" message

## Technical Architecture

```
DealsDataTable
├── Expandable Rows (inline)
│   ├── expandedRows state
│   ├── toggleRow function
│   ├── DealTaskTracker component
│   └── Smooth collapse/expand animation
│
└── Comments Sheet (side panel)
    ├── commentsSheetDealId state
    ├── openCommentsSheet function
    ├── CommentThread component
    ├── MentionTextarea
    └── Notification system
```

## Best Practices

### For Users

1. **Expand rows** to quickly check task progress
2. **Use comments** for discussions and questions
3. **@mention** team members to notify them
4. **Update task status** as work progresses
5. **Set priorities** on critical tasks

### For Developers

1. **Don't mix concerns** → Tasks in row, Comments in sheet
2. **Use data-ignore-row-click** for interactive elements
3. **Keep animations smooth** → max-h transitions
4. **Test both features** → Ensure they don't conflict
5. **Maintain state separately** → Independent expand/sheet states

## Future Enhancements

### Potential Improvements

- [ ] Persist expanded rows to localStorage
- [ ] Keyboard shortcuts to expand/collapse
- [ ] Bulk task operations
- [ ] Task templates
- [ ] Comment reactions (emoji)
- [ ] Rich text comments
- [ ] File attachments in comments
- [ ] Task dependencies
- [ ] Time tracking per task
- [ ] Task analytics dashboard

## Troubleshooting

### Row won't expand
- Check if element has `data-ignore-row-click`
- Verify `shouldIgnoreRowClick` function
- Check event propagation

### Comments don't open
- Verify API endpoint `/api/deals/:id/comments`
- Check Sheet component is rendering
- Ensure `commentsSheetDealId` is set

### Task tracker not showing
- Verify `DealTaskTracker` component imported
- Check `expandedRows` state
- Ensure dealId is passed correctly

### Animations laggy
- Reduce max-h value
- Simplify transition
- Check for heavy renders in expanded content

## Related Documentation

- `MENTIONS_FEATURE.md` - Complete @mentions documentation
- `deal-task-tracker.tsx` - Task tracker component
- `mention-textarea.tsx` - Mention input component

---

**Summary:** The Deal table now provides a comprehensive workflow with inline task tracking (expandable rows) and threaded discussions (@mention comments in Sheet), giving users complete visibility and collaboration tools in one interface.
