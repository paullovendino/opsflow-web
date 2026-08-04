import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastItem {
  id: number
  type: ToastType
  message: string
}

let toastSeq = 0

export const useUiStore = defineStore('ui', () => {
  const toasts = ref<ToastItem[]>([])
  const isSidebarOpen = ref(false)

  function pushToast(input: { type: ToastType; message: string; timeoutMs?: number }): void {
    const id = ++toastSeq
    toasts.value.push({
      id,
      type: input.type,
      message: input.message,
    })

    const timeoutMs = input.timeoutMs ?? 4000
    window.setTimeout(() => {
      dismissToast(id)
    }, timeoutMs)
  }

  function dismissToast(id: number): void {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  function openSidebar(): void {
    isSidebarOpen.value = true
  }

  function closeSidebar(): void {
    isSidebarOpen.value = false
  }

  function toggleSidebar(): void {
    isSidebarOpen.value = !isSidebarOpen.value
  }

  return {
    toasts,
    isSidebarOpen,
    pushToast,
    dismissToast,
    openSidebar,
    closeSidebar,
    toggleSidebar,
  }
})
