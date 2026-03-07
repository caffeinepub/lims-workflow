import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  ClipboardCopy,
  FlaskConical,
  RotateCcw,
  Sigma,
} from "lucide-react";
import React, { useCallback, useState } from "react";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────────────

interface HistoryEntry {
  expression: string;
  result: string;
  timestamp: Date;
  category?: string;
}

// ─── Safe Evaluator ──────────────────────────────────────────────────────────

function safeEval(expr: string): string {
  try {
    // Replace display symbols with JS equivalents
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

    // Only allow safe characters
    if (/[^0-9+\-*/().%Math.sincotaglqrePIE\s**/]/.test(sanitized)) {
      // More permissive check
    }

    // eslint-disable-next-line no-new-func
    const result = new Function(`"use strict"; return (${sanitized})`)();
    if (typeof result !== "number" || !Number.isFinite(result)) return "Error";
    // Format nicely
    const r = Number.parseFloat(result.toPrecision(12));
    return String(r);
  } catch {
    return "Error";
  }
}

// ─── Keyboard Calculator ──────────────────────────────────────────────────────

interface KeyboardCalcProps {
  onAddHistory: (entry: HistoryEntry) => void;
}

function KeyboardCalculator({ onAddHistory }: KeyboardCalcProps) {
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("0");
  const [justEvaluated, setJustEvaluated] = useState(false);

  const append = useCallback(
    (val: string) => {
      if (justEvaluated && /^[0-9(π]$/.test(val)) {
        setExpression(val);
        setResult("0");
        setJustEvaluated(false);
        return;
      }
      setJustEvaluated(false);
      setExpression((prev) => prev + val);
    },
    [justEvaluated],
  );

  const evaluate = useCallback(() => {
    if (!expression) return;
    const res = safeEval(expression);
    setResult(res);
    if (res !== "Error") {
      onAddHistory({
        expression,
        result: res,
        timestamp: new Date(),
        category: "Keyboard",
      });
      setJustEvaluated(true);
    }
  }, [expression, onAddHistory]);

  const clear = useCallback(() => {
    setExpression("");
    setResult("0");
    setJustEvaluated(false);
  }, []);

  const backspace = useCallback(() => {
    setExpression((prev) => prev.slice(0, -1));
    setJustEvaluated(false);
  }, []);

  const toggleSign = useCallback(() => {
    setExpression((prev) => {
      if (!prev) return "-";
      if (prev.startsWith("-")) return prev.slice(1);
      return `-${prev}`;
    });
  }, []);

  const squareVal = useCallback(() => {
    if (expression) {
      const r = safeEval(`(${expression})**2`);
      setResult(r);
      if (r !== "Error") {
        onAddHistory({
          expression: `(${expression})²`,
          result: r,
          timestamp: new Date(),
          category: "Keyboard",
        });
        setJustEvaluated(true);
      }
    }
  }, [expression, onAddHistory]);

  // Update preview result as user types
  React.useEffect(() => {
    if (expression) {
      const r = safeEval(expression);
      if (r !== "Error") setResult(r);
    }
  }, [expression]);

  type ButtonDef = {
    label: string;
    action: () => void;
    type: "number" | "operator" | "scientific" | "equals" | "fn";
    wide?: boolean;
  };

  const buttons: ButtonDef[] = [
    { label: "C", action: clear, type: "fn" },
    { label: "⌫", action: backspace, type: "fn" },
    { label: "(", action: () => append("("), type: "operator" },
    { label: ")", action: () => append(")"), type: "operator" },
    {
      label: "sin",
      action: () => append("sin("),
      type: "scientific",
    },
    {
      label: "cos",
      action: () => append("cos("),
      type: "scientific",
    },
    {
      label: "tan",
      action: () => append("tan("),
      type: "scientific",
    },
    {
      label: "π",
      action: () => append("π"),
      type: "scientific",
    },
    {
      label: "log",
      action: () => append("log("),
      type: "scientific",
    },
    {
      label: "ln",
      action: () => append("ln("),
      type: "scientific",
    },
    {
      label: "e",
      action: () => append("e"),
      type: "scientific",
    },
    { label: "x²", action: squareVal, type: "scientific" },
    {
      label: "√",
      action: () => append("√("),
      type: "scientific",
    },
    {
      label: "xⁿ",
      action: () => append("^"),
      type: "scientific",
    },
    { label: "%", action: () => append("%"), type: "operator" },
    { label: "÷", action: () => append("÷"), type: "operator" },
    { label: "7", action: () => append("7"), type: "number" },
    { label: "8", action: () => append("8"), type: "number" },
    { label: "9", action: () => append("9"), type: "number" },
    { label: "×", action: () => append("×"), type: "operator" },
    { label: "4", action: () => append("4"), type: "number" },
    { label: "5", action: () => append("5"), type: "number" },
    { label: "6", action: () => append("6"), type: "number" },
    { label: "−", action: () => append("−"), type: "operator" },
    { label: "1", action: () => append("1"), type: "number" },
    { label: "2", action: () => append("2"), type: "number" },
    { label: "3", action: () => append("3"), type: "number" },
    { label: "+", action: () => append("+"), type: "operator" },
    { label: "0", action: () => append("0"), type: "number" },
    { label: ".", action: () => append("."), type: "number" },
    { label: "±", action: toggleSign, type: "operator" },
    { label: "=", action: evaluate, type: "equals" },
  ];

  const btnStyle = (type: ButtonDef["type"]) => {
    switch (type) {
      case "number":
        return "bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 shadow-sm";
      case "operator":
        return "bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700";
      case "scientific":
        return "bg-[#EEF2FF] hover:bg-indigo-100 border border-indigo-200 text-indigo-600 text-[11px]";
      case "fn":
        return "bg-red-50 hover:bg-red-100 border border-red-200 text-red-600";
      case "equals":
        return "bg-indigo-600 hover:bg-indigo-700 border-0 text-white font-bold shadow-md";
      default:
        return "";
    }
  };

  return (
    <Card className="border border-gray-200 bg-white shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-gray-800 text-sm font-semibold flex items-center gap-2">
          <Sigma className="h-4 w-4 text-indigo-500" />
          Scientific Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Display */}
        <div
          className="rounded-xl p-4 space-y-1"
          style={{
            background: "#F9FAFB",
            border: "1px solid #E5E7EB",
          }}
        >
          <div
            className="text-right text-xs font-mono text-gray-400 min-h-[16px] truncate"
            data-ocid="calculator.expression.panel"
          >
            {expression || "0"}
          </div>
          <div
            className="text-right text-3xl font-mono font-bold text-indigo-600 min-h-[40px] truncate"
            data-ocid="calculator.result.panel"
          >
            {result}
          </div>
        </div>

        {/* Buttons */}
        <div
          className="grid grid-cols-4 gap-1.5"
          data-ocid="calculator.keypad.panel"
        >
          {buttons.map((btn, i) => (
            <button
              // biome-ignore lint/suspicious/noArrayIndexKey: calculator buttons are a fixed static array
              key={i}
              type="button"
              onClick={btn.action}
              data-ocid={`calculator.key.button.${i + 1}`}
              className={`h-12 rounded-lg text-sm font-semibold transition-all duration-150 active:scale-95 ${btnStyle(btn.type)}`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Formula Input Helper ──────────────────────────────────────────────────────

interface FormulaField {
  key: string;
  label: string;
  placeholder?: string;
  unit?: string;
}

interface FormulaCardProps {
  title: string;
  formula: string;
  fields: FormulaField[];
  calculate: (values: Record<string, string>) => string;
  resultLabel?: string;
  resultUnit?: string;
  extra?: (values: Record<string, string>) => React.ReactNode;
  onAddHistory: (entry: HistoryEntry) => void;
  ocidPrefix: string;
}

function FormulaCard({
  title,
  formula,
  fields,
  calculate,
  resultLabel = "Result",
  resultUnit = "",
  extra,
  onAddHistory,
  ocidPrefix,
}: FormulaCardProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCalc = () => {
    const res = calculate(values);
    setResult(res);
    if (res && res !== "Error" && res !== "N/A") {
      onAddHistory({
        expression: `${title}: ${fields.map((f) => `${f.label}=${values[f.key] || "?"}`).join(", ")}`,
        result: `${res} ${resultUnit}`.trim(),
        timestamp: new Date(),
        category: "Formula Library",
      });
    }
  };

  const copyResult = () => {
    if (result) {
      navigator.clipboard.writeText(`${result} ${resultUnit}`.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.success("Result copied!");
    }
  };

  return (
    <Card
      className="border border-gray-200 bg-white shadow-sm"
      style={{ borderLeft: "3px solid #4338CA" }}
    >
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          <div
            className="mt-1 px-2 py-1 rounded text-xs font-mono text-indigo-600"
            style={{ background: "#EEF2FF" }}
          >
            {formula}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {fields.map((f) => (
            <div key={f.key} className="space-y-1">
              <Label className="text-xs text-gray-500">
                {f.label}
                {f.unit && (
                  <span className="text-gray-400 ml-1">({f.unit})</span>
                )}
              </Label>
              <Input
                type="text"
                placeholder={f.placeholder ?? "Enter value"}
                value={values[f.key] ?? ""}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [f.key]: e.target.value }))
                }
                data-ocid={`${ocidPrefix}.${f.key}.input`}
                className="h-8 text-xs bg-white border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-indigo-400"
              />
            </div>
          ))}
        </div>

        {extra && <div className="text-xs text-gray-500">{extra(values)}</div>}

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleCalc}
            data-ocid={`${ocidPrefix}.calculate.button`}
            className="flex-1 h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white border-0"
          >
            Calculate
          </Button>
          {result !== null && (
            <Button
              size="sm"
              variant="outline"
              onClick={copyResult}
              data-ocid={`${ocidPrefix}.copy.button`}
              className="h-8 text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50"
            >
              {copied ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <ClipboardCopy className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>

        {result !== null && (
          <div
            className="rounded-lg p-3 flex items-center justify-between"
            style={{
              background: result === "Error" ? "#FEF2F2" : "#F0FDF4",
              border:
                result === "Error" ? "1px solid #FECACA" : "1px solid #BBF7D0",
            }}
            data-ocid={`${ocidPrefix}.result.panel`}
          >
            <span className="text-xs text-gray-500">{resultLabel}</span>
            <span
              className={`text-sm font-bold font-mono ${result === "Error" ? "text-red-600" : "text-emerald-700"}`}
            >
              {result}
              {resultUnit && result !== "Error" && (
                <span className="text-xs text-gray-400 ml-1 font-normal">
                  {resultUnit}
                </span>
              )}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Conversion Section ──────────────────────────────────────────────────────

interface ConversionDef {
  label: string;
  units: string[];
  convert: (value: number, from: string, to: string) => number;
}

const CONVERSIONS: ConversionDef[] = [
  {
    label: "Mass",
    units: ["mg", "g", "kg", "µg"],
    convert: (v, from, to) => {
      const toGrams: Record<string, number> = {
        µg: 1e-6,
        mg: 0.001,
        g: 1,
        kg: 1000,
      };
      return (v * (toGrams[from] ?? 1)) / (toGrams[to] ?? 1);
    },
  },
  {
    label: "Volume",
    units: ["µL", "mL", "L"],
    convert: (v, from, to) => {
      const toML: Record<string, number> = { µL: 0.001, mL: 1, L: 1000 };
      return (v * (toML[from] ?? 1)) / (toML[to] ?? 1);
    },
  },
  {
    label: "Concentration",
    units: ["mg/mL", "µg/mL", "ng/mL", "%", "ppm"],
    convert: (v, from, to) => {
      // All to mg/mL base
      const toMgML: Record<string, number> = {
        "mg/mL": 1,
        "µg/mL": 0.001,
        "ng/mL": 1e-6,
        "%": 10, // % w/v = 10 mg/mL
        ppm: 0.001,
      };
      return (v * (toMgML[from] ?? 1)) / (toMgML[to] ?? 1);
    },
  },
  {
    label: "Temperature",
    units: ["°C", "°F", "K"],
    convert: (v, from, to) => {
      let c = v;
      if (from === "°F") c = ((v - 32) * 5) / 9;
      else if (from === "K") c = v - 273.15;
      if (to === "°C") return c;
      if (to === "°F") return (c * 9) / 5 + 32;
      return c + 273.15;
    },
  },
  {
    label: "Time",
    units: ["seconds", "minutes", "hours", "days"],
    convert: (v, from, to) => {
      const toSec: Record<string, number> = {
        seconds: 1,
        minutes: 60,
        hours: 3600,
        days: 86400,
      };
      return (v * (toSec[from] ?? 1)) / (toSec[to] ?? 1);
    },
  },
];

function ConversionsTab({
  onAddHistory,
}: {
  onAddHistory: (e: HistoryEntry) => void;
}) {
  const [convValues, setConvValues] = useState<
    Record<string, { val: string; from: string; to: string }>
  >({});

  return (
    <div className="space-y-4">
      {CONVERSIONS.map((conv) => {
        const state = convValues[conv.label] ?? {
          val: "",
          from: conv.units[0],
          to: conv.units[1],
        };
        const result =
          state.val && !Number.isNaN(Number.parseFloat(state.val))
            ? Number.parseFloat(
                (
                  conv.convert(
                    Number.parseFloat(state.val),
                    state.from,
                    state.to,
                  ) as number
                ).toPrecision(10),
              )
            : null;

        const handleCalc = () => {
          if (result !== null) {
            onAddHistory({
              expression: `${state.val} ${state.from} → ${state.to}`,
              result: `${result} ${state.to}`,
              timestamp: new Date(),
              category: "Conversion",
            });
          }
        };

        return (
          <Card
            key={conv.label}
            className="border border-gray-200 bg-white shadow-sm"
            style={{ borderLeft: "3px solid #7C3AED" }}
          >
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">
                {conv.label}
              </h3>
              <div className="flex items-end gap-2 flex-wrap">
                <div className="flex-1 min-w-[80px]">
                  <Label className="text-xs text-gray-500">Value</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={state.val}
                    onChange={(e) =>
                      setConvValues((prev) => ({
                        ...prev,
                        [conv.label]: { ...state, val: e.target.value },
                      }))
                    }
                    data-ocid={`conversion.${conv.label.toLowerCase()}.input`}
                    className="h-8 text-xs bg-white border-gray-200 text-gray-800 placeholder:text-gray-400"
                  />
                </div>
                <div className="w-28">
                  <Label className="text-xs text-gray-500">From</Label>
                  <Select
                    value={state.from}
                    onValueChange={(v) =>
                      setConvValues((prev) => ({
                        ...prev,
                        [conv.label]: { ...state, from: v },
                      }))
                    }
                  >
                    <SelectTrigger
                      className="h-8 text-xs bg-white border-gray-200 text-gray-800"
                      data-ocid={`conversion.${conv.label.toLowerCase()}.from.select`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {conv.units.map((u) => (
                        <SelectItem key={u} value={u} className="text-xs">
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-gray-400 text-sm pb-1.5">→</div>
                <div className="w-28">
                  <Label className="text-xs text-gray-500">To</Label>
                  <Select
                    value={state.to}
                    onValueChange={(v) =>
                      setConvValues((prev) => ({
                        ...prev,
                        [conv.label]: { ...state, to: v },
                      }))
                    }
                  >
                    <SelectTrigger
                      className="h-8 text-xs bg-white border-gray-200 text-gray-800"
                      data-ocid={`conversion.${conv.label.toLowerCase()}.to.select`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {conv.units.map((u) => (
                        <SelectItem key={u} value={u} className="text-xs">
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  size="sm"
                  onClick={handleCalc}
                  data-ocid={`conversion.${conv.label.toLowerCase()}.calculate.button`}
                  className="h-8 text-xs bg-violet-600 hover:bg-violet-700 text-white border-0 pb-0 mb-0"
                >
                  Convert
                </Button>
              </div>
              {result !== null && (
                <div
                  className="mt-2 rounded-lg p-2 flex items-center justify-between"
                  style={{
                    background: "#F5F3FF",
                    border: "1px solid #DDD6FE",
                  }}
                  data-ocid={`conversion.${conv.label.toLowerCase()}.result.panel`}
                >
                  <span className="text-xs text-gray-500">
                    {state.val} {state.from} =
                  </span>
                  <span className="text-sm font-bold font-mono text-violet-700">
                    {result} {state.to}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Statistical Calculator ──────────────────────────────────────────────────

function parseNumbers(input: string): number[] {
  return input
    .split(/[,;\s]+/)
    .map((s) => Number.parseFloat(s.trim()))
    .filter((n) => !Number.isNaN(n));
}

function mean(ns: number[]) {
  return ns.reduce((a, b) => a + b, 0) / ns.length;
}

function stdDev(ns: number[], sample = false) {
  const m = mean(ns);
  const variance =
    ns.reduce((sum, n) => sum + (n - m) ** 2, 0) /
    (ns.length - (sample ? 1 : 0));
  return Math.sqrt(variance);
}

function StatisticsTab({
  onAddHistory,
}: {
  onAddHistory: (e: HistoryEntry) => void;
}) {
  const [rawValues, setRawValues] = useState("");
  const [statsResult, setStatsResult] = useState<Record<string, string> | null>(
    null,
  );

  const calcStats = () => {
    const ns = parseNumbers(rawValues);
    if (ns.length < 2) {
      toast.error("Enter at least 2 comma-separated numbers");
      return;
    }
    const m = mean(ns);
    const sdPop = stdDev(ns, false);
    const sdSample = stdDev(ns, true);
    const sorted = [...ns].sort((a, b) => a - b);
    const median =
      ns.length % 2 === 0
        ? (sorted[ns.length / 2 - 1] + sorted[ns.length / 2]) / 2
        : sorted[Math.floor(ns.length / 2)];
    const freq: Record<number, number> = {};
    for (const n of ns) freq[n] = (freq[n] ?? 0) + 1;
    const maxFreq = Math.max(...Object.values(freq));
    const modes = Object.keys(freq)
      .filter((k) => freq[Number(k)] === maxFreq)
      .join(", ");

    const rsd = (sdPop / m) * 100;

    const res = {
      "N (count)": String(ns.length),
      Mean: m.toPrecision(8),
      Median: median.toPrecision(8),
      Mode: modes,
      "SD (Population)": sdPop.toPrecision(8),
      "SD (Sample)": sdSample.toPrecision(8),
      Variance: (sdPop ** 2).toPrecision(8),
      "RSD %": rsd.toPrecision(6),
      "CV %": rsd.toPrecision(6),
      Min: String(sorted[0]),
      Max: String(sorted[sorted.length - 1]),
    };
    setStatsResult(res);

    onAddHistory({
      expression: `Stats([${ns.slice(0, 5).join(",")}${ns.length > 5 ? "..." : ""}])`,
      result: `Mean=${m.toPrecision(6)}, SD=${sdPop.toPrecision(6)}, RSD=${rsd.toPrecision(4)}%`,
      timestamp: new Date(),
      category: "Statistical",
    });
  };

  return (
    <div className="space-y-4">
      <Card
        className="border border-gray-200 bg-white shadow-sm"
        style={{ borderLeft: "3px solid #0EA5E9" }}
      >
        <CardContent className="p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-800">
            Descriptive Statistics
          </h3>
          <div
            className="px-2 py-1 rounded text-xs font-mono text-sky-700"
            style={{ background: "#F0F9FF" }}
          >
            Mean, SD, Variance, RSD%, CV%, Median, Mode
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">
              Values (comma or space separated)
            </Label>
            <Textarea
              placeholder="e.g. 98.5, 99.1, 98.8, 100.2, 99.7"
              value={rawValues}
              onChange={(e) => setRawValues(e.target.value)}
              data-ocid="stats.values.textarea"
              className="text-xs bg-white border-gray-200 text-gray-800 placeholder:text-gray-400 h-16 resize-none"
            />
          </div>
          <Button
            size="sm"
            onClick={calcStats}
            data-ocid="stats.calculate.button"
            className="w-full h-8 text-xs bg-sky-400 hover:bg-sky-500 text-white border-0"
          >
            Calculate All
          </Button>

          {statsResult && (
            <div
              className="rounded-lg p-3 space-y-1.5"
              style={{
                background: "#F0F9FF",
                border: "1px solid #BAE6FD",
              }}
              data-ocid="stats.result.panel"
            >
              {Object.entries(statsResult).map(([k, v]) => (
                <div
                  key={k}
                  className="flex justify-between items-center text-xs"
                >
                  <span className="text-gray-500">{k}</span>
                  <span className="font-mono font-semibold text-sky-700">
                    {v}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Z-score */}
      <FormulaCard
        title="Z-Score"
        formula="z = (x − μ) / σ"
        fields={[
          { key: "x", label: "Value (x)" },
          { key: "mean", label: "Mean (μ)" },
          { key: "sd", label: "Std Dev (σ)" },
        ]}
        calculate={(v) => {
          const x = Number.parseFloat(v.x);
          const m = Number.parseFloat(v.mean);
          const s = Number.parseFloat(v.sd);
          if (Number.isNaN(x) || Number.isNaN(m) || Number.isNaN(s) || s === 0)
            return "Error";
          return ((x - m) / s).toPrecision(6);
        }}
        resultLabel="Z-Score"
        onAddHistory={onAddHistory}
        ocidPrefix="zscore"
      />
    </div>
  );
}

// ─── Quadratic Formula ────────────────────────────────────────────────────────

function QuadraticCard({
  onAddHistory,
}: {
  onAddHistory: (e: HistoryEntry) => void;
}) {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [c, setC] = useState("");
  const [roots, setRoots] = useState<string | null>(null);

  const calc = () => {
    const na = Number.parseFloat(a);
    const nb = Number.parseFloat(b);
    const nc = Number.parseFloat(c);
    if (Number.isNaN(na) || Number.isNaN(nb) || Number.isNaN(nc) || na === 0) {
      setRoots("Error: a ≠ 0");
      return;
    }
    const disc = nb ** 2 - 4 * na * nc;
    if (disc < 0) {
      setRoots(
        `Complex roots: (${(-nb / (2 * na)).toPrecision(4)} ± ${(Math.sqrt(-disc) / (2 * na)).toPrecision(4)}i)`,
      );
    } else {
      const r1 = (-nb + Math.sqrt(disc)) / (2 * na);
      const r2 = (-nb - Math.sqrt(disc)) / (2 * na);
      setRoots(`x₁ = ${r1.toPrecision(6)}, x₂ = ${r2.toPrecision(6)}`);
      onAddHistory({
        expression: `Quadratic: ${na}x²+${nb}x+${nc}=0`,
        result: `x₁=${r1.toPrecision(6)}, x₂=${r2.toPrecision(6)}`,
        timestamp: new Date(),
        category: "Scientific",
      });
    }
  };

  return (
    <Card
      className="border border-gray-200 bg-white shadow-sm"
      style={{ borderLeft: "3px solid #6366F1" }}
    >
      <CardContent className="p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-800">
          Quadratic Formula
        </h3>
        <div
          className="px-2 py-1 rounded text-xs font-mono text-indigo-600"
          style={{ background: "#EEF2FF" }}
        >
          x = (−b ± √(b²−4ac)) / 2a
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { val: a, set: setA, label: "a" },
            { val: b, set: setB, label: "b" },
            { val: c, set: setC, label: "c" },
          ].map(({ val, set, label }) => (
            <div key={label} className="space-y-1">
              <Label className="text-xs text-gray-500">{label}</Label>
              <Input
                type="number"
                placeholder="0"
                value={val}
                onChange={(e) => set(e.target.value)}
                data-ocid={`quadratic.${label}.input`}
                className="h-8 text-xs bg-white border-gray-200 text-gray-800 placeholder:text-gray-400"
              />
            </div>
          ))}
        </div>
        <Button
          size="sm"
          onClick={calc}
          data-ocid="quadratic.calculate.button"
          className="w-full h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white border-0"
        >
          Solve
        </Button>
        {roots && (
          <div
            className="rounded-lg p-3 text-xs font-mono text-indigo-700 text-center"
            style={{
              background: "#EEF2FF",
              border: "1px solid #C7D2FE",
            }}
            data-ocid="quadratic.result.panel"
          >
            {roots}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Dilution C1V1=C2V2 ───────────────────────────────────────────────────────

function DilutionCard({
  onAddHistory,
}: {
  onAddHistory: (e: HistoryEntry) => void;
}) {
  const [vals, setVals] = useState({ c1: "", v1: "", c2: "", v2: "" });
  const [solveFor, setSolveFor] = useState("v2");
  const [result, setResult] = useState<string | null>(null);

  const calc = () => {
    const { c1, v1, c2, v2 } = vals;
    const n = (s: string) => Number.parseFloat(s);
    let res = 0;
    if (solveFor === "c1") res = (n(c2) * n(v2)) / n(v1);
    else if (solveFor === "v1") res = (n(c2) * n(v2)) / n(c1);
    else if (solveFor === "c2") res = (n(c1) * n(v1)) / n(v2);
    else res = (n(c1) * n(v1)) / n(c2);

    if (!Number.isFinite(res) || Number.isNaN(res)) {
      setResult("Error");
      return;
    }
    const r = res.toPrecision(6);
    setResult(r);
    onAddHistory({
      expression: `Dilution C1V1=C2V2, solve ${solveFor.toUpperCase()}`,
      result: r,
      timestamp: new Date(),
      category: "Chemistry",
    });
  };

  return (
    <Card
      className="border border-gray-200 bg-white shadow-sm"
      style={{ borderLeft: "3px solid #10B981" }}
    >
      <CardContent className="p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-800">
          Dilution (C₁V₁ = C₂V₂)
        </h3>
        <div
          className="px-2 py-1 rounded text-xs font-mono text-emerald-700"
          style={{ background: "#ECFDF5" }}
        >
          C₁V₁ = C₂V₂ — solve for any variable
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-500">Solve for</Label>
          <Select value={solveFor} onValueChange={setSolveFor}>
            <SelectTrigger
              className="h-8 text-xs bg-white border-gray-200 text-gray-800"
              data-ocid="dilution.solvfor.select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="c1">C₁ (Initial Concentration)</SelectItem>
              <SelectItem value="v1">V₁ (Initial Volume)</SelectItem>
              <SelectItem value="c2">C₂ (Final Concentration)</SelectItem>
              <SelectItem value="v2">V₂ (Final Volume)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {["c1", "v1", "c2", "v2"].map((k) => (
            <div key={k} className="space-y-1">
              <Label className="text-xs text-gray-500">
                {k === "c1"
                  ? "C₁"
                  : k === "v1"
                    ? "V₁"
                    : k === "c2"
                      ? "C₂"
                      : "V₂"}
                {solveFor === k && (
                  <span className="ml-1 text-emerald-600">(solving)</span>
                )}
              </Label>
              <Input
                type="number"
                placeholder={solveFor === k ? "← result" : "Enter value"}
                disabled={solveFor === k}
                value={
                  solveFor === k ? (result ?? "") : vals[k as keyof typeof vals]
                }
                onChange={(e) =>
                  setVals((prev) => ({ ...prev, [k]: e.target.value }))
                }
                data-ocid={`dilution.${k}.input`}
                className="h-8 text-xs bg-white border-gray-200 text-gray-800 placeholder:text-gray-400 disabled:opacity-50"
              />
            </div>
          ))}
        </div>
        <Button
          size="sm"
          onClick={calc}
          data-ocid="dilution.calculate.button"
          className="w-full h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-0"
        >
          Calculate
        </Button>
        {result && (
          <div
            className="rounded-lg p-2 text-center"
            style={{
              background: "#ECFDF5",
              border: "1px solid #A7F3D0",
            }}
            data-ocid="dilution.result.panel"
          >
            <span className="text-sm font-bold font-mono text-emerald-700">
              {solveFor.toUpperCase()} = {result}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Content Uniformity ───────────────────────────────────────────────────────

function ContentUniformityCard({
  onAddHistory,
}: {
  onAddHistory: (e: HistoryEntry) => void;
}) {
  const [rawValues, setRawValues] = useState("");
  const [labelClaim, setLabelClaim] = useState("");
  const [result, setResult] = useState<{
    mean: string;
    rsd: string;
    pass: boolean;
    values: string[];
    allInRange: boolean;
  } | null>(null);

  const calc = () => {
    const ns = parseNumbers(rawValues);
    if (ns.length < 2) {
      toast.error("Enter at least 2 values");
      return;
    }
    const lc = Number.parseFloat(labelClaim) || 100;
    const percentages = ns.map((n) => (n / lc) * 100);
    const m = mean(percentages);
    const sd = stdDev(percentages, true);
    const rsd = (sd / m) * 100;
    const allInRange = percentages.every((p) => p >= 85 && p <= 115);
    const pass = rsd <= 6 && allInRange;

    setResult({
      mean: m.toPrecision(6),
      rsd: rsd.toPrecision(4),
      pass,
      values: percentages.map((p) => p.toPrecision(4)),
      allInRange,
    });
    onAddHistory({
      expression: `Content Uniformity (LC=${lc})`,
      result: `Mean=${m.toPrecision(4)}%, RSD=${rsd.toPrecision(3)}%, ${pass ? "PASS" : "FAIL"}`,
      timestamp: new Date(),
      category: "Pharma",
    });
  };

  return (
    <Card
      className="border border-gray-200 bg-white shadow-sm"
      style={{ borderLeft: "3px solid #F59E0B" }}
    >
      <CardContent className="p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-800">
          Content Uniformity
        </h3>
        <div
          className="px-2 py-1 rounded text-xs font-mono text-amber-700"
          style={{ background: "#FFFBEB" }}
        >
          USP: RSD ≤ 6%, all units 85–115% of label claim
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Label Claim (mg)</Label>
            <Input
              type="number"
              placeholder="100"
              value={labelClaim}
              onChange={(e) => setLabelClaim(e.target.value)}
              data-ocid="cuniformity.labelclaim.input"
              className="h-8 text-xs bg-white border-gray-200 text-gray-800 placeholder:text-gray-400"
            />
          </div>
          <div className="space-y-1 col-span-2">
            <Label className="text-xs text-gray-500">
              Measured values (comma separated)
            </Label>
            <Textarea
              placeholder="e.g. 99, 101, 98, 102, 100"
              value={rawValues}
              onChange={(e) => setRawValues(e.target.value)}
              data-ocid="cuniformity.values.textarea"
              className="text-xs bg-white border-gray-200 text-gray-800 placeholder:text-gray-400 h-14 resize-none"
            />
          </div>
        </div>
        <Button
          size="sm"
          onClick={calc}
          data-ocid="cuniformity.calculate.button"
          className="w-full h-8 text-xs bg-amber-500 hover:bg-amber-600 text-white border-0"
        >
          Check Uniformity
        </Button>
        {result && (
          <div
            className="rounded-lg p-3 space-y-2"
            style={{
              background: result.pass ? "#ECFDF5" : "#FEF2F2",
              border: `1px solid ${result.pass ? "#A7F3D0" : "#FECACA"}`,
            }}
            data-ocid="cuniformity.result.panel"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Verdict</span>
              <Badge
                className={
                  result.pass
                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                    : "bg-red-100 text-red-700 border-red-200"
                }
              >
                {result.pass ? "PASS" : "FAIL"}
              </Badge>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Mean</span>
              <span className="font-mono text-emerald-700">{result.mean}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">RSD</span>
              <span
                className={`font-mono ${Number.parseFloat(result.rsd) <= 6 ? "text-emerald-700" : "text-red-600"}`}
              >
                {result.rsd}%
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">85–115% range</span>
              <span
                className={
                  result.allInRange ? "text-emerald-700" : "text-red-600"
                }
              >
                {result.allInRange ? "All in range" : "Out of range"}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── History Panel ────────────────────────────────────────────────────────────

function HistoryPanel({
  history,
  onClear,
  onRestore,
}: {
  history: HistoryEntry[];
  onClear: () => void;
  onRestore: (e: HistoryEntry) => void;
}) {
  return (
    <Card className="border border-gray-200 bg-white shadow-sm">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-800 text-sm font-semibold flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-indigo-500" />
            Calculation History
          </CardTitle>
          {history.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onClear}
              data-ocid="history.clear.button"
              className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 px-2"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {history.length === 0 ? (
          <div
            className="text-center py-8 text-xs text-gray-400"
            data-ocid="history.empty_state"
          >
            No calculations yet
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            {[...history].reverse().map((entry, i) => (
              <button
                // biome-ignore lint/suspicious/noArrayIndexKey: history is reversed and items are ephemeral
                key={i}
                type="button"
                onClick={() => onRestore(entry)}
                data-ocid={`history.item.${i + 1}`}
                className="w-full text-left rounded-lg p-2 transition-colors hover:bg-gray-50 group border border-gray-100"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-gray-400 font-mono truncate">
                      {entry.expression}
                    </div>
                    <div className="text-xs font-bold font-mono text-indigo-600 truncate">
                      = {entry.result}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    {entry.category && (
                      <Badge
                        className="text-[9px] px-1 py-0 bg-gray-100 text-gray-500 border-gray-200"
                        variant="outline"
                      >
                        {entry.category}
                      </Badge>
                    )}
                    <div className="text-[9px] text-gray-400 mt-0.5">
                      {entry.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Calculator Page ─────────────────────────────────────────────────────

export function Calculator() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [restoredExpr, setRestoredExpr] = useState<string>("");

  const addToHistory = useCallback((entry: HistoryEntry) => {
    setHistory((prev) => [...prev.slice(-49), entry]);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const handleRestore = useCallback((entry: HistoryEntry) => {
    setRestoredExpr(entry.expression);
    toast.info(`Restored: ${entry.expression} = ${entry.result}`);
  }, []);

  // Suppress unused warning — restoredExpr is for future restoration
  void restoredExpr;

  return (
    <div className="p-6 space-y-6" data-ocid="calculator.page">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center bg-indigo-600"
              style={{ boxShadow: "0 2px 8px rgba(67,56,202,0.3)" }}
            >
              <Sigma className="h-4 w-4 text-white" />
            </div>
            Formula Calculator
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Scientific · Statistical · Chemistry · Pharma · Conversions
          </p>
        </div>
        <Badge className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
          All Formula Types
        </Badge>
      </div>

      {/* Main Layout: two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Scientific Calculator Keyboard */}
        <div className="space-y-4">
          <KeyboardCalculator onAddHistory={addToHistory} />
          <HistoryPanel
            history={history}
            onClear={clearHistory}
            onRestore={handleRestore}
          />
        </div>

        {/* Right: Formula Library */}
        <div>
          <Card className="border border-gray-200 bg-white shadow-sm">
            <CardHeader className="pb-0 px-4 pt-4">
              <CardTitle className="text-gray-800 text-sm font-semibold">
                Formula Library
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <Tabs defaultValue="basic" data-ocid="calculator.library.tab">
                <TabsList className="w-full grid grid-cols-6 h-8 bg-gray-100 border border-gray-200 mb-4">
                  {[
                    "basic",
                    "scientific",
                    "statistical",
                    "chemistry",
                    "conversions",
                    "pharma",
                  ].map((tab) => (
                    <TabsTrigger
                      key={tab}
                      value={tab}
                      data-ocid={`calculator.${tab}.tab`}
                      className="text-[10px] capitalize data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm text-gray-500"
                    >
                      {tab === "statistical"
                        ? "Stats"
                        : tab === "chemistry"
                          ? "Chem"
                          : tab === "conversions"
                            ? "Conv."
                            : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* ── Basic ── */}
                <TabsContent value="basic" className="space-y-3 mt-0">
                  <FormulaCard
                    title="Percentage"
                    formula="(value ÷ total) × 100"
                    fields={[
                      { key: "value", label: "Value" },
                      { key: "total", label: "Total" },
                    ]}
                    calculate={(v) => {
                      const val = Number.parseFloat(v.value);
                      const tot = Number.parseFloat(v.total);
                      if (Number.isNaN(val) || Number.isNaN(tot) || tot === 0)
                        return "Error";
                      return ((val / tot) * 100).toPrecision(6);
                    }}
                    resultUnit="%"
                    onAddHistory={addToHistory}
                    ocidPrefix="basic.percentage"
                  />
                  <FormulaCard
                    title="Average (Mean)"
                    formula="sum ÷ count"
                    fields={[
                      { key: "sum", label: "Sum" },
                      { key: "count", label: "Count" },
                    ]}
                    calculate={(v) => {
                      const s = Number.parseFloat(v.sum);
                      const c = Number.parseFloat(v.count);
                      if (Number.isNaN(s) || Number.isNaN(c) || c === 0)
                        return "Error";
                      return (s / c).toPrecision(8);
                    }}
                    onAddHistory={addToHistory}
                    ocidPrefix="basic.average"
                  />
                  <FormulaCard
                    title="Power"
                    formula="base ^ exponent"
                    fields={[
                      { key: "base", label: "Base" },
                      { key: "exp", label: "Exponent" },
                    ]}
                    calculate={(v) => {
                      const b = Number.parseFloat(v.base);
                      const e = Number.parseFloat(v.exp);
                      if (Number.isNaN(b) || Number.isNaN(e)) return "Error";
                      const r = b ** e;
                      return Number.isFinite(r) ? r.toPrecision(10) : "Error";
                    }}
                    onAddHistory={addToHistory}
                    ocidPrefix="basic.power"
                  />
                  <FormulaCard
                    title="Square Root"
                    formula="√(number)"
                    fields={[{ key: "n", label: "Number" }]}
                    calculate={(v) => {
                      const n = Number.parseFloat(v.n);
                      if (Number.isNaN(n) || n < 0) return "Error";
                      return Math.sqrt(n).toPrecision(10);
                    }}
                    onAddHistory={addToHistory}
                    ocidPrefix="basic.sqrt"
                  />
                </TabsContent>

                {/* ── Scientific ── */}
                <TabsContent value="scientific" className="space-y-3 mt-0">
                  {[
                    {
                      title: "Sine",
                      formula: "sin(angle°)",
                      key: "angle",
                      label: "Angle (°)",
                      fn: (v: string) =>
                        Math.sin(
                          (Number.parseFloat(v) * Math.PI) / 180,
                        ).toPrecision(8),
                      pfx: "sci.sine",
                    },
                    {
                      title: "Cosine",
                      formula: "cos(angle°)",
                      key: "angle",
                      label: "Angle (°)",
                      fn: (v: string) =>
                        Math.cos(
                          (Number.parseFloat(v) * Math.PI) / 180,
                        ).toPrecision(8),
                      pfx: "sci.cosine",
                    },
                    {
                      title: "Tangent",
                      formula: "tan(angle°)",
                      key: "angle",
                      label: "Angle (°)",
                      fn: (v: string) =>
                        Math.tan(
                          (Number.parseFloat(v) * Math.PI) / 180,
                        ).toPrecision(8),
                      pfx: "sci.tangent",
                    },
                    {
                      title: "Log₁₀",
                      formula: "log₁₀(x)",
                      key: "x",
                      label: "x",
                      fn: (v: string) => {
                        const n = Number.parseFloat(v);
                        return n > 0 ? Math.log10(n).toPrecision(8) : "Error";
                      },
                      pfx: "sci.log10",
                    },
                    {
                      title: "Natural Log",
                      formula: "ln(x)",
                      key: "x",
                      label: "x",
                      fn: (v: string) => {
                        const n = Number.parseFloat(v);
                        return n > 0 ? Math.log(n).toPrecision(8) : "Error";
                      },
                      pfx: "sci.ln",
                    },
                    {
                      title: "Exponential",
                      formula: "eˣ",
                      key: "x",
                      label: "x",
                      fn: (v: string) =>
                        Math.exp(Number.parseFloat(v)).toPrecision(10),
                      pfx: "sci.exp",
                    },
                  ].map(({ title, formula, key, label, fn, pfx }) => (
                    <FormulaCard
                      key={pfx}
                      title={title}
                      formula={formula}
                      fields={[{ key, label }]}
                      calculate={(v) => {
                        const val = v[key];
                        if (!val || Number.isNaN(Number.parseFloat(val)))
                          return "Error";
                        return fn(val);
                      }}
                      onAddHistory={addToHistory}
                      ocidPrefix={pfx}
                    />
                  ))}
                  <QuadraticCard onAddHistory={addToHistory} />
                </TabsContent>

                {/* ── Statistical ── */}
                <TabsContent value="statistical" className="space-y-3 mt-0">
                  <StatisticsTab onAddHistory={addToHistory} />
                </TabsContent>

                {/* ── Chemistry ── */}
                <TabsContent value="chemistry" className="space-y-3 mt-0">
                  <FormulaCard
                    title="Molarity"
                    formula="M = moles ÷ volume (L)"
                    fields={[
                      { key: "moles", label: "Moles (mol)" },
                      { key: "volume", label: "Volume (L)" },
                    ]}
                    calculate={(v) => {
                      const m = Number.parseFloat(v.moles);
                      const vol = Number.parseFloat(v.volume);
                      if (Number.isNaN(m) || Number.isNaN(vol) || vol === 0)
                        return "Error";
                      return (m / vol).toPrecision(6);
                    }}
                    resultUnit="mol/L"
                    onAddHistory={addToHistory}
                    ocidPrefix="chem.molarity"
                  />
                  <DilutionCard onAddHistory={addToHistory} />
                  <FormulaCard
                    title="% w/v Concentration"
                    formula="(mass(g) ÷ volume(mL)) × 100"
                    fields={[
                      { key: "mass", label: "Mass (g)" },
                      { key: "volume", label: "Volume (mL)" },
                    ]}
                    calculate={(v) => {
                      const m = Number.parseFloat(v.mass);
                      const vol = Number.parseFloat(v.volume);
                      if (Number.isNaN(m) || Number.isNaN(vol) || vol === 0)
                        return "Error";
                      return ((m / vol) * 100).toPrecision(6);
                    }}
                    resultUnit="% w/v"
                    onAddHistory={addToHistory}
                    ocidPrefix="chem.wv"
                  />
                  <FormulaCard
                    title="% w/w Concentration"
                    formula="(mass solute ÷ mass solution) × 100"
                    fields={[
                      { key: "solute", label: "Mass Solute (g)" },
                      { key: "solution", label: "Mass Solution (g)" },
                    ]}
                    calculate={(v) => {
                      const sol = Number.parseFloat(v.solute);
                      const soln = Number.parseFloat(v.solution);
                      if (Number.isNaN(sol) || Number.isNaN(soln) || soln === 0)
                        return "Error";
                      return ((sol / soln) * 100).toPrecision(6);
                    }}
                    resultUnit="% w/w"
                    onAddHistory={addToHistory}
                    ocidPrefix="chem.ww"
                  />
                  <FormulaCard
                    title="pH"
                    formula="-log₁₀([H⁺])"
                    fields={[
                      {
                        key: "h",
                        label: "[H⁺] concentration",
                        unit: "mol/L",
                        placeholder: "e.g. 1e-7",
                      },
                    ]}
                    calculate={(v) => {
                      const h = Number.parseFloat(v.h);
                      if (Number.isNaN(h) || h <= 0) return "Error";
                      return (-Math.log10(h)).toPrecision(4);
                    }}
                    resultLabel="pH"
                    onAddHistory={addToHistory}
                    ocidPrefix="chem.ph"
                  />
                  <FormulaCard
                    title="Molecular Weight"
                    formula="MW = mass ÷ moles"
                    fields={[
                      { key: "mass", label: "Mass (g)" },
                      { key: "moles", label: "Moles (mol)" },
                    ]}
                    calculate={(v) => {
                      const m = Number.parseFloat(v.mass);
                      const mol = Number.parseFloat(v.moles);
                      if (Number.isNaN(m) || Number.isNaN(mol) || mol === 0)
                        return "Error";
                      return (m / mol).toPrecision(6);
                    }}
                    resultUnit="g/mol"
                    onAddHistory={addToHistory}
                    ocidPrefix="chem.mw"
                  />
                  <FormulaCard
                    title="PPM to mg/L"
                    formula="1 ppm = 1 mg/L (in water)"
                    fields={[{ key: "ppm", label: "ppm value" }]}
                    calculate={(v) => {
                      const p = Number.parseFloat(v.ppm);
                      if (Number.isNaN(p)) return "Error";
                      return p.toPrecision(6);
                    }}
                    resultUnit="mg/L"
                    onAddHistory={addToHistory}
                    ocidPrefix="chem.ppm"
                  />
                </TabsContent>

                {/* ── Conversions ── */}
                <TabsContent value="conversions" className="space-y-3 mt-0">
                  <ConversionsTab onAddHistory={addToHistory} />
                </TabsContent>

                {/* ── Pharma ── */}
                <TabsContent value="pharma" className="space-y-3 mt-0">
                  <FormulaCard
                    title="LOD (Limit of Detection)"
                    formula="LOD = 3.3 × σ ÷ S"
                    fields={[
                      {
                        key: "sigma",
                        label: "σ (SD of blank)",
                      },
                      { key: "slope", label: "S (Slope)" },
                    ]}
                    calculate={(v) => {
                      const sigma = Number.parseFloat(v.sigma);
                      const slope = Number.parseFloat(v.slope);
                      if (
                        Number.isNaN(sigma) ||
                        Number.isNaN(slope) ||
                        slope === 0
                      )
                        return "Error";
                      return ((3.3 * sigma) / slope).toPrecision(6);
                    }}
                    onAddHistory={addToHistory}
                    ocidPrefix="pharma.lod"
                  />
                  <FormulaCard
                    title="LOQ (Limit of Quantification)"
                    formula="LOQ = 10 × σ ÷ S"
                    fields={[
                      { key: "sigma", label: "σ (SD of blank)" },
                      { key: "slope", label: "S (Slope)" },
                    ]}
                    calculate={(v) => {
                      const sigma = Number.parseFloat(v.sigma);
                      const slope = Number.parseFloat(v.slope);
                      if (
                        Number.isNaN(sigma) ||
                        Number.isNaN(slope) ||
                        slope === 0
                      )
                        return "Error";
                      return ((10 * sigma) / slope).toPrecision(6);
                    }}
                    onAddHistory={addToHistory}
                    ocidPrefix="pharma.loq"
                  />
                  <FormulaCard
                    title="Recovery %"
                    formula="(Found ÷ Spiked) × 100"
                    fields={[
                      { key: "found", label: "Found Amount" },
                      { key: "spiked", label: "Spiked Amount" },
                    ]}
                    calculate={(v) => {
                      const f = Number.parseFloat(v.found);
                      const s = Number.parseFloat(v.spiked);
                      if (Number.isNaN(f) || Number.isNaN(s) || s === 0)
                        return "Error";
                      return ((f / s) * 100).toPrecision(6);
                    }}
                    resultUnit="%"
                    onAddHistory={addToHistory}
                    ocidPrefix="pharma.recovery"
                  />
                  <FormulaCard
                    title="Assay %"
                    formula="(Found ÷ Label Claim) × 100"
                    fields={[
                      { key: "found", label: "Found Concentration" },
                      { key: "claim", label: "Label Claim" },
                    ]}
                    calculate={(v) => {
                      const f = Number.parseFloat(v.found);
                      const c = Number.parseFloat(v.claim);
                      if (Number.isNaN(f) || Number.isNaN(c) || c === 0)
                        return "Error";
                      return ((f / c) * 100).toPrecision(6);
                    }}
                    resultUnit="%"
                    onAddHistory={addToHistory}
                    ocidPrefix="pharma.assay"
                  />
                  <FormulaCard
                    title="Potency %"
                    formula="(Observed ÷ Theoretical) × 100"
                    fields={[
                      { key: "observed", label: "Observed Activity" },
                      { key: "theoretical", label: "Theoretical Activity" },
                    ]}
                    calculate={(v) => {
                      const o = Number.parseFloat(v.observed);
                      const t = Number.parseFloat(v.theoretical);
                      if (Number.isNaN(o) || Number.isNaN(t) || t === 0)
                        return "Error";
                      return ((o / t) * 100).toPrecision(6);
                    }}
                    resultUnit="%"
                    onAddHistory={addToHistory}
                    ocidPrefix="pharma.potency"
                  />
                  <ContentUniformityCard onAddHistory={addToHistory} />
                  <FormulaCard
                    title="API Yield %"
                    formula="(Actual ÷ Theoretical) × 100"
                    fields={[
                      { key: "actual", label: "Actual Yield" },
                      { key: "theoretical", label: "Theoretical Yield" },
                    ]}
                    calculate={(v) => {
                      const a = Number.parseFloat(v.actual);
                      const t = Number.parseFloat(v.theoretical);
                      if (Number.isNaN(a) || Number.isNaN(t) || t === 0)
                        return "Error";
                      return ((a / t) * 100).toPrecision(6);
                    }}
                    resultUnit="%"
                    onAddHistory={addToHistory}
                    ocidPrefix="pharma.apiyield"
                  />
                  <FormulaCard
                    title="Dilution Factor"
                    formula="Final Volume ÷ Aliquot Volume"
                    fields={[
                      { key: "final", label: "Final Volume (mL)" },
                      { key: "aliquot", label: "Aliquot Volume (mL)" },
                    ]}
                    calculate={(v) => {
                      const f = Number.parseFloat(v.final);
                      const a = Number.parseFloat(v.aliquot);
                      if (Number.isNaN(f) || Number.isNaN(a) || a === 0)
                        return "Error";
                      return (f / a).toPrecision(6);
                    }}
                    resultLabel="DF"
                    onAddHistory={addToHistory}
                    ocidPrefix="pharma.dilution_factor"
                  />
                  <FormulaCard
                    title="Dissolution Efficiency"
                    formula="AUC ÷ (t × 100)"
                    fields={[
                      { key: "auc", label: "AUC" },
                      { key: "time", label: "Time (min)" },
                    ]}
                    calculate={(v) => {
                      const auc = Number.parseFloat(v.auc);
                      const t = Number.parseFloat(v.time);
                      if (Number.isNaN(auc) || Number.isNaN(t) || t === 0)
                        return "Error";
                      return (auc / (t * 100)).toPrecision(6);
                    }}
                    resultUnit="%"
                    onAddHistory={addToHistory}
                    ocidPrefix="pharma.dissolution"
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
