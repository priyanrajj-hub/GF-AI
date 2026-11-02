import { create } from 'zustand'
import {
  WardrobeProvider,
  getTimeAwareGreeting,
} from '@ada/shared'
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
  CustomPersonality,
  TimeOfDayPhase,
  WardrobeHistoryEntry,
} from '@ada/shared'
import { SolarTimeService, type WeatherType } from '../services/solarTimeService.js'

export type AppSystemState = 'idle' | 'listening' | 'thinking' | 'speaking'

export function computeTimeOfDay(date = new Date()): TimeOfDayPhase {
  const hour = date.getHours()
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'noon'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}

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
  showStageDrawer: boolean
  setShowStageDrawer: (show: boolean) => void
  showSettingsModal: boolean
  setShowSettingsModal: (show: boolean) => void
  showMemoryModal: boolean
  setShowMemoryModal: (show: boolean) => void
  showMoodModal: boolean
  setShowMoodModal: (show: boolean) => void
  showWardrobeDrawer: boolean
  setShowWardrobeDrawer: (show: boolean) => void
  showEnvironmentDrawer: boolean
  setShowEnvironmentDrawer: (show: boolean) => void
  showPersonalityStudio: boolean
  setShowPersonalityStudio: (show: boolean) => void
  showPermissionCenter: boolean
  setShowPermissionCenter: (show: boolean) => void
  showWellbeingModal: boolean
  setShowWellbeingModal: (show: boolean) => void
  showFirstRunModal: boolean
  setShowFirstRunModal: (show: boolean) => void
  isMinorMode: boolean
  setIsMinorMode: (isMinor: boolean) => void
  accessories: {
    commsHeadset: boolean
    gloves: boolean
    boots: boolean
  }
  setAccessories: (partial: Partial<{ commsHeadset: boolean; gloves: boolean; boots: boolean }>) => void
  wellbeing: {
    dailySeconds: number
    weeklySeconds: number
    dailyLimitMinutes: number
    moodRatings: Array<{ timestamp: number; rating: 'better' | 'same' | 'worse' }>
    balance: { sleepHours: number; offlineHours: number; friendsSeen: boolean }
  }
  recordWellbeingRating: (rating: 'better' | 'same' | 'worse') => void
  setDailyLimitMinutes: (minutes: number) => void
  updateBalanceCheck: (balance: Partial<{ sleepHours: number; offlineHours: number; friendsSeen: boolean }>) => void
  tickWellbeingSeconds: () => void
  activeCustomPersonality: CustomPersonality | null
  setActiveCustomPersonality: (p: CustomPersonality | null) => void
  fullScreenHoloMode: boolean
  toggleFullScreenHolo: () => void

  // Action, Roaming, & Cuteness (Rounds 4 & 5)
  activeAction: string
  setActiveAction: (action: string) => void
  cutenessLevel: number
  setCutenessLevel: (level: number) => void
  skinId: string
  setSkinId: (id: string) => void

  // Time-of-Day Dynamics & Auto-Wardrobe v2
  timeOfDayPhase: TimeOfDayPhase
  solarHour: number
  isTimeLocked: boolean
  weatherType: WeatherType
  timeSyncMode: 'auto' | 'morning' | 'noon' | 'evening' | 'night'
  setTimeSyncMode: (mode: 'auto' | 'morning' | 'noon' | 'evening' | 'night') => void
  setTimeOfDayPhase: (phase: TimeOfDayPhase) => void
  setSolarHour: (hour: number) => void
  setIsTimeLocked: (locked: boolean) => void
  setWeatherType: (weather: WeatherType) => void
  autoWardrobeSync: boolean
  toggleAutoWardrobeSync: () => void
  wardrobeHistory: WardrobeHistoryEntry[]
  isManualOutfit: boolean
  setIsManualOutfit: (manual: boolean) => void
  syncContextualWardrobe: (triggerComment?: boolean) => void
  ambientAudioEnabled: boolean
  toggleAmbientAudio: () => void
  roamConfig: {
    enabled: boolean
    range: 'home' | 'half' | 'full'
    energy: 'calm' | 'balanced' | 'playful'
    followCursor: boolean
  }
  setRoamConfig: (partial: Partial<AppState['roamConfig']>) => void
  activeSong: any
  setActiveSong: (song: any) => void
  activeFX: string[]
  setActiveFX: (fx: string[]) => void
  avatarPosition: [number, number, number]
  setAvatarPosition: (pos: [number, number, number]) => void

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
  userName:
    typeof window !== 'undefined'
      ? localStorage.getItem('ada_user_name') || 'Demo User'
      : 'Demo User',
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
  renderMode: 'holo-lite', // Default: Hologram-lite
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
  cutenessLevel: 60,
  skinId: 'ada-red',
  roamEnabled: true,
  liveliness: 70,
  voice: 'cgSgspJ2msm6clMCkdW9',
  elevenlabsApiKey:
    typeof window !== 'undefined'
      ? localStorage.getItem('ada_elevenlabs_api_key') || 'sk_219ca6a4315e38f74478bcb10c1df0662decb4b6f6302bbe'
      : 'sk_219ca6a4315e38f74478bcb10c1df0662decb4b6f6302bbe',
  elevenlabsVoiceId: 'cgSgspJ2msm6clMCkdW9',
  elevenlabsModelId: 'eleven_turbo_v2_5',
  huggingfaceApiKey:
    typeof window !== 'undefined'
      ? localStorage.getItem('ada_hf_api_key') || ''
      : '',
}

export const useAppStore = create<AppState>((set, get) => ({
  systemState: 'idle',
  setSystemState: (state) => set({ systemState: state }),

  activeMode: 'companion',
  setActiveMode: (mode) => set({ activeMode: mode }),
  currentEmotion: 'happy',
  emotionIntensity: 0.85,
  activeGesture: 'idle',
  setEmotionAndGesture: (emotion, intensity = 0.7, gesture = 'idle') => {
    set({
      currentEmotion: emotion,
      emotionIntensity: intensity,
      activeGesture: gesture,
    })
    // Auto-reset activeGesture to 'idle' after duration so avatar doesn't get stuck in gesture
    if (gesture && gesture !== 'idle') {
      setTimeout(() => {
        if (get().activeGesture === gesture) {
          set({ activeGesture: 'idle' })
        }
      }, 3200)
    }
  },

  activeAction: 'idle',
  setActiveAction: (action) => set({ activeAction: action }),
  cutenessLevel: 60,
  setCutenessLevel: (cutenessLevel) => set({ cutenessLevel }),
  skinId: computeTimeOfDay() === 'morning' ? 'morning_chic' : computeTimeOfDay() === 'noon' ? 'office-blazer' : computeTimeOfDay() === 'evening' ? 'saree-crimson' : 'cozy-pajamas',
  setSkinId: (skinId) => set({ skinId }),

  // Time-of-Day Dynamics & Auto-Wardrobe v2
  timeOfDayPhase: computeTimeOfDay(),
  solarHour: new Date().getHours() + new Date().getMinutes() / 60,
  isTimeLocked: false,
  weatherType: 'clear',
  timeSyncMode: 'auto',
  autoWardrobeSync: true,
  isManualOutfit: false,
  wardrobeHistory: [],
  ambientAudioEnabled: true,
  toggleAmbientAudio: () => set((s) => ({ ambientAudioEnabled: !s.ambientAudioEnabled })),
  toggleAutoWardrobeSync: () => set((s) => ({ autoWardrobeSync: !s.autoWardrobeSync })),
  setIsManualOutfit: (isManualOutfit) => set({ isManualOutfit }),
  setIsTimeLocked: (isTimeLocked) => set({ isTimeLocked }),
  setWeatherType: (weatherType) => {
    set({ weatherType })
    get().syncContextualWardrobe(true)
  },
  setSolarHour: (solarHour) => {
    const calc = SolarTimeService.calculate(solarHour)
    let phase: TimeOfDayPhase = 'noon'
    if (calc.phase === 'dawn' || calc.phase === 'morning') phase = 'morning'
    else if (calc.phase === 'golden_hour' || calc.phase === 'sunset' || calc.phase === 'evening') phase = 'evening'
    else if (calc.phase === 'night' || calc.phase === 'dusk') phase = 'night'
    else phase = 'noon'

    set({ solarHour, timeOfDayPhase: phase })
    if (get().autoWardrobeSync && !get().isManualOutfit) {
      get().syncContextualWardrobe(false)
    }
  },
  setTimeSyncMode: (mode) => {
    const phase = mode === 'auto' ? computeTimeOfDay() : mode
    const defaultHours: Record<TimeOfDayPhase, number> = {
      morning: 8.0,
      noon: 13.0,
      evening: 18.5,
      night: 22.5,
    }
    const hour = mode === 'auto' ? new Date().getHours() + new Date().getMinutes() / 60 : defaultHours[phase]
    set({ timeSyncMode: mode, timeOfDayPhase: phase, solarHour: hour, isTimeLocked: mode !== 'auto' })
    if (get().autoWardrobeSync && !get().isManualOutfit) {
      get().syncContextualWardrobe(true)
    }
  },
  setTimeOfDayPhase: (phase) => {
    const defaultHours: Record<TimeOfDayPhase, number> = {
      morning: 8.0,
      noon: 13.0,
      evening: 18.5,
      night: 22.5,
    }
    set({ timeOfDayPhase: phase, solarHour: defaultHours[phase] })
    if (get().autoWardrobeSync && !get().isManualOutfit) {
      get().syncContextualWardrobe(true)
    }
  },
  syncContextualWardrobe: (triggerComment = false) => {
    const state = get()
    if (!state.autoWardrobeSync || state.isManualOutfit) return

    const selected = WardrobeProvider.selectIntelligentOutfit({
      mode: state.activeMode,
      hour: state.solarHour,
      phase: state.timeOfDayPhase,
      weather: state.weatherType,
      history: state.wardrobeHistory,
    })

    if (selected.id !== state.skinId) {
      // Trigger short, tasteful transformation animation
      set((s) => ({
        skinId: selected.id,
        wardrobeHistory: [{ skinId: selected.id, timestamp: Date.now() }, ...s.wardrobeHistory.slice(0, 15)],
      }))

      state.setActiveAction('sassy_hip_pop')
      state.setActiveFX(['sparkles', 'confetti'])
      setTimeout(() => {
        state.setActiveFX([])
        state.setActiveAction('idle')
      }, 2500)

      if (triggerComment && selected.voiceComment) {
        state.addMessage({
          id: `msg-wardrobe-${Date.now()}`,
          role: 'assistant',
          content: selected.voiceComment,
          speech: selected.voiceComment,
          emotion: 'happy',
          gesture: 'idle',
          timestamp: Date.now(),
        })
      }
    }
  },
  roamConfig: {
    enabled: false,
    range: 'half',
    energy: 'calm',
    followCursor: false,
  },
  setRoamConfig: (partial) =>
    set((s) => ({ roamConfig: { ...s.roamConfig, ...partial } })),
  showStageDrawer: false,
  setShowStageDrawer: (showStageDrawer) => set({ showStageDrawer }),
  activeSong: null,
  setActiveSong: (activeSong) => set({ activeSong }),
  activeFX: [],
  setActiveFX: (activeFX) => set({ activeFX }),
  avatarPosition: [0, -0.72, 0],
  setAvatarPosition: (pos) => set({ avatarPosition: pos }),

  messages: [
    {
      id: 'welcome-1',
      role: 'assistant',
      content: getTimeAwareGreeting(DEFAULT_USER_SETTINGS.userName, DEFAULT_USER_SETTINGS.mode).content,
      speech: getTimeAwareGreeting(DEFAULT_USER_SETTINGS.userName, DEFAULT_USER_SETTINGS.mode).speech,
      emotion: 'happy',
      gesture: 'wave',
      timestamp: Date.now(),
    },
  ],
  setMessages: (messages) => set({ messages }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  clearMessages: () => set({ messages: [] }),

  settings: DEFAULT_USER_SETTINGS,
  updateSettings: (partial) => {
    if (typeof window !== 'undefined') {
      if (partial.userName !== undefined) {
        localStorage.setItem('ada_user_name', partial.userName)
      }
      if (partial.elevenlabsApiKey !== undefined) {
        localStorage.setItem('ada_elevenlabs_api_key', partial.elevenlabsApiKey)
      }
      if (partial.huggingfaceApiKey !== undefined) {
        localStorage.setItem('ada_hf_api_key', partial.huggingfaceApiKey)
      }
    }
    set((s) => ({
      settings: { ...s.settings, ...partial },
      activeMode: partial.mode || s.activeMode,
    }))
  },

  showChatDrawer: true,
  toggleChatDrawer: () => set((s) => ({ showChatDrawer: !s.showChatDrawer })),
  showSettingsModal: false,
  setShowSettingsModal: (show) => set({ showSettingsModal: show }),
  showMemoryModal: false,
  setShowMemoryModal: (show) => set({ showMemoryModal: show }),
  showMoodModal: false,
  setShowMoodModal: (show) => set({ showMoodModal: show }),
  showWardrobeDrawer: false,
  setShowWardrobeDrawer: (show) => set({ showWardrobeDrawer: show }),
  showEnvironmentDrawer: false,
  setShowEnvironmentDrawer: (show) => set({ showEnvironmentDrawer: show }),
  showPersonalityStudio: false,
  setShowPersonalityStudio: (show) => set({ showPersonalityStudio: show }),
  showPermissionCenter: false,
  setShowPermissionCenter: (show) => set({ showPermissionCenter: show }),
  showWellbeingModal: false,
  setShowWellbeingModal: (show) => set({ showWellbeingModal: show }),
  showFirstRunModal:
    typeof window !== 'undefined'
      ? localStorage.getItem('ada_first_run_acknowledged') !== 'true'
      : false,
  setShowFirstRunModal: (show) => set({ showFirstRunModal: show }),
  isMinorMode:
    typeof window !== 'undefined'
      ? localStorage.getItem('ada_minor_mode') === 'true'
      : false,
  setIsMinorMode: (isMinor) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ada_minor_mode', isMinor ? 'true' : 'false')
    }
    set({ isMinorMode: isMinor })
  },
  accessories: {
    commsHeadset: false,
    gloves: true,
    boots: true,
  },
  setAccessories: (partial) =>
    set((s) => ({ accessories: { ...s.accessories, ...partial } })),
  wellbeing: {
    dailySeconds: 0,
    weeklySeconds: 0,
    dailyLimitMinutes: 60,
    moodRatings: [],
    balance: { sleepHours: 7.5, offlineHours: 4.0, friendsSeen: true },
  },
  recordWellbeingRating: (rating) =>
    set((s) => ({
      wellbeing: {
        ...s.wellbeing,
        moodRatings: [
          ...s.wellbeing.moodRatings,
          { timestamp: Date.now(), rating },
        ],
      },
    })),
  setDailyLimitMinutes: (minutes) =>
    set((s) => ({
      wellbeing: { ...s.wellbeing, dailyLimitMinutes: minutes },
    })),
  updateBalanceCheck: (partial) =>
    set((s) => ({
      wellbeing: {
        ...s.wellbeing,
        balance: { ...s.wellbeing.balance, ...partial },
      },
    })),
  tickWellbeingSeconds: () =>
    set((s) => ({
      wellbeing: {
        ...s.wellbeing,
        dailySeconds: s.wellbeing.dailySeconds + 1,
        weeklySeconds: s.wellbeing.weeklySeconds + 1,
      },
    })),
  activeCustomPersonality: null,
  setActiveCustomPersonality: (p) => set({ activeCustomPersonality: p }),
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

if (typeof window !== 'undefined') {
  ;(window as any).useAppStore = useAppStore
}

