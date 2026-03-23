import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Building2,
  Pencil,
  Plus,
  Settings,
  ShieldAlert,
  TestTube,
  Trash2,
  Users,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { useRole } from "../contexts/RoleContext";
import { useActor } from "../hooks/useActor";
import {
  AUDIT_LOG,
  CLIENTS,
  type Client,
  DUMMY_USERS,
  type DummyUser,
  TEST_SAMPLES,
  type TestParameter,
  type TestSample,
} from "../lib/mockData";

// ── User Management ────────────────────────────────────────────
function UserManagement() {
  const [users, setUsers] = useState<DummyUser[]>([...DUMMY_USERS]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DummyUser | null>(null);
  const [form, setForm] = useState({
    name: "",
    role: "analyst" as DummyUser["role"],
    designation: "",
    email: "",
    section: "",
  });

  const roleLabels: Record<string, string> = {
    admin: "Admin",
    qa: "QA Director",
    sectionInCharge: "Section In-Charge",
    analyst: "Analyst",
  };
  const roleColors: Record<string, string> = {
    admin: "bg-purple-100 text-purple-700",
    qa: "bg-blue-100 text-blue-700",
    sectionInCharge: "bg-amber-100 text-amber-700",
    analyst: "bg-emerald-100 text-emerald-700",
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      role: "analyst",
      designation: "",
      email: "",
      section: "",
    });
    setOpen(true);
  };
  const openEdit = (u: DummyUser) => {
    setEditing(u);
    setForm({
      name: u.name,
      role: u.role,
      designation: u.designation,
      email: u.email,
      section: u.section || "",
    });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    if (editing) {
      const idx = users.findIndex((u) => u.id === editing.id);
      if (idx !== -1) {
        const updated = [...users];
        updated[idx] = { ...editing, ...form };
        setUsers(updated);
        DUMMY_USERS[idx] = { ...DUMMY_USERS[idx], ...form };
      }
      toast.success("User updated");
    } else {
      const newUser: DummyUser = {
        id: `user-${Date.now()}`,
        ...form,
        isActive: true,
      };
      setUsers((prev) => [...prev, newUser]);
      DUMMY_USERS.push(newUser);
      toast.success("User created");
    }
    setOpen(false);
  };

  const toggleActive = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, isActive: !u.isActive } : u)),
    );
    const idx = DUMMY_USERS.findIndex((u) => u.id === id);
    if (idx !== -1)
      DUMMY_USERS[idx] = {
        ...DUMMY_USERS[idx],
        isActive: !DUMMY_USERS[idx].isActive,
      };
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Create User
        </Button>
      </div>
      <div className="table-scroll">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {[
                "Name",
                "Role",
                "Designation",
                "Email",
                "Section",
                "Active",
                "Actions",
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
            {users.map((u, i) => (
              <tr
                key={u.id}
                className={`border-b border-border/50 hover:bg-muted/20 ${i % 2 === 0 ? "" : "bg-muted/10"}`}
              >
                <td className="py-2.5 px-3 font-medium">{u.name}</td>
                <td className="py-2.5 px-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[u.role]}`}
                  >
                    {roleLabels[u.role]}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-xs text-muted-foreground">
                  {u.designation}
                </td>
                <td className="py-2.5 px-3 text-xs text-muted-foreground">
                  {u.email}
                </td>
                <td className="py-2.5 px-3 text-xs text-muted-foreground">
                  {u.section || "—"}
                </td>
                <td className="py-2.5 px-3">
                  <Switch
                    checked={u.isActive}
                    onCheckedChange={() => toggleActive(u.id)}
                  />
                </td>
                <td className="py-2.5 px-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => openEdit(u)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit User" : "Create User"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {[
              { key: "name", label: "Full Name", required: true },
              { key: "email", label: "Email", required: true },
              { key: "designation", label: "Designation" },
              { key: "section", label: "Section" },
            ].map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label className="text-xs font-medium">
                  {f.label}
                  {f.required && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </Label>
                <Input
                  value={(form as Record<string, string>)[f.key]}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, [f.key]: e.target.value }))
                  }
                  placeholder={f.label}
                />
              </div>
            ))}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Role</Label>
              <Select
                value={form.role}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, role: v as DummyUser["role"] }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roleLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editing ? "Save Changes" : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Client Master ──────────────────────────────────────────────
function ClientMaster() {
  const { actor } = useActor();
  const [clients, setClients] = useState<Client[]>([...CLIENTS]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    pinCode: "",
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      pinCode: "",
    });
    setOpen(true);
  };
  const openEdit = (c: Client) => {
    setEditing(c);
    setForm({
      name: c.name,
      contactPerson: c.contactPerson,
      email: c.email,
      phone: c.phone,
      address: c.address,
      city: c.city,
      pinCode: c.pinCode,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Client name is required");
      return;
    }
    const backendClient = {
      name: form.name,
      contactPerson: form.contactPerson,
      email: form.email,
      phone: form.phone,
      address: form.address,
      city: form.city,
      pinCode: form.pinCode,
    };
    if (editing) {
      setClients((prev) =>
        prev.map((c) => (c.id === editing.id ? { ...editing, ...form } : c)),
      );
      if (actor) {
        try {
          await actor.updateClient(BigInt(0), backendClient);
        } catch (e) {
          console.warn("updateClient failed:", e);
        }
      }
      toast.success("Client updated");
    } else {
      const newClient: Client = { id: `cli-${Date.now()}`, ...form };
      setClients((prev) => [...prev, newClient]);
      CLIENTS.push(newClient);
      if (actor) {
        try {
          await actor.addClient(backendClient);
        } catch (e) {
          console.warn("addClient failed:", e);
        }
      }
      toast.success("Client created");
    }
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
    toast.success("Client deleted");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </div>
      <div className="table-scroll">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {[
                "Client Name",
                "Contact Person",
                "Email",
                "Phone",
                "City",
                "PIN",
                "Actions",
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
            {clients.map((c, i) => (
              <tr
                key={c.id}
                className={`border-b border-border/50 hover:bg-muted/20 ${i % 2 === 0 ? "" : "bg-muted/10"}`}
              >
                <td className="py-2.5 px-3 font-medium">{c.name}</td>
                <td className="py-2.5 px-3 text-xs">{c.contactPerson}</td>
                <td className="py-2.5 px-3 text-xs text-muted-foreground">
                  {c.email}
                </td>
                <td className="py-2.5 px-3 text-xs text-muted-foreground">
                  {c.phone}
                </td>
                <td className="py-2.5 px-3 text-xs text-muted-foreground">
                  {c.city}
                </td>
                <td className="py-2.5 px-3 text-xs text-muted-foreground">
                  {c.pinCode}
                </td>
                <td className="py-2.5 px-3 flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => openEdit(c)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(c.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Client" : "Add Client"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            {[
              { key: "name", label: "Client Name", required: true, span: true },
              { key: "contactPerson", label: "Contact Person" },
              { key: "email", label: "Email" },
              { key: "phone", label: "Phone" },
              { key: "address", label: "Address", span: true },
              { key: "city", label: "City" },
              { key: "pinCode", label: "PIN Code" },
            ].map((f) => (
              <div
                key={f.key}
                className={`space-y-1.5 ${f.span ? "col-span-2" : ""}`}
              >
                <Label className="text-xs font-medium">
                  {f.label}
                  {f.required && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </Label>
                <Input
                  value={(form as Record<string, string>)[f.key]}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, [f.key]: e.target.value }))
                  }
                  placeholder={f.label}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editing ? "Save Changes" : "Add Client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Test Names Master ──────────────────────────────────────────
function TestNamesMaster() {
  const { actor } = useActor();
  const [tests, setTests] = useState<TestSample[]>([...TEST_SAMPLES]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TestSample | null>(null);
  const [form, setForm] = useState({
    testName: "",
    testType: "",
    noOfDays: 1,
    status: "active" as "active" | "inactive",
  });
  const [params, setParams] = useState<TestParameter[]>([]);

  const TEST_TYPES = ["Chemical", "Microbiological", "Physical", "Biological"];

  const openCreate = () => {
    setEditing(null);
    setForm({ testName: "", testType: "", noOfDays: 1, status: "active" });
    setParams([
      { id: `p-new-${Date.now()}`, name: "", unit: "", acceptanceCriteria: "" },
    ]);
    setOpen(true);
  };

  const openEdit = (t: TestSample) => {
    setEditing(t);
    setForm({
      testName: t.testName,
      testType: t.testType,
      noOfDays: t.noOfDays,
      status: t.status,
    });
    setParams([...t.parameters]);
    setOpen(true);
  };

  const addParam = () =>
    setParams((prev) => [
      ...prev,
      { id: `p-new-${Date.now()}`, name: "", unit: "", acceptanceCriteria: "" },
    ]);
  const removeParam = (id: string) =>
    setParams((prev) => prev.filter((p) => p.id !== id));
  const updateParam = (id: string, key: keyof TestParameter, value: string) =>
    setParams((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [key]: value } : p)),
    );

  const handleSave = async () => {
    if (!form.testName.trim()) {
      toast.error("Test name is required");
      return;
    }
    if (editing) {
      setTests((prev) =>
        prev.map((t) =>
          t.id === editing.id ? { ...editing, ...form, parameters: params } : t,
        ),
      );
      toast.success("Test updated");
    } else {
      const newTest: TestSample = {
        id: `ts-${Date.now()}`,
        ...form,
        parameters: params,
      };
      setTests((prev) => [...prev, newTest]);
      TEST_SAMPLES.push(newTest);
      if (actor) {
        try {
          const backendTM = {
            testName: form.testName,
            testType: form.testType,
            status: "active" as never,
            daysRequired: BigInt(14),
            parameters: params.map((p) => ({
              name: p.name,
              unit: p.unit,
              acceptanceCriteria: p.acceptanceCriteria,
              minValue: BigInt(0),
              maxValue: BigInt(100),
            })),
          };
          await actor.addTestMaster(backendTM);
        } catch (e) {
          console.warn("addTestMaster failed:", e);
        }
      }
      toast.success("Test created");
    }
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    setTests((prev) => prev.filter((t) => t.id !== id));
    toast.success("Test deleted");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Test
        </Button>
      </div>
      <div className="table-scroll">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {[
                "Test Name",
                "Test Type",
                "Parameters",
                "Days",
                "Status",
                "Actions",
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
            {tests.map((t, i) => (
              <tr
                key={t.id}
                className={`border-b border-border/50 hover:bg-muted/20 ${i % 2 === 0 ? "" : "bg-muted/10"}`}
              >
                <td className="py-2.5 px-3 font-medium">{t.testName}</td>
                <td className="py-2.5 px-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {t.testType}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex flex-wrap gap-1">
                    {t.parameters.slice(0, 3).map((p) => (
                      <span
                        key={p.id}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border"
                      >
                        {p.name}
                      </span>
                    ))}
                    {t.parameters.length > 3 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{t.parameters.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-2.5 px-3 text-xs text-muted-foreground">
                  {t.noOfDays}d
                </td>
                <td className="py-2.5 px-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium border ${t.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-600 border-gray-200"}`}
                  >
                    {t.status}
                  </span>
                </td>
                <td className="py-2.5 px-3 flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => openEdit(t)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(t.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Test" : "Add Test"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Test Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={form.testName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, testName: e.target.value }))
                  }
                  placeholder="e.g. HPLC Assay"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Test Type</Label>
                <Select
                  value={form.testType}
                  onValueChange={(v) => setForm((p) => ({ ...p, testType: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEST_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">No. of Days</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.noOfDays}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      noOfDays: Number.parseInt(e.target.value) || 1,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm((p) => ({
                      ...p,
                      status: v as "active" | "inactive",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-medium">Test Parameters</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addParam}
                  className="gap-1 text-xs h-7"
                >
                  <Plus className="h-3 w-3" />
                  Add Parameter
                </Button>
              </div>
              <div className="space-y-2">
                {params.map((p) => (
                  <div
                    key={p.id}
                    className="grid grid-cols-3 gap-2 items-center p-2 rounded-lg border border-border bg-muted/20"
                  >
                    <Input
                      value={p.name}
                      onChange={(e) =>
                        updateParam(p.id, "name", e.target.value)
                      }
                      placeholder="Parameter name"
                      className="h-7 text-xs"
                    />
                    <Input
                      value={p.unit}
                      onChange={(e) =>
                        updateParam(p.id, "unit", e.target.value)
                      }
                      placeholder="Unit"
                      className="h-7 text-xs"
                    />
                    <div className="flex gap-1">
                      <Input
                        value={p.acceptanceCriteria}
                        onChange={(e) =>
                          updateParam(
                            p.id,
                            "acceptanceCriteria",
                            e.target.value,
                          )
                        }
                        placeholder="Acceptance criteria"
                        className="h-7 text-xs flex-1"
                      />
                      {params.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive shrink-0"
                          onClick={() => removeParam(p.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editing ? "Save Changes" : "Add Test"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Audit Trail (Admin) ────────────────────────────────────────
function AdminAuditTrail() {
  const recent = [...AUDIT_LOG]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, 50);

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
          {recent.map((entry, i) => (
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
  );
}

// ── Main Admin Panel ───────────────────────────────────────────
export function AdminPanel() {
  const { activeUser } = useRole();

  if (activeUser.role !== "admin") {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <ShieldAlert className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Access Restricted
          </h2>
          <p className="text-muted-foreground">
            The Admin Panel is only accessible to users with the Admin role.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Switch to the Admin User using the role switcher in the sidebar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Admin Panel
          </h1>
          <p className="page-subtitle">
            Manage users, clients, test masters, and audit trail
          </p>
        </div>
      </div>

      <Tabs defaultValue="users">
        <TabsList className="grid grid-cols-4 w-full max-w-xl mb-6">
          <TabsTrigger value="users" className="gap-1.5 text-xs">
            <Users className="h-3.5 w-3.5" />
            Users
          </TabsTrigger>
          <TabsTrigger value="clients" className="gap-1.5 text-xs">
            <Building2 className="h-3.5 w-3.5" />
            Clients
          </TabsTrigger>
          <TabsTrigger value="tests" className="gap-1.5 text-xs">
            <TestTube className="h-3.5 w-3.5" />
            Test Names
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5 text-xs">
            <BookOpen className="h-3.5 w-3.5" />
            Audit Trail
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="lims-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UserManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients">
          <Card className="lims-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Client Master
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ClientMaster />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests">
          <Card className="lims-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TestTube className="h-4 w-4 text-primary" />
                Test Names Master
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TestNamesMaster />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card className="lims-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AdminAuditTrail />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
