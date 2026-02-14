"use client";

import { useCallback, useEffect, useState } from "react";
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
import { Checkbox } from "@repo/ui/shadcn/checkbox";
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
import { cn } from "@repo/lib/cn";
import {
  Loader2,
  User,
  ChevronsUpDown,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import { DateInput } from "@/components/date-input";
import { AddressAutocomplete } from "@/components/address-autocomplete";

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const STATE_OPTIONS = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN",
  "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV",
  "NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN",
  "TX","UT","VT","VA","WA","WV","WI","WY","DC",
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

const formatDob = (date: Date | undefined): string => {
  if (!date || isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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

interface RunCreditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function RunCreditSheet({ open, onOpenChange, onCreated }: RunCreditSheetProps) {
  // Borrower search
  const [borrowers, setBorrowers] = useState<BorrowerOption[]>([]);
  const [selectedBorrowerId, setSelectedBorrowerId] = useState<string>("");
  const [borrowerSearchOpen, setBorrowerSearchOpen] = useState(false);

  // Personal info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [ssn, setSsn] = useState("");
  const [showSsn, setShowSsn] = useState(false);
  const [dob, setDob] = useState<Date | undefined>(undefined);

  // Address
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [zip, setZip] = useState("");
  const [county, setCounty] = useState("");

  // Pull config
  const [pullType, setPullType] = useState<"hard" | "soft">("soft");
  const [includeTU, setIncludeTU] = useState(true);
  const [includeEX, setIncludeEX] = useState(true);
  const [includeEQ, setIncludeEQ] = useState(true);

  // UI
  const [saving, setSaving] = useState(false);
  const [loadingContact, setLoadingContact] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  // Fetch borrowers
  useEffect(() => {
    if (!open) return;
    async function fetchBorrowers() {
      try {
        const res = await fetch("/api/applicants/borrowers/list");
        if (res.ok) {
          const json = await res.json();
          const list = json.items ?? json.borrowers ?? [];
          setBorrowers(
            (Array.isArray(list) ? list : []).map((b: Record<string, unknown>) => ({
              id: b.id as string,
              first_name: (b.first_name as string) ?? "",
              last_name: (b.last_name as string) ?? "",
              email: (b.email as string) ?? "",
            }))
          );
        }
      } catch {
        // ignore
      }
    }
    fetchBorrowers();
  }, [open]);

  // Populate from borrower
  const handleSelectBorrower = useCallback(async (borrowerId: string) => {
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
        setLastName((b.last_name as string) ?? "");
        if (b.date_of_birth) {
          const [y, m, d] = String(b.date_of_birth).split(/[-T]/);
          setDob(new Date(Number(y), Number(m) - 1, Number(d)));
        }
        setStreet((b.address_line1 as string) ?? "");
        setCity((b.city as string) ?? "");
        setStateCode((b.state as string) ?? "");
        setZip((b.zip as string) ?? "");
        setCounty((b.county as string) ?? "");

        // Fetch decrypted SSN
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
      }
    } catch {
      // ignore
    } finally {
      setLoadingContact(false);
    }
  }, []);

  // Reset
  const resetForm = useCallback(() => {
    setSelectedBorrowerId("");
    setFirstName("");
    setLastName("");
    setSsn("");
    setShowSsn(false);
    setDob(undefined);
    setStreet("");
    setCity("");
    setStateCode("");
    setZip("");
    setCounty("");
    setPullType("soft");
    setIncludeTU(true);
    setIncludeEX(true);
    setIncludeEQ(true);
    setResultMessage(null);
  }, []);

  const handleOpenChange = useCallback(
    (val: boolean) => {
      if (!val) resetForm();
      onOpenChange(val);
    },
    [onOpenChange, resetForm]
  );

  // Submit
  const handleSubmit = async () => {
    setSaving(true);
    setResultMessage(null);
    try {
      const ssnDigits = ssn.replace(/\D+/g, "");
      const res = await fetch("/api/credit/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          borrowerId: selectedBorrowerId || null,
          inputs: {
            first_name: firstName,
            last_name: lastName,
            ssn: ssnDigits,
            date_of_birth: formatDob(dob),
            address_line1: street,
            city,
            state: stateCode,
            zip,
            county,
            include_transunion: includeTU,
            include_experian: includeEX,
            include_equifax: includeEQ,
            pull_type: pullType,
          },
        }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setResultMessage("Credit pull initiated successfully.");
        onCreated?.();
        setTimeout(() => handleOpenChange(false), 1500);
      } else {
        setResultMessage(json.error || "Credit pull failed.");
      }
    } catch {
      setResultMessage("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const selectedBorrower = borrowers.find((b) => b.id === selectedBorrowerId);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle>Run Credit Pull</SheetTitle>
          <SheetDescription>
            Search for an existing borrower or fill in details manually.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 pb-6">
          {/* Borrower Search */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Search Existing Borrower</Label>
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
          </div>

          {loadingContact && (
            <div className="flex items-center gap-2 justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Loading borrower info...</span>
            </div>
          )}

          <Separator />

          {/* Personal Information */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Personal Information</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">First Name</Label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First Name"
                    autoComplete="off"
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Last Name</Label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last Name"
                    autoComplete="off"
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
                      name="credit-ssn-field"
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
            </div>
          </div>

          <Separator />

          {/* Address */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Address</h3>
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
            </div>
          </div>

          <Separator />

          {/* Pull Configuration */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Pull Configuration</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Pull Type</Label>
                <div className="flex gap-2 mt-1">
                  <Button
                    variant={pullType === "soft" ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setPullType("soft")}
                  >
                    Soft Pull
                  </Button>
                  <Button
                    variant={pullType === "hard" ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setPullType("hard")}
                  >
                    Hard Pull
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-xs mb-2 block">Bureaus</Label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={includeTU}
                      onCheckedChange={(c) => setIncludeTU(!!c)}
                    />
                    TransUnion
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={includeEX}
                      onCheckedChange={(c) => setIncludeEX(!!c)}
                    />
                    Experian
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={includeEQ}
                      onCheckedChange={(c) => setIncludeEQ(!!c)}
                    />
                    Equifax
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Result message */}
          {resultMessage && (
            <div className={cn(
              "rounded-md border p-3 text-sm",
              resultMessage.includes("success")
                ? "border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400"
                : "border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400"
            )}>
              {resultMessage}
            </div>
          )}
        </div>

        <SheetFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Run Credit
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
