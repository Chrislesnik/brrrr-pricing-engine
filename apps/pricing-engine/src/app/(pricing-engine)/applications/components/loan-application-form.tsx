"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronRight, Loader2, Plus, Send, Trash2 } from "lucide-react"
import { cn } from "@repo/lib/cn"
import { Button } from "@repo/ui/shadcn/button"
import { Input } from "@repo/ui/shadcn/input"
import { Label } from "@repo/ui/shadcn/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/shadcn/select"
import { toast } from "sonner"
import {
  Stepper,
  StepperItem,
  StepperTrigger,
  StepperIndicator,
  StepperTitle,
  StepperNav,
} from "@/components/ui/stepper"

const STEPS = [
  { label: "Borrower & Guarantor(s)", description: "Primary borrower and guarantor information" },
  { label: "Entity", description: "Entity information (if applicable)" },
  { label: "Loan Structure", description: "Loan terms and parameters" },
  { label: "Property", description: "Property address and type" },
  { label: "3rd Party Contacts", description: "Attorney, title, insurance contacts" },
  { label: "Review & Sign", description: "Review and send for e-signature" },
] as const

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
]

const ENTITY_TYPES = [
  "LLC", "Corporation", "S-Corp", "Partnership", "Limited Partnership",
  "Trust", "Sole Proprietorship", "Other",
]

const PROPERTY_TYPES = [
  "Single Family", "Multi-Family (2-4)", "Multi-Family (5+)", "Mixed Use",
  "Commercial", "Industrial", "Land", "Condo", "Townhouse", "Other",
]

const LOAN_PURPOSES = [
  "Purchase", "Refinance", "Cash-Out Refinance", "Construction",
  "Bridge", "Fix & Flip", "DSCR", "Other",
]

const CITIZENSHIP_OPTIONS = ["U.S. Citizen", "Permanent Resident", "Non-Resident"]

interface Guarantor {
  name: string
  ssn: string
  dob: string
  mid_fico: string
  email: string
  primary_phone: string
  alternate_phone: string
  address_line_1: string
  address_line_2: string
  city: string
  state: string
  zip: string
  county: string
  citizenship: string
  green_card: string
  visa: string
  visa_type: string
  rentals_owned: string
  fix_and_flips: string
  ground_ups: string
  is_licensed_professional: string
}

interface ThirdPartyContact {
  role: string
  name: string
  email: string
  phone: string
}

const THIRD_PARTY_ROLES = [
  "Attorney", "Title Company", "Insurance Agent", "Appraiser",
  "Real Estate Agent", "Accountant", "Other",
]

interface FormData {
  // Step 0: Borrower & Guarantor(s)
  vesting_type: "individual" | "entity"
  first_name: string
  last_name: string
  borrower_email: string
  borrower_phone: string
  borrower_ssn: string
  borrower_dob: string
  guarantors: Guarantor[]

  // Step 1: Entity
  entity_name: string
  entity_type: string
  ein: string
  state_of_formation: string
  entity_address: string

  // Step 2: Loan Structure
  loan_amount: string
  loan_purpose: string
  loan_term: string
  interest_rate: string
  ltv: string
  amortization: string

  // Step 3: Property
  property_street: string
  property_city: string
  property_state: string
  property_zip: string
  property_type: string
  purchase_price: string
  appraised_value: string

  // Step 4: 3rd Party Contacts
  third_party_contacts: ThirdPartyContact[]

  // Step 5: Review & Sign
  template_id: string
  signer_email: string
}

const INITIAL_FORM: FormData = {
  vesting_type: "entity",
  first_name: "",
  last_name: "",
  borrower_email: "",
  borrower_phone: "",
  borrower_ssn: "",
  borrower_dob: "",
  guarantors: [{
    name: "", ssn: "", dob: "", mid_fico: "",
    email: "", primary_phone: "", alternate_phone: "",
    address_line_1: "", address_line_2: "", city: "", state: "", zip: "", county: "",
    citizenship: "", green_card: "", visa: "", visa_type: "",
    rentals_owned: "", fix_and_flips: "", ground_ups: "",
    is_licensed_professional: "No",
  }],
  entity_name: "",
  entity_type: "",
  ein: "",
  state_of_formation: "",
  entity_address: "",
  loan_amount: "",
  loan_purpose: "",
  loan_term: "",
  interest_rate: "",
  ltv: "",
  amortization: "",
  property_street: "",
  property_city: "",
  property_state: "",
  property_zip: "",
  property_type: "",
  purchase_price: "",
  appraised_value: "",
  third_party_contacts: [{ role: "", name: "", email: "", phone: "" }],
  template_id: "",
  signer_email: "",
}

export function LoanApplicationForm({ className }: { className?: string }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [createdLoanId, setCreatedLoanId] = useState<string | null>(null)

  const isEntityStep = step === 1
  const entityStepSkipped = isEntityStep && form.vesting_type === "individual"

  const set = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }))
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    },
    []
  )

  const addGuarantor = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      guarantors: [...prev.guarantors, {
        name: "", ssn: "", dob: "", mid_fico: "",
        email: "", primary_phone: "", alternate_phone: "",
        address_line_1: "", address_line_2: "", city: "", state: "", zip: "", county: "",
        citizenship: "", green_card: "", visa: "", visa_type: "",
        rentals_owned: "", fix_and_flips: "", ground_ups: "",
        is_licensed_professional: "No",
      }],
    }))
  }, [])

  const removeGuarantor = useCallback((idx: number) => {
    setForm((prev) => ({
      ...prev,
      guarantors: prev.guarantors.filter((_, i) => i !== idx),
    }))
  }, [])

  const updateGuarantor = useCallback(
    (idx: number, field: keyof Guarantor, value: string) => {
      setForm((prev) => ({
        ...prev,
        guarantors: prev.guarantors.map((g, i) =>
          i === idx ? { ...g, [field]: value } : g
        ),
      }))
    },
    []
  )

  const addContact = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      third_party_contacts: [
        ...prev.third_party_contacts,
        { role: "", name: "", email: "", phone: "" },
      ],
    }))
  }, [])

  const removeContact = useCallback((idx: number) => {
    setForm((prev) => ({
      ...prev,
      third_party_contacts: prev.third_party_contacts.filter((_, i) => i !== idx),
    }))
  }, [])

  const updateContact = useCallback(
    (idx: number, field: keyof ThirdPartyContact, value: string) => {
      setForm((prev) => ({
        ...prev,
        third_party_contacts: prev.third_party_contacts.map((c, i) =>
          i === idx ? { ...c, [field]: value } : c
        ),
      }))
    },
    []
  )

  const validate = useCallback((): boolean => {
    const errs: Record<string, string> = {}

    if (step === 0) {
      if (!form.first_name.trim()) errs.first_name = "Required"
      if (!form.last_name.trim()) errs.last_name = "Required"
      if (!form.borrower_email.trim()) errs.borrower_email = "Required"
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.borrower_email))
        errs.borrower_email = "Invalid email"
      form.guarantors.forEach((g, i) => {
        if (!g.name.trim()) errs[`guarantor_name_${i}`] = "Required"
        if (!g.email.trim()) errs[`guarantor_email_${i}`] = "Required"
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(g.email))
          errs[`guarantor_email_${i}`] = "Invalid email"
      })
    }

    if (step === 1 && form.vesting_type === "entity") {
      if (!form.entity_name.trim()) errs.entity_name = "Required"
    }

    if (step === 2) {
      if (!form.loan_amount.trim()) errs.loan_amount = "Required"
      if (!form.loan_purpose) errs.loan_purpose = "Required"
    }

    if (step === 3) {
      if (!form.property_street.trim()) errs.property_street = "Required"
      if (!form.property_city.trim()) errs.property_city = "Required"
      if (!form.property_state) errs.property_state = "Required"
      if (!form.property_zip.trim()) errs.property_zip = "Required"
      if (!form.property_type) errs.property_type = "Required"
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }, [step, form])

  const handleStepChange = useCallback((newStep: number) => {
    if (newStep < step) {
      if (newStep === 1 && form.vesting_type === "individual") {
        setStep(0)
        return
      }
      setStep(newStep)
    }
  }, [step, form.vesting_type])

  const next = useCallback(() => {
    if (entityStepSkipped) {
      setStep((s) => Math.min(s + 2, STEPS.length - 1))
      return
    }
    if (!validate()) return
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }, [validate, entityStepSkipped])

  const back = useCallback(() => {
    if (step === 2 && form.vesting_type === "individual") {
      setStep(0)
      return
    }
    setStep((s) => Math.max(s - 1, 0))
  }, [step, form.vesting_type])

  const handleCreateApplication = useCallback(async () => {
    setSubmitting(true)
    try {
      const res = await fetch("/api/applications/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_street: form.property_street,
          property_city: form.property_city,
          property_state: form.property_state,
          property_zip: form.property_zip,
          borrower_type: form.vesting_type,
          entity_name:
            form.vesting_type === "entity" ? form.entity_name : undefined,
          entity_type:
            form.vesting_type === "entity" ? form.entity_type : undefined,
          ein: form.vesting_type === "entity" ? form.ein : undefined,
          state_of_formation:
            form.vesting_type === "entity"
              ? form.state_of_formation
              : undefined,
          first_name: form.first_name,
          last_name: form.last_name,
          borrower_email: form.borrower_email,
          guarantors: form.guarantors.filter(
            (g) => g.name.trim() && g.email.trim()
          ),
          loan_amount: form.loan_amount ? Number(form.loan_amount) : undefined,
          loan_purpose: form.loan_purpose || undefined,
          property_type: form.property_type || undefined,
          loan_term: form.loan_term || undefined,
          interest_rate: form.interest_rate
            ? Number(form.interest_rate)
            : undefined,
          ltv: form.ltv ? Number(form.ltv) : undefined,
        }),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || "Failed to create application")
      }

      const { loanId } = await res.json()
      setCreatedLoanId(loanId)
      toast.success("Application created")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create application"
      )
    } finally {
      setSubmitting(false)
    }
  }, [form])

  const handleSendSignature = useCallback(async () => {
    if (!createdLoanId) return

    if (!form.template_id.trim()) {
      setErrors({ template_id: "Template ID is required" })
      return
    }
    if (!form.signer_email.trim()) {
      setErrors({ signer_email: "Signer email is required" })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(
        `/api/applications/${createdLoanId}/send-signature`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            template_id: form.template_id,
            signer_email: form.signer_email,
            form_data: {
              property_street: form.property_street,
              property_city: form.property_city,
              property_state: form.property_state,
              property_zip: form.property_zip,
              vesting_type: form.vesting_type,
              entity_name: form.entity_name,
              entity_type: form.entity_type,
              ein: form.ein,
              first_name: form.first_name,
              last_name: form.last_name,
              borrower_email: form.borrower_email,
              guarantors: form.guarantors,
              loan_amount: form.loan_amount,
              loan_purpose: form.loan_purpose,
              property_type: form.property_type,
              loan_term: form.loan_term,
              interest_rate: form.interest_rate,
              ltv: form.ltv,
              third_party_contacts: form.third_party_contacts,
            },
          }),
        }
      )

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || "Failed to send signature request")
      }

      toast.success("Signature request sent!")
      router.push("/applications")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send signature"
      )
    } finally {
      setSubmitting(false)
    }
  }, [createdLoanId, form, router])

  const fullAddress = [
    form.property_street,
    form.property_city,
    [form.property_state, form.property_zip].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ")

  const allEmails = [
    ...form.guarantors.filter((g) => g.email.trim()).map((g) => ({
      label: g.name || "Guarantor",
      email: g.email,
    })),
    ...(form.borrower_email
      ? [{ label: `${form.first_name} ${form.last_name}`.trim() || "Borrower", email: form.borrower_email }]
      : []),
  ]

  return (
    <div className={cn("flex overflow-hidden", className)}>
      {/* Vertical Stepper Sidebar */}
      <aside className="w-60 shrink-0 border-r bg-muted/10 overflow-y-auto p-6">
        <Stepper
          value={step + 1}
          onValueChange={(v) => handleStepChange(v - 1)}
          orientation="vertical"
          indicators={{ completed: <Check className="h-4 w-4" /> }}
        >
          <StepperNav>
            {STEPS.map((s, i) => {
              const isSkipped = i === 1 && form.vesting_type === "individual"
              return (
                <StepperItem
                  key={i}
                  step={i + 1}
                  disabled={i > step || isSkipped}
                  className={cn("items-start", isSkipped && "opacity-40")}
                >
                  <StepperTrigger className="items-center text-left">
                    <StepperIndicator>{i + 1}</StepperIndicator>
                    <StepperTitle className={cn("text-left", isSkipped && "line-through")}>
                      {s.label}
                    </StepperTitle>
                  </StepperTrigger>
                </StepperItem>
              )
            })}
          </StepperNav>
        </Stepper>
      </aside>

      {/* Form Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <div>
            <h2 className="text-lg font-semibold">{STEPS[step].label}</h2>
            <p className="text-sm text-muted-foreground">
              {STEPS[step].description}
            </p>
          </div>

          {/* Step 0: Borrower & Guarantor(s) */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <Field label="Vesting Type">
                  <Select
                    value={form.vesting_type}
                    onValueChange={(v) =>
                      set("vesting_type", v as "individual" | "entity")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entity">Entity</SelectItem>
                      <SelectItem value="individual">Individual</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="First Name" error={errors.first_name} required>
                    <Input
                      value={form.first_name}
                      onChange={(e) => set("first_name", e.target.value)}
                      placeholder="John"
                    />
                  </Field>
                  <Field label="Last Name" error={errors.last_name} required>
                    <Input
                      value={form.last_name}
                      onChange={(e) => set("last_name", e.target.value)}
                      placeholder="Doe"
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Email" error={errors.borrower_email} required>
                    <Input
                      type="email"
                      value={form.borrower_email}
                      onChange={(e) => set("borrower_email", e.target.value)}
                      placeholder="john@example.com"
                    />
                  </Field>
                  <Field label="Phone">
                    <Input
                      type="tel"
                      value={form.borrower_phone}
                      onChange={(e) => set("borrower_phone", e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="SSN (last 4)">
                    <Input
                      value={form.borrower_ssn}
                      onChange={(e) => set("borrower_ssn", e.target.value)}
                      placeholder="XXXX"
                      maxLength={4}
                    />
                  </Field>
                  <Field label="Date of Birth">
                    <Input
                      type="date"
                      value={form.borrower_dob}
                      onChange={(e) => set("borrower_dob", e.target.value)}
                    />
                  </Field>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Guarantors</h3>
                {form.guarantors.map((g, i) => (
                  <div
                    key={i}
                    className="rounded-lg border bg-muted/20 p-5 space-y-5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">
                        Guarantor {i + 1}
                      </span>
                      {form.guarantors.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => removeGuarantor(i)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>

                    {/* Personal Info */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Full Name" error={errors[`guarantor_name_${i}`]} required>
                          <Input value={g.name} onChange={(e) => updateGuarantor(i, "name", e.target.value)} placeholder="Jane Doe" />
                        </Field>
                        <Field label="SSN">
                          <Input value={g.ssn} onChange={(e) => updateGuarantor(i, "ssn", e.target.value)} placeholder="XXX-XX-XXXX" />
                        </Field>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Date of Birth">
                          <Input type="date" value={g.dob} onChange={(e) => updateGuarantor(i, "dob", e.target.value)} />
                        </Field>
                        <Field label="Mid-FICO Estimate">
                          <Input type="number" value={g.mid_fico} onChange={(e) => updateGuarantor(i, "mid_fico", e.target.value)} placeholder="720" />
                        </Field>
                      </div>
                    </div>

                    <hr className="border-border/50" />

                    {/* Contact */}
                    <div className="space-y-3">
                      <Field label="Email Address" error={errors[`guarantor_email_${i}`]} required>
                        <Input type="email" value={g.email} onChange={(e) => updateGuarantor(i, "email", e.target.value)} placeholder="jane@example.com" />
                      </Field>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Primary Phone">
                          <Input type="tel" value={g.primary_phone} onChange={(e) => updateGuarantor(i, "primary_phone", e.target.value)} placeholder="(555) 123-4567" />
                        </Field>
                        <Field label="Alternate Phone">
                          <Input type="tel" value={g.alternate_phone} onChange={(e) => updateGuarantor(i, "alternate_phone", e.target.value)} placeholder="(555) 987-6543" />
                        </Field>
                      </div>
                    </div>

                    <hr className="border-border/50" />

                    {/* Address */}
                    <div className="space-y-3">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Primary Residence</span>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Address Line 1">
                          <Input value={g.address_line_1} onChange={(e) => updateGuarantor(i, "address_line_1", e.target.value)} placeholder="123 Main St" />
                        </Field>
                        <Field label="Address Line 2">
                          <Input value={g.address_line_2} onChange={(e) => updateGuarantor(i, "address_line_2", e.target.value)} placeholder="Apt 4B" />
                        </Field>
                      </div>
                      <div className="grid grid-cols-6 gap-4">
                        <div className="col-span-2">
                          <Field label="City">
                            <Input value={g.city} onChange={(e) => updateGuarantor(i, "city", e.target.value)} placeholder="New York" />
                          </Field>
                        </div>
                        <div className="col-span-1">
                          <Field label="State">
                            <Select value={g.state || undefined} onValueChange={(v) => updateGuarantor(i, "state", v)}>
                              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                              <SelectContent>
                                {US_STATES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                              </SelectContent>
                            </Select>
                          </Field>
                        </div>
                        <div className="col-span-1">
                          <Field label="Zip">
                            <Input value={g.zip} onChange={(e) => updateGuarantor(i, "zip", e.target.value)} placeholder="10001" maxLength={10} />
                          </Field>
                        </div>
                        <div className="col-span-2">
                          <Field label="County">
                            <Input value={g.county} onChange={(e) => updateGuarantor(i, "county", e.target.value)} placeholder="County" />
                          </Field>
                        </div>
                      </div>
                    </div>

                    <hr className="border-border/50" />

                    {/* Citizenship & Immigration */}
                    <div className="space-y-3">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Citizenship & Immigration</span>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Citizenship">
                          <Select value={g.citizenship || undefined} onValueChange={(v) => updateGuarantor(i, "citizenship", v)}>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              {CITIZENSHIP_OPTIONS.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field label="Green Card (Y/N)">
                          <Select value={g.green_card || undefined} onValueChange={(v) => updateGuarantor(i, "green_card", v)}>
                            <SelectTrigger><SelectValue placeholder="n/a" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="n/a">n/a</SelectItem>
                              <SelectItem value="Yes">Yes</SelectItem>
                              <SelectItem value="No">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="VISA (Y/N)">
                          <Select value={g.visa || undefined} onValueChange={(v) => updateGuarantor(i, "visa", v)}>
                            <SelectTrigger><SelectValue placeholder="n/a" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="n/a">n/a</SelectItem>
                              <SelectItem value="Yes">Yes</SelectItem>
                              <SelectItem value="No">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field label="VISA Type">
                          <Input value={g.visa_type} onChange={(e) => updateGuarantor(i, "visa_type", e.target.value)} placeholder="n/a" />
                        </Field>
                      </div>
                    </div>

                    <hr className="border-border/50" />

                    {/* Real Estate Experience */}
                    <div className="space-y-3">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Real Estate Experience</span>
                      <div className="grid grid-cols-3 gap-4">
                        <Field label="# Rentals Owned">
                          <Input type="number" value={g.rentals_owned} onChange={(e) => updateGuarantor(i, "rentals_owned", e.target.value)} placeholder="0" />
                        </Field>
                        <Field label="# Fix & Flips (3 Yrs)">
                          <Input type="number" value={g.fix_and_flips} onChange={(e) => updateGuarantor(i, "fix_and_flips", e.target.value)} placeholder="0" />
                        </Field>
                        <Field label="# Ground Ups (3 Yrs)">
                          <Input type="number" value={g.ground_ups} onChange={(e) => updateGuarantor(i, "ground_ups", e.target.value)} placeholder="0" />
                        </Field>
                      </div>
                      <Field label="Licensed GC, RE Broker/Agent, Lender, Appraiser, or other RE professional?">
                        <Select value={g.is_licensed_professional} onValueChange={(v) => updateGuarantor(i, "is_licensed_professional", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="No">No</SelectItem>
                            <SelectItem value="Yes">Yes</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addGuarantor}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Guarantor
                </Button>
              </div>
            </div>
          )}

          {/* Step 1: Entity */}
          {step === 1 && (
            <>
              {form.vesting_type === "individual" ? (
                <div className="rounded-lg border border-dashed bg-muted/30 px-6 py-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    Entity details are not applicable for individual vesting.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={next}
                  >
                    Skip to Loan Structure
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Field
                    label="Entity Name"
                    error={errors.entity_name}
                    required
                  >
                    <Input
                      value={form.entity_name}
                      onChange={(e) => set("entity_name", e.target.value)}
                      placeholder="ABC Holdings LLC"
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Entity Type" error={errors.entity_type}>
                      <Select
                        value={form.entity_type || undefined}
                        onValueChange={(v) => set("entity_type", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {ENTITY_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="EIN" error={errors.ein}>
                      <Input
                        value={form.ein}
                        onChange={(e) => set("ein", e.target.value)}
                        placeholder="XX-XXXXXXX"
                        maxLength={10}
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="State of Formation">
                      <Select
                        value={form.state_of_formation || undefined}
                        onValueChange={(v) => set("state_of_formation", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {US_STATES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Entity Address">
                      <Input
                        value={form.entity_address}
                        onChange={(e) => set("entity_address", e.target.value)}
                        placeholder="123 Main St, City, ST 00000"
                      />
                    </Field>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step 2: Loan Structure */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Loan Amount"
                  error={errors.loan_amount}
                  required
                >
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      $
                    </span>
                    <Input
                      type="number"
                      value={form.loan_amount}
                      onChange={(e) => set("loan_amount", e.target.value)}
                      placeholder="500,000"
                      className="pl-7"
                    />
                  </div>
                </Field>
                <Field
                  label="Loan Purpose"
                  error={errors.loan_purpose}
                  required
                >
                  <Select
                    value={form.loan_purpose || undefined}
                    onValueChange={(v) => set("loan_purpose", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOAN_PURPOSES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Loan Term">
                  <Input
                    value={form.loan_term}
                    onChange={(e) => set("loan_term", e.target.value)}
                    placeholder="e.g. 30 years"
                  />
                </Field>
                <Field label="Amortization">
                  <Input
                    value={form.amortization}
                    onChange={(e) => set("amortization", e.target.value)}
                    placeholder="e.g. 30 years"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Interest Rate (%)">
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      value={form.interest_rate}
                      onChange={(e) => set("interest_rate", e.target.value)}
                      placeholder="7.50"
                      className="pr-8"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      %
                    </span>
                  </div>
                </Field>
                <Field label="LTV (%)">
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      value={form.ltv}
                      onChange={(e) => set("ltv", e.target.value)}
                      placeholder="75.00"
                      className="pr-8"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      %
                    </span>
                  </div>
                </Field>
              </div>
            </div>
          )}

          {/* Step 3: Property */}
          {step === 3 && (
            <div className="space-y-4">
              <Field label="Street Address" error={errors.property_street} required>
                <Input
                  value={form.property_street}
                  onChange={(e) => set("property_street", e.target.value)}
                  placeholder="123 Main St"
                />
              </Field>
              <div className="grid grid-cols-6 gap-4">
                <div className="col-span-3">
                  <Field label="City" error={errors.property_city} required>
                    <Input
                      value={form.property_city}
                      onChange={(e) => set("property_city", e.target.value)}
                      placeholder="New York"
                    />
                  </Field>
                </div>
                <div className="col-span-1">
                  <Field label="State" error={errors.property_state} required>
                    <Select
                      value={form.property_state || undefined}
                      onValueChange={(v) => set("property_state", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <div className="col-span-2">
                  <Field label="ZIP" error={errors.property_zip} required>
                    <Input
                      value={form.property_zip}
                      onChange={(e) => set("property_zip", e.target.value)}
                      placeholder="10001"
                      maxLength={10}
                    />
                  </Field>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Field label="Property Type" error={errors.property_type} required>
                  <Select
                    value={form.property_type || undefined}
                    onValueChange={(v) => set("property_type", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Purchase Price">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      $
                    </span>
                    <Input
                      type="number"
                      value={form.purchase_price}
                      onChange={(e) => set("purchase_price", e.target.value)}
                      placeholder="0"
                      className="pl-7"
                    />
                  </div>
                </Field>
                <Field label="Appraised Value">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      $
                    </span>
                    <Input
                      type="number"
                      value={form.appraised_value}
                      onChange={(e) => set("appraised_value", e.target.value)}
                      placeholder="0"
                      className="pl-7"
                    />
                  </div>
                </Field>
              </div>
            </div>
          )}

          {/* Step 4: 3rd Party Contacts */}
          {step === 4 && (
            <div className="space-y-4">
              {form.third_party_contacts.map((c, i) => (
                <div
                  key={i}
                  className="rounded-lg border bg-muted/20 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Contact {i + 1}
                    </span>
                    {form.third_party_contacts.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => removeContact(i)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Role">
                      <Select
                        value={c.role || undefined}
                        onValueChange={(v) => updateContact(i, "role", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {THIRD_PARTY_ROLES.map((r) => (
                            <SelectItem key={r} value={r}>
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Name">
                      <Input
                        value={c.name}
                        onChange={(e) => updateContact(i, "name", e.target.value)}
                        placeholder="Full name"
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Email">
                      <Input
                        type="email"
                        value={c.email}
                        onChange={(e) => updateContact(i, "email", e.target.value)}
                        placeholder="email@example.com"
                      />
                    </Field>
                    <Field label="Phone">
                      <Input
                        type="tel"
                        value={c.phone}
                        onChange={(e) => updateContact(i, "phone", e.target.value)}
                        placeholder="(555) 123-4567"
                      />
                    </Field>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addContact}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            </div>
          )}

          {/* Step 5: Review & Sign */}
          {step === 5 && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="rounded-lg border divide-y">
                <SummarySection title="Borrower">
                  <SummaryRow label="Vesting" value={form.vesting_type === "entity" ? "Entity" : "Individual"} />
                  <SummaryRow label="Name" value={`${form.first_name} ${form.last_name}`} />
                  <SummaryRow label="Email" value={form.borrower_email} />
                  {form.borrower_phone && <SummaryRow label="Phone" value={form.borrower_phone} />}
                </SummarySection>
                <SummarySection title="Guarantors">
                  {form.guarantors.map((g, i) => (
                    <SummaryRow
                      key={i}
                      label={g.name || `Guarantor ${i + 1}`}
                      value={g.email}
                    />
                  ))}
                </SummarySection>
                {form.vesting_type === "entity" && (
                  <SummarySection title="Entity">
                    <SummaryRow label="Entity Name" value={form.entity_name} />
                    <SummaryRow label="Entity Type" value={form.entity_type} />
                    <SummaryRow label="EIN" value={form.ein} />
                    <SummaryRow label="State of Formation" value={form.state_of_formation} />
                  </SummarySection>
                )}
                <SummarySection title="Loan Structure">
                  <SummaryRow
                    label="Amount"
                    value={
                      form.loan_amount
                        ? `$${Number(form.loan_amount).toLocaleString()}`
                        : ""
                    }
                  />
                  <SummaryRow label="Purpose" value={form.loan_purpose} />
                  {form.loan_term && <SummaryRow label="Term" value={form.loan_term} />}
                  {form.amortization && <SummaryRow label="Amortization" value={form.amortization} />}
                  {form.interest_rate && <SummaryRow label="Rate" value={`${form.interest_rate}%`} />}
                  {form.ltv && <SummaryRow label="LTV" value={`${form.ltv}%`} />}
                </SummarySection>
                <SummarySection title="Subject Property">
                  <SummaryRow label="Address" value={fullAddress} />
                  <SummaryRow label="Type" value={form.property_type} />
                  {form.purchase_price && (
                    <SummaryRow label="Purchase Price" value={`$${Number(form.purchase_price).toLocaleString()}`} />
                  )}
                  {form.appraised_value && (
                    <SummaryRow label="Appraised Value" value={`$${Number(form.appraised_value).toLocaleString()}`} />
                  )}
                </SummarySection>
                {form.third_party_contacts.some((c) => c.name.trim()) && (
                  <SummarySection title="3rd Party Contacts">
                    {form.third_party_contacts
                      .filter((c) => c.name.trim())
                      .map((c, i) => (
                        <SummaryRow
                          key={i}
                          label={c.role || "Contact"}
                          value={`${c.name}${c.email ? ` (${c.email})` : ""}`}
                        />
                      ))}
                  </SummarySection>
                )}
              </div>

              {/* Documenso Signature */}
              <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold">E-Signature Request</h3>
                  <p className="text-xs text-muted-foreground">
                    Send the loan application for e-signature via Documenso
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="Documenso Template ID"
                    error={errors.template_id}
                    required
                  >
                    <Input
                      value={form.template_id}
                      onChange={(e) => set("template_id", e.target.value)}
                      placeholder="e.g. clx1234..."
                    />
                  </Field>
                  <Field
                    label="Signer Email"
                    error={errors.signer_email}
                    required
                  >
                    <Select
                      value={form.signer_email || undefined}
                      onValueChange={(v) => set("signer_email", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select signer" />
                      </SelectTrigger>
                      <SelectContent>
                        {allEmails.map((item, i) => (
                          <SelectItem key={i} value={item.email}>
                            {item.label} ({item.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t bg-background px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Button
            variant="outline"
            onClick={back}
            disabled={step === 0 || submitting}
          >
            Back
          </Button>
          <div className="flex items-center gap-3">
            {step < 5 && (
              <Button onClick={next}>
                {entityStepSkipped ? "Skip" : "Next"}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
            {step === 5 && !createdLoanId && (
              <Button onClick={handleCreateApplication} disabled={submitting}>
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Application
              </Button>
            )}
            {step === 5 && createdLoanId && (
              <>
                <Button
                  variant="outline"
                  onClick={() => router.push("/applications")}
                >
                  Skip Signature
                </Button>
                <Button onClick={handleSendSignature} disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Send for Signature
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function SummarySection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="px-4 py-3">
      <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
        {title}
      </h4>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
