import { z } from "zod";

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.string(),
  assignee: z.string().optional(),
  due_date: z.string().optional(),
});

export type Task = z.infer<typeof TaskSchema>;

export const BoardSnapshotSchema = z.object({
  tool: z.enum(["notion", "clickup"]),
  tasks: z.array(TaskSchema),
});

export type BoardSnapshot = z.infer<typeof BoardSnapshotSchema>;

export const ProcessRequestSchema = z.object({
  transcript: z.string(),
  previous_board_snapshot: BoardSnapshotSchema,
});

export type ProcessRequest = z.infer<typeof ProcessRequestSchema>;

export const ActionItemSchema = z.object({
  title: z.string(),
  description: z.string(),
  assignee: z.string().nullable(),
  due_date: z.string().nullable(),
});

export type ActionItem = z.infer<typeof ActionItemSchema>;

export const BlockerSchema = z.object({
  description: z.string(),
  impact: z.string(),
});

export type Blocker = z.infer<typeof BlockerSchema>;

export const DecisionSchema = z.object({
  decision: z.string(),
  reasoning: z.string(),
});

export type Decision = z.infer<typeof DecisionSchema>;

export const InsightsSchema = z.object({
  summary: z.string(),
  action_items: z.array(ActionItemSchema),
  blockers: z.array(BlockerSchema),
  decisions: z.array(DecisionSchema),
});

export type Insights = z.infer<typeof InsightsSchema>;

export const ReconciliationPlanSchema = z.object({
  tool: z.enum(["notion", "clickup"]),
  adds: z.array(ActionItemSchema),
  updates: z.array(
    z.object({
      id: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      status: z.string().optional(),
      assignee: z.string().optional(),
      due_date: z.string().optional(),
      _reason: z.string().optional(),
    }),
  ),
});

export type ReconciliationPlan = z.infer<typeof ReconciliationPlanSchema>;

export const ProcessResponseSchema = z.object({
  insights: InsightsSchema,
  reconciliation_plan: ReconciliationPlanSchema,
});

export type ProcessResponse = z.infer<typeof ProcessResponseSchema>;
