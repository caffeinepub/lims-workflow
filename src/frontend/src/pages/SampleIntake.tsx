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
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import {
  ClipboardList,
  FlaskConical,
  History,
  Plus,
  Save,
  X,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { AnimatedTabs } from "../components/AnimatedTabs";
import { StatusBadge } from "../components/StatusBadge";
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
  const [activeTab, setActiveTab] = useState("new");
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatus, setHistoryStatus] = useState("all");

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
        console.warn("Backend createSample failed:", err);
      }
    }
    setSubmitting(false);
    toast.success(`Sample ${newId} created`, {
      description: "Pending eligibility check",
    });
    setForm({
      customerName: "",
      contactPerson: "",
      emailAddress: "",
      sampleName: "",
      sampleType: "",
      physicalForm: "",
      dateOfReceipt: new Date().toISOString().split("T")[0],
      numberOfUnits: 1,
      specialHandling: "",
      assignToSectionInCharge: [],
    });
    setActiveTab("history");
  };

  const fieldProps = (key: string) => ({
    value: (form as Record<string, unknown>)[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value })),
  });

  const availableAssignees = sectionInCharges.filter(
    (u) => !form.assignToSectionInCharge.includes(u.id),
  );

  const allStatuses = [...new Set(SAMPLE_INTAKES.map((s) => s.status))];
  const filteredHistory = [...SAMPLE_INTAKES]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .filter((s) => {
      const q = historySearch.toLowerCase();
      const matchesSearch =
        !q ||
        s.sampleId.toLowerCase().includes(q) ||
        s.sampleName.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q);
      const matchesStatus =
        historyStatus === "all" || s.status === historyStatus;
      return matchesSearch && matchesStatus;
    });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Page Header */}
      <div className="px-6 pt-5 pb-3 border-b border-border bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <FlaskConical className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Sample Intake</h1>
            <p className="text-xs text-muted-foreground">
              Register new samples for laboratory analysis
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="h-full flex flex-col"
        >
          <div className="px-6 py-2.5 flex-shrink-0 border-b border-border bg-white">
            <AnimatedTabs
              tabs={[
                {
                  id: "new",
                  label: "New Entry",
                  icon: <Plus className="h-3.5 w-3.5" />,
                },
                {
                  id: "history",
                  label: "History",
                  icon: <History className="h-3.5 w-3.5" />,
                  count: SAMPLE_INTAKES.length,
                },
              ]}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>

          {/* Tab 1: New Entry Form */}
          <TabsContent value="new" className="flex-1 overflow-y-auto m-0 p-6">
            <form onSubmit={handleSubmit} className="space-y-5 max-w-4xl">
              {/* Customer Info */}
              <Card className="lims-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      Customer Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      placeholder="e.g. BioPharm Solutions Ltd"
                      data-ocid="intake.customer_name.input"
                      {...fieldProps("customerName")}
                      className={
                        errors.customerName ? "border-destructive" : ""
                      }
                    />
                    {errors.customerName && (
                      <p className="text-xs text-destructive">
                        {errors.customerName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      Contact Person <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      placeholder="e.g. Dr. Anita Patel"
                      data-ocid="intake.contact_person.input"
                      {...fieldProps("contactPerson")}
                      className={
                        errors.contactPerson ? "border-destructive" : ""
                      }
                    />
                    {errors.contactPerson && (
                      <p className="text-xs text-destructive">
                        {errors.contactPerson}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      Email Address <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="email"
                      placeholder="contact@company.com"
                      data-ocid="intake.email.input"
                      {...fieldProps("emailAddress")}
                      className={
                        errors.emailAddress ? "border-destructive" : ""
                      }
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
                  <CardTitle className="text-sm font-semibold">
                    Sample Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      Sample Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      placeholder="e.g. Amoxicillin Trihydrate"
                      data-ocid="intake.sample_name.input"
                      {...fieldProps("sampleName")}
                      className={errors.sampleName ? "border-destructive" : ""}
                    />
                    {errors.sampleName && (
                      <p className="text-xs text-destructive">
                        {errors.sampleName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      Sample Type <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={form.sampleType}
                      onValueChange={(v) =>
                        setForm((p) => ({ ...p, sampleType: v }))
                      }
                    >
                      <SelectTrigger
                        data-ocid="intake.sample_type.select"
                        className={
                          errors.sampleType ? "border-destructive" : ""
                        }
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
                      <p className="text-xs text-destructive">
                        {errors.sampleType}
                      </p>
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
                        className={
                          errors.physicalForm ? "border-destructive" : ""
                        }
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
                    <Label className="text-xs font-medium">
                      Date of Receipt{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="date"
                      data-ocid="intake.date_of_receipt.input"
                      {...fieldProps("dateOfReceipt")}
                      className={
                        errors.dateOfReceipt ? "border-destructive" : ""
                      }
                    />
                    {errors.dateOfReceipt && (
                      <p className="text-xs text-destructive">
                        {errors.dateOfReceipt}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      Number of Units{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
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
                      className={
                        errors.numberOfUnits ? "border-destructive" : ""
                      }
                    />
                    {errors.numberOfUnits && (
                      <p className="text-xs text-destructive">
                        {errors.numberOfUnits}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs font-medium">
                      Special Handling Instructions
                    </Label>
                    <Textarea
                      placeholder="e.g. Store at 2-8°C, protect from light..."
                      data-ocid="intake.special_handling.textarea"
                      rows={2}
                      {...fieldProps("specialHandling")}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Assignment */}
              <Card className="lims-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">
                    Section In-Charge Assignment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Label className="text-xs font-medium">
                    Assign to Section In-Charge{" "}
                    <span className="text-destructive">*</span>
                    <span className="text-muted-foreground font-normal ml-1">
                      (select 2 or more — all must approve)
                    </span>
                  </Label>
                  {form.assignToSectionInCharge.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 rounded-md border border-border bg-muted/30 min-h-[44px]">
                      {form.assignToSectionInCharge.map((uid) => {
                        const user = sectionInCharges.find((u) => u.id === uid);
                        if (!user) return null;
                        return (
                          <span
                            key={uid}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-teal-500/15 to-blue-500/15 text-teal-700 border border-teal-200"
                          >
                            <span className="w-5 h-5 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-[10px] text-white font-bold">
                              {user.name.charAt(0)}
                            </span>
                            {user.name}
                            <button
                              type="button"
                              onClick={() => removeAssignee(uid)}
                              className="ml-0.5 rounded-full hover:bg-destructive/20 p-0.5 transition-colors"
                            >
                              <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
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
                      {form.assignToSectionInCharge.length} assignees selected —
                      all must approve
                    </p>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3 pb-4">
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
          </TabsContent>

          {/* Tab 2: History */}
          <TabsContent value="history" className="flex-1 overflow-y-auto m-0">
            <div className="p-6">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Input
                  placeholder="Search Sample ID, Name, Customer..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="h-8 text-xs max-w-xs"
                  data-ocid="intake.history_search.input"
                />
                <Select value={historyStatus} onValueChange={setHistoryStatus}>
                  <SelectTrigger
                    className="h-8 text-xs w-40"
                    data-ocid="intake.history_status.select"
                  >
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {allStatuses.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground ml-auto">
                  {filteredHistory.length} records
                </span>
              </div>

              <Card className="lims-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-primary" />
                    Sample Intake History
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {filteredHistory.length === 0 ? (
                    <div
                      className="py-12 text-center text-muted-foreground text-sm"
                      data-ocid="intake.empty_state"
                    >
                      No samples found.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border bg-muted/30">
                            {[
                              "Sample ID",
                              "Sample Name",
                              "Customer",
                              "Type",
                              "Physical Form",
                              "Date of Receipt",
                              "Units",
                              "Assigned To",
                              "Status",
                              "Action",
                            ].map((h) => (
                              <th
                                key={h}
                                className="text-left px-4 py-2.5 font-semibold text-muted-foreground whitespace-nowrap"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredHistory.map((s, idx) => {
                            const assigneeIds = Array.isArray(
                              s.assignToSectionInCharge,
                            )
                              ? s.assignToSectionInCharge
                              : [s.assignToSectionInCharge];
                            const assigneeNames = assigneeIds
                              .map(
                                (id) =>
                                  DUMMY_USERS.find((u) => u.id === id)?.name ??
                                  id,
                              )
                              .join(", ");
                            return (
                              <tr
                                key={s.sampleId}
                                className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                                data-ocid={`intake.item.${idx + 1}`}
                              >
                                <td className="px-4 py-2.5 font-mono text-primary font-medium">
                                  {s.sampleId}
                                </td>
                                <td className="px-4 py-2.5 font-medium">
                                  {s.sampleName}
                                </td>
                                <td className="px-4 py-2.5 text-muted-foreground">
                                  {s.customerName}
                                </td>
                                <td className="px-4 py-2.5 text-muted-foreground">
                                  {s.sampleType}
                                </td>
                                <td className="px-4 py-2.5 text-muted-foreground">
                                  {s.physicalForm}
                                </td>
                                <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                                  {s.dateOfReceipt}
                                </td>
                                <td className="px-4 py-2.5 text-center">
                                  {s.numberOfUnits}
                                </td>
                                <td
                                  className="px-4 py-2.5 text-muted-foreground max-w-[140px] truncate"
                                  title={assigneeNames}
                                >
                                  {assigneeNames}
                                </td>
                                <td className="px-4 py-2.5">
                                  <StatusBadge status={s.status} />
                                </td>
                                <td className="px-4 py-2.5">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 text-xs px-2"
                                    data-ocid={`intake.edit_button.${idx + 1}`}
                                    onClick={() =>
                                      navigate({
                                        to: "/eligibility-check/$sampleId",
                                        params: { sampleId: s.sampleId },
                                      })
                                    }
                                  >
                                    View
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
