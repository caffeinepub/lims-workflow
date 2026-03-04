import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { DUMMY_USERS, SAMPLE_INTAKES, TEST_SAMPLES } from "../lib/mockData";

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
    requestedTests: [] as string[],
    assignToSectionInCharge: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const sectionInCharges = DUMMY_USERS.filter(
    (u) => u.role === "sectionInCharge",
  );

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
    if (form.requestedTests.length === 0)
      e.requestedTests = "Select at least one test";
    if (!form.assignToSectionInCharge) e.assignToSectionInCharge = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    const newId = `SI-2026-${String(SAMPLE_INTAKES.length + 1).padStart(3, "0")}`;
    SAMPLE_INTAKES.push({
      sampleId: newId,
      ...form,
      status: "Intake",
      createdAt: new Date().toISOString(),
      createdBy: activeUser.id,
    });
    setSubmitting(false);
    toast.success(`Sample ${newId} created successfully`, {
      description: "Status: Intake — Pending eligibility check",
    });
    navigate({ to: "/" });
  };

  const toggleTest = (testName: string) => {
    setForm((prev) => ({
      ...prev,
      requestedTests: prev.requestedTests.includes(testName)
        ? prev.requestedTests.filter((t) => t !== testName)
        : [...prev.requestedTests, testName],
    }));
  };

  const field = (key: string) => ({
    value: (form as Record<string, unknown>)[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value })),
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: "/" })}
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
                rows={2}
                {...field("specialHandling")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Requested Tests */}
        <Card className="lims-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">
              Requested Tests <span className="text-destructive">*</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {TEST_SAMPLES.map((test) => (
                <label
                  key={test.id}
                  htmlFor={`test-${test.id}`}
                  className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                    form.requestedTests.includes(test.testName)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/30"
                  }`}
                >
                  <Checkbox
                    id={`test-${test.id}`}
                    checked={form.requestedTests.includes(test.testName)}
                    onCheckedChange={() => toggleTest(test.testName)}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium">{test.testName}</p>
                    <p className="text-xs text-muted-foreground">
                      {test.testType} · {test.noOfDays}d
                    </p>
                  </div>
                </label>
              ))}
            </div>
            {errors.requestedTests && (
              <p className="text-xs text-destructive mt-2">
                {errors.requestedTests}
              </p>
            )}
            {form.requestedTests.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {form.requestedTests.map((t) => (
                  <Badge key={t} variant="secondary" className="gap-1 text-xs">
                    {t}
                    <button type="button" onClick={() => toggleTest(t)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assignment */}
        <Card className="lims-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">
              Assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-w-sm">
              <Label className="text-xs font-medium">
                Assign to Section In-Charge{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.assignToSectionInCharge}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, assignToSectionInCharge: v }))
                }
              >
                <SelectTrigger
                  className={
                    errors.assignToSectionInCharge ? "border-destructive" : ""
                  }
                >
                  <SelectValue placeholder="Select Section In-Charge" />
                </SelectTrigger>
                <SelectContent>
                  {sectionInCharges.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} — {u.section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.assignToSectionInCharge && (
                <p className="text-xs text-destructive">
                  {errors.assignToSectionInCharge}
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
            onClick={() => navigate({ to: "/" })}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting} className="gap-2">
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
