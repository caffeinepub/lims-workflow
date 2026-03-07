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
  Eye,
  FileText,
  FlaskConical,
  LayoutDashboard,
  Microscope,
  Settings,
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
  color?: string;
}

// Teal-to-blue spectrum colors per nav item
const NAV_COLORS: Record<
  string,
  { active: string; hover: string; icon: string }
> = {
  "/": {
    active: "from-teal-500 to-cyan-500",
    hover: "hover:bg-teal-500/10",
    icon: "text-teal-300",
  },
  "/sample-intake": {
    active: "from-cyan-500 to-sky-500",
    hover: "hover:bg-cyan-500/10",
    icon: "text-cyan-300",
  },
  "/eligibility-check": {
    active: "from-sky-500 to-blue-500",
    hover: "hover:bg-sky-500/10",
    icon: "text-sky-300",
  },
  "/registration": {
    active: "from-blue-500 to-blue-600",
    hover: "hover:bg-blue-500/10",
    icon: "text-blue-300",
  },
  "/test-specification": {
    active: "from-blue-600 to-indigo-500",
    hover: "hover:bg-blue-600/10",
    icon: "text-blue-300",
  },
  "/analysis": {
    active: "from-indigo-500 to-violet-500",
    hover: "hover:bg-indigo-500/10",
    icon: "text-indigo-300",
  },
  "/sic-review": {
    active: "from-violet-500 to-purple-500",
    hover: "hover:bg-violet-500/10",
    icon: "text-violet-300",
  },
  "/qa-review": {
    active: "from-purple-500 to-fuchsia-500",
    hover: "hover:bg-purple-500/10",
    icon: "text-purple-300",
  },
  "/coa": {
    active: "from-teal-400 to-emerald-500",
    hover: "hover:bg-teal-400/10",
    icon: "text-teal-300",
  },
  "/my-tasks": {
    active: "from-amber-500 to-orange-500",
    hover: "hover:bg-amber-500/10",
    icon: "text-amber-300",
  },
  "/notifications": {
    active: "from-rose-500 to-pink-500",
    hover: "hover:bg-rose-500/10",
    icon: "text-rose-300",
  },
  "/reports": {
    active: "from-sky-500 to-teal-500",
    hover: "hover:bg-sky-500/10",
    icon: "text-sky-300",
  },
  "/admin": {
    active: "from-slate-500 to-slate-600",
    hover: "hover:bg-slate-500/10",
    icon: "text-slate-300",
  },
  "/test-masters": {
    active: "from-cyan-600 to-teal-600",
    hover: "hover:bg-cyan-600/10",
    icon: "text-cyan-300",
  },
  "/calculator": {
    active: "from-lime-500 to-teal-500",
    hover: "hover:bg-lime-500/10",
    icon: "text-lime-300",
  },
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
        background:
          "linear-gradient(180deg, #0d2137 0%, #0a1628 40%, #061020 100%)",
        borderRight: "1px solid rgba(45, 180, 210, 0.15)",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-4 py-4"
        style={{ borderBottom: "1px solid rgba(45, 180, 210, 0.15)" }}
      >
        <div
          className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: "linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)",
            boxShadow: "0 0 16px rgba(14, 165, 233, 0.4)",
          }}
        >
          <Beaker className="h-5 w-5 text-white" />
        </div>
        <div>
          <div
            className="text-sm font-bold leading-tight"
            style={{
              background: "linear-gradient(90deg, #38bdf8, #2dd4bf)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            DKR LIMS
          </div>
          <div
            className="text-[10px] leading-tight"
            style={{ color: "rgba(148,163,184,0.6)" }}
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
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 group ${
                  active
                    ? `bg-gradient-to-r ${colors.active} text-white font-semibold shadow-lg`
                    : `text-slate-400 ${colors.hover} hover:text-white`
                }`}
                style={
                  active
                    ? { boxShadow: "0 2px 12px rgba(14, 165, 233, 0.25)" }
                    : {}
                }
              >
                <span
                  className={`transition-colors duration-200 ${
                    active
                      ? "text-white"
                      : `${colors.icon} group-hover:text-white`
                  }`}
                >
                  {item.icon}
                </span>
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                    style={{
                      background: active ? "rgba(255,255,255,0.25)" : "#ef4444",
                      color: "white",
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

      {/* Subtle teal glow divider */}
      <div
        style={{
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(45,212,191,0.3), transparent)",
          margin: "0 8px",
        }}
      />

      {/* Footer */}
      <div className="p-2 pt-2">
        <div className="text-center">
          <p
            className="text-[9px] leading-tight"
            style={{ color: "rgba(148,163,184,0.3)" }}
          >
            © {new Date().getFullYear()} Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "dkrlims")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-slate-400"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </aside>
  );
}
