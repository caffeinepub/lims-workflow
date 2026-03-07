import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import {
  ALL_NOTIFICATIONS,
  DUMMY_USERS,
  type DummyUser,
  MOCK_TASKS,
  type NotificationRecord,
  type TaskRecord,
} from "../lib/mockData";

interface RoleContextType {
  activeUser: DummyUser;
  setActiveUser: (user: DummyUser) => void;
  notifications: NotificationRecord[];
  unreadCount: number;
  markAsRead: (notifId: string) => void;
  markAllAsRead: () => void;
  tasks: TaskRecord[];
  pendingTaskCount: number;
  sessionSeconds: number;
  uptimeSeconds: number;
  logout: () => void;
  loginTime: Date;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

// App start time (constant across re-renders)
const APP_START_TIME = new Date();

export function RoleProvider({ children }: { children: ReactNode }) {
  const [activeUser, setActiveUserState] = useState<DummyUser>(DUMMY_USERS[0]);
  const [notificationsState, setNotificationsState] =
    useState<NotificationRecord[]>(ALL_NOTIFICATIONS);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [uptimeSeconds, setUptimeSeconds] = useState(0);
  const [loginTime, setLoginTime] = useState<Date>(new Date());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const userNotifications = notificationsState.filter(
    (n) => n.userId === activeUser.id,
  );
  const unreadCount = userNotifications.filter((n) => !n.isRead).length;

  const userTasks = MOCK_TASKS.filter((t) => {
    if (activeUser.role === "admin") return true;
    if (activeUser.role === "qa") return t.assignedRole === "qa";
    if (activeUser.role === "sectionInCharge")
      return (
        t.assignedRole === "sectionInCharge" &&
        t.assignedUserId === activeUser.id
      );
    if (activeUser.role === "analyst")
      return t.assignedRole === "analyst" && t.assignedUserId === activeUser.id;
    return false;
  });

  // Tick every second
  useEffect(() => {
    timerRef.current = setInterval(() => {
      const now = new Date();
      setUptimeSeconds(
        Math.floor((now.getTime() - APP_START_TIME.getTime()) / 1000),
      );
      setSessionSeconds((s) => s + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const setActiveUser = (user: DummyUser) => {
    setActiveUserState(user);
    // Reset session timer when switching user (simulate new login)
    setSessionSeconds(0);
    setLoginTime(new Date());
  };

  const logout = () => {
    // Reset to first user and clear session (demo behaviour)
    setActiveUserState(DUMMY_USERS[0]);
    setSessionSeconds(0);
    setLoginTime(new Date());
  };

  const markAsRead = (notifId: string) => {
    setNotificationsState((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n)),
    );
  };

  const markAllAsRead = () => {
    setNotificationsState((prev) =>
      prev.map((n) =>
        n.userId === activeUser.id ? { ...n, isRead: true } : n,
      ),
    );
  };

  return (
    <RoleContext.Provider
      value={{
        activeUser,
        setActiveUser,
        notifications: userNotifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        tasks: userTasks,
        pendingTaskCount: userTasks.length,
        sessionSeconds,
        uptimeSeconds,
        logout,
        loginTime,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
