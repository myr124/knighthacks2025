import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { TTXScript } from "@/lib/utils/ttxGenerator";

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function generateFacilitatorScript(script: TTXScript): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const prompt = `You are an expert emergency exercise facilitator. Your task is to generate a complete, structured facilitator guide for the following TTX (Table Top eXercise) scenario script.

**REQUIRED OUTPUT STRUCTURE:**
The guide MUST be formatted as a structured script with the following sections and content:

1.  **Scenario Overview:** A brief introduction including Type, Location, and Severity.
2.  **Module X: [Period Label]:** This section must be generated for *each* operational period provided in the input data.
    * **Period Objectives:** 1–2 objectives specific to the time/phase (e.g., "Assess initial public messaging strategy").
    * **Situation Update:** A brief, clear narrative of the current status (e.g., "The Hurricane Watch has been issued.").
    * **Inject Analysis:** For each Inject, provide a **Facilitator Script** to introduce the information and the **Key Learning Point** (e.g., "This inject tests our communication channel reliability.").
3.  **Closing Remarks:** Wrap-up script leading into the Hot Wash/After Action Review (AAR) discussion.

**INPUT DATA:**

**Scenario Details:**
- Type: ${script.scenarioType}
- Location: ${script.location}
- Severity: ${script.severity}
- Population: ${script.population}

**Scenario Periods and Injects:**
${script.periods
  .map(
    (period, idx) => `
**Period ${period.periodNumber}: ${period.label}** (${period.phase})

Injects:
${
  period.injects
    ?.map(
      (inj) =>
        `- [${inj.time}] ${inj.title} (${inj.severity}): ${inj.description}`
    )
    .join("\n") || "- No injects defined"
}

EOC Actions:
${
  period.eocActions
    ?.map(
      (action) => `- [${action.time}] ${action.actionType}: ${action.details}`
    )
    .join("\n") || "- No actions defined"
}
`
  )
  .join("\n")}

Generate a detailed, practical facilitator script that will help guide this TTX exercise effectively.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    return text;
  } catch (error) {
    console.error(
      "Error generating facilitator script with Gemini API:",
      error
    );
    throw new Error("Failed to generate facilitator script");
  }
}

export async function POST(request: NextRequest) {
  try {
    const { script } = await request.json();

    if (!script) {
      return NextResponse.json(
        { error: "Missing script parameter" },
        { status: 400 }
      );
    }

    const previewText = await generateFacilitatorScript(script);

    return NextResponse.json({ previewText, script });
  } catch (error) {
    console.error("Error in augment route:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate preview",
      },
      { status: 500 }
    );
  }
}
