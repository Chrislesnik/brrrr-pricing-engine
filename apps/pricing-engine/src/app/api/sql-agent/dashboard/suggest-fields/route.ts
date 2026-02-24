import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const maxDuration = 30;

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { widget_type, sql_query, conversation } = body;

    if (!sql_query) {
      return NextResponse.json(
        { error: "sql_query is required" },
        { status: 400 }
      );
    }

    const isKpi = widget_type === "kpi";

    const conversationContext =
      Array.isArray(conversation) && conversation.length > 0
        ? `\n\nHere is the conversation between the user and the SQL agent that produced this query:\n${conversation
            .map(
              (m: { role: string; content: string }) =>
                `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`
            )
            .join("\n")}`
        : "";

    const systemPrompt = `You suggest display field values for dashboard widgets based on their SQL query and any conversation context.

Return ONLY a valid JSON object with no markdown, no code fences, no explanation. The JSON must have these exact keys:

${
  isKpi
    ? `{
  "title": "Short metric name, 2-4 words (e.g. 'Loans Funded', 'New Borrowers')",
  "subtitle": "Brief context phrase or null (e.g. 'Last 30 days')",
  "value_format": "One of: currency, integer, number, percentage",
  "trend_label": "Short trend context, 2-5 words (e.g. 'Up from last month')",
  "trend_description": "Explains the comparison period (e.g. 'vs. previous 30 days')",
  "icon": "A lucide-react icon name in PascalCase that best represents this metric (e.g. DollarSign, Users, TrendingUp, Briefcase, Building2, CreditCard, Landmark, Home, ShieldCheck, Calculator, Wallet, PiggyBank, Receipt, FileText, Globe, HandCoins, Banknote, CircleDollarSign, BadgeDollarSign, ChartLine, Activity, UserPlus, Scale, Percent)"
}`
    : `{
  "title": "Short chart name, 2-4 words (e.g. 'Deals Funded Over Time')",
  "subtitle": "Brief context phrase or null (e.g. 'Last 90 days')",
  "chart_type": "One of: area, bar, line — pick the most appropriate for this data",
  "x_axis_key": "The column name used for the x-axis (usually 'date')",
  "y_axis_key": "The column name used for the y-axis (usually 'value')"
}`
}

Be concise and professional. Infer the best values from what the SQL query does.`;

    const userMessage = `SQL Query:\n${sql_query}${conversationContext}`;

    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 512,
        temperature: 0,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[suggest-fields] Anthropic error:", errorText);
      return NextResponse.json(
        { error: `Anthropic API error: ${response.status}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    const text = result.content?.[0]?.text ?? "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    const suggestions = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("[POST /api/sql-agent/dashboard/suggest-fields]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
