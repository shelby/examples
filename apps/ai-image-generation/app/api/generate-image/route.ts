import { type NextRequest, NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface OpenAIImageResponse {
  data?: { b64_json?: string; url?: string }[];
}

async function genWithOpenAI(prompt: string): Promise<Buffer> {
  if (!OPENAI_API_KEY) throw new Error("Set OPENAI_API_KEY");

  const resp = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: "dall-e-3", prompt, size: "1024x1024" }),
  });

  const json = (await resp.json()) as OpenAIImageResponse;
  const data = json.data?.[0];

  if (data?.b64_json) {
    return Buffer.from(data.b64_json, "base64");
  }

  if (data?.url) {
    const img = await fetch(data.url);
    if (!img.ok)
      throw new Error(`Failed to fetch image from OpenAI URL: ${img.status}`);
    return Buffer.from(await img.arrayBuffer());
  }

  throw new Error(`Unexpected OpenAI image response: ${JSON.stringify(json)}`);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const prompt = String(body?.prompt || "");

    if (!prompt) {
      return NextResponse.json({ error: "prompt required" }, { status: 400 });
    }

    const imageBuffer = await genWithOpenAI(prompt);

    return new NextResponse(new Uint8Array(imageBuffer), {
      headers: {
        "Content-Type": "image/png",
        "Content-Length": imageBuffer.length.toString(),
      },
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message || "generation failed" },
      { status: 500 },
    );
  }
}
