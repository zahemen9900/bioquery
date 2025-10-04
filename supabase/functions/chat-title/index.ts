import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.47.6"

export {}

const { serve } = await import("https://deno.land/std@0.224.0/http/server.ts")
const { GoogleGenAI } = await import("npm:@google/genai")
const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.47.6")

const getEnv = (key: string): string | undefined => {
  const deno = (globalThis as { Deno?: { env: { get(name: string): string | undefined } } }).Deno
  return deno?.env.get(key)
}

type ChatTitleRequestBody = {
  message?: string
}

type ChatTitleResponse = {
  title: string
  didFallback: boolean
}

const SUPABASE_URL = getEnv("SUPABASE_URL")
const SUPABASE_ANON_KEY = getEnv("SUPABASE_ANON_KEY")
const GEMINI_API_KEY = getEnv("GEMINI_API_KEY")

const createSupabaseClient = createClient as unknown as (
  url: string,
  key: string,
  options?: {
    global?: {
      headers?: Record<string, string>
    }
  },
) => SupabaseClient

type GeminiModelClient = {
  models: {
    generateContent(options: {
      model: string
      contents: Array<{
        role: string
        parts: Array<{ text: string }>
      }>
      config?: {
        systemInstruction?: string
      }
    }): Promise<{ text?: string }>
  }
}

const GeminiClientCtor = GoogleGenAI as unknown as new (options: { apiKey: string }) => GeminiModelClient

function sanitizeTitle(raw: string): string {
  const normalized = raw.replace(/\s+/g, " ").replace(/^["'“”‘’`]+|["'“”‘’`]+$/g, "").trim()
  const trimmed = normalized.slice(0, 80)
  return trimmed
}

async function generateTitle(prompt: string): Promise<string | null> {
  if (!GEMINI_API_KEY) {
    console.error("Missing GEMINI_API_KEY environment variable")
    return null
  }

  const ai = new GeminiClientCtor({ apiKey: GEMINI_API_KEY })

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Create a concise (max 6 words) descriptive chat title for the following user request. Respond with the title only.\nRequest: "${prompt}"`,
          },
        ],
      },
    ],
    config: {
      systemInstruction: "You are an assistant that writes short, professional chat titles without punctuation at the ends.",
    },
  })

  const candidate = typeof response?.text === "string" ? response.text : ""
  const cleaned = sanitizeTitle(candidate)
  return cleaned.length > 0 ? cleaned : null
}

function jsonResponse(payload: ChatTitleResponse, originHeader: string | null): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": originHeader ?? "*",
    },
  })
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": req.headers.get("Origin") ?? "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type",
        "Access-Control-Max-Age": "86400",
      },
    })
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 })
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return new Response(JSON.stringify({ error: "Service misconfigured" }), { status: 500 })
  }

  const origin = req.headers.get("Origin") ?? "*"

  let body: ChatTitleRequestBody
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ title: "Untitled chat", didFallback: true }, origin)
  }

  const prompt = typeof body.message === "string" ? body.message.trim() : ""
  if (!prompt) {
    return jsonResponse({ title: "Untitled chat", didFallback: true }, origin)
  }

  const authHeader = req.headers.get("Authorization")
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  const supabaseClient = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: { Authorization: authHeader },
    },
  })

  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser()

  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  try {
    const generated = await generateTitle(prompt)
    if (!generated) {
      return jsonResponse({ title: "Untitled chat", didFallback: true }, origin)
    }

    return jsonResponse({ title: generated, didFallback: false }, origin)
  } catch (error) {
    console.error("Failed to generate chat title", error)
    return jsonResponse({ title: "Untitled chat", didFallback: true }, origin)
  }
})
