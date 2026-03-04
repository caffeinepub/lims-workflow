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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, FileText, Info, Plus, Save, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "../components/StatusBadge";
import { useRole } from "../contexts/RoleContext";
import {
  AUDIT_LOG,
  DUMMY_USERS,
  type RFARecord,
  RFA_RECORDS,
  SAMPLE_INTAKES,
  type SampleDetail,
  TEST_SAMPLES,
  getSampleById,
} from "../lib/mockData";

interface SampleRegistrationProps {
  sampleId?: string;
}

const MARKETS = ["Domestic", "Export", "Both"];
const REPORT_FORMS = ["Electronic", "Hard Copy", "Electronic + Hard Copy"];
const TESTING_PURPOSES = [
  "Release Testing",
  "Stability Testing",
  "Method Validation",
  "R&D",
  "Regulatory Submission",
];
const TEST_METHODS = ["USP", "BP", "IP", "EP", "In-house", "USP/BP", "BP/IP"];
const ASSIGNEE_TYPES = ["Internal", "External", "Contract"];
const TEST_TYPES = ["Chemical", "Microbiological", "Physical", "Biological"];
const PACKING_TYPES = [
  "HDPE Container",
  "Glass Bottle",
  "Blister Pack",
  "Foil Pouch",
  "Drum",
  "Bag",
];

function emptyDetail(): SampleDetail {
  return {
    id: `sd-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    sampleName: "",
    batchNumber: "",
    arNo: "",
    batchSize: "",
    sampleQuantity: "",
    originalMfgName: "",
    dateOfMfg: "",
    specification: "",
    testType: "",
    testParameters: [],
    expiryDate: "",
    natureOfPacking: "",
    retestDate: "",
  };
}

export function SampleRegistration({
  sampleId: propSampleId,
}: SampleRegistrationProps) {
  const navigate = useNavigate();
  const { activeUser } = useRole();

  const [selectedSampleId, setSelectedSampleId] = useState(propSampleId || "");
  const sample = selectedSampleId ? getSampleById(selectedSampleId) : null;
  const existingRFA = RFA_RECORDS.find((r) => r.sampleId === selectedSampleId);

  const registrationSamples = SAMPLE_INTAKES.filter(
    (s) => s.status === "Registration",
  );
  const analysts = DUMMY_USERS.filter(
    (u) => u.role === "analyst" || u.role === "sectionInCharge",
  );

  const [tab, setTab] = useState("client");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    registrationNumber:
      existingRFA?.registrationNumber ||
      `REG-2026-${String(RFA_RECORDS.length + 1).padStart(3, "0")}`,
    clientName: sample?.customerName || "",
    address: "",
    pinCode: "",
    referenceQuotation: "",
    customerRefNumber: "",
    entryDate: new Date().toISOString().split("T")[0],
    person: sample?.contactPerson || "",
    designation: "",
    phone: "",
    emailId: sample?.emailAddress || "",
    billingAddressRequired: false,
    clientOrganizationName: sample?.customerName || "",
    clientBillingAddress: "",
    contactTelNo: "",
    billingContactPerson: "",
    market: "",
    reportRequiredForm: "",
    supplierName: "",
    mfgDrugLicNo: "",
    workorder: "",
    comments: "",
    stpNo: "",
    temperatureConditions: "",
    sendersFullname: "",
    einOfReceiver: "",
    dateOfReceipt: sample?.dateOfReceipt || "",
    others: "",
    testingPurpose: "",
    testNames: sample?.requestedTests || ([] as string[]),
    samplingPoint: "",
    sampledBy: "",
    testMethod: "",
    sectionUsers: [] as string[],
    sampleDescription: "",
    rawFinishedOthers: "",
    assigneeType: "",
  });

  const [sampleDetails, setSampleDetails] = useState<SampleDetail[]>([
    emptyDetail(),
  ]);

  const setField = (key: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const updateDetail = (
    idx: number,
    key: keyof SampleDetail,
    value: unknown,
  ) => {
    setSampleDetails((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, [key]: value } : d)),
    );
  };

  const toggleDetailParam = (idx: number, param: string) => {
    setSampleDetails((prev) =>
      prev.map((d, i) => {
        if (i !== idx) return d;
        const params = d.testParameters.includes(param)
          ? d.testParameters.filter((p) => p !== param)
          : [...d.testParameters, param];
        return { ...d, testParameters: params };
      }),
    );
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 900));

    const newRFA: RFARecord = {
      ...form,
      id: `rfa-${Date.now()}`,
      sampleId: selectedSampleId,
      sampleDetails,
    };
    RFA_RECORDS.push(newRFA);

    const idx = SAMPLE_INTAKES.findIndex(
      (s) => s.sampleId === selectedSampleId,
    );
    if (idx !== -1)
      SAMPLE_INTAKES[idx] = { ...SAMPLE_INTAKES[idx], status: "TestSpec" };

    AUDIT_LOG.push({
      id: `al-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: activeUser.id,
      userName: activeUser.name,
      action: "CREATE",
      entity: "RFA",
      entityId: form.registrationNumber,
      details: `Registration ${form.registrationNumber} created for ${selectedSampleId}`,
    });

    setSubmitting(false);
    toast.success("Registration saved", {
      description: `${form.registrationNumber} — Advancing to Test Specification`,
    });
    navigate({
      to: "/test-specification/$sampleId",
      params: { sampleId: selectedSampleId },
    });
  };

  if (!sample) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
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
                <FileText className="h-5 w-5 text-primary" />
                Sample Registration
              </h1>
              <p className="page-subtitle">Requisition for Analysis (RFA)</p>
            </div>
          </div>
        </div>
        <Card className="lims-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Select Sample for Registration
            </CardTitle>
          </CardHeader>
          <CardContent>
            {registrationSamples.length === 0 ? (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <Info className="h-4 w-4" />
                <span className="text-sm">No samples pending registration</span>
              </div>
            ) : (
              <div className="space-y-2">
                {registrationSamples.map((s) => (
                  <button
                    type="button"
                    key={s.sampleId}
                    onClick={() => setSelectedSampleId(s.sampleId)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-primary font-medium">
                        {s.sampleId}
                      </span>
                      <span className="text-sm font-medium">
                        {s.sampleName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {s.customerName}
                      </span>
                    </div>
                    <StatusBadge status={s.status} />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
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
              <FileText className="h-5 w-5 text-primary" />
              Sample Registration
            </h1>
            <p className="page-subtitle">
              {sample.sampleId} — {sample.sampleName}
            </p>
          </div>
        </div>
        <StatusBadge status={sample.status} />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="client">Client Info</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="receipt">Sample Receipt</TabsTrigger>
          <TabsTrigger value="testing">Testing Setup</TabsTrigger>
        </TabsList>

        {/* Tab 1: Client Info */}
        <TabsContent value="client">
          <Card className="lims-card">
            <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  key: "registrationNumber",
                  label: "Registration Number",
                  required: true,
                },
                { key: "clientName", label: "Client Name", required: true },
                { key: "address", label: "Address", required: true },
                { key: "pinCode", label: "PIN Code" },
                { key: "referenceQuotation", label: "Reference Quotation" },
                { key: "customerRefNumber", label: "Customer Ref Number" },
                {
                  key: "entryDate",
                  label: "Entry Date",
                  type: "date",
                  required: true,
                },
                { key: "person", label: "Contact Person", required: true },
                { key: "designation", label: "Designation" },
                { key: "phone", label: "Phone" },
                { key: "emailId", label: "Email ID", type: "email" },
              ].map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    {f.label}
                    {f.required && (
                      <span className="text-destructive ml-1">*</span>
                    )}
                  </Label>
                  <Input
                    type={f.type || "text"}
                    value={(form as Record<string, unknown>)[f.key] as string}
                    onChange={(e) => setField(f.key, e.target.value)}
                    placeholder={f.label}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Billing */}
        <TabsContent value="billing">
          <Card className="lims-card">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="billingReq"
                  checked={form.billingAddressRequired}
                  onCheckedChange={(v) =>
                    setField("billingAddressRequired", !!v)
                  }
                />
                <Label
                  htmlFor="billingReq"
                  className="text-sm font-medium cursor-pointer"
                >
                  Billing Address Required
                </Label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    key: "clientOrganizationName",
                    label: "Client Organization Name",
                  },
                  {
                    key: "clientBillingAddress",
                    label: "Client Billing Address",
                  },
                  { key: "contactTelNo", label: "Contact Tel No" },
                  {
                    key: "billingContactPerson",
                    label: "Billing Contact Person",
                  },
                ].map((f) => (
                  <div key={f.key} className="space-y-1.5">
                    <Label className="text-xs font-medium">{f.label}</Label>
                    <Input
                      value={(form as Record<string, unknown>)[f.key] as string}
                      onChange={(e) => setField(f.key, e.target.value)}
                      placeholder={f.label}
                    />
                  </div>
                ))}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Market</Label>
                  <Select
                    value={form.market}
                    onValueChange={(v) => setField("market", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select market" />
                    </SelectTrigger>
                    <SelectContent>
                      {MARKETS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    Report Required Form
                  </Label>
                  <Select
                    value={form.reportRequiredForm}
                    onValueChange={(v) => setField("reportRequiredForm", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select form" />
                    </SelectTrigger>
                    <SelectContent>
                      {REPORT_FORMS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Sample Receipt */}
        <TabsContent value="receipt">
          <Card className="lims-card">
            <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: "supplierName", label: "Supplier Name" },
                { key: "mfgDrugLicNo", label: "Mfg Drug Lic No" },
                { key: "workorder", label: "Work Order" },
                { key: "stpNo", label: "STP No" },
                {
                  key: "temperatureConditions",
                  label: "Temperature Conditions",
                },
                { key: "sendersFullname", label: "Sender's Full Name" },
                { key: "einOfReceiver", label: "EIN of Receiver" },
                {
                  key: "dateOfReceipt",
                  label: "Date of Receipt",
                  type: "date",
                },
                { key: "others", label: "Others" },
              ].map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <Label className="text-xs font-medium">{f.label}</Label>
                  <Input
                    type={f.type || "text"}
                    value={(form as Record<string, unknown>)[f.key] as string}
                    onChange={(e) => setField(f.key, e.target.value)}
                    placeholder={f.label}
                  />
                </div>
              ))}
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-medium">Comments</Label>
                <Textarea
                  value={form.comments}
                  onChange={(e) => setField("comments", e.target.value)}
                  rows={2}
                  placeholder="Additional comments..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Testing Setup */}
        <TabsContent value="testing">
          <Card className="lims-card">
            <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Testing Purpose</Label>
                <Select
                  value={form.testingPurpose}
                  onValueChange={(v) => setField("testingPurpose", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    {TESTING_PURPOSES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Test Method</Label>
                <Select
                  value={form.testMethod}
                  onValueChange={(v) => setField("testMethod", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEST_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Assignee Type</Label>
                <Select
                  value={form.assigneeType}
                  onValueChange={(v) => setField("assigneeType", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSIGNEE_TYPES.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {[
                { key: "samplingPoint", label: "Sampling Point" },
                { key: "sampledBy", label: "Sampled By" },
                { key: "sampleDescription", label: "Sample Description" },
                { key: "rawFinishedOthers", label: "Raw/Finished/Others" },
              ].map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <Label className="text-xs font-medium">{f.label}</Label>
                  <Input
                    value={(form as Record<string, unknown>)[f.key] as string}
                    onChange={(e) => setField(f.key, e.target.value)}
                    placeholder={f.label}
                  />
                </div>
              ))}
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-medium">Test Names</Label>
                <div className="flex flex-wrap gap-2">
                  {TEST_SAMPLES.map((t) => (
                    <label
                      key={t.id}
                      htmlFor={`rfa-test-${t.id}`}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs cursor-pointer transition-colors ${form.testNames.includes(t.testName) ? "border-primary bg-primary/10 text-primary font-medium" : "border-border hover:border-primary/50"}`}
                    >
                      <Checkbox
                        id={`rfa-test-${t.id}`}
                        checked={form.testNames.includes(t.testName)}
                        onCheckedChange={() =>
                          setField(
                            "testNames",
                            form.testNames.includes(t.testName)
                              ? form.testNames.filter((n) => n !== t.testName)
                              : [...form.testNames, t.testName],
                          )
                        }
                        className="h-3 w-3"
                      />
                      {t.testName}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-medium">Section Users</Label>
                <div className="flex flex-wrap gap-2">
                  {analysts.map((u) => (
                    <label
                      key={u.id}
                      htmlFor={`rfa-user-${u.id}`}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs cursor-pointer transition-colors ${form.sectionUsers.includes(u.id) ? "border-primary bg-primary/10 text-primary font-medium" : "border-border hover:border-primary/50"}`}
                    >
                      <Checkbox
                        id={`rfa-user-${u.id}`}
                        checked={form.sectionUsers.includes(u.id)}
                        onCheckedChange={() =>
                          setField(
                            "sectionUsers",
                            form.sectionUsers.includes(u.id)
                              ? form.sectionUsers.filter((id) => id !== u.id)
                              : [...form.sectionUsers, u.id],
                          )
                        }
                        className="h-3 w-3"
                      />
                      {u.name}
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sample Details Table */}
      <Card className="lims-card mt-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">
              Sample Details
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setSampleDetails((prev) => [...prev, emptyDetail()])
              }
              className="gap-1 text-xs"
            >
              <Plus className="h-3 w-3" /> Add Sample Row
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="table-scroll">
            <table className="w-full text-xs min-w-[1200px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {[
                    "Sample Name",
                    "Batch No",
                    "AR No",
                    "Batch Size",
                    "Qty",
                    "Mfg Name",
                    "Mfg Date",
                    "Specification",
                    "Test Type",
                    "Test Params",
                    "Expiry",
                    "Packing",
                    "Retest Date",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left py-2 px-2 font-semibold text-muted-foreground whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sampleDetails.map((detail, idx) => (
                  <tr key={detail.id} className="border-b border-border/50">
                    {(
                      [
                        "sampleName",
                        "batchNumber",
                        "arNo",
                        "batchSize",
                        "sampleQuantity",
                        "originalMfgName",
                      ] as (keyof SampleDetail)[]
                    ).map((key) => (
                      <td key={key} className="py-1.5 px-1">
                        <Input
                          value={detail[key] as string}
                          onChange={(e) =>
                            updateDetail(idx, key, e.target.value)
                          }
                          className="h-7 text-xs min-w-[80px]"
                          placeholder={key}
                        />
                      </td>
                    ))}
                    <td className="py-1.5 px-1">
                      <Input
                        type="date"
                        value={detail.dateOfMfg}
                        onChange={(e) =>
                          updateDetail(idx, "dateOfMfg", e.target.value)
                        }
                        className="h-7 text-xs min-w-[110px]"
                      />
                    </td>
                    <td className="py-1.5 px-1">
                      <Input
                        value={detail.specification}
                        onChange={(e) =>
                          updateDetail(idx, "specification", e.target.value)
                        }
                        className="h-7 text-xs min-w-[80px]"
                        placeholder="Spec"
                      />
                    </td>
                    <td className="py-1.5 px-1">
                      <Select
                        value={detail.testType}
                        onValueChange={(v) => updateDetail(idx, "testType", v)}
                      >
                        <SelectTrigger className="h-7 text-xs min-w-[100px]">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {TEST_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-1.5 px-1">
                      <div className="flex flex-wrap gap-1 min-w-[120px]">
                        {TEST_SAMPLES.flatMap((ts) => ts.parameters)
                          .slice(0, 6)
                          .map((p) => (
                            <label
                              key={p.id}
                              htmlFor={`detail-param-${idx}-${p.id}`}
                              className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] cursor-pointer ${detail.testParameters.includes(p.name) ? "border-primary bg-primary/10 text-primary" : "border-border"}`}
                            >
                              <Checkbox
                                id={`detail-param-${idx}-${p.id}`}
                                checked={detail.testParameters.includes(p.name)}
                                onCheckedChange={() =>
                                  toggleDetailParam(idx, p.name)
                                }
                                className="h-2.5 w-2.5"
                              />
                              {p.name.split(" ")[0]}
                            </label>
                          ))}
                      </div>
                    </td>
                    <td className="py-1.5 px-1">
                      <Input
                        type="date"
                        value={detail.expiryDate}
                        onChange={(e) =>
                          updateDetail(idx, "expiryDate", e.target.value)
                        }
                        className="h-7 text-xs min-w-[110px]"
                      />
                    </td>
                    <td className="py-1.5 px-1">
                      <Select
                        value={detail.natureOfPacking}
                        onValueChange={(v) =>
                          updateDetail(idx, "natureOfPacking", v)
                        }
                      >
                        <SelectTrigger className="h-7 text-xs min-w-[110px]">
                          <SelectValue placeholder="Packing" />
                        </SelectTrigger>
                        <SelectContent>
                          {PACKING_TYPES.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-1.5 px-1">
                      <Input
                        type="date"
                        value={detail.retestDate}
                        onChange={(e) =>
                          updateDetail(idx, "retestDate", e.target.value)
                        }
                        className="h-7 text-xs min-w-[110px]"
                      />
                    </td>
                    <td className="py-1.5 px-1">
                      {sampleDetails.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() =>
                            setSampleDetails((prev) =>
                              prev.filter((_, i) => i !== idx),
                            )
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between mt-6">
        <div className="flex gap-2">
          {tab !== "client" && (
            <Button
              variant="outline"
              onClick={() =>
                setTab(
                  (prev) =>
                    ({
                      client: "client",
                      billing: "client",
                      receipt: "billing",
                      testing: "receipt",
                    })[prev] || "client",
                )
              }
            >
              Previous
            </Button>
          )}
          {tab !== "testing" && (
            <Button
              variant="outline"
              onClick={() =>
                setTab(
                  (prev) =>
                    ({
                      client: "billing",
                      billing: "receipt",
                      receipt: "testing",
                      testing: "testing",
                    })[prev] || "testing",
                )
              }
            >
              Next
            </Button>
          )}
        </div>
        <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
          {submitting ? (
            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save & Advance to Test Spec
        </Button>
      </div>
    </div>
  );
}
