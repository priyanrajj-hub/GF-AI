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
  arguments: z.record(z.string(), z.any()).default({}),
})

export const TaskActionCardSchema = z.object({
  type: z.enum([
    'youtube',
    'web_search',
    'open_url',
    'timer',
    'todo',
    'character_switch',
    'wardrobe',
    'market',
    'calculator',
    'weather',
    'maps',
    'deliverable',
  ]),
  title: z.string(),
  subtitle: z.string().optional(),
  url: z.string().optional(),
  embedUrl: z.string().optional(),
  query: z.string().optional(),
  buttonText: z.string().optional(),
  status: z.enum(['ready', 'executed', 'running']).optional(),
  icon: z.string().optional(),
  data: z.record(z.string(), z.any()).optional(),
})

export const StructuredReplySchema = z.object({
  speech: z.string().describe('1-3 short spoken sentences for TTS'),
  display_text: z.string().describe('Formatted display text for the chat UI'),
  emotion: EmotionEnum.default('calm'),
  intensity: z.number().min(0).max(1).default(0.7),
  gesture: z.string().default('idle'),
  voice_style: z
    .object({
      pitch: z.number().optional(),
      rate: z.number().optional(),
      style: z.string().optional(),
    })
    .default({}),
  actions: z.array(ActionCallSchema).optional(),
  taskAction: TaskActionCardSchema.optional(),
  sticker: z.string().optional(),
  meme: z
    .object({
      template: z.string(),
      topText: z.string().optional(),
      bottomText: z.string().optional(),
      imageUrl: z.string().optional(),
      title: z.string().optional(),
      punchline: z.string().optional(),
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

