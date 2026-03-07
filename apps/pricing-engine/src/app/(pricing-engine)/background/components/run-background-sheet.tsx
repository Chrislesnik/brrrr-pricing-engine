"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@repo/ui/shadcn/sheet";
import { Button } from "@repo/ui/shadcn/button";
import { Input } from "@repo/ui/shadcn/input";
import { Label } from "@repo/ui/shadcn/label";
import { Separator } from "@repo/ui/shadcn/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/shadcn/select";
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
import { Textarea } from "@repo/ui/shadcn/textarea";
import { cn } from "@repo/lib/cn";
import {
  Loader2,
  User,
  Building,
  Eye,
  EyeOff,
  ChevronsUpDown,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { DateInput } from "@/components/date-input";

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const STATE_OPTIONS = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN",
  "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV",
  "NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN",
  "TX","UT","VT","VA","WA","WV","WI","WY","DC",
];

const PROVINCE_OPTIONS = [
  "AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT",
];

const ENTITY_TYPE_OPTIONS = [
  "Corporation",
  "General Partnership",
  "Limited Liability Company",
  "Limited Partnership",
  "Sole Proprietorship",
  "Revocable Trust",
];

const REPORT_TYPE_OPTIONS = [
  "criminal",
  "identity",
  "business",
  "comprehensive",
  "other",
];

/* -------------------------------------------------------------------------- */
/*  Formatters                                                                 */
/* -------------------------------------------------------------------------- */

const formatSSN = (input: string) => {
  const d = input.replace(/\D+/g, "").slice(0, 9);
  if (d.length <= 3) return d;
  if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
};

const maskSSN = (ssn: string): string => {
  const digits = ssn.replace(/\D+/g, "");
  if (digits.length < 4) return ssn;
  return `***-**-${digits.slice(-4)}`;
};

const formatUSPhone = (input: string) => {
  const digits = input.replace(/\D+/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  const cc = digits[0];
  const national = digits.slice(1);
  if (national.length === 0) return `+${cc}`;
  if (national.length <= 3) return `+${cc} (${national}`;
  if (national.length <= 6)
    return `+${cc} (${national.slice(0, 3)}) ${national.slice(3)}`;
  return `+${cc} (${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`;
};

const formatEIN = (input: string) => {
  const d = input.replace(/\D+/g, "").slice(0, 9);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}-${d.slice(2)}`;
};

const formatDate = (date: Date | undefined): string => {
  if (!date || isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

type SheetMode = "idle" | "quick-add" | "selected";

interface OwnerRow {
  key: string;
  name: string;
  title: string;
  member_type: "" | "Individual" | "Entity";
  ownership_percent: string;
  ssn: string;
  ein: string;
}

const emptyOwner = (): OwnerRow => ({
  key: Math.random().toString(36).slice(2),
  name: "",
  title: "",
  member_type: "",
  ownership_percent: "",
  ssn: "",
  ein: "",
});

interface BorrowerOption {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
}

interface EntityOption {
  id: string;
  entity_name: string;
  entity_type?: string;
}

interface RunBackgroundSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function RunBackgroundSheet({ open, onOpenChange, onCreated }: RunBackgroundSheetProps) {
  const { toast } = useToast();

  const [mode, setMode] = useState<SheetMode>("idle");
  const [isEntity, setIsEntity] = useState(false);

  // Search / select existing
  const [borrowers, setBorrowers] = useState<BorrowerOption[]>([]);
  const [entities, setEntities] = useState<EntityOption[]>([]);
  const [selectedBorrowerId, setSelectedBorrowerId] = useState<string>("");
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");
  const [borrowerSearchOpen, setBorrowerSearchOpen] = useState(false);
  const [entitySearchOpen, setEntitySearchOpen] = useState(false);

  // Compliance
  const [glb, setGlb] = useState("B");
  const [dppa, setDppa] = useState("3");
  const [voter, setVoter] = useState("7");

  // Entity fields
  const [entityName, setEntityName] = useState("");
  const [entityType, setEntityType] = useState("");
  const [ein, setEin] = useState("");
  const [stateOfFormation, setStateOfFormation] = useState("");
  const [dateOfFormation, setDateOfFormation] = useState<Date | undefined>(undefined);

  // Owners (for entity quick-add)
  const [owners, setOwners] = useState<OwnerRow[]>([]);

  // Individual fields
  const [firstName, setFirstName] = useState("");
  const [middleInitial, setMiddleInitial] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState<Date | undefined>(undefined);
  const [ssn, setSsn] = useState("");
  const [showSsn, setShowSsn] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Address
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [zip, setZip] = useState("");
  const [county, setCounty] = useState("");
  const [province, setProvince] = useState("");
  const [country, setCountry] = useState("US");

  // Report meta
  const [reportType, setReportType] = useState("comprehensive");
  const [notes, setNotes] = useState("");

  // UI state
  const [saving, setSaving] = useState(false);
  const [creatingRecord, setCreatingRecord] = useState(false);
  const [loadingContact, setLoadingContact] = useState(false);

  // Fetch borrowers and entities when sheet opens
  useEffect(() => {
    if (!open) return;
    async function fetchContacts() {
      try {
        const [bRes, eRes] = await Promise.all([
          fetch("/api/applicants/borrowers/list"),
          fetch("/api/applicants/entities/list"),
        ]);
        if (bRes.ok) {
          const bJson = await bRes.json();
          const bList = bJson.items ?? bJson.borrowers ?? [];
          setBorrowers(
            (Array.isArray(bList) ? bList : []).map((b: Record<string, unknown>) => ({
              id: b.id as string,
              first_name: (b.first_name as string) ?? "",
              last_name: (b.last_name as string) ?? "",
              email: (b.email as string) ?? "",
            }))
          );
        }
        if (eRes.ok) {
          const eJson = await eRes.json();
          const eList = eJson.items ?? eJson.entities ?? [];
          setEntities(
            (Array.isArray(eList) ? eList : []).map((e: Record<string, unknown>) => ({
              id: e.id as string,
              entity_name: (e.entity_name as string) ?? "",
              entity_type: (e.entity_type as string) ?? "",
            }))
          );
        }
      } catch {
        // Non-critical
      }
    }
    fetchContacts();
  }, [open]);

  const clearAllFields = useCallback(() => {
    setEntityName("");
    setEntityType("");
    setEin("");
    setStateOfFormation("");
    setDateOfFormation(undefined);
    setOwners([]);
    setFirstName("");
    setMiddleInitial("");
    setLastName("");
    setDob(undefined);
    setSsn("");
    setShowSsn(false);
    setEmail("");
    setPhone("");
    setStreet("");
    setCity("");
    setStateCode("");
    setZip("");
    setCounty("");
    setProvince("");
    setCountry("US");
  }, []);

  // Populate fields when a borrower is selected
  const handleSelectBorrower = useCallback(
    async (borrowerId: string) => {
      setSelectedBorrowerId(borrowerId);
      setBorrowerSearchOpen(false);
      if (!borrowerId) return;

      setLoadingContact(true);
      try {
        const res = await fetch(`/api/borrowers/${encodeURIComponent(borrowerId)}`);
        if (res.ok) {
          const json = await res.json();
          const b = json.borrower ?? json;
          setFirstName((b.first_name as string) ?? "");
          setMiddleInitial((b.middle_initial as string) ?? "");
          setLastName((b.last_name as string) ?? "");
          setEmail((b.email as string) ?? "");
          if (b.primary_phone) setPhone(formatUSPhone(String(b.primary_phone)));
          if (b.date_of_birth) {
            const [y, m, d] = String(b.date_of_birth).split(/[-T]/);
            setDob(new Date(Number(y), Number(m) - 1, Number(d)));
          }
          setStreet((b.address_line1 as string) ?? "");
          setCity((b.city as string) ?? "");
          setStateCode((b.state as string) ?? "");
          setZip((b.zip as string) ?? "");
          setCounty((b.county as string) ?? "");
          setCountry((b.country as string) || "US");

          try {
            const ssnRes = await fetch(
              `/api/applicants/borrowers/${encodeURIComponent(borrowerId)}/ssn`,
              { cache: "no-store" }
            );
            if (ssnRes.ok) {
              const ssnJson = await ssnRes.json();
              const digits = String(ssnJson?.ssn ?? "").replace(/\D+/g, "").slice(0, 9);
              if (digits.length === 9) {
                setSsn(formatSSN(digits));
              }
            }
          } catch {
            // ignore
          }

          setMode("selected");
        }
      } catch {
        // ignore
      } finally {
        setLoadingContact(false);
      }
    },
    []
  );

  // Populate fields when an entity is selected
  const handleSelectEntity = useCallback(
    async (entityId: string) => {
      setSelectedEntityId(entityId);
      setEntitySearchOpen(false);
      if (!entityId) return;

      setLoadingContact(true);
      try {
        const res = await fetch(
          `/api/applicants/entities/${encodeURIComponent(entityId)}`
        );
        if (res.ok) {
          const json = await res.json();
          const ent = json.entity ?? json;
          setEntityName((ent.entity_name as string) ?? "");
          setEntityType((ent.entity_type as string) ?? "");
          setEin(ent.ein ? formatEIN(String(ent.ein)) : "");
          setStateOfFormation((ent.state_formed as string) ?? "");
          if (ent.date_formed) {
            const [y, m, d] = String(ent.date_formed).split(/[-T]/);
            setDateOfFormation(new Date(Number(y), Number(m) - 1, Number(d)));
          }
          setStreet((ent.address_line1 as string) ?? "");
          setCity((ent.city as string) ?? "");
          setStateCode((ent.state as string) ?? "");
          setZip((ent.zip as string) ?? "");
          setCounty((ent.county as string) ?? "");
          setCountry((ent.country as string) || "US");

          setMode("selected");
        }
      } catch {
        // ignore
      } finally {
        setLoadingContact(false);
      }
    },
    []
  );

  const handleClearSelection = useCallback(() => {
    setSelectedBorrowerId("");
    setSelectedEntityId("");
    clearAllFields();
    setMode("idle");
  }, [clearAllFields]);

  // Reset form
  const resetForm = useCallback(() => {
    setMode("idle");
    setIsEntity(false);
    setSelectedBorrowerId("");
    setSelectedEntityId("");
    setGlb("B");
    setDppa("3");
    setVoter("7");
    clearAllFields();
    setReportType("comprehensive");
    setNotes("");
  }, [clearAllFields]);

  const handleOpenChange = useCallback(
    (val: boolean) => {
      if (!val) resetForm();
      onOpenChange(val);
    },
    [onOpenChange, resetForm]
  );

  // Quick-add borrower
  const handleCreateBorrower = async () => {
    if (!firstName.trim() || !lastName.trim()) return;
    setCreatingRecord(true);
    try {
      const ssnDigits = ssn.replace(/\D+/g, "");
      const payload: Record<string, unknown> = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        date_of_birth: formatDate(dob) || undefined,
        email: email.trim() || undefined,
        primary_phone: phone.trim() || undefined,
        address_line1: street.trim() || undefined,
        city: city.trim() || undefined,
        state: stateCode || undefined,
        zip: zip.trim() || undefined,
        county: county.trim() || undefined,
      };
      if (ssnDigits.length === 9) payload.ssn = ssnDigits;

      const res = await fetch("/api/borrowers/quick-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        const b = json.borrower;
        setSelectedBorrowerId(b.id);
        setBorrowers((prev) => [
          { id: b.id, first_name: b.first_name, last_name: b.last_name, email: b.email ?? "" },
          ...prev,
        ]);
        setMode("selected");
      } else {
        toast({ title: "Failed to create borrower", description: json.error || "Unknown error" });
      }
    } catch {
      toast({ title: "Error", description: "An unexpected error occurred creating the borrower." });
    } finally {
      setCreatingRecord(false);
    }
  };

  // Quick-add entity
  const handleCreateEntity = async () => {
    if (!entityName.trim()) return;
    setCreatingRecord(true);
    try {
      const ownersPayload = owners
        .filter((o) => o.name.trim())
        .map((o) => ({
          name: o.name.trim(),
          title: o.title.trim() || undefined,
          member_type: o.member_type || undefined,
          ownership_percent: o.ownership_percent ? Number(o.ownership_percent) : undefined,
          ssn: o.member_type === "Individual" && o.ssn ? o.ssn.replace(/\D+/g, "") : undefined,
          ein: o.member_type === "Entity" && o.ein ? o.ein.replace(/\D+/g, "") : undefined,
        }));

      const payload: Record<string, unknown> = {
        entity_name: entityName.trim(),
        entity_type: entityType || undefined,
        ein: ein ? ein.replace(/\D+/g, "") : undefined,
        date_formed: formatDate(dateOfFormation) || undefined,
        state_formed: stateOfFormation || undefined,
        address_line1: street.trim() || undefined,
        city: city.trim() || undefined,
        state: stateCode || undefined,
        zip: zip.trim() || undefined,
        county: county.trim() || undefined,
      };
      if (ownersPayload.length > 0) payload.owners = ownersPayload;

      const res = await fetch("/api/entities/quick-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        const ent = json.entity;
        setSelectedEntityId(ent.id);
        setEntities((prev) => [
          { id: ent.id, entity_name: ent.entity_name, entity_type: ent.entity_type ?? "" },
          ...prev,
        ]);
        setMode("selected");
      } else {
        toast({ title: "Failed to create entity", description: json.error || "Unknown error" });
      }
    } catch {
      toast({ title: "Error", description: "An unexpected error occurred creating the entity." });
    } finally {
      setCreatingRecord(false);
    }
  };

  // Owner helpers
  const updateOwner = (key: string, field: keyof OwnerRow, value: string) => {
    setOwners((prev) =>
      prev.map((o) => (o.key === key ? { ...o, [field]: value } : o))
    );
  };

  const removeOwner = (key: string) => {
    setOwners((prev) => prev.filter((o) => o.key !== key));
  };

  // Submit background run
  const handleSubmit = async () => {
    const activeId = isEntity ? selectedEntityId : selectedBorrowerId;
    if (!activeId) return;

    setSaving(true);
    try {
      const dobStr = formatDate(dob) || null;
      const dofStr = formatDate(dateOfFormation) || null;

      const res = await fetch("/api/background/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          borrower_id: isEntity ? null : selectedBorrowerId,
          entity_id: isEntity ? selectedEntityId : null,
          is_entity: isEntity,
          glb: glb || null,
          dppa: dppa || null,
          voter: voter || null,
          entity_name: entityName || null,
          entity_type: entityType || null,
          ein: ein ? ein.replace(/\D+/g, "") : null,
          state_of_formation: stateOfFormation || null,
          date_of_formation: dofStr,
          first_name: firstName || null,
          middle_initial: middleInitial || null,
          last_name: lastName || null,
          date_of_birth: dobStr,
          ssn: ssn ? ssn.replace(/\D+/g, "") : null,
          email: email || null,
          phone: phone ? phone.replace(/\D+/g, "") : null,
          street: street || null,
          city: city || null,
          state: stateCode || null,
          zip: zip || null,
          county: county || null,
          province: province || null,
          country: country || "US",
          report_type: reportType || null,
          notes: notes || null,
        }),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok || j?.ok === false) {
        throw new Error(j?.error || `Background run failed (status ${res.status})`);
      }

      toast({
        title: "Background check dispatched",
        description: "The request has been sent for processing.",
      });
      onCreated?.();
      handleOpenChange(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Background run failed";
      toast({ title: "Background run failed", description: msg });
    } finally {
      setSaving(false);
    }
  };

  const selectedBorrower = borrowers.find((b) => b.id === selectedBorrowerId);
  const selectedEntity = entities.find((e) => e.id === selectedEntityId);
  const canRun = mode === "selected" && (isEntity ? !!selectedEntityId : !!selectedBorrowerId);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle>Run Background Check</SheetTitle>
          <SheetDescription>
            Select an existing borrower or entity, or quick-add a new one to run a background check.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 pb-6">
          {/* Subject Type Toggle */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Subject Type</Label>
            <div className="flex gap-2">
              <Button
                variant={!isEntity ? "default" : "outline"}
                size="sm"
                className="flex-1 gap-2"
                onClick={() => {
                  if (isEntity) {
                    setIsEntity(false);
                    setSelectedEntityId("");
                    clearAllFields();
                    setMode("idle");
                  }
                }}
              >
                <User className="h-4 w-4" />
                Individual
              </Button>
              <Button
                variant={isEntity ? "default" : "outline"}
                size="sm"
                className="flex-1 gap-2"
                onClick={() => {
                  if (!isEntity) {
                    setIsEntity(true);
                    setSelectedBorrowerId("");
                    clearAllFields();
                    setMode("idle");
                  }
                }}
              >
                <Building className="h-4 w-4" />
                Entity
              </Button>
            </div>
          </div>

          {/* Search Existing */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">
              {isEntity ? "Select Entity" : "Select Borrower"}
            </Label>
            <div className="flex items-center gap-2">
              {!isEntity ? (
                <Popover open={borrowerSearchOpen} onOpenChange={setBorrowerSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      disabled={mode === "quick-add"}
                      className="w-full justify-between font-normal h-9"
                    >
                      <span className={cn("truncate", !selectedBorrower && "text-muted-foreground")}>
                        {selectedBorrower
                          ? `${selectedBorrower.first_name} ${selectedBorrower.last_name}`
                          : "Select a borrower..."}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search borrowers..." />
                      <CommandList className="max-h-48">
                        <CommandEmpty>No borrowers found.</CommandEmpty>
                        <CommandGroup>
                          {borrowers.map((b) => (
                            <CommandItem
                              key={b.id}
                              value={`${b.first_name} ${b.last_name} ${b.email}`}
                              onSelect={() => handleSelectBorrower(b.id)}
                            >
                              <div className="flex flex-col">
                                <span className="text-sm">{b.first_name} {b.last_name}</span>
                                {b.email && (
                                  <span className="text-xs text-muted-foreground">{b.email}</span>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              ) : (
                <Popover open={entitySearchOpen} onOpenChange={setEntitySearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      disabled={mode === "quick-add"}
                      className="w-full justify-between font-normal h-9"
                    >
                      <span className={cn("truncate", !selectedEntity && "text-muted-foreground")}>
                        {selectedEntity
                          ? selectedEntity.entity_name
                          : "Select an entity..."}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search entities..." />
                      <CommandList className="max-h-48">
                        <CommandEmpty>No entities found.</CommandEmpty>
                        <CommandGroup>
                          {entities.map((e) => (
                            <CommandItem
                              key={e.id}
                              value={`${e.entity_name} ${e.entity_type}`}
                              onSelect={() => handleSelectEntity(e.id)}
                            >
                              <div className="flex flex-col">
                                <span className="text-sm">{e.entity_name}</span>
                                {e.entity_type && (
                                  <span className="text-xs text-muted-foreground">{e.entity_type}</span>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
              {mode === "selected" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={handleClearSelection}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {loadingContact && (
            <div className="flex items-center gap-2 justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Loading contact info...</span>
            </div>
          )}

          {/* Quick Add link (idle mode only) */}
          {mode === "idle" && !loadingContact && (
            <button
              type="button"
              className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              onClick={() => {
                clearAllFields();
                setMode("quick-add");
              }}
            >
              <Plus className="h-4 w-4" />
              {isEntity ? "Quick Add New Entity" : "Quick Add New Borrower"}
            </button>
          )}

          {/* ============================================================== */}
          {/* READ-ONLY DISPLAY (selected mode)                               */}
          {/* ============================================================== */}
          {mode === "selected" && !loadingContact && !isEntity && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-3">Personal Information</h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-5 gap-3">
                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground">First Name</Label>
                      <p className="text-sm mt-0.5">{firstName || "—"}</p>
                    </div>
                    <div className="col-span-1">
                      <Label className="text-xs text-muted-foreground">MI</Label>
                      <p className="text-sm mt-0.5">{middleInitial || "—"}</p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground">Last Name</Label>
                      <p className="text-sm mt-0.5">{lastName || "—"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Date of Birth</Label>
                      <p className="text-sm mt-0.5">{formatDate(dob) || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">SSN</Label>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm mt-0.5">
                          {ssn ? (showSsn ? ssn : maskSSN(ssn)) : "—"}
                        </p>
                        {ssn && (
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => setShowSsn(!showSsn)}
                          >
                            {showSsn ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  {(email || phone) && (
                    <div className="grid grid-cols-2 gap-3">
                      {email && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Email</Label>
                          <p className="text-sm mt-0.5">{email}</p>
                        </div>
                      )}
                      {phone && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Phone</Label>
                          <p className="text-sm mt-0.5">{phone}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-3">Primary Residence</h3>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Street</Label>
                    <p className="text-sm mt-0.5">{street || "—"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">City</Label>
                      <p className="text-sm mt-0.5">{city || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">State</Label>
                      <p className="text-sm mt-0.5">{stateCode || "—"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Zip Code</Label>
                      <p className="text-sm mt-0.5">{zip || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">County</Label>
                      <p className="text-sm mt-0.5">{county || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Country</Label>
                      <p className="text-sm mt-0.5">{country || "—"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {mode === "selected" && !loadingContact && isEntity && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-3">Entity Information</h3>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Entity Name</Label>
                    <p className="text-sm mt-0.5">{entityName || "—"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Entity Type</Label>
                      <p className="text-sm mt-0.5">{entityType || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">EIN</Label>
                      <p className="text-sm mt-0.5">{ein || "—"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">State of Formation</Label>
                      <p className="text-sm mt-0.5">{stateOfFormation || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Date of Formation</Label>
                      <p className="text-sm mt-0.5">{formatDate(dateOfFormation) || "—"}</p>
                    </div>
                  </div>
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-3">Business Address</h3>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Street</Label>
                    <p className="text-sm mt-0.5">{street || "—"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">City</Label>
                      <p className="text-sm mt-0.5">{city || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">State</Label>
                      <p className="text-sm mt-0.5">{stateCode || "—"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Zip Code</Label>
                      <p className="text-sm mt-0.5">{zip || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">County</Label>
                      <p className="text-sm mt-0.5">{county || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Country</Label>
                      <p className="text-sm mt-0.5">{country || "—"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ============================================================== */}
          {/* QUICK-ADD INDIVIDUAL                                            */}
          {/* ============================================================== */}
          {mode === "quick-add" && !isEntity && (
            <>
              <Separator />
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">New Borrower</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground"
                    onClick={() => { clearAllFields(); setMode("idle"); }}
                  >
                    Cancel
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-5 gap-3">
                    <div className="col-span-2">
                      <Label className="text-xs">First Name <span className="text-red-500">*</span></Label>
                      <Input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First Name"
                        name="bg-order-given"
                        autoComplete="one-time-code"
                        data-1p-ignore
                        data-lpignore="true"
                        className="h-9"
                      />
                    </div>
                    <div className="col-span-1">
                      <Label className="text-xs">MI</Label>
                      <Input
                        value={middleInitial}
                        onChange={(e) => setMiddleInitial(e.target.value.slice(0, 1))}
                        placeholder="M"
                        maxLength={1}
                        autoComplete="off"
                        className="h-9"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Last Name <span className="text-red-500">*</span></Label>
                      <Input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Last Name"
                        name="bg-order-surname"
                        autoComplete="one-time-code"
                        data-1p-ignore
                        data-lpignore="true"
                        className="h-9"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Email</Label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@example.com"
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Phone</Label>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(formatUSPhone(e.target.value))}
                        placeholder="(555) 555-5555"
                        className="h-9"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Date of Birth</Label>
                      <DateInput value={dob} onChange={setDob} emptyOnMount className="h-9" />
                    </div>
                    <div>
                      <Label className="text-xs">SSN</Label>
                      <div className="relative">
                        <Input
                          type={showSsn ? "text" : "password"}
                          value={ssn}
                          onChange={(e) => setSsn(formatSSN(e.target.value))}
                          placeholder="123-45-6789"
                          inputMode="numeric"
                          name="bg-order-tin"
                          autoComplete="one-time-code"
                          data-1p-ignore
                          data-lpignore="true"
                          className="h-9 pr-9"
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowSsn(!showSsn)}
                        >
                          {showSsn ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-xs">Street</Label>
                    <AddressAutocomplete
                      value={street}
                      onChange={(addr) => {
                        if (addr.raw) setStreet(addr.raw);
                        else if (addr.address_line1) setStreet(addr.address_line1);
                        if (addr.city) setCity(addr.city);
                        if (addr.state) setStateCode(addr.state);
                        if (addr.zip) setZip(addr.zip);
                        if (addr.county) setCounty(addr.county);
                      }}
                      placeholder="123 Main St"
                      className="h-9"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">City</Label>
                      <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="h-9" />
                    </div>
                    <div>
                      <Label className="text-xs">State</Label>
                      <Select value={stateCode} onValueChange={setStateCode}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="State" /></SelectTrigger>
                        <SelectContent>
                          {STATE_OPTIONS.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Zip Code</Label>
                      <Input value={zip} onChange={(e) => setZip(e.target.value)} placeholder="12345" className="h-9" />
                    </div>
                    <div>
                      <Label className="text-xs">County</Label>
                      <Input value={county} onChange={(e) => setCounty(e.target.value)} placeholder="County" className="h-9" />
                    </div>
                  </div>

                  <Button
                    className="w-full mt-2"
                    onClick={handleCreateBorrower}
                    disabled={creatingRecord || !firstName.trim() || !lastName.trim()}
                  >
                    {creatingRecord && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <User className="mr-2 h-4 w-4" />
                    Create Borrower
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* ============================================================== */}
          {/* QUICK-ADD ENTITY                                                */}
          {/* ============================================================== */}
          {mode === "quick-add" && isEntity && (
            <>
              <Separator />
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">New Entity</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground"
                    onClick={() => { clearAllFields(); setMode("idle"); }}
                  >
                    Cancel
                  </Button>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Entity Name <span className="text-red-500">*</span></Label>
                    <Input
                      value={entityName}
                      onChange={(e) => setEntityName(e.target.value)}
                      placeholder="Entity Name"
                      className="h-9"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Entity Type</Label>
                      <Select value={entityType} onValueChange={setEntityType}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          {ENTITY_TYPE_OPTIONS.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">EIN</Label>
                      <Input
                        value={ein}
                        onChange={(e) => setEin(formatEIN(e.target.value))}
                        placeholder="XX-XXXXXXX"
                        maxLength={10}
                        className="h-9"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">State of Formation</Label>
                      <Select value={stateOfFormation} onValueChange={setStateOfFormation}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="State" /></SelectTrigger>
                        <SelectContent>
                          {STATE_OPTIONS.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Date of Formation</Label>
                      <DateInput value={dateOfFormation} onChange={setDateOfFormation} emptyOnMount className="h-9" />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-xs">Street</Label>
                    <AddressAutocomplete
                      value={street}
                      onChange={(addr) => {
                        if (addr.raw) setStreet(addr.raw);
                        else if (addr.address_line1) setStreet(addr.address_line1);
                        if (addr.city) setCity(addr.city);
                        if (addr.state) setStateCode(addr.state);
                        if (addr.zip) setZip(addr.zip);
                        if (addr.county) setCounty(addr.county);
                        if (addr.country) setCountry(addr.country);
                      }}
                      placeholder="123 Main St"
                      className="h-9"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">City</Label>
                      <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="h-9" />
                    </div>
                    <div>
                      <Label className="text-xs">State</Label>
                      <Select value={stateCode} onValueChange={setStateCode}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="State" /></SelectTrigger>
                        <SelectContent>
                          {STATE_OPTIONS.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Zip Code</Label>
                      <Input value={zip} onChange={(e) => setZip(e.target.value)} placeholder="12345" className="h-9" />
                    </div>
                    <div>
                      <Label className="text-xs">County</Label>
                      <Input value={county} onChange={(e) => setCounty(e.target.value)} placeholder="County" className="h-9" />
                    </div>
                    <div>
                      <Label className="text-xs">Country</Label>
                      <Select value={country} onValueChange={setCountry}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="US">US</SelectItem>
                          <SelectItem value="CA">CA</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  {/* Owners */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs font-semibold">Owners</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setOwners((prev) => [...prev, emptyOwner()])}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Add Owner
                      </Button>
                    </div>
                    {owners.length === 0 && (
                      <p className="text-xs text-muted-foreground">No owners added yet.</p>
                    )}
                    <div className="space-y-3">
                      {owners.map((o, idx) => (
                        <div key={o.key} className="rounded-md border p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Owner {idx + 1}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => removeOwner(o.key)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Name</Label>
                              <Input
                                value={o.name}
                                onChange={(e) => updateOwner(o.key, "name", e.target.value)}
                                placeholder="Full Name"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Title</Label>
                              <Input
                                value={o.title}
                                onChange={(e) => updateOwner(o.key, "title", e.target.value)}
                                placeholder="Title"
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Member Type</Label>
                              <Select
                                value={o.member_type}
                                onValueChange={(v) => updateOwner(o.key, "member_type", v)}
                              >
                                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Type" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Individual">Individual</SelectItem>
                                  <SelectItem value="Entity">Entity</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Ownership %</Label>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={o.ownership_percent}
                                onChange={(e) => updateOwner(o.key, "ownership_percent", e.target.value)}
                                placeholder="0-100"
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>
                          {o.member_type === "Individual" && (
                            <div>
                              <Label className="text-xs">SSN</Label>
                              <Input
                                value={o.ssn}
                                onChange={(e) => updateOwner(o.key, "ssn", formatSSN(e.target.value))}
                                placeholder="123-45-6789"
                                className="h-8 text-sm"
                              />
                            </div>
                          )}
                          {o.member_type === "Entity" && (
                            <div>
                              <Label className="text-xs">EIN</Label>
                              <Input
                                value={o.ein}
                                onChange={(e) => updateOwner(o.key, "ein", formatEIN(e.target.value))}
                                placeholder="XX-XXXXXXX"
                                className="h-8 text-sm"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    className="w-full mt-2"
                    onClick={handleCreateEntity}
                    disabled={creatingRecord || !entityName.trim()}
                  >
                    {creatingRecord && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Building className="mr-2 h-4 w-4" />
                    Create Entity
                  </Button>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Permissible Purpose & Compliance */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Permissible Purpose & Compliance</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">GLB</Label>
                <Select value={glb} onValueChange={setGlb}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select GLB" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="B">B</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">DPPA</Label>
                <Select value={dppa} onValueChange={setDppa}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select DPPA" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">VOTER</Label>
                <Select value={voter} onValueChange={setVoter}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select VOTER" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Report Metadata */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Report Details</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REPORT_TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes about this report..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Hint when no selection */}
          {!canRun && mode !== "quick-add" && !loadingContact && (
            <p className="text-xs text-muted-foreground text-center">
              Select or add {isEntity ? "an entity" : "a borrower"} above to run a background check.
            </p>
          )}
        </div>

        <SheetFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !canRun}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Run Background
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
