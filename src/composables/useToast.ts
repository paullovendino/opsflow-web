import { useUiStore, type ToastType } from '@/stores/ui'

export function useToast() {
  const ui = useUiStore()

  function toast(type: ToastType, message: string): void {
    ui.pushToast({ type, message })
  }

  return {
    toasts: ui.toasts,
    success: (message: string) => toast('success', message),
    error: (message: string) => toast('error', message),
    info: (message: string) => toast('info', message),
    dismiss: ui.dismissToast,
  }
}
