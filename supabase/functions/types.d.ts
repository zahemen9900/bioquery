declare module "https://deno.land/std@0.224.0/http/server.ts" {
  export function serve(handler: (req: Request) => Promise<Response> | Response): void
}

declare module "https://esm.sh/@supabase/supabase-js@2.47.6" {
  export * from "@supabase/supabase-js"
}

declare module "npm:@google/genai" {
  type ChatHistoryEntry = {
    role: string
    parts: Array<{ text: string }>
  }

  type ThinkingConfig = {
    includeThoughts?: boolean
    thinkingBudget?: number
  }

  type SendMessageStreamOptions = {
    message: string
    config?: {
      thinkingConfig?: ThinkingConfig
    }
  }

  type ChatStreamChunk = {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string
          thought?: boolean
        }>
      }
    }>
  }

  export class GoogleGenAI {
    constructor(options: { apiKey: string })
    chats: {
      create(options: { model: string; history?: ChatHistoryEntry[] }): {
        sendMessageStream(options: SendMessageStreamOptions): Promise<AsyncIterable<ChatStreamChunk>>
      }
    }
    models: {
      generateContent(options: {
        model: string
        contents: ChatHistoryEntry[]
        config?: {
          systemInstruction?: string
          thinkingConfig?: ThinkingConfig
        }
      }): Promise<{ text?: string }>
    }
  }
}

declare const Deno: {
  env: {
    get(key: string): string | undefined
  }
}
