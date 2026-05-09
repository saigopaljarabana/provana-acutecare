import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import OpenAI from "openai";
import { NextRequest } from "next/server";

const runtime = new CopilotRuntime();

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter: new OpenAIAdapter({
      openai: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
      model: "gpt-4o",
    }),
    endpoint: "/api/copilotkit",
  });
  return handleRequest(req);
};
