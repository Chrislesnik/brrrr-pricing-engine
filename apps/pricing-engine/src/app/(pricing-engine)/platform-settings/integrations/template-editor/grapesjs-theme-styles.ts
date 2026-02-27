/**
 * Shared GrapesJS Studio theme overrides:
 * - Modal z-index fixes
 * - Preview mode chrome hiding
 * - Violet/purple → org primary color remapping
 * - Dark & light mode base chrome overrides
 */
export const grapejsThemeStyles = `
  /* Preview mode: hide all editor chrome */
  .gs-preview-mode .gjs-cv-canvas__frames,
  .gs-preview-mode [class*="gs-canvas"] {
    pointer-events: none !important;
  }
  .gs-preview-mode [class*="spot"],
  .gs-preview-mode [class*="Spot"],
  .gs-preview-mode [class*="toolbar"],
  .gs-preview-mode [class*="Toolbar"],
  .gs-preview-mode [class*="resizer"],
  .gs-preview-mode [class*="Resizer"],
  .gs-preview-mode [class*="badge"],
  .gs-preview-mode [class*="Badge"],
  .gs-preview-mode [class*="highlight"],
  .gs-preview-mode [class*="Highlight"],
  .gs-preview-mode [class*="offset-v"],
  .gs-preview-mode [class*="offset-fixed"] {
    display: none !important;
    opacity: 0 !important;
    visibility: hidden !important;
  }
  .gs-preview-mode iframe {
    pointer-events: none !important;
  }
  .gs-preview-mode .blocks-panel-left,
  .gs-preview-mode .right-sidebar-panel {
    display: none !important;
  }

  #headlessui-portal-root {
    z-index: 99999 !important;
    pointer-events: none !important;
  }
  #headlessui-portal-root > * {
    pointer-events: auto !important;
  }
  .gs-cmp-modal-wrapper {
    position: fixed !important;
    inset: 0 !important;
    z-index: 99999 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    background-color: rgba(0, 0, 0, 0.5) !important;
  }
  .gs-cmp-modal-container {
    position: relative !important;
    z-index: 100000 !important;
    border-radius: 8px !important;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
    max-height: 90vh !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: visible !important;
  }
  .gs-cmp-modal-container button,
  .gs-cmp-modal-container [role="button"],
  .gs-studio-root [data-headlessui-state] button {
    visibility: visible !important;
    opacity: 1 !important;
    display: inline-flex !important;
    pointer-events: auto !important;
  }

  .dark .gs-studio-root [class*="gs-canvas-spot"],
  .dark .gs-studio-root [class*="gs-spot"],
  .dark .gs-studio-root [class*="Spot"] {
    border-color: hsl(var(--primary)) !important;
    outline-color: hsl(var(--primary)) !important;
  }
  .dark .gs-studio-root [class*="gs-canvas-spot__highlight"],
  .dark .gs-studio-root [class*="highlight"] {
    border-color: hsl(var(--primary) / 0.6) !important;
    background-color: hsl(var(--primary) / 0.05) !important;
  }
  .dark .gs-studio-root [class*="gs-canvas-spot__select"],
  .dark .gs-studio-root [class*="selected"] {
    border-color: hsl(var(--primary)) !important;
  }
  .dark .gs-studio-root [class*="gs-canvas-spot__hover"] {
    border-color: hsl(var(--primary) / 0.5) !important;
  }
  .dark .gs-studio-root [class*="gs-canvas-spot__spacing"] {
    background-color: hsl(var(--primary) / 0.15) !important;
  }

  .dark [class*="gs-cmp-toolbar"],
  .dark [class*="gs-canvas-spot"] [class*="toolbar"],
  .dark .gs-studio-root [class*="toolbar"]:not(.gs-preview-mode *) {
    background-color: #1a1a1a !important;
    border: 1px solid #555 !important;
    color: #fafafa !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5) !important;
  }
  .dark [class*="gs-cmp-toolbar"] button,
  .dark [class*="gs-cmp-toolbar"] [role="button"],
  .dark .gs-studio-root [class*="toolbar"] button:not(.gs-preview-mode *) {
    color: #fafafa !important;
    opacity: 1 !important;
    visibility: visible !important;
  }
  .dark [class*="gs-cmp-toolbar"] button:hover,
  .dark [class*="gs-cmp-toolbar"] [role="button"]:hover {
    background-color: #444 !important;
  }
  .dark [class*="gs-cmp-badge"],
  .dark [class*="gs-canvas-spot"] [class*="badge"],
  .dark .gs-studio-root [class*="badge"]:not(.gs-preview-mode *) {
    background-color: #1a1a1a !important;
    color: #fafafa !important;
    border: 1px solid #555 !important;
  }

  .blocks-panel-left,
  .right-sidebar-panel {
    overflow-y: auto !important;
    overflow-x: hidden !important;
  }
  .blocks-panel-left > *,
  .right-sidebar-panel > * {
    overflow-y: auto !important;
    overflow-x: hidden !important;
    min-height: 0 !important;
  }

  .gs-studio-root [class*="gs-utl-text-violet"],
  .gs-studio-root [class*="gs-utl-text-purple"] {
    color: hsl(var(--primary)) !important;
  }
  .gs-studio-root [class*="gs-utl-bg-violet"]:not(button):not([role="button"]),
  .gs-studio-root [class*="gs-utl-bg-purple"]:not(button):not([role="button"]) {
    background-color: hsl(var(--primary) / 0.15) !important;
  }
  .gs-studio-root button[class*="gs-utl-bg-violet"],
  .gs-studio-root [role="button"][class*="gs-utl-bg-violet"],
  .gs-studio-root button[class*="gs-utl-bg-purple"],
  .gs-studio-root [role="button"][class*="gs-utl-bg-purple"],
  #headlessui-portal-root button[class*="gs-utl-bg-violet"],
  #headlessui-portal-root button[class*="gs-utl-bg-purple"] {
    background-color: hsl(var(--primary)) !important;
    color: hsl(var(--primary-foreground)) !important;
  }
  .gs-studio-root button[class*="gs-utl-bg-violet"]:hover,
  .gs-studio-root [role="button"][class*="gs-utl-bg-violet"]:hover,
  #headlessui-portal-root button[class*="gs-utl-bg-violet"]:hover {
    background-color: hsl(var(--primary) / 0.85) !important;
  }
  .gs-studio-root [class*="hover\\\\:gs-utl-text-violet"]:hover,
  .gs-studio-root [class*="hover\\\\:dark\\\\:gs-utl-text-violet"]:hover,
  .gs-studio-root .gs-theme-cl-hTAo:hover {
    color: hsl(var(--primary)) !important;
  }
  .gs-studio-root [class*="gs-utl-border-violet"] {
    border-color: hsl(var(--primary)) !important;
  }
  .gs-studio-root [class*="gs-utl-ring-violet"] {
    --tw-ring-color: hsl(var(--primary)) !important;
  }
  .gs-studio-root .gs-block-item--active,
  .gs-studio-root .gs-layer-item--selected {
    border-color: hsl(var(--primary)) !important;
    background-color: hsl(var(--primary) / 0.1) !important;
  }

  .dark .gs-studio-root [class*="gs-utl-bg-zinc-900"],
  .dark .gs-studio-root [class*="gs-utl-bg-zinc-800"] {
    background-color: hsl(var(--background)) !important;
  }
  .dark .gs-studio-root [class*="gs-utl-bg-zinc-700"],
  .dark .gs-studio-root [class*="gs-utl-bg-zinc-600"] {
    background-color: hsl(var(--muted)) !important;
  }
  .dark .gs-studio-root [class*="gs-utl-text-gray-400"],
  .dark .gs-studio-root [class*="gs-utl-text-gray-300"] {
    color: hsl(var(--muted-foreground)) !important;
  }
  .dark .gs-studio-root [class*="gs-utl-text-gray-200"],
  .dark .gs-studio-root [class*="gs-utl-text-gray-100"],
  .dark .gs-studio-root [class*="gs-utl-text-white"] {
    color: hsl(var(--foreground)) !important;
  }
  .dark .gs-studio-root [class*="gs-utl-border-zinc-700"],
  .dark .gs-studio-root [class*="gs-utl-border-zinc-600"] {
    border-color: hsl(var(--border)) !important;
  }
  .dark .gs-studio-root .gs-theme-cl-bg {
    background-color: hsl(var(--background)) !important;
  }
  .dark .gs-studio-root .gs-theme-cl-txt {
    color: hsl(var(--foreground)) !important;
  }
  .dark .gs-studio-root .gs-theme-cl-br {
    border-color: hsl(var(--border)) !important;
  }

  .gs-studio-root [class*="gs-utl-bg-white"] {
    background-color: hsl(var(--background)) !important;
  }
  .gs-studio-root [class*="gs-utl-bg-gray-100"],
  .gs-studio-root [class*="gs-utl-bg-gray-50"] {
    background-color: hsl(var(--muted)) !important;
  }
  .gs-studio-root [class*="gs-utl-text-gray-900"],
  .gs-studio-root [class*="gs-utl-text-gray-800"] {
    color: hsl(var(--foreground)) !important;
  }
  .gs-studio-root [class*="gs-utl-border-gray-300"],
  .gs-studio-root [class*="gs-utl-border-gray-200"] {
    border-color: hsl(var(--border)) !important;
  }
  .gs-studio-root .gs-theme-cl-bg {
    background-color: hsl(var(--background)) !important;
  }
  .gs-studio-root .gs-theme-cl-txt {
    color: hsl(var(--foreground)) !important;
  }
  .gs-studio-root .gs-theme-cl-br {
    border-color: hsl(var(--border)) !important;
  }
`
