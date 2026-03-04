import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "@tanstack/react-router";
import { Bell, CheckCheck, Circle, ExternalLink } from "lucide-react";
import React from "react";
import { useRole } from "../contexts/RoleContext";

export function Notifications() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useRole();

  const sorted = [...notifications].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  const formatTime = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notifications
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-red-500 text-white text-xs font-bold">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="page-subtitle">
            {unreadCount} unread of {notifications.length} total
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            className="gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            Mark All as Read
          </Button>
        )}
      </div>

      {sorted.length === 0 ? (
        <Card className="lims-card">
          <CardContent className="p-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">
              No notifications
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sorted.map((notif) => (
            <button
              type="button"
              key={notif.id}
              onClick={() => {
                markAsRead(notif.id);
                if (notif.link) navigate({ to: notif.link as "/" });
              }}
              className={`w-full flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/30 text-left ${
                !notif.isRead
                  ? "bg-primary/5 border-primary/20"
                  : "bg-card border-border"
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {!notif.isRead ? (
                  <Circle className="h-2.5 w-2.5 fill-primary text-primary" />
                ) : (
                  <Circle className="h-2.5 w-2.5 text-muted-foreground/30" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm leading-snug ${!notif.isRead ? "font-medium text-foreground" : "text-muted-foreground"}`}
                >
                  {notif.message}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatTime(notif.timestamp)}
                </p>
              </div>
              {notif.link && (
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 mt-0.5" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
