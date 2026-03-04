import { Toaster } from "@/components/ui/sonner";
import { Outlet } from "@tanstack/react-router";
import React from "react";
import { AppSidebar } from "./AppSidebar";

export function Layout() {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 ml-56 min-h-screen overflow-auto">
        <Outlet />
      </main>
      <Toaster richColors position="top-right" />
    </div>
  );
}
