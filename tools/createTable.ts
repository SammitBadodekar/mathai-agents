import { SystemMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import {
  cellPrompt,
  evaluationPrompt,
  tablePrompt,
  tappablePrompt,
} from "../prompts/table";
import { llm } from "../agent";
import { z } from "zod";
import {
  cellSchema,
  evaluationSchema,
  tableSchema,
  tappableSchema,
} from "../schema/table";
import { rag_table_response } from "../simuilated_rag/table";

export const CreateTable = tool(
  async ({ requirements }) => {
    console.log("create table called");
    let table: any = { cells: [] };

    const featureResp = await llm.withStructuredOutput(tableSchema).invoke([
      new SystemMessage({
        content: `
        ${tablePrompt}
        Requirements: ${requirements}`,
      }),
    ]);

    if (featureResp.cells.length > 0) {
      table.cells = featureResp.cells;
    }

    let tableData: any = {};
    console.log("here in cells agent", featureResp.steps);
    for (const step of featureResp.steps) {
      switch (step.agent) {
        case "CellsAgent": {
          const cellResp = await CreateCells.invoke({
            description: step.description,
          });

          const transformFn = new Function(
            "data",
            `{ return (${cellResp.function})(data)}`
          );

          // Transform the data using the function
          const processedData = transformFn(table.cells);

          tableData.cells = processedData;
          table = {
            ...table,
            tableData,
          };
          break;
        }
        case "TappableAgent": {
          const tappable = await CreateTappable.invoke({
            description: step.description,
          });
          tableData.tappable = tappable;
          table = {
            ...table,
            tableData,
          };
          break;
        }
        case "EvaluationAgent": {
          console.log("here in evaluation agent");
          const evaluation = await CreateEvaluation.invoke({
            description: step.description,
          });
          tableData.evaluation = evaluation;
          table = {
            ...table,
            tableData,
          };
          break;
        }
      }
    }

    console.log("featureResp", table);

    return table;
  },
  {
    name: "CreateTable",
    description:
      "Generates a table component, it includes sub components like cells, tappable,etc",
    schema: z.object({
      requirements: z.string().describe("exact requirements mentioned by user"),
    }),
  }
);

export const CreateCells = tool(
  async ({ description }: { description: string }) => {
    const cellResp = await llm.withStructuredOutput(cellSchema).invoke([
      new SystemMessage({
        content: `
        ${cellPrompt}
        ${description}

        example output for cells with similar requirements: 
        ${JSON.stringify(rag_table_response.cells)}
        `,
      }),
    ]);
    return cellResp;
  },
  {
    name: "CreateCells",
    description: "Generates cells for the table",
    schema: z.object({
      description: z.string().describe("description of cells"),
    }),
  }
);

export const CreateTappable = tool(
  async ({ description }: { description: string }) => {
    const tappableResp = await llm.withStructuredOutput(tappableSchema).invoke([
      new SystemMessage({
        content: `
        ${tappablePrompt}
        ${description}

        example output for tappable with similar requirements:
        ${JSON.stringify(rag_table_response.tappable)}
        `,
      }),
    ]);
    return tappableResp;
  },
  {
    name: "CreateTappable",
    description: "Generates tappable config for the table",
    schema: z.object({
      description: z.string().describe("description of tappable"),
    }),
  }
);

export const CreateEvaluation = tool(
  async ({ description }: { description: string }) => {
    const tappableResp = await llm
      .withStructuredOutput(evaluationSchema)
      .invoke([
        new SystemMessage({
          content: `
        ${evaluationPrompt}
        ${description}

        example output for evaluation with similar requirements:
        ${JSON.stringify(rag_table_response.evaluation)}
        `,
        }),
      ]);
    return tappableResp;
  },
  {
    name: "CreateEvaluation",
    description: "Generates evaluation config for the table",
    schema: z.object({
      description: z.string().describe("description of evaluation logic"),
    }),
  }
);
