import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  try {
    const { prompt, response_json_schema } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "prompt is required" },
        { status: 400 }
      );
    }

    const systemMessage = response_json_schema
      ? `You are an AI performance analyst. You MUST respond with valid JSON matching this exact schema:\n${JSON.stringify(response_json_schema, null, 2)}\n\nRespond ONLY with the JSON object. No markdown, no code fences, no extra text.`
      : "You are an AI performance analyst. Respond with valid JSON only.";

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      system: systemMessage,
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const rawText = textBlock?.text || "{}";

    // Parse the JSON response, stripping any markdown code fences if present
    let cleaned = rawText.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }

    const parsed = JSON.parse(cleaned);
    return NextResponse.json(parsed);
  } catch (error: unknown) {
    console.error("AI recommendations error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
