import { Link, useLocation } from "@tanstack/react-router";
import {
  Award,
  BarChart3,
  Beaker,
  Bell,
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
import { RoleSwitcher } from "./RoleSwitcher";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles?: string[];
  badge?: number;
}

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
    <aside className="sidebar-wrapper fixed left-0 top-0 h-screen w-56 bg-sidebar flex flex-col z-40 border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-sidebar-border">
        <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
          <Beaker className="h-4 w-4 text-sidebar-primary-foreground" />
        </div>
        <div>
          <div className="text-sm font-bold text-sidebar-foreground leading-tight">
            PharmaLIMS
          </div>
          <div className="text-[10px] text-sidebar-foreground/50 leading-tight">
            Lab Information System
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <div className="space-y-0.5">
          {visibleItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors group ${
                isActive(item.path)
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <span
                className={
                  isActive(item.path)
                    ? "text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/60 group-hover:text-sidebar-accent-foreground"
                }
              >
                {item.icon}
              </span>
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                    isActive(item.path)
                      ? "bg-white/20 text-white"
                      : "bg-red-500 text-white"
                  }`}
                >
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-2 space-y-2">
        <RoleSwitcher />
        <div className="text-center">
          <p className="text-[9px] text-sidebar-foreground/30 leading-tight">
            © {new Date().getFullYear()} Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "pharmalims")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-sidebar-foreground/60"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </aside>
  );
}
