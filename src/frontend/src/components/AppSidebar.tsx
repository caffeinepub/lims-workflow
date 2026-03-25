import { Link, useLocation } from "@tanstack/react-router";
import {
  Award,
  BarChart3,
  Beaker,
  Bell,
  BookOpen,
  Calculator,
  CheckSquare,
  ClipboardCheck,
  Code2,
  Eye,
  FileText,
  FlaskConical,
  LayoutDashboard,
  Microscope,
  Settings,
  Shield,
  ShieldCheck,
  TestTube,
} from "lucide-react";
import type React from "react";
import { useRole } from "../contexts/RoleContext";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles?: string[];
  badge?: number;
}

// Per-item accent colors for active/hover states (sky-blue header theme)
const NAV_COLORS: Record<string, { activeIcon: string; hoverBg: string }> = {
  "/": { activeIcon: "text-white", hoverBg: "hover:bg-white/20" },
  "/sample-intake": {
    activeIcon: "text-white",
    hoverBg: "hover:bg-white/20",
  },
  "/eligibility-check": {
    activeIcon: "text-white",
    hoverBg: "hover:bg-white/20",
  },
  "/registration": {
    activeIcon: "text-white",
    hoverBg: "hover:bg-white/20",
  },
  "/test-specification": {
    activeIcon: "text-white",
    hoverBg: "hover:bg-white/20",
  },
  "/analysis": { activeIcon: "text-white", hoverBg: "hover:bg-white/20" },
  "/sic-review": {
    activeIcon: "text-white",
    hoverBg: "hover:bg-white/20",
  },
  "/qa-review": {
    activeIcon: "text-white",
    hoverBg: "hover:bg-white/20",
  },
  "/coa": { activeIcon: "text-white", hoverBg: "hover:bg-white/20" },
  "/my-tasks": { activeIcon: "text-white", hoverBg: "hover:bg-white/20" },
  "/notifications": {
    activeIcon: "text-white",
    hoverBg: "hover:bg-white/20",
  },
  "/reports": { activeIcon: "text-white", hoverBg: "hover:bg-white/20" },
  "/test-masters": {
    activeIcon: "text-white",
    hoverBg: "hover:bg-white/20",
  },
  "/calculator": {
    activeIcon: "text-white",
    hoverBg: "hover:bg-white/20",
  },
  "/admin": { activeIcon: "text-white", hoverBg: "hover:bg-white/20" },
  "/api-docs": { activeIcon: "text-white", hoverBg: "hover:bg-white/20" },
};

export function AppSidebar() {
  const { activeUser, unreadCount, pendingTaskCount } = useRole();
  const location = useLocation();

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      path: "/",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      label: "Sample Intake",
      path: "/sample-intake",
      icon: <FlaskConical className="h-4 w-4" />,
    },
    {
      label: "Eligibility Check",
      path: "/eligibility-check",
      icon: <ClipboardCheck className="h-4 w-4" />,
    },
    {
      label: "Registration",
      path: "/registration",
      icon: <FileText className="h-4 w-4" />,
    },
    {
      label: "Test Specification",
      path: "/test-specification",
      icon: <TestTube className="h-4 w-4" />,
      roles: ["sectionInCharge", "admin", "qa"],
    },
    {
      label: "Analysis",
      path: "/analysis",
      icon: <Microscope className="h-4 w-4" />,
      roles: ["analyst", "sectionInCharge", "admin", "qa"],
    },
    {
      label: "SIC Review",
      path: "/sic-review",
      icon: <Eye className="h-4 w-4" />,
      roles: ["sectionInCharge", "admin", "qa"],
    },
    {
      label: "QA Review",
      path: "/qa-review",
      icon: <ShieldCheck className="h-4 w-4" />,
      roles: ["qa", "admin"],
    },
    { label: "Final COA", path: "/coa", icon: <Award className="h-4 w-4" /> },
    {
      label: "My Tasks",
      path: "/my-tasks",
      icon: <CheckSquare className="h-4 w-4" />,
      badge: pendingTaskCount,
    },
    {
      label: "Notifications",
      path: "/notifications",
      icon: <Bell className="h-4 w-4" />,
      badge: unreadCount,
    },
    {
      label: "Reports",
      path: "/reports",
      icon: <BarChart3 className="h-4 w-4" />,
      roles: ["admin", "qa", "sectionInCharge"],
    },
    {
      label: "Test Masters",
      path: "/test-masters",
      icon: <BookOpen className="h-4 w-4" />,
      roles: ["admin", "qa", "sectionInCharge"],
    },
    {
      label: "Calculator",
      path: "/calculator",
      icon: <Calculator className="h-4 w-4" />,
    },
    {
      label: "Admin Panel",
      path: "/admin",
      icon: <Settings className="h-4 w-4" />,
      roles: ["admin"],
    },
    {
      label: "Page Permissions",
      path: "/admin/permissions",
      icon: <Shield className="h-4 w-4" />,
      roles: ["admin"],
    },
    {
      label: "API Docs",
      path: "/api-docs",
      icon: <Code2 className="h-4 w-4" />,
    },
  ];

  const visibleItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(activeUser.role);
  });

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className="sidebar-wrapper fixed left-0 top-0 h-screen w-56 flex flex-col z-40"
      style={{
        background: "rgb(11, 54, 77)",
        borderRight: "1px solid rgba(255,255,255,0.15)",
        boxShadow: "1px 0 4px rgba(0,0,0,0.04)",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-4 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.15)" }}
      >
        <div
          className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: "rgba(255,255,255,0.2)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          <Beaker className="h-5 w-5 text-white" />
        </div>
        <div>
          <div
            className="text-sm font-bold leading-tight"
            style={{ color: "#FFFFFF" }}
          >
            DKR LIMS
          </div>
          <div
            className="text-[10px] leading-tight"
            style={{ color: "rgba(255,255,255,0.75)" }}
          >
            Lab Information System
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <div className="space-y-0.5">
          {visibleItems.map((item) => {
            const colors = NAV_COLORS[item.path] ?? NAV_COLORS["/"];
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                data-ocid={`sidebar.${item.path.replace(/\//g, "").replace(/-/g, "_") || "dashboard"}.link`}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 group ${
                  active ? "font-semibold" : `${colors.hoverBg}`
                }`}
                style={
                  active
                    ? {
                        background: "rgba(255,255,255,0.25)",
                        color: "#FFFFFF",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                      }
                    : { color: "rgba(255,255,255,0.85)" }
                }
              >
                <span
                  className={`transition-colors duration-150 ${
                    active
                      ? colors.activeIcon
                      : "text-white/70 group-hover:text-white"
                  }`}
                >
                  {item.icon}
                </span>
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                    style={{
                      background: active ? "rgba(255,255,255,0.9)" : "#EF4444",
                      color: active ? "rgb(2,132,199)" : "white",
                    }}
                  >
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Divider */}
      <div
        style={{
          height: "1px",
          background: "rgba(255,255,255,0.15)",
          margin: "0 8px",
        }}
      />

      {/* Footer */}
      <div className="p-2 pt-2">
        <div className="text-center">
          <p
            className="text-[9px] leading-tight"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            © {new Date().getFullYear()} Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "dkrlims")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-400"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </aside>
  );
}
