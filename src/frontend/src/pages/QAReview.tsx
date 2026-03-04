import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Info,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "../components/StatusBadge";
import { useRole } from "../contexts/RoleContext";
import {
  ANALYSIS_RESULTS,
  AUDIT_LOG,
  type COARecord,
  COA_RECORDS,
  SAMPLE_INTAKES,
  getSampleById,
} from "../lib/mockData";

interface QAReviewProps {
  sampleId?: string;
}

export function QAReview({ sampleId: propSampleId }: QAReviewProps) {
  const navigate = useNavigate();
  const { activeUser } = useRole();

  const [selectedSampleId, setSelectedSampleId] = useState(propSampleId || "");
  const sample = selectedSampleId ? getSampleById(selectedSampleId) : null;
  const qaSamples = SAMPLE_INTAKES.filter((s) => s.status === "QAReview");
  const results = ANALYSIS_RESULTS[selectedSampleId] || [];

  const [rejections, setRejections] = useState<Record<string, boolean>>({});
  const [rejectionReasons, setRejectionReasons] = useState<
    Record<string, string>
  >({});
  const [qaSignature, setQaSignature] = useState("");
  const [qaSignDate, setQaSignDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [returnComment, setReturnComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [returnError, setReturnError] = useState("");

  const anyRejected = Object.values(rejections).some(Boolean);
  const canApprove = !anyRejected && !!qaSignature.trim();

  const handleDecision = async (decision: "approve" | "reject") => {
    if (decision === "reject" && !returnComment.trim()) {
      setReturnError("Please provide a reason for rejection");
      return;
    }
    setReturnError("");
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 900));

    const idx = SAMPLE_INTAKES.findIndex(
      (s) => s.sampleId === selectedSampleId,
    );
    if (idx !== -1) {
      SAMPLE_INTAKES[idx] = {
        ...SAMPLE_INTAKES[idx],
        status: decision === "approve" ? "COA" : "SICReview",
      };
    }

    if (decision === "approve") {
      const coaNumber = `COA-2026-${String(COA_RECORDS.length + 1).padStart(3, "0")}`;
      const newCOA: COARecord = {
        id: `coa-${Date.now()}`,
        sampleId: selectedSampleId,
        coaNumber,
        registrationNumber: `REG-2026-${selectedSampleId.split("-")[2]}`,
        clientName: sample?.customerName || "",
        sampleName: sample?.sampleName || "",
        issueDate: new Date().toISOString().split("T")[0],
        analystName: "Elena Rodriguez",
        sicReviewerName: activeUser.name,
        qaApproverName: qaSignature,
        analystSignDate: new Date(Date.now() - 86400000 * 2)
          .toISOString()
          .split("T")[0],
        sicSignDate: new Date(Date.now() - 86400000)
          .toISOString()
          .split("T")[0],
        qaSignDate,
        parameters: results.map((r) => ({
          parameter: r.parameter,
          acceptanceCriteria: r.acceptanceCriteria,
          observedValue: r.observedValue,
          unit: r.unit,
          verdict: r.verdict,
        })),
        overallResult: results.some(
          (r) => r.verdict === "FAIL" || r.verdict === "OOS",
        )
          ? "FAIL"
          : "PASS",
        complianceStatement:
          "This product complies with the specifications as per USP/BP/IP standards.",
      };
      COA_RECORDS.push(newCOA);
    }

    AUDIT_LOG.push({
      id: `al-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: activeUser.id,
      userName: activeUser.name,
      action: decision === "approve" ? "APPROVE" : "REJECT",
      entity: "QAReview",
      entityId: selectedSampleId,
      details:
        decision === "approve"
          ? `QA review approved by ${qaSignature} — COA generated`
          : `QA review rejected: ${returnComment}`,
    });

    setSubmitting(false);
    if (decision === "approve") {
      toast.success("QA Review Approved — COA Generated", {
        description: "Sample is now complete",
      });
      navigate({
        to: "/coa/$sampleId",
        params: { sampleId: selectedSampleId },
      });
    } else {
      toast.warning("Returned to SIC Review", { description: returnComment });
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
                <ShieldCheck className="h-5 w-5 text-primary" />
                QA Review
              </h1>
              <p className="page-subtitle">
                Final quality assurance review before COA issuance
              </p>
            </div>
          </div>
        </div>
        <Card className="lims-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Select Sample for QA Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            {qaSamples.length === 0 ? (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <Info className="h-4 w-4" />
                <span className="text-sm">No samples pending QA review</span>
              </div>
            ) : (
              <div className="space-y-2">
                {qaSamples.map((s) => (
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
              <ShieldCheck className="h-5 w-5 text-primary" />
              QA Review
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
            Parameter Review
          </CardTitle>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <Info className="h-4 w-4" />
              <span className="text-sm">No analysis results found</span>
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
                      "Reject",
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
                        className={`border-b border-border/50 ${idx % 2 === 0 ? "" : "bg-muted/10"} ${rejections[row.id] ? "bg-red-50" : ""}`}
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
                        <td className="py-2.5 px-3">
                          <button
                            type="button"
                            onClick={() =>
                              setRejections((prev) => ({
                                ...prev,
                                [row.id]: !prev[row.id],
                              }))
                            }
                            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                              rejections[row.id]
                                ? "bg-red-100 text-red-700 border border-red-300"
                                : "bg-muted text-muted-foreground hover:bg-red-50 hover:text-red-600"
                            }`}
                          >
                            <XCircle className="h-3 w-3" />
                            {rejections[row.id] ? "Rejected" : "Reject"}
                          </button>
                        </td>
                      </tr>
                      {rejections[row.id] && (
                        <tr className="bg-red-50 border-b border-red-100">
                          <td colSpan={6} className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-red-700 font-medium">
                                Rejection reason:
                              </span>
                              <input
                                className="flex-1 text-xs border border-red-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-red-400"
                                placeholder="Describe the rejection reason..."
                                value={rejectionReasons[row.id] || ""}
                                onChange={(e) =>
                                  setRejectionReasons((prev) => ({
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
          <CardContent className="p-4 space-y-3">
            <div>
              <Label className="text-xs font-medium mb-1.5 block">
                QA Approver Signature{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Type full name as signature"
                value={qaSignature}
                onChange={(e) => setQaSignature(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs font-medium mb-1.5 block">
                Signature Date
              </Label>
              <Input
                type="date"
                value={qaSignDate}
                onChange={(e) => setQaSignDate(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
        <Card className="lims-card">
          <CardContent className="p-4">
            <Label className="text-xs font-medium mb-2 block">
              Rejection / Return Reason
            </Label>
            <Textarea
              value={returnComment}
              onChange={(e) => {
                setReturnComment(e.target.value);
                setReturnError("");
              }}
              rows={4}
              placeholder="Required if rejecting..."
              className={returnError ? "border-destructive" : ""}
            />
            {returnError && (
              <p className="text-xs text-destructive mt-1">{returnError}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => handleDecision("reject")}
          disabled={submitting}
          className="gap-2"
        >
          {submitting ? (
            <span className="h-4 w-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
          ) : (
            <RotateCcw className="h-4 w-4" />
          )}
          Reject & Return to SIC
        </Button>
        <Button
          onClick={() => handleDecision("approve")}
          disabled={!canApprove || submitting}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700"
        >
          {submitting ? (
            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          Approve & Generate COA
        </Button>
      </div>
    </div>
  );
}
