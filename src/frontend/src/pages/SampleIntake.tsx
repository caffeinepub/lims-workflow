import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, FlaskConical, Save, X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { useRole } from "../contexts/RoleContext";
import { useActor } from "../hooks/useActor";
import { buildSamplePayload, storeSampleId } from "../hooks/useBackendService";
import { DUMMY_USERS, SAMPLE_INTAKES } from "../lib/mockData";

const SAMPLE_TYPES = [
  "API",
  "Finished Product",
  "Biological",
  "Parenteral",
  "Excipient",
  "Raw Material",
  "Intermediate",
];
const PHYSICAL_FORMS = [
  "Powder",
  "Tablet",
  "Capsule",
  "Liquid",
  "Solution",
  "Lyophilized",
  "Cream",
  "Gel",
  "Injection",
  "Powder for Injection",
];

export function SampleIntake() {
  const navigate = useNavigate();
  const { activeUser } = useRole();
  const { actor } = useActor();

  const [form, setForm] = useState({
    customerName: "",
    contactPerson: "",
    emailAddress: "",
    sampleName: "",
    sampleType: "",
    physicalForm: "",
    dateOfReceipt: new Date().toISOString().split("T")[0],
    numberOfUnits: 1,
    specialHandling: "",
    assignToSectionInCharge: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const sectionInCharges = DUMMY_USERS.filter(
    (u) => u.role === "sectionInCharge",
  );

  const addAssignee = (userId: string) => {
    if (!userId || form.assignToSectionInCharge.includes(userId)) return;
    setForm((prev) => ({
      ...prev,
      assignToSectionInCharge: [...prev.assignToSectionInCharge, userId],
    }));
    if (errors.assignToSectionInCharge) {
      setErrors((prev) => ({ ...prev, assignToSectionInCharge: "" }));
    }
  };

  const removeAssignee = (userId: string) => {
    setForm((prev) => ({
      ...prev,
      assignToSectionInCharge: prev.assignToSectionInCharge.filter(
        (id) => id !== userId,
      ),
    }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.customerName.trim()) e.customerName = "Required";
    if (!form.contactPerson.trim()) e.contactPerson = "Required";
    if (!form.emailAddress.trim()) e.emailAddress = "Required";
    else if (!/\S+@\S+\.\S+/.test(form.emailAddress))
      e.emailAddress = "Invalid email";
    if (!form.sampleName.trim()) e.sampleName = "Required";
    if (!form.sampleType) e.sampleType = "Required";
    if (!form.physicalForm) e.physicalForm = "Required";
    if (!form.dateOfReceipt) e.dateOfReceipt = "Required";
    if (form.numberOfUnits < 1) e.numberOfUnits = "Must be at least 1";
    if (form.assignToSectionInCharge.length < 2)
      e.assignToSectionInCharge = "Select at least 2 Section In-Charge users";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const newId = `SI-2026-${String(SAMPLE_INTAKES.length + 1).padStart(3, "0")}`;

    const approvalDecisions = form.assignToSectionInCharge.map((uid) => {
      const user = DUMMY_USERS.find((u) => u.id === uid);
      return {
        userId: uid,
        userName: user?.name ?? uid,
        decision: "pending" as const,
        comment: "",
      };
    });

    SAMPLE_INTAKES.push({
      sampleId: newId,
      customerName: form.customerName,
      contactPerson: form.contactPerson,
      emailAddress: form.emailAddress,
      sampleName: form.sampleName,
      sampleType: form.sampleType,
      physicalForm: form.physicalForm,
      dateOfReceipt: form.dateOfReceipt,
      numberOfUnits: form.numberOfUnits,
      specialHandling: form.specialHandling,
      assignToSectionInCharge: form.assignToSectionInCharge,
      approvalDecisions,
      status: "Intake",
      createdAt: new Date().toISOString(),
      createdBy: activeUser.id,
    });

    // Backend: persist sample to canister
    if (actor) {
      try {
        const backendSample = buildSamplePayload({
          sampleId: newId,
          sampleName: form.sampleName,
          clientName: form.customerName,
          testName: form.sampleType,
        });
        const id = await actor.createSample(backendSample);
        storeSampleId(id);
      } catch (err) {
        console.warn("Backend createSample failed (mock data used):", err);
      }
    }

    setSubmitting(false);
    toast.success(`Sample ${newId} created successfully`, {
      description: "Status: Intake — Pending eligibility check",
    });
    navigate({ to: "/" });
  };

  const field = (key: string) => ({
    value: (form as Record<string, unknown>)[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value })),
  });

  // Users not yet selected
  const availableAssignees = sectionInCharges.filter(
    (u) => !form.assignToSectionInCharge.includes(u.id),
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: "/" })}
            data-ocid="intake.back.button"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="page-title flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              Sample Intake
            </h1>
            <p className="page-subtitle">
              Register a new sample for laboratory analysis
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <Card className="lims-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="customerName" className="text-xs font-medium">
                Customer Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="customerName"
                placeholder="e.g. BioPharm Solutions Ltd"
                data-ocid="intake.customer_name.input"
                {...field("customerName")}
                className={errors.customerName ? "border-destructive" : ""}
              />
              {errors.customerName && (
                <p className="text-xs text-destructive">
                  {errors.customerName}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contactPerson" className="text-xs font-medium">
                Contact Person <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contactPerson"
                placeholder="e.g. Dr. Anita Patel"
                data-ocid="intake.contact_person.input"
                {...field("contactPerson")}
                className={errors.contactPerson ? "border-destructive" : ""}
              />
              {errors.contactPerson && (
                <p className="text-xs text-destructive">
                  {errors.contactPerson}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emailAddress" className="text-xs font-medium">
                Email Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="emailAddress"
                type="email"
                placeholder="contact@company.com"
                data-ocid="intake.email.input"
                {...field("emailAddress")}
                className={errors.emailAddress ? "border-destructive" : ""}
              />
              {errors.emailAddress && (
                <p className="text-xs text-destructive">
                  {errors.emailAddress}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sample Details */}
        <Card className="lims-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">
              Sample Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="sampleName" className="text-xs font-medium">
                Sample Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sampleName"
                placeholder="e.g. Amoxicillin Trihydrate"
                data-ocid="intake.sample_name.input"
                {...field("sampleName")}
                className={errors.sampleName ? "border-destructive" : ""}
              />
              {errors.sampleName && (
                <p className="text-xs text-destructive">{errors.sampleName}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Sample Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.sampleType}
                onValueChange={(v) => setForm((p) => ({ ...p, sampleType: v }))}
              >
                <SelectTrigger
                  data-ocid="intake.sample_type.select"
                  className={errors.sampleType ? "border-destructive" : ""}
                >
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {SAMPLE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.sampleType && (
                <p className="text-xs text-destructive">{errors.sampleType}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Physical Form <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.physicalForm}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, physicalForm: v }))
                }
              >
                <SelectTrigger
                  data-ocid="intake.physical_form.select"
                  className={errors.physicalForm ? "border-destructive" : ""}
                >
                  <SelectValue placeholder="Select form" />
                </SelectTrigger>
                <SelectContent>
                  {PHYSICAL_FORMS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.physicalForm && (
                <p className="text-xs text-destructive">
                  {errors.physicalForm}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dateOfReceipt" className="text-xs font-medium">
                Date of Receipt <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dateOfReceipt"
                type="date"
                data-ocid="intake.date_of_receipt.input"
                {...field("dateOfReceipt")}
                className={errors.dateOfReceipt ? "border-destructive" : ""}
              />
              {errors.dateOfReceipt && (
                <p className="text-xs text-destructive">
                  {errors.dateOfReceipt}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="numberOfUnits" className="text-xs font-medium">
                Number of Units <span className="text-destructive">*</span>
              </Label>
              <Input
                id="numberOfUnits"
                type="number"
                min={1}
                data-ocid="intake.number_of_units.input"
                value={form.numberOfUnits}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    numberOfUnits: Number.parseInt(e.target.value) || 1,
                  }))
                }
                className={errors.numberOfUnits ? "border-destructive" : ""}
              />
              {errors.numberOfUnits && (
                <p className="text-xs text-destructive">
                  {errors.numberOfUnits}
                </p>
              )}
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="specialHandling" className="text-xs font-medium">
                Special Handling Instructions
              </Label>
              <Textarea
                id="specialHandling"
                placeholder="e.g. Store at 2-8°C, protect from light..."
                data-ocid="intake.special_handling.textarea"
                rows={2}
                {...field("specialHandling")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Assignment */}
        <Card className="lims-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">
              Assignment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium">
                Assign to Section In-Charge{" "}
                <span className="text-destructive">*</span>
                <span className="text-muted-foreground font-normal ml-1">
                  (select 2 or more — all must approve)
                </span>
              </Label>

              {/* Selected tags */}
              {form.assignToSectionInCharge.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 rounded-md border border-border bg-muted/30 min-h-[44px]">
                  {form.assignToSectionInCharge.map((uid) => {
                    const user = sectionInCharges.find((u) => u.id === uid);
                    if (!user) return null;
                    return (
                      <span
                        key={uid}
                        data-ocid={`intake.assignee_tag.${uid}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-teal-500/15 to-blue-500/15 text-teal-700 border border-teal-200 dark:text-teal-300 dark:border-teal-700"
                      >
                        <span className="w-5 h-5 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-[10px] text-white font-bold">
                          {user.name.charAt(0)}
                        </span>
                        {user.name}
                        <span className="text-muted-foreground">
                          — {user.section}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeAssignee(uid)}
                          data-ocid={`intake.assignee_remove.${uid}`}
                          className="ml-0.5 rounded-full hover:bg-destructive/20 p-0.5 transition-colors"
                          aria-label={`Remove ${user.name}`}
                        >
                          <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Dropdown to add more */}
              {availableAssignees.length > 0 && (
                <Select onValueChange={addAssignee} value="">
                  <SelectTrigger
                    data-ocid="intake.assignee_add.select"
                    className={
                      errors.assignToSectionInCharge
                        ? "border-destructive max-w-sm"
                        : "max-w-sm"
                    }
                  >
                    <SelectValue placeholder="+ Add Section In-Charge" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAssignees.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} — {u.section}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {errors.assignToSectionInCharge && (
                <p className="text-xs text-destructive">
                  {errors.assignToSectionInCharge}
                </p>
              )}

              {form.assignToSectionInCharge.length >= 2 && (
                <p className="text-xs text-emerald-600">
                  {form.assignToSectionInCharge.length} assignees selected — all
                  must approve before sample proceeds to Registration
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            data-ocid="intake.cancel.button"
            onClick={() => navigate({ to: "/" })}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            data-ocid="intake.submit.button"
            className="gap-2"
          >
            {submitting ? (
              <>
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Submit Intake
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
