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
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Info,
  Microscope,
  Save,
  XCircle,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "../components/StatusBadge";
import { useRole } from "../contexts/RoleContext";
import {
  ANALYSIS_RESULTS,
  AUDIT_LOG,
  type AnalysisResultRow,
  SAMPLE_INTAKES,
  TEST_SPECS,
  getSampleById,
} from "../lib/mockData";

interface AnalysisProps {
  sampleId?: string;
}

export function Analysis({ sampleId: propSampleId }: AnalysisProps) {
  const navigate = useNavigate();
  const { activeUser } = useRole();

  const [selectedSampleId, setSelectedSampleId] = useState(propSampleId || "");
  const sample = selectedSampleId ? getSampleById(selectedSampleId) : null;
  const analysisSamples = SAMPLE_INTAKES.filter((s) => s.status === "Analysis");

  const existingSpecs = TEST_SPECS[selectedSampleId] || [];
  const existingResults = ANALYSIS_RESULTS[selectedSampleId];

  const [rows, setRows] = useState<AnalysisResultRow[]>(
    existingResults ||
      existingSpecs.map((spec) => ({
        id: `ar-new-${spec.id}`,
        parameter: spec.parameter,
        acceptanceCriteria: spec.acceptanceCriteria,
        observedValue: "",
        unit: "",
        verdict: "" as const,
        testDateStart: new Date().toISOString().split("T")[0],
        testDateEnd: "",
        remarks: "",
      })),
  );

  const [analystRemarks, setAnalystRemarks] = useState("");
  const [overallResult, setOverallResult] = useState<"PASS" | "FAIL" | "">("");
  const [submitting, setSubmitting] = useState(false);

  const computedOverall = rows.some(
    (r) => r.verdict === "FAIL" || r.verdict === "OOS",
  )
    ? "FAIL"
    : rows.every((r) => r.verdict === "PASS")
      ? "PASS"
      : "";

  const updateRow = (
    idx: number,
    key: keyof AnalysisResultRow,
    value: string,
  ) => {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [key]: value } : r)),
    );
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 900));
    ANALYSIS_RESULTS[selectedSampleId] = rows;
    const idx = SAMPLE_INTAKES.findIndex(
      (s) => s.sampleId === selectedSampleId,
    );
    if (idx !== -1)
      SAMPLE_INTAKES[idx] = { ...SAMPLE_INTAKES[idx], status: "SICReview" };
    AUDIT_LOG.push({
      id: `al-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: activeUser.id,
      userName: activeUser.name,
      action: "SUBMIT",
      entity: "AnalysisResult",
      entityId: selectedSampleId,
      details: `Analysis results submitted — Overall: ${overallResult || computedOverall}`,
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
                <Microscope className="h-5 w-5 text-primary" />
                Analysis / Result Entry
              </h1>
              <p className="page-subtitle">
                Enter observed values and verdicts
              </p>
            </div>
          </div>
        </div>
        <Card className="lims-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Select Sample for Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysisSamples.length === 0 ? (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <Info className="h-4 w-4" />
                <span className="text-sm">No samples in analysis stage</span>
              </div>
            ) : (
              <div className="space-y-2">
                {analysisSamples.map((s) => (
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
    <div className="p-6 max-w-6xl mx-auto">
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
              <Microscope className="h-5 w-5 text-primary" />
              Analysis / Result Entry
            </h1>
            <p className="page-subtitle">
              {sample.sampleId} — {sample.sampleName}
            </p>
          </div>
        </div>
        <StatusBadge status={sample.status} />
      </div>

      <Card className="lims-card mb-6">
        <CardContent>
          <div className="table-scroll">
            <table className="w-full text-xs min-w-[900px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {[
                    "Parameter",
                    "Acceptance Criteria",
                    "Observed Value",
                    "Unit",
                    "Verdict",
                    "Test Start",
                    "Test End",
                    "Remarks",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left py-2.5 px-3 font-semibold text-muted-foreground whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={`border-b border-border/50 ${idx % 2 === 0 ? "" : "bg-muted/10"}`}
                  >
                    <td className="py-2 px-3 font-medium whitespace-nowrap">
                      {row.parameter}
                    </td>
                    <td className="py-2 px-3 text-muted-foreground whitespace-nowrap">
                      {row.acceptanceCriteria}
                    </td>
                    <td className="py-2 px-3">
                      <Input
                        value={row.observedValue}
                        onChange={(e) =>
                          updateRow(idx, "observedValue", e.target.value)
                        }
                        className="h-7 text-xs min-w-[80px]"
                        placeholder="Value"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <Input
                        value={row.unit}
                        onChange={(e) => updateRow(idx, "unit", e.target.value)}
                        className="h-7 text-xs min-w-[60px]"
                        placeholder="Unit"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <Select
                        value={row.verdict}
                        onValueChange={(v) => updateRow(idx, "verdict", v)}
                      >
                        <SelectTrigger
                          className={`h-7 text-xs min-w-[90px] ${row.verdict === "PASS" ? "border-emerald-400 text-emerald-700" : row.verdict === "FAIL" || row.verdict === "OOS" ? "border-red-400 text-red-700" : ""}`}
                        >
                          <SelectValue placeholder="Verdict" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PASS">✓ PASS</SelectItem>
                          <SelectItem value="FAIL">✗ FAIL</SelectItem>
                          <SelectItem value="OOS">⚠ OOS</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-2 px-3">
                      <Input
                        type="date"
                        value={row.testDateStart}
                        onChange={(e) =>
                          updateRow(idx, "testDateStart", e.target.value)
                        }
                        className="h-7 text-xs min-w-[110px]"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <Input
                        type="date"
                        value={row.testDateEnd}
                        onChange={(e) =>
                          updateRow(idx, "testDateEnd", e.target.value)
                        }
                        className="h-7 text-xs min-w-[110px]"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <Input
                        value={row.remarks}
                        onChange={(e) =>
                          updateRow(idx, "remarks", e.target.value)
                        }
                        className="h-7 text-xs min-w-[120px]"
                        placeholder="Remarks..."
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="lims-card">
          <CardContent className="p-4">
            <Label className="text-xs font-medium mb-2 block">
              Overall Result
            </Label>
            <div className="flex gap-2">
              {(["PASS", "FAIL"] as const).map((v) => (
                <button
                  type="button"
                  key={v}
                  onClick={() => setOverallResult(v)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                    (overallResult || computedOverall) === v
                      ? v === "PASS"
                        ? "bg-emerald-500 text-white border-emerald-500"
                        : "bg-red-500 text-white border-red-500"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  {v === "PASS" ? (
                    <CheckCircle2 className="h-4 w-4 inline mr-1" />
                  ) : (
                    <XCircle className="h-4 w-4 inline mr-1" />
                  )}
                  {v}
                </button>
              ))}
            </div>
            {computedOverall && !overallResult && (
              <p className="text-xs text-muted-foreground mt-1">
                Auto-computed: {computedOverall}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="lims-card">
          <CardContent className="p-4">
            <Label className="text-xs font-medium mb-2 block">
              Analyst Remarks
            </Label>
            <Textarea
              value={analystRemarks}
              onChange={(e) => setAnalystRemarks(e.target.value)}
              rows={3}
              placeholder="Overall analyst remarks and observations..."
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
          {submitting ? (
            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Submit Results for SIC Review
        </Button>
      </div>
    </div>
  );
}
