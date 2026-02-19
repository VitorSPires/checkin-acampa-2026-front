import { useEffect, useRef } from "react"

/**
 * Áudio silencioso em loop para ajudar a manter a tela ativa.
 * Muitos dispositivos consideram "reprodução ativa" quando há áudio tocando.
 * Usado em conjunto com SilentVideoKeepAwake.
 */
const SILENT_WAV =
  "data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA=="

export function SilentAudioKeepAwake() {
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const p = audio.play()
    p?.catch(() => {})
    return () => {
      audio.pause()
    }
  }, [])

  return (
    <audio
      ref={audioRef}
      src={SILENT_WAV}
      muted
      loop
      aria-hidden
      className="pointer-events-none absolute h-0 w-0 opacity-0"
    />
  )
}
