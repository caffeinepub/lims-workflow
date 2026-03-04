import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowUpDown,
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  Clock,
  FileText,
  Printer,
  ShieldAlert,
  Users,
} from "lucide-react";
import React, { useState } from "react";
import { StatusBadge } from "../components/StatusBadge";
import {
  AUDIT_LOG,
  CLIENTS,
  COA_RECORDS,
  DUMMY_USERS,
  SAMPLE_INTAKES,
  type WorkflowStage,
  getStatusLabel,
  getUserById,
} from "../lib/mockData";

type SortDir = "asc" | "desc";

function useSortable<T>(data: T[], defaultKey: keyof T) {
  const [sortKey, setSortKey] = useState<keyof T>(defaultKey);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const toggle = (key: keyof T) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = [...data].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    const cmp = String(av).localeCompare(String(bv));
    return sortDir === "asc" ? cmp : -cmp;
  });

  return { sorted, sortKey, sortDir, toggle };
}

function SortTh({
  label,
  colKey,
  sortKey,
  onToggle,
}: {
  label: string;
  colKey: string;
  sortKey: string;
  sortDir: SortDir;
  onToggle: () => void;
}) {
  return (
    <th
      className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground whitespace-nowrap select-none"
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onToggle();
      }}
    >
      <span className="flex items-center gap-1">
        {label}
        <ArrowUpDown
          className={`h-3 w-3 ${sortKey === colKey ? "text-primary" : "text-muted-foreground/40"}`}
        />
      </span>
    </th>
  );
}

// ── Customer-wise ──────────────────────────────────────────────
function CustomerWiseReport() {
  const grouped: Record<string, typeof SAMPLE_INTAKES> = {};
  for (const s of SAMPLE_INTAKES) {
    if (!grouped[s.customerName]) grouped[s.customerName] = [];
    grouped[s.customerName].push(s);
  }
  const rows = Object.entries(grouped).map(([name, samples]) => ({
    name,
    total: samples.length,
    coa: samples.filter((s) => s.status === "COA").length,
    inProgress: samples.filter((s) => !["COA", "OnHold"].includes(s.status))
      .length,
    onHold: samples.filter((s) => s.status === "OnHold").length,
  }));
  const { sorted, sortKey, sortDir, toggle } = useSortable(rows, "name");

  return (
    <div className="table-scroll">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {[
              ["name", "Client Name"],
              ["total", "Total Samples"],
              ["inProgress", "In Progress"],
              ["coa", "COA Issued"],
              ["onHold", "On Hold"],
            ].map(([k, l]) => (
              <SortTh
                key={k}
                label={l}
                colKey={k}
                sortKey={String(sortKey)}
                sortDir={sortDir}
                onToggle={() => toggle(k as keyof (typeof rows)[0])}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => (
            <tr
              key={r.name}
              className={`border-b border-border/50 hover:bg-muted/20 ${i % 2 === 0 ? "" : "bg-muted/10"}`}
            >
              <td className="py-2.5 px-3 font-medium">{r.name}</td>
              <td className="py-2.5 px-3 text-center font-semibold">
                {r.total}
              </td>
              <td className="py-2.5 px-3 text-center text-amber-600 font-medium">
                {r.inProgress}
              </td>
              <td className="py-2.5 px-3 text-center text-emerald-600 font-medium">
                {r.coa}
              </td>
              <td className="py-2.5 px-3 text-center text-red-600 font-medium">
                {r.onHold}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Registration-wise ──────────────────────────────────────────
function RegistrationWiseReport() {
  const rows = SAMPLE_INTAKES.map((s) => ({
    sampleId: s.sampleId,
    sampleName: s.sampleName,
    clientName: s.customerName,
    dateOfReceipt: s.dateOfReceipt,
    status: s.status,
    createdBy: getUserById(s.createdBy)?.name || s.createdBy,
  }));
  const { sorted, sortKey, sortDir, toggle } = useSortable(
    rows,
    "dateOfReceipt",
  );

  return (
    <div className="table-scroll">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {[
              ["sampleId", "Sample ID"],
              ["sampleName", "Sample Name"],
              ["clientName", "Client"],
              ["dateOfReceipt", "Date"],
              ["status", "Status"],
              ["createdBy", "Created By"],
            ].map(([k, l]) => (
              <SortTh
                key={k}
                label={l}
                colKey={k}
                sortKey={String(sortKey)}
                sortDir={sortDir}
                onToggle={() => toggle(k as keyof (typeof rows)[0])}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => (
            <tr
              key={r.sampleId}
              className={`border-b border-border/50 hover:bg-muted/20 ${i % 2 === 0 ? "" : "bg-muted/10"}`}
            >
              <td className="py-2.5 px-3 font-mono text-xs font-semibold text-primary">
                {r.sampleId}
              </td>
              <td className="py-2.5 px-3 font-medium">{r.sampleName}</td>
              <td className="py-2.5 px-3 text-muted-foreground">
                {r.clientName}
              </td>
              <td className="py-2.5 px-3 text-xs text-muted-foreground">
                {new Date(r.dateOfReceipt).toLocaleDateString("en-IN")}
              </td>
              <td className="py-2.5 px-3">
                <StatusBadge status={r.status as WorkflowStage} />
              </td>
              <td className="py-2.5 px-3 text-xs text-muted-foreground">
                {r.createdBy}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── User-wise ──────────────────────────────────────────────────
function UserWiseReport() {
  const rows = DUMMY_USERS.map((u) => {
    const assigned = SAMPLE_INTAKES.filter(
      (s) => s.assignToSectionInCharge === u.id || s.createdBy === u.id,
    );
    const completed = assigned.filter((s) => s.status === "COA").length;
    return {
      name: u.name,
      role: u.role,
      designation: u.designation,
      assigned: assigned.length,
      completed,
      pending: assigned.length - completed,
    };
  });
  const { sorted, sortKey, sortDir, toggle } = useSortable(rows, "name");

  const roleLabels: Record<string, string> = {
    admin: "Admin",
    qa: "QA Director",
    sectionInCharge: "Section In-Charge",
    analyst: "Analyst",
  };

  return (
    <div className="table-scroll">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {[
              ["name", "User Name"],
              ["role", "Role"],
              ["designation", "Designation"],
              ["assigned", "Assigned"],
              ["completed", "Completed"],
              ["pending", "Pending"],
            ].map(([k, l]) => (
              <SortTh
                key={k}
                label={l}
                colKey={k}
                sortKey={String(sortKey)}
                sortDir={sortDir}
                onToggle={() => toggle(k as keyof (typeof rows)[0])}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => (
            <tr
              key={r.name}
              className={`border-b border-border/50 hover:bg-muted/20 ${i % 2 === 0 ? "" : "bg-muted/10"}`}
            >
              <td className="py-2.5 px-3 font-medium">{r.name}</td>
              <td className="py-2.5 px-3">
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {roleLabels[r.role]}
                </span>
              </td>
              <td className="py-2.5 px-3 text-xs text-muted-foreground">
                {r.designation}
              </td>
              <td className="py-2.5 px-3 text-center font-semibold">
                {r.assigned}
              </td>
              <td className="py-2.5 px-3 text-center text-emerald-600 font-medium">
                {r.completed}
              </td>
              <td className="py-2.5 px-3 text-center text-amber-600 font-medium">
                {r.pending}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Date-wise TAT ──────────────────────────────────────────────
function DateWiseTATReport() {
  const rows = COA_RECORDS.map((coa) => {
    const sample = SAMPLE_INTAKES.find((s) => s.sampleId === coa.sampleId);
    const intakeDate = sample ? new Date(sample.dateOfReceipt) : null;
    const coaDate = new Date(coa.issueDate);
    const tat = intakeDate
      ? Math.ceil((coaDate.getTime() - intakeDate.getTime()) / 86400000)
      : null;
    return {
      sampleId: coa.sampleId,
      coaNumber: coa.coaNumber,
      clientName: coa.clientName,
      sampleName: coa.sampleName,
      intakeDate: sample?.dateOfReceipt || "—",
      coaDate: coa.issueDate,
      tat: tat ?? 0,
    };
  });
  const { sorted, sortKey, sortDir, toggle } = useSortable(rows, "tat");

  return (
    <div className="table-scroll">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {[
              ["sampleId", "Sample ID"],
              ["sampleName", "Sample Name"],
              ["clientName", "Client"],
              ["intakeDate", "Intake Date"],
              ["coaDate", "COA Date"],
              ["tat", "TAT (Days)"],
            ].map(([k, l]) => (
              <SortTh
                key={k}
                label={l}
                colKey={k}
                sortKey={String(sortKey)}
                sortDir={sortDir}
                onToggle={() => toggle(k as keyof (typeof rows)[0])}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => (
            <tr
              key={r.sampleId}
              className={`border-b border-border/50 hover:bg-muted/20 ${i % 2 === 0 ? "" : "bg-muted/10"}`}
            >
              <td className="py-2.5 px-3 font-mono text-xs font-semibold text-primary">
                {r.sampleId}
              </td>
              <td className="py-2.5 px-3 font-medium">{r.sampleName}</td>
              <td className="py-2.5 px-3 text-muted-foreground">
                {r.clientName}
              </td>
              <td className="py-2.5 px-3 text-xs text-muted-foreground">
                {r.intakeDate !== "—"
                  ? new Date(r.intakeDate).toLocaleDateString("en-IN")
                  : "—"}
              </td>
              <td className="py-2.5 px-3 text-xs text-muted-foreground">
                {new Date(r.coaDate).toLocaleDateString("en-IN")}
              </td>
              <td className="py-2.5 px-3">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${r.tat <= 7 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : r.tat <= 14 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-red-50 text-red-700 border-red-200"}`}
                >
                  {r.tat}d
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Final COA List ─────────────────────────────────────────────
function FinalCOAListReport() {
  const navigate = useNavigate();
  const rows = COA_RECORDS.map((c) => ({
    coaNumber: c.coaNumber,
    sampleId: c.sampleId,
    sampleName: c.sampleName,
    clientName: c.clientName,
    issueDate: c.issueDate,
    overallResult: c.overallResult,
    qaApprover: c.qaApproverName,
  }));
  const { sorted, sortKey, sortDir, toggle } = useSortable(rows, "issueDate");

  return (
    <div className="table-scroll">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {[
              ["coaNumber", "COA Number"],
              ["sampleId", "Sample ID"],
              ["sampleName", "Sample Name"],
              ["clientName", "Client"],
              ["issueDate", "Issue Date"],
              ["overallResult", "Result"],
              ["qaApprover", "QA Approver"],
            ].map(([k, l]) => (
              <SortTh
                key={k}
                label={l}
                colKey={k}
                sortKey={String(sortKey)}
                sortDir={sortDir}
                onToggle={() => toggle(k as keyof (typeof rows)[0])}
              />
            ))}
            <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => (
            <tr
              key={r.coaNumber}
              className={`border-b border-border/50 hover:bg-muted/20 ${i % 2 === 0 ? "" : "bg-muted/10"}`}
            >
              <td className="py-2.5 px-3 font-mono text-xs font-semibold text-primary">
                {r.coaNumber}
              </td>
              <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">
                {r.sampleId}
              </td>
              <td className="py-2.5 px-3 font-medium">{r.sampleName}</td>
              <td className="py-2.5 px-3 text-muted-foreground">
                {r.clientName}
              </td>
              <td className="py-2.5 px-3 text-xs text-muted-foreground">
                {new Date(r.issueDate).toLocaleDateString("en-IN")}
              </td>
              <td className="py-2.5 px-3">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${r.overallResult === "PASS" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}
                >
                  {r.overallResult}
                </span>
              </td>
              <td className="py-2.5 px-3 text-xs text-muted-foreground">
                {r.qaApprover}
              </td>
              <td className="py-2.5 px-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs px-2"
                  onClick={() =>
                    navigate({
                      to: "/coa/$sampleId",
                      params: { sampleId: r.sampleId },
                    })
                  }
                >
                  View COA
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Audit Trail ────────────────────────────────────────────────
function AuditTrailReport() {
  const [filterUser, setFilterUser] = useState("all");
  const [filterAction, setFilterAction] = useState("all");
  const [filterDate, setFilterDate] = useState("");

  const actions = [...new Set(AUDIT_LOG.map((a) => a.action))];

  const filtered = AUDIT_LOG.filter((a) => {
    if (filterUser !== "all" && a.userId !== filterUser) return false;
    if (filterAction !== "all" && a.action !== filterAction) return false;
    if (filterDate && !a.timestamp.startsWith(filterDate)) return false;
    return true;
  }).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  const ACTION_COLORS: Record<string, string> = {
    CREATE: "bg-blue-50 text-blue-700 border-blue-200",
    APPROVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    REJECT: "bg-red-50 text-red-700 border-red-200",
    HOLD: "bg-amber-50 text-amber-700 border-amber-200",
    ELIGIBLE: "bg-indigo-50 text-indigo-700 border-indigo-200",
    SUBMIT: "bg-violet-50 text-violet-700 border-violet-200",
    RETURN: "bg-orange-50 text-orange-700 border-orange-200",
    STATUS_CHANGE: "bg-slate-50 text-slate-700 border-slate-200",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Select value={filterUser} onValueChange={setFilterUser}>
          <SelectTrigger className="w-48 h-8 text-xs">
            <SelectValue placeholder="Filter by user" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {DUMMY_USERS.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {actions.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="w-40 h-8 text-xs"
        />
        {(filterUser !== "all" || filterAction !== "all" || filterDate) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => {
              setFilterUser("all");
              setFilterAction("all");
              setFilterDate("");
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>
      <div className="table-scroll">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {[
                "Timestamp",
                "User",
                "Action",
                "Entity",
                "Entity ID",
                "Details",
              ].map((h) => (
                <th
                  key={h}
                  className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry, i) => (
              <tr
                key={entry.id}
                className={`border-b border-border/50 hover:bg-muted/20 ${i % 2 === 0 ? "" : "bg-muted/10"}`}
              >
                <td className="py-2.5 px-3 text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(entry.timestamp).toLocaleString("en-IN")}
                </td>
                <td className="py-2.5 px-3 text-xs font-medium">
                  {entry.userName}
                </td>
                <td className="py-2.5 px-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${ACTION_COLORS[entry.action] || "bg-gray-50 text-gray-600 border-gray-200"}`}
                  >
                    {entry.action}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-xs text-muted-foreground">
                  {entry.entity}
                </td>
                <td className="py-2.5 px-3 font-mono text-xs text-primary">
                  {entry.entityId}
                </td>
                <td className="py-2.5 px-3 text-xs text-muted-foreground max-w-xs truncate">
                  {entry.details}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Pending Approvals ──────────────────────────────────────────
function PendingApprovalsReport() {
  const navigate = useNavigate();
  const stages: WorkflowStage[] = [
    "Intake",
    "EligibilityCheck",
    "Registration",
    "TestSpec",
    "Analysis",
    "SICReview",
    "QAReview",
    "OnHold",
  ];

  const rows = stages
    .map((stage) => {
      const samples = SAMPLE_INTAKES.filter((s) => s.status === stage);
      const oldest =
        samples.length > 0
          ? samples.reduce((a, b) =>
              new Date(a.dateOfReceipt) < new Date(b.dateOfReceipt) ? a : b,
            )
          : null;
      return {
        stage,
        count: samples.length,
        oldest: oldest?.dateOfReceipt || null,
        oldestId: oldest?.sampleId || null,
      };
    })
    .filter((r) => r.count > 0);

  const stageNavMap: Record<string, string> = {
    Intake: "/eligibility-check",
    EligibilityCheck: "/eligibility-check",
    Registration: "/registration",
    TestSpec: "/test-specification",
    Analysis: "/analysis",
    SICReview: "/sic-review",
    QAReview: "/qa-review",
    OnHold: "/eligibility-check",
  };

  return (
    <div className="table-scroll">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {[
              "Stage",
              "Pending Count",
              "Oldest Sample Date",
              "Oldest Sample ID",
              "Action",
            ].map((h) => (
              <th
                key={h}
                className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.stage}
              className={`border-b border-border/50 hover:bg-muted/20 ${i % 2 === 0 ? "" : "bg-muted/10"}`}
            >
              <td className="py-2.5 px-3">
                <StatusBadge status={r.stage} />
              </td>
              <td className="py-2.5 px-3">
                <span
                  className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${r.count > 3 ? "bg-red-100 text-red-700" : r.count > 1 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}
                >
                  {r.count}
                </span>
              </td>
              <td className="py-2.5 px-3 text-xs text-muted-foreground">
                {r.oldest
                  ? new Date(r.oldest).toLocaleDateString("en-IN")
                  : "—"}
              </td>
              <td className="py-2.5 px-3 font-mono text-xs text-primary">
                {r.oldestId || "—"}
              </td>
              <td className="py-2.5 px-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs px-2"
                  onClick={() => navigate({ to: stageNavMap[r.stage] as "/" })}
                >
                  View Stage
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Reports Page ──────────────────────────────────────────
export function Reports() {
  const tabs = [
    {
      id: "customer",
      label: "Customer-wise",
      icon: <Users className="h-3.5 w-3.5" />,
      component: <CustomerWiseReport />,
    },
    {
      id: "registration",
      label: "Registration-wise",
      icon: <FileText className="h-3.5 w-3.5" />,
      component: <RegistrationWiseReport />,
    },
    {
      id: "user",
      label: "User-wise",
      icon: <Users className="h-3.5 w-3.5" />,
      component: <UserWiseReport />,
    },
    {
      id: "tat",
      label: "Date-wise TAT",
      icon: <Clock className="h-3.5 w-3.5" />,
      component: <DateWiseTATReport />,
    },
    {
      id: "coa",
      label: "Final COA List",
      icon: <Award className="h-3.5 w-3.5" />,
      component: <FinalCOAListReport />,
    },
    {
      id: "audit",
      label: "Audit Trail",
      icon: <BookOpen className="h-3.5 w-3.5" />,
      component: <AuditTrailReport />,
    },
    {
      id: "pending",
      label: "Pending Approvals",
      icon: <ShieldAlert className="h-3.5 w-3.5" />,
      component: <PendingApprovalsReport />,
    },
  ];

  return (
    <div className="p-6">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Reports
          </h1>
          <p className="page-subtitle">
            Analytics and reporting across all workflow stages
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 print-hide"
          onClick={() => window.print()}
        >
          <Printer className="h-4 w-4" />
          Print Report
        </Button>
      </div>

      <Tabs defaultValue="customer">
        <TabsList className="flex flex-wrap h-auto gap-1 mb-4 bg-muted/50 p-1">
          {tabs.map((t) => (
            <TabsTrigger
              key={t.id}
              value={t.id}
              className="flex items-center gap-1.5 text-xs h-8"
            >
              {t.icon}
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((t) => (
          <TabsContent key={t.id} value={t.id}>
            <Card className="lims-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  {t.icon}
                  {t.label} Report
                </CardTitle>
              </CardHeader>
              <CardContent>{t.component}</CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
