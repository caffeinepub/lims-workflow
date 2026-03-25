import type React from "react";
import { useEffect, useRef, useState } from "react";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface AnimatedTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
}

export function AnimatedTabs({
  tabs,
  activeTab,
  onTabChange,
  className = "",
}: AnimatedTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const activeIdx = tabs.findIndex((t) => t.id === activeTab);
    const btn = tabRefs.current[activeIdx];
    if (btn && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      setIndicator({
        left: btnRect.left - containerRect.left,
        width: btnRect.width,
      });
    }
  }, [activeTab, tabs]);

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center gap-1 ${className}`}
      role="tablist"
    >
      {tabs.map((tab, idx) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[idx] = el;
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            className={`
              relative flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full
              transition-all duration-200 whitespace-nowrap select-none
              ${
                isActive
                  ? "text-white"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }
            `}
            style={isActive ? { background: "rgb(11, 54, 77)" } : {}}
          >
            {tab.icon && (
              <span className="flex-shrink-0 opacity-80">{tab.icon}</span>
            )}
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`ml-0.5 text-[10px] px-1.5 py-0 rounded-full font-medium ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
      {/* Animated underline indicator */}
      <span
        className="absolute bottom-0 h-0.5 rounded-full transition-all duration-300 ease-in-out pointer-events-none"
        style={{
          left: indicator.left,
          width: indicator.width,
          background: "rgb(11, 54, 77)",
        }}
      />
    </div>
  );
}
