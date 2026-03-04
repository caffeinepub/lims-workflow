import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Info,
  XCircle,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "../components/StatusBadge";
import { useRole } from "../contexts/RoleContext";
import { AUDIT_LOG, SAMPLE_INTAKES, getSampleById } from "../lib/mockData";

const ACCEPTANCE_CHECKLIST = [
  {
    id: "ac1",
    label: "Sample is properly labeled with name, batch number, and date",
  },
  { id: "ac2", label: "Sample quantity is sufficient for all requested tests" },
  {
    id: "ac3",
    label: "Packaging is intact with no signs of damage or contamination",
  },
  { id: "ac4", label: "All required documentation (COA, MSDS) is provided" },
  {
    id: "ac5",
    label: "Sample storage conditions during transit are acceptable",
  },
];

const FEASIBILITY_CHECKLIST = [
  {
    id: "fc1",
    label: "Required equipment and instruments are available and calibrated",
  },
  {
    id: "fc2",
    label: "Reference standards and reagents are in stock and within validity",
  },
  { id: "fc3", label: "Test methods are validated and SOPs are current" },
  {
    id: "fc4",
    label: "Timeline is feasible within the requested turnaround time",
  },
  {
    id: "fc5",
    label: "Qualified analysts are available for the requested tests",
  },
];

interface EligibilityCheckProps {
  sampleId?: string;
}

export function EligibilityCheck({
  sampleId: propSampleId,
}: EligibilityCheckProps) {
  const navigate = useNavigate();
  const { activeUser } = useRole();

  const [selectedSampleId, setSelectedSampleId] = useState(propSampleId || "");
  const [acceptanceChecked, setAcceptanceChecked] = useState<
    Record<string, boolean>
  >({});
  const [feasibilityChecked, setFeasibilityChecked] = useState<
    Record<string, boolean>
  >({});
  const [holdComment, setHoldComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [holdError, setHoldError] = useState("");

  const eligibleSamples = SAMPLE_INTAKES.filter(
    (s) => s.status === "Intake" || s.status === "EligibilityCheck",
  );
  const sample = selectedSampleId ? getSampleById(selectedSampleId) : null;

  const allAcceptanceChecked = ACCEPTANCE_CHECKLIST.every(
    (item) => acceptanceChecked[item.id],
  );
  const allFeasibilityChecked = FEASIBILITY_CHECKLIST.every(
    (item) => feasibilityChecked[item.id],
  );
  const canApprove = allAcceptanceChecked && allFeasibilityChecked;

  const handleDecision = async (decision: "eligible" | "hold") => {
    if (decision === "hold" && !holdComment.trim()) {
      setHoldError("Please provide a reason for placing the sample on hold");
      return;
    }
    setHoldError("");
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));

    const idx = SAMPLE_INTAKES.findIndex(
      (s) => s.sampleId === selectedSampleId,
    );
    if (idx !== -1) {
      SAMPLE_INTAKES[idx] = {
        ...SAMPLE_INTAKES[idx],
        status: decision === "eligible" ? "Registration" : "OnHold",
      };
      AUDIT_LOG.push({
        id: `al-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: activeUser.id,
        userName: activeUser.name,
        action: decision === "eligible" ? "ELIGIBLE" : "HOLD",
        entity: "SampleIntake",
        entityId: selectedSampleId,
        details:
          decision === "eligible"
            ? "Sample declared eligible after checklist verification"
            : `Sample placed on hold: ${holdComment}`,
      });
    }

    setSubmitting(false);
    if (decision === "eligible") {
      toast.success("Sample declared Eligible", {
        description: "Proceeding to Registration stage",
      });
      navigate({
        to: "/registration/$sampleId",
        params: { sampleId: selectedSampleId },
      });
    } else {
      toast.warning("Sample placed On Hold", { description: holdComment });
      navigate({ to: "/" });
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
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
              <ClipboardCheck className="h-5 w-5 text-primary" />
              Eligibility Check
            </h1>
            <p className="page-subtitle">
              Verify sample acceptance and test feasibility
            </p>
          </div>
        </div>
      </div>

      {/* Sample Selection */}
      {!sample && (
        <Card className="lims-card mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Select Sample for Eligibility Check
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eligibleSamples.length === 0 ? (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <Info className="h-4 w-4" />
                <span className="text-sm">
                  No samples pending eligibility check
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {eligibleSamples.map((s) => (
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
      )}

      {/* Sample Info */}
      {sample && (
        <>
          <Card className="lims-card mb-6 border-l-4 border-l-primary">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                  <div>
                    <p className="text-xs text-muted-foreground">Sample ID</p>
                    <p className="text-sm font-mono font-semibold text-primary">
                      {sample.sampleId}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Sample Name</p>
                    <p className="text-sm font-medium">{sample.sampleName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Customer</p>
                    <p className="text-sm">{sample.customerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <StatusBadge status={sample.status} />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSampleId("")}
                  className="text-xs ml-4"
                >
                  Change
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Acceptance Checklist */}
            <Card className="lims-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Acceptance Checklist
                  <span className="ml-auto text-xs text-muted-foreground font-normal">
                    {Object.values(acceptanceChecked).filter(Boolean).length}/
                    {ACCEPTANCE_CHECKLIST.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ACCEPTANCE_CHECKLIST.map((item) => (
                  <label
                    key={item.id}
                    htmlFor={item.id}
                    className="flex items-start gap-3 cursor-pointer group"
                  >
                    <Checkbox
                      id={item.id}
                      checked={!!acceptanceChecked[item.id]}
                      onCheckedChange={(checked) =>
                        setAcceptanceChecked((prev) => ({
                          ...prev,
                          [item.id]: !!checked,
                        }))
                      }
                      className="mt-0.5"
                    />
                    <span
                      className={`text-sm leading-snug ${acceptanceChecked[item.id] ? "text-muted-foreground line-through" : "text-foreground"}`}
                    >
                      {item.label}
                    </span>
                  </label>
                ))}
              </CardContent>
            </Card>

            {/* Feasibility Checklist */}
            <Card className="lims-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  Test Feasibility Checklist
                  <span className="ml-auto text-xs text-muted-foreground font-normal">
                    {Object.values(feasibilityChecked).filter(Boolean).length}/
                    {FEASIBILITY_CHECKLIST.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {FEASIBILITY_CHECKLIST.map((item) => (
                  <label
                    key={item.id}
                    htmlFor={item.id}
                    className="flex items-start gap-3 cursor-pointer group"
                  >
                    <Checkbox
                      id={item.id}
                      checked={!!feasibilityChecked[item.id]}
                      onCheckedChange={(checked) =>
                        setFeasibilityChecked((prev) => ({
                          ...prev,
                          [item.id]: !!checked,
                        }))
                      }
                      className="mt-0.5"
                    />
                    <span
                      className={`text-sm leading-snug ${feasibilityChecked[item.id] ? "text-muted-foreground line-through" : "text-foreground"}`}
                    >
                      {item.label}
                    </span>
                  </label>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Hold Comment */}
          <Card className="lims-card mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                Hold Reason (required if placing on hold)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Describe the reason for placing this sample on hold..."
                value={holdComment}
                onChange={(e) => {
                  setHoldComment(e.target.value);
                  setHoldError("");
                }}
                rows={3}
                className={holdError ? "border-destructive" : ""}
              />
              {holdError && (
                <p className="text-xs text-destructive mt-1">{holdError}</p>
              )}
            </CardContent>
          </Card>

          {/* Decision Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              variant="destructive"
              onClick={() => handleDecision("hold")}
              disabled={submitting}
              className="gap-2"
            >
              {submitting ? (
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Place on Hold
            </Button>
            <Button
              onClick={() => handleDecision("eligible")}
              disabled={!canApprove || submitting}
              className="gap-2"
            >
              {submitting ? (
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Declare Eligible
            </Button>
          </div>
          {!canApprove && (
            <p className="text-xs text-muted-foreground text-right mt-2">
              Complete all checklist items to enable the Eligible button
            </p>
          )}
        </>
      )}
    </div>
  );
}
