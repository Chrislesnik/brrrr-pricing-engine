"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { IconDeviceFloppy, IconFileExport, IconMapPin } from "@tabler/icons-react"
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
import { toast } from "@/hooks/use-toast"
import { CalcInput } from "@/components/calc-input"

// Shared minimal types for Google Places Autocomplete
export interface PlacePrediction {
  place_id: string
  description: string
  structured_formatting?: {
    main_text?: string
    secondary_text?: string
  }
}

// Minimal Google Places typings used locally
type GPlaces = {
  AutocompleteSessionToken: new () => unknown
  AutocompleteService: new () => {
    getPlacePredictions: (
      req: {
        input: string
        types?: string[]
        componentRestrictions?: { country: string[] }
        sessionToken?: unknown
      },
      cb: (res: PlacePrediction[] | null, status: string) => void
    ) => void
  }
  PlacesService: new (el: HTMLElement) => {
    getDetails: (
      req: { placeId: string; fields?: string[]; sessionToken?: unknown },
      cb: (
        place:
          | { address_components?: { short_name?: string; long_name?: string; types?: string[] }[] }
          | null,
        status: string
      ) => void
    ) => void
  }
}
const getPlaces = (): GPlaces | undefined => {
  const win = window as unknown as { google?: { maps?: { places?: GPlaces } } }
  return win.google?.maps?.places
}

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
  const [sendingReApi, setSendingReApi] = useState<boolean>(false)
  // Controlled fields for webhook responses
  const [glaSqFt, setGlaSqFt] = useState<string>("0")
  const [purchasePrice, setPurchasePrice] = useState<string>("")
  const [annualTaxes, setAnnualTaxes] = useState<string>("")
  const [annualHoi, setAnnualHoi] = useState<string>("")
  const [annualFlood, setAnnualFlood] = useState<string>("")
  const [annualHoa, setAnnualHoa] = useState<string>("")
  const [annualMgmt, setAnnualMgmt] = useState<string>("")
  const [loanAmount, setLoanAmount] = useState<string>("")
  const [adminFee, setAdminFee] = useState<string>("")
  const [payoffAmount, setPayoffAmount] = useState<string>("")
  const [titleRecordingFee, setTitleRecordingFee] = useState<string>("")
  const [assignmentFee, setAssignmentFee] = useState<string>("")
  const [sellerConcessions, setSellerConcessions] = useState<string>("")
  const [hoiPremium, setHoiPremium] = useState<string>("")
  const [floodPremium, setFloodPremium] = useState<string>("")
  const [emd, setEmd] = useState<string>("")
  const [mortgageDebtValue, setMortgageDebtValue] = useState<string>("")
  const [rehabBudget, setRehabBudget] = useState<string>("")
  const [arv, setArv] = useState<string>("")
  const [aiv, setAiv] = useState<string>("")
  // Additional UI states to include in payload
  const [borrowerType, setBorrowerType] = useState<string | undefined>(undefined)
  const [citizenship, setCitizenship] = useState<string | undefined>(undefined)
  const [fico, setFico] = useState<string>("")
  const [fthb, setFthb] = useState<string | undefined>(undefined) // DSCR only
  const [rentalsOwned, setRentalsOwned] = useState<string>("") // Bridge only
  const [numFlips, setNumFlips] = useState<string>("") // Bridge only
  const [numGunc, setNumGunc] = useState<string>("") // Bridge only
  const [otherExp, setOtherExp] = useState<string | undefined>(undefined) // Bridge only
  const [warrantability, setWarrantability] = useState<string | undefined>(undefined) // Condo only
  const [strValue, setStrValue] = useState<string | undefined>(undefined) // DSCR only
  const [decliningMarket, setDecliningMarket] = useState<string | undefined>(undefined) // DSCR only
  const [loanStructureType, setLoanStructureType] = useState<string | undefined>(undefined) // DSCR
  const [ppp, setPpp] = useState<string | undefined>(undefined) // DSCR
  const [term, setTerm] = useState<string | undefined>(undefined) // Bridge
  const [lenderOrig, setLenderOrig] = useState<string>("")
  const [brokerOrig, setBrokerOrig] = useState<string>("")
  const [borrowerName, setBorrowerName] = useState<string>("")
  const [guarantorsStr, setGuarantorsStr] = useState<string>("")
  const [uwException, setUwException] = useState<string | undefined>(undefined)
  const [taxEscrowMonths, setTaxEscrowMonths] = useState<string>("")
  const [gmapsReady, setGmapsReady] = useState<boolean>(false)
  const [showPredictions, setShowPredictions] = useState<boolean>(false)
  const [activePredictionIdx, setActivePredictionIdx] = useState<number>(-1)
  const [programResults, setProgramResults] = useState<ProgramResult[]>([])
  const [isDispatching, setIsDispatching] = useState<boolean>(false)
  const predictionsMenuRef = useRef<HTMLDivElement | null>(null)
  const pointerInMenuRef = useRef<boolean>(false)
  const suppressPredictionsRef = useRef<boolean>(false)
  const sessionTokenRef = useRef<unknown>(undefined)
  async function handleSendToReApi(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (sendingReApi) return
    try {
      setSendingReApi(true)
      const payload = {
        street,
        apt,
        city,
        state: stateCode ?? "",
        zip,
        transaction_type: transactionType ?? "",
      }
      const res = await fetch("https://n8n.axora.info/webhook/c0d82736-8004-4c69-b9fc-fee54676ff46", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const text = await res.text().catch(() => "")
        throw new Error(text || `Request failed: ${res.status}`)
      }
      // Try to parse JSON and populate fields if present
      let data: Record<string, unknown> | undefined
      try {
        data = await res.json()
      } catch {
        data = undefined
      }
      if (data) {
        const val = (...keys: string[]) => {
          for (const k of keys) {
            if (k in data!) return data![k] as unknown
          }
          return undefined
        }
        // Property Type
        const pt = val("property-type", "property_type")
        if (typeof pt === "string" && pt) {
          setPropertyType(pt)
        }
        // Number of Units (validated against property-type)
        const units = val("num-units", "num_units", "units")
        if (units !== undefined && units !== null) {
          const asNum = Number(units)
          if (!Number.isNaN(asNum) && Number.isFinite(asNum)) {
            const allowed =
              pt === "mf2_4"
                ? [2, 3, 4]
                : pt === "mf5_10"
                ? [5, 6, 7, 8, 9, 10]
                : pt
                ? [1]
                : []
            if (allowed.length === 0 || allowed.includes(asNum)) {
              setNumUnits(asNum)
            }
          }
        }
        // GLA Sq Ft
        const gla = val("gla", "gla_sq_ft", "gla_sqft", "gla_sqft_ft")
        if (gla !== undefined && gla !== null) {
          setGlaSqFt(String(gla))
        }
        // Acquisition Date
        const acq = val("acq-date", "acq_date", "acquisition_date")
        if (typeof acq === "string" || acq instanceof Date || typeof acq === "number") {
          const d = acq instanceof Date ? acq : new Date(acq)
          if (!isNaN(d.getTime())) setAcquisitionDate(d)
        }
        // Purchase Price
        const pp = val("purchase-price", "purchase_price")
        if (pp !== undefined && pp !== null) {
          setPurchasePrice(String(pp))
        }
        // Annual Taxes
        const at = val("annual-taxes", "annual_taxes")
        if (at !== undefined && at !== null) {
          setAnnualTaxes(String(at))
        }
      }
      toast({
        title: "Sent to RE API",
        description: "Address submitted successfully.",
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      toast({
        title: "Failed to send",
        description: message,
        variant: "destructive",
      })
    } finally {
      setSendingReApi(false)
    }
  }

  // Build payload of current, visible inputs
  function buildPayload() {
    const payload: Record<string, unknown> = {
      loan_type: loanType,
      transaction_type: transactionType,
      property_type: propertyType,
      num_units: numUnits,
      request_max_leverage: requestMaxLeverage,
      address: {
        street,
        apt,
        city,
        state: stateCode,
        zip,
        county,
      },
      gla_sq_ft: glaSqFt,
      purchase_price: purchasePrice,
      loan_amount: loanAmount,
      admin_fee: adminFee,
      payoff_amount: payoffAmount,
      aiv,
      arv,
      rehab_budget: rehabBudget,
      rehab_holdback: rehabHoldback,
      emd,
      taxes_annual: annualTaxes,
      hoi_annual: annualHoi,
      flood_annual: annualFlood,
      hoa_annual: annualHoa,
      hoi_premium: hoiPremium,
      flood_premium: floodPremium,
      mortgage_debt: mortgageDebtValue,
      closing_date: closingDate ? closingDate.toISOString() : null,
      // always include effective dates (can be null)
      hoi_effective_date: hoiEffective ? hoiEffective.toISOString() : null,
      flood_effective_date: floodEffective ? floodEffective.toISOString() : null,
      // borrower + fees: always include (may be empty string)
      borrower_type: borrowerType ?? "",
      citizenship: citizenship ?? "",
      fico,
      borrower_name: borrowerName,
      guarantors: (guarantorsStr || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      uw_exception: uwException ?? "",
      lender_orig_percent: lenderOrig,
      broker_orig_percent: brokerOrig,
      title_recording_fee: titleRecordingFee,
      assignment_fee: assignmentFee,
      seller_concessions: sellerConcessions,
      tax_escrow_months: taxEscrowMonths,
    }
    // Optional / conditional extras - include when section is visible
    if (transactionType !== "purchase") {
      payload["acquisition_date"] = acquisitionDate ? acquisitionDate.toISOString() : null
    }
    if (loanType === "bridge") {
      payload["bridge_type"] = bridgeType
      payload["term"] = term ?? ""
      payload["rentals_owned"] = rentalsOwned
      payload["num_flips"] = numFlips
      payload["num_gunc"] = numGunc
      payload["other_exp"] = otherExp ?? ""
    }
    if (loanType === "dscr") {
      payload["fthb"] = fthb ?? ""
      payload["loan_structure_type"] = loanStructureType ?? ""
      payload["ppp"] = ppp ?? ""
      payload["str"] = strValue ?? ""
      payload["declining_market"] = decliningMarket ?? ""
    }
    if (propertyType === "condo") {
      payload["warrantability"] = warrantability ?? ""
    }
    if (unitData?.length) {
      payload["unit_data"] = unitData.map((u) => ({
        leased: u.leased,
        gross: u.gross,
        market: u.market,
      }))
    }
    return payload
  }

  async function handleCalculate() {
    try {
      if (!loanType) {
        toast({ title: "Missing loan type", description: "Select a Loan Type before calculating.", variant: "destructive" })
        return
      }
      // show results container with loader
      setProgramResults([])
      setIsDispatching(true)
      const payload = buildPayload()
      const res = await fetch("/api/pricing/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loanType,
          data: payload,
        }),
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => "")
        throw new Error(txt || `Dispatch failed (${res.status})`)
      }
      const result = await res.json().catch(() => ({}))
      // store results in state for display
      setProgramResults(Array.isArray(result?.programs) ? result.programs : [])
      toast({ title: "Sent", description: `Webhook deliveries: ${result?.delivered ?? 0}` })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      toast({ title: "Failed to send", description: message, variant: "destructive" })
    } finally {
      setIsDispatching(false)
    }
  }
  const [predictions, setPredictions] = useState<PlacePrediction[]>([])

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

  // Load Google Maps JS API (Places) once
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    ;(async () => {
      try {
        await ensureGoogleMaps(apiKey)
        // Initialize a session token for a better billing experience
        const places = getPlaces()
        if (places) {
          sessionTokenRef.current = new places.AutocompleteSessionToken()
        }
        setGmapsReady(true)
      } catch {
        setGmapsReady(false)
      }
    })()
  }, [])

  // Fetch predictions as the user types, using our own UI
  useEffect(() => {
    if (!gmapsReady) return
    // Suppress one prediction fetch cycle right after a programmatic selection
    if (suppressPredictionsRef.current) {
      suppressPredictionsRef.current = false
      setPredictions([])
      setShowPredictions(false)
      return
    }
    const q = street.trim()
    if (!q) {
      setPredictions([])
      return
    }
    const places = getPlaces()
    if (!places) return
    const svc = new places.AutocompleteService()
    const req = {
      input: q,
      types: ["address"],
      componentRestrictions: { country: ["us"] },
      sessionToken: sessionTokenRef.current,
    }
    let cancelled = false
    svc.getPlacePredictions(req, (res: PlacePrediction[] | null, status: string) => {
      if (cancelled) return
      const ok = status === "OK" || status === "ZERO_RESULTS"
      if (!ok || !res) {
        setPredictions([])
        return
      }
      setPredictions(res)
      setShowPredictions(true)
      setActivePredictionIdx(-1)
    })
    return () => {
      cancelled = true
    }
  }, [street, gmapsReady])

  function applyPlaceById(placeId: string) {
    const places = getPlaces()
    if (!places) return
    const svc = new places.PlacesService(document.createElement("div"))
    const req = {
      placeId,
      fields: ["address_components", "formatted_address"],
      sessionToken: sessionTokenRef.current,
    }
    svc.getDetails(req, (place, status: string) => {
      const ok = status === "OK"
      if (!ok || !place) return
      type AddressComponent = { short_name?: string; long_name?: string; types?: string[] }
      const comps = (place?.address_components as AddressComponent[]) ?? []
      const get = (t: string) => comps.find((c: AddressComponent) => c.types?.includes(t))
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
      setPredictions([])
      setShowPredictions(false)
      // Prevent the next input value change from reopening the menu immediately
      suppressPredictionsRef.current = true
      // New token after a selection, per session semantics
      sessionTokenRef.current = new places.AutocompleteSessionToken()
    })
  }

  return (
    <div data-layout="fixed" className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <h2 className="text-xl font-bold tracking-tight">Pricing Engine</h2>

      <div className="flex h-full min-h-0 flex-1 gap-4 overflow-hidden">
        {/* Left 25% column: scrollable container with header and footer */}
        <aside className="min-h-0 w-full lg:w-1/4">
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
            <div className="min-h-0 flex-1 overflow-auto p-3 pb-4">
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
                        <Select value={borrowerType} onValueChange={setBorrowerType}>
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
                        <Select value={citizenship} onValueChange={setCitizenship}>
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
                            <Select value={fthb} onValueChange={setFthb}>
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
                              <CalcInput
                                id="mortgage-debt"
                                placeholder="0.00"
                                className="pl-6"
                                value={mortgageDebtValue}
                                onValueChange={setMortgageDebtValue}
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
                          value={fico}
                          onChange={(e) => setFico(e.target.value)}
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
                            value={rentalsOwned}
                            onChange={(e) => setRentalsOwned(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="num-flips"># of Flips</Label>
                          <Input
                            id="num-flips"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="0"
                            value={numFlips}
                            onChange={(e) => setNumFlips(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="num-gunc"># of GUNC</Label>
                          <Input
                            id="num-gunc"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="0"
                            value={numGunc}
                            onChange={(e) => setNumGunc(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="other-exp">Other</Label>
                          <Select value={otherExp} onValueChange={setOtherExp}>
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
                      <Button size="sm" variant="secondary" className="ml-auto h-7 not-italic" asChild>
                        <span onClick={handleSendToReApi} aria-disabled={sendingReApi}>
                          {sendingReApi ? "Sending..." : "RE API"}
                        </span>
                      </Button>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-1 sm:col-span-2">
                          <Label htmlFor="street">Street</Label>
                          <div className="relative">
                            <Input
                              id="street"
                              placeholder="123 Main St"
                              ref={streetInputRef}
                              value={street}
                              onChange={(e) => setStreet(e.target.value)}
                              onFocus={() => predictions.length && setShowPredictions(true)}
                              onKeyDown={(e) => {
                                if (!showPredictions || predictions.length === 0) return
                                if (e.key === "ArrowDown") {
                                  e.preventDefault()
                                  setActivePredictionIdx((idx) =>
                                    Math.min(idx + 1, predictions.length - 1),
                                  )
                                } else if (e.key === "ArrowUp") {
                                  e.preventDefault()
                                  setActivePredictionIdx((idx) => Math.max(idx - 1, 0))
                                } else if (e.key === "Enter") {
                                  if (activePredictionIdx >= 0) {
                                    e.preventDefault()
                                    const p = predictions[activePredictionIdx]
                                    applyPlaceById(p.place_id)
                                  }
                                } else if (e.key === "Escape") {
                                  setShowPredictions(false)
                                }
                              }}
                              onBlur={() => {
                                // If the blur was caused by clicking inside the menu, don't close yet
                                setTimeout(() => {
                                  if (!pointerInMenuRef.current) {
                                    setShowPredictions(false)
                                  }
                                }, 0)
                              }}
                              autoComplete="off"
                            />
                            {showPredictions && predictions.length > 0 && (
                              <div
                                ref={predictionsMenuRef}
                                className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border bg-background shadow"
                                role="listbox"
                                onMouseDown={() => {
                                  // Mark that the pointer is interacting within the menu (used by onBlur)
                                  pointerInMenuRef.current = true
                                }}
                                onMouseUp={() => {
                                  // Reset after click completes
                                  pointerInMenuRef.current = false
                                }}
                              >
                                {predictions.map((p, idx) => (
                                  <button
                                    key={p.place_id}
                                    type="button"
                                    className={`flex w-full items-start gap-2 px-2 py-2 text-left hover:bg-accent ${
                                      idx === activePredictionIdx ? "bg-accent" : ""
                                    }`}
                                    onMouseEnter={() => setActivePredictionIdx(idx)}
                                    onClick={() => {
                                      applyPlaceById(p.place_id)
                                    }}
                                  >
                                    <IconMapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                    <div className="flex min-w-0 flex-col">
                                      <span className="truncate text-sm font-medium">
                                        {p.structured_formatting?.main_text ?? p.description}
                                      </span>
                                      <span className="truncate text-xs text-muted-foreground">
                                        {p.structured_formatting?.secondary_text ?? ""}
                                      </span>
                                    </div>
                                  </button>
                                ))}
                                <div className="border-t px-2 py-1 text-right text-[10px] uppercase tracking-wide text-muted-foreground">
                                  Powered by Google
                                </div>
                              </div>
                            )}
                          </div>
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
                            <Select value={warrantability} onValueChange={setWarrantability}>
                              <SelectTrigger id="warrantability" className="h-9 w-full">
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="warrantable">Warrantable</SelectItem>
                                <SelectItem value="non-warrantable">Non-Warrantable</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ) : null}

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
                          <Input
                            id="gla"
                            inputMode="numeric"
                            placeholder="0"
                            value={glaSqFt}
                            onChange={(e) => setGlaSqFt(e.target.value)}
                          />
                        </div>
                        {loanType === "dscr" && (
                          <>
                            <div className="flex flex-col gap-1">
                              <Label htmlFor="str">STR</Label>
                              <Select value={strValue} onValueChange={setStrValue}>
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
                              <Select value={decliningMarket} onValueChange={setDecliningMarket}>
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
                              <CalcInput
                                id="rehab-budget"
                                placeholder="0.00"
                                className="pl-6"
                                value={rehabBudget}
                                onValueChange={setRehabBudget}
                              />
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Label htmlFor="arv">ARV</Label>
                            <div className="relative">
                              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                                $
                              </span>
                              <CalcInput
                                id="arv"
                                placeholder="0.00"
                                className="pl-6"
                                value={arv}
                                onValueChange={setArv}
                              />
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
                          <CalcInput
                            id="annual-taxes"
                            placeholder="0.00"
                            className="pl-6"
                            value={annualTaxes}
                            onValueChange={setAnnualTaxes}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="annual-hoi">Annual HOI</Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <CalcInput
                            id="annual-hoi"
                            placeholder="0.00"
                            className="pl-6"
                            value={annualHoi}
                            onValueChange={setAnnualHoi}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="annual-flood">Annual Flood</Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <CalcInput
                            id="annual-flood"
                            placeholder="0.00"
                            className="pl-6"
                            value={annualFlood}
                            onValueChange={setAnnualFlood}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="annual-hoa">Annual HOA</Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <CalcInput
                            id="annual-hoa"
                            placeholder="0.00"
                            className="pl-6"
                            value={annualHoa}
                            onValueChange={setAnnualHoa}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="annual-mgmt">Annual Management</Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <CalcInput
                            id="annual-mgmt"
                            placeholder="0.00"
                            className="pl-6"
                            value={annualMgmt}
                            onValueChange={setAnnualMgmt}
                          />
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
                              <CalcInput
                                  id={`gross-${idx}`}
                                  placeholder="0.00"
                                  className="pl-6 w-full"
                                value={unitData[idx]?.gross ?? ""}
                                onValueChange={(v) =>
                                    setUnitData((prev) => {
                                      const next = [...prev]
                                    next[idx] = { ...(next[idx] ?? {}), gross: v }
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
                              <CalcInput
                                  id={`market-${idx}`}
                                  placeholder="0.00"
                                  className="pl-6 w-full"
                                value={unitData[idx]?.market ?? ""}
                                onValueChange={(v) =>
                                    setUnitData((prev) => {
                                      const next = [...prev]
                                    next[idx] = { ...(next[idx] ?? {}), market: v }
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
                      ) : null}
                      {loanType === "dscr" && (
                        <>
                          <div className="flex flex-col gap-1">
                            <Label htmlFor="loan-structure-type">Loan Structure</Label>
                            <Select value={loanStructureType} onValueChange={setLoanStructureType}>
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
                            <Select value={ppp} onValueChange={setPpp}>
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
                          <Select value={term} onValueChange={setTerm}>
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
                          <CalcInput
                            id="purchase-price"
                            placeholder="0.00"
                            className="pl-6"
                            value={purchasePrice}
                            onValueChange={setPurchasePrice}
                          />
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
                              <CalcInput
                                id="payoff-amount"
                                placeholder="0.00"
                                className="pl-6"
                                value={payoffAmount}
                                onValueChange={setPayoffAmount}
                              />
                            </div>
                          </div>
                        </>
                      ) : null}
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="aiv">AIV</Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <CalcInput
                            id="aiv"
                            placeholder="0.00"
                            className="pl-6"
                            value={aiv}
                            onValueChange={setAiv}
                          />
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
                                <CalcInput
                                  id="initial-loan-amount"
                                  placeholder="0.00"
                                  className="pl-6"
                                  value={initialLoanAmount}
                                  onValueChange={setInitialLoanAmount}
                                />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <Label htmlFor="rehab-holdback">Rehab Holdback</Label>
                              <div className="relative">
                                <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                                  $
                                </span>
                                <CalcInput
                                  id="rehab-holdback"
                                  placeholder="0.00"
                                  className="pl-6"
                                  value={rehabHoldback}
                                  onValueChange={setRehabHoldback}
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
                              <CalcInput
                                id="loan-amount"
                                placeholder="0.00"
                                className="pl-6"
                                value={loanAmount}
                                onValueChange={setLoanAmount}
                              />
                            </div>
                          </div>
                        )
                      ) : null}
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="lender-orig">Lender Origination</Label>
                        <div className="relative">
                          <Input id="lender-orig" inputMode="decimal" placeholder="0.00" className="pr-6" value={lenderOrig} onChange={(e)=>setLenderOrig(e.target.value)} />
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
                          <CalcInput
                            id="admin-fee"
                            placeholder="0.00"
                            className="pl-6"
                            value={adminFee}
                            onValueChange={setAdminFee}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="broker-orig">Broker Origination</Label>
                        <div className="relative">
                          <Input id="broker-orig" inputMode="decimal" placeholder="0.00" className="pr-6" value={brokerOrig} onChange={(e)=>setBrokerOrig(e.target.value)} />
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
                        <Input id="borrower-name" placeholder="Name" value={borrowerName} onChange={(e)=>setBorrowerName(e.target.value)} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="guarantors">Guarantor(s)</Label>
                        <Input id="guarantors" placeholder="Names separated by comma" value={guarantorsStr} onChange={(e)=>setGuarantorsStr(e.target.value)} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="uw-exception">UW Exception</Label>
                        <Select value={uwException} onValueChange={setUwException}>
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
                          <CalcInput
                            id="title-recording"
                            placeholder="0.00"
                            className="pl-6"
                            value={titleRecordingFee}
                            onValueChange={setTitleRecordingFee}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="assignment-fee">Assignment Fee</Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <CalcInput
                            id="assignment-fee"
                            placeholder="0.00"
                            className="pl-6"
                            value={assignmentFee}
                            onValueChange={setAssignmentFee}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="seller-concessions">Seller Concessions</Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <CalcInput
                            id="seller-concessions"
                            placeholder="0.00"
                            className="pl-6"
                            value={sellerConcessions}
                            onValueChange={setSellerConcessions}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="tax-escrow">Tax Escrow (months)</Label>
                        <Input id="tax-escrow" inputMode="numeric" pattern="[0-9]*" placeholder="0" value={taxEscrowMonths} onChange={(e)=>setTaxEscrowMonths(e.target.value)} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="hoi-premium">HOI Premium</Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <CalcInput
                            id="hoi-premium"
                            placeholder="0.00"
                            className="pl-6"
                            value={hoiPremium}
                            onValueChange={setHoiPremium}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="flood-premium">Flood Premium</Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <CalcInput
                            id="flood-premium"
                            placeholder="0.00"
                            className="pl-6"
                            value={floodPremium}
                            onValueChange={setFloodPremium}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="emd">EMD</Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <CalcInput
                            id="emd"
                            placeholder="0.00"
                            className="pl-6"
                            value={emd}
                            onValueChange={setEmd}
                          />
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
                <Button onClick={handleCalculate}>Calculate</Button>
              </div>
            </div>
          </div>
        </aside>

        {/* Right 75% column: results display */}
        <section className="hidden h-full min-h-0 w-full overflow-auto rounded-md border p-3 pb-4 lg:block lg:w-3/4">
          <ResultsPanel results={programResults} loading={isDispatching} />
        </section>
      </div>
    </div>
  )
}


// ---------- Results UI ----------
import * as React from "react"
type ProgramResponseData = {
  pass?: boolean
  highlight_display?: number
  loan_price?: number[]
  interest_rate?: number[]
  loan_amount?: string
  ltv?: string
  pitia?: number[]
  dscr?: number[]
  [key: string]: unknown
}
type ProgramResult = {
  internal_name?: string
  external_name?: string
  webhook_url?: string
  status?: number
  ok?: boolean
  data?: ProgramResponseData | null
}

function pick<T>(arr: T[] | undefined, idx: number): T | undefined {
  if (!Array.isArray(arr)) return undefined
  if (idx < 0 || idx >= arr.length) return undefined
  return arr[idx]
}

function ResultCard({ r }: { r: ProgramResult }) {
  const d = r?.data ?? {}
  const pass = d?.pass === true
  const hi = Number(d?.highlight_display ?? 0)
  const loanPrice = pick<number>(d?.loan_price, hi)
  const rate = pick<number>(d?.interest_rate, hi)
  const pitia = pick<number>(d?.pitia, hi)
  const dscr = pick<number>(d?.dscr, hi)
  const loanAmount = d?.loan_amount
  const ltv = d?.ltv

  return (
    <div className="mb-3 rounded-md border p-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold">
            {r.internal_name ?? "Program"}
          </div>
          <div className="text-xs font-semibold">{r.external_name}</div>
        </div>
        <div
          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
            pass
              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100"
              : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100"
          }`}
        >
          {pass ? "PASS" : "FAIL"}
        </div>
      </div>

      {pass ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Widget label="Loan Price" value={loanPrice} />
          <Widget label="Interest Rate" value={rate} />
          <Widget label="Loan Amount" value={loanAmount} />
          <Widget label="LTV" value={ltv} />
          <Widget label="PITIA" value={pitia} />
          <Widget label="DSCR" value={dscr} />
        </div>
      ) : null}

      {/* Details Table */}
      <Accordion type="single" collapsible className="mt-2">
        <AccordionItem value="details">
          <AccordionTrigger className="text-sm">Details</AccordionTrigger>
          <AccordionContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-center">
                <thead className="border-b">
                  <tr>
                    <th className="py-1 pr-3">Loan Price</th>
                    <th className="py-1 pr-3">Interest Rate</th>
                    <th className="py-1 pr-3">Loan Amount</th>
                    <th className="py-1 pr-3">LTV</th>
                    <th className="py-1 pr-3">PITIA</th>
                    <th className="py-1 pr-3">DSCR</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(d?.loan_price) &&
                    d.loan_price.map((lp: number, i: number) => {
                      const hasLoanPrice = lp !== undefined && lp !== null && !Number.isNaN(lp as number)
                      return (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-1 pr-3 text-center">{lp}</td>
                        <td className="py-1 pr-3 text-center">{Array.isArray(d?.interest_rate) ? d.interest_rate[i] : ""}</td>
                        <td className="py-1 pr-3 text-center">{hasLoanPrice ? (loanAmount ?? "") : ""}</td>
                        <td className="py-1 pr-3 text-center">{hasLoanPrice ? (ltv ?? "") : ""}</td>
                        <td className="py-1 pr-3 text-center">{Array.isArray(d?.pitia) ? d.pitia[i] : ""}</td>
                        <td className="py-1 pr-3 text-center">{Array.isArray(d?.dscr) ? d.dscr[i] : ""}</td>
                      </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

function Widget({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="rounded-md border p-2">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold">{value ?? ""}</div>
    </div>
  )
}

function ResultsPanel({ results, loading }: { results: ProgramResult[]; loading?: boolean }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center">
        <div className="loader-wrapper">
          <span className="loader-letter">P</span>
          <span className="loader-letter">R</span>
          <span className="loader-letter">O</span>
          <span className="loader-letter">G</span>
          <span className="loader-letter">R</span>
          <span className="loader-letter">A</span>
          <span className="loader-letter">M</span>
          <span className="loader-letter">S</span>
          <span className="loader" />
        </div>
        <LoaderStyles />
      </div>
    )
  }
  if (!results?.length) {
    return <div className="text-sm text-muted-foreground">Results will appear here after you calculate.</div>
  }
  return (
    <div>
      {results.map((r, idx) => (
        <ResultCard key={idx} r={r} />
      ))}
    </div>
  )
}

function LoaderStyles() {
  return (
    <style jsx global>{`
      /* Loader styles (supports light/dark) */
      .loader-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 120px;
        width: auto;
        margin: 2rem;
        font-family: "Poppins", system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
        font-size: 1.6em;
        font-weight: 600;
        user-select: none;
        color: #fff;
        scale: 2;
      }
      @media (prefers-color-scheme: light) {
        .loader-wrapper {
          color: #111;
        }
      }
      .loader {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: 100%;
        z-index: 1;
        background-color: transparent;
        -webkit-mask: repeating-linear-gradient(90deg, transparent 0, transparent 6px, black 7px, black 8px);
        mask: repeating-linear-gradient(90deg, transparent 0, transparent 6px, black 7px, black 8px);
      }
      .loader::after {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image:
          radial-gradient(circle at 50% 50%, #ff0 0%, transparent 50%),
          radial-gradient(circle at 45% 45%, #f00 0%, transparent 45%),
          radial-gradient(circle at 55% 55%, #0ff 0%, transparent 45%),
          radial-gradient(circle at 45% 55%, #0f0 0%, transparent 45%),
          radial-gradient(circle at 55% 45%, #00f 0%, transparent 45%);
        -webkit-mask: radial-gradient(circle at 50% 50%, transparent 0%, transparent 10%, black 25%);
        mask: radial-gradient(circle at 50% 50%, transparent 0%, transparent 10%, black 25%);
        animation: transform-animation 2s infinite alternate, opacity-animation 4s infinite;
        animation-timing-function: cubic-bezier(0.6, 0.8, 0.5, 1);
      }
      @keyframes transform-animation {
        0% { transform: translate(-55%); }
        100% { transform: translate(55%); }
      }
      @keyframes opacity-animation {
        0%, 100% { opacity: 0; }
        15% { opacity: 1; }
        65% { opacity: 0; }
      }
      .loader-letter {
        display: inline-block;
        opacity: 0;
        animation: loader-letter-anim 4s infinite linear;
        z-index: 2;
      }
      .loader-letter:nth-child(1) { animation-delay: 0.1s; }
      .loader-letter:nth-child(2) { animation-delay: 0.205s; }
      .loader-letter:nth-child(3) { animation-delay: 0.31s; }
      .loader-letter:nth-child(4) { animation-delay: 0.415s; }
      .loader-letter:nth-child(5) { animation-delay: 0.521s; }
      .loader-letter:nth-child(6) { animation-delay: 0.626s; }
      .loader-letter:nth-child(7) { animation-delay: 0.731s; }
      .loader-letter:nth-child(8) { animation-delay: 0.837s; }
      @keyframes loader-letter-anim {
        0% { opacity: 0; }
        5% {
          opacity: 1;
          text-shadow: 0 0 4px #fff;
          transform: scale(1.1) translateY(-2px);
        }
        20% { opacity: 0.2; }
        100% { opacity: 0; }
      }
    `}</style>
  )
}

