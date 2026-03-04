import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserRole } from "../backend";
import { useActor } from "./useActor";

// ============================================================
// Backend-connected hooks (limited to what backend supports)
// ============================================================

export function useGetAllTasks() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTasks();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetNotifications(userId: string) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["notifications", userId],
    queryFn: async () => {
      if (!actor || !userId) return [];
      return actor.getNotifications(userId);
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useMarkNotificationAsRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      notificationId,
    }: { userId: string; notificationId: string }) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.markNotificationAsRead(userId, notificationId);
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
    },
  });
}

export function useCreateUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, role }: { name: string; role: UserRole }) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.createUser(name, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
}

export function useCompleteTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.completeTask(taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
