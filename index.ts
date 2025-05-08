import "dotenv/config";
import express, { Express, Request, Response } from "express";
import { agentBuilder } from "./agent";

const app: Express = express();
app.use(express.json());

async function startServer() {
  try {
    // Set up basic Express route
    // curl -X GET http://localhost:3000/
    app.get("/", (req: Request, res: Response) => {
      res.send("LangGraph Agent Server");
    });

    // API endpoint to start a new conversation
    // curl -X POST -H "Content-Type: application/json" -d '{"message": "Build a team to make an iOS app, and tell me the talent gaps."}' http://localhost:3000/chat
    app.post("/chat", async (req: Request, res: Response) => {
      try {
        // const response = await callAgent(client, initialMessage, threadId);
        // Invoke
        const prompt = req.body.prompt;
        const messages = [
          {
            role: "user",
            content: prompt,
          },
        ];
        const result = await agentBuilder.invoke({ messages });

        const lastMsg = result.messages[result.messages.length - 1];
        res.json({
          success: true,
          result: result.components,
        });
      } catch (error) {
        console.error("Error starting conversation:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
}

startServer();
