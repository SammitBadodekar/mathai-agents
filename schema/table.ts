import { z } from "zod";

export const tableSchema = z.object({
  explainerText: z.string(),
  cells: z.array(z.array(z.string())),
  interactionLogic: z.string(),
  steps: z.array(
    z.object({
      agent: z.string(),
      description: z.string(),
    })
  ),
});

export const cellSchema = z.object({
  text: z.string(),
  function: z
    .string()
    .describe("Only function no backticks and function usage"),
});

export const tappableSchema = z.object({
  name: z.string(),
  enabled: z.boolean(),
  function: z.string(),
  max_select: z.string(),
  min_select: z.string(),
  is_multiple_select: z.boolean(),
});

export const evaluationSchema = z.object({
  function: z.string(),
});
