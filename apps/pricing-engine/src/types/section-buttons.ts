export interface SectionButtonAction {
  id?: number
  action_type: "google_maps" | "workflow"
  action_uuid?: string | null
  display_order: number
}

export interface SectionButton {
  id: number
  category_id: number
  label: string
  icon?: string | null
  signal_color?: string | null
  display_order: number
  actions: SectionButtonAction[]
  required_inputs?: string[]
}

/** @deprecated Use SectionButton[] instead — no longer JSONB config */
export interface SectionButtonConfig {
  buttons: SectionButton[]
}
