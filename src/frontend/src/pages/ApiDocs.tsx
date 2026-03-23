import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  BookOpen,
  Check,
  Code2,
  Copy,
  Database,
  GitBranch,
  Layers,
  Map as MapIcon,
  Plug,
  Search,
  Terminal,
  Zap,
} from "lucide-react";
import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type MethodType = "QUERY" | "UPDATE" | "NOT_IMPLEMENTED";

interface Param {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

interface Endpoint {
  id: string;
  name: string;
  category: string;
  method: MethodType;
  signature: string;
  description: string;
  params: Param[];
  responseType: string;
  responseExample: string;
  tsSnippet: string;
  note?: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const ENDPOINTS: Endpoint[] = [
  // ── Users ──
  {
    id: "getUser",
    name: "getUser",
    category: "Users",
    method: "QUERY",
    signature: "getUser(): async (User | null)",
    description:
      "Returns the User record for the currently authenticated Internet Computer principal. Returns null if the caller has not registered.",
    params: [],
    responseType: "User | null",
    responseExample: `{
  principal: "aaaaa-aa",
  name: "Dr. Sarah Chen",
  role: "qa",
  isActive: true
}`,
    tsSnippet: `const user = await actor.getUser();
if (user) {
  console.log(user.name, user.role);
}`,
  },
  {
    id: "createUser",
    name: "createUser",
    category: "Users",
    method: "UPDATE",
    signature: "createUser(name: Text, role: UserRole): async ()",
    description:
      "Creates or registers a new LIMS user with the caller's principal. The principal is set automatically from the calling identity.",
    params: [
      {
        name: "name",
        type: "string",
        required: true,
        description: "Full display name of the user",
      },
      {
        name: "role",
        type: "UserRole",
        required: true,
        description: "One of: admin | qa | sectionInCharge | analyst",
      },
    ],
    responseType: "void",
    responseExample: "// void — no return value",
    tsSnippet: `import { UserRole } from "../backend";
await actor.createUser("Dr. Sarah Chen", UserRole.qa);`,
  },
  {
    id: "workflowCheckDataType",
    name: "workflowCheckDataType",
    category: "Users",
    method: "QUERY",
    signature: "workflowCheckDataType(name: Text, value: Int): async User",
    description:
      "Debug/testing utility that constructs a synthetic User record from the supplied name and value. Not used in production workflow.",
    params: [
      {
        name: "name",
        type: "string",
        required: true,
        description: "Name to embed in the returned User",
      },
      {
        name: "value",
        type: "bigint",
        required: true,
        description:
          "Numeric test value (unused in response, for type checking)",
      },
    ],
    responseType: "User",
    responseExample: `{
  principal: "aaaaa-aa",
  name: "test",
  role: "analyst",
  isActive: true
}`,
    tsSnippet: `const u = await actor.workflowCheckDataType("test", 42n);`,
    note: "Debug function. Do not use in production flows.",
  },

  // ── Tasks ──
  {
    id: "getTasks",
    name: "getTasks",
    category: "Tasks",
    method: "QUERY",
    signature: "getTasks(): async [(Text, Task)]",
    description:
      "Returns all tasks as an array of key-value pairs (taskId, Task).",
    params: [],
    responseType: "Array<[string, Task]>",
    responseExample: `[
  [
    "task-001",
    {
      taskId: "task-001",
      sampleId: "SI-2026-001",
      taskType: "eligibilityCheck",
      assignedRole: "sectionInCharge",
      deadline: 1737043200000000000n
    }
  ]
]`,
    tsSnippet: `const tasks = await actor.getTasks();
for (const [id, task] of tasks) {
  console.log(id, task.taskType);
}`,
  },
  {
    id: "getCompletedTasks",
    name: "getCompletedTasks",
    category: "Tasks",
    method: "QUERY",
    signature: "getCompletedTasks(): async [(Text, Task)]",
    description:
      "Intended to return only completed tasks. Currently returns all tasks (full list). Will be scoped to completed tasks in a future release.",
    params: [],
    responseType: "Array<[string, Task]>",
    responseExample: `[
  ["task-001", { taskId: "task-001", ... }]
]`,
    tsSnippet: "const done = await actor.getCompletedTasks();",
    note: "Currently returns all tasks, not filtered to completed only.",
  },
  {
    id: "getSortedTasksByDeadline",
    name: "getSortedTasksByDeadline",
    category: "Tasks",
    method: "QUERY",
    signature: "getSortedTasksByDeadline(): async [(Text, Task)]",
    description:
      "Returns all tasks sorted ascending by their deadline (nanosecond BigInt timestamp). Useful for SLA-priority task queues.",
    params: [],
    responseType: "Array<[string, Task]>",
    responseExample: `[
  ["task-urgent", { deadline: 1737000000000000000n, ... }],
  ["task-next",   { deadline: 1737100000000000000n, ... }]
]`,
    tsSnippet: `const sorted = await actor.getSortedTasksByDeadline();
const next = sorted[0]?.[1]; // most urgent`,
  },
  {
    id: "getTask",
    name: "getTask",
    category: "Tasks",
    method: "QUERY",
    signature: "getTask(taskId: Text): async Task",
    description:
      "Fetches a single Task record by its unique taskId. Traps if the task is not found.",
    params: [
      {
        name: "taskId",
        type: "string",
        required: true,
        description: "Unique task identifier",
      },
    ],
    responseType: "Task",
    responseExample: `{
  taskId: "task-001",
  sampleId: "SI-2026-001",
  taskType: "analysis",
  assignedRole: "analyst",
  deadline: 1737043200000000000n
}`,
    tsSnippet: `const task = await actor.getTask("task-001");`,
  },
  {
    id: "getAllTasks",
    name: "getAllTasks",
    category: "Tasks",
    method: "UPDATE",
    signature: "getAllTasks(): async [Task]",
    description:
      "Returns all Task values (without keys) as a flat array. UPDATE variant — use getTasks() (QUERY) when read-only access is sufficient.",
    params: [],
    responseType: "Array<Task>",
    responseExample: `[
  { taskId: "task-001", sampleId: "SI-2026-001", ... },
  { taskId: "task-002", sampleId: "SI-2026-002", ... }
]`,
    tsSnippet: "const tasks = await actor.getAllTasks();",
  },
  {
    id: "findTasks",
    name: "findTasks",
    category: "Tasks",
    method: "UPDATE",
    signature: "findTasks(taskId: Text): async Task",
    description:
      "UPDATE variant of getTask(). Finds and returns a Task by its ID. Use for write-consistency scenarios.",
    params: [
      {
        name: "taskId",
        type: "string",
        required: true,
        description: "Unique task identifier",
      },
    ],
    responseType: "Task",
    responseExample: `{
  taskId: "task-001",
  sampleId: "SI-2026-001",
  taskType: "coa",
  assignedRole: "qa",
  deadline: 1737043200000000000n
}`,
    tsSnippet: `const task = await actor.findTasks("task-001");`,
  },
  {
    id: "completeTask",
    name: "completeTask",
    category: "Tasks",
    method: "UPDATE",
    signature: "completeTask(taskId: Text): async ()",
    description:
      "Marks a task as complete by removing it from the active tasks map. The task will no longer appear in getTasks() or getSortedTasksByDeadline().",
    params: [
      {
        name: "taskId",
        type: "string",
        required: true,
        description: "ID of the task to complete",
      },
    ],
    responseType: "void",
    responseExample: "// void",
    tsSnippet: `await actor.completeTask("task-001");`,
  },
  {
    id: "removeTask",
    name: "removeTask",
    category: "Tasks",
    method: "UPDATE",
    signature: "removeTask(taskId: Text): async ()",
    description:
      "Removes a task from the store. Equivalent to completeTask but semantically for permanent deletion rather than completion.",
    params: [
      {
        name: "taskId",
        type: "string",
        required: true,
        description: "ID of the task to remove",
      },
    ],
    responseType: "void",
    responseExample: "// void",
    tsSnippet: `await actor.removeTask("task-001");`,
  },

  // ── Notifications ──
  {
    id: "sendNotification",
    name: "sendNotification",
    category: "Notifications",
    method: "UPDATE",
    signature: "sendNotification(userId: Text, message: Text): async ()",
    description:
      "Creates a new Notification for the specified user. The notification is assigned a UUID, timestamped, and stored in the user's notification list.",
    params: [
      {
        name: "userId",
        type: "string",
        required: true,
        description: "Target user's identifier",
      },
      {
        name: "message",
        type: "string",
        required: true,
        description: "Notification body text",
      },
    ],
    responseType: "void",
    responseExample: "// void",
    tsSnippet: `await actor.sendNotification("user-sarah", "Sample SI-2026-001 is ready for QA Review.");`,
  },
  {
    id: "getNotifications",
    name: "getNotifications",
    category: "Notifications",
    method: "UPDATE",
    signature: "getNotifications(userId: Text): async [Notification]",
    description:
      "Retrieves all notifications for the specified user, including read and unread. Returns an empty array if the user has no notifications.",
    params: [
      {
        name: "userId",
        type: "string",
        required: true,
        description: "User whose notifications to fetch",
      },
    ],
    responseType: "Array<Notification>",
    responseExample: `[
  {
    notificationId: "notif-abc123",
    message: "Sample SI-2026-001 ready for QA Review",
    timestamp: 1737043200000000000n,
    isRead: false
  }
]`,
    tsSnippet: `const notifs = await actor.getNotifications("user-sarah");
const unread = notifs.filter(n => !n.isRead);`,
  },
  {
    id: "markNotificationAsRead",
    name: "markNotificationAsRead",
    category: "Notifications",
    method: "UPDATE",
    signature:
      "markNotificationAsRead(userId: Text, notificationId: Text): async ()",
    description:
      "Marks a specific notification as read (isRead = true) for the given user. Silent no-op if the notificationId does not exist.",
    params: [
      {
        name: "userId",
        type: "string",
        required: true,
        description: "Owner of the notification",
      },
      {
        name: "notificationId",
        type: "string",
        required: true,
        description: "ID of the notification to mark read",
      },
    ],
    responseType: "void",
    responseExample: "// void",
    tsSnippet: `await actor.markNotificationAsRead("user-sarah", "notif-abc123");`,
  },

  // ── Clients ──
  {
    id: "addClient",
    name: "addClient",
    category: "Clients",
    method: "UPDATE",
    signature: "addClient(client: Client): async Nat",
    description:
      "Adds a new client to the Client Master. Returns the auto-incremented clientId (Nat) assigned to the new record.",
    params: [
      {
        name: "client",
        type: "Client",
        required: true,
        description:
          "Client record: { name, contactPerson, email, phone, address, city, pinCode }",
      },
    ],
    responseType: "bigint (ClientID)",
    responseExample: "42n",
    tsSnippet: `const id = await actor.addClient({
  name: "PharmaCo Ltd",
  contactPerson: "Ravi Kumar",
  email: "ravi@pharmaco.com",
  phone: "+91-9876543210",
  address: "12 Industrial Park",
  city: "Mumbai",
  pinCode: "400001"
});
console.log("New client ID:", id);`,
  },
  {
    id: "loadClientById",
    name: "loadClientById",
    category: "Clients",
    method: "UPDATE",
    signature: "loadClientById(clientId: Nat): async Client",
    description:
      "Loads and returns a Client record by its numeric ID. Traps if the clientId does not exist.",
    params: [
      {
        name: "clientId",
        type: "bigint (ClientID)",
        required: true,
        description: "Auto-incremented client identifier",
      },
    ],
    responseType: "Client",
    responseExample: `{
  name: "PharmaCo Ltd",
  contactPerson: "Ravi Kumar",
  email: "ravi@pharmaco.com",
  phone: "+91-9876543210",
  address: "12 Industrial Park",
  city: "Mumbai",
  pinCode: "400001"
}`,
    tsSnippet: "const client = await actor.loadClientById(42n);",
  },
  {
    id: "updateClient",
    name: "updateClient",
    category: "Clients",
    method: "UPDATE",
    signature: "updateClient(clientId: Nat, client: Client): async ()",
    description:
      "Updates an existing client record. All fields in the Client object are replaced.",
    params: [
      {
        name: "clientId",
        type: "bigint",
        required: true,
        description: "ID of the client to update",
      },
      {
        name: "client",
        type: "Client",
        required: true,
        description: "Updated client record",
      },
    ],
    responseType: "void",
    responseExample: "// void",
    tsSnippet: `await actor.updateClient(42n, { ...existing, phone: "+91-0000000000" });`,
  },
  {
    id: "deleteClient",
    name: "deleteClient",
    category: "Clients",
    method: "UPDATE",
    signature: "deleteClient(clientId: Nat): async ()",
    description:
      "Permanently removes a client from the Client Master. This action is irreversible.",
    params: [
      {
        name: "clientId",
        type: "bigint",
        required: true,
        description: "ID of the client to delete",
      },
    ],
    responseType: "void",
    responseExample: "// void",
    tsSnippet: "await actor.deleteClient(42n);",
  },
  {
    id: "getClientSamples",
    name: "getClientSamples",
    category: "Clients",
    method: "QUERY",
    signature: "getClientSamples(clientId: Principal): async [Text]",
    description:
      "Returns an array of sampleIds associated with the given client principal. Currently a stub that returns an empty array.",
    params: [
      {
        name: "clientId",
        type: "Principal",
        required: true,
        description: "IC Principal of the client",
      },
    ],
    responseType: "Array<string>",
    responseExample: `["SI-2026-001", "SI-2026-007"]`,
    tsSnippet: "const samples = await actor.getClientSamples(principal);",
    note: "Stub implementation — currently returns an empty array.",
  },

  // ── Test Masters ──
  {
    id: "addTestMaster",
    name: "addTestMaster",
    category: "Test Masters",
    method: "UPDATE",
    signature: "addTestMaster(testMaster: TestMaster): async Nat",
    description:
      "Adds a new test configuration to the Test Masters catalogue. Returns the auto-incremented TestMasterID.",
    params: [
      {
        name: "testMaster",
        type: "TestMaster",
        required: true,
        description: "Test master record including parameters array",
      },
    ],
    responseType: "bigint (TestMasterID)",
    responseExample: "7n",
    tsSnippet: `const id = await actor.addTestMaster({
  testName: "HPLC Assay",
  testType: "Chemical",
  daysRequired: 3n,
  status: Variant_active_inactive.active,
  parameters: [
    {
      name: "Assay",
      unit: "%",
      minValue: 98n,
      maxValue: 102n,
      acceptanceCriteria: "98.0 – 102.0%"
    }
  ]
});`,
  },
  {
    id: "loadTestMaster",
    name: "loadTestMaster",
    category: "Test Masters",
    method: "UPDATE",
    signature: "loadTestMaster(testMasterId: Nat): async TestMaster",
    description:
      "Loads a TestMaster record by its numeric ID. Traps if the ID does not exist.",
    params: [
      {
        name: "testMasterId",
        type: "bigint",
        required: true,
        description: "Auto-incremented test master ID",
      },
    ],
    responseType: "TestMaster",
    responseExample: `{
  testName: "HPLC Assay",
  testType: "Chemical",
  daysRequired: 3n,
  status: "active",
  parameters: [ { name: "Assay", unit: "%", minValue: 98n, maxValue: 102n, ... } ]
}`,
    tsSnippet: "const tm = await actor.loadTestMaster(7n);",
  },
  {
    id: "getTestSpecIds",
    name: "getTestSpecIds",
    category: "Test Masters",
    method: "QUERY",
    signature: "getTestSpecIds(): async [Nat]",
    description:
      "Returns an array of all TestMasterIDs currently stored in the catalogue. Use with loadTestMaster() to fetch full records.",
    params: [],
    responseType: "Array<bigint>",
    responseExample: "[1n, 2n, 3n, 4n, 5n]",
    tsSnippet: `const ids = await actor.getTestSpecIds();
const all = await Promise.all(ids.map(id => actor.loadTestMaster(id)));`,
  },

  // ── Samples / Workflow ──
  {
    id: "createSample",
    name: "createSample",
    category: "Samples",
    method: "UPDATE",
    signature: "createSample(sample: Sample): async Text",
    description:
      "Creates and persists a new Sample record in stable storage. The sampleId is returned and should be stored by the client for subsequent workflow operations.",
    params: [
      {
        name: "sample",
        type: "Sample",
        required: true,
        description:
          "Full sample record including clientName, sampleName, testName, sampleStatus, rfa references, testSpecs, analysisResults",
      },
    ],
    responseType: "string (SampleID)",
    responseExample: `"SI-2026-042"`,
    tsSnippet: `const sampleId = await actor.createSample({
  sampleId: "",          // assigned by canister
  clientName: "PharmaCo Ltd",
  sampleName: "API Batch 2024-A",
  testName: "HPLC Assay",
  sampleStatus: { __kind__: "pending", pending: null },
  dateReceived: BigInt(Date.now()) * 1_000_000n,
  registrationId: 0n,
  rfa: { sampleDetails: 0n, registration: 0n, billing: 0n },
  testSpecs: [],
  analysisResults: []
});
console.log("Created:", sampleId);`,
  },
  {
    id: "updateSample",
    name: "updateSample",
    category: "Samples",
    method: "UPDATE",
    signature: "updateSample(sampleId: Text, stage: Text): async ()",
    description:
      "Intended to update the workflow stage of a sample. NOT IMPLEMENTED — calling this method will trap the canister.",
    params: [
      {
        name: "sampleId",
        type: "string",
        required: true,
        description: "Sample ID to update",
      },
      {
        name: "stage",
        type: "string",
        required: true,
        description: "New stage name",
      },
    ],
    responseType: "void",
    responseExample: "// traps — NOT IMPLEMENTED",
    tsSnippet: `// ⚠️ Do NOT call — will trap
// await actor.updateSample("SI-2026-001", "analysis");`,
    note: "NOT IMPLEMENTED. This method will trap (panic) the canister. Do not call in production.",
  },
  {
    id: "getSample",
    name: "getSample",
    category: "Samples",
    method: "QUERY",
    signature: "getSample(sampleId: Text): async Sample",
    description:
      "Retrieves a full Sample record by its sampleId. Traps if the sampleId does not exist.",
    params: [
      {
        name: "sampleId",
        type: "string",
        required: true,
        description: "The sample identifier (e.g. SI-2026-001)",
      },
    ],
    responseType: "Sample",
    responseExample: `{
  sampleId: "SI-2026-001",
  clientName: "PharmaCo Ltd",
  sampleName: "API Batch 2024-A",
  testName: "HPLC Assay",
  sampleStatus: { __kind__: "analysis", analysis: null },
  dateReceived: 1737043200000000000n,
  registrationId: 1n,
  rfa: { sampleDetails: 1n, registration: 1n, billing: 1n },
  testSpecs: [...],
  analysisResults: [...]
}`,
    tsSnippet: `const sample = await actor.getSample("SI-2026-001");
console.log(sample.sampleStatus.__kind__);`,
  },

  // ── Eligibility ──
  {
    id: "submitEligibilityVote",
    name: "submitEligibilityVote",
    category: "Eligibility",
    method: "UPDATE",
    signature:
      "submitEligibilityVote(sampleId, isEligible, comments, votes): async EligibilityVoteValuation",
    description:
      "Submits the eligibility decision for a sample including the multi-assignee vote array. All assigned Section In-Charges must vote; if any vote Hold/Reject the sample status changes immediately.",
    params: [
      {
        name: "sampleId",
        type: "string",
        required: true,
        description: "Sample to vote on",
      },
      {
        name: "isEligible",
        type: "boolean",
        required: true,
        description: "true = Approve, false = Hold/Reject",
      },
      {
        name: "comments",
        type: "string",
        required: true,
        description: "Reviewer remarks (required for rejection/hold)",
      },
      {
        name: "votes",
        type: "VerifyEligibilityDecisions",
        required: true,
        description:
          "Array of { userId: Principal, decision: boolean } per assignee",
      },
    ],
    responseType: "EligibilityVoteValuation",
    responseExample: `{
  isEligible: true,
  comments: "All checks passed",
  votes: [
    { userId: "2vxsx-fae", decision: true },
    { userId: "rdmx6-jaaaa", decision: true }
  ]
}`,
    tsSnippet: `const result = await actor.submitEligibilityVote(
  "SI-2026-001",
  true,
  "All acceptance and feasibility checks passed.",
  [
    { userId: principal1, decision: true },
    { userId: principal2, decision: true }
  ]
);`,
  },
  {
    id: "getEligibilityVote",
    name: "getEligibilityVote",
    category: "Eligibility",
    method: "QUERY",
    signature:
      "getEligibilityVote(sampleId: Text): async EligibilityVoteValuation",
    description:
      "Returns the current eligibility vote record for the given sample, including each assignee's decision.",
    params: [
      {
        name: "sampleId",
        type: "string",
        required: true,
        description: "Sample ID",
      },
    ],
    responseType: "EligibilityVoteValuation",
    responseExample: `{
  isEligible: false,
  comments: "Reagents unavailable",
  votes: [
    { userId: "2vxsx-fae", decision: true },
    { userId: "rdmx6-jaaaa", decision: false }
  ]
}`,
    tsSnippet: `const vote = await actor.getEligibilityVote("SI-2026-007");`,
  },
  {
    id: "findEligibilityVote",
    name: "findEligibilityVote",
    category: "Eligibility",
    method: "UPDATE",
    signature:
      "findEligibilityVote(sampleId: Text): async EligibilityVoteValuation",
    description:
      "UPDATE variant of getEligibilityVote(). Use when consistent read is required after a write operation.",
    params: [
      {
        name: "sampleId",
        type: "string",
        required: true,
        description: "Sample ID",
      },
    ],
    responseType: "EligibilityVoteValuation",
    responseExample: `{
  isEligible: true,
  comments: "Approved",
  votes: [{ userId: "2vxsx-fae", decision: true }]
}`,
    tsSnippet: `const vote = await actor.findEligibilityVote("SI-2026-001");`,
  },

  // ── Test Specification ──
  {
    id: "saveTestSpec",
    name: "saveTestSpec",
    category: "Test Specification",
    method: "UPDATE",
    signature:
      "saveTestSpec(sampleId: Text, testSpecs: [TestSpecification]): async ()",
    description:
      "Saves test specifications for a sample and advances the sample to the Analysis stage.",
    params: [
      {
        name: "sampleId",
        type: "string",
        required: true,
        description: "Sample ID",
      },
      {
        name: "testSpecs",
        type: "TestSpecification[]",
        required: true,
        description:
          "Array of test specifications with parameter, method, acceptanceCriteria, referenceStandard, assignedAnalyst, targetSLA",
      },
    ],
    responseType: "void",
    responseExample: "// void",
    tsSnippet: `await (actor as any).saveTestSpec("SI-2026-001", [
  { parameter: "Assay", method: "HPLC", acceptanceCriteria: "98-102%",
    referenceStandard: "USP", assignedAnalyst: "Elena Rodriguez", targetSLA: 3n }
]);`,
  },
  {
    id: "getTestSpec",
    name: "getTestSpec",
    category: "Test Specification",
    method: "QUERY",
    signature: "getTestSpec(sampleId: Text): async [TestSpecification]",
    description: "Retrieves saved test specifications for a sample.",
    params: [
      {
        name: "sampleId",
        type: "string",
        required: true,
        description: "Sample ID",
      },
    ],
    responseType: "TestSpecification[]",
    responseExample: `[{ parameter: "Assay", method: "HPLC", acceptanceCriteria: "98-102%", referenceStandard: "USP", assignedAnalyst: "Elena Rodriguez", targetSLA: 3n }]`,
    tsSnippet: `const specs = await (actor as any).getTestSpec("SI-2026-001");`,
  },
  {
    id: "assignAnalyst",
    name: "assignAnalyst",
    category: "Test Specification",
    method: "UPDATE",
    signature: "assignAnalyst(sampleId: Text, analystName: Text): async ()",
    description:
      "Assigns a lead analyst to all test specifications for the sample.",
    params: [
      {
        name: "sampleId",
        type: "string",
        required: true,
        description: "Sample ID",
      },
      {
        name: "analystName",
        type: "string",
        required: true,
        description: "Full name of the assigned analyst",
      },
    ],
    responseType: "void",
    responseExample: "// void",
    tsSnippet: `await (actor as any).assignAnalyst("SI-2026-001", "Elena Rodriguez");`,
  },

  // ── Analysis ──
  {
    id: "saveAnalysisResult",
    name: "saveAnalysisResult",
    category: "Analysis",
    method: "UPDATE",
    signature:
      "saveAnalysisResult(sampleId: Text, results: [AnalysisResult]): async ()",
    description:
      "Saves analysis result draft for a sample. Does not advance the workflow stage.",
    params: [
      {
        name: "sampleId",
        type: "string",
        required: true,
        description: "Sample ID",
      },
      {
        name: "results",
        type: "AnalysisResult[]",
        required: true,
        description:
          "Array of results with parameter, observedValue, unit, verdict ({__kind__: 'pass'|'fail'|'oos'}), remark",
      },
    ],
    responseType: "void",
    responseExample: "// void",
    tsSnippet: `await (actor as any).saveAnalysisResult("SI-2026-001", [
  { parameter: "Assay", observedValue: "99.5", unit: "%",
    verdict: { __kind__: "pass" }, remark: "" }
]);`,
  },
  {
    id: "getAnalysisResult",
    name: "getAnalysisResult",
    category: "Analysis",
    method: "QUERY",
    signature: "getAnalysisResult(sampleId: Text): async [AnalysisResult]",
    description: "Retrieves saved analysis results for a sample.",
    params: [
      {
        name: "sampleId",
        type: "string",
        required: true,
        description: "Sample ID",
      },
    ],
    responseType: "AnalysisResult[]",
    responseExample: `[{ parameter: "Assay", observedValue: "99.5", unit: "%", verdict: { __kind__: "pass" }, remark: "" }]`,
    tsSnippet: `const results = await (actor as any).getAnalysisResult("SI-2026-001");`,
  },
  {
    id: "submitAnalysis",
    name: "submitAnalysis",
    category: "Analysis",
    method: "UPDATE",
    signature: "submitAnalysis(sampleId: Text): async ()",
    description:
      "Finalizes the analysis for a sample and advances the workflow to SIC Review stage.",
    params: [
      {
        name: "sampleId",
        type: "string",
        required: true,
        description: "Sample ID",
      },
    ],
    responseType: "void",
    responseExample: "// void",
    tsSnippet: `await (actor as any).submitAnalysis("SI-2026-001");`,
  },

  // ── SIC Review ──
  {
    id: "saveSICReview",
    name: "saveSICReview",
    category: "SIC Review",
    method: "UPDATE",
    signature: "saveSICReview(sampleId: Text, review: SicReview): async ()",
    description:
      "Saves a Section In-Charge review draft for a sample. Does not advance the workflow stage.",
    params: [
      {
        name: "sampleId",
        type: "string",
        required: true,
        description: "Sample ID",
      },
      {
        name: "review",
        type: "SicReview",
        required: true,
        description:
          "Review object: { reviewerName, decision: bool, comments, flaggedRows: bigint[] }",
      },
    ],
    responseType: "void",
    responseExample: "// void",
    tsSnippet: `await (actor as any).saveSICReview("SI-2026-001", {
  reviewerName: "Rajesh Malhotra", decision: true,
  comments: "All parameters within spec.", flaggedRows: []
});`,
  },
  {
    id: "getSICReview",
    name: "getSICReview",
    category: "SIC Review",
    method: "QUERY",
    signature: "getSICReview(sampleId: Text): async ?SicReview",
    description:
      "Retrieves the saved SIC review for a sample, or null if not yet submitted.",
    params: [
      {
        name: "sampleId",
        type: "string",
        required: true,
        description: "Sample ID",
      },
    ],
    responseType: "SicReview | null",
    responseExample: `{ reviewerName: "Rajesh Malhotra", decision: true, comments: "Approved", flaggedRows: [] }`,
    tsSnippet: `const review = await (actor as any).getSICReview("SI-2026-001");`,
  },
  {
    id: "approveSICReview",
    name: "approveSICReview",
    category: "SIC Review",
    method: "UPDATE",
    signature: "approveSICReview(sampleId: Text): async ()",
    description:
      "Approves the SIC review and advances the sample to QA Review stage.",
    params: [
      {
        name: "sampleId",
        type: "string",
        required: true,
        description: "Sample ID",
      },
    ],
    responseType: "void",
    responseExample: "// void",
    tsSnippet: `await (actor as any).approveSICReview("SI-2026-001");`,
  },
  {
    id: "rejectSICReview",
    name: "rejectSICReview",
    category: "SIC Review",
    method: "UPDATE",
    signature: "rejectSICReview(sampleId: Text): async ()",
    description:
      "Rejects the SIC review and returns the sample to the Analysis stage.",
    params: [
      {
        name: "sampleId",
        type: "string",
        required: true,
        description: "Sample ID",
      },
    ],
    responseType: "void",
    responseExample: "// void",
    tsSnippet: `await (actor as any).rejectSICReview("SI-2026-001");`,
  },

  // ── QA Review ──
  {
    id: "saveQAReview",
    name: "saveQAReview",
    category: "QA Review",
    method: "UPDATE",
    signature: "saveQAReview(sampleId: Text, review: QaReview): async ()",
    description:
      "Saves a QA Head review draft for a sample. Does not advance the workflow stage.",
    params: [
      {
        name: "sampleId",
        type: "string",
        required: true,
        description: "Sample ID",
      },
      {
        name: "review",
        type: "QaReview",
        required: true,
        description: "Review object: { qaHeadName, decision: bool, comments }",
      },
    ],
    responseType: "void",
    responseExample: "// void",
    tsSnippet: `await (actor as any).saveQAReview("SI-2026-001", {
  qaHeadName: "Dr. Sarah Chen", decision: true, comments: "Approved for COA."
});`,
  },
  {
    id: "getQAReview",
    name: "getQAReview",
    category: "QA Review",
    method: "QUERY",
    signature: "getQAReview(sampleId: Text): async ?QaReview",
    description:
      "Retrieves the saved QA review for a sample, or null if not yet submitted.",
    params: [
      {
        name: "sampleId",
        type: "string",
        required: true,
        description: "Sample ID",
      },
    ],
    responseType: "QaReview | null",
    responseExample: `{ qaHeadName: "Dr. Sarah Chen", decision: true, comments: "Approved for COA." }`,
    tsSnippet: `const review = await (actor as any).getQAReview("SI-2026-001");`,
  },
  {
    id: "approveQAReview",
    name: "approveQAReview",
    category: "QA Review",
    method: "UPDATE",
    signature: "approveQAReview(sampleId: Text): async ()",
    description:
      "Approves the QA review and advances the sample to COA/Completed stage.",
    params: [
      {
        name: "sampleId",
        type: "string",
        required: true,
        description: "Sample ID",
      },
    ],
    responseType: "void",
    responseExample: "// void",
    tsSnippet: `await (actor as any).approveQAReview("SI-2026-001");`,
  },
  {
    id: "rejectQAReview",
    name: "rejectQAReview",
    category: "QA Review",
    method: "UPDATE",
    signature: "rejectQAReview(sampleId: Text): async ()",
    description:
      "Rejects the QA review and returns the sample to SIC Review stage.",
    params: [
      {
        name: "sampleId",
        type: "string",
        required: true,
        description: "Sample ID",
      },
    ],
    responseType: "void",
    responseExample: "// void",
    tsSnippet: `await (actor as any).rejectQAReview("SI-2026-001");`,
  },

  // ── COA ──
  {
    id: "findCoa",
    name: "findCoa",
    category: "COA",
    method: "UPDATE",
    signature: "findCoa(sampleId: Text): async COAValue",
    description:
      "Retrieves the Certificate of Analysis record for the given sample. Traps if no COA exists for that sampleId.",
    params: [
      {
        name: "sampleId",
        type: "string",
        required: true,
        description: "Sample ID whose COA to retrieve",
      },
    ],
    responseType: "COAValue",
    responseExample: `{
  coaNumber: 1001n,
  registrationNumber: 42n,
  issuedDateTime: 1737043200000000000n,
  sampleIntakeEmployee: "Priya Sharma",
  verificationEmployee: "James Okonkwo",
  sicEmployee: "Rajesh Malhotra",
  qaEmployee: "Dr. Sarah Chen"
}`,
    tsSnippet: `const coa = await actor.findCoa("SI-2026-001");
const issued = new Date(Number(coa.issuedDateTime / 1_000_000n));`,
  },
];

const CATEGORIES = [
  "Users",
  "Tasks",
  "Notifications",
  "Clients",
  "Test Masters",
  "Samples",
  "Eligibility",
  "Test Specification",
  "Analysis",
  "SIC Review",
  "QA Review",
  "COA",
];

// ─── Helper Components ─────────────────────────────────────────────────────────
function MethodBadge({ method }: { method: MethodType }) {
  if (method === "QUERY")
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
        QUERY
      </span>
    );
  if (method === "NOT_IMPLEMENTED")
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
        NOT IMPL
      </span>
    );
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
      UPDATE
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="p-1.5 rounded hover:bg-white/20 transition-colors"
      title="Copy to clipboard"
      data-ocid="apidocs.copy_button"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-400" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-slate-400" />
      )}
    </button>
  );
}

function CodeBlock({
  code,
  lang = "typescript",
}: { code: string; lang?: string }) {
  return (
    <div className="relative rounded-lg overflow-hidden border border-slate-700">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800">
        <span className="text-xs text-slate-400 font-mono">{lang}</span>
        <CopyButton text={code} />
      </div>
      <pre className="bg-slate-900 px-4 py-3 overflow-x-auto text-sm">
        <code className="text-slate-200 font-mono whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}

function ParamsTable({ params }: { params: Param[] }) {
  if (!params.length)
    return (
      <p className="text-sm text-slate-500 italic">
        No parameters — this method takes no arguments.
      </p>
    );
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-2 text-left font-semibold text-slate-600">
              Parameter
            </th>
            <th className="px-4 py-2 text-left font-semibold text-slate-600">
              Type
            </th>
            <th className="px-4 py-2 text-left font-semibold text-slate-600">
              Required
            </th>
            <th className="px-4 py-2 text-left font-semibold text-slate-600">
              Description
            </th>
          </tr>
        </thead>
        <tbody>
          {params.map((p, i) => (
            <tr
              key={p.name}
              className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}
            >
              <td className="px-4 py-2 font-mono text-blue-700">{p.name}</td>
              <td className="px-4 py-2 font-mono text-purple-700">{p.type}</td>
              <td className="px-4 py-2">
                {p.required ? (
                  <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                    Required
                  </Badge>
                ) : (
                  <Badge className="bg-slate-100 text-slate-500 border-slate-200 text-xs">
                    Optional
                  </Badge>
                )}
              </td>
              <td className="px-4 py-2 text-slate-600">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EndpointCard({ ep }: { ep: Endpoint }) {
  return (
    <AccordionItem
      value={ep.id}
      className="border border-slate-200 rounded-xl mb-3 overflow-hidden shadow-sm"
    >
      <AccordionTrigger
        className="px-5 py-4 hover:bg-slate-50 hover:no-underline"
        data-ocid={`apidocs.${ep.id}.toggle`}
      >
        <div className="flex items-center gap-3 flex-wrap text-left">
          <MethodBadge method={ep.method} />
          <span className="font-mono font-semibold text-slate-800">
            {ep.name}
          </span>
          <span className="text-xs text-slate-400 hidden sm:block">
            {ep.description.slice(0, 70)}…
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-5 pb-6">
        <p className="text-slate-600 mb-5 mt-2 text-sm leading-relaxed">
          {ep.description}
        </p>

        {ep.note && (
          <div className="flex items-start gap-2 mb-5 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800">{ep.note}</p>
          </div>
        )}

        <div className="mb-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Function Signature
          </h4>
          <CodeBlock code={ep.signature} lang="motoko" />
        </div>

        <div className="mb-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Parameters
          </h4>
          <ParamsTable params={ep.params} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Response Type:{" "}
              <span className="font-mono text-purple-700">
                {ep.responseType}
              </span>
            </h4>
            <CodeBlock code={ep.responseExample} lang="json" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              TypeScript Example
            </h4>
            <CodeBlock code={ep.tsSnippet} lang="typescript" />
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ApiDocs() {
  const [search, setSearch] = useState("");

  const filtered = ENDPOINTS.filter(
    (ep) =>
      search === "" ||
      ep.name.toLowerCase().includes(search.toLowerCase()) ||
      ep.category.toLowerCase().includes(search.toLowerCase()) ||
      ep.description.toLowerCase().includes(search.toLowerCase()),
  );

  const byCategory = CATEGORIES.map((cat) => ({
    cat,
    eps: filtered.filter((ep) => ep.category === cat),
  })).filter((g) => g.eps.length > 0);

  const stats = {
    total: ENDPOINTS.length,
    query: ENDPOINTS.filter((e) => e.method === "QUERY").length,
    update: ENDPOINTS.filter((e) => e.method === "UPDATE").length,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page Header */}
      <div
        className="px-8 py-8"
        style={{
          background:
            "linear-gradient(135deg, rgb(11,54,77) 0%, rgb(15,76,109) 100%)",
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                DKR LIMS — API Documentation
              </h1>
              <p className="text-blue-200 text-sm">
                Complete reference for all 29 canister endpoints
              </p>
            </div>
          </div>
          <div className="flex gap-4 mt-6 flex-wrap">
            <div className="bg-white/10 rounded-lg px-4 py-2 text-center">
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-xs text-blue-200">Total APIs</div>
            </div>
            <div className="bg-emerald-500/20 rounded-lg px-4 py-2 text-center">
              <div className="text-2xl font-bold text-emerald-300">
                {stats.query}
              </div>
              <div className="text-xs text-blue-200">QUERY</div>
            </div>
            <div className="bg-blue-500/20 rounded-lg px-4 py-2 text-center">
              <div className="text-2xl font-bold text-blue-300">
                {stats.update}
              </div>
              <div className="text-xs text-blue-200">UPDATE</div>
            </div>
            <div className="bg-white/5 rounded-lg px-4 py-2 text-center">
              <div className="text-2xl font-bold text-amber-300">1</div>
              <div className="text-xs text-blue-200">Not Impl.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-6xl mx-auto px-8 -mt-5">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search endpoints, categories, descriptions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 py-3 bg-white shadow-md border-slate-200 rounded-xl text-sm"
            data-ocid="apidocs.search_input"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-8 py-6">
        <Tabs defaultValue="endpoints">
          <TabsList
            className="flex w-full bg-white border border-slate-200 rounded-xl p-1 shadow-sm mb-6 h-auto flex-wrap gap-1"
            data-ocid="apidocs.tab"
          >
            {[
              {
                value: "endpoints",
                label: "Backend API",
                icon: <Code2 className="w-3.5 h-3.5" />,
              },
              {
                value: "models",
                label: "Data Models",
                icon: <Database className="w-3.5 h-3.5" />,
              },
              {
                value: "routes",
                label: "Pages & Routes",
                icon: <MapIcon className="w-3.5 h-3.5" />,
              },
              {
                value: "workflow",
                label: "Workflow",
                icon: <GitBranch className="w-3.5 h-3.5" />,
              },
              {
                value: "components",
                label: "UI Components",
                icon: <Layers className="w-3.5 h-3.5" />,
              },
              {
                value: "integration",
                label: "Integration Guide",
                icon: <Plug className="w-3.5 h-3.5" />,
              },
              {
                value: "overview",
                label: "Overview",
                icon: <BookOpen className="w-3.5 h-3.5" />,
              },
            ].map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg data-[state=active]:bg-[rgb(11,54,77)] data-[state=active]:text-white"
              >
                {t.icon}
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── Endpoints Tab ── */}
          <TabsContent value="endpoints">
            {byCategory.length === 0 && (
              <div className="text-center py-16 text-slate-400">
                <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p>No endpoints match your search.</p>
              </div>
            )}
            {byCategory.map(({ cat, eps }) => (
              <div key={cat} className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-lg font-bold text-slate-800">{cat}</h2>
                  <Badge variant="outline" className="text-xs">
                    {eps.length} endpoint{eps.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
                <Accordion type="multiple">
                  {eps.map((ep) => (
                    <EndpointCard key={ep.id} ep={ep} />
                  ))}
                </Accordion>
              </div>
            ))}
          </TabsContent>

          {/* ── Data Models Tab ── */}
          <TabsContent value="models">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[
                {
                  name: "User",
                  code: `interface User {
  principal: Principal;   // IC caller principal
  name:      string;      // Full display name
  role:      UserRole;    // admin | qa | sectionInCharge | analyst
  isActive:  boolean;     // Account active flag
}`,
                },
                {
                  name: "UserRole (enum)",
                  code: `enum UserRole {
  admin          = "admin",
  qa             = "qa",
  sectionInCharge= "sectionInCharge",
  analyst        = "analyst"
}`,
                },
                {
                  name: "Task",
                  code: `interface Task {
  taskId:       string;    // Unique ID
  sampleId:     string;    // Linked sample
  taskType:     TaskType;
  assignedRole: UserRole;
  deadline:     bigint;    // nanosecond timestamp
}`,
                },
                {
                  name: "TaskType (enum)",
                  code: `enum TaskType {
  sampleIntake     = "sampleIntake",
  eligibilityCheck = "eligibilityCheck",
  analysis         = "analysis",
  review           = "review",
  coa              = "coa"
}`,
                },
                {
                  name: "Notification",
                  code: `interface Notification {
  notificationId: string;   // UUID
  message:        string;
  timestamp:      bigint;   // nanoseconds
  isRead:         boolean;
}`,
                },
                {
                  name: "Sample",
                  code: `interface Sample {
  sampleId:       string;
  clientName:     string;
  sampleName:     string;
  testName:       string;
  sampleStatus:   SampleStatus;
  dateReceived:   bigint;          // nanoseconds
  registrationId: bigint;
  rfa: {
    sampleDetails: bigint;
    registration:  bigint;
    billing:       bigint;
  };
  testSpecs:      TestSpecification[];
  analysisResults: AnalysisResult[];
  sicReview?:     SicReview;
  qaReview?:      QaReview;
}`,
                },
                {
                  name: "SampleStatus (variant)",
                  code: `type SampleStatus =
  | { __kind__: "pending";   pending: null }
  | { __kind__: "eligible";  eligible: null }
  | { __kind__: "hold";      hold: string }  // reason text
  | { __kind__: "analysis";  analysis: null }
  | { __kind__: "review";    review: null }
  | { __kind__: "completed"; completed: null }`,
                },
                {
                  name: "Client",
                  code: `interface Client {
  name:          string;
  contactPerson: string;
  email:         string;
  phone:         string;
  address:       string;
  city:          string;
  pinCode:       string;
}`,
                },
                {
                  name: "TestMaster",
                  code: `interface TestMaster {
  testName:     string;
  testType:     string;       // Chemical | Micro | Physical...
  daysRequired: bigint;
  status:       "active" | "inactive";
  parameters:   TestParameter[];
}`,
                },
                {
                  name: "TestParameter",
                  code: `interface TestParameter {
  name:               string;
  unit:               string;
  minValue:           bigint;
  maxValue:           bigint;
  acceptanceCriteria: string;
}`,
                },
                {
                  name: "TestSpecification",
                  code: `interface TestSpecification {
  parameter:          string;
  acceptanceCriteria: string;
  method:             string;
  referenceStandard:  string;
  assignedAnalyst:    string;
  targetSLA:          bigint;  // nanoseconds
}`,
                },
                {
                  name: "AnalysisResult",
                  code: `interface AnalysisResult {
  parameter:     string;
  observedValue: string;
  unit:          string;
  verdict:       "pass" | "fail" | "oos";
  remark:        string;
}`,
                },
                {
                  name: "SicReview",
                  code: `interface SicReview {
  reviewerName: string;
  decision:     boolean;    // true = approved
  comments:     string;
  flaggedRows:  bigint[];   // row indices
}`,
                },
                {
                  name: "QaReview",
                  code: `interface QaReview {
  qaHeadName: string;
  decision:   boolean;
  comments:   string;
}`,
                },
                {
                  name: "COAValue",
                  code: `interface COAValue {
  coaNumber:             bigint;
  registrationNumber:    bigint;
  issuedDateTime:        bigint;   // nanoseconds
  sampleIntakeEmployee:  string;
  verificationEmployee:  string;
  sicEmployee:           string;
  qaEmployee:            string;
}`,
                },
                {
                  name: "EligibilityVoteValuation",
                  code: `interface EligibilityVoteValuation {
  isEligible: boolean;
  comments:   string;
  votes:      VerifyEligibilityDecision[];
}

interface VerifyEligibilityDecision {
  userId:   Principal;
  decision: boolean;   // true = approve
}`,
                },
              ].map((m) => (
                <Card key={m.name} className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-mono text-slate-800">
                      {m.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CodeBlock code={m.code} lang="typescript" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ── Pages & Routes Tab ── */}
          <TabsContent value="routes">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Application Routes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">
                          Route
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">
                          Page
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">
                          APIs Used
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {
                          route: "/",
                          page: "Dashboard",
                          apis: "getTasks, getNotifications, getSortedTasksByDeadline",
                          desc: "Overview, stat cards, workflow pipeline, recent samples",
                        },
                        {
                          route: "/intake",
                          page: "Sample Intake",
                          apis: "createSample, getUser",
                          desc: "New sample intake form, multi-assignee selection",
                        },
                        {
                          route: "/eligibility",
                          page: "Eligibility Check",
                          apis: "submitEligibilityVote, getEligibilityVote, findEligibilityVote, getSample",
                          desc: "Acceptance + feasibility checklists, per-assignee approval",
                        },
                        {
                          route: "/registration",
                          page: "Sample Registration (RFA)",
                          apis: "createSample, loadClientById, addClient, getTestSpecIds, loadTestMaster",
                          desc: "38-field 3-tab RFA form, card-based sample details, client auto-fill",
                        },
                        {
                          route: "/test-spec",
                          page: "Test Specification",
                          apis: "getSample, createSample, getTestSpecIds, loadTestMaster",
                          desc: "Parameter config table, analyst assignment, SLA target",
                        },
                        {
                          route: "/analysis",
                          page: "Analysis / Result Entry",
                          apis: "getSample, createSample",
                          desc: "Result entry table, auto-verdict, SLA countdown, file upload",
                        },
                        {
                          route: "/sic-review",
                          page: "SIC Review",
                          apis: "getSample, createSample",
                          desc: "Analytical results table with checkboxes, SIC approval block",
                        },
                        {
                          route: "/qa-review",
                          page: "QA Review",
                          apis: "getSample, createSample",
                          desc: "QA approval, dual signature block, stakeholder log",
                        },
                        {
                          route: "/coa",
                          page: "Certificate of Analysis",
                          apis: "findCoa, getSample",
                          desc: "Full COA certificate preview, PDF export, document lineage",
                        },
                        {
                          route: "/my-tasks",
                          page: "My Tasks",
                          apis: "getAllTasks, completeTask, removeTask, getTasks, getSortedTasksByDeadline",
                          desc: "Role-based task queue with SLA countdowns",
                        },
                        {
                          route: "/notifications",
                          page: "Notifications",
                          apis: "getNotifications, markNotificationAsRead, sendNotification",
                          desc: "Notification center, unread badge count",
                        },
                        {
                          route: "/reports",
                          page: "Reports (7 sub-pages)",
                          apis: "getTasks, getAllTasks",
                          desc: "Customer-wise, registration-wise, TAT, COA, audit, pending approvals",
                        },
                        {
                          route: "/admin/users",
                          page: "Admin — Users",
                          apis: "createUser, getUser",
                          desc: "User CRUD, role management",
                        },
                        {
                          route: "/admin/clients",
                          page: "Admin — Client Master",
                          apis: "addClient, loadClientById, updateClient, deleteClient",
                          desc: "Client CRUD, auto-fill source for Registration",
                        },
                        {
                          route: "/test-masters",
                          page: "Test Masters",
                          apis: "addTestMaster, loadTestMaster, getTestSpecIds",
                          desc: "Test catalogue CRUD, dynamic parameter source",
                        },
                        {
                          route: "/api-docs",
                          page: "API Documentation",
                          apis: "(none — static docs)",
                          desc: "This page — full canister API reference",
                        },
                        {
                          route: "/calculator",
                          page: "Calculator",
                          apis: "(none — client-side only)",
                          desc: "Scientific/statistical/chemistry/pharma calculator",
                        },
                      ].map((r, i) => (
                        <tr
                          key={r.route}
                          className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}
                        >
                          <td className="px-4 py-3 font-mono text-blue-700 text-xs">
                            {r.route}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-800">
                            {r.page}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {r.apis.split(", ").map((a) => (
                                <code
                                  key={a}
                                  className="text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded"
                                >
                                  {a}
                                </code>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600 text-xs">
                            {r.desc}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Workflow Tab ── */}
          <TabsContent value="workflow">
            <div className="space-y-6">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <GitBranch className="w-5 h-5" /> Sample Lifecycle State
                    Machine
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-2 mb-8">
                    {[
                      {
                        stage: "Sample Intake",
                        status: "pending",
                        color: "bg-slate-100 text-slate-700 border-slate-300",
                        api: "createSample",
                      },
                      {
                        stage: "Eligibility Check",
                        status: "eligible / hold",
                        color: "bg-amber-100 text-amber-800 border-amber-300",
                        api: "submitEligibilityVote",
                      },
                      {
                        stage: "Registration",
                        status: "eligible",
                        color: "bg-blue-100 text-blue-800 border-blue-300",
                        api: "createSample (RFA)",
                      },
                      {
                        stage: "Test Spec",
                        status: "analysis",
                        color:
                          "bg-indigo-100 text-indigo-800 border-indigo-300",
                        api: "createSample",
                      },
                      {
                        stage: "Analysis",
                        status: "analysis",
                        color:
                          "bg-violet-100 text-violet-800 border-violet-300",
                        api: "createSample",
                      },
                      {
                        stage: "SIC Review",
                        status: "review",
                        color:
                          "bg-purple-100 text-purple-800 border-purple-300",
                        api: "createSample",
                      },
                      {
                        stage: "QA Review",
                        status: "review",
                        color:
                          "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300",
                        api: "createSample",
                      },
                      {
                        stage: "COA",
                        status: "completed",
                        color:
                          "bg-emerald-100 text-emerald-800 border-emerald-300",
                        api: "findCoa",
                      },
                    ].map((s, i, arr) => (
                      <div key={s.stage} className="flex items-center gap-2">
                        <div
                          className={`px-4 py-3 rounded-xl border-2 ${s.color} text-center min-w-[110px]`}
                        >
                          <div className="font-bold text-sm">{s.stage}</div>
                          <div className="text-xs opacity-70 mt-0.5">
                            status: {s.status}
                          </div>
                          <code className="text-xs opacity-80 block mt-1">
                            {s.api}
                          </code>
                        </div>
                        {i < arr.length - 1 && (
                          <span className="text-2xl text-slate-400 font-light">
                            →
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <Separator className="my-6" />
                  <h3 className="font-semibold text-slate-700 mb-4">
                    Status Transition Rules
                  </h3>
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold text-slate-600">
                            From Status
                          </th>
                          <th className="px-4 py-2 text-left font-semibold text-slate-600">
                            To Status
                          </th>
                          <th className="px-4 py-2 text-left font-semibold text-slate-600">
                            Trigger Action
                          </th>
                          <th className="px-4 py-2 text-left font-semibold text-slate-600">
                            API Called
                          </th>
                          <th className="px-4 py-2 text-left font-semibold text-slate-600">
                            Rule
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          {
                            from: "(new)",
                            to: "pending",
                            action: "Submit Sample Intake form",
                            api: "createSample",
                            rule: "Auto on submit",
                          },
                          {
                            from: "pending",
                            to: "eligible",
                            action: "All assignees Approve",
                            api: "submitEligibilityVote",
                            rule: "ALL votes = true",
                          },
                          {
                            from: "pending",
                            to: "hold(reason)",
                            action: "Any assignee clicks Hold",
                            api: "submitEligibilityVote",
                            rule: "ANY vote = false + Hold",
                          },
                          {
                            from: "pending",
                            to: "rejected",
                            action: "Any assignee clicks Reject",
                            api: "submitEligibilityVote",
                            rule: "ANY vote = false + Reject",
                          },
                          {
                            from: "eligible",
                            to: "analysis",
                            action: "Save Test Spec & Assign Analyst",
                            api: "createSample",
                            rule: "After spec saved",
                          },
                          {
                            from: "analysis",
                            to: "review",
                            action: "Analyst submits results",
                            api: "createSample",
                            rule: "All results entered",
                          },
                          {
                            from: "review",
                            to: "review",
                            action: "SIC submits review",
                            api: "createSample",
                            rule: "SIC decision saved",
                          },
                          {
                            from: "review",
                            to: "completed",
                            action: "QA Head approves",
                            api: "createSample + findCoa",
                            rule: "QA decision = true",
                          },
                          {
                            from: "review",
                            to: "hold",
                            action: "QA Head rejects",
                            api: "createSample",
                            rule: "QA decision = false",
                          },
                        ].map((r, i) => (
                          <tr
                            key={r.from + r.to}
                            className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}
                          >
                            <td className="px-4 py-2 font-mono text-xs text-slate-600">
                              {r.from}
                            </td>
                            <td className="px-4 py-2 font-mono text-xs text-emerald-700">
                              {r.to}
                            </td>
                            <td className="px-4 py-2 text-xs text-slate-700">
                              {r.action}
                            </td>
                            <td className="px-4 py-2 font-mono text-xs text-blue-700">
                              {r.api}
                            </td>
                            <td className="px-4 py-2 text-xs text-slate-500">
                              {r.rule}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── UI Components Tab ── */}
          <TabsContent value="components">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                {
                  name: "AppLayout",
                  path: "components/AppLayout.tsx",
                  desc: "Root layout wrapper. Renders AppSidebar (left) + TopHeader (top) + main content area with DKR watermark overlay on every page.",
                  props: "children: ReactNode",
                },
                {
                  name: "AppSidebar",
                  path: "components/AppSidebar.tsx",
                  desc: "Deep navy sidebar (rgb(11,54,77)) with DKR LIMS logo, role-aware nav items, badge counts for tasks/notifications, and color-coded active states.",
                  props: "currentRole: string",
                },
                {
                  name: "TopHeader",
                  path: "components/TopHeader.tsx",
                  desc: "White header with live-ticking System Uptime, Session Time, Login Time pills, user info dropdown, role-switcher, calculator shortcut icon, and logout button.",
                  props: "—",
                },
                {
                  name: "RoleSwitcher",
                  path: "components/RoleSwitcher.tsx",
                  desc: "Dropdown to simulate different user logins (Dr. Sarah Chen, Rajesh Malhotra, etc.) for demo/testing. Resets session timer on switch.",
                  props: "—",
                },
                {
                  name: "StatusBadge",
                  path: "components/StatusBadge.tsx",
                  desc: "Color-coded badge for SampleStatus variants. green=completed, amber=pending/review, red=hold/oos, blue=analysis.",
                  props: "status: SampleStatus",
                },
                {
                  name: "SLACountdown",
                  path: "components/SLACountdown.tsx",
                  desc: "Live countdown timer for task deadlines. Changes color: green (>50% time), amber (20-50%), red (<20%).",
                  props: "deadline: bigint (nanoseconds)",
                },
                {
                  name: "Calculator (FloatingPanel)",
                  path: "components/Calculator.tsx",
                  desc: "Compact quick-calculator popover accessible from the header icon. Contains scientific keypad + recent history. Links to full /calculator page.",
                  props: "—",
                },
                {
                  name: "Calculator (Full Page)",
                  path: "pages/Calculator.tsx",
                  desc: "Full-featured calculator with 6 tabs: Basic, Scientific, Statistical, Chemistry, Conversions, Pharma. Includes formula library and unit conversion tools.",
                  props: "—",
                },
                {
                  name: "COACertificate",
                  path: "components/COACertificate.tsx",
                  desc: "Print-ready COA certificate div with blue header, ISO badge, product grid, results table, dual cursive signatures. Save PDF captures only this div.",
                  props: "sample: Sample, coa: COAValue",
                },
                {
                  name: "SampleCard",
                  path: "components/SampleCard.tsx",
                  desc: "Collapsible card for Sample Details in Registration. Shows summary when collapsed, full 3-section form (Basic, Dates, Test Config) when expanded.",
                  props: "index: number, onDelete: () => void",
                },
                {
                  name: "DKRWatermark",
                  path: "components/DKRWatermark.tsx",
                  desc: "Full-page background watermark with DKR LIMS text and laboratory symbols (flask, DNA helix, molecule) at ~4% opacity. Rendered on every page.",
                  props: "—",
                },
              ].map((c) => (
                <Card key={c.name} className="shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm font-mono text-slate-800">
                        {c.name}
                      </CardTitle>
                      <code className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                        {c.path}
                      </code>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 mb-3">{c.desc}</p>
                    {c.props !== "—" && (
                      <div>
                        <span className="text-xs font-semibold text-slate-500">
                          Props:{" "}
                        </span>
                        <code className="text-xs text-purple-700">
                          {c.props}
                        </code>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ── Integration Guide Tab ── */}
          <TabsContent value="integration">
            <div className="space-y-6">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Terminal className="w-5 h-5" /> Setup & Actor
                    Initialization
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CodeBlock
                    code={`// 1. Import the actor hook (read-only, do not modify)
import { useActor } from "../hooks/useActor";

// 2. Use inside any component
const { actor, isFetching } = useActor();

// 3. Call QUERY endpoints via React Query
import { useQuery } from "@tanstack/react-query";

export function useGetSample(sampleId: string) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["sample", sampleId],
    queryFn: () => actor!.getSample(sampleId),
    enabled: !!actor && !isFetching && !!sampleId,
  });
}`}
                    lang="typescript"
                  />
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">
                    QUERY vs UPDATE — When to Use Each
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          QUERY
                        </span>
                        <span className="text-sm font-semibold text-emerald-800">
                          Read-only, fast (~100ms)
                        </span>
                      </div>
                      <ul className="text-sm text-emerald-700 space-y-1">
                        <li>✓ Does not modify canister state</li>
                        <li>✓ Free to call — no cycles cost per call</li>
                        <li>✓ Executes on a single replica</li>
                        <li>
                          ✓ Use for React Query <code>queryFn</code>
                        </li>
                      </ul>
                    </div>
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                          UPDATE
                        </span>
                        <span className="text-sm font-semibold text-blue-800">
                          State-changing, slower (~2s)
                        </span>
                      </div>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>✓ Persists to stable storage</li>
                        <li>✓ Goes through consensus (all replicas)</li>
                        <li>⚠ Costs cycles per call</li>
                        <li>✓ Use in mutation handlers / event callbacks</li>
                      </ul>
                    </div>
                  </div>
                  <CodeBlock
                    code={`// ✅ QUERY — in useQuery
const { data } = useQuery({
  queryKey: ["tasks"],
  queryFn: () => actor!.getTasks(),   // QUERY endpoint
  enabled: !!actor,
});

// ✅ UPDATE — in useMutation / event handler
const handleComplete = async (taskId: string) => {
  await actor!.completeTask(taskId);   // UPDATE endpoint
  queryClient.invalidateQueries({ queryKey: ["tasks"] });
};`}
                    lang="typescript"
                  />
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">
                    BigInt Timestamp Handling
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-4">
                    All timestamps in the LIMS backend are stored as
                    nanosecond-precision <code>bigint</code> values (IC time
                    format). Always convert before displaying or comparing with
                    JavaScript Date.
                  </p>
                  <CodeBlock
                    code={`// Convert IC nanosecond timestamp → JS Date
const toDate = (ns: bigint): Date =>
  new Date(Number(ns / 1_000_000n));

// Convert JS Date → IC nanosecond timestamp
const toNano = (date: Date): bigint =>
  BigInt(date.getTime()) * 1_000_000n;

// Usage
const issued = toDate(coa.issuedDateTime);
console.log(issued.toLocaleDateString("en-IN"));

// SLA countdown
const remaining = task.deadline - BigInt(Date.now()) * 1_000_000n;
const remainingMs = Number(remaining / 1_000_000n);
const hours = Math.floor(remainingMs / 3_600_000);`}
                    lang="typescript"
                  />
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">
                    End-to-End: Full Sample Workflow
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CodeBlock
                    code={`import { useActor } from "../hooks/useActor";
import { UserRole, Variant_active_inactive } from "../backend";

// Step 1: Create User
await actor.createUser("Dr. Sarah Chen", UserRole.qa);

// Step 2: Create Sample (Intake)
const sampleId = await actor.createSample({
  sampleId: "",
  clientName: "PharmaCo Ltd",
  sampleName: "API Batch 2024-A",
  testName: "HPLC Assay",
  sampleStatus: { __kind__: "pending", pending: null },
  dateReceived: BigInt(Date.now()) * 1_000_000n,
  registrationId: 0n,
  rfa: { sampleDetails: 0n, registration: 0n, billing: 0n },
  testSpecs: [],
  analysisResults: []
});
console.log("Sample created:", sampleId);  // "SI-2026-042"

// Step 3: Submit Eligibility Vote (all assignees approve)
const vote = await actor.submitEligibilityVote(
  sampleId,
  true,
  "All checks passed",
  [
    { userId: principal1, decision: true },
    { userId: principal2, decision: true }
  ]
);
console.log("Eligible:", vote.isEligible);  // true

// Step 4: Add Test Master
const tmId = await actor.addTestMaster({
  testName: "HPLC Assay",
  testType: "Chemical",
  daysRequired: 3n,
  status: Variant_active_inactive.active,
  parameters: [
    { name: "Assay", unit: "%", minValue: 98n, maxValue: 102n, acceptanceCriteria: "98-102%" }
  ]
});

// Step 5: Retrieve COA after QA approval
const coa = await actor.findCoa(sampleId);
const issued = new Date(Number(coa.issuedDateTime / 1_000_000n));
console.log("COA issued:", issued.toLocaleDateString("en-IN"));

// Step 6: Send notification
await actor.sendNotification(
  "user-sarah",
  \`COA issued for sample \${sampleId}\`
);

// Step 7: Complete the task
const tasks = await actor.getTasks();
const coaTask = tasks.find(([, t]) => t.sampleId === sampleId);
if (coaTask) await actor.completeTask(coaTask[0]);`}
                    lang="typescript"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Overview Tab ── */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-5">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">
                      About the DKR LIMS API
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-slate-600 space-y-3 leading-relaxed">
                    <p>
                      The DKR LIMS backend is a Motoko canister deployed on the{" "}
                      <strong>Internet Computer</strong>. All API calls are made
                      through the IC actor interface and communicate directly
                      with the canister via the IC HTTP gateway.
                    </p>
                    <p>
                      The API exposes <strong>{stats.query} QUERY</strong>{" "}
                      endpoints (read-only, fast, ~100ms) and{" "}
                      <strong>{stats.update} UPDATE</strong> endpoints
                      (state-changing, ~2s, requires consensus).
                    </p>
                    <p>
                      Authentication is simulated via a role-switcher dropdown
                      (no real Internet Identity in demo mode). In production,
                      the caller's IC principal is used to identify the current
                      user via <code>getUser()</code>.
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Conventions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 text-sm">
                      {[
                        {
                          title: "Timestamps",
                          body: "All time values are stored as nanosecond-precision bigint (IC Time.now() format). Divide by 1_000_000n to get milliseconds for JavaScript Date.",
                        },
                        {
                          title: "QUERY vs UPDATE",
                          body: "Use QUERY endpoints in React Query queryFn for fast reads. Reserve UPDATE calls for event handlers and mutations. UPDATE endpoints cost more cycles and are slower.",
                        },
                        {
                          title: "Stable Storage",
                          body: "All data is persisted in stable variables that survive canister upgrades. HashMap<Text, T> is the primary storage structure.",
                        },
                        {
                          title: "Auto-increment IDs",
                          body: "ClientID and TestMasterID are Nat counters incremented atomically on each insert. SampleIDs are text strings with SI-YYYY-NNN format.",
                        },
                        {
                          title: "Error Handling",
                          body: "Most endpoints trap (panic) on invalid input. Wrap all actor calls in try/catch. The updateSample endpoint is intentionally NOT IMPLEMENTED and will always trap.",
                        },
                      ].map((c) => (
                        <div key={c.title}>
                          <h4 className="font-semibold text-slate-800 mb-1">
                            {c.title}
                          </h4>
                          <p className="text-slate-600">{c.body}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-5">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        {
                          label: "Total Endpoints",
                          value: stats.total,
                          color: "text-slate-800",
                        },
                        {
                          label: "QUERY Endpoints",
                          value: stats.query,
                          color: "text-emerald-700",
                        },
                        {
                          label: "UPDATE Endpoints",
                          value: stats.update,
                          color: "text-blue-700",
                        },
                        {
                          label: "Not Implemented",
                          value: 1,
                          color: "text-amber-700",
                        },
                        {
                          label: "API Categories",
                          value: CATEGORIES.length,
                          color: "text-slate-800",
                        },
                        {
                          label: "Data Models",
                          value: 16,
                          color: "text-slate-800",
                        },
                        {
                          label: "App Routes",
                          value: 17,
                          color: "text-slate-800",
                        },
                      ].map((s) => (
                        <div
                          key={s.label}
                          className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                        >
                          <span className="text-sm text-slate-600">
                            {s.label}
                          </span>
                          <span className={`text-lg font-bold ${s.color}`}>
                            {s.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Method Legend</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <MethodBadge method="QUERY" />
                      <span className="text-sm text-slate-600">
                        Read-only, fast (~100ms), no state change
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MethodBadge method="UPDATE" />
                      <span className="text-sm text-slate-600">
                        State-changing, ~2s, persists to stable storage
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        NOT IMPL
                      </span>
                      <span className="text-sm text-slate-600">
                        Method exists but will trap — do not call
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-blue-200 bg-blue-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-blue-800">
                      <Zap className="w-4 h-4" /> Canister Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-blue-700 space-y-2">
                    <div>
                      <span className="font-semibold">Runtime:</span> Motoko on
                      Internet Computer
                    </div>
                    <div>
                      <span className="font-semibold">Storage:</span> Stable
                      HashMap (upgrade-safe)
                    </div>
                    <div>
                      <span className="font-semibold">Auth:</span> IC Principal
                      (role-switcher in demo)
                    </div>
                    <div>
                      <span className="font-semibold">Frontend:</span> React 19
                      + TypeScript + Tailwind
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
