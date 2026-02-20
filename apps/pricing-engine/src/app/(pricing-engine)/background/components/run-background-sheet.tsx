"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Badge } from "@repo/ui/shadcn/badge";
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
  Search,
  User,
  Building,
  Eye,
  EyeOff,
  ChevronsUpDown,
  Check,
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

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

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

  // Mode
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

          // Fetch full decrypted SSN
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
            // SSN fetch failed, leave blank
          }
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
        }
      } catch {
        // ignore
      } finally {
        setLoadingContact(false);
      }
    },
    []
  );

  // Reset form
  const resetForm = useCallback(() => {
    setIsEntity(false);
    setSelectedBorrowerId("");
    setSelectedEntityId("");
    setGlb("B");
    setDppa("3");
    setVoter("7");
    setEntityName("");
    setEntityType("");
    setEin("");
    setStateOfFormation("");
    setDateOfFormation(undefined);
    setFirstName("");
    setMiddleInitial("");
    setLastName("");
    setDob(undefined);
    setSsn("");
    setEmail("");
    setPhone("");
    setStreet("");
    setCity("");
    setStateCode("");
    setZip("");
    setCounty("");
    setProvince("");
    setCountry("US");
    setReportType("comprehensive");
    setNotes("");
  }, []);

  // Handle close
  const handleOpenChange = useCallback(
    (val: boolean) => {
      if (!val) resetForm();
      onOpenChange(val);
    },
    [onOpenChange, resetForm]
  );

  // Submit — POST all fields server-side to n8n via /api/background/run
  const handleSubmit = async () => {
    setSaving(true);
    try {
      const dobStr = dob
        ? `${dob.getFullYear()}-${String(dob.getMonth() + 1).padStart(2, "0")}-${String(dob.getDate()).padStart(2, "0")}`
        : null;
      const dofStr = dateOfFormation
        ? `${dateOfFormation.getFullYear()}-${String(dateOfFormation.getMonth() + 1).padStart(2, "0")}-${String(dateOfFormation.getDate()).padStart(2, "0")}`
        : null;

      const res = await fetch("/api/background/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          borrower_id: isEntity ? null : selectedBorrowerId || null,
          entity_id: isEntity ? selectedEntityId || null : null,
          is_entity: isEntity,
          // Compliance
          glb: glb || null,
          dppa: dppa || null,
          voter: voter || null,
          // Entity fields
          entity_name: entityName || null,
          entity_type: entityType || null,
          ein: ein ? ein.replace(/\D+/g, "") : null,
          state_of_formation: stateOfFormation || null,
          date_of_formation: dofStr,
          // Individual fields
          first_name: firstName || null,
          middle_initial: middleInitial || null,
          last_name: lastName || null,
          date_of_birth: dobStr,
          ssn: ssn ? ssn.replace(/\D+/g, "") : null,
          email: email || null,
          phone: phone ? phone.replace(/\D+/g, "") : null,
          // Address
          street: street || null,
          city: city || null,
          state: stateCode || null,
          zip: zip || null,
          county: county || null,
          province: province || null,
          country: country || "US",
          // Report meta
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

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle>Run Background Check</SheetTitle>
          <SheetDescription>
            Search for an existing borrower or entity, or fill in the details manually.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 pb-6">
          {/* Mode Toggle */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Subject Type</Label>
            <div className="flex gap-2">
              <Button
                variant={!isEntity ? "default" : "outline"}
                size="sm"
                className="flex-1 gap-2"
                onClick={() => {
                  setIsEntity(false);
                  setSelectedEntityId("");
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
                  setIsEntity(true);
                  setSelectedBorrowerId("");
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
              {isEntity ? "Search Existing Entity" : "Search Existing Borrower"}
            </Label>
            {!isEntity ? (
              <Popover open={borrowerSearchOpen} onOpenChange={setBorrowerSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal h-9"
                  >
                    <span className={cn("truncate", !selectedBorrower && "text-muted-foreground")}>
                      {selectedBorrower
                        ? `${selectedBorrower.first_name} ${selectedBorrower.last_name}`
                        : "Select borrower or leave blank..."}
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
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedBorrowerId === b.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="text-sm">
                                {b.first_name} {b.last_name}
                              </span>
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
                    className="w-full justify-between font-normal h-9"
                  >
                    <span className={cn("truncate", !selectedEntity && "text-muted-foreground")}>
                      {selectedEntity
                        ? selectedEntity.entity_name
                        : "Select entity or leave blank..."}
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
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedEntityId === e.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="text-sm">{e.entity_name}</span>
                              {e.entity_type && (
                                <span className="text-xs text-muted-foreground">
                                  {e.entity_type}
                                </span>
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
          </div>

          {loadingContact && (
            <div className="flex items-center gap-2 justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Loading contact info...</span>
            </div>
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

          {/* Entity Fields */}
          {isEntity ? (
            <div>
              <h3 className="text-sm font-semibold mb-3">Entity Information</h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Entity Name</Label>
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
                    <DateInput
                      value={dateOfFormation}
                      onChange={setDateOfFormation}
                      emptyOnMount
                      className="h-9"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Individual Fields */
            <div>
              <h3 className="text-sm font-semibold mb-3">Personal Information</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-5 gap-3">
                  <div className="col-span-2">
                    <Label className="text-xs">First Name</Label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First Name"
                      autoComplete="off"
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
                    <Label className="text-xs">Last Name</Label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last Name"
                      autoComplete="off"
                      data-1p-ignore
                      data-lpignore="true"
                      className="h-9"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Date of Birth</Label>
                    <DateInput
                      value={dob}
                      onChange={setDob}
                      emptyOnMount
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">SSN</Label>
                    <div className="relative">
                      <Input
                        type={showSsn ? "text" : "password"}
                        value={ssn}
                        onChange={(e) => setSsn(formatSSN(e.target.value))}
                        placeholder="123-45-6789"
                        autoComplete="off"
                        data-1p-ignore
                        data-lpignore="true"
                        name="bg-ssn-field"
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Email Address</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      autoComplete="off"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Phone Number</Label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(formatUSPhone(e.target.value))}
                      placeholder="(555) 555-5555"
                      className="h-9"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Address */}
          <div>
            <h3 className="text-sm font-semibold mb-3">
              {isEntity ? "Business Address" : "Primary Residence"}
            </h3>
            <div className="space-y-3">
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
              {country === "CA" && (
                <div>
                  <Label className="text-xs">Province</Label>
                  <Select value={province} onValueChange={setProvince}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Province" /></SelectTrigger>
                    <SelectContent>
                      {PROVINCE_OPTIONS.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
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
        </div>

        <SheetFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Run Background
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
