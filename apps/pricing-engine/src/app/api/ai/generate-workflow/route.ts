import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateText } from "ai";

export const maxDuration = 30;

const SYSTEM_PROMPT = `You are a workflow automation designer. Given a user's description, generate a workflow as JSON with nodes and edges for a React Flow canvas.

Each node has:
- id: unique string (e.g. "trigger-1", "action-1", "condition-1")
- type: "trigger" | "action" | "condition"
- position: { x: number, y: number } (layout nodes vertically, triggers at top)
- data: { label: string, description: string, nodeType: same as type }

Each edge has:
- id: unique string (e.g. "edge-1")
- source: node id
- target: node id
- animated: true

Layout rules:
- Start with a trigger node at position {x: 250, y: 50}
- Each subsequent node should be ~150px below the previous
- If there's a condition (branch), offset the two paths by ~200px horizontally

Return ONLY valid JSON with this exact shape:
{
  "nodes": [...],
  "edges": [...]
}

Do not include any explanation, markdown formatting, or code fences. Return raw JSON only.`;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { prompt } = body;

    if (!prompt?.trim()) {
      return NextResponse.json(
        { error: "prompt is required" },
        { status: 400 }
      );
    }

    const result = await generateText({
      model: "openai/gpt-4o",
      system: SYSTEM_PROMPT,
      prompt: prompt.trim(),
    });

    // Parse the JSON response
    try {
      const workflow = JSON.parse(result.text);
      return NextResponse.json({ workflow });
    } catch {
      // If parsing fails, try to extract JSON from the response
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const workflow = JSON.parse(jsonMatch[0]);
          return NextResponse.json({ workflow });
        } catch {
          return NextResponse.json(
            { error: "Failed to parse AI response as workflow JSON" },
            { status: 500 }
          );
        }
      }
      return NextResponse.json(
        { error: "AI did not return valid workflow JSON" },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("[POST /api/ai/generate-workflow]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
