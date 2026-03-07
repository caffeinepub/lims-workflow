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
import { Pencil, Plus, TestTube, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import {
  TEST_SAMPLES,
  type TestParameter,
  type TestSample,
} from "../lib/mockData";

const TEST_TYPES = ["Chemical", "Microbiological", "Physical", "Biological"];

export function TestMasters() {
  const [tests, setTests] = useState<TestSample[]>([...TEST_SAMPLES]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TestSample | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    testName: "",
    testType: "",
    noOfDays: 1,
    status: "active" as "active" | "inactive",
  });
  const [params, setParams] = useState<TestParameter[]>([]);

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

  const handleSave = () => {
    if (!form.testName.trim()) {
      toast.error("Test name is required");
      return;
    }
    if (!form.testType) {
      toast.error("Test type is required");
      return;
    }
    if (editing) {
      const updated = { ...editing, ...form, parameters: params };
      setTests((prev) => prev.map((t) => (t.id === editing.id ? updated : t)));
      // Update global TEST_SAMPLES reference
      const gi = TEST_SAMPLES.findIndex((t) => t.id === editing.id);
      if (gi !== -1) TEST_SAMPLES[gi] = updated;
      toast.success("Test updated");
    } else {
      const newTest: TestSample = {
        id: `ts-${Date.now()}`,
        ...form,
        parameters: params,
      };
      setTests((prev) => [...prev, newTest]);
      TEST_SAMPLES.push(newTest);
      toast.success("Test created");
    }
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    setTests((prev) => prev.filter((t) => t.id !== id));
    const gi = TEST_SAMPLES.findIndex((t) => t.id === id);
    if (gi !== -1) TEST_SAMPLES.splice(gi, 1);
    toast.success("Test deleted");
  };

  const typeColors: Record<string, string> = {
    Chemical: "bg-blue-100 text-blue-700 border-blue-200",
    Microbiological: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Physical: "bg-violet-100 text-violet-700 border-violet-200",
    Biological: "bg-amber-100 text-amber-700 border-amber-200",
  };

  return (
    <div
      className="p-6 max-w-6xl mx-auto space-y-5"
      data-ocid="test_masters.page"
    >
      {/* Page header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)",
            }}
          >
            <TestTube className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="page-title">Test Masters</h1>
            <p className="page-subtitle">
              Manage test types and their associated parameters
            </p>
          </div>
        </div>
        <Button
          onClick={openCreate}
          className="gap-2"
          data-ocid="test_masters.add_test.button"
        >
          <Plus className="h-4 w-4" />
          Add Test
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {TEST_TYPES.map((type) => {
          const count = tests.filter(
            (t) => t.testType === type && t.status === "active",
          ).length;
          return (
            <Card key={type} className="lims-card">
              <CardContent className="p-4 flex items-center gap-3">
                <div
                  className={`text-xs font-semibold px-2 py-1 rounded-full border ${typeColors[type] || "bg-gray-100 text-gray-600 border-gray-200"}`}
                >
                  {type}
                </div>
                <span className="text-lg font-bold text-foreground">
                  {count}
                </span>
                <span className="text-xs text-muted-foreground">active</span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main table */}
      <Card className="lims-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TestTube className="h-4 w-4 text-primary" />
            Test Configuration Table
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="table-scroll">
            <table className="w-full text-sm" data-ocid="test_masters.table">
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
                      className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tests.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-10 text-center text-sm text-muted-foreground"
                      data-ocid="test_masters.table.empty_state"
                    >
                      No tests configured. Click "Add Test" to get started.
                    </td>
                  </tr>
                )}
                {tests.map((t, i) => (
                  <React.Fragment key={t.id}>
                    <tr
                      className={`border-b border-border/50 hover:bg-muted/20 cursor-pointer ${i % 2 === 0 ? "" : "bg-muted/10"}`}
                      onClick={() =>
                        setExpandedId((prev) => (prev === t.id ? null : t.id))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          setExpandedId((prev) =>
                            prev === t.id ? null : t.id,
                          );
                      }}
                      tabIndex={0}
                      data-ocid={`test_masters.table.row.${i + 1}`}
                    >
                      <td className="py-3 px-4 font-medium">{t.testName}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium border ${typeColors[t.testType] || "bg-gray-100 text-gray-600 border-gray-200"}`}
                        >
                          {t.testType}
                        </span>
                      </td>
                      <td className="py-3 px-4">
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
                              +{t.parameters.length - 3} more
                            </span>
                          )}
                          {t.parameters.length === 0 && (
                            <span className="text-[10px] text-muted-foreground italic">
                              No params
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {t.noOfDays}d
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                            t.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-gray-50 text-gray-600 border-gray-200"
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(t);
                            }}
                            data-ocid={`test_masters.edit_button.${i + 1}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(t.id);
                            }}
                            data-ocid={`test_masters.delete_button.${i + 1}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded parameters row */}
                    {expandedId === t.id && t.parameters.length > 0 && (
                      <tr className="bg-muted/20">
                        <td colSpan={6} className="px-6 py-3">
                          <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                            Parameters for {t.testName}
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs border border-border rounded-lg overflow-hidden">
                              <thead>
                                <tr className="bg-muted/40 border-b border-border">
                                  <th className="text-left py-2 px-3 font-semibold text-muted-foreground">
                                    Parameter
                                  </th>
                                  <th className="text-left py-2 px-3 font-semibold text-muted-foreground">
                                    Unit
                                  </th>
                                  <th className="text-left py-2 px-3 font-semibold text-muted-foreground">
                                    Acceptance Criteria
                                  </th>
                                  <th className="text-left py-2 px-3 font-semibold text-muted-foreground">
                                    Operator
                                  </th>
                                  <th className="text-left py-2 px-3 font-semibold text-muted-foreground">
                                    Min
                                  </th>
                                  <th className="text-left py-2 px-3 font-semibold text-muted-foreground">
                                    Max
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {t.parameters.map((p, pi) => (
                                  <tr
                                    key={p.id}
                                    className={`border-b border-border/40 ${pi % 2 === 0 ? "" : "bg-muted/10"}`}
                                  >
                                    <td className="py-2 px-3 font-medium">
                                      {p.name}
                                    </td>
                                    <td className="py-2 px-3 text-muted-foreground">
                                      {p.unit || "—"}
                                    </td>
                                    <td className="py-2 px-3">
                                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-medium">
                                        {p.acceptanceCriteria}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 text-muted-foreground">
                                      {p.operator || "—"}
                                    </td>
                                    <td className="py-2 px-3 text-muted-foreground">
                                      {p.minValue !== undefined
                                        ? p.minValue
                                        : "—"}
                                    </td>
                                    <td className="py-2 px-3 text-muted-foreground">
                                      {p.maxValue !== undefined
                                        ? p.maxValue
                                        : "—"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-2xl max-h-[85vh] overflow-y-auto"
          data-ocid="test_masters.dialog"
        >
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Test" : "Add New Test"}</DialogTitle>
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
                  data-ocid="test_masters.test_name.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Test Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.testType}
                  onValueChange={(v) => setForm((p) => ({ ...p, testType: v }))}
                >
                  <SelectTrigger data-ocid="test_masters.test_type.select">
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
                  data-ocid="test_masters.no_of_days.input"
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
                  <SelectTrigger data-ocid="test_masters.status.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Parameters section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Test Parameters
                </Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addParam}
                  className="gap-1 text-xs h-7"
                  data-ocid="test_masters.add_param.button"
                >
                  <Plus className="h-3 w-3" />
                  Add Parameter
                </Button>
              </div>
              <div className="space-y-2">
                {params.map((p, pi) => (
                  <div
                    key={p.id}
                    className="grid grid-cols-3 gap-2 items-center p-2.5 rounded-lg border border-border bg-muted/20"
                    data-ocid={`test_masters.param.${pi + 1}`}
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
                      placeholder="Unit (e.g. %, ppm)"
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
                          data-ocid={`test_masters.remove_param.${pi + 1}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {params.length === 0 && (
                  <p className="text-xs text-muted-foreground italic py-2">
                    No parameters yet. Click "Add Parameter" to add one.
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              data-ocid="test_masters.dialog.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              data-ocid="test_masters.dialog.save_button"
            >
              {editing ? "Save Changes" : "Create Test"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
