<template>
  <div id="chatbot">
    <button 
      v-if="!chatStore.isOpen" 
      @click="handleToggle"
      class="!fixed !bottom-6 !right-6 !w-14 !h-14 !bg-[var(--secColor)] !text-white !rounded-full !shadow-2xl !flex !items-center !justify-center !z-[9] hover:!bg-[#0f5690] !transition-all !duration-200 !cursor-pointer group"
      title="Open Chat Assistant"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="!w-6 !h-6 group-hover:!scale-110 !transition-transform">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a.75.75 0 0 1-1.074-.765 6.001 6.001 0 0 1 1.166-3.41C4.426 15.405 4 13.753 4 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
      </svg>
    </button>

    <div 
      v-else 
      data-lenis-prevent
      class="!fixed !bottom-6 !right-6 !w-[340px] !h-[480px] !bg-white !rounded-2xl !shadow-2xl !flex !flex-col !overflow-hidden !z-[99999] !font-sans !transition-all !duration-200"
    >
      <div class="!bg-[#136cb3] !p-3 !text-white !flex !justify-between !items-center !border-b-2 !border-[#feb841]">
        <div class="!flex !items-center !gap-2.5">
          <div class="!w-10 !h-10 !bg-white !rounded-full !flex !items-center !justify-center !p-1.5 !shrink-0 !shadow-sm">
            <img class="!w-full !h-full !object-contain" src="../assets/image/logo.webp" alt="company logo">
          </div>
          <div class="!flex !flex-col">
            <span class="!font-bold !text-[13px] !tracking-wide !leading-tight">Upskills Team Building Services</span>
            <span class="!text-[11px] !text-slate-200 !mt-0.5 !flex !items-center !gap-1.5">
              <span class="!w-1.5 !h-1.5 !rounded-full !bg-emerald-400 !inline-block"></span>
              AI Assistant • Online
            </span>
          </div>
        </div>
        
        <div class="!flex !items-center !gap-2">
          <button @click="chatStore.clearHistory" class="!text-[10px] !text-slate-300 hover:!text-white !transition-colors !cursor-pointer" title="Clear Chat History">Clear</button>
          
          <button 
            @click="handleToggle" 
            class="!text-white hover:!text-slate-200 !text-xl !font-bold !leading-none !transition-colors !cursor-pointer !p-1" 
            title="Minimize Chat"
          >
            &minus;
          </button>
        </div>
      </div>

      <div class="!flex-1 !p-4 !flex !flex-col !gap-3 !h-[320px] !overflow-y-auto !overflow-x-hidden !scroll-smooth !bg-slate-50 !pointer-events-auto" ref="chatViewport">
        <div v-for="(msg, index) in chatStore.messages" :key="index" 
             :class="[
               '!p-3 !rounded-xl !max-w-[80%] !text-[12.5px] !line-height-[1.5] !word-break-break-word', 
               msg.sender === 'user' 
                 ? '!bg-[#136cb3] !text-white !self-end !rounded-br-none' 
                 : '!bg-white !text-slate-800 !border !border-slate-200 !self-start !rounded-bl-none'
             ]"
             v-html="msg.text">
        </div>
        
        <div v-if="chatStore.loading" class="!text-slate-400 !italic !text-xs !self-start !pl-1 !animate-pulse !flex !items-center !gap-1">
          <span class="!w-1.5 !h-1.5 !rounded-full !bg-slate-400"></span>
          Thinking...
        </div>
      </div>

      <div class="!p-3 !border-t !border-slate-100 !bg-white !flex !gap-2 !items-center">
        <el-input 
          v-model="chatStore.userInput" 
          placeholder="Ask about our training packages..." 
          size="default"
          class="!flex-1"
          @keyup.enter="handleAsk"
          :disabled="chatStore.loading"
        />
        <el-button 
          type="primary" 
          size="default" 
          :loading="chatStore.loading" 
          class="!bg-[#136cb3] !border-[#136cb3] !text-white !font-semibold hover:!bg-[#0f5690] hover:!border-[#0f5690]"
          @click="handleAsk"
        >
          Send
        </el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useChatStore } from '@/stores/useChatBotStore'

export default defineComponent({
  setup() {
    const chatStore = useChatStore()
    return { chatStore }
  },

  mounted() {
    this.chatStore.initChatHistory()
    this.scrollToBottom()
  },

  methods: {
    handleToggle(): void {
      this.chatStore.toggleChat()
      if (this.chatStore.isOpen) {
        this.scrollToBottom()
      }
    },

    async handleAsk(): Promise<void> {
      await this.chatStore.askBot()
      this.scrollToBottom()
    },

    scrollToBottom(): void {
      this.$nextTick(() => {
        const container = this.$refs.chatViewport as HTMLElement | undefined
        if (container) {
          container.scrollTop = container.scrollHeight
        }
      })
    }
  }
})
</script>

<style scoped>
:deep(ul) { list-style-type: disc !important; margin-left: 16px !important; margin-top: 4px !important; margin-bottom: 4px !important; }
:deep(li) { margin-bottom: 4px !important; }
:deep(strong) { font-weight: 700 !important; }
</style>