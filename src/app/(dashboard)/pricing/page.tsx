"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { IconDeviceFloppy, IconFileExport } from "@tabler/icons-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { DateInput } from "@/components/date-input"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ensureGoogleMaps } from "@/lib/google-maps"

export default function PricingEnginePage() {
  // Subject Property dependent state
  const [propertyType, setPropertyType] = useState<string | undefined>(undefined)
  const [numUnits, setNumUnits] = useState<number | undefined>(undefined)
  const [loanType, setLoanType] = useState<string | undefined>(undefined)
  const [bridgeType, setBridgeType] = useState<string | undefined>(undefined)
  const [transactionType, setTransactionType] = useState<string | undefined>(undefined)
  const [closingDate, setClosingDate] = useState<Date | undefined>(undefined)
  const [acquisitionDate, setAcquisitionDate] = useState<Date | undefined>(undefined)
  const [requestMaxLeverage, setRequestMaxLeverage] = useState<boolean>(false)
  const [hoiEffective, setHoiEffective] = useState<Date | undefined>(undefined)
  const [floodEffective, setFloodEffective] = useState<Date | undefined>(undefined)
  const [initialLoanAmount, setInitialLoanAmount] = useState<string>("")
  const [rehabHoldback, setRehabHoldback] = useState<string>("")

  // Address fields (hooked to Google Places)
  const [street, setStreet] = useState<string>("")
  const [apt, setApt] = useState<string>("")
  const [city, setCity] = useState<string>("")
  const [stateCode, setStateCode] = useState<string | undefined>(undefined)
  const [zip, setZip] = useState<string>("")
  const [county, setCounty] = useState<string>("")
  const streetInputRef = useRef<HTMLInputElement | null>(null)

  const states = [
    "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
  ]

  const unitOptions = useMemo(() => {
    if (propertyType === "mf2_4") return [2, 3, 4]
    if (propertyType === "mf5_10") return [5, 6, 7, 8, 9, 10]
    if (!propertyType) return []
    return [1]
  }, [propertyType])

  // Per-unit income rows placeholder state
  const [unitData, setUnitData] = useState<
    { leased?: "yes" | "no"; gross?: string; market?: string }[]
  >([])

  // Keep numUnits within allowed options and resize unit rows accordingly
  useEffect(() => {
    if (unitOptions.length === 0) {
      setNumUnits(undefined)
      setUnitData([])
      return
    }
    if (!numUnits || !unitOptions.includes(numUnits)) {
      const next = unitOptions[0]
      setNumUnits(next)
      setUnitData(Array.from({ length: next }, () => ({ leased: undefined, gross: "", market: "" })))
      return
    }
    setUnitData(Array.from({ length: numUnits }, () => ({ leased: undefined, gross: "", market: "" })))
  }, [unitOptions, numUnits])

  // Initialize Google Places Autocomplete on the Street field and auto-fill components
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    let listener: any

    ;(async () => {
      try {
        await ensureGoogleMaps(apiKey)
        if (!streetInputRef.current || !window.google?.maps?.places) return
        const autocomplete = new window.google.maps.places.Autocomplete(streetInputRef.current, {
          types: ["address"],
          componentRestrictions: { country: ["us"] },
          fields: ["address_components", "formatted_address"],
        })
        listener = autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace()
          const comps = place?.address_components ?? []
          const get = (t: string) => comps.find((c: any) => c.types?.includes(t))
          const streetNumber = get("street_number")?.short_name ?? ""
          const route = get("route")?.long_name ?? ""
          const locality = get("locality")?.long_name ?? get("sublocality")?.long_name ?? ""
          const admin1 = get("administrative_area_level_1")?.short_name ?? ""
          const postal = get("postal_code")?.short_name ?? ""
          const countyName = (get("administrative_area_level_2")?.long_name ?? "").replace(/ County$/i, "")

          setStreet([streetNumber, route].filter(Boolean).join(" "))
          setCity(locality)
          setStateCode(admin1 || undefined)
          setZip(postal)
          setCounty(countyName)
        })
      } catch {
        // ignore loader errors in UI for now
      }
    })()

    return () => {
      if (listener) {
        try {
          window.google?.maps?.event?.removeListener(listener)
        } catch {
          // noop
        }
      }
    }
  }, [])

  return (
    <div data-layout="fixed" className="flex flex-1 flex-col gap-4 overflow-hidden">
      <h2 className="text-xl font-bold tracking-tight">Pricing Engine</h2>

      <div className="flex h-full flex-1 gap-4 overflow-hidden">
        {/* Left 25% column: scrollable container with header and footer */}
        <aside className="w-full lg:w-1/4">
          <div className="flex h-full min-h-0 flex-col rounded-md border">
            {/* Header */}
            <div className="grid grid-cols-[1fr_auto] items-end gap-2 border-b p-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Scenarios
                </label>
                <Select>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="base">Base</SelectItem>
                    <SelectItem value="alt-1">Alt 1</SelectItem>
                    <SelectItem value="alt-2">Alt 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button aria-label="Save" size="icon" variant="secondary">
                  <IconDeviceFloppy />
                </Button>
                <Button aria-label="Save As" size="icon" variant="outline">
                  <IconFileExport />
                </Button>
              </div>
            </div>

            {/* Scrollable content area */}
            <div className="min-h-0 flex-1 overflow-auto p-3">
              <Accordion
                type="multiple"
                defaultValue={[
                  "loan-details",
                  "borrowers",
                  "subject",
                  "loan-structure",
                  // include conditional sections so if rendered, they start opened
                  "experience",
                  "rehab-details",
                  "income",
                ]}
                className="w-full"
              >
                <AccordionItem value="loan-details" className="border-b">
                  <AccordionTrigger className="text-left text-base font-bold italic">
                    Loan Details
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="loan-type">Loan Type</Label>
                        <Select value={loanType} onValueChange={setLoanType}>
                          <SelectTrigger id="loan-type" className="h-9 w-full">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dscr">DSCR</SelectItem>
                            <SelectItem value="bridge">Bridge</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="transaction-type">Transaction Type</Label>
                        <Select
                          value={transactionType}
                          onValueChange={setTransactionType}
                        >
                          <SelectTrigger id="transaction-type" className="h-9 w-full">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="purchase">Purchase</SelectItem>
                            <SelectItem value="delayed-purchase">Delayed Purchase</SelectItem>
                            <SelectItem value="rt-refi">Refinance Rate/Term</SelectItem>
                            <SelectItem value="co-refi">Refinance Cash Out</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {loanType === "bridge" && (
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="bridge-type">Bridge Type</Label>
                          <Select value={bridgeType} onValueChange={setBridgeType}>
                            <SelectTrigger id="bridge-type" className="h-9 w-full">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bridge">Bridge</SelectItem>
                              <SelectItem value="bridge-rehab">Bridge + Rehab</SelectItem>
                              <SelectItem value="ground-up">Ground Up</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                
                <AccordionItem value="borrowers" className="border-b">
                  <AccordionTrigger className="text-left text-base font-bold italic">
                    Borrowers &amp; Guarantors
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="borrower-type">Borrower Type</Label>
                        <Select>
                          <SelectTrigger id="borrower-type" className="h-9 w-full">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="entity">Entity</SelectItem>
                            <SelectItem value="individual">Individual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="citizenship">Citizenship</Label>
                        <Select>
                          <SelectTrigger id="citizenship" className="h-9 w-full">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="us">U.S. Citizen</SelectItem>
                            <SelectItem value="pr">Permanent Resident</SelectItem>
                            <SelectItem value="npr">Non-Permanent Resident</SelectItem>
                            <SelectItem value="fn">Foreign National</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {loanType === "dscr" && (
                        <>
                          <div className="flex flex-col gap-1">
                            <Label htmlFor="fthb">FTHB</Label>
                            <Select>
                              <SelectTrigger id="fthb" className="h-9 w-full">
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="yes">Yes</SelectItem>
                                <SelectItem value="no">No</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Label htmlFor="mortgage-debt">Mortgage Debt</Label>
                            <div className="relative">
                              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                                $
                              </span>
                              <Input
                                id="mortgage-debt"
                                inputMode="decimal"
                                placeholder="0.00"
                                className="pl-6"
                              />
                            </div>
                          </div>
                        </>
                      )}
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="fico">FICO Score</Label>
                        <Input
                          id="fico"
                          type="number"
                          inputMode="numeric"
                          min={300}
                          max={850}
                          placeholder="700"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {loanType === "bridge" && (
                  <AccordionItem value="experience" className="border-b">
                    <AccordionTrigger className="text-left text-base font-bold italic">
                      Experience
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="rentals-owned">Rentals Owned</Label>
                          <Input
                            id="rentals-owned"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="0"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="num-flips"># of Flips</Label>
                          <Input
                            id="num-flips"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="0"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="num-gunc"># of GUNC</Label>
                          <Input
                            id="num-gunc"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="0"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="other-exp">Other</Label>
                          <Select>
                            <SelectTrigger id="other-exp" className="h-9 w-full">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes">Yes</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                <AccordionItem value="subject" className="border-b">
                  <AccordionTrigger className="text-left text-base font-bold italic hover:no-underline">
                    <div className="flex items-center gap-3 pr-6">
                      <span>Subject Property</span>
                      <Button asChild size="sm" variant="secondary" className="ml-auto h-7 not-italic">
                        <span
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                          }}
                          className="not-italic"
                        >
                          RE API
                        </span>
                      </Button>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-1 sm:col-span-2">
                          <Label htmlFor="street">Street</Label>
                          <Input
                            id="street"
                            placeholder="123 Main St"
                            ref={streetInputRef}
                            value={street}
                            onChange={(e) => setStreet(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="apt">Apt #</Label>
                          <Input
                            id="apt"
                            placeholder="Unit/Apt"
                            value={apt}
                            onChange={(e) => setApt(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            placeholder="City"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="state">State</Label>
                          <Select value={stateCode} onValueChange={setStateCode}>
                            <SelectTrigger id="state" className="h-9 w-full">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {states.map((st) => (
                                <SelectItem key={st} value={st}>
                                  {st}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="zip">Zip Code</Label>
                          <Input
                            id="zip"
                            inputMode="numeric"
                            maxLength={5}
                            pattern="[0-9]*"
                            placeholder="12345"
                            value={zip}
                            onChange={(e) => setZip(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="county">County</Label>
                          <Input
                            id="county"
                            placeholder="County"
                            value={county}
                            onChange={(e) => setCounty(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="property-type">Property Type</Label>
                          <Select
                            value={propertyType}
                            onValueChange={setPropertyType}
                          >
                            <SelectTrigger id="property-type" className="h-9 w-full">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="single">Single Family</SelectItem>
                              <SelectItem value="pud">Townhome/PUD</SelectItem>
                              <SelectItem value="condo">Condominium</SelectItem>
                              <SelectItem value="mf2_4">Multifamily 2-4 Units</SelectItem>
                            {loanType !== "dscr" && (
                              <SelectItem value="mf5_10">Multifamily 5-10 Units</SelectItem>
                            )}
                            </SelectContent>
                          </Select>
                        </div>

                        {propertyType === "condo" ? (
                          <div className="flex flex-col gap-1">
                            <Label htmlFor="warrantability">Warrantability</Label>
                            <Select>
                              <SelectTrigger id="warrantability" className="h-9 w-full">
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="warrantable">Warrantable</SelectItem>
                                <SelectItem value="non-warrantable">Non-Warrantable</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <div className="hidden sm:block" />
                        )}

                        <div className="flex flex-col gap-1">
                          <Label htmlFor="num-units">Number of Units</Label>
                          <Select
                            disabled={unitOptions.length === 0}
                            value={numUnits ? String(numUnits) : undefined}
                            onValueChange={(v) => setNumUnits(parseInt(v))}
                          >
                            <SelectTrigger id="num-units" className="h-9 w-full">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {unitOptions.map((n) => (
                                <SelectItem key={n} value={String(n)}>
                                  {n}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <Label htmlFor="gla">GLA Sq Ft</Label>
                          <Input id="gla" inputMode="numeric" placeholder="0" />
                        </div>
                        {loanType === "dscr" && (
                          <>
                            <div className="flex flex-col gap-1">
                              <Label htmlFor="str">STR</Label>
                              <Select>
                                <SelectTrigger id="str" className="h-9 w-full">
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="yes">Yes</SelectItem>
                                  <SelectItem value="no">No</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex flex-col gap-1">
                              <Label htmlFor="declining-market">Declining Market</Label>
                              <Select>
                                <SelectTrigger id="declining-market" className="h-9 w-full">
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="yes">Yes</SelectItem>
                                  <SelectItem value="no">No</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {loanType === "bridge" &&
                  (bridgeType === "bridge-rehab" || bridgeType === "ground-up") && (
                    <AccordionItem value="rehab-details" className="border-b">
                      <AccordionTrigger className="text-left text-base font-bold italic">
                        Rehab Details
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="flex flex-col gap-1">
                            <Label htmlFor="gla-expansion">{">20% GLA Expansion"}</Label>
                            <Select>
                              <SelectTrigger id="gla-expansion" className="h-9 w-full">
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="yes">Yes</SelectItem>
                                <SelectItem value="no">No</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Label htmlFor="change-of-use">Change of use</Label>
                            <Select>
                              <SelectTrigger id="change-of-use" className="h-9 w-full">
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="yes">Yes</SelectItem>
                                <SelectItem value="no">No</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Label htmlFor="rehab-budget">Rehab Budget</Label>
                            <div className="relative">
                              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                                $
                              </span>
                              <Input id="rehab-budget" inputMode="decimal" placeholder="0.00" className="pl-6" />
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Label htmlFor="arv">ARV</Label>
                            <div className="relative">
                              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                                $
                              </span>
                              <Input id="arv" inputMode="decimal" placeholder="0.00" className="pl-6" />
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                {loanType === "dscr" && (
                  <AccordionItem value="income" className="border-b">
                    <AccordionTrigger className="text-left text-base font-bold italic">
                      Income &amp; Expenses
                    </AccordionTrigger>
                    <AccordionContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="annual-taxes">Annual Taxes</Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <Input id="annual-taxes" inputMode="decimal" placeholder="0.00" className="pl-6" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="annual-hoi">Annual HOI</Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <Input id="annual-hoi" inputMode="decimal" placeholder="0.00" className="pl-6" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="annual-flood">Annual Flood</Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <Input id="annual-flood" inputMode="decimal" placeholder="0.00" className="pl-6" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="annual-hoa">Annual HOA</Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <Input id="annual-hoa" inputMode="decimal" placeholder="0.00" className="pl-6" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="annual-mgmt">Annual Management</Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <Input id="annual-mgmt" inputMode="decimal" placeholder="0.00" className="pl-6" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {(numUnits ?? 0) > 0 ? (
                        Array.from({ length: numUnits ?? 0 }, (_, idx) => idx).map((_, idx) => (
                          <div key={idx} className="grid grid-cols-[max-content_1fr_1fr_1fr] items-end gap-3">
                            <div className="self-center mt-6 text-sm font-medium">#{idx + 1}</div>
                            <div className="flex flex-col gap-1">
                              <Label htmlFor={`leased-${idx}`}>Leased</Label>
                              <Select
                                value={unitData[idx]?.leased}
                                onValueChange={(v: "yes" | "no") => {
                                  setUnitData((prev) => {
                                    const next = [...prev]
                                    next[idx] = { ...next[idx], leased: v }
                                    return next
                                  })
                                }}
                              >
                                <SelectTrigger id={`leased-${idx}`} className="h-9 w-full">
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="yes">Yes</SelectItem>
                                  <SelectItem value="no">No</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex flex-col gap-1">
                              <Label htmlFor={`gross-${idx}`}>Gross Rent</Label>
                              <div className="relative">
                                <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                                  $
                                </span>
                                <Input
                                  id={`gross-${idx}`}
                                  inputMode="decimal"
                                  placeholder="0.00"
                                  className="pl-6 w-full"
                                  value={unitData[idx]?.gross ?? ""}
                                  onChange={(e) =>
                                    setUnitData((prev) => {
                                      const next = [...prev]
                                      next[idx] = { ...(next[idx] ?? {}), gross: e.target.value }
                                      return next
                                    })
                                  }
                                />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <Label htmlFor={`market-${idx}`}>Market Rent</Label>
                              <div className="relative">
                                <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                                  $
                                </span>
                                <Input
                                  id={`market-${idx}`}
                                  inputMode="decimal"
                                  placeholder="0.00"
                                  className="pl-6 w-full"
                                  value={unitData[idx]?.market ?? ""}
                                  onChange={(e) =>
                                    setUnitData((prev) => {
                                      const next = [...prev]
                                      next[idx] = { ...(next[idx] ?? {}), market: e.target.value }
                                      return next
                                    })
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-muted-foreground text-sm">
                          Select Property Type and Number of Units to add unit rows.
                        </div>
                      )}
                    </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                <AccordionItem value="loan-structure" className="border-b">
                  <AccordionTrigger className="text-left text-base font-bold italic">
                    Loan Structure
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="proj-close">Projected Closing Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <DateInput
                              value={closingDate}
                              onChange={(d) => setClosingDate(d)}
                            />
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={closingDate}
                              defaultMonth={closingDate}
                              month={closingDate}
                              onSelect={(d) => d && setClosingDate(d)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      {transactionType !== "purchase" ? (
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="acq-date">Acquisition Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <DateInput
                                value={acquisitionDate}
                                onChange={(d) => setAcquisitionDate(d)}
                              />
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={acquisitionDate}
                                defaultMonth={acquisitionDate}
                                month={acquisitionDate}
                                onSelect={(d) => d && setAcquisitionDate(d)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      ) : (
                        <div className="hidden sm:block" />
                      )}
                      {loanType === "dscr" && (
                        <>
                          <div className="flex flex-col gap-1">
                            <Label htmlFor="loan-structure-type">Loan Structure</Label>
                            <Select>
                              <SelectTrigger id="loan-structure-type" className="h-9 w-full">
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fixed-30">30 Year Fixed</SelectItem>
                                <SelectItem value="io">Interest Only</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Label htmlFor="ppp">PPP</Label>
                            <Select>
                              <SelectTrigger id="ppp" className="h-9 w-full">
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="5-4-3-2-1">5-4-3-2-1</SelectItem>
                                <SelectItem value="3-2-1">3-2-1</SelectItem>
                                <SelectItem value="1">1</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
                      {loanType === "bridge" && (
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="term">Term</Label>
                          <Select>
                            <SelectTrigger id="term" className="h-9 w-full">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="12">12 months</SelectItem>
                              <SelectItem value="15">15 months</SelectItem>
                              <SelectItem value="18">18 months</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="purchase-price">Purchase Price</Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <Input id="purchase-price" inputMode="decimal" placeholder="0.00" className="pl-6" />
                        </div>
                      </div>
                      {transactionType !== "purchase" ? (
                        <>
                          {loanType === "dscr" && (
                            <div className="flex flex-col gap-1">
                              <Label htmlFor="rehab-completed">Rehab Completed</Label>
                              <div className="relative">
                                <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                                  $
                                </span>
                                <Input id="rehab-completed" inputMode="decimal" placeholder="0.00" className="pl-6" />
                              </div>
                            </div>
                          )}
                          <div className="flex flex-col gap-1">
                            <Label htmlFor="payoff-amount">Payoff Amount</Label>
                            <div className="relative">
                              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                                $
                              </span>
                              <Input id="payoff-amount" inputMode="decimal" placeholder="0.00" className="pl-6" />
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="hidden sm:block" />
                          <div className="hidden sm:block" />
                        </>
                      )}
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="aiv">AIV</Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <Input id="aiv" inputMode="decimal" placeholder="0.00" className="pl-6" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="max-lev">Request Max Leverage</Label>
                        <div className="flex h-9 items-center">
                          <Switch
                            id="max-lev"
                            checked={requestMaxLeverage}
                            onCheckedChange={setRequestMaxLeverage}
                          />
                        </div>
                      </div>
                      {!requestMaxLeverage ? (
                        loanType === "bridge" &&
                        (bridgeType === "bridge-rehab" || bridgeType === "ground-up") ? (
                          <>
                            <div className="flex flex-col gap-1">
                              <Label htmlFor="initial-loan-amount">Initial Loan Amount</Label>
                              <div className="relative">
                                <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                                  $
                                </span>
                                <Input
                                  id="initial-loan-amount"
                                  inputMode="decimal"
                                  placeholder="0.00"
                                  className="pl-6"
                                  value={initialLoanAmount}
                                  onChange={(e) => setInitialLoanAmount(e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <Label htmlFor="rehab-holdback">Rehab Holdback</Label>
                              <div className="relative">
                                <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                                  $
                                </span>
                                <Input
                                  id="rehab-holdback"
                                  inputMode="decimal"
                                  placeholder="0.00"
                                  className="pl-6"
                                  value={rehabHoldback}
                                  onChange={(e) => setRehabHoldback(e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <Label htmlFor="total-loan-amount">Total Loan Amount</Label>
                              <div className="relative">
                                <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                                  $
                                </span>
                                <Input
                                  id="total-loan-amount"
                                  readOnly
                                  value={(() => {
                                    const a = parseFloat(initialLoanAmount) || 0
                                    const b = parseFloat(rehabHoldback) || 0
                                    return (a + b).toFixed(2)
                                  })()}
                                  className="pl-6"
                                />
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <Label htmlFor="loan-amount">Loan Amount</Label>
                            <div className="relative">
                              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                                $
                              </span>
                              <Input id="loan-amount" inputMode="decimal" placeholder="0.00" className="pl-6" />
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="hidden sm:block" />
                      )}
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="lender-orig">Lender Origination</Label>
                        <div className="relative">
                          <Input id="lender-orig" inputMode="decimal" placeholder="0.00" className="pr-6" />
                          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            %
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="admin-fee">Admin Fee</Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <Input id="admin-fee" inputMode="decimal" placeholder="0.00" className="pl-6" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="broker-orig">Broker Origination</Label>
                        <div className="relative">
                          <Input id="broker-orig" inputMode="decimal" placeholder="0.00" className="pr-6" />
                          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="additional-details" className="border-b">
                  <AccordionTrigger className="text-left text-base font-bold italic">
                    Additional Details
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="borrower-name">Borrower Name</Label>
                        <Input id="borrower-name" placeholder="Name" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="guarantors">Guarantor(s)</Label>
                        <Input id="guarantors" placeholder="Names separated by comma" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="uw-exception">UW Exception</Label>
                        <Select>
                          <SelectTrigger id="uw-exception" className="h-9 w-full">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="hoi-effective">HOI Effective</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <DateInput
                              value={hoiEffective}
                              onChange={(d) => setHoiEffective(d)}
                            />
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={hoiEffective}
                              defaultMonth={hoiEffective}
                              month={hoiEffective}
                              onSelect={(d) => d && setHoiEffective(d)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="flood-effective">Flood Effective</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <DateInput
                              value={floodEffective}
                              onChange={(d) => setFloodEffective(d)}
                            />
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={floodEffective}
                              defaultMonth={floodEffective}
                              month={floodEffective}
                              onSelect={(d) => d && setFloodEffective(d)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="title-recording">Title &amp; Recording Fee</Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <Input id="title-recording" inputMode="decimal" placeholder="0.00" className="pl-6" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="assignment-fee">Assignment Fee</Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <Input id="assignment-fee" inputMode="decimal" placeholder="0.00" className="pl-6" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="seller-concessions">Seller Concessions</Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <Input id="seller-concessions" inputMode="decimal" placeholder="0.00" className="pl-6" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="tax-escrow">Tax Escrow (months)</Label>
                        <Input id="tax-escrow" inputMode="numeric" pattern="[0-9]*" placeholder="0" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="hoi-premium">HOI Premium</Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <Input id="hoi-premium" inputMode="decimal" placeholder="0.00" className="pl-6" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="flood-premium">Flood Premium</Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <Input id="flood-premium" inputMode="decimal" placeholder="0.00" className="pl-6" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="emd">EMD</Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <Input id="emd" inputMode="decimal" placeholder="0.00" className="pl-6" />
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Footer */}
            <div className="border-t p-3">
              <div className="flex justify-end">
                <Button>Calculate</Button>
              </div>
            </div>
          </div>
        </aside>

        {/* Right 75% column: placeholder display area */}
        <section className="hidden h-full w-full rounded-md border lg:block lg:w-3/4">
          {/* Display outputs from inputs here later */}
        </section>
      </div>
    </div>
  )
}

