import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Calculator,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  ExternalLink,
  FlaskConical,
  Microscope,
  Percent,
  Ruler,
  Settings,
  TrendingUp,
  Wrench,
  Zap,
} from "lucide-react";
import React, { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StatusBadge } from "../components/StatusBadge";
import { useRole } from "../contexts/RoleContext";
import { useAllTasks } from "../hooks/useBackendService";
import {
  AUDIT_LOG,
  SAMPLE_INTAKES,
  type WorkflowStage,
  getStatusLabel,
} from "../lib/mockData";

const STAGE_COLORS: Record<string, string> = {
  Intake: "#94a3b8",
  EligibilityCheck: "#60a5fa",
  Registration: "#818cf8",
  TestSpec: "#a78bfa",
  Analysis: "#fbbf24",
  SICReview: "#fb923c",
  QAReview: "#c084fc",
  COA: "#34d399",
  OnHold: "#f87171",
};

const CAMUNDA_MOCK = [
  {
    name: "Sample Processing",
    instances: 8,
    active: 5,
    completed: 3,
    status: "running",
  },
  {
    name: "Quality Review",
    instances: 4,
    active: 2,
    completed: 2,
    status: "running",
  },
  {
    name: "COA Generation",
    instances: 2,
    active: 0,
    completed: 2,
    status: "completed",
  },
  {
    name: "Hold Resolution",
    instances: 1,
    active: 1,
    completed: 0,
    status: "warning",
  },
];

const PIPELINE_STAGES: { key: WorkflowStage; label: string }[] = [
  { key: "Intake", label: "Intake" },
  { key: "EligibilityCheck", label: "Eligibility" },
  { key: "Registration", label: "Registration" },
  { key: "TestSpec", label: "Test Spec" },
  { key: "Analysis", label: "Analysis" },
  { key: "SICReview", label: "SIC Review" },
  { key: "QAReview", label: "QA Review" },
  { key: "COA", label: "COA" },
];

const ACTION_COLOR: Record<string, string> = {
  CREATE: "bg-blue-100 text-blue-700",
  STATUS_CHANGE: "bg-violet-100 text-violet-700",
  ELIGIBLE: "bg-emerald-100 text-emerald-700",
  APPROVE: "bg-green-100 text-green-700",
  SUBMIT: "bg-cyan-100 text-cyan-700",
  HOLD: "bg-amber-100 text-amber-700",
  REJECT: "bg-red-100 text-red-700",
};

function getSlaClass(deadline: string): string {
  const ms = new Date(deadline).getTime() - Date.now();
  const hrs = ms / 3600000;
  if (hrs < 0) return "bg-red-100 text-red-700 border-red-200";
  if (hrs < 24) return "bg-red-100 text-red-700 border-red-200";
  if (hrs < 72) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-emerald-100 text-emerald-700 border-emerald-200";
}

function formatSla(deadline: string): string {
  const ms = new Date(deadline).getTime() - Date.now();
  const hrs = Math.round(ms / 3600000);
  if (hrs < 0) return "Overdue";
  if (hrs < 24) return `${hrs}h left`;
  return `${Math.round(hrs / 24)}d left`;
}

function getUrgencyDot(status: WorkflowStage): string {
  if (status === "OnHold") return "bg-red-500";
  if (status === "Analysis" || status === "SICReview" || status === "QAReview")
    return "bg-amber-500";
  if (status === "COA") return "bg-emerald-500";
  return "bg-blue-400";
}

function getTaskTypeLabel(taskType: string): string {
  const map: Record<string, string> = {
    eligibilityCheck: "Eligibility Check",
    testSpec: "Test Specification",
    analysis: "Analysis",
    review: "SIC Review",
    qaReview: "QA Review",
    registration: "Registration",
  };
  return map[taskType] ?? taskType;
}

function relativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { pendingTaskCount, tasks } = useRole();

  // Stats
  const totalSamples = SAMPLE_INTAKES.length;
  const inAnalysis = SAMPLE_INTAKES.filter(
    (s) => s.status === "Analysis",
  ).length;
  const onHold = SAMPLE_INTAKES.filter((s) => s.status === "OnHold").length;

  // Workflow distribution
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of SAMPLE_INTAKES) {
      counts[s.status] = (counts[s.status] || 0) + 1;
    }
    return counts;
  }, []);

  const chartData = useMemo(
    () =>
      Object.entries(stageCounts).map(([stage, count]) => ({
        stage: getStatusLabel(stage as WorkflowStage),
        count,
        fill: STAGE_COLORS[stage] || "#94a3b8",
      })),
    [stageCounts],
  );

  const donutData = useMemo(
    () =>
      Object.entries(stageCounts).map(([stage, count]) => ({
        name: getStatusLabel(stage as WorkflowStage),
        value: count,
        fill: STAGE_COLORS[stage] || "#94a3b8",
      })),
    [stageCounts],
  );

  const recentSamples = useMemo(
    () =>
      [...SAMPLE_INTAKES]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 8),
    [],
  );

  const myTasks = useMemo(() => tasks.slice(0, 6), [tasks]);

  const recentAudit = useMemo(
    () =>
      [...AUDIT_LOG]
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )
        .slice(0, 5),
    [],
  );

  return (
    <div className="min-h-full bg-[#F9FAFB]">
      {/* ── 3-column layout: main (75%) + sidebar (25%) ─── */}
      <div className="flex gap-0 min-h-full">
        {/* ─────────────── MAIN CONTENT ─────────────── */}
        <div className="flex-1 p-6 space-y-5 min-w-0">
          {/* ── Section 1: Stat Cards ────────────────── */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Samples Today */}
            <div
              className="bg-white rounded-xl border border-gray-100 p-5 flex items-start justify-between"
              style={{
                boxShadow:
                  "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
              }}
              data-ocid="dashboard.samples_today.card"
            >
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">
                  Samples Today
                </p>
                <p className="text-3xl font-bold text-gray-900 leading-none">
                  {totalSamples}
                </p>
                <p className="text-xs text-blue-500 mt-2 font-medium flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +3 today
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <FlaskConical className="h-5 w-5 text-blue-500" />
              </div>
            </div>

            {/* Pending Tasks */}
            <div
              className="bg-white rounded-xl border border-gray-100 p-5 flex items-start justify-between"
              style={{
                boxShadow:
                  "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
              }}
              data-ocid="dashboard.pending_tasks.card"
            >
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">
                  Pending Tasks
                </p>
                <p
                  className={`text-3xl font-bold leading-none ${pendingTaskCount > 0 ? "text-orange-500" : "text-gray-900"}`}
                >
                  {pendingTaskCount}
                </p>
                <p className="text-xs text-orange-500 mt-2 font-medium">
                  Requires attention
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                <ClipboardList className="h-5 w-5 text-orange-500" />
              </div>
            </div>

            {/* In Analysis */}
            <div
              className="bg-white rounded-xl border border-gray-100 p-5 flex items-start justify-between"
              style={{
                boxShadow:
                  "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
              }}
              data-ocid="dashboard.in_analysis.card"
            >
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">
                  In Analysis
                </p>
                <p className="text-3xl font-bold text-gray-900 leading-none">
                  {inAnalysis}
                </p>
                <p className="text-xs text-purple-500 mt-2 font-medium">
                  Active testing
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                <Microscope className="h-5 w-5 text-purple-500" />
              </div>
            </div>

            {/* On Hold */}
            <div
              className="bg-white rounded-xl border border-gray-100 p-5 flex items-start justify-between"
              style={{
                boxShadow:
                  "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
              }}
              data-ocid="dashboard.on_hold.card"
            >
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">
                  On Hold
                </p>
                <p className="text-3xl font-bold text-gray-900 leading-none">
                  {onHold}
                </p>
                <p className="text-xs text-green-600 mt-2 font-medium">
                  Review needed
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                <Activity className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </div>

          {/* ── Section 2: Workflow Pipeline ─────────── */}
          <div
            className="bg-white rounded-xl border border-gray-100 p-5"
            style={{
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-sm font-semibold text-gray-700">
                Workflow Pipeline
              </h3>
              <span className="text-xs text-gray-400 font-normal">
                — Live snapshot
              </span>
            </div>
            <div className="flex items-start gap-1 overflow-x-auto pb-1">
              {PIPELINE_STAGES.map((stage, idx) => {
                const count = stageCounts[stage.key] ?? 0;
                const color = STAGE_COLORS[stage.key] ?? "#94a3b8";
                return (
                  <React.Fragment key={stage.key}>
                    <div
                      className="flex flex-col items-center gap-1.5 min-w-[90px]"
                      data-ocid={`dashboard.pipeline_stage.${idx + 1}`}
                    >
                      <div
                        className="text-xs font-semibold px-3 py-1.5 rounded-full border text-center whitespace-nowrap w-full"
                        style={{
                          backgroundColor: count > 0 ? `${color}22` : "#f8fafc",
                          borderColor: count > 0 ? `${color}66` : "#e2e8f0",
                          color: count > 0 ? color : "#94a3b8",
                        }}
                      >
                        {stage.label}
                      </div>
                      <span
                        className="text-[11px] font-bold leading-none"
                        style={{ color: count > 0 ? color : "#94a3b8" }}
                      >
                        {count} {count === 1 ? "sample" : "samples"}
                      </span>
                      <button
                        type="button"
                        className="text-[10px] text-blue-500 hover:text-blue-700 hover:underline leading-none transition-colors"
                        onClick={() =>
                          navigate({
                            to:
                              stage.key === "Intake"
                                ? "/sample-intake"
                                : stage.key === "EligibilityCheck"
                                  ? "/eligibility-check"
                                  : stage.key === "Registration"
                                    ? "/registration"
                                    : stage.key === "TestSpec"
                                      ? "/test-specification"
                                      : stage.key === "Analysis"
                                        ? "/analysis"
                                        : stage.key === "SICReview"
                                          ? "/sic-review"
                                          : stage.key === "QAReview"
                                            ? "/qa-review"
                                            : "/coa",
                          })
                        }
                        data-ocid={`dashboard.pipeline_view.${idx + 1}`}
                      >
                        View Samples
                      </button>
                    </div>
                    {idx < PIPELINE_STAGES.length - 1 && (
                      <ChevronRight className="h-4 w-4 text-gray-300 shrink-0 mt-1.5" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* ── Section 3: My Tasks + Recent Samples + Workflow Status ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* My Tasks */}
            <div
              className="bg-white rounded-xl border border-gray-100"
              style={{
                boxShadow:
                  "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
              }}
              data-ocid="dashboard.my_tasks.panel"
            >
              <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-700">
                    My Tasks
                  </h3>
                  {myTasks.length > 0 && (
                    <Badge className="h-5 text-[10px] bg-blue-100 text-blue-700 border-0 hover:bg-blue-100">
                      {myTasks.length}
                    </Badge>
                  )}
                </div>
                <button
                  type="button"
                  className="text-xs text-blue-500 hover:text-blue-700 font-medium hover:underline"
                  onClick={() => navigate({ to: "/my-tasks" })}
                  data-ocid="dashboard.my_tasks.link"
                >
                  View All
                </button>
              </div>

              {myTasks.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-10 gap-2 text-center px-5"
                  data-ocid="dashboard.my_tasks.empty_state"
                >
                  <CheckCircle2 className="h-9 w-9 text-emerald-400" />
                  <p className="text-sm font-medium text-gray-700">
                    All caught up!
                  </p>
                  <p className="text-xs text-gray-400">
                    No tasks assigned to you right now.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                          Task
                        </th>
                        <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                          Sample ID
                        </th>
                        <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                          Due
                        </th>
                        <th className="py-2.5 px-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {myTasks.map((task, i) => (
                        <tr
                          key={task.id}
                          className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                          data-ocid={`dashboard.task_row.${i + 1}`}
                        >
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-1.5">
                              {task.priority === "high" && (
                                <AlertCircle className="h-3 w-3 text-red-500 shrink-0" />
                              )}
                              <span className="text-xs font-medium text-gray-700 truncate max-w-[120px]">
                                {getTaskTypeLabel(task.taskType)}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-mono text-xs text-blue-600 font-semibold">
                              {task.sampleId}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getSlaClass(task.deadline)}`}
                            >
                              {formatSla(task.deadline)}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-[10px] px-2 gap-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => navigate({ to: "/my-tasks" })}
                              data-ocid={`dashboard.task_open.${i + 1}`}
                            >
                              Open <ArrowRight className="h-2.5 w-2.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Samples */}
            <div
              className="bg-white rounded-xl border border-gray-100"
              style={{
                boxShadow:
                  "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
              }}
              data-ocid="dashboard.recent_samples.panel"
            >
              <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">
                  Recent Samples
                </h3>
                <button
                  type="button"
                  className="text-xs text-blue-500 hover:text-blue-700 font-medium hover:underline"
                  onClick={() => navigate({ to: "/reports" })}
                  data-ocid="dashboard.recent_samples.link"
                >
                  View All
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="w-5 py-2.5 px-3" />
                      <th className="text-left py-2.5 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Sample ID
                      </th>
                      <th className="text-left py-2.5 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Customer
                      </th>
                      <th className="text-left py-2.5 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Type
                      </th>
                      <th className="text-left py-2.5 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Date
                      </th>
                      <th className="py-2.5 px-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {recentSamples.map((sample, i) => (
                      <tr
                        key={sample.sampleId}
                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                        data-ocid={`dashboard.sample_row.${i + 1}`}
                      >
                        <td className="py-2.5 px-3">
                          <span
                            className={`block h-2 w-2 rounded-full ${getUrgencyDot(sample.status)}`}
                          />
                        </td>
                        <td className="py-2.5 px-2">
                          <span className="font-mono text-xs text-blue-600 font-semibold">
                            {sample.sampleId}
                          </span>
                        </td>
                        <td className="py-2.5 px-2">
                          <span className="text-xs text-gray-600 truncate max-w-[80px] block">
                            {sample.customerName}
                          </span>
                        </td>
                        <td className="py-2.5 px-2">
                          <span className="text-xs text-gray-500 truncate max-w-[70px] block">
                            {sample.sampleType}
                          </span>
                        </td>
                        <td className="py-2.5 px-2">
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {new Date(sample.dateOfReceipt).toLocaleDateString(
                              "en-IN",
                            )}
                          </span>
                        </td>
                        <td className="py-2.5 px-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-[10px] px-2 gap-1 border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-300"
                            onClick={() =>
                              navigate({
                                to: "/coa/$sampleId",
                                params: { sampleId: sample.sampleId },
                              })
                            }
                            data-ocid={`dashboard.coa_button.${i + 1}`}
                          >
                            COA <ExternalLink className="h-2.5 w-2.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Workflow Status */}
            <div
              className="bg-white rounded-xl border border-gray-100 p-5"
              style={{
                boxShadow:
                  "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-gray-700">
                  Workflow Status
                </h3>
                <Badge
                  variant="outline"
                  className="text-[10px] ml-auto border-gray-200 text-gray-400"
                >
                  Mock
                </Badge>
              </div>
              <div className="space-y-3">
                {CAMUNDA_MOCK.map((proc) => {
                  const pct =
                    proc.instances > 0
                      ? Math.round((proc.active / proc.instances) * 100)
                      : 0;
                  const borderColor =
                    proc.status === "running"
                      ? "#3b82f6"
                      : proc.status === "completed"
                        ? "#10b981"
                        : "#f59e0b";
                  return (
                    <div
                      key={proc.name}
                      className="p-2.5 rounded-lg bg-gray-50/70 border border-gray-100"
                      style={{ borderLeft: `3px solid ${borderColor}` }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-medium text-gray-700 truncate">
                          {proc.name}
                        </p>
                        <span className="text-xs font-bold text-gray-900 ml-2">
                          {proc.instances}
                        </span>
                      </div>
                      <Progress value={pct} className="h-1.5 mb-1.5" />
                      <div className="flex gap-3">
                        <span className="text-[10px] text-gray-500">
                          {proc.active} active
                        </span>
                        <span className="text-[10px] text-emerald-600 font-medium">
                          {proc.completed} done
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div className="pt-1 border-t border-gray-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled
                    className="w-full text-[11px] h-7 text-gray-400"
                  >
                    View Process Engine
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 4: Sample Distribution Chart ─────────── */}
          <div
            className="bg-white rounded-xl border border-gray-100 p-5"
            style={{
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <h3 className="text-sm font-semibold text-gray-700">
                  Sample Distribution
                </h3>
              </div>
            </div>
            <Tabs defaultValue="bar">
              <TabsList className="h-7 mb-3 bg-gray-100">
                <TabsTrigger
                  value="bar"
                  className="text-xs h-6"
                  data-ocid="dashboard.chart_tab.bar"
                >
                  Bar Chart
                </TabsTrigger>
                <TabsTrigger
                  value="donut"
                  className="text-xs h-6"
                  data-ocid="dashboard.chart_tab.pie"
                >
                  Donut
                </TabsTrigger>
              </TabsList>
              <TabsContent value="bar" className="mt-0">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f0f4f8"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="stage"
                      tick={{ fontSize: 9, fill: "#94a3b8" }}
                      angle={-15}
                      textAnchor="end"
                      height={45}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      }}
                      formatter={(value) => [value, "Samples"]}
                    />
                    <Bar dataKey="count" radius={[5, 5, 0, 0]} maxBarSize={38}>
                      {chartData.map((entry) => (
                        <Cell key={entry.stage} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>
              <TabsContent value="donut" className="mt-0">
                <div className="relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {donutData.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          fontSize: 12,
                          borderRadius: 8,
                          border: "1px solid #e2e8f0",
                        }}
                        formatter={(value) => [value, "Samples"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-gray-900">
                      {totalSamples}
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                      Total
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 px-2">
                  {donutData.map((d) => (
                    <span
                      key={d.name}
                      className="flex items-center gap-1.5 text-[11px] text-gray-500"
                    >
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: d.fill }}
                      />
                      {d.name}
                      <span className="font-semibold text-gray-700">
                        {d.value}
                      </span>
                    </span>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* ─────────────── RIGHT SIDEBAR ─────────────── */}
        <div
          className="w-72 shrink-0 bg-white border-l border-gray-100 flex flex-col overflow-y-auto"
          style={{
            boxShadow: "-1px 0 0 #f3f4f6",
          }}
        >
          {/* 1. Recent Activities / Audit Log */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-gray-400" />
              <h4 className="text-sm font-semibold text-gray-700">
                Recent Activities
              </h4>
            </div>
            <div className="space-y-2.5">
              {recentAudit.map((entry) => (
                <div key={entry.id} className="flex gap-2.5 items-start">
                  <span
                    className={`text-[9px] font-semibold px-1.5 py-0.5 rounded mt-0.5 shrink-0 ${ACTION_COLOR[entry.action] ?? "bg-gray-100 text-gray-600"}`}
                  >
                    {entry.action}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] text-gray-600 truncate leading-tight">
                      {entry.entity}
                      {" · "}
                      <span className="font-mono text-blue-600 text-[10px]">
                        {entry.entityId}
                      </span>
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {entry.userName} · {relativeTime(entry.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mt-3 text-[11px] text-blue-500 hover:text-blue-700 hover:underline font-medium w-full text-left"
              onClick={() => navigate({ to: "/reports" })}
              data-ocid="dashboard.audit_log.link"
            >
              View All Audit Log →
            </button>
          </div>

          {/* 2. Quick Tools */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="h-4 w-4 text-gray-400" />
              <h4 className="text-sm font-semibold text-gray-700">
                Quick Tools
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="bg-white border border-gray-200 rounded-lg p-3 text-left hover:border-blue-300 hover:bg-blue-50/40 transition-all group"
                onClick={() => navigate({ to: "/calculator" })}
                data-ocid="dashboard.unit_converter.button"
              >
                <Ruler className="h-4 w-4 text-blue-500 mb-1.5 group-hover:scale-110 transition-transform" />
                <p className="text-[11px] font-semibold text-gray-700">
                  Unit Converter
                </p>
                <p className="text-[9px] text-gray-400 mt-0.5">Convert units</p>
              </button>
              <button
                type="button"
                className="bg-white border border-gray-200 rounded-lg p-3 text-left hover:border-green-300 hover:bg-green-50/40 transition-all group"
                onClick={() => navigate({ to: "/calculator" })}
                data-ocid="dashboard.percentage_calc.button"
              >
                <Percent className="h-4 w-4 text-green-500 mb-1.5 group-hover:scale-110 transition-transform" />
                <p className="text-[11px] font-semibold text-gray-700">
                  % Calculator
                </p>
                <p className="text-[9px] text-gray-400 mt-0.5">Percentages</p>
              </button>
              <button
                type="button"
                className="bg-white border border-gray-200 rounded-lg p-3 text-left hover:border-amber-300 hover:bg-amber-50/40 transition-all group"
                onClick={() => navigate({ to: "/calculator" })}
                data-ocid="dashboard.currency_converter.button"
              >
                <span className="text-amber-500 text-sm font-bold mb-1.5 block">
                  ₹$€
                </span>
                <p className="text-[11px] font-semibold text-gray-700">
                  Currency
                </p>
                <p className="text-[9px] text-gray-400 mt-0.5">Convert rates</p>
              </button>
              <button
                type="button"
                className="bg-white border border-gray-200 rounded-lg p-3 text-left hover:border-purple-300 hover:bg-purple-50/40 transition-all group"
                onClick={() => navigate({ to: "/calculator" })}
                data-ocid="dashboard.scientific_calc.button"
              >
                <Calculator className="h-4 w-4 text-purple-500 mb-1.5 group-hover:scale-110 transition-transform" />
                <p className="text-[11px] font-semibold text-gray-700">
                  Scientific
                </p>
                <p className="text-[9px] text-gray-400 mt-0.5">Advanced math</p>
              </button>
            </div>
          </div>

          {/* 3. Keyboard Shortcuts */}
          <div className="p-4 border-b border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Keyboard Shortcuts
            </h4>
            <div className="space-y-2">
              {[
                { keys: ["Enter"], desc: "Calculate" },
                { keys: ["Esc"], desc: "Clear" },
                { keys: ["⌫"], desc: "Delete digit" },
                { keys: ["Ctrl", "R"], desc: "Unit converter" },
              ].map((shortcut) => (
                <div
                  key={shortcut.desc}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key) => (
                      <kbd
                        key={key}
                        className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-semibold text-gray-600 bg-gray-100 border border-gray-300 rounded shadow-sm font-mono"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                  <span className="text-[11px] text-gray-500">
                    {shortcut.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Help + Settings */}
          <div className="p-4">
            <div className="space-y-1">
              <button
                type="button"
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left hover:bg-gray-50 transition-colors group"
                onClick={() => navigate({ to: "/calculator" })}
                data-ocid="dashboard.calculator_guide.button"
              >
                <BookOpen className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors shrink-0" />
                <div>
                  <p className="text-[12px] font-medium text-gray-700">
                    Calculator Guide
                  </p>
                  <p className="text-[10px] text-gray-400">
                    Learn how to use formulas
                  </p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-gray-300 ml-auto group-hover:text-gray-500 transition-colors" />
              </button>
              <button
                type="button"
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left hover:bg-gray-50 transition-colors group"
                onClick={() => navigate({ to: "/calculator" })}
                data-ocid="dashboard.calculator_settings.button"
              >
                <Settings className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors shrink-0" />
                <div>
                  <p className="text-[12px] font-medium text-gray-700">
                    Calculator Settings
                  </p>
                  <p className="text-[10px] text-gray-400">
                    Precision, units, themes
                  </p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-gray-300 ml-auto group-hover:text-gray-500 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
