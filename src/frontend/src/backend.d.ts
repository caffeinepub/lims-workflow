import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Task {
    deadline: bigint;
    taskType: TaskType;
    taskId: string;
    assignedRole: UserRole;
    sampleId: string;
}
export interface User {
    principal: Principal;
    name: string;
    role: UserRole;
    isActive: boolean;
}
export interface Notification {
    isRead: boolean;
    message: string;
    timestamp: bigint;
    notificationId: string;
}
export enum TaskType {
    coa = "coa",
    eligibilityCheck = "eligibilityCheck",
    review = "review",
    analysis = "analysis",
    sampleIntake = "sampleIntake"
}
export enum UserRole {
    qa = "qa",
    admin = "admin",
    sectionInCharge = "sectionInCharge",
    analyst = "analyst"
}
export interface backendInterface {
    completeTask(taskId: string): Promise<void>;
    createUser(name: string, role: UserRole): Promise<void>;
    getAllTasks(): Promise<Array<Task>>;
    getNotifications(userId: string): Promise<Array<Notification>>;
    getSortedTasksByDeadline(): Promise<Array<[string, Task]>>;
    getUser(): Promise<User | null>;
    markNotificationAsRead(userId: string, notificationId: string): Promise<void>;
    sendNotification(userId: string, message: string): Promise<void>;
}
