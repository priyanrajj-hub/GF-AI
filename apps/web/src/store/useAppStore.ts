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
  mode: 'jarvis',
  sliders: {
    humor: 65,
    warmth: 80,
    formality: 45,
    directness: 75,
    flirtiness: 30,
    talkativeness: 50,
  },
  hologramColor: '#00f3ff',
  solidRendering: false,
  avatarModelUrl: '/models/ada.vrm',
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

  activeMode: 'jarvis',
  setActiveMode: (mode) => set({ activeMode: mode }),
  currentEmotion: 'calm',
  emotionIntensity: 0.7,
  activeGesture: 'idle',
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
        'Holographic projector online. All subsystems nominal.\n\nI am **Ada**, your 3D AI companion. Whether you need strategic code debugging, intellectual research, focus coaching, or simply a warm presence, I am right here.',
      speech: 'Holographic projector online. All subsystems nominal. I am Ada, ready when you are.',
      emotion: 'calm',
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
