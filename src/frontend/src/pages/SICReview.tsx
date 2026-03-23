import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock,
  ExternalLink,
  FileText,
  Info,
  Printer,
  Shield,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "../components/StatusBadge";
import { useRole } from "../contexts/RoleContext";
import { useActor } from "../hooks/useActor";
import {
  ANALYSIS_RESULTS,
  AUDIT_LOG,
  SAMPLE_INTAKES,
  getSampleById,
} from "../lib/mockData";

interface SICReviewProps {
  sampleId?: string;
}

const COA_TEST_PARAMS = [
  {
    parameter: "Appearance",
    specification: "Clear, colorless liquid",
    result: "Complies",
    method: "Visual",
    status: "PASS",
  },
  {
    parameter: "Assay (HPLC)",
    specification: "98.0% - 102.0%",
    result: "99.85%",
    method: "SOP-LAB-042",
    status: "PASS",
  },
  {
    parameter: "pH Value",
    specification: "5.5 - 7.5",
    result: "6.2",
    method: "USP <791>",
    status: "PASS",
  },
  {
    parameter: "Specific Gravity",
    specification: "1.012 - 1.018",
    result: "1.015",
    method: "USP <841>",
    status: "PASS",
  },
  {
    parameter: "Microbial Limit",
    specification: "< 100 CFU/mL",
    result: "Absent",
    method: "USP <61>",
    status: "PASS",
  },
];

export function SICReview({ sampleId: propSampleId }: SICReviewProps) {
  const navigate = useNavigate();
  const { activeUser } = useRole();
  const { actor } = useActor();

  const [selectedSampleId, setSelectedSampleId] = useState(propSampleId || "");
  const sample = selectedSampleId ? getSampleById(selectedSampleId) : null;
  const sicSamples = SAMPLE_INTAKES.filter((s) => s.status === "SICReview");
  const results = ANALYSIS_RESULTS[selectedSampleId] || [];

  const [approvalComments, setApprovalComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lineageExpanded, setLineageExpanded] = useState(true);
  const [lineageOldExpanded, setLineageOldExpanded] = useState(false);
  const [commentsError, setCommentsError] = useState("");
  const [checkedRows, setCheckedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (parameter: string) => {
    setCheckedRows((prev) => ({ ...prev, [parameter]: !prev[parameter] }));
  };

  const handleDecision = async (decision: "approve" | "reject") => {
    if (!approvalComments.trim()) {
      setCommentsError("Approval comments are required before proceeding.");
      return;
    }
    setCommentsError("");
    setSubmitting(true);

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
          ? `SIC review approved by ${activeUser.name}. Comments: ${approvalComments}`
          : `Returned to analyst by ${activeUser.name}. Reason: ${approvalComments}`,
    });

    // Backend: save SIC review and advance stage
    if (actor && selectedSampleId) {
      try {
        const flagged = Object.entries(checkedRows)
          .filter(([, checked]) => checked)
          .map((_, i) => BigInt(i));
        const review = {
          reviewerName: activeUser.name,
          decision: decision === "approve",
          comments: approvalComments,
          flaggedRows: flagged,
        };
        await (actor as any).saveSICReview(selectedSampleId, review);
        if (decision === "approve") {
          await (actor as any).approveSICReview(selectedSampleId);
        } else {
          await (actor as any).rejectSICReview(selectedSampleId);
        }
      } catch (err) {
        console.warn("Backend SICReview failed:", err);
      }
    }

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
      toast.warning("Returned to Analyst", { description: approvalComments });
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
              data-ocid="sic-review.back.button"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="page-title flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                Section In-Charge Review
              </h1>
              <p className="page-subtitle">
                Select a sample pending SIC review
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            Samples Pending SIC Review
          </p>
          {sicSamples.length === 0 ? (
            <div
              className="flex items-center gap-2 text-muted-foreground py-6"
              data-ocid="sic-review.empty_state"
            >
              <Info className="h-4 w-4" />
              <span className="text-sm">No samples pending SIC review</span>
            </div>
          ) : (
            <div className="space-y-2" data-ocid="sic-review.list">
              {sicSamples.map((s, i) => (
                <button
                  type="button"
                  key={s.sampleId}
                  onClick={() => setSelectedSampleId(s.sampleId)}
                  data-ocid={`sic-review.item.${i + 1}`}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-primary font-medium">
                      {s.sampleId}
                    </span>
                    <span className="text-sm font-medium">{s.sampleName}</span>
                  </div>
                  <StatusBadge status={s.status} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const docId = `COA-2024-${selectedSampleId.split("-")[2] || "001"}-V1.2`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <div className="bg-white border-b border-border px-6 py-3">
        <div className="flex items-center justify-between max-w-screen-xl mx-auto">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => navigate({ to: "/" })}
              data-ocid="sic-review.dashboard.link"
              className="hover:text-primary"
            >
              Dashboard
            </button>
            <span>/</span>
            <span className="text-foreground font-medium">COA Review</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-8"
              data-ocid="sic-review.print.button"
            >
              <Printer className="h-3.5 w-3.5" /> Print Draft
            </Button>
          </div>
        </div>
      </div>

      {/* Page Title Row */}
      <div className="bg-white border-b border-border px-6 py-4">
        <div className="flex items-center justify-between max-w-screen-xl mx-auto">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedSampleId("");
              }}
              data-ocid="sic-review.back.button"
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Section In-Charge Review
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {sample.sampleName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-muted-foreground bg-gray-100 px-2 py-1 rounded">
              {docId}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium">
              <Clock className="h-3 w-3" /> Pending Review / Due in 6 hrs
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-screen-xl mx-auto px-6 py-6">
        <div className="flex gap-6 items-start">
          {/* Left — Document Preview */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl border border-border shadow-sm">
              {/* Document Preview Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-gray-50 rounded-t-xl">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Document Preview
                  </span>
                </div>
                <span className="text-xs font-mono text-muted-foreground">
                  COA_SAMPLE_{selectedSampleId.split("-")[2] || "001"}_AMX_992
                </span>
              </div>

              {/* COA Certificate */}
              <div className="p-6">
                {/* Analytical Test Results */}
                <div className="mb-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-700 mb-3">
                    Analytical Test Results
                  </p>
                  <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-3 py-2 w-8" />
                        <th className="text-left px-3 py-2 font-semibold text-gray-600 w-1/4">
                          Test Parameter
                        </th>
                        <th className="text-left px-3 py-2 font-semibold text-gray-600 w-1/4">
                          Specification
                        </th>
                        <th className="text-left px-3 py-2 font-semibold text-gray-600 w-1/6">
                          Result
                        </th>
                        <th className="text-left px-3 py-2 font-semibold text-gray-600 w-1/5">
                          Method
                        </th>
                        <th className="text-left px-3 py-2 font-semibold text-gray-600 w-16">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(results.length > 0
                        ? results.map((r) => ({
                            parameter: r.parameter,
                            specification: r.acceptanceCriteria,
                            result: r.observedValue || "—",
                            method: "USP/BP",
                            status: r.verdict || "Pending",
                          }))
                        : COA_TEST_PARAMS
                      ).map((row, idx) => (
                        <tr
                          key={row.parameter}
                          className={`border-b border-gray-100 transition-colors ${checkedRows[row.parameter] ? "bg-blue-50/40" : ""}`}
                        >
                          <td className="px-3 py-2">
                            <Checkbox
                              checked={!!checkedRows[row.parameter]}
                              onCheckedChange={() => toggleRow(row.parameter)}
                              data-ocid={`sic-review.test-param.checkbox.${idx + 1}`}
                              aria-label={`Select ${row.parameter}`}
                            />
                          </td>
                          <td className="px-3 py-2 text-gray-800">
                            {row.parameter}
                          </td>
                          <td className="px-3 py-2 text-gray-500">
                            {row.specification}
                          </td>
                          <td className="px-3 py-2 font-semibold text-gray-800">
                            {row.result}
                          </td>
                          <td className="px-3 py-2 text-gray-500 italic">
                            {row.method}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold border ${
                                row.status === "PASS"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : row.status === "FAIL"
                                    ? "bg-red-50 text-red-700 border-red-200"
                                    : "bg-gray-50 text-gray-500 border-gray-200"
                              }`}
                            >
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Reviewer Remarks */}
                <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50/50">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-2">
                    Reviewer Remarks
                  </p>
                  <p className="text-xs text-gray-600 italic leading-relaxed">
                    All tests performed according to Pharmacopoeia standards.
                    Sample meets all specified criteria for release. No
                    deviations recorded during the analysis process.
                  </p>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    This is an electronically generated document and does not
                    require a physical signature.
                  </p>
                  <p className="text-xs text-gray-400">Page 1 of 1</p>
                </div>
              </div>
            </div>

            {/* Compliance Verification Banner */}
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
              <Shield className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-800 mb-1">
                  Compliance Verification
                </p>
                <p className="text-xs text-blue-700 leading-relaxed">
                  This document has passed all automated cross-validation
                  checks. Test results align with the Specification Master v4.1.
                  Audit trails indicate all laboratory procedures were followed
                  under 21 CFR Part 11 compliant protocols.
                </p>
                <button
                  type="button"
                  className="text-xs text-blue-700 font-semibold mt-1 flex items-center gap-1 hover:underline"
                  data-ocid="sic-review.custody.link"
                >
                  View Complete Chain of Custody{" "}
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-80 shrink-0 space-y-4">
            {/* Status Badge */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium">
                Pending Review
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-orange-600 font-medium">
                <Clock className="h-3.5 w-3.5" /> Due in 6 hrs
              </span>
            </div>

            {/* Approval Block */}
            <div className="bg-white rounded-xl border border-border shadow-sm p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-700 mb-0.5">
                SIC Approval Block
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Required action for COA issuance
              </p>
              <p className="text-xs font-semibold text-gray-600 mb-1">
                Approval Comments
              </p>
              <Textarea
                data-ocid="sic-review.approval.textarea"
                value={approvalComments}
                onChange={(e) => {
                  setApprovalComments(e.target.value);
                  setCommentsError("");
                }}
                rows={3}
                placeholder="Add mandatory review comments or rejection reason..."
                className={`text-xs ${commentsError ? "border-destructive" : ""}`}
              />
              {commentsError && (
                <p className="text-xs text-destructive mt-1">{commentsError}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                <Info className="h-3 w-3" /> Comments are recorded in the
                permanent audit log.
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs border-red-300 text-red-600 hover:bg-red-50 h-8"
                  data-ocid="sic-review.reject.button"
                  onClick={() => handleDecision("reject")}
                  disabled={submitting}
                >
                  {submitting ? (
                    <span className="h-3.5 w-3.5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                  ) : null}
                  Reject COA
                </Button>
                <Button
                  size="sm"
                  className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 h-8"
                  data-ocid="sic-review.approve.button"
                  onClick={() => handleDecision("approve")}
                  disabled={submitting}
                >
                  {submitting ? (
                    <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : null}
                  Approve
                </Button>
              </div>
            </div>

            {/* COA Document Lineage */}
            <div className="bg-white rounded-xl border border-border shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs font-bold uppercase tracking-wide text-gray-700">
                  COA Document Lineage
                </p>
              </div>
              {/* Version 1.2 Active */}
              <div className="mb-2">
                <button
                  type="button"
                  data-ocid="sic-review.lineage-v12.toggle"
                  onClick={() => setLineageExpanded(!lineageExpanded)}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                      1.2
                    </span>
                    <div className="text-left">
                      <p className="text-xs font-semibold text-blue-800">
                        Current Version (Active)
                      </p>
                      <p className="text-xs text-blue-600">
                        Uploaded 16 Jan, 14:30 by R. Malhotra
                      </p>
                    </div>
                  </div>
                  {lineageExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5 text-blue-600" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-blue-600" />
                  )}
                </button>
                {lineageExpanded && (
                  <div className="ml-3 mt-2 pl-3 border-l-2 border-blue-200">
                    <p className="text-xs text-gray-600 font-medium mb-1">
                      Changes in this version:
                    </p>
                    <ul className="text-xs text-gray-500 space-y-1">
                      <li className="flex gap-1">
                        <span>•</span> Updated USP reference for Specific
                        Gravity
                      </li>
                      <li className="flex gap-1">
                        <span>•</span> Included missing pH method reference
                      </li>
                    </ul>
                  </div>
                )}
              </div>
              {/* Version 1.1 Superseded */}
              <div className="mb-2">
                <button
                  type="button"
                  data-ocid="sic-review.lineage-v11.toggle"
                  onClick={() => setLineageOldExpanded(!lineageOldExpanded)}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs font-bold flex items-center justify-center">
                      1.1
                    </span>
                    <div className="text-left">
                      <p className="text-xs font-semibold text-gray-600">
                        Superseded Version
                      </p>
                      <p className="text-xs text-gray-400">
                        Uploaded 15 Jan, 09:12 by S. Verma
                      </p>
                    </div>
                  </div>
                  {lineageOldExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                  )}
                </button>
                {lineageOldExpanded && (
                  <div className="ml-3 mt-2 pl-3 border-l-2 border-gray-200">
                    <p className="text-xs text-gray-400">
                      Initial draft version submitted by S. Verma.
                    </p>
                  </div>
                )}
              </div>
              <button
                type="button"
                className="w-full text-xs text-blue-600 font-semibold text-center mt-1 hover:underline"
                data-ocid="sic-review.full-comparison.button"
              >
                View Full Comparison
              </button>
            </div>

            {/* Stakeholder Log */}
            <div className="bg-white rounded-xl border border-border shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs font-bold uppercase tracking-wide text-gray-700">
                  Stakeholder Log
                </p>
              </div>
              <div className="space-y-3">
                {[
                  {
                    name: "Rajesh Malhotra",
                    role: "Analyst (Results Entry)",
                    status: "Verified",
                    color: "bg-blue-500",
                  },
                  {
                    name: "Amit Singh",
                    role: "Section Head (Specification)",
                    status: "Verified",
                    color: "bg-green-500",
                  },
                  {
                    name: "Sarah Chen",
                    role: "QA Head (Final Review)",
                    status: "Awaiting",
                    color: "bg-gray-300",
                  },
                ].map((person) => (
                  <div
                    key={person.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-full ${person.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}
                      >
                        {person.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-800">
                          {person.name}
                        </p>
                        <p className="text-xs text-gray-400">{person.role}</p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-semibold ${person.status === "Verified" ? "text-emerald-600" : "text-amber-500"}`}
                    >
                      {person.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Related Links */}
            <div className="bg-white rounded-xl border border-border shadow-sm p-4 space-y-2">
              <button
                type="button"
                className="w-full flex items-center gap-2 text-xs text-gray-600 hover:text-blue-600 py-1 transition-colors"
                data-ocid="sic-review.batch-docs.link"
              >
                <FileText className="h-3.5 w-3.5 shrink-0" />
                Related Batch Documents
              </button>
              <button
                type="button"
                className="w-full flex items-center gap-2 text-xs text-gray-600 hover:text-blue-600 py-1 transition-colors"
                data-ocid="sic-review.raw-data.link"
              >
                <ClipboardList className="h-3.5 w-3.5 shrink-0" />
                Raw Test Data Log
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
