import { z } from 'zod'

export const EmotionEnum = z.enum([
  'happy',
  'sad',
  'excited',
  'concerned',
  'thinking',
  'surprised',
  'playful',
  'calm',
  'motivated',
  'tired',
])

export const GestureEnum = z.enum([
  'idle',
  'nod',
  'shake',
  'shrug',
  'wave',
  'thinking_pose',
  'laugh',
  'shy',
  'surprised',
  'concerned_lean',
  'celebrate',
  'fist_pump',
  'sleepy',
])

export const ActionCallSchema = z.object({
  name: z.string(),
  arguments: z.record(z.any()).default({}),
})

export const StructuredReplySchema = z.object({
  speech: z.string().describe('1-3 short spoken sentences for TTS'),
  display_text: z.string().describe('Formatted display text for the chat UI'),
  emotion: EmotionEnum.default('calm'),
  intensity: z.number().min(0).max(1).default(0.7),
  gesture: GestureEnum.default('idle'),
  voice_style: z
    .object({
      pitch: z.number().optional(),
      rate: z.number().optional(),
      style: z.string().optional(),
    })
    .default({}),
  actions: z.array(ActionCallSchema).optional(),
  sticker: z.string().optional(),
  meme: z
    .object({
      template: z.string(),
      topText: z.string().optional(),
      bottomText: z.string().optional(),
    })
    .optional(),
  gif_query: z.string().optional(),
  reactions: z.array(z.string()).optional(),
})

export type StructuredReplyValidated = z.infer<typeof StructuredReplySchema>

import { parseStructuredReply } from './reply/parseReply.js'

/**
 * Robustly parses and repairs LLM structured JSON output.
 * Delegates to the bulletproof parseStructuredReply pipeline.
 */
export function parseAndRepairStructuredReply(rawText: string): StructuredReplyValidated {
  return parseStructuredReply(rawText)
}

