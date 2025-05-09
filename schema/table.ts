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
  cells: z.array(
    z.array(
      z.object({
        id: z.string(),
        text: z.object({
          color: z.object({ default: z.string() }),
          value: z.object({ default: z.string() }),
          enabled: z.boolean(),
          fontSize: z.object({ default: z.number() }),
          alignment: z.object({ default: z.enum(["LEFT", "CENTER", "RIGHT"]) }),
        }),
        align: z.enum(["LEFT", "CENTER", "RIGHT"]),
        image: z.object({
          src: z.object({ default: z.string() }),
          enabled: z.boolean(),
        }),
        input: z.object({
          max: z.string(),
          min: z.string(),
          fill: z.string(),
          default: z.string(),
          enabled: z.boolean(),
          max_feedback_text: z.string(),
          min_feedback_text: z.string(),
          max_feedback_audio: z.string(),
          min_feedback_audio: z.string(),
        }),
        hidden: z.boolean(),
        dropdown: z.object({
          default: z.string(),
          enabled: z.boolean(),
          optionVariable: z.string(),
        }),
        tappable: z.object({
          default: z.object({ selected: z.string() }),
          enabled: z.boolean(),
        }),
        clickable: z.object({ enabled: z.boolean() }),
        fillColor: z.object({ default: z.string(), enabled: z.boolean() }),
        alignVertical: z.enum(["TOP", "CENTER", "BOTTOM"]),
        correctInputValues: z.array(z.string()),
        imageBackground: z.object({
          src: z.object({ default: z.string() }),
          enabled: z.boolean(),
        }),
      })
    )
  ),
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
