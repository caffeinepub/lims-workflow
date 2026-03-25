import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock,
  ExternalLink,
  FileText,
  Info,
  Printer,
  Shield,
  XCircle,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useRole } from "../contexts/RoleContext";
import { useActor } from "../hooks/useActor";
import {
  ANALYSIS_RESULTS,
  COA_RECORDS,
  SAMPLE_INTAKES,
  getSampleById,
} from "../lib/mockData";

interface COAProps {
  sampleId?: string;
}

// Static coaParams removed — data loaded from backend

export function COA({ sampleId: propSampleId }: COAProps) {
  const navigate = useNavigate();
  const coaPrintRef = useRef<HTMLDivElement>(null);

  const [checkedRows, setCheckedRows] = useState<Record<string, boolean>>({});
  const [lineageExpanded, setLineageExpanded] = useState(true);
  const [lineageOldExpanded, setLineageOldExpanded] = useState(false);
  const [approvalComments, setApprovalComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(
    null,
  );
  const { actor } = useActor();
  const [coaParams, setCoaParams] = useState<
    Array<{
      parameter: string;
      specification: string;
      result: string;
      method: string;
      status: string;
    }>
  >([]);

  useEffect(() => {
    if (!propSampleId) {
      setCoaParams([]);
      return;
    }
    const loadData = async () => {
      if (actor) {
        try {
          const backendResults = await (actor as any).getAnalysisResult(
            propSampleId,
          );
          if (backendResults && backendResults.length > 0) {
            const mapped = backendResults.map((r: any) => ({
              parameter: r.parameter,
              specification: r.acceptanceCriteria || "",
              result: r.unit ? `${r.observedValue} ${r.unit}` : r.observedValue,
              method: "",
              status:
                r.verdict?.__kind__ === "pass"
                  ? "PASS"
                  : r.verdict?.__kind__ === "fail"
                    ? "FAIL"
                    : "OOS",
            }));
            setCoaParams(mapped);
            return;
          }
        } catch (err) {
          console.warn("getAnalysisResult failed in COA:", err);
        }
      }
      setCoaParams([]);
    };
    loadData();
  }, [propSampleId, actor]);

  // Load Dancing Script font (self-hosted via @font-face in index.css is preferred,
  // but Dancing Script is only needed here for the cursive signature, so we inject
  // via a <link> into the document head as a fallback approach for this specific component)
  useEffect(() => {
    const existingLink = document.querySelector(
      "link[data-font='dancing-script']",
    );
    if (!existingLink) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap";
      link.setAttribute("data-font", "dancing-script");
      document.head.appendChild(link);
    }
  }, []);

  const toggleRow = (parameter: string) => {
    setCheckedRows((prev) => ({ ...prev, [parameter]: !prev[parameter] }));
  };

  const handleDecision = async (action: "approve" | "reject") => {
    if (!approvalComments.trim()) {
      toast.error("Please add approval comments before proceeding.");
      return;
    }
    const sid = propSampleId;
    if (!sid) {
      toast.error("No sample selected");
      return;
    }
    setSubmitting(true);
    try {
      // Update mock data first (always succeeds)
      const idx = SAMPLE_INTAKES.findIndex((s) => s.sampleId === sid);
      if (idx !== -1) {
        SAMPLE_INTAKES[idx] = {
          ...SAMPLE_INTAKES[idx],
          status: action === "approve" ? "COA" : "SICReview",
        };
      }
      // Try backend (non-blocking)
      if (actor) {
        try {
          if (action === "approve") {
            await (actor as any).approveQAReview(sid);
          } else {
            await (actor as any).rejectQAReview(sid);
          }
        } catch (backendErr) {
          console.warn(
            "Backend COA decision failed (mock updated):",
            backendErr,
          );
        }
      }
      setDecision(action === "approve" ? "approved" : "rejected");
      toast.success(action === "approve" ? "COA Approved" : "COA Rejected", {
        description:
          action === "approve"
            ? "Sample moved to COA issuance"
            : "Sample returned to SIC Review",
      });
    } catch (err) {
      toast.error("Action failed. Please try again.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  function savePDF() {
    const el = coaPrintRef.current;
    if (!el) return;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    // Collect all stylesheet hrefs from the current page
    const styleLinks = Array.from(
      document.querySelectorAll("link[rel='stylesheet']"),
    )
      .map(
        (l) =>
          `<link rel="stylesheet" href="${(l as HTMLLinkElement).href}" />`,
      )
      .join("\n");

    // Collect all inline <style> tags
    const inlineStyles = Array.from(document.querySelectorAll("style"))
      .map((s) => `<style>${s.innerHTML}</style>`)
      .join("\n");

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Certificate of Analysis</title>
  ${styleLinks}
  ${inlineStyles}
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 16px; background: white; font-family: Inter, DM Sans, sans-serif; }
    @media print {
      body { padding: 0; }
      @page { margin: 10mm; size: A4; }
    }
  </style>
</head>
<body>
  ${el.outerHTML}
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); window.close(); }, 400);
    };
  <\/script>
</body>
</html>`);
    printWindow.document.close();
  }

  const coa = propSampleId
    ? COA_RECORDS.find((c) => c.sampleId === propSampleId)
    : null;
  const sample = propSampleId ? getSampleById(propSampleId) : null;

  // ─── List View (no sampleId or no coa found) ────────────────────────────────
  if (!propSampleId || !coa) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="page-header">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate({ to: "/" })}
              data-ocid="coa.back.button"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="page-title flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Certificate of Analysis
              </h1>
              <p className="page-subtitle">View and print issued COAs</p>
            </div>
          </div>
        </div>
        <Card className="lims-card">
          <CardContent className="p-5">
            <p className="text-sm font-semibold mb-3">Select a COA to view</p>
            {COA_RECORDS.length === 0 ? (
              <div
                className="flex items-center gap-2 text-muted-foreground py-4"
                data-ocid="coa.empty_state"
              >
                <Info className="h-4 w-4" />
                <span className="text-sm">
                  No COAs issued yet. Complete the full workflow to generate a
                  COA.
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {COA_RECORDS.map((c, i) => (
                  <button
                    type="button"
                    key={c.id}
                    data-ocid={`coa.item.${i + 1}`}
                    onClick={() =>
                      navigate({
                        to: "/coa/$sampleId",
                        params: { sampleId: c.sampleId },
                      })
                    }
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-primary font-medium">
                        {c.coaNumber}
                      </span>
                      <span className="text-sm font-medium">
                        {c.sampleName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {c.clientName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${c.overallResult === "PASS" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}
                      >
                        {c.overallResult}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(c.issueDate).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Detail View ─────────────────────────────────────────────────────────────
  const docId = `COA-2024-${propSampleId.split("-")[2] || "8842"}-V1.2`;
  const sampleNum = propSampleId.split("-")[2] || "001";

  // Build test rows from coa.parameters or static fallback
  const testRows =
    coa.parameters.length > 0
      ? coa.parameters.map((p) => ({
          parameter: p.parameter,
          specification: p.acceptanceCriteria,
          result: p.observedValue || "—",
          method: "USP/BP",
          status: p.verdict || "Pending",
        }))
      : coaParams;

  // Batch / date helpers
  const batchNumber =
    (sample as { batchNumber?: string } | null)?.batchNumber || "BT-2024-001";
  const mfgDate =
    (sample as { dateOfMfg?: string } | null)?.dateOfMfg || "Jan 2024";
  const expiryDate =
    (sample as { expiryDate?: string } | null)?.expiryDate || "Jan 2026";
  const receiptDate = sample
    ? new Date(sample.dateOfReceipt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "16 Jan 2024";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Breadcrumb Bar */}
      <div className="bg-white border-b border-border px-6 py-3">
        <div className="flex items-center justify-between max-w-screen-xl mx-auto">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => navigate({ to: "/" })}
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
              data-ocid="coa.print.button"
              onClick={() => window.print()}
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
              onClick={() => navigate({ to: "/coa" })}
              data-ocid="coa.back.button"
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Final COA Management
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {coa.sampleName}
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
            <Button
              size="sm"
              className="gap-1.5 text-xs h-8 bg-blue-600 hover:bg-blue-700"
              data-ocid="coa.download-pdf.button"
              onClick={savePDF}
            >
              Download PDF (v1.2)
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-screen-xl mx-auto px-6 py-6">
        <div className="flex gap-6 items-start">
          {/* ── Left Column: Document Preview ─────────────────────────────── */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl border border-border shadow-sm">
              {/* Document Preview Header Bar */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-gray-50 rounded-t-xl">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Document Preview
                  </span>
                </div>
                <span className="text-xs font-mono text-muted-foreground">
                  COA_SAMPLE_{sampleNum}_AMX_992
                </span>
              </div>

              {/* COA Certificate Content — this div is used for PDF export */}
              <div className="p-6" ref={coaPrintRef}>
                {/* Certificate Header */}
                <div className="mb-5">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <h2 className="text-2xl font-bold text-blue-700 leading-tight">
                        Certificate of Analysis
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Global Pharma Labs Inc. · 14 Industrial Blvd, Mumbai
                        400001
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center px-2.5 py-1 rounded border border-blue-200 bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wide">
                        ISO 9001/2015 Certified
                      </span>
                    </div>
                  </div>

                  {/* Document ID */}
                  <p className="text-xs text-gray-500 mt-2">
                    <span className="font-semibold text-gray-700">
                      Document ID:
                    </span>{" "}
                    {docId}
                  </p>

                  {/* Product Metadata Grid */}
                  <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 border border-gray-200 rounded-lg p-4 bg-gray-50/50 text-xs">
                    <div>
                      <span className="text-gray-500">Product Name:</span>{" "}
                      <span className="font-semibold text-gray-800">
                        {coa.sampleName}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Batch Number:</span>{" "}
                      <span className="font-semibold text-gray-800">
                        {batchNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Sample Type:</span>{" "}
                      <span className="font-semibold text-gray-800">
                        {sample?.sampleType || "Finished Product"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Manufacturing Date:</span>{" "}
                      <span className="font-semibold text-gray-800">
                        {mfgDate}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Expiry Date:</span>{" "}
                      <span className="font-semibold text-gray-800">
                        {expiryDate}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Sample Date:</span>{" "}
                      <span className="font-semibold text-gray-800">
                        {receiptDate}
                      </span>
                    </div>
                  </div>
                </div>

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
                      {testRows.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-3 py-6 text-center text-xs text-gray-500 italic"
                          >
                            No analysis results available. Complete the Analysis
                            stage first.
                          </td>
                        </tr>
                      )}
                      {testRows.map((row, idx) => (
                        <tr
                          key={row.parameter}
                          className={`border-b border-gray-100 transition-colors ${checkedRows[row.parameter] ? "bg-blue-50/40" : ""}`}
                        >
                          <td className="px-3 py-2">
                            <Checkbox
                              checked={!!checkedRows[row.parameter]}
                              onCheckedChange={() => toggleRow(row.parameter)}
                              data-ocid={`coa.test-param.checkbox.${idx + 1}`}
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

                {/* Signatures Row */}
                <div className="mb-5 grid grid-cols-2 gap-4">
                  {/* Section In-Charge Signature */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-white">
                    <p
                      className="mb-1 leading-tight"
                      style={{
                        fontFamily: "'Dancing Script', cursive",
                        fontWeight: 700,
                        fontSize: "1.75rem",
                        color: "#1a2744",
                        letterSpacing: "0.01em",
                      }}
                    >
                      R. Malhotra
                    </p>
                    <div className="border-b border-gray-400 mb-2" />
                    <p className="text-xs font-bold text-gray-800 mb-0.5">
                      Rajesh Malhotra
                    </p>
                    <p
                      className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1"
                      style={{ fontSize: "0.6rem", letterSpacing: "0.08em" }}
                    >
                      Section Incharge (Analyst)
                    </p>
                    <p className="text-xs text-gray-400 italic">
                      Digitally Signed: 16-Jan-2024 14:30
                    </p>
                  </div>

                  {/* QA Head Signature */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-white">
                    <p
                      className="mb-1 leading-tight"
                      style={{
                        fontFamily: "'Dancing Script', cursive",
                        fontWeight: 700,
                        fontSize: "1.75rem",
                        color: "#1a2744",
                        letterSpacing: "0.01em",
                      }}
                    >
                      S. Chen
                    </p>
                    <div className="border-b border-gray-400 mb-2" />
                    <p className="text-xs font-bold text-gray-800 mb-0.5">
                      Dr. Sarah Chen
                    </p>
                    <p
                      className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5"
                      style={{ fontSize: "0.6rem", letterSpacing: "0.08em" }}
                    >
                      QA Head / Authorized Signatory
                    </p>
                    <p
                      className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1"
                      style={{ fontSize: "0.6rem", letterSpacing: "0.08em" }}
                    >
                      Quality Assurance Department
                    </p>
                    <p className="text-xs text-gray-400 italic">
                      Digitally Signed: 16-Jan-2024 16:45
                    </p>
                  </div>
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
                  data-ocid="coa.custody.link"
                >
                  View Complete Chain of Custody{" "}
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          {/* ── Right Sidebar ───────────────────────────────────────────────── */}
          <div className="w-80 shrink-0 space-y-4">
            {/* Status Row */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium">
                Pending Review
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-orange-600 font-medium">
                <Clock className="h-3.5 w-3.5" /> Due in 6 hrs
              </span>
            </div>

            {/* QA Approval Block */}
            <div className="bg-white rounded-xl border border-border shadow-sm p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-700 mb-0.5">
                QA Approval Block
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Required action for COA issuance
              </p>
              <p className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                Approval Comments
              </p>
              <Textarea
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                rows={3}
                placeholder="Add mandatory review comments or rejection reason..."
                className="text-xs"
              />
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                <Info className="h-3 w-3" /> Comments are recorded in the
                permanent audit log.
              </p>
              {decision && (
                <div
                  className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${decision === "approved" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}
                >
                  {decision === "approved" ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" /> COA Approved
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" /> Returned to SIC Review
                    </>
                  )}
                </div>
              )}
              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs border-red-300 text-red-600 hover:bg-red-50 h-8"
                  onClick={() => handleDecision("reject")}
                  disabled={submitting || decision !== null || !propSampleId}
                  data-ocid="coa.reject.button"
                >
                  {submitting && decision === null ? (
                    <span className="h-3 w-3 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin mr-1" />
                  ) : null}
                  Reject COA
                </Button>
                <Button
                  size="sm"
                  className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 h-8"
                  onClick={() => handleDecision("approve")}
                  disabled={submitting || decision !== null || !propSampleId}
                  data-ocid="coa.approve.button"
                >
                  {submitting ? (
                    <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1" />
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
                  data-ocid="coa.lineage-v12.toggle"
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
                  data-ocid="coa.lineage-v11.toggle"
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
                data-ocid="coa.full-comparison.button"
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
                    status: "Verified",
                    color: "bg-purple-500",
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
                data-ocid="coa.batch-docs.link"
              >
                <FileText className="h-3.5 w-3.5 shrink-0" />
                Related Batch Documents
              </button>
              <button
                type="button"
                className="w-full flex items-center gap-2 text-xs text-gray-600 hover:text-blue-600 py-1 transition-colors"
                data-ocid="coa.raw-data.link"
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
