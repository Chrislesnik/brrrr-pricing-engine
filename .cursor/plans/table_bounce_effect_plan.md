---
name: Table bounce on paginate/sort
overview: ""
todos:
  - id: identify-tables
    content: Identify shared table components and pagination handlers (pipeline, borrowers, others)
    status: pending
  - id: design-animation
    content: Choose bounce easing approach (CSS keyframe or motion) and where to trigger
    status: pending
    dependencies:
      - identify-tables
  - id: implement-animation
    content: Implement subtle bounce on page change and sort/filter across tables
    status: pending
    dependencies:
      - design-animation
  - id: verify-runtime
    content: Verify behavior in dev, adjust duration/strength; keep subtle
    status: pending
    dependencies:
      - implement-animation
---

# Table bounce on paginate/sort

## Overview

Add a subtle bounce/ease-out animation to all paginated tables when changing pages and when sort/filter changes re-render rows. Keep it light (Notion-like, but subtle).

## Plan

- Identify table components and pagination/sort handlers (pipeline table and any shared table utilities).
- Decide animation approach (CSS keyframes + class toggle on data change vs motion library), ensuring subtle bounce.
- Implement the animation triggers on page change and sort/filter changes across tables.
- Verify runtime behavior and tune duration/strength; ensure no accessibility or layout regressions.
