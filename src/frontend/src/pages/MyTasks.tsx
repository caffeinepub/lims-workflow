import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckSquare,
  ClipboardCheck,
  Eye,
  FileText,
  FlaskConical,
  Microscope,
  ShieldCheck,
  TestTube,
} from "lucide-react";
import type React from "react";
import { SLACountdown } from "../components/tasks/SLACountdown";
import { useRole } from "../contexts/RoleContext";
import { DUMMY_USERS, MOCK_TASKS, getUserById } from "../lib/mockData";

const TASK_TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; path: string; color: string }
> = {
  eligibilityCheck: {
    label: "Eligibility Check",
    icon: <ClipboardCheck className="h-4 w-4" />,
    path: "/eligibility-check",
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  testSpec: {
    label: "Test Specification",
    icon: <TestTube className="h-4 w-4" />,
    path: "/test-specification",
    color: "bg-violet-50 text-violet-700 border-violet-200",
  },
  analysis: {
    label: "Analysis",
    icon: <Microscope className="h-4 w-4" />,
    path: "/analysis",
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  review: {
    label: "SIC Review",
    icon: <Eye className="h-4 w-4" />,
    path: "/sic-review",
    color: "bg-orange-50 text-orange-700 border-orange-200",
  },
  qaReview: {
    label: "QA Review",
    icon: <ShieldCheck className="h-4 w-4" />,
    path: "/qa-review",
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
  registration: {
    label: "Registration",
    icon: <FileText className="h-4 w-4" />,
    path: "/registration",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  sampleIntake: {
    label: "Sample Intake",
    icon: <FlaskConical className="h-4 w-4" />,
    path: "/sample-intake",
    color: "bg-slate-50 text-slate-700 border-slate-200",
  },
  coa: {
    label: "COA",
    icon: <CheckSquare className="h-4 w-4" />,
    path: "/coa",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-slate-100 text-slate-600 border-slate-200",
};

export function MyTasks() {
  const navigate = useNavigate();
  const { activeUser, tasks } = useRole();

  const sortedTasks = [...tasks].sort(
    (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            My Tasks
          </h1>
          <p className="page-subtitle">
            Role-based task queue for {activeUser.name} — {sortedTasks.length}{" "}
            task{sortedTasks.length !== 1 ? "s" : ""} pending
          </p>
        </div>
      </div>

      {sortedTasks.length === 0 ? (
        <Card className="lims-card">
          <CardContent className="p-12 text-center">
            <CheckSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">
              No pending tasks
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              All caught up! Check back later.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedTasks.map((task) => {
            const config =
              TASK_TYPE_CONFIG[task.taskType] || TASK_TYPE_CONFIG.sampleIntake;
            const assignedUser = getUserById(task.assignedUserId);

            return (
              <Card
                key={task.id}
                className="lims-card hover:shadow-card-hover transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={`h-9 w-9 rounded-lg border flex items-center justify-center shrink-0 ${config.color}`}
                      >
                        {config.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-semibold text-primary">
                            {task.sampleId}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${config.color}`}
                          >
                            {config.label}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${PRIORITY_COLORS[task.priority]}`}
                          >
                            {task.priority.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-foreground mt-1">
                          {task.description}
                        </p>
                        {assignedUser && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Assigned to: {assignedUser.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <SLACountdown deadline={task.deadline} />
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-xs h-7"
                        onClick={() =>
                          navigate({
                            to: `${config.path}/$sampleId` as "/eligibility-check/$sampleId",
                            params: { sampleId: task.sampleId },
                          })
                        }
                      >
                        Open Task <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
