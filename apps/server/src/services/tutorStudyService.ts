import { db } from '../db/index.js'
import type { NoteItem } from '@ada/shared'

export interface StudyFocusSession {
  goal: string
  durationMinutes: number
  remainingSeconds: number
  isActive: boolean
  mode: 'pomodoro' | 'deep_study' | 'short_break'
}

export interface TodoCardData {
  action: 'list' | 'added' | 'completed' | 'deleted'
  item?: { id: string; title: string; completed: boolean; dueDate?: number }
  items?: Array<{ id: string; title: string; completed: boolean; dueDate?: number }>
  pendingCount: number
}

export class TutorStudyService {
  /**
   * Detects if the message is requesting an academic / coding tutorial or exam preparation.
   */
  static detectTutorIntent(message: string): { isTutor: boolean; topic?: string } {
    const clean = message.toLowerCase()
    const tutorTriggers = [
      'tutor me',
      'teach me',
      'explain',
      'how does',
      'how do i',
      'help me learn',
      'study with me',
      'break down',
      'exam prep',
      'concept of',
      'solli kudu', // Tanglish: teach me
      'explain pannu', // Tanglish
      'padikka help pannu', // Tanglish
      'purila', // Tanglish: don't understand
      'கற்றுக்கொடுங்கள்', // Tamil
      'விளக்குங்கள்', // Tamil
    ]

    const matched = tutorTriggers.some((t) => clean.includes(t))
    if (!matched) return { isTutor: false }

    const topic = clean
      .replace(/^(?:ada,?\s*)?(?:please\s*)?(?:can you\s*)?(?:tutor me on|teach me|explain|solli kudu|explain pannu|break down)\s+/i, '')
      .replace(/(?:step by step|with an example|in detail|in tanglish|in tamil)/gi, '')
      .trim()

    return { isTutor: true, topic }
  }

  /**
   * Detects Pomodoro & Focus study timer requests.
   */
  static detectFocusIntent(message: string): { isFocus: boolean; minutes: number; goal: string } {
    const clean = message.toLowerCase()
    const isFocus =
      clean.includes('pomodoro') ||
      clean.includes('focus timer') ||
      clean.includes('focus for') ||
      clean.includes('study timer') ||
      clean.includes('start study') ||
      clean.includes('help me focus') ||
      clean.includes('study session') ||
      clean.includes('padikka start') ||
      clean.includes('focus pannuvom')

    if (!isFocus) return { isFocus: false, minutes: 25, goal: 'Deep Study Block' }

    // Extract minutes if specified (e.g., "focus for 45 minutes", "25 min pomodoro")
    const minMatch = clean.match(/(\d+)\s*(?:min|minute|minutes|m)/i)
    const minutes = minMatch ? Math.min(120, Math.max(5, parseInt(minMatch[1], 10))) : 25

    // Extract goal
    let goal = 'Deep Study & Focus Sprint'
    if (clean.includes('for exam') || clean.includes('exam')) goal = 'Exam Preparation'
    else if (clean.includes('coding') || clean.includes('code') || clean.includes('dsa')) goal = 'DSA & Coding Sprint'
    else if (clean.includes('reading') || clean.includes('book')) goal = 'Reading & Research'

    return { isFocus: true, minutes, goal }
  }

  /**
   * Detects To-Do list and reminder operations.
   */
  static detectTodoIntent(message: string): {
    isTodo: boolean
    action: 'add' | 'list' | 'complete'
    taskTitle?: string
    dueDate?: number
  } {
    const clean = message.toLowerCase()

    // 1. List To-Dos
    if (
      clean === 'todo' ||
      clean === 'to-do' ||
      clean.includes('my todo') ||
      clean.includes('my to-do') ||
      clean.includes('show my tasks') ||
      clean.includes('what are my tasks') ||
      clean.includes('to-do list') ||
      clean.includes('todo list') ||
      clean.includes('pending tasks') ||
      clean.includes('enna tasks irukku')
    ) {
      return { isTodo: true, action: 'list' }
    }

    // 2. Add To-Do / Reminder
    const addPatterns = [
      /(?:add\s+to[- ]do|add\s+todo|add\s+note|add\s+task|remind\s+me\s+to|set\s+reminder\s+for|todo-la\s+add\s+pannu|to-do\s+list-la\s+add\s+pannu)\s*[:\-]?\s*(.+)/i,
    ]

    for (const p of addPatterns) {
      const match = message.match(p)
      if (match && match[1]) {
        let taskTitle = match[1].trim()
        let dueDate: number | undefined

        // Simple tomorrow/tonight/hour detection
        if (taskTitle.toLowerCase().includes('tomorrow')) {
          dueDate = Date.now() + 24 * 60 * 60 * 1000
          taskTitle = taskTitle.replace(/tomorrow/gi, '').trim()
        } else if (taskTitle.toLowerCase().includes('tonight')) {
          dueDate = Date.now() + 6 * 60 * 60 * 1000
          taskTitle = taskTitle.replace(/tonight/gi, '').trim()
        }

        return { isTodo: true, action: 'add', taskTitle, dueDate }
      }
    }

    return { isTodo: false, action: 'list' }
  }

  /**
   * Manages To-Do DB operations and creates response payload.
   */
  static handleTodoOperation(
    userId: string,
    operation: { action: 'add' | 'list' | 'complete'; taskTitle?: string; dueDate?: number }
  ): {
    notes: NoteItem[]
    cardData: TodoCardData
    speech: string
    display_text: string
  } {
    if (operation.action === 'add' && operation.taskTitle) {
      const newNote = db.addNote(userId, {
        title: operation.taskTitle,
        content: `Reminder created: ${operation.taskTitle}`,
        completed: false,
        category: 'todo',
        dueDate: operation.dueDate,
      })

      const allNotes = db.getNotes(userId)
      const pending = allNotes.filter((n) => !n.completed)

      return {
        notes: allNotes,
        cardData: {
          action: 'added',
          item: { id: newNote.id, title: newNote.title, completed: newNote.completed, dueDate: newNote.dueDate },
          items: allNotes.slice(0, 5).map((n) => ({ id: n.id, title: n.title, completed: n.completed, dueDate: n.dueDate })),
          pendingCount: pending.length,
        },
        speech: `Added to your to-do list: ${operation.taskTitle}. You have ${pending.length} pending task${pending.length === 1 ? '' : 's'}.`,
        display_text: `📝 **To-Do & Reminder Added:**\n- [ ] **${operation.taskTitle}** ${operation.dueDate ? '*(Scheduled)*' : ''}\n\n*Logged in your persistence database. Total active tasks: ${pending.length}.*`,
      }
    }

    // Default: List active to-dos
    const allNotes = db.getNotes(userId)
    const pending = allNotes.filter((n) => !n.completed)

    let checklistStr = pending.length > 0
      ? pending.map((n) => `- [ ] **${n.title}**`).join('\n')
      : '*No pending tasks! You are all caught up, sweetheart! 🎉*'

    return {
      notes: allNotes,
      cardData: {
        action: 'list',
        items: allNotes.slice(0, 8).map((n) => ({ id: n.id, title: n.title, completed: n.completed, dueDate: n.dueDate })),
        pendingCount: pending.length,
      },
      speech: pending.length > 0
        ? `Here is your to-do list. You have ${pending.length} pending task${pending.length === 1 ? '' : 's'}. Let us conquer them one by one!`
        : `Your to-do list is completely clear! Ready to plan our next big goal?`,
      display_text: `📋 **Your Active To-Do List & Reminders:**\n\n${checklistStr}\n\n*Tip: Say "Add to-do: [task]" to schedule a new goal!*`,
    }
  }
}
