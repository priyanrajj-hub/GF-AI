import { z } from 'zod';
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
]);
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
]);
export const ActionCallSchema = z.object({
    name: z.string(),
    arguments: z.record(z.any()).default({}),
});
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
});
/**
 * Robustly parses and repairs LLM structured JSON output.
 * Extracts JSON even when enclosed in markdown fences or preceded by conversational chatter.
 */
export function parseAndRepairStructuredReply(rawText) {
    const fallback = {
        speech: rawText.slice(0, 200).replace(/[*_#`[\]]/g, ''),
        display_text: rawText,
        emotion: 'calm',
        intensity: 0.5,
        gesture: 'idle',
        voice_style: { rate: 1.0, pitch: 1.0 },
        actions: [],
    };
    if (!rawText || !rawText.trim()) {
        return fallback;
    }
    // 1. Try direct JSON parse
    try {
        const parsed = JSON.parse(rawText.trim());
        const validated = StructuredReplySchema.safeParse(parsed);
        if (validated.success)
            return validated.data;
    }
    catch {
        // Continue to regex extractor
    }
    // 2. Extract from markdown code blocks ```json ... ``` or ``` ... ```
    const codeBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
        try {
            const parsed = JSON.parse(codeBlockMatch[1].trim());
            const validated = StructuredReplySchema.safeParse(parsed);
            if (validated.success)
                return validated.data;
        }
        catch {
            // Continue
        }
    }
    // 3. Extract outermost { ... }
    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
        const jsonSubstring = rawText.substring(firstBrace, lastBrace + 1);
        try {
            const parsed = JSON.parse(jsonSubstring);
            const validated = StructuredReplySchema.safeParse(parsed);
            if (validated.success)
                return validated.data;
        }
        catch {
            // continue to fallback
        }
    }
    return fallback;
}
