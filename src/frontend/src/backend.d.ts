import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type TestSpecID = bigint;
export interface EligibilityVoteValuation {
    isEligible: boolean;
    votes: VerifyEligibilityDecisions;
    comments: string;
}
export interface SicReview {
    decision: boolean;
    flaggedRows: Array<bigint>;
    reviewerName: string;
    comments: string;
}
export interface User {
    principal: Principal;
    name: string;
    role: UserRole;
    isActive: boolean;
}
export interface Task {
    deadline: bigint;
    taskType: TaskType;
    taskId: string;
    assignedRole: UserRole;
    sampleId: string;
}
export interface Sample {
    rfa: {
        sampleDetails: bigint;
        registration: bigint;
        billing: bigint;
    };
    clientName: string;
    qaReview?: QaReview;
    sampleStatus: SampleStatus;
    testSpecs: Array<TestSpecification>;
    testName: string;
    sampleName: string;
    sicReview?: SicReview;
    dateReceived: bigint;
    sampleId: string;
    registrationId: bigint;
    analysisResults: Array<AnalysisResult>;
}
export interface QaReview {
    decision: boolean;
    comments: string;
    qaHeadName: string;
}
export interface TestMaster {
    status: Variant_active_inactive;
    testName: string;
    testType: string;
    parameters: Array<TestParameter>;
    daysRequired: bigint;
}
export type SampleStatus = {
    __kind__: "review";
    review: null;
} | {
    __kind__: "pending";
    pending: null;
} | {
    __kind__: "hold";
    hold: string;
} | {
    __kind__: "completed";
    completed: null;
} | {
    __kind__: "eligible";
    eligible: null;
} | {
    __kind__: "analysis";
    analysis: null;
};
export type ClientID = bigint;
export interface TestSpecification {
    method: string;
    parameter: string;
    targetSLA: bigint;
    acceptanceCriteria: string;
    referenceStandard: string;
    assignedAnalyst: string;
}
export interface COAValue {
    qaEmployee: string;
    verificationEmployee: string;
    registrationNumber: bigint;
    issuedDateTime: bigint;
    sicEmployee: string;
    sampleIntakeEmployee: string;
    coaNumber: bigint;
}
export type SampleID = string;
export type TestMasterID = bigint;
export interface Notification {
    isRead: boolean;
    message: string;
    timestamp: bigint;
    notificationId: string;
}
export interface VerifyEligibilityDecision {
    decision: boolean;
    userId: Principal;
}
export interface TestParameter {
    minValue: bigint;
    name: string;
    unit: string;
    acceptanceCriteria: string;
    maxValue: bigint;
}
export interface Client {
    city: string;
    name: string;
    contactPerson: string;
    email: string;
    address: string;
    pinCode: string;
    phone: string;
}
export interface AnalysisResult {
    remark: string;
    parameter: string;
    unit: string;
    verdict: Variant_oos_fail_pass;
    observedValue: string;
}
export type VerifyEligibilityDecisions = Array<VerifyEligibilityDecision>;
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
export enum Variant_active_inactive {
    active = "active",
    inactive = "inactive"
}
export enum Variant_oos_fail_pass {
    oos = "oos",
    fail = "fail",
    pass = "pass"
}
export interface backendInterface {
    addClient(client: Client): Promise<bigint>;
    addTestMaster(testMaster: TestMaster): Promise<bigint>;
    assignAnalyst(sampleId: string, analystName: string): Promise<void>;
    approveQAReview(sampleId: string): Promise<void>;
    approveSICReview(sampleId: string): Promise<void>;
    completeTask(taskId: string): Promise<void>;
    createSample(sample: Sample): Promise<SampleID>;
    createUser(name: string, role: UserRole): Promise<void>;
    deleteClient(clientId: ClientID): Promise<void>;
    findCoa(sampleId: SampleID): Promise<COAValue>;
    findEligibilityVote(sampleId: SampleID): Promise<EligibilityVoteValuation>;
    findTasks(taskId: string): Promise<Task>;
    generateRegistrationNumber(year: bigint, month: bigint): Promise<string>;
    getAllTasks(): Promise<Array<Task>>;
    getAnalysisResult(sampleId: string): Promise<Array<AnalysisResult>>;
    getClientSamples(clientId: Principal): Promise<Array<string>>;
    getCOABySampleId(sampleId: string): Promise<COAValue | null>;
    getCompletedTasks(): Promise<Array<[string, Task]>>;
    getEligibilityVote(sampleId: SampleID): Promise<{
        isEligible: boolean;
        votes: VerifyEligibilityDecisions;
        comments: string;
    }>;
    getNotifications(userId: string): Promise<Array<Notification>>;
    getQAReview(sampleId: string): Promise<QaReview | null>;
    getSample(sampleId: SampleID): Promise<Sample>;
    getSICReview(sampleId: string): Promise<SicReview | null>;
    getSortedTasksByDeadline(): Promise<Array<[string, Task]>>;
    getTask(taskId: string): Promise<Task>;
    getTasks(): Promise<Array<[string, Task]>>;
    getTestSpec(sampleId: string): Promise<Array<TestSpecification>>;
    getTestSpecIds(): Promise<Array<TestSpecID>>;
    getUser(): Promise<User | null>;
    issueCOA(sampleId: string, coa: COAValue): Promise<void>;
    listSamples(): Promise<Array<Sample>>;
    loadClientById(clientId: ClientID): Promise<Client>;
    loadTestMaster(testMasterId: TestMasterID): Promise<TestMaster>;
    markNotificationAsRead(userId: string, notificationId: string): Promise<void>;
    rejectQAReview(sampleId: string): Promise<void>;
    rejectSICReview(sampleId: string): Promise<void>;
    removeTask(taskId: string): Promise<void>;
    saveAnalysisResult(sampleId: string, results: Array<AnalysisResult>): Promise<void>;
    saveSICReview(sampleId: string, review: SicReview): Promise<void>;
    saveTestSpec(sampleId: string, testSpecs: Array<TestSpecification>): Promise<void>;
    saveQAReview(sampleId: string, review: QaReview): Promise<void>;
    sendNotification(userId: string, message: string): Promise<void>;
    submitAnalysis(sampleId: string): Promise<void>;
    submitEligibilityVote(sampleId: SampleID, isEligible: boolean, comments: string, votes: VerifyEligibilityDecisions): Promise<EligibilityVoteValuation>;
    updateClient(clientId: ClientID, client: Client): Promise<void>;
    updateSample(sampleId: SampleID, stage: string): Promise<void>;
    workflowCheckDataType(name: string, value: bigint): Promise<User>;
}
