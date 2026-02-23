"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Plus,
  Trash2,
  GripVertical,
  MapPin,
  Zap,
  ChevronsUpDown,
  ChevronDown,
  ChevronRight,
  Loader2,
  Save,
} from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";
import { Input } from "@repo/ui/shadcn/input";
import { Label } from "@repo/ui/shadcn/label";
import { Badge } from "@repo/ui/shadcn/badge";
import { Switch } from "@repo/ui/shadcn/switch";
import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerInlineContent,
  ColorPickerEyeDropper,
  ColorPickerHueSlider,
  ColorPickerInput,
} from "@repo/ui/shadcn/color-picker";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/shadcn/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/shadcn/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/ui/shadcn/command";
import { cn } from "@repo/lib/cn";
import type { SectionButton, SectionButtonAction } from "@/types/section-buttons";

interface WorkflowAction {
  uuid: string;
  name: string;
  trigger_type: string;
  webhook_type: string | null;
}

interface ActionDetail {
  uuid: string;
  workflow_data: {
    nodes?: Array<{
      data: {
        type?: string;
        config?: Record<string, unknown>;
      };
    }>;
  } | null;
}

interface WebhookSchemaField {
  name: string;
  inputId?: string;
}

interface PEInput {
  id: string;
  input_label: string;
  input_code: string;
  input_type: string;
  category?: string;
  config?: Record<string, unknown> | null;
}

interface SectionButtonsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: number | null;
  sectionName: string;
  onChanged?: () => void;
}

export function SectionButtonsSheet({
  open,
  onOpenChange,
  categoryId,
  sectionName,
  onChanged,
}: SectionButtonsSheetProps) {
  const [buttons, setButtons] = useState<SectionButton[]>([]);
  const [availableActions, setAvailableActions] = useState<WorkflowAction[]>([]);
  const [actionDetails, setActionDetails] = useState<Map<string, ActionDetail>>(new Map());
  const actionDetailsFetchedRef = useRef<Set<string>>(new Set());
  const [peInputs, setPeInputs] = useState<PEInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const pristineRef = useRef<SectionButton[]>([]);

  const fetchButtons = useCallback(async () => {
    if (!categoryId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/pe-section-buttons?category_id=${categoryId}`);
      if (res.ok) {
        const data = await res.json();
        const fetched = Array.isArray(data) ? data : [];
        setButtons(fetched);
        pristineRef.current = JSON.parse(JSON.stringify(fetched));
        setDirty(false);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [categoryId]);

  const fetchActions = useCallback(async () => {
    try {
      const res = await fetch("/api/automations");
      if (res.ok) {
        const data = await res.json();
        const all = (data?.actions ?? []) as WorkflowAction[];
        setAvailableActions(
          all.filter((a) => a.trigger_type === "manual" && a.webhook_type === "pricing_engine"),
        );
      }
    } catch { /* ignore */ }
  }, []);

  const fetchPeInputs = useCallback(async () => {
    try {
      const res = await fetch("/api/pricing-engine-inputs");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setPeInputs(data);
      }
    } catch { /* ignore */ }
  }, []);

  const fetchActionDetail = useCallback(async (uuid: string) => {
    if (actionDetailsFetchedRef.current.has(uuid)) return;
    actionDetailsFetchedRef.current.add(uuid);
    try {
      const res = await fetch(`/api/automations/${uuid}`);
      if (res.ok) {
        const data = await res.json();
        const detail = data.action as ActionDetail;
        setActionDetails((prev) => new Map(prev).set(uuid, detail));
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (open && categoryId) {
      fetchButtons();
      fetchActions();
      fetchPeInputs();
    }
  }, [open, categoryId, fetchButtons, fetchActions, fetchPeInputs]);

  useEffect(() => {
    const uuids = buttons
      .flatMap((b) => b.actions)
      .filter((a) => a.action_type === "workflow" && a.action_uuid)
      .map((a) => a.action_uuid!);
    const unique = [...new Set(uuids)];
    for (const uuid of unique) {
      fetchActionDetail(uuid);
    }
  }, [buttons, fetchActionDetail]);

  const addGoogleMapsButton = async () => {
    if (!categoryId) return;
    const res = await fetch("/api/pe-section-buttons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category_id: categoryId,
        label: "Google Maps",
        icon: "map-pin",
        actions: [{ action_type: "google_maps" }],
      }),
    });
    if (res.ok) {
      await fetchButtons();
      onChanged?.();
    }
  };

  const addActionButton = async () => {
    if (!categoryId) return;
    const res = await fetch("/api/pe-section-buttons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category_id: categoryId,
        label: "New Button",
        icon: "zap",
        actions: [],
      }),
    });
    if (res.ok) {
      const btn = await res.json();
      await fetchButtons();
      setExpandedId(btn.id);
      onChanged?.();
    }
  };

  const deleteButton = async (id: number) => {
    await fetch("/api/pe-section-buttons", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await fetchButtons();
    onChanged?.();
  };

  const updateButtonLabel = (id: number, label: string) => {
    setButtons((prev) => prev.map((b) => (b.id === id ? { ...b, label } : b)));
    setDirty(true);
  };

  const updateButtonSignalColor = (id: number, signal_color: string | null) => {
    setButtons((prev) => prev.map((b) => (b.id === id ? { ...b, signal_color } : b)));
    setDirty(true);
  };

  const updateButtonActions = (id: number, actions: SectionButtonAction[]) => {
    setButtons((prev) =>
      prev.map((b) => (b.id === id ? { ...b, actions } : b)),
    );
    setDirty(true);
  };

  const updateButtonRequiredInputs = (id: number, required_inputs: string[]) => {
    setButtons((prev) =>
      prev.map((b) => (b.id === id ? { ...b, required_inputs } : b)),
    );
    setDirty(true);
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const pristine = pristineRef.current;
      const promises = buttons
        .filter((btn) => {
          const orig = pristine.find((p) => p.id === btn.id);
          if (!orig) return false;
          return (
            orig.label !== btn.label ||
            orig.signal_color !== btn.signal_color ||
            JSON.stringify(orig.actions) !== JSON.stringify(btn.actions) ||
            JSON.stringify(orig.required_inputs ?? []) !== JSON.stringify(btn.required_inputs ?? [])
          );
        })
        .map((btn) =>
          fetch("/api/pe-section-buttons", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: btn.id,
              label: btn.label,
              signal_color: btn.signal_color || null,
              required_inputs: btn.required_inputs ?? [],
              actions: btn.actions.map((a, i) => ({
                action_type: a.action_type,
                action_uuid: a.action_uuid,
                display_order: i,
              })),
            }),
          }),
        );
      await Promise.all(promises);
      pristineRef.current = JSON.parse(JSON.stringify(buttons));
      setDirty(false);
      onChanged?.();
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  };

  const hasGoogleMaps = buttons.some((b) =>
    b.actions.some((a) => a.action_type === "google_maps"),
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg w-full flex flex-col">
        <SheetHeader>
          <SheetTitle>Section Buttons &mdash; {sectionName}</SheetTitle>
          <SheetDescription>
            Create buttons for this section. Each button can have multiple
            workflow actions attached.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-3 py-4 px-1">
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && buttons.length === 0 && (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              No buttons configured. Add a button to get started.
            </div>
          )}

          {!loading &&
            buttons.map((btn) => {
              const isGoogleMaps = btn.actions.some(
                (a) => a.action_type === "google_maps",
              );
              const isExpanded = expandedId === btn.id;

              return (
                <div key={btn.id} className="rounded-md border bg-card">
                  {/* Button header */}
                  <div className="flex items-center gap-2 px-3 py-2">
                    <GripVertical className="size-3.5 text-muted-foreground/60 shrink-0" />

                    <button
                      type="button"
                      className="flex items-center gap-1.5 flex-1 min-w-0 text-left"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : btn.id)
                      }
                    >
                      {isExpanded ? (
                        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium truncate">
                        {btn.label}
                      </span>
                    </button>

                    <Badge
                      variant="secondary"
                      className={cn(
                        "pointer-events-none rounded-sm text-[10px] px-1.5 h-5 shrink-0",
                        isGoogleMaps
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                          : "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
                      )}
                    >
                      {isGoogleMaps ? (
                        <>
                          <MapPin className="size-2.5 mr-0.5" /> Maps
                        </>
                      ) : (
                        <>
                          {btn.actions.length} action
                          {btn.actions.length !== 1 ? "s" : ""}
                        </>
                      )}
                    </Badge>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteButton(btn.id)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t px-3 py-3 space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Button Label</Label>
                        <Input
                          value={btn.label}
                          onChange={(e) =>
                            updateButtonLabel(btn.id, e.target.value)
                          }
                          className="h-8 text-sm"
                        />
                      </div>

                      {!isGoogleMaps && (
                        <div className="space-y-1">
                          <Label className="text-xs">Signal Color</Label>
                          <SignalColorPicker
                            value={btn.signal_color ?? null}
                            onChange={(color) =>
                              updateButtonSignalColor(btn.id, color)
                            }
                          />
                        </div>
                      )}

                      {isGoogleMaps ? (
                        <>
                          <p className="text-xs text-muted-foreground">
                            This button opens Google Maps for the subject
                            property address.
                          </p>
                          <GoogleMapsRequiredInputs
                            peInputs={peInputs}
                            requiredInputs={btn.required_inputs ?? []}
                            onUpdate={(next) =>
                              updateButtonRequiredInputs(btn.id, next)
                            }
                          />
                        </>
                      ) : (
                        <>
                          <ButtonActionsEditor
                            actions={btn.actions}
                            availableActions={availableActions}
                            onUpdate={(next) =>
                              updateButtonActions(btn.id, next)
                            }
                          />
                          <ButtonRequiredInputs
                            actions={btn.actions}
                            actionDetails={actionDetails}
                            peInputs={peInputs}
                            requiredInputs={btn.required_inputs ?? []}
                            onUpdate={(next) =>
                              updateButtonRequiredInputs(btn.id, next)
                            }
                          />
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

          {/* Add buttons */}
          {!loading && (
            <div className="flex flex-wrap gap-2 pt-1">
              {!hasGoogleMaps && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addGoogleMapsButton}
                >
                  <MapPin className="size-3.5 mr-1.5" />
                  Add Google Maps
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={addActionButton}>
                <Plus className="size-3.5 mr-1.5" />
                Add Button
              </Button>
            </div>
          )}
        </div>

        {/* Sticky footer */}
        <div className="border-t px-4 py-3 flex justify-end">
          <Button size="sm" disabled={!dirty || saving} onClick={saveAll}>
            {saving ? (
              <Loader2 className="size-3.5 mr-1.5 animate-spin" />
            ) : (
              <Save className="size-3.5 mr-1.5" />
            )}
            Save Changes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* -------------------------------------------------------------------------- */
/*  Actions editor for a single button                                         */
/* -------------------------------------------------------------------------- */

function ButtonActionsEditor({
  actions,
  availableActions,
  onUpdate,
}: {
  actions: SectionButtonAction[];
  availableActions: WorkflowAction[];
  onUpdate: (actions: SectionButtonAction[]) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const addWorkflowAction = (wf: WorkflowAction) => {
    onUpdate([
      ...actions,
      {
        action_type: "workflow",
        action_uuid: wf.uuid,
        display_order: actions.length,
      },
    ]);
    setPickerOpen(false);
  };

  const removeAction = (idx: number) => {
    onUpdate(actions.filter((_, i) => i !== idx));
  };

  const actionName = (a: SectionButtonAction) => {
    if (a.action_type === "google_maps") return "Google Maps";
    const wf = availableActions.find((w) => w.uuid === a.action_uuid);
    return wf?.name ?? a.action_uuid ?? "Unknown";
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">
        Attached Automations{" "}
        {actions.length > 0 && (
          <span className="text-muted-foreground font-normal">
            ({actions.length})
          </span>
        )}
      </Label>

      {actions.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No actions attached. Add a workflow action below.
        </p>
      )}

      {actions.map((a, idx) => (
        <div
          key={idx}
          className="flex items-center gap-2 rounded border bg-muted/30 px-2 py-1.5"
        >
          <Zap className="size-3 text-muted-foreground shrink-0" />
          <span className="text-xs flex-1 truncate">{actionName(a)}</span>
          <Button
            variant="ghost"
            size="icon"
            className="size-5 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => removeAction(idx)}
          >
            <Trash2 className="size-2.5" />
          </Button>
        </div>
      ))}

      {availableActions.length === 0 ? (
        <p className="text-[10px] text-muted-foreground">
          No pricing engine manual automations available. Create one in Automations
          settings.
        </p>
      ) : (
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-between h-7 text-xs font-normal"
            >
              <span className="text-muted-foreground">
                Attach workflow action...
              </span>
              <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[--radix-popover-trigger-width] p-0"
            align="start"
          >
            <Command>
              <CommandInput placeholder="Search..." />
              <CommandList className="max-h-48">
                <CommandEmpty>No actions found.</CommandEmpty>
                <CommandGroup>
                  {availableActions.map((wf) => (
                    <CommandItem
                      key={wf.uuid}
                      value={wf.name}
                      onSelect={() => addWorkflowAction(wf)}
                    >
                      <Zap className="size-3 mr-1.5 text-muted-foreground" />
                      {wf.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Required Inputs derived from webhook schemas                               */
/* -------------------------------------------------------------------------- */

function ButtonRequiredInputs({
  actions,
  actionDetails,
  peInputs,
  requiredInputs,
  onUpdate,
}: {
  actions: SectionButtonAction[];
  actionDetails: Map<string, ActionDetail>;
  peInputs: PEInput[];
  requiredInputs: string[];
  onUpdate: (requiredInputs: string[]) => void;
}) {
  const webhookInputIds = useMemo(() => {
    const ids = new Set<string>();

    for (const action of actions) {
      if (action.action_type !== "workflow" || !action.action_uuid) continue;
      const detail = actionDetails.get(action.action_uuid);
      if (!detail?.workflow_data?.nodes) continue;

      const triggerNode = detail.workflow_data.nodes.find(
        (n) => n.data.type === "trigger",
      );
      if (!triggerNode?.data.config?.webhookSchema) continue;

      try {
        const schema = JSON.parse(
          triggerNode.data.config.webhookSchema as string,
        ) as WebhookSchemaField[];
        for (const field of schema) {
          if (field.inputId && field.inputId !== "__scenario_id__") {
            ids.add(field.inputId);
          }
        }
      } catch { /* ignore */ }
    }

    return ids;
  }, [actions, actionDetails]);

  const inputMap = useMemo(() => {
    const m = new Map<string, PEInput>();
    for (const inp of peInputs) {
      m.set(inp.id, inp);
    }
    return m;
  }, [peInputs]);

  const sortedInputIds = useMemo(() => {
    return [...webhookInputIds].sort((a, b) => {
      const la = inputMap.get(a)?.input_label ?? a;
      const lb = inputMap.get(b)?.input_label ?? b;
      return la.localeCompare(lb);
    });
  }, [webhookInputIds, inputMap]);

  const toggleRequired = (inputId: string) => {
    const isRequired = requiredInputs.includes(inputId);
    if (isRequired) {
      onUpdate(requiredInputs.filter((id) => id !== inputId));
    } else {
      onUpdate([...requiredInputs, inputId]);
    }
  };

  if (actions.filter((a) => a.action_type === "workflow").length === 0) {
    return null;
  }

  if (sortedInputIds.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs">
        Required Inputs{" "}
        <span className="text-muted-foreground font-normal">
          ({requiredInputs.length} of {sortedInputIds.length})
        </span>
      </Label>
      <p className="text-[10px] text-muted-foreground">
        Toggle which inputs must be filled before this button can be clicked.
      </p>

      <div className="space-y-1">
        {sortedInputIds.map((inputId) => {
          const inp = inputMap.get(inputId);
          const label = inp?.input_label ?? inputId;
          const isRequired = requiredInputs.includes(inputId);

          return (
            <div
              key={inputId}
              className="flex items-center justify-between gap-2 rounded border bg-muted/30 px-2 py-1.5"
            >
              <div className="flex-1 min-w-0">
                <span className="text-xs truncate block">{label}</span>
                {inp?.input_type && (
                  <span className="text-[10px] text-muted-foreground">
                    {inp.input_type}
                  </span>
                )}
              </div>
              <Switch
                checked={isRequired}
                onCheckedChange={() => toggleRequired(inputId)}
                className="shrink-0"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Required Inputs for Google Maps (address-role inputs)                       */
/* -------------------------------------------------------------------------- */

const ADDRESS_ROLE_LABELS: Record<string, string> = {
  street: "Street",
  city: "City",
  state: "State",
  zip: "Zip",
  county: "County",
  apt: "Apt / Unit",
};

function GoogleMapsRequiredInputs({
  peInputs,
  requiredInputs,
  onUpdate,
}: {
  peInputs: PEInput[];
  requiredInputs: string[];
  onUpdate: (requiredInputs: string[]) => void;
}) {
  const addressInputs = useMemo(() => {
    return peInputs
      .filter((inp) => inp.config?.address_role)
      .sort((a, b) => {
        const order = ["street", "apt", "city", "state", "zip", "county"];
        const ai = order.indexOf(String(a.config?.address_role));
        const bi = order.indexOf(String(b.config?.address_role));
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      });
  }, [peInputs]);

  const toggleRequired = (inputId: string) => {
    const isRequired = requiredInputs.includes(inputId);
    if (isRequired) {
      onUpdate(requiredInputs.filter((id) => id !== inputId));
    } else {
      onUpdate([...requiredInputs, inputId]);
    }
  };

  if (addressInputs.length === 0) {
    return (
      <p className="text-[10px] text-muted-foreground">
        No inputs with address configuration found. Configure address roles in
        the input builder to enable required-input validation.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs">
        Required Inputs{" "}
        <span className="text-muted-foreground font-normal">
          ({requiredInputs.length} of {addressInputs.length})
        </span>
      </Label>
      <p className="text-[10px] text-muted-foreground">
        Toggle which address fields must be filled before opening Google Maps.
      </p>

      <div className="space-y-1">
        {addressInputs.map((inp) => {
          const role = String(inp.config?.address_role ?? "");
          const roleLabel = ADDRESS_ROLE_LABELS[role] ?? role;
          const isRequired = requiredInputs.includes(inp.id);

          return (
            <div
              key={inp.id}
              className="flex items-center justify-between gap-2 rounded border bg-muted/30 px-2 py-1.5"
            >
              <div className="flex-1 min-w-0">
                <span className="text-xs truncate block">
                  {inp.input_label}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {roleLabel}
                  {inp.config?.address_role === "street" && " (autocomplete)"}
                </span>
              </div>
              <Switch
                checked={isRequired}
                onCheckedChange={() => toggleRequired(inp.id)}
                className="shrink-0"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Signal Color picker                                                        */
/* -------------------------------------------------------------------------- */

const PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
];

function SignalColorPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (color: string | null) => void;
}) {
  const [color, setColor] = useState(value || "#3b82f6");
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleColorChange = useCallback(
    (newColor: string) => {
      setColor(newColor);
      onChange(newColor);
    },
    [onChange],
  );

  const onReset = useCallback(() => {
    onChange(null);
    setPickerOpen(false);
  }, [onChange]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 h-8 text-xs"
          onClick={() => setPickerOpen((o) => !o)}
        >
          {pickerOpen ? (
            "Close"
          ) : (
            <>
              <span
                className="size-4 rounded-sm border shadow-sm shrink-0"
                style={{ backgroundColor: color }}
              />
              Pick Color
            </>
          )}
        </Button>

        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onReset}>
          Reset
        </Button>
      </div>

      {pickerOpen && (
        <ColorPicker value={color} onValueChange={handleColorChange} inline>
          <ColorPickerInlineContent>
            <ColorPickerArea />
            <div className="flex items-center gap-2">
              <ColorPickerEyeDropper />
              <div className="flex flex-1 flex-col gap-2">
                <ColorPickerHueSlider />
              </div>
            </div>
            <ColorPickerInput />
          </ColorPickerInlineContent>
        </ColorPicker>
      )}

      <div className="flex flex-wrap gap-1.5">
        {PRESET_COLORS.map((presetColor) => (
          <button
            key={presetColor}
            type="button"
            className={cn(
              "size-7 rounded border-2 border-transparent hover:border-border focus:border-ring focus:outline-none transition-all",
              value === presetColor && "ring-2 ring-foreground ring-offset-1",
            )}
            style={{ backgroundColor: presetColor }}
            onClick={() => handleColorChange(presetColor)}
          />
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground">
        Inputs filled by this button will show a colored ring until edited.
      </p>
    </div>
  );
}
