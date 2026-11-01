import stickersData from './stickers.json' with { type: 'json' }
import type { EmotionType } from '../types.js'

export interface AdaSticker {
  id: string
  title: string
  caption: string
  category: string
  emoji: string
  associatedMood: EmotionType | string
  imageUrl?: string
}

export class StickerProvider {
  static getAll(): AdaSticker[] {
    return stickersData as AdaSticker[]
  }

  static getById(id: string): AdaSticker | undefined {
    return this.getAll().find((s) => s.id === id)
  }

  static getForMood(mood: string): AdaSticker {
    const all = this.getAll()
    const match = all.find((s) => s.associatedMood === mood)
    return match || all[0]
  }
}
