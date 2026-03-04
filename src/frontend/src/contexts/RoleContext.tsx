import React, {
  createContext,
  useContext,
  useState,
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
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [activeUser, setActiveUserState] = useState<DummyUser>(DUMMY_USERS[0]);
  const [notificationsState, setNotificationsState] =
    useState<NotificationRecord[]>(ALL_NOTIFICATIONS);

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

  const setActiveUser = (user: DummyUser) => {
    setActiveUserState(user);
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
