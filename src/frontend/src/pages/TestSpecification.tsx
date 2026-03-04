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
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Info, Save, TestTube } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "../components/StatusBadge";
import { useRole } from "../contexts/RoleContext";
import {
  AUDIT_LOG,
  DUMMY_USERS,
  SAMPLE_INTAKES,
  TEST_SPECS,
  type TestSpecRow,
  getSampleById,
} from "../lib/mockData";

interface TestSpecificationProps {
  sampleId?: string;
}

const DEFAULT_PARAMS = [
  { parameter: "Assay (% w/w)", acceptanceCriteria: "98.0% - 102.0%" },
  { parameter: "Related Substances", acceptanceCriteria: "NMT 0.5%" },
  { parameter: "Water Content", acceptanceCriteria: "NMT 1.0%" },
  { parameter: "Total Aerobic Count", acceptanceCriteria: "NMT 1000 CFU/g" },
];

export function TestSpecification({
  sampleId: propSampleId,
}: TestSpecificationProps) {
  const navigate = useNavigate();
  const { activeUser } = useRole();

  const [selectedSampleId, setSelectedSampleId] = useState(propSampleId || "");
  const sample = selectedSampleId ? getSampleById(selectedSampleId) : null;
  const analysts = DUMMY_USERS.filter((u) => u.role === "analyst");
  const testSpecSamples = SAMPLE_INTAKES.filter((s) => s.status === "TestSpec");

  const existingSpecs = TEST_SPECS[selectedSampleId];
  const [rows, setRows] = useState<TestSpecRow[]>(
    existingSpecs ||
      DEFAULT_PARAMS.map((p, i) => ({
        id: `ts-new-${i}`,
        parameter: p.parameter,
        acceptanceCriteria: p.acceptanceCriteria,
        methodSop: "",
        referenceStandard: "",
        qaNotes: "",
        assignedAnalyst: "",
        targetSla: "",
      })),
  );
  const [submitting, setSubmitting] = useState(false);

  const updateRow = (idx: number, key: keyof TestSpecRow, value: string) => {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [key]: value } : r)),
    );
  };

  const handleSave = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    TEST_SPECS[selectedSampleId] = rows;
    const idx = SAMPLE_INTAKES.findIndex(
      (s) => s.sampleId === selectedSampleId,
    );
    if (idx !== -1)
      SAMPLE_INTAKES[idx] = { ...SAMPLE_INTAKES[idx], status: "Analysis" };
    AUDIT_LOG.push({
      id: `al-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: activeUser.id,
      userName: activeUser.name,
      action: "CREATE",
      entity: "TestSpecification",
      entityId: selectedSampleId,
      details: `Test specifications assigned for ${rows.length} parameters`,
    });
    setSubmitting(false);
    toast.success("Test specifications saved", {
      description: "Sample advanced to Analysis stage",
    });
    navigate({
      to: "/analysis/$sampleId",
      params: { sampleId: selectedSampleId },
    });
  };

  if (!sample) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="page-header">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate({ to: "/" })}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="page-title flex items-center gap-2">
                <TestTube className="h-5 w-5 text-primary" />
                Test Specification
              </h1>
              <p className="page-subtitle">
                Assign analysts and set test parameters
              </p>
            </div>
          </div>
        </div>
        <Card className="lims-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Select Sample
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testSpecSamples.length === 0 ? (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <Info className="h-4 w-4" />
                <span className="text-sm">
                  No samples pending test specification
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {testSpecSamples.map((s) => (
                  <button
                    type="button"
                    key={s.sampleId}
                    onClick={() => setSelectedSampleId(s.sampleId)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-primary font-medium">
                        {s.sampleId}
                      </span>
                      <span className="text-sm font-medium">
                        {s.sampleName}
                      </span>
                    </div>
                    <StatusBadge status={s.status} />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: "/" })}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="page-title flex items-center gap-2">
              <TestTube className="h-5 w-5 text-primary" />
              Test Specification
            </h1>
            <p className="page-subtitle">
              {sample.sampleId} — {sample.sampleName}
            </p>
          </div>
        </div>
        <StatusBadge status={sample.status} />
      </div>

      <Card className="lims-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            Parameter Assignment Table
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="table-scroll">
            <table className="w-full text-xs min-w-[900px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {[
                    "Parameter",
                    "Acceptance Criteria",
                    "Method / SOP",
                    "Reference Standard",
                    "QA Notes",
                    "Assigned Analyst",
                    "Target SLA",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left py-2.5 px-3 font-semibold text-muted-foreground whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={`border-b border-border/50 ${idx % 2 === 0 ? "" : "bg-muted/10"}`}
                  >
                    <td className="py-2 px-3 font-medium text-foreground whitespace-nowrap">
                      {row.parameter}
                    </td>
                    <td className="py-2 px-3">
                      <Input
                        value={row.acceptanceCriteria}
                        onChange={(e) =>
                          updateRow(idx, "acceptanceCriteria", e.target.value)
                        }
                        className="h-7 text-xs min-w-[140px]"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <Input
                        value={row.methodSop}
                        onChange={(e) =>
                          updateRow(idx, "methodSop", e.target.value)
                        }
                        className="h-7 text-xs min-w-[120px]"
                        placeholder="SOP-XXX-001"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <Input
                        value={row.referenceStandard}
                        onChange={(e) =>
                          updateRow(idx, "referenceStandard", e.target.value)
                        }
                        className="h-7 text-xs min-w-[120px]"
                        placeholder="USP RS..."
                      />
                    </td>
                    <td className="py-2 px-3">
                      <Input
                        value={row.qaNotes}
                        onChange={(e) =>
                          updateRow(idx, "qaNotes", e.target.value)
                        }
                        className="h-7 text-xs min-w-[120px]"
                        placeholder="Notes..."
                      />
                    </td>
                    <td className="py-2 px-3">
                      <Select
                        value={row.assignedAnalyst}
                        onValueChange={(v) =>
                          updateRow(idx, "assignedAnalyst", v)
                        }
                      >
                        <SelectTrigger className="h-7 text-xs min-w-[140px]">
                          <SelectValue placeholder="Select analyst" />
                        </SelectTrigger>
                        <SelectContent>
                          {analysts.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-2 px-3">
                      <Input
                        type="date"
                        value={row.targetSla}
                        onChange={(e) =>
                          updateRow(idx, "targetSla", e.target.value)
                        }
                        className="h-7 text-xs min-w-[120px]"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end mt-6">
        <Button onClick={handleSave} disabled={submitting} className="gap-2">
          {submitting ? (
            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save & Assign to Analysis
        </Button>
      </div>
    </div>
  );
}
