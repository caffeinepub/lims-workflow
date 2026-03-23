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
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FileText,
  FlaskConical,
  Info,
  Plus,
  Save,
  Trash2,
  UserCheck,
} from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "../components/StatusBadge";
import { useRole } from "../contexts/RoleContext";
import { useActor } from "../hooks/useActor";
import {
  AUDIT_LOG,
  CLIENTS,
  type Client,
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

interface SampleDetailsCardsProps {
  sampleDetails: SampleDetail[];
  setSampleDetails: React.Dispatch<React.SetStateAction<SampleDetail[]>>;
  updateDetail: (idx: number, key: keyof SampleDetail, value: unknown) => void;
  toggleDetailParam: (idx: number, param: string) => void;
}

function SampleDetailsCards({
  sampleDetails,
  setSampleDetails,
  updateDetail,
  toggleDetailParam,
}: SampleDetailsCardsProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleCollapse = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addCard = () => {
    setSampleDetails((prev) => [...prev, emptyDetail()]);
  };

  const removeCard = (idx: number) => {
    setSampleDetails((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="mt-6 space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            Sample Details
          </h2>
          <Badge variant="secondary" className="text-xs px-2 py-0.5">
            {sampleDetails.length}{" "}
            {sampleDetails.length === 1 ? "Sample" : "Samples"}
          </Badge>
        </div>
        <Button
          size="sm"
          onClick={addCard}
          className="gap-1.5 text-xs bg-primary hover:bg-primary/90"
          data-ocid="sample_details.add_sample_row.button"
        >
          <Plus className="h-3.5 w-3.5" /> Add Sample
        </Button>
      </div>

      {/* Cards */}
      {sampleDetails.map((detail, idx) => {
        const isCollapsed = collapsed.has(detail.id);
        const availableParams = detail.testType
          ? TEST_SAMPLES.filter(
              (ts) => ts.testType === detail.testType && ts.status === "active",
            ).flatMap((ts) => ts.parameters)
          : [];

        const cardLabel = detail.sampleName
          ? detail.sampleName
          : `Sample ${idx + 1}`;
        const batchLabel = detail.batchNumber
          ? `· Batch ${detail.batchNumber}`
          : "";
        const selectedCount = detail.testParameters.length;

        return (
          <Card
            key={detail.id}
            className="lims-card border border-border/60 shadow-sm overflow-hidden"
            data-ocid={`sample_details.item.${idx + 1}`}
          >
            {/* Card Header */}
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-3 bg-muted/20 border-b border-border/40 cursor-pointer select-none text-left"
              onClick={() => toggleCollapse(detail.id)}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">
                  {idx + 1}
                </div>
                <div>
                  <span className="text-sm font-semibold text-foreground">
                    {cardLabel}
                  </span>
                  {batchLabel && (
                    <span className="text-xs text-muted-foreground ml-2">
                      {batchLabel}
                    </span>
                  )}
                </div>
                {detail.testType && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 border-primary/40 text-primary"
                  >
                    {detail.testType}
                  </Badge>
                )}
                {selectedCount > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-700 border border-emerald-200">
                    {selectedCount} param{selectedCount > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {sampleDetails.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCard(idx);
                    }}
                    data-ocid={`sample_details.delete_button.${idx + 1}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
                <span className="text-muted-foreground pointer-events-none">
                  {isCollapsed ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </span>
              </div>
            </button>

            {/* Card Body */}
            {!isCollapsed && (
              <CardContent className="p-5 space-y-5">
                {/* Primary Fields — always visible */}
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Basic Information
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">
                        Sample Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={detail.sampleName}
                        onChange={(e) =>
                          updateDetail(idx, "sampleName", e.target.value)
                        }
                        placeholder="e.g. Amoxicillin 500mg"
                        className="h-9 text-sm"
                        data-ocid={`sample_details.sample_name.input.${idx + 1}`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Batch No</Label>
                      <Input
                        value={detail.batchNumber}
                        onChange={(e) =>
                          updateDetail(idx, "batchNumber", e.target.value)
                        }
                        placeholder="e.g. BT-2024-001"
                        className="h-9 text-sm"
                        data-ocid={`sample_details.batch_no.input.${idx + 1}`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">AR No</Label>
                      <Input
                        value={detail.arNo}
                        onChange={(e) =>
                          updateDetail(idx, "arNo", e.target.value)
                        }
                        placeholder="e.g. AR-2024-0456"
                        className="h-9 text-sm"
                        data-ocid={`sample_details.ar_no.input.${idx + 1}`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Batch Size</Label>
                      <Input
                        value={detail.batchSize}
                        onChange={(e) =>
                          updateDetail(idx, "batchSize", e.target.value)
                        }
                        placeholder="e.g. 10000 units"
                        className="h-9 text-sm"
                        data-ocid={`sample_details.batch_size.input.${idx + 1}`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">
                        Sample Quantity
                      </Label>
                      <Input
                        value={detail.sampleQuantity}
                        onChange={(e) =>
                          updateDetail(idx, "sampleQuantity", e.target.value)
                        }
                        placeholder="e.g. 50 tablets"
                        className="h-9 text-sm"
                        data-ocid={`sample_details.qty.input.${idx + 1}`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">
                        Original Mfg Name
                      </Label>
                      <Input
                        value={detail.originalMfgName}
                        onChange={(e) =>
                          updateDetail(idx, "originalMfgName", e.target.value)
                        }
                        placeholder="Manufacturer name"
                        className="h-9 text-sm"
                        data-ocid={`sample_details.mfg_name.input.${idx + 1}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-dashed border-border/50" />

                {/* Extended Fields */}
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Dates & Specification
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Mfg Date</Label>
                      <Input
                        type="date"
                        value={detail.dateOfMfg}
                        onChange={(e) =>
                          updateDetail(idx, "dateOfMfg", e.target.value)
                        }
                        className="h-9 text-sm"
                        data-ocid={`sample_details.mfg_date.input.${idx + 1}`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Expiry Date</Label>
                      <Input
                        type="date"
                        value={detail.expiryDate}
                        onChange={(e) =>
                          updateDetail(idx, "expiryDate", e.target.value)
                        }
                        className="h-9 text-sm"
                        data-ocid={`sample_details.expiry_date.input.${idx + 1}`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Retest Date</Label>
                      <Input
                        type="date"
                        value={detail.retestDate}
                        onChange={(e) =>
                          updateDetail(idx, "retestDate", e.target.value)
                        }
                        className="h-9 text-sm"
                        data-ocid={`sample_details.retest_date.input.${idx + 1}`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">
                        Specification
                      </Label>
                      <Input
                        value={detail.specification}
                        onChange={(e) =>
                          updateDetail(idx, "specification", e.target.value)
                        }
                        placeholder="e.g. BP 2023"
                        className="h-9 text-sm"
                        data-ocid={`sample_details.spec.input.${idx + 1}`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">
                        Nature of Packing
                      </Label>
                      <Select
                        value={detail.natureOfPacking}
                        onValueChange={(v) =>
                          updateDetail(idx, "natureOfPacking", v)
                        }
                      >
                        <SelectTrigger
                          className="h-9 text-sm"
                          data-ocid={`sample_details.packing.select.${idx + 1}`}
                        >
                          <SelectValue placeholder="Select packing type" />
                        </SelectTrigger>
                        <SelectContent>
                          {PACKING_TYPES.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-dashed border-border/50" />

                {/* Test Type & Parameters */}
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Test Configuration
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Test Type</Label>
                      <Select
                        value={detail.testType}
                        onValueChange={(v) => {
                          updateDetail(idx, "testType", v);
                          updateDetail(idx, "testParameters", []);
                        }}
                      >
                        <SelectTrigger
                          className="h-9 text-sm"
                          data-ocid={`sample_details.test_type.select.${idx + 1}`}
                        >
                          <SelectValue placeholder="Select test type" />
                        </SelectTrigger>
                        <SelectContent>
                          {TEST_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium">
                        Test Parameters
                        {selectedCount > 0 && (
                          <span className="ml-1.5 text-primary font-semibold">
                            ({selectedCount} selected)
                          </span>
                        )}
                      </Label>
                      {!detail.testType ? (
                        <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-3 text-xs text-muted-foreground italic">
                          Select a test type to see available parameters
                        </div>
                      ) : availableParams.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50/50 px-4 py-3 text-xs text-amber-700 italic">
                          No parameters configured for this test type yet. Add
                          them in Test Masters.
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-1.5 p-3 rounded-lg border border-border/50 bg-muted/10 max-h-40 overflow-y-auto">
                          {availableParams.map((p) => {
                            const isChecked = detail.testParameters.includes(
                              p.name,
                            );
                            return (
                              <label
                                key={p.id}
                                htmlFor={`detail-param-${idx}-${p.id}`}
                                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs cursor-pointer transition-all ${
                                  isChecked
                                    ? "border-primary/50 bg-primary/8 text-primary font-medium"
                                    : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
                                }`}
                                data-ocid={`sample_details.param.checkbox.${idx + 1}`}
                              >
                                <Checkbox
                                  id={`detail-param-${idx}-${p.id}`}
                                  checked={isChecked}
                                  onCheckedChange={() =>
                                    toggleDetailParam(idx, p.name)
                                  }
                                  className="h-3 w-3 shrink-0"
                                />
                                <span className="truncate">{p.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Add another sample CTA at bottom */}
      <button
        type="button"
        onClick={addCard}
        className="w-full border-2 border-dashed border-border/50 hover:border-primary/40 hover:bg-primary/5 rounded-xl py-4 text-sm text-muted-foreground hover:text-primary flex items-center justify-center gap-2 transition-all"
        data-ocid="sample_details.add_more.button"
      >
        <Plus className="h-4 w-4" />
        Add Another Sample
      </button>
    </div>
  );
}

export function SampleRegistration({
  sampleId: propSampleId,
}: SampleRegistrationProps) {
  const navigate = useNavigate();
  const { activeUser } = useRole();
  const { actor } = useActor();

  const [selectedSampleId, setSelectedSampleId] = useState(propSampleId || "");
  const sample = selectedSampleId ? getSampleById(selectedSampleId) : null;
  const existingRFA = RFA_RECORDS.find((r) => r.sampleId === selectedSampleId);

  const registrationSamples = SAMPLE_INTAKES.filter(
    (s) => s.status === "Registration",
  );
  const [tab, setTab] = useState("client");
  const [submitting, setSubmitting] = useState(false);

  // Client autofill state
  const [clientQuery, setClientQuery] = useState(
    existingRFA?.clientName || sample?.customerName || "",
  );
  const [clientSuggestions, setClientSuggestions] = useState<Client[]>([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [autofilledClient, setAutofilledClient] = useState<Client | null>(null);
  const clientInputRef = useRef<HTMLInputElement>(null);

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

  const handleClientQuery = (q: string) => {
    setClientQuery(q);
    setField("clientName", q);
    setAutofilledClient(null);
    if (q.trim().length >= 1) {
      const matches = CLIENTS.filter((c) =>
        c.name.toLowerCase().includes(q.toLowerCase()),
      );
      setClientSuggestions(matches);
      setShowClientDropdown(matches.length > 0);
    } else {
      setClientSuggestions([]);
      setShowClientDropdown(false);
    }
  };

  const applyClientAutofill = (client: Client) => {
    setClientQuery(client.name);
    setAutofilledClient(client);
    setShowClientDropdown(false);
    setForm((prev) => ({
      ...prev,
      clientName: client.name,
      address: client.address + (client.city ? `, ${client.city}` : ""),
      pinCode: client.pinCode,
      person: client.contactPerson,
      phone: client.phone,
      emailId: client.email,
      clientOrganizationName: client.name,
      billingContactPerson: client.contactPerson,
      contactTelNo: client.phone,
    }));
    toast.success("Client details auto-filled from Master", {
      description: client.name,
    });
  };

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

    // Backend: advance sample to TestSpec stage
    if (actor && selectedSampleId) {
      try {
        await actor.updateSample(selectedSampleId, "TestSpec");
      } catch (err) {
        console.warn("Backend updateSample (Registration) failed:", err);
      }
    }

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
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="client">Client Info</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="receipt">Sample Receipt</TabsTrigger>
        </TabsList>

        {/* Tab 1: Client Info */}
        <TabsContent value="client">
          <Card className="lims-card">
            <CardContent className="p-5 space-y-4">
              {/* Auto-fill notice */}
              {autofilledClient && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">
                  <UserCheck className="h-4 w-4 shrink-0" />
                  <span>
                    Client details auto-filled from{" "}
                    <strong>Client Master</strong> — {autofilledClient.name}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Registration Number */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    Registration Number{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={form.registrationNumber}
                    onChange={(e) =>
                      setField("registrationNumber", e.target.value)
                    }
                    placeholder="Registration Number"
                    data-ocid="registration.reg_number.input"
                  />
                </div>

                {/* Client Name with autofill dropdown */}
                <div className="space-y-1.5 relative">
                  <Label className="text-xs font-medium">
                    Client Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    ref={clientInputRef}
                    value={clientQuery}
                    onChange={(e) => handleClientQuery(e.target.value)}
                    onFocus={() => {
                      if (clientSuggestions.length > 0)
                        setShowClientDropdown(true);
                    }}
                    onBlur={() =>
                      setTimeout(() => setShowClientDropdown(false), 150)
                    }
                    placeholder="Type client name to search..."
                    autoComplete="off"
                    data-ocid="registration.client_name.input"
                  />
                  {showClientDropdown && (
                    <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-border rounded-lg shadow-lg overflow-hidden">
                      {clientSuggestions.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-primary/5 text-left border-b border-border/50 last:border-0"
                          onMouseDown={() => applyClientAutofill(c)}
                        >
                          <UserCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {c.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {c.contactPerson} · {c.city} {c.pinCode}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Address */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={form.address}
                    onChange={(e) => setField("address", e.target.value)}
                    placeholder="Address"
                    data-ocid="registration.address.input"
                  />
                </div>

                {/* PIN Code */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">PIN Code</Label>
                  <Input
                    value={form.pinCode}
                    onChange={(e) => setField("pinCode", e.target.value)}
                    placeholder="PIN Code"
                    data-ocid="registration.pin_code.input"
                  />
                </div>

                {/* Reference Quotation */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    Reference Quotation
                  </Label>
                  <Input
                    value={form.referenceQuotation}
                    onChange={(e) =>
                      setField("referenceQuotation", e.target.value)
                    }
                    placeholder="Reference Quotation"
                  />
                </div>

                {/* Customer Ref Number */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    Customer Ref Number
                  </Label>
                  <Input
                    value={form.customerRefNumber}
                    onChange={(e) =>
                      setField("customerRefNumber", e.target.value)
                    }
                    placeholder="Customer Ref Number"
                  />
                </div>

                {/* Entry Date */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    Entry Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={form.entryDate}
                    onChange={(e) => setField("entryDate", e.target.value)}
                    data-ocid="registration.entry_date.input"
                  />
                </div>

                {/* Contact Person */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    Contact Person <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={form.person}
                    onChange={(e) => setField("person", e.target.value)}
                    placeholder="Contact Person"
                    data-ocid="registration.contact_person.input"
                  />
                </div>

                {/* Designation */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Designation</Label>
                  <Input
                    value={form.designation}
                    onChange={(e) => setField("designation", e.target.value)}
                    placeholder="Designation"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Phone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    placeholder="Phone"
                    data-ocid="registration.phone.input"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Email ID</Label>
                  <Input
                    type="email"
                    value={form.emailId}
                    onChange={(e) => setField("emailId", e.target.value)}
                    placeholder="Email ID"
                    data-ocid="registration.email.input"
                  />
                </div>
              </div>
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
      </Tabs>

      {/* Sample Details — Card Layout */}
      <SampleDetailsCards
        sampleDetails={sampleDetails}
        setSampleDetails={setSampleDetails}
        updateDetail={updateDetail}
        toggleDetailParam={toggleDetailParam}
      />

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
                    })[prev] || "client",
                )
              }
            >
              Previous
            </Button>
          )}
          {tab !== "receipt" && (
            <Button
              variant="outline"
              onClick={() =>
                setTab(
                  (prev) =>
                    ({
                      client: "billing",
                      billing: "receipt",
                      receipt: "receipt",
                    })[prev] || "receipt",
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
