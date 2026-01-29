import { type NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";

const openaiClient = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

async function genWithOpenAI(prompt: string): Promise<Buffer> {
  if (!OPENAI_API_KEY) throw new Error("Set OPENAI_API_KEY");

  const response = await openaiClient.images.generate({
    model: "dall-e-3",
    prompt: prompt,
    size: "1024x1024",
    response_format: "b64_json",
    n: 1,
  });

  if (!response.data) {
    throw new Error("No image data received from OpenAI");
  }

  const imageData = response.data[0];

  if (!imageData.b64_json) {
    throw new Error("No base64 image data received from OpenAI");
  }

  return Buffer.from(imageData.b64_json, "base64");
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
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "generation failed" },
      { status: 500 },
    );
  }
}
