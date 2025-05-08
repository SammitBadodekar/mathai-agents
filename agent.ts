import "dotenv/config";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { Annotation, StateGraph } from "@langchain/langgraph";
import { BaseMessage, SystemMessage } from "@langchain/core/messages";
import { CreateTable } from "./tools/createTable";

// 1. Initialize LLM
export const llm = new ChatOpenAI({ model: "o4-mini" });

const GraphAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (currentState, updateValue) => currentState.concat(updateValue),
    default: () => [],
  }),
  plan: Annotation<string>(),
  nextIndex: Annotation<number>(),
  components: Annotation<any[]>(),
});

// 2. Define tools for each component
const CreateRichText = tool(
  async ({ content }) => ({ type: "rich_text", content }),
  {
    name: "CreateRichText",
    description: "Generates a rich_text component",
    schema: z.object({ content: z.string() }),
  }
);

const GetAvailableComponents = tool(async () => ["rich_text", "table"], {
  name: "GetAvailableComponents",
  description: "Returns a list of available components",
});

const tools: any = { CreateRichText, CreateTable, GetAvailableComponents };

// Planner: produce array of components to build
const planner = async (props: any) => {
  const { messages } = props;
  const userPrompt = messages[messages?.length - 1].content;
  const planPrompt = `Parse this into JSON array of tasks: [{ component: string, requirements: string }] 
  available components are ${await GetAvailableComponents.invoke("")} 
  \n ${userPrompt}`;
  const resp = await llm
    .withStructuredOutput(
      z.object({
        plan: z.array(
          z.object({ component: z.string(), requirements: z.string() })
        ),
      })
    )
    .invoke([new SystemMessage({ content: planPrompt })]);
  let plan: any[] = [];
  try {
    plan = resp.plan;
  } catch {}

  return { messages, plan, nextIndex: 0, components: [] } as any;
};

// Executor: invoke each task tool in sequence
const executor = async (props: any) => {
  const { messages, plan, nextIndex, components } = props;
  console.log("here in executor", nextIndex, plan.length, plan);
  if (nextIndex >= plan.length)
    return { messages, plan, nextIndex, components };

  const { component, requirements } = plan[nextIndex];
  const toolMap: any = { rich_text: "CreateRichText", table: "CreateTable" };
  const toolName = toolMap[component];
  if (!toolName) throw new Error(`No tool for component ${component}`);

  const args =
    component === "rich_text"
      ? { content: requirements }
      : { requirements, messages };
  const result = await tools[toolName].invoke(args);
  console.log("result of tool", result);
  return {
    messages,
    plan,
    nextIndex: nextIndex + 1,
    components: [...components, result],
  };
};

// Output: return the built components array
const output = async ({ messages, components }: any) => ({
  messages,
  output: components,
});

// Build the graph
export const agentBuilder = new StateGraph(GraphAnnotation)
  .addNode("Planner", planner)
  .addNode("Executor", executor)
  .addNode("Output", output)
  .addEdge("__start__", "Planner")
  .addEdge("Planner", "Executor")
  .addConditionalEdges(
    "Executor",
    ({ nextIndex, plan }: any) =>
      nextIndex < plan?.length ? "Executor" : "Output",
    { Executor: "Executor", Output: "Output" }
  )
  .addEdge("Output", "__end__")
  .compile();

// Example:
// const res = await agentBuilder.invoke({ messages: [{ role:'user', content:prompt }], data: {} });
// console.log(res.output);
