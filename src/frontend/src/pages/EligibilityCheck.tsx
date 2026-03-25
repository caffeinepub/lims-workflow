import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  History,
  Info,
  ListFilter,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { AnimatedTabs } from "../components/AnimatedTabs";
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
  const [activeTab, setActiveTab] = useState(propSampleId ? "form" : "form");
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatus, setHistoryStatus] = useState("all");

  const [selectedSampleId, setSelectedSampleId] = useState(propSampleId || "");
  const [acceptanceChecked, setAcceptanceChecked] = useState<
    Record<string, boolean>
  >({});
  const [feasibilityChecked, setFeasibilityChecked] = useState<
    Record<string, boolean>
  >({});
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

  const getAssignees = (): SICApprovalRecord[] => {
    if (!sample) return [];
    if (sample.approvalDecisions && sample.approvalDecisions.length > 0)
      return sample.approvalDecisions;
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
    if ((decision === "hold" || decision === "rejected") && !comment.trim()) {
      setCommentErrors((prev) => ({
        ...prev,
        [activeUser.id]: `Reason required for ${decision === "hold" ? "hold" : "rejection"}`,
      }));
      return;
    }
    setCommentErrors((prev) => ({ ...prev, [activeUser.id]: "" }));
    setSubmitting(true);
    const idx = SAMPLE_INTAKES.findIndex(
      (s) => s.sampleId === selectedSampleId,
    );
    if (idx !== -1) {
      const currentDecisions: SICApprovalRecord[] =
        SAMPLE_INTAKES[idx].approvalDecisions ?? assignees;
      const updatedDecisions = currentDecisions.map((d) =>
        d.userId === activeUser.id
          ? { ...d, decision, comment, decidedAt: new Date().toISOString() }
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
          ? `${activeUser.name}: ${decision} - ${comment}`
          : `${activeUser.name}: ${decision}`,
      });
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
        toast.success("All assignees approved — Sample is Eligible");
        navigate({
          to: "/registration/$sampleId",
          params: { sampleId: selectedSampleId },
        });
      } else if (newStatus === "OnHold") {
        toast.warning("Sample placed On Hold");
        navigate({ to: "/" });
      } else if (newStatus === "Rejected") {
        toast.error("Sample Rejected");
        navigate({ to: "/" });
      } else {
        const stillPending = updatedDecisions.filter(
          (d) => d.decision === "pending",
        ).length;
        toast.info(
          `Your decision recorded — ${stillPending} approval(s) still pending`,
        );
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

  const allStatuses = [...new Set(SAMPLE_INTAKES.map((s) => s.status))];
  const filteredHistory = [...SAMPLE_INTAKES]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .filter((s) => {
      const q = historySearch.toLowerCase();
      const matchesSearch =
        !q ||
        s.sampleId.toLowerCase().includes(q) ||
        s.sampleName.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q);
      const matchesStatus =
        historyStatus === "all" || s.status === historyStatus;
      return matchesSearch && matchesStatus;
    });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Page Header */}
      <div className="px-6 pt-5 pb-3 border-b border-border bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <ClipboardCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">
              Eligibility Check
            </h1>
            <p className="text-xs text-muted-foreground">
              Verify sample acceptance and test feasibility
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="h-full flex flex-col"
        >
          <div className="px-6 py-2.5 flex-shrink-0 border-b border-border bg-white">
            <AnimatedTabs
              tabs={[
                {
                  id: "form",
                  label: "Entry Form",
                  icon: <ListFilter className="h-3.5 w-3.5" />,
                },
                {
                  id: "history",
                  label: "History",
                  icon: <History className="h-3.5 w-3.5" />,
                  count: SAMPLE_INTAKES.length,
                },
              ]}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>

          {/* Tab 1: Entry Form */}
          <TabsContent value="form" className="flex-1 overflow-y-auto m-0 p-6">
            <div className="max-w-4xl space-y-5">
              {/* Sample Selection */}
              {!sample && (
                <Card className="lims-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      Select Sample for Eligibility Check
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {eligibleSamples.length === 0 ? (
                      <div
                        className="flex flex-col items-center gap-3 py-10 text-muted-foreground"
                        data-ocid="eligibility.empty_state"
                      >
                        <Info className="h-8 w-8 opacity-40" />
                        <span className="text-sm">
                          No samples pending eligibility check
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {eligibleSamples.map((s, i) => (
                          <button
                            type="button"
                            key={s.sampleId}
                            data-ocid={`eligibility.item.${i + 1}`}
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

              {sample && (
                <>
                  {/* Sample Info Banner */}
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ClipboardCheck className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-primary">
                            {sample.sampleId}
                          </span>
                          <StatusBadge status={sample.status} />
                        </div>
                        <p className="text-sm font-medium">
                          {sample.sampleName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {sample.customerName} · {sample.sampleType} ·{" "}
                          {sample.physicalForm}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => setSelectedSampleId("")}
                    >
                      Change Sample
                    </Button>
                  </div>

                  {/* Acceptance Checklist */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Card className="lims-card">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          Acceptance Checklist
                          <span className="ml-auto text-xs text-muted-foreground font-normal">
                            {
                              Object.values(acceptanceChecked).filter(Boolean)
                                .length
                            }
                            /{ACCEPTANCE_CHECKLIST.length}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {ACCEPTANCE_CHECKLIST.map((item) => (
                          <label
                            key={item.id}
                            htmlFor={item.id}
                            className="flex items-start gap-3 cursor-pointer"
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

                    <Card className="lims-card">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-blue-500" />
                          Test Feasibility Checklist
                          <span className="ml-auto text-xs text-muted-foreground font-normal">
                            {
                              Object.values(feasibilityChecked).filter(Boolean)
                                .length
                            }
                            /{FEASIBILITY_CHECKLIST.length}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {FEASIBILITY_CHECKLIST.map((item) => (
                          <label
                            key={item.id}
                            htmlFor={item.id}
                            className="flex items-start gap-3 cursor-pointer"
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

                  {/* Section In-Charge Approvals */}
                  <Card className="lims-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        Section In-Charge Approvals
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          All assigned must approve
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {assignees.map((assignee, idx) => {
                        const isMe = assignee.userId === activeUser.id;
                        const alreadyDecided = assignee.decision !== "pending";
                        const commentVal =
                          decisionComments[assignee.userId] ?? "";
                        return (
                          <div
                            key={assignee.userId}
                            data-ocid={`eligibility.assignee_row.item.${idx + 1}`}
                            className={`rounded-lg border p-4 transition-all ${alreadyDecided ? decisionColor(assignee.decision) : isMe ? "border-primary/40 bg-primary/5" : "border-border bg-muted/20"}`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-xs text-white font-bold">
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
                                    {DUMMY_USERS.find(
                                      (u) => u.id === assignee.userId,
                                    )?.designation ?? "Section In-Charge"}
                                  </p>
                                </div>
                              </div>
                              <div
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${decisionColor(assignee.decision)}`}
                              >
                                {decisionIcon(assignee.decision)}
                                <span className="capitalize">
                                  {assignee.decision}
                                </span>
                              </div>
                            </div>
                            {alreadyDecided && assignee.comment && (
                              <p className="mt-2 text-xs italic text-current/70 ml-11">
                                "{assignee.comment}"
                              </p>
                            )}
                            {isMe && !alreadyDecided && (
                              <div className="mt-3 ml-11 space-y-3">
                                {!checklistsComplete && (
                                  <p className="text-xs text-amber-600 flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    Complete all checklist items above before
                                    deciding
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
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    disabled={!checklistsComplete || submitting}
                                    onClick={() => handleDecision("approved")}
                                    data-ocid="eligibility.approve.button"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-8"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={!checklistsComplete || submitting}
                                    onClick={() => handleDecision("hold")}
                                    data-ocid="eligibility.hold.button"
                                    className="border-amber-300 text-amber-700 hover:bg-amber-50 gap-1.5 h-8"
                                  >
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    Hold
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={!checklistsComplete || submitting}
                                    onClick={() => handleDecision("rejected")}
                                    data-ocid="eligibility.reject.button"
                                    className="border-red-300 text-red-700 hover:bg-red-50 gap-1.5 h-8"
                                  >
                                    <XCircle className="h-3.5 w-3.5" />
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            )}
                            {!isMe && (
                              <div className="mt-2 ml-11">
                                <span className="text-amber-600 flex items-center gap-1 text-xs">
                                  <Info className="h-3 w-3" />
                                  You are not an assigned reviewer for this
                                  sample
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {/* Approval Status Summary */}
                      {assignees.length > 0 &&
                        (() => {
                          const totalCount = assignees.length;
                          const approvedCount = assignees.filter(
                            (a) => a.decision === "approved",
                          ).length;
                          const rejectedCount = assignees.filter(
                            (a) => a.decision === "rejected",
                          ).length;
                          const holdCount = assignees.filter(
                            (a) => a.decision === "hold",
                          ).length;
                          const canProceed =
                            totalCount > 0 &&
                            assignees.every((a) => a.decision === "approved");
                          const isBlocked = rejectedCount > 0 || holdCount > 0;
                          return (
                            <div
                              className={`mt-2 rounded-lg p-3 border flex items-center gap-3 text-xs font-medium ${canProceed ? "bg-emerald-50 border-emerald-200 text-emerald-800" : isBlocked ? "bg-red-50 border-red-200 text-red-800" : "bg-amber-50 border-amber-200 text-amber-800"}`}
                            >
                              {canProceed ? (
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                              ) : isBlocked ? (
                                <XCircle className="h-4 w-4 shrink-0 text-red-600" />
                              ) : (
                                <Clock className="h-4 w-4 shrink-0 text-amber-600" />
                              )}
                              <span>
                                {canProceed
                                  ? `All ${totalCount} Section In-Charge(s) approved — Sample may proceed to Registration.`
                                  : isBlocked
                                    ? `Blocked: ${rejectedCount > 0 ? `${rejectedCount} rejection(s)` : ""}${rejectedCount > 0 && holdCount > 0 ? ", " : ""}${holdCount > 0 ? `${holdCount} hold(s)` : ""} — Sample cannot proceed.`
                                    : `Waiting: ${approvedCount}/${totalCount} approved. All must approve before proceeding.`}
                              </span>
                            </div>
                          );
                        })()}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </TabsContent>

          {/* Tab 2: History */}
          <TabsContent
            value="history"
            className="flex-1 overflow-y-auto m-0 p-6"
          >
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Input
                placeholder="Search Sample ID, Name, Customer..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="h-8 text-xs max-w-xs"
                data-ocid="eligibility.history_search.input"
              />
              <Select value={historyStatus} onValueChange={setHistoryStatus}>
                <SelectTrigger
                  className="h-8 text-xs w-40"
                  data-ocid="eligibility.history_status.select"
                >
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {allStatuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground ml-auto">
                {filteredHistory.length} records
              </span>
            </div>
            <Card className="lims-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  All Samples — Eligibility History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {filteredHistory.length === 0 ? (
                  <div
                    className="py-12 text-center text-muted-foreground text-sm"
                    data-ocid="eligibility.history_empty_state"
                  >
                    No records found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          {[
                            "Sample ID",
                            "Sample Name",
                            "Customer",
                            "Type",
                            "Date of Receipt",
                            "Status",
                            "Assignees",
                            "Decision",
                            "Action",
                          ].map((h) => (
                            <th
                              key={h}
                              className="text-left px-4 py-2.5 font-semibold text-muted-foreground whitespace-nowrap"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredHistory.map((s, idx) => {
                          const rowAssignees =
                            s.approvalDecisions &&
                            s.approvalDecisions.length > 0
                              ? s.approvalDecisions
                              : (Array.isArray(s.assignToSectionInCharge)
                                  ? s.assignToSectionInCharge
                                  : [s.assignToSectionInCharge]
                                ).map((id) => {
                                  const u = DUMMY_USERS.find(
                                    (u) => u.id === id,
                                  );
                                  return {
                                    userId: id,
                                    userName: u?.name ?? id,
                                    decision: "pending" as const,
                                  };
                                });
                          const approvedCount = rowAssignees.filter(
                            (a) => a.decision === "approved",
                          ).length;
                          const totalCount = rowAssignees.length;
                          return (
                            <tr
                              key={s.sampleId}
                              className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                              data-ocid={`eligibility.history.item.${idx + 1}`}
                            >
                              <td className="px-4 py-2.5 font-mono text-primary font-medium">
                                {s.sampleId}
                              </td>
                              <td className="px-4 py-2.5 font-medium">
                                {s.sampleName}
                              </td>
                              <td className="px-4 py-2.5 text-muted-foreground">
                                {s.customerName}
                              </td>
                              <td className="px-4 py-2.5 text-muted-foreground">
                                {s.sampleType}
                              </td>
                              <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                                {s.dateOfReceipt}
                              </td>
                              <td className="px-4 py-2.5">
                                <StatusBadge status={s.status} />
                              </td>
                              <td className="px-4 py-2.5">
                                <div className="flex flex-wrap gap-1">
                                  {rowAssignees.map((a) => (
                                    <span
                                      key={a.userId}
                                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${a.decision === "approved" ? "bg-emerald-100 text-emerald-700" : a.decision === "rejected" ? "bg-red-100 text-red-700" : a.decision === "hold" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}
                                    >
                                      {a.userName.split(" ")[0]}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-2.5">
                                <span
                                  className={`text-xs font-medium ${approvedCount === totalCount ? "text-emerald-600" : "text-amber-600"}`}
                                >
                                  {approvedCount}/{totalCount} approved
                                </span>
                              </td>
                              <td className="px-4 py-2.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-xs px-2"
                                  data-ocid={`eligibility.open_button.${idx + 1}`}
                                  onClick={() => {
                                    setSelectedSampleId(s.sampleId);
                                    setActiveTab("form");
                                  }}
                                >
                                  Open
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
