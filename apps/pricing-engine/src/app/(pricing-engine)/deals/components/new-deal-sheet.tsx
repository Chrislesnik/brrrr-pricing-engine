"use client"

import { useEffect, useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "@/hooks/use-toast"
import { Button } from "@repo/ui/shadcn/button"
import { Checkbox } from "@repo/ui/shadcn/checkbox"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/shadcn/form"
import { Input } from "@repo/ui/shadcn/input"
import { Textarea } from "@repo/ui/shadcn/textarea"
import SelectDropdown from "@/components/select-dropdown"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/shadcn/accordion"
import {
  BadgeDollarSign,
  Briefcase,
  Calendar,
  FileText,
  Home,
  ShieldCheck,
  Users,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/shadcn/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/shadcn/select"
import { DatePickerField } from "@/components/date-picker-field"

const optionalNumber = (min = 0, max?: number) =>
  z.preprocess(
    (val) => (val === "" || val == null ? undefined : Number(val)),
    max == null
      ? z.number().min(min).optional()
      : z.number().min(min).max(max).optional()
  )

const optionalText = z.string().optional().or(z.literal(""))

const CUSTOM_OPTION = "__custom__"

const enumOptions = {
  vesting_type: ["entity", "individual"],
  lead_source_type: ["broker", "referral", "direct", "online", "partner"],
  recourse_type: ["full_recourse", "limited_recourse", "non_recourse"],
  transaction_type: [
    "purchase",
    "delayed_purchase",
    "refinance_rate_term",
    "refinance_cash_out",
  ],
  loan_structure_dscr: [
    "30_yr_fixed",
    "5/1_arm",
    "5/1_arm_io",
    "7/1_arm",
    "7/1_arm_io",
    "10/1_arm",
    "10/1_arm_io",
    "5/6_arm",
    "5/6_arm_io",
    "10/6_arm",
    "10/6_arm_io",
  ],
  loan_term: [
    "0",
    "12",
    "24",
    "36",
    "48",
    "60",
    "72",
    "84",
    "96",
    "108",
    "120",
    "300",
    "360",
  ],
  deal_type: ["dscr", "rtl"],
  project_type: ["rental", "fix_and_flip", "ground_up", "mixed_use"],
  deal_stage_1: ["lead", "scenario", "deal"],
  deal_stage_2: [
    "loan_setup",
    "processing_1",
    "appraisal_review",
    "processing_2",
    "qc_1",
    "underwriting",
    "conditionally_approved",
    "qc_2",
    "clear_to_close",
    "closed_and_funded",
  ],
  deal_disposition_1: ["active", "dead", "on_hold"],
  loan_type_rtl: ["bridge", "bridge_plus_rehab"],
  recently_renovated: ["yes", "no"],
  ppp_term: [
    "0",
    "12",
    "24",
    "36",
    "48",
    "60",
    "72",
    "84",
    "96",
    "108",
    "120",
    "300",
    "360",
  ],
  ppp_structure_1: ["declining", "fixed", "minimum_interest"],
  property_type: [
    "single_family",
    "condominium",
    "condominium_warrantable",
    "condominium_non-warrantable",
    "townhome/pud",
    "multifamily 2-4",
    "multifamily 5-10",
    "multifamily 11+",
    "mixed_use 2-4",
    "mixed_use 5-10",
    "mixed_use 11+",
    "other",
  ],
  warrantability: ["warrantable", "non_warrantable"],
}

function EnumSelectField({
  control,
  name,
  label,
  options,
  placeholder,
  description,
  customPlaceholder,
}: {
  control: any
  name: keyof DealFormValues
  label: string
  options: string[]
  placeholder?: string
  description?: string
  customPlaceholder?: string
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const current = typeof field.value === "string" ? field.value : ""
        const isKnown = options.includes(current)
        const selectValue = isKnown
          ? current
          : current
            ? CUSTOM_OPTION
            : undefined

        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <Select
              value={selectValue}
              onValueChange={(value) => {
                if (value === CUSTOM_OPTION) {
                  field.onChange("")
                  return
                }
                field.onChange(value)
              }}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={placeholder ?? "Select"} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {options.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt.replace(/_/g, " ")}
                  </SelectItem>
                ))}
                <SelectItem value={CUSTOM_OPTION}>Custom</SelectItem>
              </SelectContent>
            </Select>
            {selectValue === CUSTOM_OPTION ? (
              <div className="mt-2">
                <FormControl>
                  <Input
                    placeholder={customPlaceholder ?? "Enter value"}
                    value={current}
                    onChange={(event) => field.onChange(event.target.value)}
                  />
                </FormControl>
              </div>
            ) : null}
            {description ? <FormDescription>{description}</FormDescription> : null}
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}

const dealFormSchema = z.object({
  id: optionalNumber(0),
  deal_name: optionalText,
  vesting_type: optionalText,
  guarantor_count: optionalNumber(0),
  lead_source_type: optionalText,
  property_id: optionalNumber(0),
  property_type: optionalText,
  warrantability: optionalText,
  company_id: optionalText,
  created_at: optionalText,
  updated_at: optionalText,
  note_date: optionalText,
  mid_fico: optionalNumber(0),
  pricing_is_locked: z.boolean().optional(),
  lead_source_name: optionalText,
  loan_number: z.string().min(1, "Loan number is required"),
  declaration_1_lawsuits: z.boolean().optional(),
  declaration_2_bankruptcy: z.boolean().optional(),
  declaration_3_felony: z.boolean().optional(),
  declaration_5_license: z.boolean().optional(),
  declaration_1_lawsuits_explanation: optionalText,
  declaration_2_bankruptcy_explanation: optionalText,
  declaration_3_felony_explanation: optionalText,
  recourse_type: optionalText,
  transaction_type: optionalText,
  payoff_mtg1_amount: optionalNumber(0),
  loan_structure_dscr: optionalText,
  guarantor_fico_score: optionalNumber(0),
  title_company_id: optionalText,
  insurance_carrier_company_id: optionalText,
  cash_out_purpose: optionalText,
  target_closing_date: optionalText,
  date_of_purchase: optionalText,
  loan_amount_total: optionalNumber(0),
  construction_holdback: optionalNumber(0),
  loan_amount_initial: optionalNumber(0),
  loan_term: optionalText,
  title_file_number: optionalText,
  deal_type: optionalText,
  project_type: optionalText,
  deal_stage_1: optionalText,
  deal_stage_2: optionalText,
  deal_disposition_1: optionalText,
  loan_type_rtl: optionalText,
  renovation_cost: optionalNumber(0),
  renovation_completed: optionalText,
  recently_renovated: optionalText,
  purchase_price: optionalNumber(0),
  funding_date: optionalText,
  loan_sale_date: optionalText,
  pricing_file_path: optionalText,
  pricing_file_url: optionalText,
  loan_buyer_company_id: optionalText,
  note_rate: optionalNumber(0),
  cost_of_capital: optionalNumber(0),
  broker_company_id: optionalText,
  escrow_company_id: optionalText,
  ltv_asis: optionalNumber(0),
  ltv_after_repair: optionalNumber(0),
  io_period: optionalNumber(0),
  ppp_term: optionalText,
  ppp_structure_1: optionalText,
})

type DealFormValues = z.infer<typeof dealFormSchema>

const defaultValues: DealFormValues = {
  id: undefined,
  deal_name: "",
  vesting_type: "",
  guarantor_count: undefined,
  lead_source_type: "",
  property_id: undefined,
  property_type: "",
  warrantability: "",
  company_id: "",
  created_at: "",
  updated_at: "",
  note_date: "",
  mid_fico: undefined,
  pricing_is_locked: false,
  lead_source_name: "",
  loan_number: "",
  declaration_1_lawsuits: false,
  declaration_2_bankruptcy: false,
  declaration_3_felony: false,
  declaration_5_license: false,
  declaration_1_lawsuits_explanation: "",
  declaration_2_bankruptcy_explanation: "",
  declaration_3_felony_explanation: "",
  recourse_type: "",
  transaction_type: "",
  payoff_mtg1_amount: undefined,
  loan_structure_dscr: "",
  guarantor_fico_score: undefined,
  title_company_id: "",
  insurance_carrier_company_id: "",
  cash_out_purpose: "",
  target_closing_date: "",
  date_of_purchase: "",
  loan_amount_total: undefined,
  construction_holdback: undefined,
  loan_amount_initial: undefined,
  loan_term: "",
  title_file_number: "",
  deal_type: "",
  project_type: "",
  deal_stage_1: "",
  deal_stage_2: "",
  deal_disposition_1: "",
  loan_type_rtl: "",
  renovation_cost: undefined,
  renovation_completed: "",
  recently_renovated: "",
  purchase_price: undefined,
  funding_date: "",
  loan_sale_date: "",
  pricing_file_path: "",
  pricing_file_url: "",
  loan_buyer_company_id: "",
  note_rate: undefined,
  cost_of_capital: undefined,
  broker_company_id: "",
  escrow_company_id: "",
  ltv_asis: undefined,
  ltv_after_repair: undefined,
  io_period: undefined,
  ppp_term: "",
  ppp_structure_1: "",
}

const cleanText = (value?: string) =>
  value && value.trim().length > 0 ? value.trim() : undefined

export function NewDealSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const formId = "new-deal-form"

  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema),
    defaultValues,
  })

  const [entityOptions, setEntityOptions] = useState<
    { label: string; value: string }[]
  >([])
  const [entitiesLoading, setEntitiesLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    form.reset(defaultValues)
  }, [form, open])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    const fetchEntities = async () => {
      setEntitiesLoading(true)
      try {
        const res = await fetch("/api/applicants/entities/list")
        const json = await res.json().catch(() => ({}))
        if (cancelled) return
        const items = Array.isArray(json?.items) ? json.items : []
        const options = items
          .map((item: any) => {
            const entityId = String(item?.id ?? "")
            if (!entityId) return null
            const displayId = item?.display_id
            const name = item?.entity_name ?? displayId ?? entityId
            const label =
              item?.entity_name && displayId
                ? `${item.entity_name} (${displayId})`
                : String(name)
            return { label, value: entityId }
          })
          .filter((option: { label: string; value: string } | null) => !!option)
          .sort((a: { label: string }, b: { label: string }) =>
            a.label.localeCompare(b.label)
          ) as { label: string; value: string }[]
        setEntityOptions(options)
      } catch (error) {
        if (!cancelled) {
          setEntityOptions([])
        }
      } finally {
        if (!cancelled) {
          setEntitiesLoading(false)
        }
      }
    }
    fetchEntities()
    return () => {
      cancelled = true
    }
  }, [open])

  const onSubmit = async (values: DealFormValues) => {
    try {
      const payload = {
        id: values.id,
        deal_name: cleanText(values.deal_name),
        vesting_type: cleanText(values.vesting_type),
        guarantor_count: values.guarantor_count,
        lead_source_type: cleanText(values.lead_source_type),
        property_id: values.property_id,
        company_id: cleanText(values.company_id),
        created_at: cleanText(values.created_at),
        updated_at: cleanText(values.updated_at),
        note_date: cleanText(values.note_date),
        mid_fico: values.mid_fico,
        pricing_is_locked: values.pricing_is_locked ?? false,
        lead_source_name: cleanText(values.lead_source_name),
        loan_number: values.loan_number.trim(),
        declaration_1_lawsuits: values.declaration_1_lawsuits ?? false,
        declaration_2_bankruptcy: values.declaration_2_bankruptcy ?? false,
        declaration_3_felony: values.declaration_3_felony ?? false,
        declaration_5_license: values.declaration_5_license ?? false,
        declaration_1_lawsuits_explanation: cleanText(
          values.declaration_1_lawsuits_explanation
        ),
        declaration_2_bankruptcy_explanation: cleanText(
          values.declaration_2_bankruptcy_explanation
        ),
        declaration_3_felony_explanation: cleanText(
          values.declaration_3_felony_explanation
        ),
        recourse_type: cleanText(values.recourse_type),
        transaction_type: cleanText(values.transaction_type),
        payoff_mtg1_amount: values.payoff_mtg1_amount,
        loan_structure_dscr: cleanText(values.loan_structure_dscr),
        guarantor_fico_score: values.guarantor_fico_score,
        title_company_id: cleanText(values.title_company_id),
        insurance_carrier_company_id: cleanText(
          values.insurance_carrier_company_id
        ),
        cash_out_purpose: cleanText(values.cash_out_purpose),
        target_closing_date: cleanText(values.target_closing_date),
        date_of_purchase: cleanText(values.date_of_purchase),
        loan_amount_total: values.loan_amount_total,
        construction_holdback: values.construction_holdback,
        loan_amount_initial: values.loan_amount_initial,
        loan_term: cleanText(values.loan_term),
        title_file_number: cleanText(values.title_file_number),
        deal_type: cleanText(values.deal_type),
        project_type: cleanText(values.project_type),
        deal_stage_1: cleanText(values.deal_stage_1),
        deal_stage_2: cleanText(values.deal_stage_2),
        deal_disposition_1: cleanText(values.deal_disposition_1),
        loan_type_rtl: cleanText(values.loan_type_rtl),
        renovation_cost: values.renovation_cost,
        renovation_completed: cleanText(values.renovation_completed),
        recently_renovated: cleanText(values.recently_renovated),
        purchase_price: values.purchase_price,
        funding_date: cleanText(values.funding_date),
        loan_sale_date: cleanText(values.loan_sale_date),
        pricing_file_path: cleanText(values.pricing_file_path),
        pricing_file_url: cleanText(values.pricing_file_url),
        loan_buyer_company_id: cleanText(values.loan_buyer_company_id),
        note_rate: values.note_rate,
        cost_of_capital: values.cost_of_capital,
        broker_company_id: cleanText(values.broker_company_id),
        escrow_company_id: cleanText(values.escrow_company_id),
        ltv_asis: values.ltv_asis,
        ltv_after_repair: values.ltv_after_repair,
        io_period: values.io_period,
        ppp_term: cleanText(values.ppp_term),
        ppp_structure_1: cleanText(values.ppp_structure_1),
      }
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json?.error || "Failed to create deal")
      }
      toast({
        title: "Deal created",
        description: "Your deal has been added to the pipeline.",
      })
      onOpenChange(false)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("app:deals:changed"))
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create deal"
      toast({
        title: "Unable to create deal",
        description: message,
      })
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>New Deal</SheetTitle>
          <SheetDescription>
            Capture the core deal details and keep them organized.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
          <Form {...form}>
            <form
              id={formId}
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 rounded-xl border bg-background/70 p-4 shadow-sm"
            >
              <Accordion
                type="multiple"
                defaultValue={["overview", "borrowers", "loan", "property"]}
                className="w-full space-y-4"
              >
                <AccordionItem
                  value="overview"
                  className="rounded-lg border bg-muted/30 shadow-sm"
                >
                  <AccordionTrigger className="px-4 py-3 text-base font-semibold hover:no-underline">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>Deal Overview</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-0">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Deal ID</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Auto-generated"
                                value={field.value ?? ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormDescription>
                              Leave blank to auto-generate.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="deal_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Deal Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Deal name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="loan_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Loan Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Loan number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="title_file_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title File Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Title file number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <EnumSelectField
                        control={form.control}
                        name="deal_stage_1"
                        label="Deal Stage 1"
                        options={enumOptions.deal_stage_1}
                        placeholder="Select stage"
                        customPlaceholder="Custom stage"
                      />
                      <EnumSelectField
                        control={form.control}
                        name="deal_stage_2"
                        label="Deal Stage 2"
                        options={enumOptions.deal_stage_2}
                        placeholder="Select stage"
                        customPlaceholder="Custom stage"
                      />
                      <EnumSelectField
                        control={form.control}
                        name="deal_disposition_1"
                        label="Deal Disposition"
                        options={enumOptions.deal_disposition_1}
                        placeholder="Select disposition"
                        customPlaceholder="Custom disposition"
                      />
                      <EnumSelectField
                        control={form.control}
                        name="project_type"
                        label="Project Type"
                        options={enumOptions.project_type}
                        placeholder="Select project type"
                        customPlaceholder="Custom project type"
                      />
                      <EnumSelectField
                        control={form.control}
                        name="deal_type"
                        label="Deal Type"
                        options={enumOptions.deal_type}
                        placeholder="Select deal type"
                        customPlaceholder="Custom deal type"
                      />
                      <EnumSelectField
                        control={form.control}
                        name="transaction_type"
                        label="Transaction Type"
                        options={enumOptions.transaction_type}
                        placeholder="Select transaction type"
                        customPlaceholder="Custom transaction type"
                      />
                      <FormField
                        control={form.control}
                        name="lead_source_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lead Source Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Lead source name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <EnumSelectField
                        control={form.control}
                        name="lead_source_type"
                        label="Lead Source Type"
                        options={enumOptions.lead_source_type}
                        placeholder="Select lead source"
                        customPlaceholder="Custom lead source"
                      />
                      <EnumSelectField
                        control={form.control}
                        name="loan_type_rtl"
                        label="Loan Type RTL"
                        options={enumOptions.loan_type_rtl}
                        placeholder="Select RTL type"
                        customPlaceholder="Custom RTL type"
                      />
                      <EnumSelectField
                        control={form.control}
                        name="loan_structure_dscr"
                        label="Loan Structure DSCR"
                        options={enumOptions.loan_structure_dscr}
                        placeholder="Select structure"
                        customPlaceholder="Custom structure"
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="borrowers"
                  className="rounded-lg border bg-muted/30 shadow-sm"
                >
                  <AccordionTrigger className="px-4 py-3 text-base font-semibold hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>Borrower &amp; Guarantors</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-0">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <EnumSelectField
                        control={form.control}
                        name="vesting_type"
                        label="Vesting Type"
                        options={enumOptions.vesting_type}
                        placeholder="Select vesting type"
                        customPlaceholder="Custom vesting type"
                      />
                      <FormField
                        control={form.control}
                        name="guarantor_count"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Guarantor Count</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="1"
                                value={field.value ?? ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="guarantor_fico_score"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Guarantor FICO</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                value={field.value ?? ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="mid_fico"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mid FICO</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                value={field.value ?? ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="property"
                  className="rounded-lg border bg-muted/30 shadow-sm"
                >
                  <AccordionTrigger className="px-4 py-3 text-base font-semibold hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <span>Property &amp; Renovation</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-0">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="property_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Property ID</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Property ID"
                                value={field.value ?? ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <EnumSelectField
                        control={form.control}
                        name="property_type"
                        label="Property Type"
                        options={enumOptions.property_type}
                        placeholder="Select property type"
                        customPlaceholder="Custom property type"
                      />
                      <EnumSelectField
                        control={form.control}
                        name="warrantability"
                        label="Warrantability"
                        options={enumOptions.warrantability}
                        placeholder="Select warrantability"
                        customPlaceholder="Custom warrantability"
                      />
                      <FormField
                        control={form.control}
                        name="purchase_price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Purchase Price</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0.00"
                                value={field.value ?? ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="date_of_purchase"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of Purchase</FormLabel>
                            <FormControl>
                              <DatePickerField
                                value={field.value || ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <EnumSelectField
                        control={form.control}
                        name="recently_renovated"
                        label="Recently Renovated"
                        options={enumOptions.recently_renovated}
                        placeholder="Select yes/no"
                        customPlaceholder="Custom value"
                      />
                      <FormField
                        control={form.control}
                        name="renovation_cost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Renovation Cost</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0.00"
                                value={field.value ?? ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="renovation_completed"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Renovation Completed</FormLabel>
                            <FormControl>
                              <DatePickerField
                                value={field.value || ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="loan"
                  className="rounded-lg border bg-muted/30 shadow-sm"
                >
                  <AccordionTrigger className="px-4 py-3 text-base font-semibold hover:no-underline">
                    <div className="flex items-center gap-2">
                      <BadgeDollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>Loan Amounts &amp; Terms</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-0">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="loan_amount_total"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Loan Amount Total</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0.00"
                                value={field.value ?? ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="loan_amount_initial"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Loan Amount Initial</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0.00"
                                value={field.value ?? ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="construction_holdback"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Construction Holdback</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0.00"
                                value={field.value ?? ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="payoff_mtg1_amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payoff MTG1 Amount</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0.00"
                                value={field.value ?? ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="cost_of_capital"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cost of Capital</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0.00"
                                value={field.value ?? ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="ltv_asis"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>LTV As-Is</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0.00"
                                value={field.value ?? ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="ltv_after_repair"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>LTV After Repair</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0.00"
                                value={field.value ?? ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <EnumSelectField
                        control={form.control}
                        name="loan_term"
                        label="Loan Term"
                        options={enumOptions.loan_term}
                        placeholder="Select loan term"
                        customPlaceholder="Custom loan term"
                      />
                      <EnumSelectField
                        control={form.control}
                        name="recourse_type"
                        label="Recourse Type"
                        options={enumOptions.recourse_type}
                        placeholder="Select recourse type"
                        customPlaceholder="Custom recourse type"
                      />
                      <FormField
                        control={form.control}
                        name="io_period"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>IO Period</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                value={field.value ?? ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <EnumSelectField
                        control={form.control}
                        name="ppp_term"
                        label="PPP Term"
                        options={enumOptions.ppp_term}
                        placeholder="Select PPP term"
                        customPlaceholder="Custom PPP term"
                      />
                      <EnumSelectField
                        control={form.control}
                        name="ppp_structure_1"
                        label="PPP Structure"
                        options={enumOptions.ppp_structure_1}
                        placeholder="Select PPP structure"
                        customPlaceholder="Custom PPP structure"
                      />
                      <FormField
                        control={form.control}
                        name="note_rate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Note Rate</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0.00"
                                value={field.value ?? ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="pricing_is_locked"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-md border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Pricing Locked</FormLabel>
                              <FormDescription>
                                Lock pricing changes on this deal.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Checkbox
                                checked={field.value ?? false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="cash_out_purpose"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-2">
                            <FormLabel>Cash Out Purpose</FormLabel>
                            <FormControl>
                              <Textarea rows={3} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="assignments"
                  className="rounded-lg border bg-muted/30 shadow-sm"
                >
                  <AccordionTrigger className="px-4 py-3 text-base font-semibold hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span>Assignments</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-0">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="company_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company</FormLabel>
                            <FormControl>
                              <SelectDropdown
                                defaultValue={field.value ?? ""}
                                onValueChange={field.onChange}
                                items={entityOptions}
                                isPending={entitiesLoading}
                                placeholder="Select company"
                                isControlled
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="broker_company_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Broker Company</FormLabel>
                            <FormControl>
                              <SelectDropdown
                                defaultValue={field.value ?? ""}
                                onValueChange={field.onChange}
                                items={entityOptions}
                                isPending={entitiesLoading}
                                placeholder="Select broker company"
                                isControlled
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="escrow_company_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Escrow Company</FormLabel>
                            <FormControl>
                              <SelectDropdown
                                defaultValue={field.value ?? ""}
                                onValueChange={field.onChange}
                                items={entityOptions}
                                isPending={entitiesLoading}
                                placeholder="Select escrow company"
                                isControlled
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="title_company_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title Company</FormLabel>
                            <FormControl>
                              <SelectDropdown
                                defaultValue={field.value ?? ""}
                                onValueChange={field.onChange}
                                items={entityOptions}
                                isPending={entitiesLoading}
                                placeholder="Select title company"
                                isControlled
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="insurance_carrier_company_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Insurance Carrier</FormLabel>
                            <FormControl>
                              <SelectDropdown
                                defaultValue={field.value ?? ""}
                                onValueChange={field.onChange}
                                items={entityOptions}
                                isPending={entitiesLoading}
                                placeholder="Select insurance carrier"
                                isControlled
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="loan_buyer_company_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Loan Buyer</FormLabel>
                            <FormControl>
                              <SelectDropdown
                                defaultValue={field.value ?? ""}
                                onValueChange={field.onChange}
                                items={entityOptions}
                                isPending={entitiesLoading}
                                placeholder="Select loan buyer"
                                isControlled
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="timeline"
                  className="rounded-lg border bg-muted/30 shadow-sm"
                >
                  <AccordionTrigger className="px-4 py-3 text-base font-semibold hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Timeline &amp; Documents</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-0">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="note_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Note Date</FormLabel>
                            <FormControl>
                              <DatePickerField
                                value={field.value || ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="target_closing_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Target Closing Date</FormLabel>
                            <FormControl>
                              <DatePickerField
                                value={field.value || ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="funding_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Funding Date</FormLabel>
                            <FormControl>
                              <DatePickerField
                                value={field.value || ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="loan_sale_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Loan Sale Date</FormLabel>
                            <FormControl>
                              <DatePickerField
                                value={field.value || ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="created_at"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Created At</FormLabel>
                            <FormControl>
                              <Input type="datetime-local" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="updated_at"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Updated At</FormLabel>
                            <FormControl>
                              <Input type="datetime-local" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="pricing_file_path"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pricing File Path</FormLabel>
                            <FormControl>
                              <Input placeholder="Storage path" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="pricing_file_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pricing File URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="declarations"
                  className="rounded-lg border bg-muted/30 shadow-sm"
                >
                  <AccordionTrigger className="px-4 py-3 text-base font-semibold hover:no-underline">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                      <span>Declarations</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-0">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="declaration_1_lawsuits"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-md border p-3">
                            <FormLabel>Lawsuits</FormLabel>
                            <FormControl>
                              <Checkbox
                                checked={field.value ?? false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="declaration_1_lawsuits_explanation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lawsuits Explanation</FormLabel>
                            <FormControl>
                              <Textarea rows={3} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="declaration_2_bankruptcy"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-md border p-3">
                            <FormLabel>Bankruptcy</FormLabel>
                            <FormControl>
                              <Checkbox
                                checked={field.value ?? false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="declaration_2_bankruptcy_explanation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bankruptcy Explanation</FormLabel>
                            <FormControl>
                              <Textarea rows={3} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="declaration_3_felony"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-md border p-3">
                            <FormLabel>Felony</FormLabel>
                            <FormControl>
                              <Checkbox
                                checked={field.value ?? false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="declaration_3_felony_explanation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Felony Explanation</FormLabel>
                            <FormControl>
                              <Textarea rows={3} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="declaration_5_license"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-md border p-3">
                            <FormLabel>License</FormLabel>
                            <FormControl>
                              <Checkbox
                                checked={field.value ?? false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </form>
          </Form>
        </div>
        <SheetFooter className="mt-4 gap-2">
          <Button
            variant="outline"
            type="button"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" form={formId}>
            Create Deal
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
