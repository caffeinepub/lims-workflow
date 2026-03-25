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
  Clock,
  FileText,
  Printer,
  Search,
  ShieldAlert,
  Users,
  X,
} from "lucide-react";
import React, { useState } from "react";
import { StatusBadge } from "../components/StatusBadge";
import {
  AUDIT_LOG,
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
  sortDir: _sortDir,
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

interface FilterBarProps {
  search: string;
  onSearch: (v: string) => void;
  dateFrom: string;
  onDateFrom: (v: string) => void;
  dateTo: string;
  onDateTo: (v: string) => void;
  statusOptions?: string[];
  status: string;
  onStatus: (v: string) => void;
  onClear: () => void;
  resultCount: number;
}

function FilterBar({
  search,
  onSearch,
  dateFrom,
  onDateFrom,
  dateTo,
  onDateTo,
  statusOptions,
  status,
  onStatus,
  onClear,
  resultCount,
}: FilterBarProps) {
  const hasFilters = search || dateFrom || dateTo || status !== "all";
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-muted/30 rounded-lg border border-border">
      <div className="relative flex-1 min-w-[180px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search..."
          className="pl-8 h-8 text-xs"
          data-ocid="reports.search.input"
        />
      </div>
      <Input
        type="date"
        value={dateFrom}
        onChange={(e) => onDateFrom(e.target.value)}
        className="w-36 h-8 text-xs"
        data-ocid="reports.date_from.input"
      />
      <Input
        type="date"
        value={dateTo}
        onChange={(e) => onDateTo(e.target.value)}
        className="w-36 h-8 text-xs"
        data-ocid="reports.date_to.input"
      />
      {statusOptions && statusOptions.length > 0 && (
        <Select value={status} onValueChange={onStatus}>
          <SelectTrigger
            className="w-40 h-8 text-xs"
            data-ocid="reports.status.select"
          >
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statusOptions.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-8 gap-1 text-xs"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}
      <span className="text-xs text-muted-foreground ml-auto font-medium">
        {resultCount} result{resultCount !== 1 ? "s" : ""}
      </span>
    </div>
  );
}

function exportToCSV(headers: string[], rows: string[][], filename: string) {
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      r.map((c) => `"${String(c).replace(/"/g, "'")}"`).join(","),
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Customer-wise ──────────────────────────────────────────────
function CustomerWiseReport() {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [status, setStatus] = useState("all");

  const grouped: Record<string, typeof SAMPLE_INTAKES> = {};
  for (const s of SAMPLE_INTAKES) {
    if (!grouped[s.customerName]) grouped[s.customerName] = [];
    grouped[s.customerName].push(s);
  }
  const allStatuses = [...new Set(SAMPLE_INTAKES.map((s) => s.status))];

  let rows = Object.entries(grouped)
    .map(([name, samples]) => {
      const filtered =
        status === "all" ? samples : samples.filter((s) => s.status === status);
      const dateFiltered = filtered.filter((s) => {
        const d = s.dateOfReceipt;
        return (!dateFrom || d >= dateFrom) && (!dateTo || d <= dateTo);
      });
      return {
        name,
        total: dateFiltered.length,
        coa: dateFiltered.filter((s) => s.status === "COA").length,
        inProgress: dateFiltered.filter(
          (s) => !["COA", "OnHold"].includes(s.status),
        ).length,
        onHold: dateFiltered.filter((s) => s.status === "OnHold").length,
      };
    })
    .filter((r) => r.total > 0);

  if (search)
    rows = rows.filter((r) =>
      r.name.toLowerCase().includes(search.toLowerCase()),
    );
  const { sorted, sortKey, sortDir, toggle } = useSortable(rows, "name");

  return (
    <div className="space-y-3">
      <FilterBar
        search={search}
        onSearch={setSearch}
        dateFrom={dateFrom}
        onDateFrom={setDateFrom}
        dateTo={dateTo}
        onDateTo={setDateTo}
        statusOptions={allStatuses}
        status={status}
        onStatus={setStatus}
        onClear={() => {
          setSearch("");
          setDateFrom("");
          setDateTo("");
          setStatus("all");
        }}
        resultCount={sorted.length}
      />
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1.5"
          onClick={() =>
            exportToCSV(
              ["Client", "Total", "In Progress", "COA Issued", "On Hold"],
              sorted.map((r) => [
                r.name,
                String(r.total),
                String(r.inProgress),
                String(r.coa),
                String(r.onHold),
              ]),
              "customer_report.csv",
            )
          }
        >
          <Printer className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>
      <div className="overflow-x-auto">
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
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-10 text-center text-muted-foreground text-sm"
                >
                  No results match the current filters.
                </td>
              </tr>
            ) : (
              sorted.map((r, i) => (
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Registration-wise ──────────────────────────────────────────
function RegistrationWiseReport() {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [status, setStatus] = useState("all");

  const allStatuses = [...new Set(SAMPLE_INTAKES.map((s) => s.status))];

  let rows = SAMPLE_INTAKES.map((s) => ({
    sampleId: s.sampleId,
    sampleName: s.sampleName,
    clientName: s.customerName,
    dateOfReceipt: s.dateOfReceipt,
    status: s.status,
    createdBy: getUserById(s.createdBy)?.name || s.createdBy,
  }));

  rows = rows.filter((r) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      r.sampleId.toLowerCase().includes(q) ||
      r.sampleName.toLowerCase().includes(q) ||
      r.clientName.toLowerCase().includes(q);
    const matchesStatus = status === "all" || r.status === status;
    const matchesDateFrom = !dateFrom || r.dateOfReceipt >= dateFrom;
    const matchesDateTo = !dateTo || r.dateOfReceipt <= dateTo;
    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
  });

  const { sorted, sortKey, sortDir, toggle } = useSortable(
    rows,
    "dateOfReceipt",
  );

  return (
    <div className="space-y-3">
      <FilterBar
        search={search}
        onSearch={setSearch}
        dateFrom={dateFrom}
        onDateFrom={setDateFrom}
        dateTo={dateTo}
        onDateTo={setDateTo}
        statusOptions={allStatuses}
        status={status}
        onStatus={setStatus}
        onClear={() => {
          setSearch("");
          setDateFrom("");
          setDateTo("");
          setStatus("all");
        }}
        resultCount={sorted.length}
      />
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1.5"
          onClick={() =>
            exportToCSV(
              [
                "Sample ID",
                "Sample Name",
                "Client",
                "Date",
                "Status",
                "Created By",
              ],
              sorted.map((r) => [
                r.sampleId,
                r.sampleName,
                r.clientName,
                r.dateOfReceipt,
                r.status,
                r.createdBy,
              ]),
              "registration_report.csv",
            )
          }
        >
          <Printer className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>
      <div className="overflow-x-auto">
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
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground text-sm"
                >
                  No results match the current filters.
                </td>
              </tr>
            ) : (
              sorted.map((r, i) => (
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── User-wise ──────────────────────────────────────────────────
function UserWiseReport() {
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  const roleLabels: Record<string, string> = {
    admin: "Admin",
    qa: "QA Director",
    sectionInCharge: "Section In-Charge",
    analyst: "Analyst",
  };
  const roles = [...new Set(DUMMY_USERS.map((u) => u.role))];

  let rows = DUMMY_USERS.map((u) => {
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

  rows = rows.filter((r) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      r.name.toLowerCase().includes(q) ||
      r.designation?.toLowerCase().includes(q);
    const matchesRole = filterRole === "all" || r.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const { sorted, sortKey, sortDir, toggle } = useSortable(rows, "name");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-muted/30 rounded-lg border border-border">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="pl-8 h-8 text-xs"
          />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-44 h-8 text-xs">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {roles.map((r) => (
              <SelectItem key={r} value={r}>
                {roleLabels[r] ?? r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(search || filterRole !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setFilterRole("all");
            }}
            className="h-8 gap-1 text-xs"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {sorted.length} result{sorted.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1.5"
          onClick={() =>
            exportToCSV(
              [
                "Name",
                "Role",
                "Designation",
                "Assigned",
                "Completed",
                "Pending",
              ],
              sorted.map((r) => [
                r.name,
                roleLabels[r.role] ?? r.role,
                r.designation ?? "N/A",
                String(r.assigned),
                String(r.completed),
                String(r.pending),
              ]),
              "user_report.csv",
            )
          }
        >
          <Printer className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>
      <div className="overflow-x-auto">
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
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground text-sm"
                >
                  No results match the current filters.
                </td>
              </tr>
            ) : (
              sorted.map((r, i) => (
                <tr
                  key={r.name}
                  className={`border-b border-border/50 hover:bg-muted/20 ${i % 2 === 0 ? "" : "bg-muted/10"}`}
                >
                  <td className="py-2.5 px-3 font-medium">{r.name}</td>
                  <td className="py-2.5 px-3 text-xs">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                      {roleLabels[r.role] ?? r.role}
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Date-wise TAT ──────────────────────────────────────────────
function DateWiseTATReport() {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [status, setStatus] = useState("all");

  let rows = COA_RECORDS.map((coa) => {
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
      intakeDate: sample?.dateOfReceipt || "",
      coaDate: coa.issueDate,
      tat: tat ?? 0,
      overallResult: coa.overallResult,
    };
  });

  rows = rows.filter((r) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      r.sampleId.toLowerCase().includes(q) ||
      r.clientName.toLowerCase().includes(q) ||
      r.sampleName.toLowerCase().includes(q);
    const matchesStatus =
      status === "all" ||
      (status === "PASS" && r.overallResult === "PASS") ||
      (status === "FAIL" && r.overallResult !== "PASS");
    const matchesDateFrom = !dateFrom || r.coaDate >= dateFrom;
    const matchesDateTo = !dateTo || r.coaDate <= dateTo;
    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
  });

  const { sorted, sortKey, sortDir, toggle } = useSortable(rows, "tat");

  return (
    <div className="space-y-3">
      <FilterBar
        search={search}
        onSearch={setSearch}
        dateFrom={dateFrom}
        onDateFrom={setDateFrom}
        dateTo={dateTo}
        onDateTo={setDateTo}
        statusOptions={["PASS", "FAIL"]}
        status={status}
        onStatus={setStatus}
        onClear={() => {
          setSearch("");
          setDateFrom("");
          setDateTo("");
          setStatus("all");
        }}
        resultCount={sorted.length}
      />
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1.5"
          onClick={() =>
            exportToCSV(
              [
                "Sample ID",
                "Sample Name",
                "Client",
                "Intake Date",
                "COA Date",
                "TAT (Days)",
              ],
              sorted.map((r) => [
                r.sampleId,
                r.sampleName,
                r.clientName,
                r.intakeDate,
                r.coaDate,
                String(r.tat),
              ]),
              "tat_report.csv",
            )
          }
        >
          <Printer className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>
      <div className="overflow-x-auto">
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
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground text-sm"
                >
                  No results match the current filters.
                </td>
              </tr>
            ) : (
              sorted.map((r, i) => (
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
                    {r.intakeDate
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Final COA List ─────────────────────────────────────────────
function FinalCOAListReport() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [resultFilter, setResultFilter] = useState("all");

  let rows = COA_RECORDS.map((c) => ({
    coaNumber: c.coaNumber,
    sampleId: c.sampleId,
    sampleName: c.sampleName,
    clientName: c.clientName,
    issueDate: c.issueDate,
    overallResult: c.overallResult,
    qaApprover: c.qaApproverName,
  }));

  rows = rows.filter((r) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      r.coaNumber.toLowerCase().includes(q) ||
      r.sampleId.toLowerCase().includes(q) ||
      r.sampleName.toLowerCase().includes(q) ||
      r.clientName.toLowerCase().includes(q);
    const matchesResult =
      resultFilter === "all" || r.overallResult === resultFilter;
    const matchesDateFrom = !dateFrom || r.issueDate >= dateFrom;
    const matchesDateTo = !dateTo || r.issueDate <= dateTo;
    return matchesSearch && matchesResult && matchesDateFrom && matchesDateTo;
  });

  const { sorted, sortKey, sortDir, toggle } = useSortable(rows, "issueDate");

  return (
    <div className="space-y-3">
      <FilterBar
        search={search}
        onSearch={setSearch}
        dateFrom={dateFrom}
        onDateFrom={setDateFrom}
        dateTo={dateTo}
        onDateTo={setDateTo}
        statusOptions={["PASS", "FAIL"]}
        status={resultFilter}
        onStatus={setResultFilter}
        onClear={() => {
          setSearch("");
          setDateFrom("");
          setDateTo("");
          setResultFilter("all");
        }}
        resultCount={sorted.length}
      />
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1.5"
          onClick={() =>
            exportToCSV(
              [
                "COA Number",
                "Sample ID",
                "Sample Name",
                "Client",
                "Issue Date",
                "Result",
                "QA Approver",
              ],
              sorted.map((r) => [
                r.coaNumber,
                r.sampleId,
                r.sampleName,
                r.clientName,
                r.issueDate,
                r.overallResult,
                r.qaApprover,
              ]),
              "coa_list_report.csv",
            )
          }
        >
          <Printer className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>
      <div className="overflow-x-auto">
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
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-10 text-center text-muted-foreground text-sm"
                >
                  No results match the current filters.
                </td>
              </tr>
            ) : (
              sorted.map((r, i) => (
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Audit Trail ────────────────────────────────────────────────
function AuditTrailReport() {
  const [filterUser, setFilterUser] = useState("all");
  const [filterAction, setFilterAction] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [search, setSearch] = useState("");

  const actions = [...new Set(AUDIT_LOG.map((a) => a.action))];

  const filtered = AUDIT_LOG.filter((a) => {
    if (filterUser !== "all" && a.userId !== filterUser) return false;
    if (filterAction !== "all" && a.action !== filterAction) return false;
    if (filterDate && !a.timestamp.startsWith(filterDate)) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !a.entityId.toLowerCase().includes(q) &&
        !a.entity.toLowerCase().includes(q) &&
        !a.details?.toLowerCase().includes(q)
      )
        return false;
    }
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
      <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-muted/30 rounded-lg border border-border">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search details..."
            className="pl-8 h-8 text-xs"
          />
        </div>
        <Select value={filterUser} onValueChange={setFilterUser}>
          <SelectTrigger className="w-44 h-8 text-xs">
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
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue placeholder="All Actions" />
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
          className="w-36 h-8 text-xs"
        />
        {(search ||
          filterUser !== "all" ||
          filterAction !== "all" ||
          filterDate) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={() => {
              setSearch("");
              setFilterUser("all");
              setFilterAction("all");
              setFilterDate("");
            }}
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="overflow-x-auto">
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
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground text-sm"
                >
                  No results match the current filters.
                </td>
              </tr>
            ) : (
              filtered.map((entry, i) => (
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
                  <td
                    className="py-2.5 px-3 text-xs text-muted-foreground max-w-[200px] truncate"
                    title={entry.details}
                  >
                    {entry.details}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Pending Approvals ──────────────────────────────────────────
function PendingApprovalsReport() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const stages = [
    "Intake",
    "EligibilityCheck",
    "Registration",
    "TestSpec",
    "Analysis",
    "SICReview",
    "QAReview",
    "OnHold",
  ];
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

  let rows = stages
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

  if (search)
    rows = rows.filter(
      (r) =>
        r.stage.toLowerCase().includes(search.toLowerCase()) ||
        r.oldestId?.toLowerCase().includes(search.toLowerCase()),
    );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-muted/30 rounded-lg border border-border">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stage or Sample ID..."
            className="pl-8 h-8 text-xs"
          />
        </div>
        {search && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearch("")}
            className="h-8 gap-1 text-xs"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {rows.length} stage{rows.length !== 1 ? "s" : ""} with pending items
        </span>
      </div>
      <div className="overflow-x-auto">
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
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-10 text-center text-muted-foreground text-sm"
                >
                  No pending approvals found.
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr
                  key={r.stage}
                  className={`border-b border-border/50 hover:bg-muted/20 ${i % 2 === 0 ? "" : "bg-muted/10"}`}
                >
                  <td className="py-2.5 px-3">
                    <StatusBadge status={r.stage as WorkflowStage} />
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
                      onClick={() =>
                        navigate({ to: stageNavMap[r.stage] as "/" })
                      }
                    >
                      View Stage
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
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
              data-ocid={`reports.${t.id}.tab`}
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
