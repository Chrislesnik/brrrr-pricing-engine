"use client";

import { useState, useEffect } from "react";
import { Badge } from "@repo/ui/shadcn/badge";
import { Button } from "@repo/ui/shadcn/button";
import { Input } from "@repo/ui/shadcn/input";
import { Textarea } from "@repo/ui/shadcn/textarea";
import { Checkbox } from "@repo/ui/shadcn/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/shadcn/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/shadcn/accordion";
import {
  BadgeDollarSign,
  Briefcase,
  Calendar,
  FileText,
  Home,
  Pencil,
  ShieldCheck,
  Users,
  Save,
  X,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { DatePickerField } from "@/components/date-picker-field";

interface DealData {
  id: string;
  deal_name: string | null;
  deal_stage_2: string | null;
  deal_stage_1?: string | null;
  deal_disposition_1?: string | null;
  loan_amount_total: number | null;
  loan_amount_initial?: number | null;
  construction_holdback?: number | null;
  payoff_mtg1_amount?: number | null;
  cost_of_capital?: number | null;
  ltv_asis?: number | null;
  ltv_after_repair?: number | null;
  note_rate?: number | null;
  io_period?: number | null;
  funding_date: string | null;
  target_closing_date?: string | null;
  note_date?: string | null;
  loan_sale_date?: string | null;
  date_of_purchase?: string | null;
  renovation_completed?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  project_type: string | null;
  deal_type?: string | null;
  transaction_type?: string | null;
  loan_structure_dscr?: string | null;
  loan_type_rtl?: string | null;
  loan_term?: string | null;
  recourse_type?: string | null;
  ppp_term?: string | null;
  ppp_structure_1?: string | null;
  recently_renovated?: string | null;
  property_address: string | null;
  property_id?: number | null;
  property_type?: string | null;
  warrantability?: string | null;
  purchase_price?: number | null;
  renovation_cost?: number | null;
  guarantor_name: string | null;
  loan_number: string | null;
  title_file_number?: string | null;
  vesting_type?: string | null;
  guarantor_count?: number | null;
  guarantor_fico_score?: number | null;
  mid_fico?: number | null;
  lead_source_name?: string | null;
  lead_source_type?: string | null;
  company_id?: string | null;
  broker_company_id?: string | null;
  escrow_company_id?: string | null;
  title_company_id?: string | null;
  insurance_carrier_company_id?: string | null;
  loan_buyer_company_id?: string | null;
  pricing_is_locked?: boolean | null;
  pricing_file_path?: string | null;
  pricing_file_url?: string | null;
  cash_out_purpose?: string | null;
  declaration_1_lawsuits?: boolean | null;
  declaration_1_lawsuits_explanation?: string | null;
  declaration_2_bankruptcy?: boolean | null;
  declaration_2_bankruptcy_explanation?: string | null;
  declaration_3_felony?: boolean | null;
  declaration_3_felony_explanation?: string | null;
  declaration_5_license?: boolean | null;
}

interface DealDetailsTabProps {
  deal: DealData;
}

const enumOptions = {
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
  project_type: ["rental", "fix_and_flip", "ground_up", "mixed_use"],
  deal_type: ["dscr", "rtl"],
  transaction_type: [
    "purchase",
    "delayed_purchase",
    "refinance_rate_term",
    "refinance_cash_out",
  ],
  lead_source_type: ["broker", "referral", "direct", "online", "partner"],
  loan_type_rtl: ["bridge", "bridge_plus_rehab"],
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
  vesting_type: ["entity", "individual"],
  property_type: [
    "single_family",
    "condominium",
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
  recently_renovated: ["yes", "no"],
  recourse_type: ["full_recourse", "limited_recourse", "non_recourse"],
  loan_term: ["0", "12", "24", "36", "48", "60", "72", "84", "96", "108", "120", "300", "360"],
  ppp_term: ["0", "12", "24", "36", "48", "60", "72", "84", "96", "108", "120", "300", "360"],
  ppp_structure_1: ["declining", "fixed", "minimum_interest"],
};

export function DealDetailsTab({ deal }: DealDetailsTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedDeal, setEditedDeal] = useState<DealData>(deal);

  // Update editedDeal when deal prop changes
  useEffect(() => {
    setEditedDeal(deal);
  }, [deal]);

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString();
  };

  const formatDateTime = (date: string | null | undefined) => {
    if (!date) return "—";
    return new Date(date).toLocaleString();
  };

  const formatEnum = (value: string | null | undefined) => {
    if (!value) return "—";
    return value.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatBoolean = (value: boolean | null | undefined) => {
    if (value === null || value === undefined) return "—";
    return value ? "Yes" : "No";
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/deals/${deal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedDeal),
      });

      if (!response.ok) {
        throw new Error("Failed to update deal");
      }

      toast({
        title: "Deal updated",
        description: "Your changes have been saved successfully.",
      });
      
      setIsEditing(false);
      
      // Trigger a refresh of the deals list
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("app:deals:changed"));
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update deal",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedDeal(deal);
    setIsEditing(false);
  };

  const updateField = <K extends keyof DealData>(field: K, value: DealData[K]) => {
    setEditedDeal((prev) => ({ ...prev, [field]: value }));
  };

  const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="grid grid-cols-3 gap-4 py-2 border-b last:border-0">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="col-span-2 text-sm">{value}</div>
    </div>
  );

  const EditableField = ({
    label,
    field,
    type = "text",
    options,
    showBadge,
    isCurrency,
  }: {
    label: string;
    field: keyof DealData;
    type?: "text" | "number" | "date" | "datetime-local" | "select" | "textarea" | "checkbox";
    options?: string[];
    showBadge?: boolean;
    isCurrency?: boolean;
  }) => {
    const value = editedDeal[field];

    if (!isEditing) {
      let displayValue: React.ReactNode = "—";

      if (type === "checkbox") {
        displayValue = formatBoolean(value as boolean);
      } else if (type === "select" && options) {
        const formattedValue = formatEnum(value as string);
        if (showBadge && value) {
          // Special styling for deal_stage_2
          if (field === "deal_stage_2") {
            displayValue = (
              <Badge
                variant={
                  value === "closed_and_funded"
                    ? "default"
                    : value === "clear_to_close"
                      ? "secondary"
                      : "outline"
                }
              >
                {formattedValue}
              </Badge>
            );
          } else {
            displayValue = <Badge variant="outline">{formattedValue}</Badge>;
          }
        } else {
          displayValue = formattedValue;
        }
      } else if (type === "date" || type === "datetime-local") {
        displayValue = type === "datetime-local" ? formatDateTime(value as string) : formatDate(value as string);
      } else if (type === "number") {
        if (isCurrency) {
          displayValue = formatCurrency(value as number);
        } else if (label.includes("LTV")) {
          displayValue = value ? `${value}%` : "—";
        } else if (label.includes("Rate")) {
          displayValue = value ? `${value}%` : "—";
        } else if (label.includes("Term") || label.includes("Period")) {
          displayValue = value ? `${value} months` : "—";
        } else {
          displayValue = value ?? "—";
        }
      } else if (field === "pricing_file_url" && value) {
        displayValue = (
          <a
            href={value as string}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            View File
          </a>
        );
      } else {
        displayValue = value ? String(value) : "—";
      }

      return <DetailRow label={label} value={displayValue} />;
    }

    return (
      <div className="grid grid-cols-3 gap-4 py-2 border-b last:border-0">
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
        <div className="col-span-2">
          {type === "textarea" ? (
            <Textarea
              value={(value as string) || ""}
              onChange={(e) => updateField(field, e.target.value as DealData[typeof field])}
              rows={3}
              className="text-sm"
            />
          ) : type === "checkbox" ? (
            <div className="flex items-center">
              <Checkbox
                checked={(value as boolean) || false}
                onCheckedChange={(checked) => updateField(field, checked as DealData[typeof field])}
              />
            </div>
          ) : type === "select" && options ? (
            <Select
              value={(value as string) && (value as string) !== "" ? (value as string) : undefined}
              onValueChange={(val) => updateField(field, val as DealData[typeof field])}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {options.filter((opt) => opt !== "").map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {formatEnum(opt)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : type === "date" ? (
            <DatePickerField
              value={(value as string) || ""}
              onChange={(val) => updateField(field, val as DealData[typeof field])}
            />
          ) : (
            <Input
              type={type}
              value={value != null ? String(value) : ""}
              onChange={(e) => {
                const val = type === "number" ? (e.target.value ? Number(e.target.value) : null) : e.target.value;
                updateField(field, val as DealData[typeof field]);
              }}
              className="text-sm"
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Deal Information</h2>
          <p className="text-sm text-muted-foreground">
            {isEditing ? "Edit deal details" : "Complete deal details across all categories"}
          </p>
        </div>
        {isEditing ? (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleCancel} disabled={isSaving}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        ) : (
          <Button size="sm" onClick={() => setIsEditing(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Details
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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
            <div className="space-y-1">
              <DetailRow label="Deal ID" value={deal.id} />
              <EditableField label="Deal Name" field="deal_name" />
              <EditableField label="Loan Number" field="loan_number" />
              <EditableField label="Title File Number" field="title_file_number" />
              <EditableField label="Deal Stage 1" field="deal_stage_1" type="select" options={enumOptions.deal_stage_1} showBadge />
              <EditableField label="Deal Stage 2" field="deal_stage_2" type="select" options={enumOptions.deal_stage_2} showBadge />
              <EditableField label="Deal Disposition" field="deal_disposition_1" type="select" options={enumOptions.deal_disposition_1} showBadge />
              <EditableField label="Project Type" field="project_type" type="select" options={enumOptions.project_type} showBadge />
              <EditableField label="Deal Type" field="deal_type" type="select" options={enumOptions.deal_type} showBadge />
              <EditableField label="Transaction Type" field="transaction_type" type="select" options={enumOptions.transaction_type} />
              <EditableField label="Lead Source Name" field="lead_source_name" />
              <EditableField label="Lead Source Type" field="lead_source_type" type="select" options={enumOptions.lead_source_type} />
              <EditableField label="Loan Type RTL" field="loan_type_rtl" type="select" options={enumOptions.loan_type_rtl} />
              <EditableField label="Loan Structure DSCR" field="loan_structure_dscr" type="select" options={enumOptions.loan_structure_dscr} />
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
            <div className="space-y-1">
              <EditableField label="Note Date" field="note_date" type="date" />
              <EditableField label="Target Closing Date" field="target_closing_date" type="date" />
              <EditableField label="Funding Date" field="funding_date" type="date" />
              <EditableField label="Loan Sale Date" field="loan_sale_date" type="date" />
              <DetailRow label="Created At" value={formatDateTime(deal.created_at)} />
              <DetailRow label="Updated At" value={formatDateTime(deal.updated_at)} />
              <EditableField label="Pricing File Path" field="pricing_file_path" />
              <EditableField label="Pricing File URL" field="pricing_file_url" />
            </div>
          </AccordionContent>
        </AccordionItem>
        </Accordion>

        <Accordion
          type="multiple"
          defaultValue={["borrowers", "loan", "assignments"]}
          className="w-full space-y-4"
        >
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
            <div className="space-y-1">
              <EditableField label="Vesting Type" field="vesting_type" type="select" options={enumOptions.vesting_type} />
              <EditableField label="Guarantor Count" field="guarantor_count" type="number" />
              <EditableField label="Guarantor FICO" field="guarantor_fico_score" type="number" />
              <EditableField label="Mid FICO" field="mid_fico" type="number" />
              <DetailRow label="Guarantor Name" value={deal.guarantor_name || "—"} />
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
            <div className="space-y-1">
              <EditableField label="Property ID" field="property_id" type="number" />
              <DetailRow label="Property Address" value={deal.property_address || "—"} />
              <EditableField label="Property Type" field="property_type" type="select" options={enumOptions.property_type} />
              <EditableField label="Warrantability" field="warrantability" type="select" options={enumOptions.warrantability} />
              <EditableField label="Purchase Price" field="purchase_price" type="number" isCurrency />
              <EditableField label="Date of Purchase" field="date_of_purchase" type="date" />
              <EditableField label="Recently Renovated" field="recently_renovated" type="select" options={enumOptions.recently_renovated} />
              <EditableField label="Renovation Cost" field="renovation_cost" type="number" isCurrency />
              <EditableField label="Renovation Completed" field="renovation_completed" type="date" />
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
            <div className="space-y-1">
              <EditableField label="Loan Amount Total" field="loan_amount_total" type="number" isCurrency />
              <EditableField label="Loan Amount Initial" field="loan_amount_initial" type="number" isCurrency />
              <EditableField label="Construction Holdback" field="construction_holdback" type="number" isCurrency />
              <EditableField label="Payoff MTG1 Amount" field="payoff_mtg1_amount" type="number" isCurrency />
              <EditableField label="Cost of Capital" field="cost_of_capital" type="number" isCurrency />
              <EditableField label="LTV As-Is" field="ltv_asis" type="number" />
              <EditableField label="LTV After Repair" field="ltv_after_repair" type="number" />
              <EditableField label="Loan Term" field="loan_term" type="select" options={enumOptions.loan_term} />
              <EditableField label="Recourse Type" field="recourse_type" type="select" options={enumOptions.recourse_type} />
              <EditableField label="IO Period" field="io_period" type="number" />
              <EditableField label="PPP Term" field="ppp_term" type="select" options={enumOptions.ppp_term} />
              <EditableField label="PPP Structure" field="ppp_structure_1" type="select" options={enumOptions.ppp_structure_1} />
              <EditableField label="Note Rate" field="note_rate" type="number" />
              <EditableField label="Pricing Locked" field="pricing_is_locked" type="checkbox" />
              <EditableField label="Cash Out Purpose" field="cash_out_purpose" type="textarea" />
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
            <div className="space-y-1">
              <EditableField label="Company" field="company_id" />
              <EditableField label="Broker Company" field="broker_company_id" />
              <EditableField label="Escrow Company" field="escrow_company_id" />
              <EditableField label="Title Company" field="title_company_id" />
              <EditableField label="Insurance Carrier" field="insurance_carrier_company_id" />
              <EditableField label="Loan Buyer" field="loan_buyer_company_id" />
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
              <div className="space-y-2">
                <EditableField label="Lawsuits" field="declaration_1_lawsuits" type="checkbox" />
                <EditableField label="Lawsuits Explanation" field="declaration_1_lawsuits_explanation" type="textarea" />
              </div>
              <div className="space-y-2">
                <EditableField label="Bankruptcy" field="declaration_2_bankruptcy" type="checkbox" />
                <EditableField label="Bankruptcy Explanation" field="declaration_2_bankruptcy_explanation" type="textarea" />
              </div>
              <div className="space-y-2">
                <EditableField label="Felony" field="declaration_3_felony" type="checkbox" />
                <EditableField label="Felony Explanation" field="declaration_3_felony_explanation" type="textarea" />
              </div>
              <EditableField label="License" field="declaration_5_license" type="checkbox" />
            </div>
          </AccordionContent>
        </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
