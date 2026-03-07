import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardCopy,
  Code2,
  Database,
  FlaskConical,
  Globe,
  Search,
  Shield,
  Zap,
} from "lucide-react";
import type React from "react";
import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Field {
  name: string;
  type: string;
  required?: boolean;
  description: string;
  example?: string;
}

interface ApiEndpoint {
  id: string;
  name: string;
  method: "query" | "update";
  path: string;
  description: string;
  category: string;
  request: Field[];
  response: Field[];
  responseExample: string;
  requestExample?: string;
  notes?: string;
  roles?: string[];
}

// ─── Endpoint Definitions ─────────────────────────────────────────────────────

const ENDPOINTS: ApiEndpoint[] = [
  // ── Users ──────────────────────────────────────────────────────────────────
  {
    id: "createUser",
    name: "createUser",
    method: "update",
    path: "createUser(name, role)",
    description:
      "Creates a new user account bound to the caller's Internet Identity principal. The user's principal is auto-captured from the caller context.",
    category: "Users",
    roles: ["admin"],
    request: [
      {
        name: "name",
        type: "Text",
        required: true,
        description: "Full display name of the user.",
        example: '"Rajesh Malhotra"',
      },
      {
        name: "role",
        type: "UserRole",
        required: true,
        description:
          "Assigned role. One of: #admin | #qa | #sectionInCharge | #analyst.",
        example: "#sectionInCharge",
      },
    ],
    response: [
      {
        name: "void",
        type: "()",
        description: "Returns nothing on success. Traps if operation fails.",
      },
    ],
    responseExample: `// No return value
// Side effect: user record stored with caller's Principal`,
    requestExample: `await backend.createUser("Rajesh Malhotra", UserRole.sectionInCharge);`,
  },
  {
    id: "getUser",
    name: "getUser",
    method: "query",
    path: "getUser()",
    description:
      "Retrieves the User record for the currently authenticated caller. Returns null if no user record exists for the caller principal.",
    category: "Users",
    request: [],
    response: [
      {
        name: "principal",
        type: "Principal",
        description: "The Internet Identity principal of the user.",
        example: "2vxsx-fae",
      },
      {
        name: "name",
        type: "Text",
        description: "Full display name.",
        example: '"Dr. Sarah Chen"',
      },
      {
        name: "role",
        type: "UserRole",
        description: "Role: #admin | #qa | #sectionInCharge | #analyst.",
        example: "#qa",
      },
      {
        name: "isActive",
        type: "Bool",
        description: "Whether the account is active.",
        example: "true",
      },
    ],
    responseExample: `{
  principal: "2vxsx-fae...",
  name: "Dr. Sarah Chen",
  role: { qa: null },
  isActive: true
}
// Returns null if caller has no account`,
    requestExample: `const user = await backend.getUser();
if (user === null) {
  // Prompt user to register
}`,
  },

  // ── Tasks ──────────────────────────────────────────────────────────────────
  {
    id: "getAllTasks",
    name: "getAllTasks",
    method: "query",
    path: "getAllTasks()",
    description:
      "Returns all active tasks across every workflow stage. Tasks represent pending work items assigned to roles in the LIMS pipeline.",
    category: "Tasks",
    request: [],
    response: [
      {
        name: "taskId",
        type: "Text",
        description: "Unique task identifier.",
        example: '"task-SI-2026-001-analysis"',
      },
      {
        name: "sampleId",
        type: "Text",
        description: "The sample this task is linked to.",
        example: '"SI-2026-001"',
      },
      {
        name: "taskType",
        type: "TaskType",
        description:
          "Type of task: #sampleIntake | #eligibilityCheck | #analysis | #review | #coa.",
        example: "#analysis",
      },
      {
        name: "assignedRole",
        type: "UserRole",
        description: "The role responsible for completing this task.",
        example: "#analyst",
      },
      {
        name: "deadline",
        type: "Int",
        description: "Unix nanosecond timestamp of the task deadline.",
        example: "1706198400000000000",
      },
    ],
    responseExample: `[
  {
    taskId: "task-SI-2026-001",
    sampleId: "SI-2026-001",
    taskType: { analysis: null },
    assignedRole: { analyst: null },
    deadline: 1706198400000000000n
  },
  {
    taskId: "task-SI-2026-005",
    sampleId: "SI-2026-005",
    taskType: { review: null },
    assignedRole: { sectionInCharge: null },
    deadline: 1706284800000000000n
  }
]`,
    requestExample: `const tasks = await backend.getAllTasks();
const myTasks = tasks.filter(t => 
  t.assignedRole === currentUserRole
);`,
  },
  {
    id: "completeTask",
    name: "completeTask",
    method: "update",
    path: "completeTask(taskId)",
    description:
      "Marks a task as completed and removes it from the active task queue. Traps with an error if the taskId does not exist.",
    category: "Tasks",
    request: [
      {
        name: "taskId",
        type: "Text",
        required: true,
        description: "The unique identifier of the task to complete.",
        example: '"task-SI-2026-001-analysis"',
      },
    ],
    response: [
      {
        name: "void",
        type: "()",
        description:
          "Returns nothing on success. Traps with 'Task does not exist' if taskId is invalid.",
      },
    ],
    responseExample: `// No return value on success
// Error: "Task does not exist" if taskId not found`,
    requestExample: `try {
  await backend.completeTask("task-SI-2026-001-analysis");
  toast.success("Task completed");
} catch (err) {
  toast.error("Task not found");
}`,
    notes:
      "This operation is irreversible — once completed, the task is permanently removed from the queue.",
  },
  {
    id: "getSortedTasksByDeadline",
    name: "getSortedTasksByDeadline",
    method: "query",
    path: "getSortedTasksByDeadline()",
    description:
      "Returns all tasks sorted by deadline in ascending order (earliest deadline first). Useful for rendering the My Tasks page with SLA urgency indicators.",
    category: "Tasks",
    request: [],
    response: [
      {
        name: "[0]",
        type: "Text",
        description: "Task ID (key).",
        example: '"task-SI-2026-001"',
      },
      {
        name: "[1]",
        type: "Task",
        description: "Full Task object (see getAllTasks response schema).",
      },
    ],
    responseExample: `[
  ["task-SI-2026-003", {
    taskId: "task-SI-2026-003",
    sampleId: "SI-2026-003",
    taskType: { coa: null },
    assignedRole: { qa: null },
    deadline: 1706112000000000000n  // earliest
  }],
  ["task-SI-2026-001", {
    taskId: "task-SI-2026-001",
    sampleId: "SI-2026-001",
    taskType: { analysis: null },
    assignedRole: { analyst: null },
    deadline: 1706198400000000000n
  }]
]`,
    requestExample: `const sortedTasks = await backend.getSortedTasksByDeadline();
// sortedTasks[0] has the most urgent deadline`,
  },

  // ── Notifications ──────────────────────────────────────────────────────────
  {
    id: "sendNotification",
    name: "sendNotification",
    method: "update",
    path: "sendNotification(userId, message)",
    description:
      "Creates and delivers a notification to a specific user. The notification is appended to the user's notification list and marked as unread.",
    category: "Notifications",
    roles: ["admin", "qa", "sectionInCharge"],
    request: [
      {
        name: "userId",
        type: "Text",
        required: true,
        description:
          "Target user identifier (not their principal, but their user ID string).",
        example: '"user-001"',
      },
      {
        name: "message",
        type: "Text",
        required: true,
        description: "Notification body text to display to the user.",
        example: '"Sample SI-2026-007 is ready for QA Review"',
      },
    ],
    response: [
      {
        name: "void",
        type: "()",
        description: "Returns nothing. Notification is stored immediately.",
      },
    ],
    responseExample: `// No return value
// Side effect: notification appended to userId's list with isRead: false`,
    requestExample: `await backend.sendNotification(
  "user-001",
  "Sample SI-2026-007 has passed SIC Review and is ready for QA approval"
);`,
  },
  {
    id: "getNotifications",
    name: "getNotifications",
    method: "query",
    path: "getNotifications(userId)",
    description:
      "Retrieves all notifications for a specific user, in the order they were received. Returns an empty array if no notifications exist for the user.",
    category: "Notifications",
    request: [
      {
        name: "userId",
        type: "Text",
        required: true,
        description: "User ID whose notifications to retrieve.",
        example: '"user-002"',
      },
    ],
    response: [
      {
        name: "notificationId",
        type: "Text",
        description: "Unique notification identifier (userId + timestamp).",
        example: '"user-0011706198400"',
      },
      {
        name: "message",
        type: "Text",
        description: "Notification body text.",
        example: '"Sample SI-2026-005 assigned to you for Analysis"',
      },
      {
        name: "timestamp",
        type: "Int",
        description: "Unix nanosecond timestamp when notification was created.",
        example: "1706198400000000000",
      },
      {
        name: "isRead",
        type: "Bool",
        description: "Whether the user has read this notification.",
        example: "false",
      },
    ],
    responseExample: `[
  {
    notificationId: "user-0011706198400",
    message: "Sample SI-2026-005 assigned for Analysis",
    timestamp: 1706198400000000000n,
    isRead: false
  },
  {
    notificationId: "user-0011706112000",
    message: "Test Specification completed for SI-2026-003",
    timestamp: 1706112000000000000n,
    isRead: true
  }
]`,
    requestExample: `const notifications = await backend.getNotifications("user-002");
const unreadCount = notifications.filter(n => !n.isRead).length;`,
  },
  {
    id: "markNotificationAsRead",
    name: "markNotificationAsRead",
    method: "update",
    path: "markNotificationAsRead(userId, notificationId)",
    description:
      "Marks a specific notification as read for a user. If the userId has no notifications or the notificationId is not found, the operation silently succeeds without error.",
    category: "Notifications",
    request: [
      {
        name: "userId",
        type: "Text",
        required: true,
        description: "User ID owning the notification.",
        example: '"user-001"',
      },
      {
        name: "notificationId",
        type: "Text",
        required: true,
        description: "The notification ID to mark as read.",
        example: '"user-0011706198400"',
      },
    ],
    response: [
      {
        name: "void",
        type: "()",
        description:
          "Returns nothing. No error if notification or user not found.",
      },
    ],
    responseExample: `// No return value
// Side effect: notification.isRead set to true`,
    requestExample: `await backend.markNotificationAsRead(
  "user-001",
  "user-0011706198400"
);`,
    notes:
      "Silently no-ops if userId has no notifications or notificationId does not match. To mark all as read, iterate and call this for each unread notification.",
  },
];

// ─── Data Models ──────────────────────────────────────────────────────────────

const DATA_MODELS = [
  {
    name: "User",
    description: "Represents an authenticated LIMS system user.",
    fields: [
      {
        name: "principal",
        type: "Principal",
        description: "Internet Identity principal (auto-captured from caller).",
      },
      { name: "name", type: "Text", description: "Full display name." },
      {
        name: "role",
        type: "UserRole",
        description: "#admin | #qa | #sectionInCharge | #analyst",
      },
      {
        name: "isActive",
        type: "Bool",
        description: "Account activation status.",
      },
    ],
  },
  {
    name: "Task",
    description:
      "Represents a pending work item in the LIMS workflow pipeline.",
    fields: [
      { name: "taskId", type: "Text", description: "Unique task identifier." },
      { name: "sampleId", type: "Text", description: "Linked sample ID." },
      {
        name: "taskType",
        type: "TaskType",
        description:
          "#sampleIntake | #eligibilityCheck | #analysis | #review | #coa",
      },
      {
        name: "assignedRole",
        type: "UserRole",
        description: "Role responsible for this task.",
      },
      {
        name: "deadline",
        type: "Int",
        description: "Unix nanosecond timestamp deadline.",
      },
    ],
  },
  {
    name: "Notification",
    description: "In-app notification delivered to a LIMS user.",
    fields: [
      {
        name: "notificationId",
        type: "Text",
        description: "Unique notification ID.",
      },
      { name: "message", type: "Text", description: "Notification body text." },
      {
        name: "timestamp",
        type: "Int",
        description: "Creation timestamp (Unix nanoseconds).",
      },
      { name: "isRead", type: "Bool", description: "Read status." },
    ],
  },
  {
    name: "UserRole",
    description: "Enum of all valid LIMS user roles.",
    fields: [
      {
        name: "#admin",
        type: "variant",
        description: "System administrator with full access.",
      },
      {
        name: "#qa",
        type: "variant",
        description: "QA Head / Lab Director. Final approval authority.",
      },
      {
        name: "#sectionInCharge",
        type: "variant",
        description: "Section In-Charge. Manages test specs and SIC reviews.",
      },
      {
        name: "#analyst",
        type: "variant",
        description: "Laboratory analyst. Enters analysis results.",
      },
    ],
  },
  {
    name: "TaskType",
    description: "Enum of all workflow stage task types.",
    fields: [
      {
        name: "#sampleIntake",
        type: "variant",
        description: "Sample intake and registration task.",
      },
      {
        name: "#eligibilityCheck",
        type: "variant",
        description: "Eligibility check task.",
      },
      {
        name: "#analysis",
        type: "variant",
        description: "Laboratory analysis task.",
      },
      {
        name: "#review",
        type: "variant",
        description: "Section In-Charge or QA review task.",
      },
      {
        name: "#coa",
        type: "variant",
        description: "Certificate of Analysis generation task.",
      },
    ],
  },
];

// ─── Category Icons & Colors ──────────────────────────────────────────────────

const CATEGORY_META: Record<
  string,
  { color: string; bg: string; icon: React.ReactNode }
> = {
  Users: {
    color: "text-indigo-700",
    bg: "bg-indigo-50 border-indigo-200",
    icon: <Shield className="h-4 w-4" />,
  },
  Tasks: {
    color: "text-sky-700",
    bg: "bg-sky-50 border-sky-200",
    icon: <Zap className="h-4 w-4" />,
  },
  Notifications: {
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    icon: <Globe className="h-4 w-4" />,
  },
};

const METHOD_BADGE = {
  query: "bg-blue-100 text-blue-800 border border-blue-200",
  update: "bg-orange-100 text-orange-800 border border-orange-200",
};

const CATEGORIES = ["Users", "Tasks", "Notifications"];

// ─── Copy Button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className="absolute top-3 right-3 p-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-400" />
      ) : (
        <ClipboardCopy className="h-3.5 w-3.5 text-slate-400" />
      )}
    </button>
  );
}

// ─── Code Block ───────────────────────────────────────────────────────────────

function CodeBlock({
  code,
  lang = "typescript",
}: { code: string; lang?: string }) {
  return (
    <div className="relative rounded-lg overflow-hidden border border-slate-200">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <span className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">
          {lang}
        </span>
        <CopyButton text={code} />
      </div>
      <pre className="bg-slate-900 text-slate-100 text-[13px] font-mono overflow-x-auto p-4 leading-6 whitespace-pre">
        {code}
      </pre>
    </div>
  );
}

// ─── Fields Table ─────────────────────────────────────────────────────────────

function FieldsTable({ fields, title }: { fields: Field[]; title: string }) {
  if (fields.length === 0)
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 italic">
        No parameters required.
      </div>
    );

  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-4 py-2.5 font-semibold text-slate-600 text-xs uppercase tracking-wide w-36">
              Field
            </th>
            <th className="text-left px-4 py-2.5 font-semibold text-slate-600 text-xs uppercase tracking-wide w-28">
              Type
            </th>
            {title === "Request Parameters" && (
              <th className="text-left px-4 py-2.5 font-semibold text-slate-600 text-xs uppercase tracking-wide w-16">
                Req.
              </th>
            )}
            <th className="text-left px-4 py-2.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">
              Description
            </th>
            <th className="text-left px-4 py-2.5 font-semibold text-slate-600 text-xs uppercase tracking-wide w-40">
              Example
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {fields.map((f) => (
            <tr key={f.name} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 font-mono text-[12px] font-semibold text-indigo-700">
                {f.name}
              </td>
              <td className="px-4 py-3">
                <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  {f.type}
                </span>
              </td>
              {title === "Request Parameters" && (
                <td className="px-4 py-3">
                  {f.required ? (
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                      Yes
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                      —
                    </span>
                  )}
                </td>
              )}
              <td className="px-4 py-3 text-slate-600 text-sm leading-relaxed">
                {f.description}
              </td>
              <td className="px-4 py-3 font-mono text-[11px] text-emerald-700 bg-emerald-50/50">
                {f.example ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Endpoint Card ────────────────────────────────────────────────────────────

function EndpointCard({ ep }: { ep: ApiEndpoint }) {
  const [open, setOpen] = useState(false);
  // meta used for category color styling — prefix with _ to satisfy linter
  const _meta = CATEGORY_META[ep.category] ?? CATEGORY_META.Users;

  return (
    <div
      id={ep.id}
      className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
      data-ocid={`api_docs.${ep.id}.card`}
    >
      {/* Header row */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
        data-ocid={`api_docs.${ep.id}.toggle`}
      >
        <span
          className={`text-[11px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide ${METHOD_BADGE[ep.method]}`}
        >
          {ep.method === "query" ? "QUERY" : "UPDATE"}
        </span>
        <span className="font-mono text-[14px] font-semibold text-slate-800 flex-1">
          {ep.name}
        </span>
        {ep.roles && (
          <div className="hidden sm:flex gap-1">
            {ep.roles.map((r) => (
              <span
                key={r}
                className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 font-medium"
              >
                {r}
              </span>
            ))}
          </div>
        )}
        <span className="text-slate-400 ml-2">
          {open ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </span>
      </button>

      {/* Brief description always visible */}
      <div className="px-5 pb-3 -mt-1">
        <p className="text-sm text-slate-500">{ep.description}</p>
      </div>

      {/* Expanded body */}
      {open && (
        <div className="border-t border-slate-100 bg-slate-50/40">
          <div className="p-5 space-y-6">
            {/* Signature */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Signature
              </p>
              <div className="font-mono text-[13px] bg-slate-800 text-sky-300 px-4 py-3 rounded-lg">
                {ep.method === "query" ? "public query " : "public shared "}func{" "}
                <span className="text-yellow-300">{ep.path}</span>{" "}
                <span className="text-slate-400">: async</span>
              </div>
            </div>

            {ep.notes && (
              <div className="flex gap-2 items-start rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                <span className="text-amber-500 mt-0.5">⚠</span>
                <p className="text-sm text-amber-800">{ep.notes}</p>
              </div>
            )}

            <Tabs defaultValue="params" data-ocid={`api_docs.${ep.id}.tab`}>
              <TabsList className="mb-4 bg-white border border-slate-200">
                <TabsTrigger
                  value="params"
                  data-ocid={`api_docs.${ep.id}.params.tab`}
                >
                  Request Parameters
                </TabsTrigger>
                <TabsTrigger
                  value="response"
                  data-ocid={`api_docs.${ep.id}.response.tab`}
                >
                  Response Schema
                </TabsTrigger>
                <TabsTrigger
                  value="examples"
                  data-ocid={`api_docs.${ep.id}.examples.tab`}
                >
                  Code Examples
                </TabsTrigger>
              </TabsList>

              <TabsContent value="params" className="mt-0">
                <FieldsTable fields={ep.request} title="Request Parameters" />
              </TabsContent>

              <TabsContent value="response" className="mt-0 space-y-4">
                <FieldsTable fields={ep.response} title="Response Fields" />
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Response Example
                  </p>
                  <CodeBlock code={ep.responseExample} lang="json / motoko" />
                </div>
              </TabsContent>

              <TabsContent value="examples" className="mt-0 space-y-4">
                {ep.requestExample && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      TypeScript / React Usage
                    </p>
                    <CodeBlock code={ep.requestExample} lang="typescript" />
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Data Model Card ──────────────────────────────────────────────────────────

function DataModelCard({ model }: { model: (typeof DATA_MODELS)[0] }) {
  return (
    <Card
      className="border-slate-200 shadow-sm"
      data-ocid={`api_docs.model.${model.name.toLowerCase()}.card`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-indigo-500" />
          <CardTitle className="text-base font-mono text-indigo-700">
            {model.name}
          </CardTitle>
        </div>
        <p className="text-sm text-slate-500">{model.description}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-2 font-semibold text-slate-500 text-xs uppercase tracking-wide w-36">
                  Field
                </th>
                <th className="text-left px-4 py-2 font-semibold text-slate-500 text-xs uppercase tracking-wide w-28">
                  Type
                </th>
                <th className="text-left px-4 py-2 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {model.fields.map((f) => (
                <tr key={f.name} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-mono text-[12px] font-semibold text-indigo-600">
                    {f.name}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {f.type}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 text-sm">
                    {f.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ApiDocs() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filtered = ENDPOINTS.filter((ep) => {
    const matchCat = activeCategory === "All" || ep.category === activeCategory;
    const matchSearch =
      search === "" ||
      ep.name.toLowerCase().includes(search.toLowerCase()) ||
      ep.description.toLowerCase().includes(search.toLowerCase()) ||
      ep.category.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const countByCategory = (cat: string) =>
    ENDPOINTS.filter((e) => e.category === cat).length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page Header */}
      <div
        className="border-b border-slate-200 bg-white px-6 py-6"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        data-ocid="api_docs.page"
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Code2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                API Reference
              </h1>
              <p className="text-sm text-slate-500">
                DKR LIMS — Internet Computer Backend
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800 border-green-200 text-xs font-medium">
                ● Live on ICP
              </Badge>
              <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-xs font-medium">
                Motoko · Canister
              </Badge>
            </div>
          </div>

          <p className="text-sm text-slate-600 max-w-2xl mt-3">
            All calls go through the Internet Computer canister.{" "}
            <span className="font-semibold text-indigo-700">query</span> calls
            are read-only and return instantly.{" "}
            <span className="font-semibold text-orange-600">update</span> calls
            modify state and go through consensus (~2 seconds).
          </p>

          {/* Method legend */}
          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-md ${METHOD_BADGE.query}`}
              >
                QUERY
              </span>
              <span className="text-xs text-slate-500">
                Read-only · ~50ms · No consensus
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-md ${METHOD_BADGE.update}`}
              >
                UPDATE
              </span>
              <span className="text-xs text-slate-500">
                Mutating · ~2s · Goes through consensus
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Total Endpoints",
              value: ENDPOINTS.length,
              color: "text-indigo-600",
              bg: "bg-indigo-50 border-indigo-200",
            },
            {
              label: "Query Methods",
              value: ENDPOINTS.filter((e) => e.method === "query").length,
              color: "text-blue-600",
              bg: "bg-blue-50 border-blue-200",
            },
            {
              label: "Update Methods",
              value: ENDPOINTS.filter((e) => e.method === "update").length,
              color: "text-orange-600",
              bg: "bg-orange-50 border-orange-200",
            },
            {
              label: "Data Models",
              value: DATA_MODELS.length,
              color: "text-emerald-600",
              bg: "bg-emerald-50 border-emerald-200",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`rounded-xl border p-4 bg-white shadow-sm ${stat.bg}`}
            >
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="endpoints" data-ocid="api_docs.main.tab">
          <TabsList className="mb-6 bg-white border border-slate-200">
            <TabsTrigger value="endpoints" data-ocid="api_docs.endpoints.tab">
              <Code2 className="h-3.5 w-3.5 mr-1.5" />
              Endpoints
            </TabsTrigger>
            <TabsTrigger value="models" data-ocid="api_docs.models.tab">
              <Database className="h-3.5 w-3.5 mr-1.5" />
              Data Models
            </TabsTrigger>
            <TabsTrigger value="guide" data-ocid="api_docs.guide.tab">
              <BookOpen className="h-3.5 w-3.5 mr-1.5" />
              Integration Guide
            </TabsTrigger>
          </TabsList>

          {/* ── Endpoints Tab ── */}
          <TabsContent value="endpoints" className="mt-0">
            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div
                className="relative flex-1"
                data-ocid="api_docs.search.input"
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  placeholder="Search endpoints..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-white border-slate-200"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {["All", ...CATEGORIES].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    data-ocid={`api_docs.filter.${cat.toLowerCase().replace(/ /g, "_")}.button`}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                      activeCategory === cat
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                    }`}
                  >
                    {cat}
                    {cat !== "All" && (
                      <span className="ml-1.5 text-[10px] opacity-70">
                        {countByCategory(cat)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Category sections */}
            {(activeCategory === "All" ? CATEGORIES : [activeCategory]).map(
              (cat) => {
                const catEndpoints = filtered.filter((e) => e.category === cat);
                if (catEndpoints.length === 0) return null;
                const meta = CATEGORY_META[cat];
                return (
                  <div key={cat} className="mb-10">
                    <div className="flex items-center gap-2 mb-4">
                      <div
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-semibold ${meta.bg} ${meta.color}`}
                      >
                        {meta.icon}
                        {cat}
                      </div>
                      <div className="flex-1 h-px bg-slate-200" />
                      <span className="text-xs text-slate-400">
                        {catEndpoints.length} endpoint
                        {catEndpoints.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {catEndpoints.map((ep) => (
                        <EndpointCard key={ep.id} ep={ep} />
                      ))}
                    </div>
                  </div>
                );
              },
            )}

            {filtered.length === 0 && (
              <div
                className="text-center py-16 text-slate-400"
                data-ocid="api_docs.endpoints.empty_state"
              >
                <Search className="h-8 w-8 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No endpoints match your search.</p>
                <p className="text-sm mt-1">
                  Try a different keyword or clear the filter.
                </p>
              </div>
            )}
          </TabsContent>

          {/* ── Data Models Tab ── */}
          <TabsContent value="models" className="mt-0">
            <p className="text-sm text-slate-500 mb-6">
              Canonical type definitions used across all LIMS backend endpoints.
              Motoko variants map to TypeScript enums in{" "}
              <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                backend.d.ts
              </code>
              .
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {DATA_MODELS.map((model) => (
                <DataModelCard key={model.name} model={model} />
              ))}
            </div>
          </TabsContent>

          {/* ── Integration Guide Tab ── */}
          <TabsContent value="guide" className="mt-0">
            <div className="space-y-8 max-w-3xl">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-indigo-500" />
                    Setup & Initialization
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-600">
                    Import the typed backend interface from the auto-generated
                    declarations. The backend object is always authenticated —
                    it uses the current Internet Identity session.
                  </p>
                  <CodeBlock
                    code={`// src/frontend/src/backend.ts (auto-generated)
import { backendInterface } from "./backend.d.ts";
import { createActor } from "./declarations/backend";

export const backend: backendInterface = createActor(
  process.env.CANISTER_ID_BACKEND!
);`}
                    lang="typescript"
                  />
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4 text-indigo-500" />
                    Authentication Model
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-600">
                    Every canister call is cryptographically signed by the
                    caller's Internet Identity principal. The backend
                    auto-captures{" "}
                    <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                      caller
                    </code>{" "}
                    from the message context — no manual token passing required.
                  </p>
                  <CodeBlock
                    code={`// Backend (Motoko) — caller is auto-injected
public shared ({ caller }) func createUser(name : Text, role : UserRole) : async () {
  let user : User = {
    principal = caller;  // automatically set
    name;
    role;
    isActive = true;
  };
  users.add(caller, user);
};`}
                    lang="motoko"
                  />
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4 text-indigo-500" />
                    Query vs Update Calls
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-600">
                    Understand when each call type is used to build responsive
                    UIs.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                      <p className="font-semibold text-blue-800 text-sm mb-2">
                        QUERY calls
                      </p>
                      <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                        <li>Read-only, no state change</li>
                        <li>~50ms response (no consensus)</li>
                        <li>
                          getUser, getAllTasks, getNotifications,
                          getSortedTasksByDeadline
                        </li>
                      </ul>
                    </div>
                    <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                      <p className="font-semibold text-orange-800 text-sm mb-2">
                        UPDATE calls
                      </p>
                      <ul className="text-xs text-orange-700 space-y-1 list-disc list-inside">
                        <li>Mutate canister state</li>
                        <li>~2s response (goes through consensus)</li>
                        <li>
                          createUser, completeTask, sendNotification,
                          markNotificationAsRead
                        </li>
                      </ul>
                    </div>
                  </div>
                  <CodeBlock
                    code={`// Good pattern — show optimistic UI while update is in-flight
const [loading, setLoading] = useState(false);

const handleComplete = async (taskId: string) => {
  setLoading(true);
  try {
    await backend.completeTask(taskId);   // ~2s update call
    await refetchTasks();                  // refresh query
    toast.success("Task completed");
  } catch {
    toast.error("Failed to complete task");
  } finally {
    setLoading(false);
  }
};`}
                    lang="typescript"
                  />
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Globe className="h-4 w-4 text-indigo-500" />
                    BigInt Handling
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-600">
                    ICP timestamps are returned as{" "}
                    <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                      bigint
                    </code>{" "}
                    (nanoseconds). Convert for display using:
                  </p>
                  <CodeBlock
                    code={`// Convert ICP nanosecond bigint timestamp → JS Date
const toDate = (nanos: bigint): Date => 
  new Date(Number(nanos / 1_000_000n));

// Example usage
const deadline = toDate(task.deadline);
const isOverdue = deadline < new Date();

// Format for display
const label = deadline.toLocaleDateString("en-IN", {
  day: "2-digit", month: "short", year: "numeric"
});`}
                    lang="typescript"
                  />
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-indigo-500" />
                    Full Workflow Example
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">
                    Complete analyst workflow: load tasks → complete a task →
                    send notification to QA.
                  </p>
                  <CodeBlock
                    code={`import { backend } from "@/backend";
import { UserRole } from "@/backend.d.ts";

// 1. Load sorted tasks for the current analyst
const tasks = await backend.getSortedTasksByDeadline();
const myTasks = tasks
  .filter(([, t]) => t.assignedRole === UserRole.analyst)
  .map(([id, t]) => t);

// 2. Analyst submits analysis → complete the task
await backend.completeTask(myTasks[0].taskId);

// 3. Notify Section In-Charge that analysis is done
await backend.sendNotification(
  "user-002",  // Rajesh Malhotra (Section In-Charge)
  \`Analysis complete for \${myTasks[0].sampleId}. Ready for SIC Review.\`
);

// 4. Refresh notifications for the QA lead
const qaNotifications = await backend.getNotifications("user-001");
console.log("Unread for QA:", qaNotifications.filter(n => !n.isRead).length);`}
                    lang="typescript"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
