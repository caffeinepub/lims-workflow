import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Award,
  CheckCircle2,
  ClipboardList,
  Clock,
  FlaskConical,
  Microscope,
  TrendingUp,
  Zap,
} from "lucide-react";
import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StatusBadge } from "../components/StatusBadge";
import { useRole } from "../contexts/RoleContext";
import {
  COA_RECORDS,
  MOCK_TASKS,
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

export function Dashboard() {
  const navigate = useNavigate();
  const { activeUser, pendingTaskCount } = useRole();

  // Stats
  const totalSamples = SAMPLE_INTAKES.length;
  const inAnalysis = SAMPLE_INTAKES.filter(
    (s) => s.status === "Analysis",
  ).length;
  const completedCOA = SAMPLE_INTAKES.filter((s) => s.status === "COA").length;
  const _onHold = SAMPLE_INTAKES.filter((s) => s.status === "OnHold").length;

  // Workflow distribution
  const stageCounts: Record<string, number> = {};
  for (const s of SAMPLE_INTAKES) {
    stageCounts[s.status] = (stageCounts[s.status] || 0) + 1;
  }
  const chartData = Object.entries(stageCounts).map(([stage, count]) => ({
    stage: getStatusLabel(stage as WorkflowStage),
    count,
    fill: STAGE_COLORS[stage] || "#94a3b8",
  }));

  const recentSamples = [...SAMPLE_INTAKES]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 8);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Welcome back, {activeUser.name} —{" "}
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Button
          onClick={() => navigate({ to: "/sample-intake" })}
          className="gap-2"
        >
          <FlaskConical className="h-4 w-4" />
          New Sample Intake
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="lims-card">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Total Samples
                </p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {totalSamples}
                </p>
                <p className="text-xs text-muted-foreground mt-1">All time</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <FlaskConical className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lims-card">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Pending Tasks
                </p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {pendingTaskCount}
                </p>
                <p className="text-xs text-amber-600 mt-1 font-medium">
                  Requires attention
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <ClipboardList className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lims-card">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  In Analysis
                </p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {inAnalysis}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Active testing
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-violet-50 flex items-center justify-center">
                <Microscope className="h-5 w-5 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lims-card">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  COA Issued
                </p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {completedCOA}
                </p>
                <p className="text-xs text-emerald-600 mt-1 font-medium">
                  Completed
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Award className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts + Camunda */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Workflow Distribution Chart */}
        <Card className="lims-card lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Workflow Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="stage"
                  tick={{ fontSize: 10 }}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                  }}
                  formatter={(value) => [value, "Samples"]}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={entry.stage} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Camunda BPM Widget */}
        <Card className="lims-card">
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
            {CAMUNDA_MOCK.map((proc) => (
              <div
                key={proc.name}
                className="flex items-start gap-2 p-2 rounded-md bg-muted/40"
              >
                <div
                  className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                    proc.status === "running"
                      ? "bg-blue-500"
                      : proc.status === "completed"
                        ? "bg-emerald-500"
                        : "bg-amber-500"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    {proc.name}
                  </p>
                  <div className="flex gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">
                      {proc.active} active
                    </span>
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <span className="text-[10px] text-emerald-600">
                      {proc.completed} done
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-foreground">
                  {proc.instances}
                </span>
              </div>
            ))}
            <div className="pt-1 border-t border-border">
              <p className="text-[10px] text-muted-foreground text-center">
                Process Engine: Camunda 7.x (Demo)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Samples */}
      <Card className="lims-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Recent Samples
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1"
              onClick={() => navigate({ to: "/reports" })}
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
                    Date
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide" />
                </tr>
              </thead>
              <tbody>
                {recentSamples.map((sample, i) => (
                  <tr
                    key={sample.sampleId}
                    className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}
                  >
                    <td className="py-2.5 px-3 font-mono text-xs font-medium text-primary">
                      {sample.sampleId}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-sm">
                      {sample.sampleName}
                    </td>
                    <td className="py-2.5 px-3 text-sm text-muted-foreground">
                      {sample.customerName}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={sample.status} />
                    </td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground">
                      {new Date(sample.dateOfReceipt).toLocaleDateString(
                        "en-IN",
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs px-2"
                        onClick={() =>
                          navigate({
                            to: "/eligibility-check/$sampleId",
                            params: { sampleId: sample.sampleId },
                          })
                        }
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
