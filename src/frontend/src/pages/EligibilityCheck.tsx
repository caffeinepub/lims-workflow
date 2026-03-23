import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Info,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "../components/StatusBadge";
import { useRole } from "../contexts/RoleContext";
import { useActor } from "../hooks/useActor";
import {
  AUDIT_LOG,
  DUMMY_USERS,
  SAMPLE_INTAKES,
  type SICApprovalRecord,
  getSampleById,
} from "../lib/mockData";

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
  const { actor } = useActor();

  const [selectedSampleId, setSelectedSampleId] = useState(propSampleId || "");
  const [acceptanceChecked, setAcceptanceChecked] = useState<
    Record<string, boolean>
  >({});
  const [feasibilityChecked, setFeasibilityChecked] = useState<
    Record<string, boolean>
  >({});

  // Per-assignee decision comments (local state before committing)
  const [decisionComments, setDecisionComments] = useState<
    Record<string, string>
  >({});
  const [commentErrors, setCommentErrors] = useState<Record<string, string>>(
    {},
  );
  const [submitting, setSubmitting] = useState(false);

  const eligibleSamples = SAMPLE_INTAKES.filter(
    (s) =>
      s.status === "Intake" ||
      s.status === "EligibilityCheck" ||
      s.status === "PendingApproval",
  );
  const sample = selectedSampleId ? getSampleById(selectedSampleId) : null;

  const allAcceptanceChecked = ACCEPTANCE_CHECKLIST.every(
    (item) => acceptanceChecked[item.id],
  );
  const allFeasibilityChecked = FEASIBILITY_CHECKLIST.every(
    (item) => feasibilityChecked[item.id],
  );
  const checklistsComplete = allAcceptanceChecked && allFeasibilityChecked;

  // Derive assignee list: support both string and string[] for backwards compat
  const getAssignees = (): SICApprovalRecord[] => {
    if (!sample) return [];
    // If approvalDecisions exist, use them
    if (sample.approvalDecisions && sample.approvalDecisions.length > 0) {
      return sample.approvalDecisions;
    }
    // Legacy: single string assignee
    const ids = Array.isArray(sample.assignToSectionInCharge)
      ? sample.assignToSectionInCharge
      : [sample.assignToSectionInCharge];
    return ids.map((uid) => {
      const user = DUMMY_USERS.find((u) => u.id === uid);
      return {
        userId: uid,
        userName: user?.name ?? uid,
        decision: "pending" as const,
        comment: "",
      };
    });
  };

  const assignees = getAssignees();

  // Current user's assignee row (if they are one)
  const myRow = assignees.find((a) => a.userId === activeUser.id);
  const isAssignedToCurrentUser = !!myRow;

  // Compute aggregate status from decisions
  const computeAggregateStatus = (decisions: SICApprovalRecord[]) => {
    if (decisions.some((d) => d.decision === "hold")) return "OnHold";
    if (decisions.some((d) => d.decision === "rejected")) return "Rejected";
    if (decisions.every((d) => d.decision === "approved"))
      return "Registration";
    return "PendingApproval";
  };

  const handleDecision = async (decision: "approved" | "rejected" | "hold") => {
    if (!sample) return;
    const comment = decisionComments[activeUser.id] ?? "";

    // For hold/reject, comment is required
    if ((decision === "hold" || decision === "rejected") && !comment.trim()) {
      setCommentErrors((prev) => ({
        ...prev,
        [activeUser.id]: `Please provide a reason for ${decision === "hold" ? "placing on hold" : "rejection"}`,
      }));
      return;
    }
    setCommentErrors((prev) => ({ ...prev, [activeUser.id]: "" }));

    setSubmitting(true);

    const idx = SAMPLE_INTAKES.findIndex(
      (s) => s.sampleId === selectedSampleId,
    );
    if (idx !== -1) {
      // Build updated approval decisions
      const currentDecisions: SICApprovalRecord[] =
        SAMPLE_INTAKES[idx].approvalDecisions ?? assignees;

      const updatedDecisions = currentDecisions.map((d) =>
        d.userId === activeUser.id
          ? {
              ...d,
              decision,
              comment,
              decidedAt: new Date().toISOString(),
            }
          : d,
      );

      const newStatus = computeAggregateStatus(updatedDecisions);

      SAMPLE_INTAKES[idx] = {
        ...SAMPLE_INTAKES[idx],
        approvalDecisions: updatedDecisions,
        status: newStatus,
      };

      AUDIT_LOG.push({
        id: `al-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: activeUser.id,
        userName: activeUser.name,
        action: decision.toUpperCase(),
        entity: "EligibilityCheck",
        entityId: selectedSampleId,
        details: comment
          ? `${activeUser.name} marked ${decision}: ${comment}`
          : `${activeUser.name} marked ${decision}`,
      });

      // Backend: submit eligibility vote
      if (actor) {
        try {
          await actor.submitEligibilityVote(
            selectedSampleId,
            decision === "approved",
            comment,
            [],
          );
        } catch (err) {
          console.warn("Backend submitEligibilityVote failed:", err);
        }
      }

      setSubmitting(false);

      if (newStatus === "Registration") {
        toast.success("All assignees approved — Sample is now Eligible", {
          description: "Proceeding to Registration stage",
        });
        navigate({
          to: "/registration/$sampleId",
          params: { sampleId: selectedSampleId },
        });
      } else if (newStatus === "OnHold") {
        toast.warning("Sample placed On Hold", {
          description: `${activeUser.name} placed the sample on hold`,
        });
        navigate({ to: "/" });
      } else if (newStatus === "Rejected") {
        toast.error("Sample Rejected", {
          description: `${activeUser.name} rejected this sample`,
        });
        navigate({ to: "/" });
      } else {
        // PendingApproval
        const updatedForCount = assignees.map((a) =>
          a.userId === activeUser.id ? { ...a, decision } : a,
        );
        const stillPending = updatedForCount.filter(
          (d) => d.decision === "pending",
        ).length;
        toast.info("Your decision recorded — awaiting other approvals", {
          description: `${stillPending} approval(s) still pending`,
        });
        // Refresh view
        setSelectedSampleId("");
        setTimeout(() => setSelectedSampleId(selectedSampleId), 50);
      }
    } else {
      setSubmitting(false);
    }
  };

  const decisionColor = (d: string) => {
    if (d === "approved")
      return "bg-emerald-50 border-emerald-200 text-emerald-700";
    if (d === "rejected") return "bg-red-50 border-red-200 text-red-700";
    if (d === "hold") return "bg-amber-50 border-amber-200 text-amber-700";
    return "bg-muted/40 border-border text-muted-foreground";
  };

  const decisionIcon = (d: string) => {
    if (d === "approved") return <CheckCircle2 className="h-4 w-4" />;
    if (d === "rejected") return <XCircle className="h-4 w-4" />;
    if (d === "hold") return <AlertTriangle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: "/" })}
            data-ocid="eligibility.back.button"
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
        <Card
          className="lims-card mb-6"
          data-ocid="eligibility.sample_list.card"
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Select Sample for Eligibility Check
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eligibleSamples.length === 0 ? (
              <div
                className="flex items-center gap-2 text-muted-foreground py-4"
                data-ocid="eligibility.sample_list.empty_state"
              >
                <Info className="h-4 w-4" />
                <span className="text-sm">
                  No samples pending eligibility check
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {eligibleSamples.map((s, idx) => (
                  <button
                    type="button"
                    key={s.sampleId}
                    onClick={() => setSelectedSampleId(s.sampleId)}
                    data-ocid={`eligibility.sample_list.item.${idx + 1}`}
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

      {/* Sample Info + Check */}
      {sample && (
        <>
          {/* Sample Header */}
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
                  data-ocid="eligibility.change_sample.button"
                >
                  Change
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Checklists */}
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
                      data-ocid={`eligibility.acceptance.${item.id}.checkbox`}
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
                      data-ocid={`eligibility.feasibility.${item.id}.checkbox`}
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

          {/* Section In-Charge Approval Panel */}
          <Card className="lims-card mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Section In-Charge Approvals
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  All assigned must approve for sample to proceed
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {assignees.map((assignee, idx) => {
                const isMe = assignee.userId === activeUser.id;
                const alreadyDecided = assignee.decision !== "pending";
                const canAct = isMe && !alreadyDecided && checklistsComplete;
                const commentVal = decisionComments[assignee.userId] ?? "";

                return (
                  <div
                    key={assignee.userId}
                    data-ocid={`eligibility.assignee_row.item.${idx + 1}`}
                    className={`rounded-lg border p-4 transition-all ${
                      alreadyDecided
                        ? decisionColor(assignee.decision)
                        : isMe
                          ? "border-primary/40 bg-primary/5"
                          : "border-border bg-muted/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-xs text-white font-bold flex-shrink-0">
                          {assignee.userName.charAt(0)}
                        </span>
                        <div>
                          <p className="text-sm font-semibold">
                            {assignee.userName}
                            {isMe && (
                              <span className="ml-2 text-xs font-normal text-primary">
                                (You)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {DUMMY_USERS.find((u) => u.id === assignee.userId)
                              ?.designation ?? "Section In-Charge"}
                          </p>
                        </div>
                      </div>

                      {/* Decision badge */}
                      <div
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${decisionColor(assignee.decision)}`}
                      >
                        {decisionIcon(assignee.decision)}
                        <span className="capitalize">{assignee.decision}</span>
                      </div>
                    </div>

                    {/* Comment display if already decided */}
                    {alreadyDecided && assignee.comment && (
                      <p className="mt-2 text-xs italic text-current/70 ml-11">
                        "{assignee.comment}"
                      </p>
                    )}

                    {/* Action area for current user if not yet decided */}
                    {isMe && !alreadyDecided && (
                      <div className="mt-3 ml-11 space-y-3">
                        {!checklistsComplete && (
                          <p className="text-xs text-amber-600 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Complete all checklist items above before deciding
                          </p>
                        )}

                        <div className="space-y-1">
                          <Label className="text-xs font-medium">
                            Comment{" "}
                            <span className="text-muted-foreground font-normal">
                              (required for Hold / Reject)
                            </span>
                          </Label>
                          <Textarea
                            placeholder="Add a comment or reason..."
                            data-ocid="eligibility.decision_comment.textarea"
                            value={commentVal}
                            onChange={(e) => {
                              setDecisionComments((prev) => ({
                                ...prev,
                                [assignee.userId]: e.target.value,
                              }));
                              setCommentErrors((prev) => ({
                                ...prev,
                                [assignee.userId]: "",
                              }));
                            }}
                            rows={2}
                            disabled={!checklistsComplete}
                            className={
                              commentErrors[assignee.userId]
                                ? "border-destructive"
                                : ""
                            }
                          />
                          {commentErrors[assignee.userId] && (
                            <p className="text-xs text-destructive">
                              {commentErrors[assignee.userId]}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={!canAct || submitting}
                            data-ocid="eligibility.hold.button"
                            onClick={() => handleDecision("hold")}
                            className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50"
                          >
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Hold
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={!canAct || submitting}
                            data-ocid="eligibility.reject.button"
                            onClick={() => handleDecision("rejected")}
                            className="gap-1.5 border-red-300 text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Reject
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            disabled={!canAct || submitting}
                            data-ocid="eligibility.approve.button"
                            onClick={() => handleDecision("approved")}
                            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            {submitting ? (
                              <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            Approve
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Awaiting message for others */}
                    {!isMe && !alreadyDecided && (
                      <p className="mt-2 ml-11 text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Awaiting decision
                      </p>
                    )}
                  </div>
                );
              })}

              {/* Summary status */}
              <div className="mt-2 pt-3 border-t border-border">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {assignees.filter((a) => a.decision === "approved").length}{" "}
                    of {assignees.length} approved
                  </span>
                  {!isAssignedToCurrentUser && (
                    <span className="text-amber-600 flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      You are not an assigned reviewer for this sample
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {!checklistsComplete && (
            <p className="text-xs text-muted-foreground text-right mb-4">
              Complete all checklist items to enable approval buttons
            </p>
          )}
        </>
      )}
    </div>
  );
}
