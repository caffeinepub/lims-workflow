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
import { ChevronDown, User } from "lucide-react";
import React from "react";
import { useRole } from "../contexts/RoleContext";
import { DUMMY_USERS, DummyUser } from "../lib/mockData";

const roleColors: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700",
  qa: "bg-blue-100 text-blue-700",
  sectionInCharge: "bg-amber-100 text-amber-700",
  analyst: "bg-emerald-100 text-emerald-700",
};

const roleLabels: Record<string, string> = {
  admin: "Admin",
  qa: "QA Director",
  sectionInCharge: "Section In-Charge",
  analyst: "Analyst",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function RoleSwitcher() {
  const { activeUser, setActiveUser } = useRole();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 h-auto py-1.5 px-2 hover:bg-sidebar-accent"
        >
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs bg-sidebar-primary text-sidebar-primary-foreground font-semibold">
              {getInitials(activeUser.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start min-w-0">
            <span className="text-xs font-semibold text-sidebar-foreground truncate max-w-[120px]">
              {activeUser.name}
            </span>
            <span className="text-[10px] text-sidebar-foreground/60 truncate max-w-[120px]">
              {roleLabels[activeUser.role]}
            </span>
          </div>
          <ChevronDown className="h-3 w-3 text-sidebar-foreground/50 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Switch User (Demo)
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {DUMMY_USERS.map((user) => (
          <DropdownMenuItem
            key={user.id}
            onClick={() => setActiveUser(user)}
            className={`flex items-center gap-3 cursor-pointer ${activeUser.id === user.id ? "bg-accent" : ""}`}
          >
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate">{user.name}</span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full w-fit mt-0.5 font-medium ${roleColors[user.role]}`}
              >
                {roleLabels[user.role]}
              </span>
            </div>
            {activeUser.id === user.id && (
              <div className="ml-auto h-2 w-2 rounded-full bg-primary shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
