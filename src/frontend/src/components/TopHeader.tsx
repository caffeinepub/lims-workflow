import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Timer,
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
    bg: "bg-purple-100",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  qa: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  sectionInCharge: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  analyst: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ─── StatPill (light) ───────────────────────────────────────────────────────

interface StatPillProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconColor?: string;
  tooltip?: string;
}

function StatPill({
  icon,
  label,
  value,
  iconColor = "text-indigo-500",
  tooltip,
}: StatPillProps) {
  const pill = (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border"
      style={{
        background: "#F9FAFB",
        borderColor: "#E5E7EB",
      }}
    >
      <span className={`${iconColor} shrink-0`}>{icon}</span>
      <div className="flex flex-col leading-none">
        <span className="text-[9px] text-gray-400 uppercase tracking-wide font-medium">
          {label}
        </span>
        <span className="text-[11px] font-semibold text-gray-700 font-mono tabular-nums">
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

// ─── QuickCalculator Popover (light) ──────────────────────────────────────────

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
        return "bg-white hover:bg-gray-50 border border-gray-200 text-gray-800";
      case "op":
        return "bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700";
      case "sci":
        return "bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 text-[10px]";
      case "fn":
        return "bg-red-50 hover:bg-red-100 border border-red-200 text-red-600";
      case "eq":
        return "bg-indigo-600 hover:bg-indigo-700 text-white font-bold border-0";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-3 p-1" data-ocid="header.calculator.popover">
      {/* Display */}
      <div
        className="rounded-lg p-3 space-y-0.5"
        style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}
      >
        <div className="text-right text-[10px] font-mono text-gray-400 truncate min-h-[14px]">
          {expr || "0"}
        </div>
        <div className="text-right text-xl font-mono font-bold text-indigo-600 truncate">
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
        className="h-8 text-xs font-mono"
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
          <p className="text-[9px] text-gray-400 uppercase tracking-wide">
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
              className="w-full text-left rounded px-2 py-1 hover:bg-gray-50 transition-colors border border-gray-100"
            >
              <span className="text-[10px] font-mono text-gray-400">
                {h.expr}
              </span>
              <span className="text-[10px] font-mono text-indigo-600 ml-1">
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
        className="w-full flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 transition-colors border border-indigo-200"
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
        background: "rgb(11, 54, 77)",
        borderBottom: "1px solid rgba(0,0,0,0.12)",
        boxShadow: "0px 2px 4px rgba(0,0,0,0.15)",
      }}
    >
      {/* Left: system identity */}
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-white opacity-80" />
        <span className="text-[11px] text-white font-medium tracking-wide uppercase opacity-90">
          DKR LIMS &mdash; Workflow Management
        </span>
      </div>

      {/* Center: stat pills */}
      <div className="flex items-center gap-2 mx-4">
        <StatPill
          icon={<Activity className="h-3.5 w-3.5" />}
          label="System Uptime"
          value={uptimeLabel}
          iconColor="text-indigo-500"
          tooltip="Time since the application started"
        />
        <StatPill
          icon={<Timer className="h-3.5 w-3.5" />}
          label="Session Time"
          value={sessionLabel}
          iconColor="text-blue-500"
          tooltip="Time since current user session began"
        />
        <StatPill
          icon={<Clock className="h-3.5 w-3.5" />}
          label="Logged In At"
          value={formatLoginTime(loginTime)}
          iconColor="text-violet-500"
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
                    className="h-9 w-9 rounded-lg border border-white/30 hover:bg-white/20 hover:border-white/50 transition-colors text-white"
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
            className="w-[380px] p-3 bg-white border border-gray-200 shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Calculator className="h-4 w-4 text-indigo-500" />
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
              className="flex items-center gap-2.5 h-10 px-3 rounded-lg border border-white/30 hover:bg-white/20 transition-colors"
            >
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback
                  className="text-[11px] font-bold text-white"
                  style={{
                    background: "rgba(255,255,255,0.25)",
                  }}
                >
                  {getInitials(activeUser.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start leading-none">
                <span className="text-[12px] font-semibold text-white truncate max-w-[130px]">
                  {activeUser.name}
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] font-medium text-white/75">
                    {ROLE_LABELS[activeUser.role]}
                  </span>
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-white/60 shrink-0" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-72 bg-white border border-gray-200 shadow-lg"
          >
            {/* Current user info card */}
            <div className="p-3 rounded-t-md mb-1 bg-indigo-50 border-b border-indigo-100">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback
                    className="text-sm font-bold text-white"
                    style={{
                      background: "linear-gradient(135deg,#4338CA,#6366F1)",
                    }}
                  >
                    {getInitials(activeUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {activeUser.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {activeUser.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    {activeUser.designation}
                  </p>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <div className="rounded p-1.5 bg-white text-center border border-indigo-100">
                  <p className="text-[9px] text-gray-400 uppercase tracking-wide">
                    Session
                  </p>
                  <p className="text-[11px] font-mono font-semibold text-gray-700">
                    {sessionLabel}
                  </p>
                </div>
                <div className="rounded p-1.5 bg-white text-center border border-indigo-100">
                  <p className="text-[9px] text-gray-400 uppercase tracking-wide">
                    Login at
                  </p>
                  <p className="text-[11px] font-mono font-semibold text-gray-700">
                    {formatLoginTime(loginTime)}
                  </p>
                </div>
              </div>
            </div>

            <DropdownMenuLabel className="text-xs text-gray-400 font-normal px-3">
              Switch User (Demo)
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {DUMMY_USERS.map((user) => {
              const rc = ROLE_COLORS[user.role] ?? ROLE_COLORS.analyst;
              const isActiveUser = activeUser.id === user.id;
              return (
                <DropdownMenuItem
                  key={user.id}
                  data-ocid={`header.user_switch.item.${DUMMY_USERS.indexOf(user) + 1}`}
                  onClick={() => setActiveUser(user)}
                  className={`flex items-center gap-3 cursor-pointer mx-1 rounded-md ${isActiveUser ? "bg-indigo-50" : "hover:bg-gray-50"}`}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback
                      className="text-xs font-semibold text-white"
                      style={{
                        background: "linear-gradient(135deg,#4338CA,#6366F1)",
                      }}
                    >
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium text-gray-800 truncate">
                      {user.name}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full w-fit font-medium border ${rc.bg} ${rc.text} ${rc.border}`}
                    >
                      {ROLE_LABELS[user.role]}
                    </span>
                  </div>
                  {isActiveUser && (
                    <div className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                  )}
                </DropdownMenuItem>
              );
            })}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              data-ocid="header.logout.button"
              onClick={logout}
              className="flex items-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 mx-1 rounded-md cursor-pointer"
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
                className="h-9 w-9 rounded-lg border border-white/30 hover:bg-white/20 hover:border-white/50 transition-colors text-white/80"
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
