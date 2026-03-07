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
  Award,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FlaskConical,
  Microscope,
  TrendingUp,
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
import {
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

function calcTAT(dateOfReceipt: string): number {
  const ms = Date.now() - new Date(dateOfReceipt).getTime();
  return Math.max(0, Math.floor(ms / 86400000));
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

export function Dashboard() {
  const navigate = useNavigate();
  const { pendingTaskCount, tasks } = useRole();

  // Stats
  const totalSamples = SAMPLE_INTAKES.length;
  const inAnalysis = SAMPLE_INTAKES.filter(
    (s) => s.status === "Analysis",
  ).length;
  const completedCOA = SAMPLE_INTAKES.filter((s) => s.status === "COA").length;
  const _onHold = SAMPLE_INTAKES.filter((s) => s.status === "OnHold").length;

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

  // My tasks — first 3 for the current user
  const myTasks = useMemo(() => tasks.slice(0, 3), [tasks]);

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Main content ───────────────────────────────────── */}
      <div className="p-6 space-y-6 flex-1">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
          {/* Total Samples */}
          <Card
            className="lims-card shadow-card hover:shadow-card-hover transition-shadow duration-200 overflow-hidden"
            style={{ borderLeft: "4px solid #3b82f6" }}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    Total Samples
                  </p>
                  <p className="text-4xl font-bold font-display text-foreground mt-1.5 leading-none">
                    {totalSamples}
                  </p>
                  <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +2 this week
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <FlaskConical className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Tasks */}
          <Card
            className="lims-card shadow-card hover:shadow-card-hover transition-shadow duration-200 overflow-hidden"
            style={{ borderLeft: "4px solid #f59e0b" }}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    Pending Tasks
                  </p>
                  <p
                    className={`text-4xl font-bold font-display mt-1.5 leading-none ${pendingTaskCount > 0 ? "text-amber-600" : "text-foreground"}`}
                  >
                    {pendingTaskCount}
                  </p>
                  <p className="text-xs text-amber-600 mt-2 font-medium">
                    Requires attention
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <ClipboardList className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* In Analysis */}
          <Card
            className="lims-card shadow-card hover:shadow-card-hover transition-shadow duration-200 overflow-hidden"
            style={{ borderLeft: "4px solid #8b5cf6" }}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    In Analysis
                  </p>
                  <p className="text-4xl font-bold font-display text-foreground mt-1.5 leading-none">
                    {inAnalysis}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 font-medium">
                    Active testing
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                  <Microscope className="h-6 w-6 text-violet-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* COA Issued */}
          <Card
            className="lims-card shadow-card hover:shadow-card-hover transition-shadow duration-200 overflow-hidden"
            style={{ borderLeft: "4px solid #10b981" }}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    COA Issued
                  </p>
                  <p className="text-4xl font-bold font-display text-foreground mt-1.5 leading-none">
                    {completedCOA}
                  </p>
                  <p className="text-xs text-emerald-600 mt-2 font-medium">
                    Completed
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <Award className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Workflow Pipeline Strip ──────────────────────── */}
        <Card className="lims-card shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-live-pulse" />
              Workflow Pipeline
              <span className="text-xs text-muted-foreground font-normal ml-1">
                — Live snapshot across all stages
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {PIPELINE_STAGES.map((stage, idx) => {
                const count = stageCounts[stage.key] ?? 0;
                const color = STAGE_COLORS[stage.key] ?? "#94a3b8";
                return (
                  <React.Fragment key={stage.key}>
                    <div
                      className="flex flex-col items-center gap-1.5 min-w-[80px]"
                      data-ocid={`dashboard.pipeline_stage.${idx + 1}`}
                    >
                      <div
                        className="text-xs font-semibold px-3 py-1.5 rounded-full border text-center whitespace-nowrap"
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
                        {count}
                      </span>
                    </div>
                    {idx < PIPELINE_STAGES.length - 1 && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0 -mt-3" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ── Charts + Camunda ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Chart card with tabs */}
          <Card className="lims-card shadow-card lg:col-span-2">
            <CardHeader className="pb-0">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Sample Distribution by Stage
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Live workflow snapshot
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <Tabs defaultValue="bar">
                <TabsList className="h-8 mb-3">
                  <TabsTrigger
                    value="bar"
                    className="text-xs h-7"
                    data-ocid="dashboard.chart_tab.bar"
                  >
                    Bar Chart
                  </TabsTrigger>
                  <TabsTrigger
                    value="donut"
                    className="text-xs h-7"
                    data-ocid="dashboard.chart_tab.pie"
                  >
                    Donut
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="bar" className="mt-0">
                  <ResponsiveContainer width="100%" height={220}>
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
                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                        angle={-20}
                        textAnchor="end"
                        height={50}
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
                      <Bar
                        dataKey="count"
                        radius={[5, 5, 0, 0]}
                        maxBarSize={40}
                      >
                        {chartData.map((entry) => (
                          <Cell key={entry.stage} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </TabsContent>

                <TabsContent value="donut" className="mt-0">
                  <div className="relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={donutData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={90}
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
                    {/* Center label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-bold font-display text-foreground">
                        {totalSamples}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        Total
                      </span>
                    </div>
                  </div>
                  {/* Legend */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 px-2">
                    {donutData.map((d) => (
                      <span
                        key={d.name}
                        className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
                      >
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: d.fill }}
                        />
                        {d.name}
                        <span className="font-semibold text-foreground">
                          {d.value}
                        </span>
                      </span>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Camunda BPM Widget */}
          <Card className="lims-card shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                Camunda BPM Status
                <Badge variant="outline" className="text-[10px] ml-auto">
                  Mock
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
                    className="p-2.5 rounded-md bg-muted/30 border border-border/50"
                    style={{ borderLeft: `3px solid ${borderColor}` }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-medium text-foreground truncate">
                        {proc.name}
                      </p>
                      <span className="text-xs font-bold text-foreground ml-2">
                        {proc.instances}
                      </span>
                    </div>
                    <Progress value={pct} className="h-1.5 mb-1.5" />
                    <div className="flex gap-3">
                      <span className="text-[10px] text-muted-foreground">
                        {proc.active} active
                      </span>
                      <span className="text-[10px] text-emerald-600 font-medium">
                        {proc.completed} done
                      </span>
                    </div>
                  </div>
                );
              })}
              <div className="pt-1 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled
                  className="w-full text-[11px] h-7 text-muted-foreground"
                >
                  View Process Engine
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Recent Samples Table ─────────────────────────── */}
        <Card
          className="lims-card shadow-card"
          data-ocid="dashboard.recent_samples_table"
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Recent Samples
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs gap-1 text-primary hover:text-primary"
                onClick={() => navigate({ to: "/reports" })}
                data-ocid="dashboard.view_all_button"
              >
                View All <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="table-scroll">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="w-6 py-2 px-2" />
                    <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Sample ID
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Sample Name
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Client
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Status
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      TAT
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Date
                    </th>
                    <th className="py-2 px-3" />
                  </tr>
                </thead>
                <tbody>
                  {recentSamples.map((sample, i) => (
                    <tr
                      key={sample.sampleId}
                      className="border-b border-border/40 hover:bg-blue-50/60 transition-colors cursor-pointer"
                      data-ocid={`dashboard.sample_row.${i + 1}`}
                    >
                      <td className="py-2.5 px-2">
                        <span
                          className={`block h-2 w-2 rounded-full ${getUrgencyDot(sample.status)}`}
                        />
                      </td>
                      <td className="py-2.5 px-3 font-mono text-xs font-semibold text-primary">
                        {sample.sampleId}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-sm text-foreground max-w-[180px] truncate">
                        {sample.sampleName}
                      </td>
                      <td className="py-2.5 px-3 text-sm text-muted-foreground max-w-[160px] truncate">
                        {sample.customerName}
                      </td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={sample.status} />
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                            calcTAT(sample.dateOfReceipt) > 14
                              ? "bg-red-50 text-red-700 border-red-200"
                              : calcTAT(sample.dateOfReceipt) > 7
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-slate-50 text-slate-600 border-slate-200"
                          }`}
                        >
                          {calcTAT(sample.dateOfReceipt)}d
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(sample.dateOfReceipt).toLocaleDateString(
                          "en-IN",
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs px-2.5 gap-1 text-primary hover:text-primary hover:bg-blue-50"
                          onClick={() =>
                            navigate({
                              to: "/eligibility-check/$sampleId",
                              params: { sampleId: sample.sampleId },
                            })
                          }
                        >
                          Open <ArrowRight className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ── My Tasks Today ───────────────────────────────── */}
        <Card className="lims-card shadow-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                My Tasks Today
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs gap-1 text-primary hover:text-primary"
                onClick={() => navigate({ to: "/my-tasks" })}
              >
                View All <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {myTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                <p className="text-sm font-medium text-foreground">
                  All caught up!
                </p>
                <p className="text-xs text-muted-foreground">
                  No tasks assigned to you right now.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {myTasks.map((task, i) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:border-primary/25 hover:bg-blue-50/40 transition-all"
                    data-ocid={`dashboard.task_row.${i + 1}`}
                  >
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${getSlaClass(task.deadline)}`}
                    >
                      {formatSla(task.deadline)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {getTaskTypeLabel(task.taskType)}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                        {task.sampleId}
                      </p>
                    </div>
                    {task.priority === "high" && (
                      <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs px-2.5 gap-1 text-primary hover:text-primary hover:bg-blue-50 shrink-0"
                      onClick={() => navigate({ to: "/my-tasks" })}
                    >
                      Start <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
