import { useEffect, useRef } from "react"

/**
 * Screen Wake Lock API: evita que a tela do dispositivo bloqueie ou apague por inatividade.
 * Útil para telas de preview (louvor/sermão) que ficam estáticas.
 *
 * Suporte: Chrome/Edge 85+, Safari/iOS 16.4+, Firefox 126+, Samsung Internet 14+.
 * Requer contexto seguro (HTTPS). Em navegadores sem suporte, não faz nada.
 */
export function useWakeLock(enabled: boolean) {
  const sentinelRef = useRef<{ release(): Promise<void> } | null>(null)

  const requestLock = async () => {
    const nav = navigator as Navigator & { wakeLock?: { request(type: "screen"): Promise<{ release(): Promise<void> }> } }
    if (!nav.wakeLock || document.visibilityState !== "visible") return
    try {
      const sentinel = await nav.wakeLock.request("screen")
      sentinelRef.current = sentinel
      ;(sentinel as unknown as EventTarget).addEventListener("release", () => {
        sentinelRef.current = null
      })
    } catch {
      // API não suportada, contexto inseguro ou rejeitado (ex.: bateria baixa)
    }
  }

  const releaseLock = async () => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    try {
      await sentinel.release()
    } catch {
      // já liberado
    }
    sentinelRef.current = null
  }

  useEffect(() => {
    if (!enabled) {
      releaseLock()
      return
    }
    requestLock()

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && enabled) {
        requestLock()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      releaseLock()
    }
  }, [enabled])
}
