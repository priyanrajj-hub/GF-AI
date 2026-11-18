/**
 * GF-AI Modular Voice Provider System
 * 
 * Formal interfaces distinguishing conversational speech synthesis from singing voice synthesis,
 * supporting verified licensing status, capabilities reporting, and enterprise voice routing.
 */

export type VoiceSynthesisType = 'speech' | 'singing' | 'hybrid'

export type VoiceLicenseStatus =
  | 'licensed'
  | 'unlicensed'
  | 'pending_verification'
  | 'not_configured'

export interface VoiceCapabilities {
  id: string
  name: string
  provider: string
  type: VoiceSynthesisType
  supportedLanguages: string[]
  isConfigured: boolean
  licenseStatus: VoiceLicenseStatus
  statusMessage: string
  description?: string
  requiresAuthorization?: boolean
  supportsStreaming?: boolean
}

export interface VoiceSynthesisOptions {
  voiceId?: string
  language?: string
  rate?: number
  pitch?: number
  style?: string
  character?: string
  format?: 'mp3' | 'wav' | 'pcm'
}

export interface VoiceSynthesisResult {
  audioBase64: string
  mimeType: string
  durationSec?: number
  voice: string
  provider: string
  model?: string
  isAuthenticMiku?: boolean
  licenseStatus?: VoiceLicenseStatus
}

export interface VoiceProvider {
  readonly id: string
  readonly name: string
  initialize(): Promise<void>
  getCapabilities(): VoiceCapabilities
  synthesizeSpeech(text: string, options?: VoiceSynthesisOptions): Promise<VoiceSynthesisResult>
  streamSpeech?(text: string, options?: VoiceSynthesisOptions): Promise<ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>>
  stop(): Promise<void>
  dispose(): Promise<void>
}
