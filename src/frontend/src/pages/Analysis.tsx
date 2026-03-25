import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  History,
  Info,
  Lightbulb,
  Microscope,
  Paperclip,
  Save,
  Send,
  Shield,
  Trash2,
  Upload,
  XCircle,
  Zap,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "../components/StatusBadge";
import { useRole } from "../contexts/RoleContext";
import { useActor } from "../hooks/useActor";
import {
  ANALYSIS_RESULTS,
  AUDIT_LOG,
  type AnalysisResultRow,
  MOCK_TASKS,
  SAMPLE_INTAKES,
  TEST_SPECS,
  getSampleById,
  getUserById,
} from "../lib/mockData";

// ─────────────────────────────────────────────
// Auto-verdict logic: parse acceptance criteria
// and evaluate the observed value automatically
// ─────────────────────────────────────────────
function autoVerdict(
  acceptanceCriteria: string,
  observedValue: string,
): "PASS" | "FAIL" | "OOS" | "" {
  const val = Number.parseFloat(observedValue);
  if (!observedValue.trim() || Number.isNaN(val)) return "";

  const ac = acceptanceCriteria.trim();

  // Range: e.g. "98.0% - 102.0%" or "85% - 115%"
  const rangeMatch = ac.match(/(\d+\.?\d*)\s*%?\s*[-–]\s*(\d+\.?\d*)\s*%?/);
  if (rangeMatch) {
    const lo = Number.parseFloat(rangeMatch[1]);
    const hi = Number.parseFloat(rangeMatch[2]);
    if (val < lo || val > hi) return "OOS";
    return "PASS";
  }

  // NMT (Not More Than): e.g. "NMT 0.5%" or "NMT 1000 CFU/g" or "NMT 5 ppm"
  const nmtMatch = ac.match(/NMT\s+(\d+\.?\d*)/i);
  if (nmtMatch) {
    const limit = Number.parseFloat(nmtMatch[1]);
    if (val > limit) return "FAIL";
    return "PASS";
  }

  // NLT (Not Less Than): e.g. "NLT 80% in 45 min"
  const nltMatch = ac.match(/NLT\s+(\d+\.?\d*)/i);
  if (nltMatch) {
    const limit = Number.parseFloat(nltMatch[1]);
    if (val < limit) return "FAIL";
    return "PASS";
  }

  // pH range: e.g. "6.5 – 7.5" or "5.5 - 7.5"
  const phMatch = ac.match(/(\d+\.?\d*)\s*[–-]\s*(\d+\.?\d*)/);
  if (phMatch) {
    const lo = Number.parseFloat(phMatch[1]);
    const hi = Number.parseFloat(phMatch[2]);
    if (val < lo || val > hi) return "FAIL";
    return "PASS";
  }

  return "";
}

function buildRows(sampleId: string): AnalysisResultRow[] {
  const existingResults = ANALYSIS_RESULTS[sampleId];
  if (existingResults) return existingResults;
  const specs = TEST_SPECS[sampleId] || [];
  return specs.map((spec) => ({
    id: `ar-new-${spec.id}`,
    parameter: spec.parameter,
    acceptanceCriteria: spec.acceptanceCriteria,
    observedValue: "",
    unit: "",
    verdict: "" as const,
    testDateStart: new Date().toISOString().split("T")[0],
    testDateEnd: "",
    remarks: "",
  }));
}

// Dummy uploaded files for the reference design
const DUMMY_FILES = [
  { name: "HPLC_Peak_Report_322.pdf", size: "1.2 MB" },
  { name: "Observation_Log_002.docx", size: "410 KB" },
];

interface AnalysisProps {
  sampleId?: string;
}

export function Analysis({ sampleId: propSampleId }: AnalysisProps) {
  const navigate = useNavigate();
  const { activeUser } = useRole();
  const { actor } = useActor();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedSampleId, setSelectedSampleId] = useState(propSampleId || "");
  const sample = selectedSampleId ? getSampleById(selectedSampleId) : null;
  const analysisSamples = SAMPLE_INTAKES.filter((s) => s.status === "Analysis");

  const [rows, setRows] = useState<AnalysisResultRow[]>(() =>
    buildRows(propSampleId || ""),
  );

  const [analystRemarks, setAnalystRemarks] = useState("");
  const [overallResult, setOverallResult] = useState<"PASS" | "FAIL" | "">("");
  const [refBatch, setRefBatch] = useState("REF-2024-S1-00");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState(DUMMY_FILES);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showMethodSop, setShowMethodSop] = useState(false);
  const [showBatchHistory, setShowBatchHistory] = useState(false);

  // Pending queue: tasks for the analyst (sidebar)
  const pendingQueue = MOCK_TASKS.filter(
    (t) => t.taskType === "analysis" && t.assignedUserId === activeUser.id,
  );

  // Re-populate rows whenever the selected sample changes
  useEffect(() => {
    if (!selectedSampleId) return;
    const loadResults = async () => {
      // Try backend first
      if (actor) {
        try {
          const backendResults = await (actor as any).getAnalysisResult(
            selectedSampleId,
          );
          if (backendResults && backendResults.length > 0) {
            const mapped: AnalysisResultRow[] = backendResults.map(
              (r: any, i: number) => ({
                id: `ar-backend-${i}`,
                parameter: r.parameter,
                acceptanceCriteria: "",
                observedValue: r.observedValue,
                unit: r.unit,
                verdict:
                  r.verdict?.__kind__ === "pass"
                    ? "PASS"
                    : r.verdict?.__kind__ === "fail"
                      ? "FAIL"
                      : r.verdict?.__kind__ === "oos"
                        ? "OOS"
                        : ("" as const),
                testDateStart: new Date().toISOString().split("T")[0],
                testDateEnd: "",
                remarks: r.remark || "",
              }),
            );
            setRows(mapped);
            ANALYSIS_RESULTS[selectedSampleId] = mapped;
            setAnalystRemarks("");
            setOverallResult("");
            return;
          }
        } catch (err) {
          console.warn("getAnalysisResult failed:", err);
        }
      }
      setRows(buildRows(selectedSampleId));
      setAnalystRemarks("");
      setOverallResult("");
    };
    loadResults();
  }, [selectedSampleId, actor]);

  const computedOverall = rows.some(
    (r) => r.verdict === "FAIL" || r.verdict === "OOS",
  )
    ? "FAIL"
    : rows.every((r) => r.verdict === "PASS")
      ? "PASS"
      : "";

  const displayOverall = overallResult || computedOverall;

  // Update observed value and auto-compute verdict
  const updateObservedValue = (idx: number, value: string) => {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r;
        const verdict = autoVerdict(r.acceptanceCriteria, value);
        return { ...r, observedValue: value, verdict };
      }),
    );
  };

  const updateRow = (
    idx: number,
    key: keyof AnalysisResultRow,
    value: string,
  ) => {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [key]: value } : r)),
    );
  };

  const handleSaveProgress = async () => {
    setSaving(true);
    ANALYSIS_RESULTS[selectedSampleId] = rows;
    if (actor && selectedSampleId) {
      try {
        const backendResults = rows.map((r) => ({
          parameter: r.parameter,
          observedValue: r.observedValue,
          unit: r.unit,
          verdict:
            r.verdict === "PASS"
              ? { __kind__: "pass" }
              : r.verdict === "FAIL"
                ? { __kind__: "fail" }
                : { __kind__: "oos" },
          remark: r.remarks || "",
        }));
        await (actor as any).saveAnalysisResult(
          selectedSampleId,
          backendResults,
        );
      } catch (err) {
        console.warn("Backend saveAnalysisResult failed:", err);
      }
    }
    setSaving(false);
    toast.success("Progress saved");
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    ANALYSIS_RESULTS[selectedSampleId] = rows;
    const idx = SAMPLE_INTAKES.findIndex(
      (s) => s.sampleId === selectedSampleId,
    );
    if (idx !== -1)
      SAMPLE_INTAKES[idx] = { ...SAMPLE_INTAKES[idx], status: "SICReview" };

    // Backend: submit analysis and advance to SICReview stage
    if (actor && selectedSampleId) {
      try {
        const backendResults = rows.map((r) => ({
          parameter: r.parameter,
          observedValue: r.observedValue,
          unit: r.unit,
          verdict:
            r.verdict === "PASS"
              ? { __kind__: "pass" }
              : r.verdict === "FAIL"
                ? { __kind__: "fail" }
                : { __kind__: "oos" },
          remark: r.remarks || "",
        }));
        await (actor as any).saveAnalysisResult(
          selectedSampleId,
          backendResults,
        );
        await (actor as any).submitAnalysis(selectedSampleId);
      } catch (err) {
        console.warn("Backend submitAnalysis failed:", err);
      }
    }

    AUDIT_LOG.push({
      id: `al-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: activeUser.id,
      userName: activeUser.name,
      action: "SUBMIT",
      entity: "AnalysisResult",
      entityId: selectedSampleId,
      details: `Analysis results submitted — Overall: ${displayOverall}`,
    });
    setSubmitting(false);
    toast.success("Analysis results submitted", {
      description: "Sample advanced to Section In-Charge Review",
    });
    navigate({
      to: "/sic-review/$sampleId",
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
        SAMPLE_INTAKES[idx] = { ...SAMPLE_INTAKES[idx], status: "TestSpec" };
      toast.success("Returned to Test Specification for revision.");
      navigate({
        to: "/test-specification/$sampleId",
        params: { sampleId: selectedSampleId },
      });
    } catch (_e) {
      toast.error("Failed to reject. Try again.");
    } finally {
      setSubmitting(false);
    }
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const newFiles = files.map((f) => ({
      name: f.name,
      size: `${(f.size / 1024).toFixed(0)} KB`,
    }));
    setUploadedFiles((prev) => [...prev, ...newFiles]);
    toast.success(`${files.length} file(s) uploaded`);
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // SLA countdown (mock — 4h 22m remaining based on screenshot reference)
  const slaDeadline = new Date(
    Date.now() + 4 * 60 * 60 * 1000 + 22 * 60 * 1000,
  );
  const slaHours = Math.floor((slaDeadline.getTime() - Date.now()) / 3600000);
  const slaMins = Math.floor(
    ((slaDeadline.getTime() - Date.now()) % 3600000) / 60000,
  );

  // Determine SLA urgency color
  const slaColor =
    slaHours < 2
      ? "text-red-600"
      : slaHours < 6
        ? "text-amber-600"
        : "text-emerald-600";

  // Get specs for current sample (for method column)
  const testSpecs = TEST_SPECS[selectedSampleId] || [];

  if (!sample) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="page-header">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate({ to: "/" })}
              data-ocid="analysis.back.button"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="page-title flex items-center gap-2">
                <Microscope className="h-5 w-5 text-primary" />
                Analysis / Result Entry
              </h1>
              <p className="page-subtitle">Select a sample to begin analysis</p>
            </div>
          </div>
        </div>
        <Card className="lims-card">
          <CardContent className="p-4">
            {analysisSamples.length === 0 ? (
              <div
                className="flex items-center gap-2 text-muted-foreground py-4"
                data-ocid="analysis.empty_state"
              >
                <Info className="h-4 w-4" />
                <span className="text-sm">No samples in analysis stage</span>
              </div>
            ) : (
              <div className="space-y-2" data-ocid="analysis.sample.list">
                {analysisSamples.map((s, i) => (
                  <button
                    type="button"
                    key={s.sampleId}
                    onClick={() => setSelectedSampleId(s.sampleId)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors text-left"
                    data-ocid={`analysis.sample.item.${i + 1}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-primary font-medium">
                        {s.sampleId}
                      </span>
                      <span className="text-sm font-medium">
                        {s.sampleName}
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

  // Get the test spec entry for the current sample for method reference
  const specMap: Record<string, string> = {};
  for (const ts of testSpecs) {
    specMap[ts.parameter] = ts.methodSop;
  }

  return (
    <div className="flex gap-0 min-h-screen bg-[#f7f9fc]">
      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ── Top header bar ── */}
        <div className="bg-white border-b border-border px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate({ to: "/" })}
              className="h-8 w-8"
              data-ocid="analysis.back.button"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-slate-900 font-mono">
                  {sample.sampleId}
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono border-slate-300 text-slate-500"
                >
                  {/* use RFA number mock */}
                  Batch: B-AMX-2024-10
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Analyst Result Entry Workstation
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* SLA timer */}
            <div
              className={`flex items-center gap-1.5 text-xs font-medium ${slaColor}`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>
                {slaHours}h {slaMins}m Remaining
              </span>
              <span className="text-muted-foreground font-normal">
                · SLA Onset: 22 Hours
              </span>
            </div>
            {/* Audit trail */}
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-slate-600"
              data-ocid="analysis.audit_trail.button"
            >
              <Shield className="h-3.5 w-3.5" />
              Audit Trail
            </Button>
          </div>
        </div>

        {/* ── Meta row ── */}
        <div className="bg-white border-b border-border px-6 py-2.5 grid grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-muted-foreground uppercase tracking-wide text-[10px] font-semibold block">
              Product Name
            </span>
            <span className="font-semibold text-slate-800">
              {sample.sampleName}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground uppercase tracking-wide text-[10px] font-semibold block">
              Sample Type
            </span>
            <span className="font-semibold text-slate-800">
              {sample.physicalForm}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground uppercase tracking-wide text-[10px] font-semibold block">
              Section
            </span>
            <span className="font-semibold text-slate-800">
              {sample.sampleType}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground uppercase tracking-wide text-[10px] font-semibold block">
              Assigned Date
            </span>
            <span className="font-semibold text-slate-800">
              {new Date(sample.createdAt).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* ── Test Specification Parameters card ── */}
          <Card className="bg-white shadow-sm border border-border">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800">
                  Test Specification Parameters
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Input observed values against defined acceptance criteria
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
                <Zap className="h-3 w-3" />
                Auto-validation enabled
              </div>
            </div>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table
                  className="w-full text-xs"
                  data-ocid="analysis.params.table"
                >
                  <thead>
                    <tr className="border-b border-border bg-slate-50/70">
                      <th className="text-left py-2.5 px-4 font-semibold text-slate-600 w-[22%]">
                        Parameter
                      </th>
                      <th className="text-left py-2.5 px-3 font-semibold text-slate-600 w-[12%]">
                        Method
                      </th>
                      <th className="text-left py-2.5 px-3 font-semibold text-slate-600 w-[20%]">
                        Acceptance Criteria
                      </th>
                      <th className="text-left py-2.5 px-3 font-semibold text-slate-600 w-[18%]">
                        Observed Value
                      </th>
                      <th className="text-left py-2.5 px-3 font-semibold text-slate-600 w-[8%]">
                        Unit
                      </th>
                      <th className="text-left py-2.5 px-3 font-semibold text-slate-600 w-[12%]">
                        Verdict
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-8 text-center text-muted-foreground"
                          data-ocid="analysis.params.empty_state"
                        >
                          No test parameters configured for this sample.
                        </td>
                      </tr>
                    )}
                    {rows.map((row, idx) => {
                      const verdictLabel = row.verdict;
                      const isPass = verdictLabel === "PASS";
                      const isFail =
                        verdictLabel === "FAIL" || verdictLabel === "OOS";
                      const isPending = !verdictLabel;

                      return (
                        <tr
                          key={row.id}
                          className="border-b border-border/40 hover:bg-slate-50/50 transition-colors"
                          data-ocid={`analysis.params.row.${idx + 1}`}
                        >
                          {/* Parameter */}
                          <td className="py-3 px-4 font-medium text-slate-800">
                            {row.parameter}
                          </td>

                          {/* Method */}
                          <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                            {specMap[row.parameter] || "—"}
                          </td>

                          {/* Acceptance Criteria */}
                          <td className="py-3 px-3">
                            <span
                              className={`font-mono font-semibold text-xs ${
                                isPass
                                  ? "text-emerald-700"
                                  : isFail
                                    ? "text-red-600"
                                    : "text-slate-500"
                              }`}
                            >
                              {row.acceptanceCriteria}
                            </span>
                          </td>

                          {/* Observed Value input */}
                          <td className="py-2.5 px-3">
                            <Input
                              value={row.observedValue}
                              onChange={(e) =>
                                updateObservedValue(idx, e.target.value)
                              }
                              className={`h-8 text-xs font-mono w-[110px] ${
                                isFail
                                  ? "border-red-400 bg-red-50 focus-visible:ring-red-400 text-red-700"
                                  : isPass
                                    ? "border-emerald-400 bg-emerald-50/50"
                                    : ""
                              }`}
                              placeholder="Enter value"
                              data-ocid={`analysis.params.observed_value.input.${idx + 1}`}
                            />
                          </td>

                          {/* Unit */}
                          <td className="py-2.5 px-3">
                            <Input
                              value={row.unit}
                              onChange={(e) =>
                                updateRow(idx, "unit", e.target.value)
                              }
                              className="h-8 text-xs w-[70px]"
                              placeholder="%"
                              data-ocid={`analysis.params.unit.input.${idx + 1}`}
                            />
                          </td>

                          {/* Verdict badge — auto-computed */}
                          <td className="py-2.5 px-3">
                            {isPending ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                                Pending
                              </span>
                            ) : row.verdict === "OOS" ? (
                              <span
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-600 text-white border border-red-700"
                                data-ocid={`analysis.params.verdict.${idx + 1}`}
                              >
                                <XCircle className="h-3 w-3" />
                                OOS FAIL
                              </span>
                            ) : isPass ? (
                              <span
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-300"
                                data-ocid={`analysis.params.verdict.${idx + 1}`}
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                PASS
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-100 text-red-700 border border-red-300"
                                data-ocid={`analysis.params.verdict.${idx + 1}`}
                              >
                                <XCircle className="h-3 w-3" />
                                FAIL
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* ── Supporting Documentation ── */}
          <Card className="bg-white shadow-sm border border-border">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-slate-500" />
                <h2 className="text-sm font-bold text-slate-800">
                  Supporting Documentation
                </h2>
              </div>
              <span className="text-xs text-muted-foreground">
                Max file size: 25MB
              </span>
            </div>
            <CardContent className="p-5 space-y-4">
              {/* Drop zone */}
              <button
                type="button"
                className={`w-full rounded-xl border-2 border-dashed transition-colors text-center py-8 px-4 cursor-pointer ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                data-ocid="analysis.docs.dropzone"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <Upload className="h-5 w-5 text-blue-500" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    Click or drag files to upload
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Upload chromatograms, spectral data, or raw log sheets
                  </p>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  const newFiles = files.map((f) => ({
                    name: f.name,
                    size: `${(f.size / 1024).toFixed(0)} KB`,
                  }));
                  setUploadedFiles((prev) => [...prev, ...newFiles]);
                  toast.success(`${files.length} file(s) uploaded`);
                }}
                data-ocid="analysis.docs.upload_button"
              />

              {/* Uploaded files list */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  {uploadedFiles.map((file, i) => (
                    <div
                      key={`${file.name}-${i}`}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white"
                      data-ocid={`analysis.docs.file.item.${i + 1}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-blue-50 border border-blue-100 flex items-center justify-center">
                          <FileText className="h-3.5 w-3.5 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-700">
                            {file.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {file.size}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                        data-ocid={`analysis.docs.delete_button.${i + 1}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Final Certification & Disposition ── */}
          <Card className="bg-white shadow-sm border border-border">
            <div className="px-5 py-3.5 border-b border-border">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-800">
                  Final Certification & Disposition
                </h2>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Required before moving to QA Review stage
              </p>
            </div>
            <CardContent className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                {/* Overall Result */}
                <div className="space-y-2">
                  <label
                    htmlFor="overall-result-group"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Overall Result
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setOverallResult("PASS")}
                      className={`flex-1 py-2.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        displayOverall === "PASS"
                          ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                      data-ocid="analysis.overall.pass.button"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      PASS
                    </button>
                    <button
                      type="button"
                      onClick={() => setOverallResult("FAIL")}
                      className={`flex-1 py-2.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        displayOverall === "FAIL"
                          ? "bg-red-500 text-white border-red-500 shadow-sm"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                      data-ocid="analysis.overall.fail.button"
                    >
                      <XCircle className="h-4 w-4" />
                      FAIL / OOS
                    </button>
                  </div>
                  {computedOverall && !overallResult && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Zap className="h-3 w-3 text-emerald-500" />
                      Auto-computed from parameter verdicts: {computedOverall}
                    </p>
                  )}
                </div>

                {/* Reference Standard Batch */}
                <div className="space-y-2">
                  <label
                    htmlFor="ref-batch-input"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Reference Standard Batch
                  </label>
                  <Input
                    id="ref-batch-input"
                    value={refBatch}
                    onChange={(e) => setRefBatch(e.target.value)}
                    placeholder="REF-2024-S1-00"
                    className="text-xs"
                    data-ocid="analysis.ref_batch.input"
                  />
                </div>
              </div>

              {/* Start Date / End Date */}
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label
                    htmlFor="analysis-start-date"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Start Date
                  </label>
                  <input
                    id="analysis-start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    data-ocid="analysis.start_date.input"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="analysis-end-date"
                    className="text-xs font-semibold text-slate-700"
                  >
                    End Date
                  </label>
                  <input
                    id="analysis-end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || undefined}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    data-ocid="analysis.end_date.input"
                  />
                </div>
              </div>

              {/* Analyst Remarks */}
              <div className="space-y-2">
                <label
                  htmlFor="analyst-remarks"
                  className="text-xs font-semibold text-slate-700"
                >
                  Analyst Remarks & Observations
                </label>
                <Textarea
                  id="analyst-remarks"
                  value={analystRemarks}
                  onChange={(e) => setAnalystRemarks(e.target.value)}
                  rows={3}
                  placeholder="Detail any observations or deviations during testing..."
                  className="text-xs resize-none"
                  data-ocid="analysis.remarks.textarea"
                />
              </div>

              {/* Footer action row */}
              <div className="flex items-center justify-between pt-1 border-t border-border">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Info className="h-3 w-3" />
                  Actions are logged to Camunda workflow instance #721
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveProgress}
                    disabled={saving}
                    className="gap-1.5 text-xs h-8"
                    data-ocid="analysis.save_progress.button"
                  >
                    {saving ? (
                      <span className="h-3 w-3 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    Save Progress
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReject}
                    disabled={submitting}
                    className="gap-1.5 text-xs h-8 border-red-300 text-red-600 hover:bg-red-50"
                    data-ocid="analysis.reject.button"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="gap-1.5 text-xs h-8 bg-blue-600 hover:bg-blue-700"
                    data-ocid="analysis.submit.button"
                  >
                    {submitting ? (
                      <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    Submit to QA Review
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Collapsible: Method SOP Highlights ── */}
          <Card className="bg-white shadow-sm border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setShowMethodSop((v) => !v)}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors"
              data-ocid="analysis.method_sop.toggle"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-semibold text-slate-800">
                  Method SOP Highlights
                </span>
              </div>
              {showMethodSop ? (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-400" />
              )}
            </button>
            {showMethodSop && (
              <CardContent className="px-5 pb-4 pt-0 border-t border-border">
                <div className="space-y-2 pt-3">
                  {testSpecs.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No SOP details available.
                    </p>
                  ) : (
                    testSpecs.map((ts) => (
                      <div
                        key={ts.id}
                        className="flex items-start gap-3 text-xs"
                      >
                        <span className="font-mono text-slate-400 whitespace-nowrap">
                          {ts.methodSop}
                        </span>
                        <span className="text-slate-600">{ts.parameter}</span>
                        {ts.qaNotes && (
                          <span className="text-amber-600 italic">
                            — {ts.qaNotes}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            )}
          </Card>

          {/* ── Collapsible: Related Batch History ── */}
          <Card className="bg-white shadow-sm border border-border overflow-hidden mb-4">
            <button
              type="button"
              onClick={() => setShowBatchHistory((v) => !v)}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors"
              data-ocid="analysis.batch_history.toggle"
            >
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-semibold text-slate-800">
                  Related Batch History
                </span>
              </div>
              {showBatchHistory ? (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-400" />
              )}
            </button>
            {showBatchHistory && (
              <CardContent className="px-5 pb-4 pt-0 border-t border-border">
                <div className="pt-3 text-xs text-muted-foreground">
                  No related batch history found for this sample.
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* ── Footer status bar ── */}
        <div className="bg-white border-t border-border px-6 py-2 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>© 2024 Pharmacy Lab Manager v2.4.0</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            Server: PHARM-LAB-01
          </div>
          <div className="flex items-center gap-3">
            <button type="button" className="hover:underline">
              Support Portal
            </button>
            <button type="button" className="hover:underline">
              Compliance Docs
            </button>
            <button type="button" className="hover:underline">
              Audit Log
            </button>
          </div>
        </div>
      </div>

      {/* ── Right sidebar ── */}
      <div className="w-72 bg-white border-l border-border flex flex-col flex-shrink-0">
        {/* Pending queue */}
        <div className="px-4 py-3.5 border-b border-border flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            My Pending Queue
          </span>
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
            {Math.max(pendingQueue.length, 5)} Tasks
          </span>
        </div>

        {/* Current task — highlighted */}
        <div className="mx-3 mt-3 rounded-lg border border-blue-200 bg-blue-50/60 p-3 mb-1">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-xs font-bold text-blue-700">
              {sample.sampleId}
            </span>
            <span className="text-[9px] font-bold bg-blue-600 text-white rounded-full px-2 py-0.5">
              In Progress
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-700 truncate">
            {sample.sampleName}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            SLA: {slaHours}h {slaMins}m
          </p>
        </div>

        {/* Other queued samples */}
        {[
          {
            id: "SMP-2024-0895",
            name: "Paracetamol BP",
            sla: "12h 19m",
            badge: "",
            badgeColor: "",
          },
          {
            id: "SMP-2024-0001",
            name: "Ciprofloxacin",
            sla: "MISSED",
            badge: "Overdue",
            badgeColor: "bg-red-100 text-red-600",
          },
          {
            id: "SMP-2024-0004",
            name: "Ibuprofen 400mg",
            sla: "12h 24h",
            badge: "",
            badgeColor: "",
          },
        ].map((item, i) => (
          <div
            key={item.id}
            className="mx-3 mt-2 rounded-lg border border-border bg-white p-3 cursor-pointer hover:border-slate-300 transition-colors"
            data-ocid={`analysis.queue.item.${i + 1}`}
          >
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-mono text-[10px] font-semibold text-slate-600">
                {item.id}
              </span>
              {item.badge && (
                <span
                  className={`text-[9px] font-bold rounded-full px-1.5 py-0.5 ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-700 font-medium">{item.name}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              SLA: {item.sla}
            </p>
          </div>
        ))}

        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="mx-3 mt-3 text-xs text-blue-600 hover:underline text-center py-1"
          data-ocid="analysis.queue.view_all.button"
        >
          View All in Dashboard
        </button>

        {/* Analyst Quick Tips */}
        <div className="mx-3 mt-4 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">
              Analyst Quick Tips
            </span>
          </div>
          <ul className="space-y-1.5 text-[10px] text-slate-700">
            <li className="flex items-start gap-1.5">
              <span className="text-amber-500 mt-0.5">›</span>
              Ensure all units match the master specification.
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-amber-500 mt-0.5">›</span>
              OOS results must be reported immediately to Section Incharge
              before submission.
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-amber-500 mt-0.5">›</span>
              Attachments must be clearly titled with Test Parameter name.
            </li>
          </ul>
        </div>

        <div className="flex-1" />

        {/* System status (bottom) */}
        <div className="px-4 py-2.5 border-t border-border">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            Camunda Engine Active
          </div>
        </div>
      </div>
    </div>
  );
}
