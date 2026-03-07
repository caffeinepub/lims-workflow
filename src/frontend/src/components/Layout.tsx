import { Toaster } from "@/components/ui/sonner";
import { Outlet } from "@tanstack/react-router";
import React from "react";
import { AppSidebar } from "./AppSidebar";
import { TopHeader } from "./TopHeader";

export function Layout() {
  return (
    <div
      className="flex min-h-screen relative"
      style={{ background: "#F9FAFB" }}
    >
      {/* Full-page DKR LIMS watermark */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        aria-hidden="true"
        style={{
          backgroundImage:
            "url('/assets/generated/dkr-lims-watermark-transparent.dim_800x800.png')",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center center",
          backgroundSize: "60%",
          opacity: 0.04,
        }}
      />
      <AppSidebar />
      {/* Right column: header + page content */}
      <div className="flex-1 ml-56 flex flex-col min-h-screen relative z-10">
        <TopHeader />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}
