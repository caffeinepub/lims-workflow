import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  Flag,
  Info,
  RotateCcw,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "../components/StatusBadge";
import { useRole } from "../contexts/RoleContext";
import {
  ANALYSIS_RESULTS,
  AUDIT_LOG,
  SAMPLE_INTAKES,
  getSampleById,
} from "../lib/mockData";

interface SICReviewProps {
  sampleId?: string;
}

export function SICReview({ sampleId: propSampleId }: SICReviewProps) {
  const navigate = useNavigate();
  const { activeUser } = useRole();

  const [selectedSampleId, setSelectedSampleId] = useState(propSampleId || "");
  const sample = selectedSampleId ? getSampleById(selectedSampleId) : null;
  const sicSamples = SAMPLE_INTAKES.filter((s) => s.status === "SICReview");
  const results = ANALYSIS_RESULTS[selectedSampleId] || [];

  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [flagReasons, setFlagReasons] = useState<Record<string, string>>({});
  const [returnComment, setReturnComment] = useState("");
  const [signature, setSignature] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [returnError, setReturnError] = useState("");

  const anyFlagged = Object.values(flags).some(Boolean);
  const canApprove = !anyFlagged && !!signature.trim();

  const handleDecision = async (decision: "approve" | "return") => {
    if (decision === "return" && !returnComment.trim()) {
      setReturnError("Please provide a reason for returning to analyst");
      return;
    }
    setReturnError("");
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));

    const idx = SAMPLE_INTAKES.findIndex(
      (s) => s.sampleId === selectedSampleId,
    );
    if (idx !== -1) {
      SAMPLE_INTAKES[idx] = {
        ...SAMPLE_INTAKES[idx],
        status: decision === "approve" ? "QAReview" : "Analysis",
      };
    }
    AUDIT_LOG.push({
      id: `al-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: activeUser.id,
      userName: activeUser.name,
      action: decision === "approve" ? "APPROVE" : "RETURN",
      entity: "ReviewRecord",
      entityId: selectedSampleId,
      details:
        decision === "approve"
          ? `SIC review approved by ${activeUser.name}`
          : `Returned to analyst: ${returnComment}`,
    });

    setSubmitting(false);
    if (decision === "approve") {
      toast.success("SIC Review Approved", {
        description: "Sample advanced to QA Review",
      });
      navigate({
        to: "/qa-review/$sampleId",
        params: { sampleId: selectedSampleId },
      });
    } else {
      toast.warning("Returned to Analyst", { description: returnComment });
      navigate({ to: "/" });
    }
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
                <Eye className="h-5 w-5 text-primary" />
                Section In-Charge Review
              </h1>
              <p className="page-subtitle">
                Review analyst results and approve or return
              </p>
            </div>
          </div>
        </div>
        <Card className="lims-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Select Sample for SIC Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sicSamples.length === 0 ? (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <Info className="h-4 w-4" />
                <span className="text-sm">No samples pending SIC review</span>
              </div>
            ) : (
              <div className="space-y-2">
                {sicSamples.map((s) => (
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
              <Eye className="h-5 w-5 text-primary" />
              Section In-Charge Review
            </h1>
            <p className="page-subtitle">
              {sample.sampleId} — {sample.sampleName}
            </p>
          </div>
        </div>
        <StatusBadge status={sample.status} />
      </div>

      <Card className="lims-card mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            Analysis Results Review
          </CardTitle>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <Info className="h-4 w-4" />
              <span className="text-sm">
                No analysis results found for this sample
              </span>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {[
                      "Parameter",
                      "Acceptance Criteria",
                      "Observed Value",
                      "Unit",
                      "Verdict",
                      "Remarks",
                      "Flag",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left py-2.5 px-3 font-semibold text-muted-foreground text-xs whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((row, idx) => (
                    <React.Fragment key={row.id}>
                      <tr
                        className={`border-b border-border/50 ${idx % 2 === 0 ? "" : "bg-muted/10"} ${flags[row.id] ? "bg-red-50" : ""}`}
                      >
                        <td className="py-2.5 px-3 font-medium text-xs">
                          {row.parameter}
                        </td>
                        <td className="py-2.5 px-3 text-xs text-muted-foreground">
                          {row.acceptanceCriteria}
                        </td>
                        <td className="py-2.5 px-3 text-xs font-semibold">
                          {row.observedValue}
                        </td>
                        <td className="py-2.5 px-3 text-xs text-muted-foreground">
                          {row.unit}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                              row.verdict === "PASS"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : row.verdict === "FAIL"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : row.verdict === "OOS"
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-gray-50 text-gray-600 border-gray-200"
                            }`}
                          >
                            {row.verdict || "Pending"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-xs text-muted-foreground">
                          {row.remarks}
                        </td>
                        <td className="py-2.5 px-3">
                          <button
                            type="button"
                            onClick={() =>
                              setFlags((prev) => ({
                                ...prev,
                                [row.id]: !prev[row.id],
                              }))
                            }
                            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                              flags[row.id]
                                ? "bg-red-100 text-red-700 border border-red-300"
                                : "bg-muted text-muted-foreground hover:bg-red-50 hover:text-red-600"
                            }`}
                          >
                            <Flag className="h-3 w-3" />
                            {flags[row.id] ? "Flagged" : "Flag"}
                          </button>
                        </td>
                      </tr>
                      {flags[row.id] && (
                        <tr className="bg-red-50 border-b border-red-100">
                          <td colSpan={7} className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-red-700 font-medium">
                                Flag reason:
                              </span>
                              <input
                                className="flex-1 text-xs border border-red-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-red-400"
                                placeholder="Describe the issue..."
                                value={flagReasons[row.id] || ""}
                                onChange={(e) =>
                                  setFlagReasons((prev) => ({
                                    ...prev,
                                    [row.id]: e.target.value,
                                  }))
                                }
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="lims-card">
          <CardContent className="p-4">
            <Label className="text-xs font-medium mb-2 block">
              Reviewer Signature <span className="text-destructive">*</span>
            </Label>
            <input
              className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Type your full name as signature"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Date: {new Date().toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
        <Card className="lims-card">
          <CardContent className="p-4">
            <Label className="text-xs font-medium mb-2 block">
              Return to Analyst — Reason
            </Label>
            <Textarea
              value={returnComment}
              onChange={(e) => {
                setReturnComment(e.target.value);
                setReturnError("");
              }}
              rows={3}
              placeholder="Required if returning to analyst..."
              className={returnError ? "border-destructive" : ""}
            />
            {returnError && (
              <p className="text-xs text-destructive mt-1">{returnError}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {anyFlagged && (
        <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2">
          <Flag className="h-4 w-4 text-amber-600" />
          <p className="text-sm text-amber-700">
            {Object.values(flags).filter(Boolean).length} parameter(s) flagged —
            Approve button is disabled until all flags are resolved
          </p>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => handleDecision("return")}
          disabled={submitting}
          className="gap-2"
        >
          {submitting ? (
            <span className="h-4 w-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
          ) : (
            <RotateCcw className="h-4 w-4" />
          )}
          Return to Analyst
        </Button>
        <Button
          onClick={() => handleDecision("approve")}
          disabled={!canApprove || submitting}
          className="gap-2"
        >
          {submitting ? (
            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          Approve & Send to QA
        </Button>
      </div>
      {!signature.trim() && !anyFlagged && (
        <p className="text-xs text-muted-foreground text-right mt-2">
          Enter your signature to enable approval
        </p>
      )}
    </div>
  );
}
