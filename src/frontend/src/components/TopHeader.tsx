import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  Calculator,
  ChevronDown,
  Clock,
  ExternalLink,
  LogOut,
  Shield,
  Timer,
  User,
  UserCheck,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRole } from "../contexts/RoleContext";
import { DUMMY_USERS } from "../lib/mockData";

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  }
  return `${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

function formatLoginTime(d: Date): string {
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatLoginDate(d: Date): string {
  return d.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  qa: "QA Director",
  sectionInCharge: "Section In-Charge",
  analyst: "Analyst",
};

const ROLE_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  admin: {
    bg: "bg-purple-500/15",
    text: "text-purple-300",
    border: "border-purple-500/30",
  },
  qa: {
    bg: "bg-blue-500/15",
    text: "text-blue-300",
    border: "border-blue-500/30",
  },
  sectionInCharge: {
    bg: "bg-amber-500/15",
    text: "text-amber-300",
    border: "border-amber-500/30",
  },
  analyst: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-300",
    border: "border-emerald-500/30",
  },
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  admin: <Shield className="h-3 w-3" />,
  qa: <ShieldCheck className="h-3 w-3" />,
  sectionInCharge: <UserCheck className="h-3 w-3" />,
  analyst: <User className="h-3 w-3" />,
};

// lazy import to avoid circular — just inline the check icon
function ShieldCheck({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-label="Shield check"
      role="img"
    >
      <title>Shield check</title>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ─── StatPill ───────────────────────────────────────────────────────────────

interface StatPillProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: string;
  tooltip?: string;
}

function StatPill({
  icon,
  label,
  value,
  color = "text-slate-300",
  tooltip,
}: StatPillProps) {
  const pill = (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border"
      style={{
        background: "rgba(255,255,255,0.04)",
        borderColor: "rgba(45,180,210,0.15)",
      }}
    >
      <span className={`${color} shrink-0`}>{icon}</span>
      <div className="flex flex-col leading-none">
        <span className="text-[9px] text-slate-500 uppercase tracking-wide font-medium">
          {label}
        </span>
        <span className="text-[11px] font-semibold text-slate-200 font-mono tabular-nums">
          {value}
        </span>
      </div>
    </div>
  );

  if (!tooltip) return pill;
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{pill}</TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Safe Evaluator ──────────────────────────────────────────────────────────

function safeEvalHeader(expr: string): string {
  try {
    const sanitized = expr
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/−/g, "-")
      .replace(/π/g, String(Math.PI))
      .replace(/e(?![0-9])/g, String(Math.E))
      .replace(/sin\(/g, "Math.sin(Math.PI/180*")
      .replace(/cos\(/g, "Math.cos(Math.PI/180*")
      .replace(/tan\(/g, "Math.tan(Math.PI/180*")
      .replace(/log\(/g, "Math.log10(")
      .replace(/ln\(/g, "Math.log(")
      .replace(/√\(/g, "Math.sqrt(")
      .replace(/\^/g, "**");
    // eslint-disable-next-line no-new-func
    const result = new Function(`"use strict"; return (${sanitized})`)();
    if (typeof result !== "number" || !Number.isFinite(result)) return "Error";
    return String(Number.parseFloat(result.toPrecision(12)));
  } catch {
    return "Error";
  }
}

// ─── QuickCalculator Popover ──────────────────────────────────────────────────

function QuickCalculator() {
  const navigate = useNavigate();
  const [expr, setExpr] = useState("");
  const [result, setResult] = useState("0");
  const [history, setHistory] = useState<{ expr: string; result: string }[]>(
    [],
  );
  const [justEval, setJustEval] = useState(false);

  const append = useCallback(
    (val: string) => {
      if (justEval && /^[0-9(π]$/.test(val)) {
        setExpr(val);
        setResult("0");
        setJustEval(false);
        return;
      }
      setJustEval(false);
      setExpr((prev) => prev + val);
    },
    [justEval],
  );

  const evaluate = useCallback(() => {
    if (!expr) return;
    const res = safeEvalHeader(expr);
    setResult(res);
    if (res !== "Error") {
      setHistory((prev) => [...prev.slice(-4), { expr, result: res }]);
      setJustEval(true);
    }
  }, [expr]);

  const clear = () => {
    setExpr("");
    setResult("0");
    setJustEval(false);
  };
  const backspace = () => {
    setExpr((prev) => prev.slice(0, -1));
    setJustEval(false);
  };

  useEffect(() => {
    if (expr) {
      const r = safeEvalHeader(expr);
      if (r !== "Error") setResult(r);
    }
  }, [expr]);

  type BtnType = "num" | "op" | "sci" | "eq" | "fn";
  const btns: { label: string; action: () => void; type: BtnType }[] = [
    { label: "C", action: clear, type: "fn" },
    { label: "⌫", action: backspace, type: "fn" },
    { label: "sin", action: () => append("sin("), type: "sci" },
    { label: "cos", action: () => append("cos("), type: "sci" },
    { label: "tan", action: () => append("tan("), type: "sci" },
    { label: "log", action: () => append("log("), type: "sci" },
    { label: "ln", action: () => append("ln("), type: "sci" },
    { label: "√", action: () => append("√("), type: "sci" },
    { label: "π", action: () => append("π"), type: "sci" },
    { label: "e", action: () => append("e"), type: "sci" },
    { label: "(", action: () => append("("), type: "op" },
    { label: ")", action: () => append(")"), type: "op" },
    { label: "7", action: () => append("7"), type: "num" },
    { label: "8", action: () => append("8"), type: "num" },
    { label: "9", action: () => append("9"), type: "num" },
    { label: "÷", action: () => append("÷"), type: "op" },
    { label: "4", action: () => append("4"), type: "num" },
    { label: "5", action: () => append("5"), type: "num" },
    { label: "6", action: () => append("6"), type: "num" },
    { label: "×", action: () => append("×"), type: "op" },
    { label: "1", action: () => append("1"), type: "num" },
    { label: "2", action: () => append("2"), type: "num" },
    { label: "3", action: () => append("3"), type: "num" },
    { label: "−", action: () => append("−"), type: "op" },
    { label: "0", action: () => append("0"), type: "num" },
    { label: ".", action: () => append("."), type: "num" },
    { label: "%", action: () => append("%"), type: "op" },
    { label: "+", action: () => append("+"), type: "op" },
    { label: "=", action: evaluate, type: "eq" },
  ];

  const btnClass = (type: BtnType) => {
    switch (type) {
      case "num":
        return "bg-[#0f1f35] hover:bg-[#162a45] border border-teal-500/20 text-slate-100";
      case "op":
        return "bg-[#0a1628] hover:bg-teal-500/20 border border-teal-500/30 text-teal-300";
      case "sci":
        return "bg-[#0d1a30] hover:bg-indigo-500/20 border border-indigo-500/25 text-indigo-300 text-[10px]";
      case "fn":
        return "bg-[#1a0e1e] hover:bg-rose-500/20 border border-rose-500/30 text-rose-300";
      case "eq":
        return "bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-bold";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-3 p-1" data-ocid="header.calculator.popover">
      {/* Display */}
      <div
        className="rounded-lg p-3 space-y-0.5"
        style={{
          background: "rgba(0,0,0,0.4)",
          border: "1px solid rgba(45,180,210,0.15)",
        }}
      >
        <div className="text-right text-[10px] font-mono text-slate-500 truncate min-h-[14px]">
          {expr || "0"}
        </div>
        <div className="text-right text-xl font-mono font-bold text-teal-300 truncate">
          {result}
        </div>
      </div>

      {/* Expression input */}
      <Input
        value={expr}
        onChange={(e) => {
          setExpr(e.target.value);
          setJustEval(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") evaluate();
        }}
        placeholder="Type expression..."
        data-ocid="header.calculator.input"
        className="h-8 text-xs bg-[#0a1628] border-teal-500/20 text-slate-100 placeholder:text-slate-600 font-mono"
      />

      {/* Keypad */}
      <div
        className="grid grid-cols-4 gap-1"
        data-ocid="header.calculator.keypad"
      >
        {btns.slice(0, 28).map((btn, i) => (
          <button
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed static button array
            key={i}
            type="button"
            onClick={btn.action}
            className={`h-9 rounded-md text-xs font-semibold transition-all duration-100 active:scale-95 ${btnClass(btn.type)}`}
          >
            {btn.label}
          </button>
        ))}
        {/* = button spans full width */}
        <button
          type="button"
          onClick={evaluate}
          className={`h-9 col-span-4 rounded-md text-sm font-bold transition-all duration-100 active:scale-95 ${btnClass("eq")}`}
        >
          =
        </button>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="space-y-1">
          <p className="text-[9px] text-slate-600 uppercase tracking-wide">
            Recent
          </p>
          {[...history].reverse().map((h, i) => (
            <button
              // biome-ignore lint/suspicious/noArrayIndexKey: reversed ephemeral history items
              key={i}
              type="button"
              onClick={() => {
                setExpr(h.expr);
                setResult(h.result);
              }}
              className="w-full text-left rounded px-2 py-1 hover:bg-white/5 transition-colors"
              style={{ border: "1px solid rgba(45,180,210,0.08)" }}
            >
              <span className="text-[10px] font-mono text-slate-500">
                {h.expr}
              </span>
              <span className="text-[10px] font-mono text-teal-300 ml-1">
                = {h.result}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Open full calculator */}
      <button
        type="button"
        onClick={() => navigate({ to: "/calculator" })}
        data-ocid="header.calculator.open_full.button"
        className="w-full flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-medium text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 transition-colors"
        style={{ border: "1px solid rgba(45,212,191,0.2)" }}
      >
        <ExternalLink className="h-3 w-3" />
        Open Full Calculator
      </button>
    </div>
  );
}

// ─── TopHeader ──────────────────────────────────────────────────────────────

export function TopHeader() {
  const {
    activeUser,
    setActiveUser,
    sessionSeconds,
    uptimeSeconds,
    logout,
    loginTime,
  } = useRole();

  const roleColor = ROLE_COLORS[activeUser.role] ?? ROLE_COLORS.analyst;

  const sessionLabel = useMemo(
    () => formatDuration(sessionSeconds),
    [sessionSeconds],
  );
  const uptimeLabel = useMemo(
    () => formatDuration(uptimeSeconds),
    [uptimeSeconds],
  );

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-4 py-0 h-14"
      data-ocid="top_header.section"
      style={{
        background:
          "linear-gradient(90deg, #0d2137 0%, #0a1a2e 60%, #0d2137 100%)",
        borderBottom: "1px solid rgba(45,180,210,0.18)",
        boxShadow: "0 2px 16px rgba(0,0,0,0.25)",
      }}
    >
      {/* Left: page context placeholder (breadcrumb slot) */}
      <div className="flex items-center gap-2">
        <div
          className="h-1.5 w-1.5 rounded-full animate-pulse"
          style={{ background: "#2dd4bf" }}
        />
        <span className="text-[11px] text-slate-500 font-medium tracking-wide uppercase">
          DKR LIMS &mdash; Workflow Management
        </span>
      </div>

      {/* Center: stat pills */}
      <div className="flex items-center gap-2 mx-4">
        <StatPill
          icon={<Activity className="h-3.5 w-3.5" />}
          label="System Uptime"
          value={uptimeLabel}
          color="text-teal-400"
          tooltip="Time since the application started"
        />
        <StatPill
          icon={<Timer className="h-3.5 w-3.5" />}
          label="Session Time"
          value={sessionLabel}
          color="text-sky-400"
          tooltip="Time since current user session began"
        />
        <StatPill
          icon={<Clock className="h-3.5 w-3.5" />}
          label="Logged In At"
          value={formatLoginTime(loginTime)}
          color="text-indigo-400"
          tooltip={`Login date: ${formatLoginDate(loginTime)}`}
        />
      </div>

      {/* Right: calculator + user dropdown + logout */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Calculator popover */}
        <Popover>
          <PopoverTrigger asChild>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    data-ocid="header.calculator.button"
                    className="h-9 w-9 rounded-lg border hover:bg-teal-500/10 hover:border-teal-500/40 hover:text-teal-300 transition-colors text-slate-400"
                    style={{ borderColor: "rgba(45,180,210,0.2)" }}
                  >
                    <Calculator className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Formula Calculator
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            side="bottom"
            className="w-[380px] p-3 border-0"
            style={{
              background: "linear-gradient(135deg, #0d2137 0%, #0a1628 100%)",
              border: "1px solid rgba(45,180,210,0.25)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Calculator className="h-4 w-4 text-teal-400" />
                Quick Calculator
              </h3>
            </div>
            <QuickCalculator />
          </PopoverContent>
        </Popover>

        {/* User switcher dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              data-ocid="header.user_switcher.button"
              className="flex items-center gap-2.5 h-10 px-3 rounded-lg border hover:bg-white/5 transition-colors"
              style={{ borderColor: "rgba(45,180,210,0.2)" }}
            >
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback
                  className="text-[11px] font-bold"
                  style={{
                    background: "linear-gradient(135deg,#0ea5e9,#14b8a6)",
                    color: "white",
                  }}
                >
                  {getInitials(activeUser.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start leading-none">
                <span className="text-[12px] font-semibold text-slate-100 truncate max-w-[130px]">
                  {activeUser.name}
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span
                    className={`flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${roleColor.bg} ${roleColor.text} ${roleColor.border}`}
                  >
                    {ROLE_ICONS[activeUser.role]}
                    <span>{ROLE_LABELS[activeUser.role]}</span>
                  </span>
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-72">
            {/* Current user info card */}
            <div
              className="p-3 rounded-t-md mb-1"
              style={{
                background: "linear-gradient(135deg,#0ea5e910,#14b8a610)",
              }}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback
                    className="text-sm font-bold"
                    style={{
                      background: "linear-gradient(135deg,#0ea5e9,#14b8a6)",
                      color: "white",
                    }}
                  >
                    {getInitials(activeUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {activeUser.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {activeUser.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activeUser.designation}
                  </p>
                </div>
              </div>
              {/* Session info mini-block */}
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <div className="rounded p-1.5 bg-muted/50 text-center">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wide">
                    Session
                  </p>
                  <p className="text-[11px] font-mono font-semibold">
                    {sessionLabel}
                  </p>
                </div>
                <div className="rounded p-1.5 bg-muted/50 text-center">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wide">
                    Login at
                  </p>
                  <p className="text-[11px] font-mono font-semibold">
                    {formatLoginTime(loginTime)}
                  </p>
                </div>
              </div>
            </div>

            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal px-3">
              Switch User (Demo)
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {DUMMY_USERS.map((user) => {
              const rc = ROLE_COLORS[user.role] ?? ROLE_COLORS.analyst;
              const isActive = activeUser.id === user.id;
              return (
                <DropdownMenuItem
                  key={user.id}
                  data-ocid={`header.user_switch.item.${DUMMY_USERS.indexOf(user) + 1}`}
                  onClick={() => setActiveUser(user)}
                  className={`flex items-center gap-3 cursor-pointer mx-1 rounded-md ${isActive ? "bg-accent" : ""}`}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium truncate">
                      {user.name}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full w-fit font-medium border ${rc.bg} ${rc.text} ${rc.border}`}
                    >
                      {ROLE_LABELS[user.role]}
                    </span>
                  </div>
                  {isActive && (
                    <div className="h-2 w-2 rounded-full bg-teal-500 shrink-0" />
                  )}
                </DropdownMenuItem>
              );
            })}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              data-ocid="header.logout.button"
              onClick={logout}
              className="flex items-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-500/10 mx-1 rounded-md cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Standalone logout button */}
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                data-ocid="header.logout_quick.button"
                onClick={logout}
                className="h-9 w-9 rounded-lg border hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400 transition-colors text-slate-400"
                style={{ borderColor: "rgba(45,180,210,0.2)" }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Logout ({activeUser.name})
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  );
}
