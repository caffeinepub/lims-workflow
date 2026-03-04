import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Award, CheckCircle2, Info, Printer } from "lucide-react";
import React, { useRef } from "react";
import { COA_RECORDS, SAMPLE_INTAKES, getSampleById } from "../lib/mockData";

interface COAProps {
  sampleId?: string;
}

export function COA({ sampleId: propSampleId }: COAProps) {
  const navigate = useNavigate();
  const coaPrintRef = useRef<HTMLDivElement>(null);

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

  if (!propSampleId || !coa) {
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
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <Info className="h-4 w-4" />
                <span className="text-sm">
                  No COAs issued yet. Complete the full workflow to generate a
                  COA.
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {COA_RECORDS.map((c) => (
                  <button
                    type="button"
                    key={c.id}
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Actions — hidden on print */}
      <div className="page-header print-hide mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: "/coa" })}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="page-title flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Certificate of Analysis
            </h1>
            <p className="page-subtitle">{coa.coaNumber}</p>
          </div>
        </div>
        <Button onClick={savePDF} className="gap-2 print-hide">
          <Printer className="h-4 w-4" />
          Save PDF
        </Button>
      </div>

      {/* COA Document */}
      <div
        ref={coaPrintRef}
        className="coa-print-area bg-white border border-border rounded-lg overflow-hidden shadow-card"
      >
        {/* Header */}
        <div className="bg-primary px-8 py-6 text-primary-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-white/20 flex items-center justify-center">
                <Award className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">PharmaLIMS Laboratory</h2>
                <p className="text-sm text-primary-foreground/80">
                  Accredited Testing Laboratory · ISO/IEC 17025:2017
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">{coa.coaNumber}</p>
              <p className="text-sm text-primary-foreground/80">
                Certificate of Analysis
              </p>
            </div>
          </div>
        </div>

        {/* Document Lineage */}
        <div className="px-8 py-5 border-b border-border">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Document Lineage
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Sample ID", value: coa.sampleId },
              { label: "Registration No.", value: coa.registrationNumber },
              { label: "COA Number", value: coa.coaNumber },
              {
                label: "Issue Date",
                value: new Date(coa.issueDate).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                }),
              },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Client & Sample Info */}
        <div className="px-8 py-5 border-b border-border bg-muted/20">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                Client Information
              </h3>
              <p className="text-sm font-semibold">{coa.clientName}</p>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                Sample Information
              </h3>
              <p className="text-sm font-semibold">{coa.sampleName}</p>
              {sample && (
                <div className="mt-1 space-y-0.5">
                  <p className="text-xs text-muted-foreground">
                    Type: {sample.sampleType} · Form: {sample.physicalForm}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Date of Receipt:{" "}
                    {new Date(sample.dateOfReceipt).toLocaleDateString("en-IN")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Test Results Table */}
        <div className="px-8 py-5 border-b border-border">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Test Results
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left py-2 text-xs font-bold text-muted-foreground uppercase">
                  Parameter
                </th>
                <th className="text-left py-2 text-xs font-bold text-muted-foreground uppercase">
                  Acceptance Criteria
                </th>
                <th className="text-left py-2 text-xs font-bold text-muted-foreground uppercase">
                  Observed Value
                </th>
                <th className="text-left py-2 text-xs font-bold text-muted-foreground uppercase">
                  Unit
                </th>
                <th className="text-left py-2 text-xs font-bold text-muted-foreground uppercase">
                  Result
                </th>
              </tr>
            </thead>
            <tbody>
              {coa.parameters.map((p, i) => (
                <tr
                  key={p.parameter}
                  className={`border-b border-border/50 ${i % 2 === 0 ? "" : "bg-muted/10"}`}
                >
                  <td className="py-2.5 font-medium">{p.parameter}</td>
                  <td className="py-2.5 text-muted-foreground">
                    {p.acceptanceCriteria}
                  </td>
                  <td className="py-2.5 font-semibold">{p.observedValue}</td>
                  <td className="py-2.5 text-muted-foreground">{p.unit}</td>
                  <td className="py-2.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${
                        p.verdict === "PASS"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : p.verdict === "FAIL"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {p.verdict === "PASS" && (
                        <CheckCircle2 className="h-3 w-3" />
                      )}
                      {p.verdict}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex items-center gap-3">
            <span className="text-sm font-bold">Overall Result:</span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-bold border ${
                coa.overallResult === "PASS"
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                  : "bg-red-100 text-red-800 border-red-300"
              }`}
            >
              {coa.overallResult}
            </span>
          </div>
        </div>

        {/* Stakeholder Log */}
        <div className="px-8 py-5 border-b border-border">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Stakeholder Log
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                role: "Analyst",
                name: coa.analystName,
                date: coa.analystSignDate,
              },
              {
                role: "Section In-Charge",
                name: coa.sicReviewerName,
                date: coa.sicSignDate,
              },
              {
                role: "QA Approver",
                name: coa.qaApproverName,
                date: coa.qaSignDate,
              },
            ].map((s) => (
              <div key={s.role} className="border border-border rounded-lg p-3">
                <p className="text-xs text-muted-foreground font-medium">
                  {s.role}
                </p>
                <p className="text-sm font-semibold mt-1">{s.name}</p>
                <div className="mt-3 pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Signed: {new Date(s.date).toLocaleDateString("en-IN")}
                  </p>
                  <div className="mt-1 h-6 border-b border-dashed border-border" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance Statement */}
        <div className="px-8 py-5 border-b border-border">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Compliance Verification
          </h3>
          <p className="text-sm text-foreground leading-relaxed">
            {coa.complianceStatement}
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            This certificate is issued by PharmaLIMS Laboratory and is valid
            only for the sample described herein. Any reproduction or alteration
            of this document is strictly prohibited.
          </p>
        </div>

        {/* Footer */}
        <div className="px-8 py-3 bg-muted/30 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>PharmaLIMS Laboratory · Accredited Testing Facility</span>
            <span>
              Built with ❤️ using{" "}
              <a
                href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "pharmalims")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                caffeine.ai
              </a>{" "}
              · © {new Date().getFullYear()} PharmaLIMS
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
