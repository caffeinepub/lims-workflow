/**
 * Backend service hooks — wraps all backend API calls with React Query.
 * These hooks are used alongside mock data for graceful degradation.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AnalysisResult,
  Client,
  EligibilityVoteValuation,
  QaReview,
  Sample,
  SampleID,
  SicReview,
  TestMaster,
  TestSpecification,
  UserRole,
  VerifyEligibilityDecisions,
} from "../backend";
import { useActor } from "./useActor";

/** Helper: get sampleId list from localStorage */
const LS_KEY = "lims_sample_ids";
export function getStoredSampleIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
  } catch {
    return [];
  }
}
export function storeSampleId(id: string) {
  const ids = getStoredSampleIds();
  if (!ids.includes(id)) {
    ids.push(id);
    localStorage.setItem(LS_KEY, JSON.stringify(ids));
  }
}

/** Helper: build a SampleStatus variant */
export function makeSampleStatus(
  kind: "pending" | "eligible" | "hold" | "analysis" | "review" | "completed",
  holdReason = "",
) {
  if (kind === "hold") return { __kind__: "hold" as const, hold: holdReason };
  if (kind === "eligible")
    return { __kind__: "eligible" as const, eligible: null };
  if (kind === "analysis")
    return { __kind__: "analysis" as const, analysis: null };
  if (kind === "review") return { __kind__: "review" as const, review: null };
  if (kind === "completed")
    return { __kind__: "completed" as const, completed: null };
  return { __kind__: "pending" as const, pending: null };
}

/** Build a minimal Sample object for createSample */
export function buildSamplePayload(opts: {
  sampleId: string;
  sampleName: string;
  clientName: string;
  testName?: string;
}): Sample {
  return {
    sampleId: opts.sampleId,
    sampleName: opts.sampleName,
    clientName: opts.clientName,
    testName: opts.testName ?? "General Analysis",
    sampleStatus: makeSampleStatus("pending"),
    dateReceived: BigInt(Date.now()),
    registrationId: BigInt(0),
    testSpecs: [],
    analysisResults: [],
    sicReview: undefined,
    qaReview: undefined,
    rfa: {
      sampleDetails: BigInt(0),
      registration: BigInt(0),
      billing: BigInt(0),
    },
  };
}

// ─── React Query hooks ────────────────────────────────────────────────────────

/** Get all tasks from backend */
export function useAllTasks() {
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

/** Get a single sample from backend */
export function useGetSample(sampleId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["sample", sampleId],
    queryFn: async () => {
      if (!actor || !sampleId) return null;
      try {
        return await actor.getSample(sampleId);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!sampleId,
  });
}

/** Get eligibility vote for a sample */
export function useGetEligibilityVote(sampleId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["eligibility", sampleId],
    queryFn: async () => {
      if (!actor || !sampleId) return null;
      try {
        return await actor.findEligibilityVote(sampleId);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!sampleId,
  });
}

/** Get COA for a sample */
export function useGetCoa(sampleId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["coa", sampleId],
    queryFn: async () => {
      if (!actor || !sampleId) return null;
      try {
        return await actor.findCoa(sampleId);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!sampleId,
  });
}

/** Create a new sample in backend */
export function useCreateSample() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sample: Sample): Promise<SampleID> => {
      if (!actor) throw new Error("No actor");
      const id = await actor.createSample(sample);
      storeSampleId(id);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

/** Update sample stage in backend */
export function useUpdateSample() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sampleId,
      stage,
    }: { sampleId: string; stage: string }) => {
      if (!actor) throw new Error("No actor");
      await actor.updateSample(sampleId, stage);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["sample", vars.sampleId] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

/** Submit eligibility vote */
export function useSubmitEligibilityVote() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      sampleId: string;
      isEligible: boolean;
      comments: string;
      votes: VerifyEligibilityDecisions;
    }): Promise<EligibilityVoteValuation> => {
      if (!actor) throw new Error("No actor");
      return actor.submitEligibilityVote(
        args.sampleId,
        args.isEligible,
        args.comments,
        args.votes,
      );
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["eligibility", vars.sampleId] });
    },
  });
}

/** Add a client to backend */
export function useAddClient() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (client: Client): Promise<bigint> => {
      if (!actor) throw new Error("No actor");
      return actor.addClient(client);
    },
  });
}

/** Update a client in backend */
export function useUpdateClient() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      clientId,
      client,
    }: { clientId: bigint; client: Client }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateClient(clientId, client);
    },
  });
}

/** Delete a client from backend */
export function useDeleteClient() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (clientId: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteClient(clientId);
    },
  });
}

/** Add a test master to backend */
export function useAddTestMaster() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (testMaster: TestMaster): Promise<bigint> => {
      if (!actor) throw new Error("No actor");
      return actor.addTestMaster(testMaster);
    },
  });
}

/** Map UserRole to backend UserRole enum */
export function mapUserRole(role: string): UserRole {
  const map: Record<string, UserRole> = {
    admin: "admin" as unknown as UserRole,
    qa: "qa" as unknown as UserRole,
    sectionInCharge: "sectionInCharge" as unknown as UserRole,
    analyst: "analyst" as unknown as UserRole,
  };
  return map[role] ?? ("analyst" as unknown as UserRole);
}

/** Map analysis verdict string to backend enum */
export function mapVerdict(
  v: string,
): import("../backend").Variant_oos_fail_pass {
  const { Variant_oos_fail_pass } = require("../backend");
  if (v === "PASS" || v === "pass") return Variant_oos_fail_pass.pass;
  if (v === "FAIL" || v === "fail") return Variant_oos_fail_pass.fail;
  return Variant_oos_fail_pass.oos;
}

/** Build TestSpecification[] from local TestSpecRow[] */
export function buildTestSpecs(
  rows: Array<{
    parameter: string;
    acceptanceCriteria: string;
    methodSop: string;
    referenceStandard: string;
    assignedAnalyst: string;
    targetSla: string;
  }>,
): TestSpecification[] {
  return rows.map((r) => ({
    parameter: r.parameter,
    acceptanceCriteria: r.acceptanceCriteria,
    method: r.methodSop,
    referenceStandard: r.referenceStandard,
    assignedAnalyst: r.assignedAnalyst,
    targetSLA: BigInt(0),
  }));
}

/** Build AnalysisResult[] from local AnalysisResultRow[] */
export function buildAnalysisResults(
  rows: Array<{
    parameter: string;
    observedValue: string;
    unit: string;
    verdict: string;
    remarks: string;
  }>,
): AnalysisResult[] {
  const map: Record<string, import("../backend").Variant_oos_fail_pass> = {
    PASS: "pass" as unknown as import("../backend").Variant_oos_fail_pass,
    pass: "pass" as unknown as import("../backend").Variant_oos_fail_pass,
    FAIL: "fail" as unknown as import("../backend").Variant_oos_fail_pass,
    fail: "fail" as unknown as import("../backend").Variant_oos_fail_pass,
    OOS: "oos" as unknown as import("../backend").Variant_oos_fail_pass,
    oos: "oos" as unknown as import("../backend").Variant_oos_fail_pass,
  };
  return rows.map((r) => ({
    parameter: r.parameter,
    observedValue: r.observedValue,
    unit: r.unit,
    verdict:
      map[r.verdict] ??
      ("pass" as unknown as import("../backend").Variant_oos_fail_pass),
    remark: r.remarks ?? "",
  }));
}

/** Build SicReview from local data */
export function buildSicReview(opts: {
  reviewerName: string;
  decision: boolean;
  comments: string;
  flaggedRows?: number[];
}): SicReview {
  return {
    reviewerName: opts.reviewerName,
    decision: opts.decision,
    comments: opts.comments,
    flaggedRows: (opts.flaggedRows ?? []).map(BigInt),
  };
}

/** Build QaReview from local data */
export function buildQaReview(opts: {
  qaHeadName: string;
  decision: boolean;
  comments: string;
}): QaReview {
  return {
    qaHeadName: opts.qaHeadName,
    decision: opts.decision,
    comments: opts.comments,
  };
}
