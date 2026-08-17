import { defineStore } from 'pinia'
import { supabase } from '@/utils/supabaseClient'

// Define message structure interface
export interface ChatMessage {
  sender: 'user' | 'bot'
  text: string
}

// Define state interface
export interface ChatState {
  isOpen: boolean
  userInput: string
  loading: boolean
  messages: ChatMessage[]
}

export const useChatStore = defineStore('chat', {
  state: (): ChatState => ({
    isOpen: false,
    userInput: '',
    loading: false,
    messages: []
  }),

  actions: {
    toggleChat(): void {
      this.isOpen = !this.isOpen
    },

    loadDefaultWelcome(): void {
      this.messages = [
        {
          sender: 'bot',
          text: 'Hello! Welcome to Upskills Facilitation Partners. Ask me anything about our training modules, corporate events, or packages, and I will happily assist you!'
        }
      ]
      this.saveToLocal()
    },

    saveToLocal(): void {
      localStorage.setItem('upskills_chat_history', JSON.stringify(this.messages))
    },

    initChatHistory(): void {
      const localHistory = localStorage.getItem('upskills_chat_history')
      if (localHistory) {
        try {
          this.messages = JSON.parse(localHistory) as ChatMessage[]
        } catch {
          this.loadDefaultWelcome()
        }
      } else {
        this.loadDefaultWelcome()
      }
    },

    async askBot(): Promise<void> {
      if (!this.userInput.trim() || this.loading) return

      const promptText = this.userInput
      this.messages.push({ sender: 'user', text: promptText })
      this.saveToLocal()

      this.userInput = ''
      this.loading = true

      try {
        const { data, error } = await supabase.functions.invoke('chat', {
          body: { message: promptText }
        })

        if (error) throw error

        this.messages.push({ sender: 'bot', text: data.reply })
      } catch (err) {
        console.error(err)
        this.messages.push({
          sender: 'bot',
          text: "I'm having trouble connecting to our system right now. Please try asking again shortly."
        })
      } finally {
        this.loading = false
        this.saveToLocal()
      }
    },

    clearHistory(): void {
      this.loading = true
      setTimeout(() => {
        localStorage.removeItem('upskills_chat_history')
        this.loadDefaultWelcome()
        this.loading = false
      }, 1000)
    }
  }
})