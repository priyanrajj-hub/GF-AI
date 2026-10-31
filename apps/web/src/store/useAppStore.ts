import { create } from 'zustand'
import type {
  ChatMessage,
  EmotionType,
  GestureType,
  MemoryItem,
  MoodJournalEntry,
  NoteItem,
  PersonalityMode,
  PersonalitySliders,
  StructuredReply,
  UserSettings,
} from '@ada/shared'

export type AppSystemState = 'idle' | 'listening' | 'thinking' | 'speaking'

interface AppState {
  // System State
  systemState: AppSystemState
  setSystemState: (state: AppSystemState) => void

  // Persona & Emotion
  activeMode: PersonalityMode
  setActiveMode: (mode: PersonalityMode) => void
  currentEmotion: EmotionType
  emotionIntensity: number
  activeGesture: GestureType
  setEmotionAndGesture: (emotion: EmotionType, intensity?: number, gesture?: GestureType) => void

  // Chat & History
  messages: ChatMessage[]
  setMessages: (messages: ChatMessage[]) => void
  addMessage: (msg: ChatMessage) => void
  clearMessages: () => void

  // Settings
  settings: UserSettings
  updateSettings: (partial: Partial<UserSettings>) => void

  // UI Panels
  showChatDrawer: boolean
  toggleChatDrawer: () => void
  showSettingsModal: boolean
  setShowSettingsModal: (show: boolean) => void
  showMemoryModal: boolean
  setShowMemoryModal: (show: boolean) => void
  showMoodModal: boolean
  setShowMoodModal: (show: boolean) => void
  fullScreenHoloMode: boolean
  toggleFullScreenHolo: () => void

  // Audio & Voice
  isHandsFree: boolean
  toggleHandsFree: () => void
  isMuted: boolean
  toggleMute: () => void
  audioVolume: number
  setAudioVolume: (vol: number) => void
  audioFrequencies: any
  setAudioFrequencies: (freq: any) => void

  // Focus / Pomodoro
  pomodoroSecondsLeft: number
  isPomodoroActive: boolean
  startPomodoro: (minutes?: number) => void
  pausePomodoro: () => void
  resetPomodoro: () => void
  tickPomodoro: () => void

  // Memory & Notes cache
  memories: MemoryItem[]
  setMemories: (items: MemoryItem[]) => void
  notes: NoteItem[]
  setNotes: (notes: NoteItem[]) => void
  journal: MoodJournalEntry[]
  setJournal: (entries: MoodJournalEntry[]) => void

  // Glitch trigger
  glitchTrigger: number
  triggerGlitch: () => void
}

const DEFAULT_USER_SETTINGS: UserSettings = {
  userId: 'default-user-1',
  userName: 'Operator',
  language: 'auto',
  mode: 'companion',
  sliders: {
    humor: 75,
    warmth: 88,
    formality: 35,
    directness: 70,
    flirtiness: 50, // healthy, charming, affectionate
    talkativeness: 60,
  },
  hologramColor: '#00f3ff', // Cyan Core primary
  renderMode: 'holo-lite', // Default: Hologram-lite (textured + thin scanlines + fresnel rim)
  avatarModelUrl: '/models/ada.vrm',
  closeUpView: false,
  handsFree: false,
  wakeWordEnabled: true,
  memoryConsent: true,
  cameraConsent: false,
  quietHoursStart: '23:00',
  quietHoursEnd: '07:00',
  dailyProactiveCap: 3,
  lowPerformanceMode: false,
  soundVolume: 0.85,
}

export const useAppStore = create<AppState>((set, get) => ({
  systemState: 'idle',
  setSystemState: (state) => set({ systemState: state }),

  activeMode: 'companion',
  setActiveMode: (mode) => set({ activeMode: mode }),
  currentEmotion: 'happy',
  emotionIntensity: 0.85,
  activeGesture: 'wave',
  setEmotionAndGesture: (emotion, intensity = 0.7, gesture = 'idle') =>
    set({
      currentEmotion: emotion,
      emotionIntensity: intensity,
      activeGesture: gesture,
    }),

  messages: [
    {
      id: 'welcome-1',
      role: 'assistant',
      content:
        "Holographic systems online. It's so good to see you, Partner.\n\nI'm **Ada**—your companion, co-pilot, and sharpest ally. Whether we're tackling ambitious code, dissecting complex research, or you just need someone warm and witty to talk through your day with, I'm right here by your side. What's on your mind?",
      speech: "Holographic systems online. It's so good to see you, Partner. I am Ada, ready whenever you are.",
      emotion: 'happy',
      gesture: 'wave',
      timestamp: Date.now(),
    },
  ],
  setMessages: (messages) => set({ messages }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  clearMessages: () => set({ messages: [] }),

  settings: DEFAULT_USER_SETTINGS,
  updateSettings: (partial) =>
    set((s) => ({
      settings: { ...s.settings, ...partial },
      activeMode: partial.mode || s.activeMode,
    })),

  showChatDrawer: true,
  toggleChatDrawer: () => set((s) => ({ showChatDrawer: !s.showChatDrawer })),
  showSettingsModal: false,
  setShowSettingsModal: (show) => set({ showSettingsModal: show }),
  showMemoryModal: false,
  setShowMemoryModal: (show) => set({ showMemoryModal: show }),
  showMoodModal: false,
  setShowMoodModal: (show) => set({ showMoodModal: show }),
  fullScreenHoloMode: false,
  toggleFullScreenHolo: () => set((s) => ({ fullScreenHoloMode: !s.fullScreenHoloMode })),

  isHandsFree: false,
  toggleHandsFree: () => set((s) => ({ isHandsFree: !s.isHandsFree })),
  isMuted: false,
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  audioVolume: 0.85,
  setAudioVolume: (vol) => set({ audioVolume: vol }),
  audioFrequencies: new Uint8Array(32),
  setAudioFrequencies: (freq) => set({ audioFrequencies: freq }),

  pomodoroSecondsLeft: 25 * 60,
  isPomodoroActive: false,
  startPomodoro: (minutes = 25) =>
    set({ pomodoroSecondsLeft: minutes * 60, isPomodoroActive: true }),
  pausePomodoro: () => set({ isPomodoroActive: false }),
  resetPomodoro: () => set({ pomodoroSecondsLeft: 25 * 60, isPomodoroActive: false }),
  tickPomodoro: () => {
    const current = get().pomodoroSecondsLeft
    if (current > 0 && get().isPomodoroActive) {
      set({ pomodoroSecondsLeft: current - 1 })
    } else if (current === 0 && get().isPomodoroActive) {
      set({ isPomodoroActive: false })
    }
  },

  memories: [],
  setMemories: (items) => set({ memories: items }),
  notes: [],
  setNotes: (notes) => set({ notes }),
  journal: [],
  setJournal: (entries) => set({ journal: entries }),

  glitchTrigger: 0,
  triggerGlitch: () => set((s) => ({ glitchTrigger: s.glitchTrigger + 1 })),
}))
