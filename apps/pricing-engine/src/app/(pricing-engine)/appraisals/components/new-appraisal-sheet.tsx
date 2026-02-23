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
import { Loader2, ChevronsUpDown, Check } from "lucide-react";
import { DateInput } from "@/components/date-input";
import { CalcInput } from "@/components/calc-input";
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

const formatUSPhone = (input: string) => {
  const digits = input.replace(/\D+/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  const cc = digits[0];
  const national = digits.slice(1);
  if (national.length === 0) return `+${cc}`;
  if (national.length <= 3) return `+${cc} (${national}`;
  if (national.length <= 6) return `+${cc} (${national.slice(0, 3)}) ${national.slice(3)}`;
  return `+${cc} (${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`;
};

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface AmcOption { id: string; name: string; integration_settings_id: number | null }
interface BorrowerOption { id: string; first_name: string; last_name: string; email?: string }
interface DealOption { id: string; heading: string | null; created_at: string }
interface LoanTypeOption { name: string; other: boolean }

interface NewAppraisalSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

function formatDateForApi(d: Date | undefined): string | null {
  if (!d || isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function NewAppraisalSheet({ open, onOpenChange, onCreated }: NewAppraisalSheetProps) {
  // AMC
  const [amcs, setAmcs] = useState<AmcOption[]>([]);
  const [selectedAmcId, setSelectedAmcId] = useState<string>("");

  // Order Details
  const [lenders, setLenders] = useState<string[]>([]);
  const [lender, setLender] = useState("");
  const [lenderSearchOpen, setLenderSearchOpen] = useState(false);
  const [investors, setInvestors] = useState<string[]>([]);
  const [investor, setInvestor] = useState("");
  const [investorSearchOpen, setInvestorSearchOpen] = useState(false);
  const [transactionTypes, setTransactionTypes] = useState<string[]>([]);
  const [transactionType, setTransactionType] = useState("");
  const [transactionTypeSearchOpen, setTransactionTypeSearchOpen] = useState(false);
  const [loanTypes, setLoanTypes] = useState<LoanTypeOption[]>([]);
  const [loanType, setLoanType] = useState("");
  const [loanTypeSearchOpen, setLoanTypeSearchOpen] = useState(false);
  const [loanTypeOther, setLoanTypeOther] = useState("");
  const [loanNumber, setLoanNumber] = useState("");
  const [priority, setPriority] = useState("");

  // Borrower
  const [borrowers, setBorrowers] = useState<BorrowerOption[]>([]);
  const [selectedBorrowerId, setSelectedBorrowerId] = useState<string>("");
  const [borrowerSearchOpen, setBorrowerSearchOpen] = useState(false);
  const [borrowerName, setBorrowerName] = useState("");
  const [borrowerEmail, setBorrowerEmail] = useState("");
  const [borrowerPhone, setBorrowerPhone] = useState("");
  const [borrowerAltPhone, setBorrowerAltPhone] = useState("");

  // Property Details
  const [propertyType, setPropertyType] = useState("");
  const [occupancyType, setOccupancyType] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [propertyCity, setPropertyCity] = useState("");
  const [propertyState, setPropertyState] = useState("");
  const [propertyZip, setPropertyZip] = useState("");
  const [propertyCounty, setPropertyCounty] = useState("");

  // Access Information
  const [contactPerson, setContactPerson] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [otherAccessInfo, setOtherAccessInfo] = useState("");

  // Appraisal Information
  const [products, setProducts] = useState<string[]>([]);
  const [product, setProduct] = useState("");
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [loanAmount, setLoanAmount] = useState("");
  const [salesPrice, setSalesPrice] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);

  // Deal
  const [deals, setDeals] = useState<DealOption[]>([]);
  const [dealId, setDealId] = useState("");
  const [dealSearchOpen, setDealSearchOpen] = useState(false);

  // UI
  const [saving, setSaving] = useState(false);

  // Fetch AMCs and borrowers
  useEffect(() => {
    if (!open) return;
    async function fetchData() {
      try {
        const [amcRes, bRes, dRes] = await Promise.all([
          fetch("/api/appraisal-amcs"),
          fetch("/api/applicants/borrowers/list"),
          fetch("/api/deals"),
        ]);
        if (amcRes.ok) {
          const json = await amcRes.json();
          setAmcs(json.amcs ?? []);
        }
        if (bRes.ok) {
          const json = await bRes.json();
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
        if (dRes.ok) {
          const json = await dRes.json();
          setDeals(json.deals ?? []);
        }
      } catch { /* ignore */ }
    }
    fetchData();
  }, [open]);

  // Fetch AMC-dependent dropdown options when AMC changes
  useEffect(() => {
    if (!selectedAmcId) {
      setLenders([]);
      setLender("");
      setInvestors([]);
      setInvestor("");
      setProducts([]);
      setProduct("");
      setTransactionTypes([]);
      setTransactionType("");
      setLoanTypes([]);
      setLoanType("");
      setLoanTypeOther("");
      return;
    }
    const amc = amcs.find((a) => a.id === selectedAmcId);
    const settingsId = amc?.integration_settings_id;
    if (!settingsId) {
      setLenders([]);
      setLender("");
      setInvestors([]);
      setInvestor("");
      setProducts([]);
      setProduct("");
      setTransactionTypes([]);
      setTransactionType("");
      setLoanTypes([]);
      setLoanType("");
      setLoanTypeOther("");
      return;
    }
    let cancelled = false;
    async function loadAmcOptions() {
      try {
        const [prodRes, ttRes, ltRes, lnRes, invRes] = await Promise.all([
          fetch(`/api/appraisal-products?settingsId=${settingsId}`),
          fetch(`/api/appraisal-transaction-types?settingsId=${settingsId}`),
          fetch(`/api/appraisal-loan-types?settingsId=${settingsId}`),
          fetch(`/api/appraisal-lenders?settingsId=${settingsId}`),
          fetch(`/api/appraisal-investors?settingsId=${settingsId}`),
        ]);
        if (cancelled) return;
        if (prodRes.ok) {
          const json = await prodRes.json();
          setProducts(json.products ?? []);
          setProduct("");
        }
        if (ttRes.ok) {
          const json = await ttRes.json();
          setTransactionTypes(json.transactionTypes ?? []);
          setTransactionType("");
        }
        if (ltRes.ok) {
          const json = await ltRes.json();
          setLoanTypes(json.loanTypes ?? []);
          setLoanType("");
          setLoanTypeOther("");
        }
        if (lnRes.ok) {
          const json = await lnRes.json();
          setLenders(json.lenders ?? []);
          setLender("");
        }
        if (invRes.ok) {
          const json = await invRes.json();
          setInvestors(json.investors ?? []);
          setInvestor("");
        }
      } catch { /* ignore */ }
    }
    loadAmcOptions();
    return () => { cancelled = true; };
  }, [selectedAmcId, amcs]);

  // Select borrower & auto-populate
  const handleSelectBorrower = useCallback(async (id: string) => {
    setSelectedBorrowerId(id);
    setBorrowerSearchOpen(false);
    if (!id) return;
    try {
      const res = await fetch(`/api/borrowers/${encodeURIComponent(id)}`);
      if (res.ok) {
        const json = await res.json();
        const b = json.borrower ?? json;
        setBorrowerName(`${(b.first_name as string) ?? ""} ${(b.last_name as string) ?? ""}`.trim());
        setBorrowerEmail((b.email as string) ?? "");
        if (b.primary_phone) setBorrowerPhone(formatUSPhone(String(b.primary_phone)));
      }
    } catch { /* ignore */ }
  }, []);

  // Reset
  const resetForm = useCallback(() => {
    setSelectedAmcId("");
    setLenders([]);
    setLender("");
    setInvestors([]);
    setInvestor("");
    setTransactionType("");
    setLoanType("");
    setLoanTypeOther("");
    setLoanNumber("");
    setPriority("");
    setSelectedBorrowerId("");
    setBorrowerName("");
    setBorrowerEmail("");
    setBorrowerPhone("");
    setBorrowerAltPhone("");
    setPropertyType("");
    setOccupancyType("");
    setPropertyAddress("");
    setPropertyCity("");
    setPropertyState("");
    setPropertyZip("");
    setPropertyCounty("");
    setContactPerson("");
    setContactName("");
    setContactEmail("");
    setContactPhone("");
    setOtherAccessInfo("");
    setProduct("");
    setLoanAmount("");
    setSalesPrice("");
    setDueDate(undefined);
    setDealId("");
  }, []);

  const handleOpenChange = useCallback((val: boolean) => {
    if (!val) resetForm();
    onOpenChange(val);
  }, [onOpenChange, resetForm]);

  // Submit
  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/appraisal-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amc_id: selectedAmcId || null,
          deal_id: dealId || null,
          borrower_id: selectedBorrowerId || null,
          borrower_name: borrowerName || null,
          loan_number: loanNumber || null,
          file_number: null,
          order_type: product || null,
          order_status: "Ordered",
          property_address: propertyAddress || null,
          property_city: propertyCity || null,
          property_state: propertyState || null,
          property_zip: propertyZip || null,
          date_due: formatDateForApi(dueDate),
          date_report_ordered: formatDateForApi(new Date()),
        }),
      });
      if (res.ok) {
        onCreated?.();
        handleOpenChange(false);
      }
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const selectedBorrower = borrowers.find((b) => b.id === selectedBorrowerId);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle>New Appraisal Order</SheetTitle>
          <SheetDescription>Create a new appraisal property order.</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 pb-6">
          {/* AMC Selection */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">AMC</Label>
            <Select value={selectedAmcId} onValueChange={setSelectedAmcId}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Select AMC..." /></SelectTrigger>
              <SelectContent>
                {amcs.map((amc) => (
                  <SelectItem key={amc.id} value={String(amc.id)}>{amc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Order Details */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Order Details</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Lender/Client on Report</Label>
                  <Popover open={lenderSearchOpen} onOpenChange={setLenderSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between font-normal h-9" disabled={!selectedAmcId || lenders.length === 0}>
                        <span className={cn("truncate", !lender && "text-muted-foreground")}>
                          {lender || (selectedAmcId ? "Select lender..." : "Select AMC first")}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" collisionPadding={8} onWheel={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()}>
                      <Command>
                        <CommandInput placeholder="Search lenders..." />
                        <CommandList>
                          <CommandEmpty>No lenders found.</CommandEmpty>
                          <CommandGroup>
                            {lenders.map((l) => (
                              <CommandItem
                                key={l}
                                value={l}
                                onSelect={() => { setLender(l); setLenderSearchOpen(false); }}
                              >
                                <span className="text-sm">{l}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className="text-xs">Investor Name</Label>
                  <Popover open={investorSearchOpen} onOpenChange={setInvestorSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between font-normal h-9" disabled={!selectedAmcId || investors.length === 0}>
                        <span className={cn("truncate", !investor && "text-muted-foreground")}>
                          {investor || (selectedAmcId ? "Select investor..." : "Select AMC first")}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" collisionPadding={8} onWheel={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()}>
                      <Command>
                        <CommandInput placeholder="Search investors..." />
                        <CommandList>
                          <CommandEmpty>No investors found.</CommandEmpty>
                          <CommandGroup>
                            {investors.map((inv) => (
                              <CommandItem
                                key={inv}
                                value={inv}
                                onSelect={() => { setInvestor(inv); setInvestorSearchOpen(false); }}
                              >
                                <span className="text-sm">{inv}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Transaction Type</Label>
                  <Popover open={transactionTypeSearchOpen} onOpenChange={setTransactionTypeSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between font-normal h-9" disabled={!selectedAmcId || transactionTypes.length === 0}>
                        <span className={cn("truncate", !transactionType && "text-muted-foreground")}>
                          {transactionType || (selectedAmcId ? "Select type..." : "Select AMC first")}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" collisionPadding={8} onWheel={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()}>
                      <Command>
                        <CommandInput placeholder="Search transaction types..." />
                        <CommandList>
                          <CommandEmpty>No transaction types found.</CommandEmpty>
                          <CommandGroup>
                            {transactionTypes.map((t) => (
                              <CommandItem
                                key={t}
                                value={t}
                                onSelect={() => { setTransactionType(t); setTransactionTypeSearchOpen(false); }}
                              >
                                <span className="text-sm">{t}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className="text-xs">Loan Type</Label>
                  <Popover open={loanTypeSearchOpen} onOpenChange={setLoanTypeSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between font-normal h-9" disabled={!selectedAmcId || loanTypes.length === 0}>
                        <span className={cn("truncate", !loanType && "text-muted-foreground")}>
                          {loanType || (selectedAmcId ? "Select loan type..." : "Select AMC first")}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" collisionPadding={8} onWheel={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()}>
                      <Command>
                        <CommandInput placeholder="Search loan types..." />
                        <CommandList>
                          <CommandEmpty>No loan types found.</CommandEmpty>
                          <CommandGroup>
                            {loanTypes.map((lt) => (
                              <CommandItem
                                key={lt.name}
                                value={lt.name}
                                onSelect={() => { setLoanType(lt.name); setLoanTypeSearchOpen(false); if (!lt.other) setLoanTypeOther(""); }}
                              >
                                <span className="text-sm">{lt.name}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              {loanTypes.find((lt) => lt.name === loanType)?.other && (
                <div>
                  <Label className="text-xs">Other</Label>
                  <Input className="h-9" placeholder="Specify" value={loanTypeOther} onChange={(e) => setLoanTypeOther(e.target.value)} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Loan Number</Label>
                  <Input className="h-9" placeholder="Loan #" inputMode="numeric" value={loanNumber} onChange={(e) => setLoanNumber(e.target.value.replace(/\D/g, ""))} />
                </div>
                <div>
                  <Label className="text-xs">Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Rush">Rush</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Deal</Label>
                <Popover open={dealSearchOpen} onOpenChange={setDealSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between font-normal h-9">
                      <span className={cn("truncate", !dealId && "text-muted-foreground")}>
                        {(() => {
                          if (!dealId) return "Select deal..."
                          const d = deals.find((d) => d.id === dealId)
                          return d?.heading || d?.id.slice(0, 8) + "..."
                        })()}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" collisionPadding={8} onWheel={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()}>
                    <Command>
                      <CommandInput placeholder="Search deals..." />
                      <CommandList>
                        <CommandEmpty>No deals found.</CommandEmpty>
                        <CommandGroup>
                          {deals.map((d) => (
                            <CommandItem
                              key={d.id}
                              value={`${d.heading ?? ""} ${d.id}`}
                              onSelect={() => { setDealId(d.id); setDealSearchOpen(false); }}
                            >
                              <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-medium">{d.heading || "Untitled Deal"}</span>
                                <span className="text-[10px] text-muted-foreground font-mono">{d.id.slice(0, 8)}...</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <Separator />

          {/* Borrower */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Borrower</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Search Existing Borrower</Label>
                <Popover open={borrowerSearchOpen} onOpenChange={setBorrowerSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between font-normal h-9">
                      <span className={cn("truncate", !selectedBorrower && "text-muted-foreground")}>
                        {selectedBorrower ? `${selectedBorrower.first_name} ${selectedBorrower.last_name}` : "Select borrower..."}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" collisionPadding={8} onWheel={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()}>
                    <Command>
                      <CommandInput placeholder="Search borrowers..." />
                      <CommandList>
                        <CommandEmpty>No borrowers found.</CommandEmpty>
                        <CommandGroup>
                          {borrowers.map((b) => (
                            <CommandItem key={b.id} value={`${b.first_name} ${b.last_name} ${b.email}`} onSelect={() => handleSelectBorrower(b.id)}>
                              <Check className={cn("mr-2 h-4 w-4", selectedBorrowerId === b.id ? "opacity-100" : "opacity-0")} />
                              <span className="text-sm">{b.first_name} {b.last_name}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="text-xs">Borrower (and Co-Borrower)</Label>
                <Input className="h-9" placeholder="Borrower Name" value={borrowerName} onChange={(e) => setBorrowerName(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Borrower Email</Label>
                <Input className="h-9" type="email" placeholder="email@example.com" value={borrowerEmail} onChange={(e) => setBorrowerEmail(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Borrower Phone</Label>
                  <Input className="h-9" placeholder="(555) 555-5555" inputMode="tel" value={borrowerPhone} onChange={(e) => setBorrowerPhone(formatUSPhone(e.target.value))} />
                </div>
                <div>
                  <Label className="text-xs">Borrower Alternate Phone</Label>
                  <Input className="h-9" placeholder="(555) 555-5555" inputMode="tel" value={borrowerAltPhone} onChange={(e) => setBorrowerAltPhone(formatUSPhone(e.target.value))} />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Property Details */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Property Details</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Property Type</Label>
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single Family">Single Family</SelectItem>
                      <SelectItem value="Condominium">Condominium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Occupancy Type</Label>
                  <Select value={occupancyType} onValueChange={setOccupancyType}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Investment">Investment</SelectItem>
                      <SelectItem value="Vacant">Vacant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Property Address</Label>
                <AddressAutocomplete
                  value={propertyAddress}
                  className="h-9"
                  onChange={(addr) => {
                    setPropertyAddress(addr.address_line1 ?? addr.raw);
                    setPropertyCity(addr.city ?? "");
                    setPropertyState(addr.state ?? "");
                    setPropertyZip(addr.zip ?? "");
                    setPropertyCounty(addr.county ?? "");
                  }}
                  placeholder="Start typing address..."
                  displayValue="street"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">City</Label>
                  <Input className="h-9" placeholder="City" value={propertyCity} onChange={(e) => setPropertyCity(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">State</Label>
                  <Select value={propertyState || undefined} onValueChange={setPropertyState}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {STATE_OPTIONS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Zip Code</Label>
                  <Input className="h-9" placeholder="12345" inputMode="numeric" value={propertyZip} onChange={(e) => setPropertyZip(e.target.value.replace(/\D/g, "").slice(0, 5))} />
                </div>
                <div>
                  <Label className="text-xs">County</Label>
                  <Input className="h-9" placeholder="County" value={propertyCounty} onChange={(e) => setPropertyCounty(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Access Information */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Access Information</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Contact Person</Label>
                <Select value={contactPerson} onValueChange={setContactPerson}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Borrower">Borrower</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {contactPerson === "Other" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Contact Name</Label>
                      <Input className="h-9" placeholder="Name" value={contactName} onChange={(e) => setContactName(e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Contact Email</Label>
                      <Input className="h-9" type="email" placeholder="email@example.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Contact Phone</Label>
                    <Input className="h-9" placeholder="(555) 555-5555" inputMode="tel" value={contactPhone} onChange={(e) => setContactPhone(formatUSPhone(e.target.value))} />
                  </div>
                  <div>
                    <Label className="text-xs">Other Access Information</Label>
                    <Input className="h-9" placeholder="Additional access details..." value={otherAccessInfo} onChange={(e) => setOtherAccessInfo(e.target.value)} />
                  </div>
                </>
              )}
            </div>
          </div>

          <Separator />

          {/* Appraisal Information */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Appraisal Information</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Product</Label>
                <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between font-normal h-9" disabled={!selectedAmcId || products.length === 0}>
                      <span className={cn("truncate", !product && "text-muted-foreground")}>
                        {product || (selectedAmcId ? "Select product..." : "Select AMC first")}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" collisionPadding={8} onWheel={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()}>
                    <Command>
                      <CommandInput placeholder="Search products..." />
                      <CommandList>
                        <CommandEmpty>No products found.</CommandEmpty>
                        <CommandGroup>
                          {products.map((p) => (
                            <CommandItem
                              key={p}
                              value={p}
                              onSelect={() => { setProduct(p); setProductSearchOpen(false); }}
                            >
                              <span className="text-sm">{p}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Loan Amount</Label>
                  <CalcInput className="h-9" placeholder="$0.00" value={loanAmount} onValueChange={setLoanAmount} />
                </div>
                <div>
                  <Label className="text-xs">Sales Price</Label>
                  <CalcInput className="h-9" placeholder="$0.00" value={salesPrice} onValueChange={setSalesPrice} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Due Date</Label>
                <DateInput value={dueDate} onChange={setDueDate} emptyOnMount className="h-9" />
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Order
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
