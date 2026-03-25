import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Circle,
  Info,
  Plus,
  ShieldCheck,
  TestTube,
  User,
  XCircle,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "../components/StatusBadge";
import { useRole } from "../contexts/RoleContext";
import { useActor } from "../hooks/useActor";
import {
  AUDIT_LOG,
  DUMMY_USERS,
  RFA_RECORDS,
  SAMPLE_INTAKES,
  TEST_SPECS,
  type TestSpecRow,
  getSampleById,
} from "../lib/mockData";

interface TestSpecificationProps {
  sampleId?: string;
}

// DEFAULT_PARAMS removed — data loaded from backend or registration

const METHOD_SOP_OPTIONS = [
  "USP <790>",
  "USP <791>",
  "SOP-QC-042 (HPLC)",
  "SOP-KF-001",
  "SOP-MLT-001",
  "EP 2.2.3",
  "BP Appendix XIV",
];

const PHARMACOPOEIA_OPTIONS = [
  "USP-NF 2024 Edition",
  "BP 2024",
  "EP 10th Edition",
  "IP 2022",
  "JP XVII",
];

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function computeTargetSla(dateOfReceipt: string): string {
  const d = new Date(dateOfReceipt);
  d.setDate(d.getDate() + 3);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function TestSpecification({
  sampleId: propSampleId,
}: TestSpecificationProps) {
  const navigate = useNavigate();
  const { activeUser } = useRole();
  const { actor } = useActor();

  const [selectedSampleId, setSelectedSampleId] = useState(propSampleId || "");
  const sample = selectedSampleId ? getSampleById(selectedSampleId) : null;
  const analysts = DUMMY_USERS.filter((u) => u.role === "analyst");
  const testSpecSamples = SAMPLE_INTAKES.filter((s) => s.status === "TestSpec");

  const [rows, setRows] = useState<TestSpecRow[]>([]);

  // Load test spec from backend or from registration data when sample changes
  useEffect(() => {
    if (!selectedSampleId) {
      setRows([]);
      return;
    }
    const cachedSpecs = TEST_SPECS[selectedSampleId];
    if (cachedSpecs && cachedSpecs.length > 0) {
      setRows(cachedSpecs);
      return;
    }
    const loadSpec = async () => {
      try {
        if (actor) {
          const backendSpecs = await (actor as any).getTestSpec(
            selectedSampleId,
          );
          if (backendSpecs && backendSpecs.length > 0) {
            const mapped: TestSpecRow[] = backendSpecs.map(
              (s: any, i: number) => ({
                id: `ts-backend-${i}`,
                parameter: s.parameter,
                acceptanceCriteria: s.acceptanceCriteria,
                methodSop: s.method,
                referenceStandard: s.referenceStandard || "",
                qaNotes: "",
                assignedAnalyst: s.assignedAnalyst || "",
                targetSla: s.targetSLA ? String(Number(s.targetSLA)) : "",
              }),
            );
            setRows(mapped);
            TEST_SPECS[selectedSampleId] = mapped;
            return;
          }
        }
      } catch (err) {
        console.warn("getTestSpec failed:", err);
      }
      // Fallback: pre-populate from RFA/registration data
      const rfaRecord = RFA_RECORDS.find(
        (r) => r.sampleId === selectedSampleId,
      );
      if (rfaRecord?.sampleDetails && rfaRecord.sampleDetails.length > 0) {
        const paramSet = new Set<string>();
        for (const detail of rfaRecord.sampleDetails) {
          for (const p of detail.testParameters) paramSet.add(p);
        }
        const paramRows: TestSpecRow[] = Array.from(paramSet).map(
          (param, i) => ({
            id: `ts-reg-${i}`,
            parameter: param,
            acceptanceCriteria: "",
            methodSop: "",
            referenceStandard: "",
            qaNotes: "",
            assignedAnalyst: "",
            targetSla: "",
          }),
        );
        if (paramRows.length > 0) {
          setRows(paramRows);
          return;
        }
      }
      // Final fallback: empty rows so user can add manually
      setRows([]);
    };
    loadSpec();
  }, [selectedSampleId, actor]);

  // Page-level state (not per-row)
  const [pharmacopoeiaStandard, setPharmacopoeiaStandard] = useState(
    "USP-NF 2024 Edition",
  );
  const [secondaryRefBatchId, setSecondaryRefBatchId] = useState("");
  const [qaNotes, setQaNotes] = useState("");
  const [leadAnalyst, setLeadAnalyst] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const updateRow = (idx: number, key: keyof TestSpecRow, value: string) => {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [key]: value } : r)),
    );
  };

  const addParameter = () => {
    const newRow: TestSpecRow = {
      id: `ts-new-${Date.now()}`,
      parameter: "New Parameter",
      acceptanceCriteria: "",
      methodSop: "",
      referenceStandard: "",
      qaNotes: "",
      assignedAnalyst: "",
      targetSla: "",
    };
    setRows((prev) => [...prev, newRow]);
  };

  const handleSave = async () => {
    if (!selectedSampleId) return;
    setSubmitting(true);

    const updatedRows = rows.map((r) => ({
      ...r,
      assignedAnalyst: leadAnalyst,
      targetSla: sample?.dateOfReceipt
        ? (() => {
            const d = new Date(sample.dateOfReceipt);
            d.setDate(d.getDate() + 3);
            return d.toISOString().split("T")[0];
          })()
        : "",
    }));

    TEST_SPECS[selectedSampleId] = updatedRows;
    const idx = SAMPLE_INTAKES.findIndex(
      (s) => s.sampleId === selectedSampleId,
    );
    if (idx !== -1)
      SAMPLE_INTAKES[idx] = { ...SAMPLE_INTAKES[idx], status: "Analysis" };

    // Backend: save test specs and advance to Analysis stage
    if (actor && selectedSampleId) {
      try {
        const backendSpecs = updatedRows.map((r) => ({
          parameter: r.parameter,
          acceptanceCriteria: r.acceptanceCriteria,
          method: r.methodSop,
          referenceStandard: r.referenceStandard,
          assignedAnalyst: leadAnalyst,
          targetSLA: BigInt(3),
        }));
        await (actor as any).saveTestSpec(selectedSampleId, backendSpecs);
        if (leadAnalyst) {
          await (actor as any).assignAnalyst(selectedSampleId, leadAnalyst);
        }
      } catch (err) {
        console.warn("Backend saveTestSpec failed:", err);
      }
    }

    AUDIT_LOG.push({
      id: `al-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: activeUser.id,
      userName: activeUser.name,
      action: "CREATE",
      entity: "TestSpecification",
      entityId: selectedSampleId,
      details: `Test specifications assigned for ${rows.length} parameters`,
    });
    setSubmitting(false);
    toast.success("Test specifications saved", {
      description: "Sample advanced to Analysis stage",
    });
    navigate({
      to: "/analysis/$sampleId",
      params: { sampleId: selectedSampleId },
    });
  };

  const handleReject = async () => {
    if (!selectedSampleId) return;
    const rejectComment = prompt("Please enter a reason for rejection:");
    if (!rejectComment) return;
    setSubmitting(true);
    try {
      const idx = SAMPLE_INTAKES.findIndex(
        (s) => s.sampleId === selectedSampleId,
      );
      if (idx !== -1)
        SAMPLE_INTAKES[idx] = {
          ...SAMPLE_INTAKES[idx],
          status: "Registration",
        };
      toast.success("Returned to Registration for revision.");
      navigate({ to: "/registration" });
    } catch (_e) {
      toast.error("Failed to reject. Try again.");
    } finally {
      setSubmitting(false);
    }
  };
  // ─── Sample Selection Screen ────────────────────────────────────────────────
  if (!sample) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <button
              type="button"
              className="cursor-pointer hover:text-primary transition-colors bg-transparent border-0 p-0"
              onClick={() => navigate({ to: "/" })}
            >
              Dashboard
            </button>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">
              Test Specification & Assignment
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Test Specification
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure laboratory parameters and assign technical analysts
          </p>
        </div>

        <Card className="lims-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TestTube className="h-4 w-4 text-primary" />
              Select Sample for Test Specification
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testSpecSamples.length === 0 ? (
              <div
                data-ocid="testspec.empty_state"
                className="flex flex-col items-center gap-3 py-10 text-muted-foreground"
              >
                <AlertCircle className="h-8 w-8 opacity-40" />
                <span className="text-sm">
                  No samples pending test specification
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {testSpecSamples.map((s, i) => (
                  <button
                    type="button"
                    key={s.sampleId}
                    data-ocid={`testspec.item.${i + 1}`}
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

  // ─── Derive values ─────────────────────────────────────────────────────────
  const isHighPriority = !!(
    sample.specialHandling?.trim() &&
    sample.specialHandling.toLowerCase() !== "none"
  );
  const selectedAnalyst = analysts.find((a) => a.id === leadAnalyst);
  const targetSlaDisplay = sample.dateOfReceipt
    ? computeTargetSla(sample.dateOfReceipt)
    : "—";

  // ─── Main Layout ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* ── Top Header Bar ─────────────────────────────────────────────────── */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-[1400px] mx-auto">
          {/* Breadcrumb */}
          <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <button
              type="button"
              className="cursor-pointer hover:text-primary transition-colors bg-transparent border-0 p-0"
              data-ocid="testspec.link"
              onClick={() => navigate({ to: "/" })}
            >
              Dashboard
            </button>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">
              Test Specification & Assignment
            </span>
          </div>

          {/* Title row */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                Test Specification
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Configure laboratory parameters and assign technical analysts
                for sample{" "}
                <span className="font-semibold text-primary">
                  {sample.sampleId}
                </span>
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                data-ocid="testspec.secondary_button"
                onClick={() => navigate({ to: "/" })}
              >
                Discard Changes
              </Button>
              <Button
                variant="outline"
                size="sm"
                data-ocid="testspec.reject.button"
                onClick={handleReject}
                disabled={submitting}
                className="border-red-300 text-red-600 hover:bg-red-50 gap-1.5"
              >
                <XCircle className="h-3.5 w-3.5" />
                Reject
              </Button>
              <Button
                size="sm"
                data-ocid="testspec.primary_button"
                onClick={handleSave}
                disabled={submitting}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
              >
                {submitting ? (
                  <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : null}
                Save & Assign Analyst
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body: two-column layout ─────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-6 py-5 flex gap-5">
        {/* ── LEFT SIDEBAR ──────────────────────────────────────────────────── */}
        <aside className="w-72 shrink-0 space-y-4">
          {/* Registration Metadata Card */}
          <Card className="lims-card overflow-hidden">
            <div className="bg-muted/40 border-b border-border px-4 py-2.5">
              <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                Registration Metadata
              </p>
            </div>
            <CardContent className="p-4 space-y-4">
              {/* Sample ID */}
              <div>
                <p className="text-xl font-bold font-mono text-primary tracking-tight leading-tight">
                  {sample.sampleId}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <StatusBadge status={sample.status} />
                  <Badge
                    variant={isHighPriority ? "destructive" : "secondary"}
                    className="text-[10px] font-medium px-2 py-0.5"
                  >
                    {isHighPriority ? "High Priority" : "Standard"}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Metadata fields */}
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase mb-0.5">
                    Patient Name
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {sample.customerName}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase mb-0.5">
                    Sample Type
                  </p>
                  <p className="text-sm text-foreground">{sample.sampleType}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase mb-0.5">
                    Source
                  </p>
                  <p className="text-sm text-foreground">
                    {sample.physicalForm}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase mb-0.5">
                    Collection Date
                  </p>
                  <p className="text-sm text-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {formatDate(sample.dateOfReceipt)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase mb-0.5">
                    Initial Remarks
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {sample.specialHandling?.trim() &&
                    sample.specialHandling.toLowerCase() !== "none"
                      ? sample.specialHandling
                      : "No special handling notes."}
                  </p>
                </div>
              </div>

              {/* Info action box */}
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex gap-2">
                  <Info className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold tracking-widest text-blue-700 dark:text-blue-300 uppercase mb-1">
                      Incharge Action Required
                    </p>
                    <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
                      Define all critical parameters and acceptance criteria.
                      Analysts will be restricted to these specs during result
                      entry.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* ── RIGHT MAIN AREA ───────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* ── CARD 1: Parameter Configuration ─────────────────────────────── */}
          <Card className="lims-card">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">
                    Parameter Configuration
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Define specific testing criteria and reference methods
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  data-ocid="testspec.primary_button"
                  onClick={addParameter}
                  className="gap-1.5 text-xs shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Parameter
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-ocid="testspec.table">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border">
                      <th className="text-left py-3 px-4 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase whitespace-nowrap">
                        Test Parameter
                      </th>
                      <th className="text-left py-3 px-4 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase whitespace-nowrap">
                        Acceptance Criteria
                      </th>
                      <th className="text-left py-3 px-4 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase whitespace-nowrap">
                        Method / SOP
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr
                        key={row.id}
                        data-ocid={`testspec.row.${idx + 1}`}
                        className={`border-b border-border/50 ${idx % 2 === 0 ? "" : "bg-muted/10"}`}
                      >
                        {/* Parameter name — read-only */}
                        <td className="py-3 px-4 font-medium text-foreground whitespace-nowrap">
                          {row.parameter}
                        </td>

                        {/* Acceptance Criteria — editable input */}
                        <td className="py-2.5 px-4">
                          <Input
                            data-ocid={`testspec.input.${idx + 1}`}
                            value={row.acceptanceCriteria}
                            onChange={(e) =>
                              updateRow(
                                idx,
                                "acceptanceCriteria",
                                e.target.value,
                              )
                            }
                            className="h-8 text-xs min-w-[160px] max-w-[240px]"
                            placeholder="e.g. 98.0% - 102.0%"
                          />
                        </td>

                        {/* Method / SOP — Select dropdown */}
                        <td className="py-2.5 px-4">
                          <Select
                            value={row.methodSop}
                            onValueChange={(v) =>
                              updateRow(idx, "methodSop", v)
                            }
                          >
                            <SelectTrigger
                              data-ocid={`testspec.select.${idx + 1}`}
                              className="h-8 text-xs min-w-[180px] max-w-[220px]"
                            >
                              <SelectValue placeholder="Select method..." />
                            </SelectTrigger>
                            <SelectContent>
                              {METHOD_SOP_OPTIONS.map((opt) => (
                                <SelectItem
                                  key={opt}
                                  value={opt}
                                  className="text-xs"
                                >
                                  {opt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* ── CARD 2: Reference Standards + QA Notes ───────────────────────── */}
          <Card className="lims-card">
            <CardContent className="p-0">
              <div className="grid grid-cols-2 divide-x divide-border">
                {/* Left: Reference Standards */}
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center border border-amber-200 dark:border-amber-800">
                      <BookOpen className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        Reference Standards
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Pharmacopoeial references
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Pharmacopoeia Standard
                      </Label>
                      <Select
                        value={pharmacopoeiaStandard}
                        onValueChange={setPharmacopoeiaStandard}
                      >
                        <SelectTrigger
                          data-ocid="testspec.select"
                          className="h-9 text-sm"
                        >
                          <SelectValue placeholder="Select standard..." />
                        </SelectTrigger>
                        <SelectContent>
                          {PHARMACOPOEIA_OPTIONS.map((opt) => (
                            <SelectItem
                              key={opt}
                              value={opt}
                              className="text-sm"
                            >
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Secondary Reference Batch ID
                      </Label>
                      <Input
                        data-ocid="testspec.input"
                        value={secondaryRefBatchId}
                        onChange={(e) => setSecondaryRefBatchId(e.target.value)}
                        placeholder="e.g. STD-REF-992A"
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Right: QA Notes */}
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-green-50 dark:bg-green-950/30 flex items-center justify-center border border-green-200 dark:border-green-800">
                      <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        Quality Assurance Notes
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Instructions for the analyst
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      QA Notes
                    </Label>
                    <Textarea
                      data-ocid="testspec.textarea"
                      value={qaNotes}
                      onChange={(e) => setQaNotes(e.target.value)}
                      placeholder="Enter specific instructions for the analyst regarding safety, handling, or specific test nuances..."
                      className="text-sm resize-none min-h-[100px]"
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── CARD 3: Personnel Assignment ─────────────────────────────────── */}
          <Card className="lims-card">
            <CardHeader className="pb-3 border-b border-border">
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  Personnel Assignment
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select a qualified analyst to perform these tests
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {/* Analyst selector row */}
              <div className="flex flex-col lg:flex-row gap-4 lg:items-start">
                {/* Left: selector */}
                <div className="flex-1 space-y-2">
                  <Label className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                    Lead Analyst
                  </Label>
                  <Select value={leadAnalyst} onValueChange={setLeadAnalyst}>
                    <SelectTrigger
                      data-ocid="testspec.select"
                      className="h-10 text-sm"
                    >
                      <SelectValue placeholder="Select an analyst..." />
                    </SelectTrigger>
                    <SelectContent>
                      {analysts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          <div className="flex flex-col py-0.5">
                            <span className="text-sm font-medium">
                              {a.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {a.designation}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Right: Assignment verified badge */}
                {selectedAnalyst && (
                  <div className="lg:flex-1 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-700 rounded-lg p-3.5 flex gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold tracking-widest text-green-700 dark:text-green-300 uppercase">
                          Assignment Verified
                        </span>
                        <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700 text-[10px] py-0 px-1.5">
                          Active
                        </Badge>
                      </div>
                      <p className="text-[11px] text-green-700 dark:text-green-300 leading-relaxed">
                        <span className="font-semibold">
                          {selectedAnalyst.name}
                        </span>{" "}
                        holds active certifications for USP &lt;790&gt; and HPLC
                        Methodologies required for this sample type.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* SLA stats */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-muted/30 rounded-lg p-3.5 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                      Target SLA
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {targetSlaDisplay}
                  </p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3.5 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                      Estimated Effort
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    4.5 Man-Hours
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Footer Bar ──────────────────────────────────────────────────────── */}
      <div className="border-t border-border bg-card px-6 py-3 sticky bottom-0 z-10">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
          {/* Left: workflow status */}
          <div className="flex items-center gap-2">
            <Circle className="h-2.5 w-2.5 fill-green-500 text-green-500" />
            <span className="text-xs text-muted-foreground">
              Workflow status:{" "}
              <span className="font-medium text-foreground">
                Ready for Task Initiation
              </span>
            </span>
          </div>

          {/* Center: back */}
          <Button
            variant="ghost"
            size="sm"
            data-ocid="testspec.secondary_button"
            onClick={() => navigate({ to: "/" })}
            className="text-xs"
          >
            Back to Dashboard
          </Button>

          {/* Right: confirm */}
          <Button
            variant="outline"
            size="sm"
            data-ocid="testspec.footer.reject.button"
            onClick={handleReject}
            disabled={submitting}
            className="border-red-300 text-red-600 hover:bg-red-50 gap-1.5 text-xs"
          >
            <XCircle className="h-3 w-3" />
            Reject
          </Button>
          <Button
            size="sm"
            data-ocid="testspec.confirm_button"
            onClick={handleSave}
            disabled={submitting}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 text-xs"
          >
            {submitting ? (
              <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            Confirm &amp; Save Assignment
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
