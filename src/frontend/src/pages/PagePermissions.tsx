import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Info, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Role = "admin" | "qa" | "sectionInCharge" | "analyst";

const ALL_PAGES = [
  { id: "dashboard", label: "Dashboard", path: "/" },
  { id: "sample-intake", label: "Sample Intake", path: "/sample-intake" },
  {
    id: "eligibility-check",
    label: "Eligibility Check",
    path: "/eligibility-check",
  },
  { id: "registration", label: "Registration", path: "/registration" },
  {
    id: "test-specification",
    label: "Test Specification",
    path: "/test-specification",
  },
  { id: "analysis", label: "Analysis", path: "/analysis" },
  { id: "sic-review", label: "SIC Review", path: "/sic-review" },
  { id: "qa-review", label: "QA Review", path: "/qa-review" },
  { id: "coa", label: "Final COA", path: "/coa" },
  { id: "my-tasks", label: "My Tasks", path: "/my-tasks" },
  { id: "notifications", label: "Notifications", path: "/notifications" },
  { id: "calculator", label: "Calculator", path: "/calculator" },
  { id: "reports", label: "Reports", path: "/reports" },
  { id: "test-masters", label: "Test Masters", path: "/test-masters" },
  { id: "admin", label: "Admin Panel", path: "/admin" },
  { id: "api-docs", label: "API Docs", path: "/api-docs" },
];

const SIC_PAGES = [
  "dashboard",
  "sample-intake",
  "eligibility-check",
  "registration",
  "test-specification",
  "analysis",
  "sic-review",
  "my-tasks",
  "notifications",
  "calculator",
  "test-masters",
];

const ANALYST_PAGES = [
  "dashboard",
  "analysis",
  "test-specification",
  "my-tasks",
  "notifications",
  "calculator",
];

const DEFAULT_PERMISSIONS: Record<Role, Record<string, boolean>> = {
  admin: Object.fromEntries(ALL_PAGES.map((p) => [p.id, true])),
  qa: Object.fromEntries(ALL_PAGES.map((p) => [p.id, p.id !== "admin"])),
  sectionInCharge: Object.fromEntries(
    ALL_PAGES.map((p) => [p.id, SIC_PAGES.includes(p.id)]),
  ),
  analyst: Object.fromEntries(
    ALL_PAGES.map((p) => [p.id, ANALYST_PAGES.includes(p.id)]),
  ),
};

const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  qa: "QA",
  sectionInCharge: "Section In-Charge",
  analyst: "Analyst",
};

const ROLE_COLORS: Record<Role, string> = {
  admin: "text-violet-600 bg-violet-50 border-violet-200",
  qa: "text-blue-600 bg-blue-50 border-blue-200",
  sectionInCharge: "text-teal-600 bg-teal-50 border-teal-200",
  analyst: "text-emerald-600 bg-emerald-50 border-emerald-200",
};

export function PagePermissions() {
  const navigate = useNavigate();
  const [permissions, setPermissions] =
    useState<Record<Role, Record<string, boolean>>>(DEFAULT_PERMISSIONS);

  const toggle = (role: Role, pageId: string) => {
    if (role === "admin") return; // Admin always full access
    setPermissions((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [pageId]: !prev[role][pageId],
      },
    }));
  };

  const enabledCount = (role: Role) =>
    Object.values(permissions[role]).filter(Boolean).length;

  const handleSave = () => {
    toast.success("Permissions updated", {
      description: "Role-based page access settings have been saved.",
    });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: "/admin" })}
            data-ocid="permissions.back.button"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="page-title flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Page Permissions
            </h1>
            <p className="page-subtitle">
              Configure which pages each role can access
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          data-ocid="permissions.save_button"
          className="gap-2"
        >
          <Shield className="h-4 w-4" />
          Save Permissions
        </Button>
      </div>

      {/* Info box */}
      <div className="mb-6 flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <span>
          <strong>Note:</strong> Admin role always has full access to all pages
          and cannot be restricted. Changes take effect immediately for demo
          purposes.
        </span>
      </div>

      {/* Tabs per role */}
      <Tabs defaultValue="admin" data-ocid="permissions.tab">
        <TabsList className="mb-4 h-auto gap-1 bg-muted/50 p-1">
          {(["admin", "qa", "sectionInCharge", "analyst"] as Role[]).map(
            (role) => (
              <TabsTrigger
                key={role}
                value={role}
                className="gap-2"
                data-ocid={`permissions.${role}.tab`}
              >
                {ROLE_LABELS[role]}
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${ROLE_COLORS[role]}`}
                >
                  {enabledCount(role)}/{ALL_PAGES.length}
                </span>
              </TabsTrigger>
            ),
          )}
        </TabsList>

        {(["admin", "qa", "sectionInCharge", "analyst"] as Role[]).map(
          (role) => (
            <TabsContent key={role} value={role}>
              <Card className="lims-card">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-foreground">
                    {ROLE_LABELS[role]} — Page Access
                  </CardTitle>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${ROLE_COLORS[role]}`}
                  >
                    {enabledCount(role)} / {ALL_PAGES.length} enabled
                  </span>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="text-left px-4 py-3 font-semibold text-muted-foreground w-8">
                            #
                          </th>
                          <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                            Page
                          </th>
                          <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                            Path
                          </th>
                          <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                            Access
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {ALL_PAGES.map((page, idx) => (
                          <tr
                            key={page.id}
                            className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                            data-ocid={`permissions.${role}.item.${idx + 1}`}
                          >
                            <td className="px-4 py-3 text-muted-foreground text-xs">
                              {idx + 1}
                            </td>
                            <td className="px-4 py-3 font-medium text-foreground">
                              {page.label}
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                              {page.path}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={permissions[role][page.id] ?? false}
                                  onCheckedChange={() => toggle(role, page.id)}
                                  disabled={role === "admin"}
                                  data-ocid={`permissions.${role}.${page.id}.switch`}
                                />
                                <span
                                  className={`text-xs font-medium ${
                                    permissions[role][page.id]
                                      ? "text-emerald-600"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {permissions[role][page.id]
                                    ? "Allowed"
                                    : "Restricted"}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {role === "admin" && (
                    <div className="px-4 py-3 border-t border-border bg-violet-50/50 text-xs text-violet-700 flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5" />
                      Admin always has unrestricted access to all pages.
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="mt-4 flex justify-end">
                <Button
                  onClick={handleSave}
                  data-ocid="permissions.save_button"
                  className="gap-2"
                >
                  <Shield className="h-4 w-4" />
                  Save Permissions
                </Button>
              </div>
            </TabsContent>
          ),
        )}
      </Tabs>
    </div>
  );
}
