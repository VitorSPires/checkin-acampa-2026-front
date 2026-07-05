import { useState, useEffect, useRef, useCallback } from "react"
import { stageTriggerUrl, stageImageUrl } from "@/lib/propresenter-ws"
import { presentationThumbnailUrl } from "@/lib/propresenter-api"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export interface PreviewPregacaoPresentationProps {
  ip: string
  port: string
  presentationUid: string | null
  currentIndex: number
  lastIndex: number
  slides: { notes?: string; text?: string; label?: string }[]
  setCurrentIndex: (i: number) => void
  currentSlideUid: string | null
  nextSlideUid: string | null
}

function DefaultSlidePlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={`flex w-full items-center justify-center rounded bg-black ${className ?? ""}`}
      aria-hidden
    />
  )
}

/**
 * Mostra lowResUrl imediatamente (src direto no DOM, sem re-render).
 * Carrega highResUrl em background com new Image().
 *
 * Dois effects separados com genRef:
 * - Effect 1 (lowResUrl): slide novo → gen++ → mostra low-res
 * - Effect 2 (highResUrl): captura gen DEPOIS que effect 1 pode ter incrementado,
 *   carrega high-res e só aplica se o gen não mudou.
 * Isso evita que um high-res de slide antigo sobrescreva um slide mais novo
 * quando WebSocket (rápido) e REST API (lenta com ping alto) ficam dessincronizados.
 */
function SlideImage({ lowResUrl, highResUrl, className, onError }: {
  lowResUrl: string | null
  highResUrl: string | null
  className?: string
  onError: () => void
}) {
  const imgRef = useRef<HTMLImageElement>(null)
  const genRef = useRef(0)

  useEffect(() => {
    genRef.current++
    const el = imgRef.current
    if (el && lowResUrl) el.src = lowResUrl
  }, [lowResUrl])

  useEffect(() => {
    if (!highResUrl) return
    const gen = genRef.current
    const img = new Image()
    img.onload = () => {
      if (imgRef.current && genRef.current === gen) imgRef.current.src = highResUrl
    }
    img.src = highResUrl
    return () => { img.onload = null }
  }, [highResUrl])

  if (!lowResUrl && !highResUrl) return <DefaultSlidePlaceholder className={className} />

  return (
    <div className={`flex h-full w-full items-center justify-center overflow-hidden rounded bg-black ${className ?? ""}`}>
      <img
        ref={imgRef}
        src={lowResUrl ?? undefined}
        alt=""
        aria-hidden
        className="h-full w-full object-contain"
        decoding="async"
        onError={onError}
      />
    </div>
  )
}

export default function PreviewPregacao({
  ip,
  port,
  presentationUid,
  currentIndex,
  lastIndex,
  slides,
  setCurrentIndex,
  currentSlideUid,
  nextSlideUid,
}: PreviewPregacaoPresentationProps) {
  const [currentImageError, setCurrentImageError] = useState(false)
  const [nextImageError, setNextImageError] = useState(false)

  useEffect(() => { setCurrentImageError(false) }, [currentIndex])
  useEffect(() => { setNextImageError(false) }, [currentIndex])

  const nextIndex = currentIndex + 1

  const currentLowRes = stageImageUrl(ip, currentSlideUid, undefined, port)
  const nextLowRes = stageImageUrl(ip, nextSlideUid, undefined, port)

  const currentHighRes =
    presentationUid != null && currentIndex >= 0 && currentIndex <= lastIndex && !currentImageError
      ? presentationThumbnailUrl(ip, presentationUid, currentIndex, port)
      : null
  const nextHighRes =
    presentationUid != null && nextIndex <= lastIndex && !nextImageError
      ? presentationThumbnailUrl(ip, presentationUid, nextIndex, port)
      : null

  const trigger = useCallback(
    (action: "next" | "previous") => {
      fetch(stageTriggerUrl(ip, action, port), { method: "GET" }).catch(() => {})
    },
    [ip, port]
  )

  const handlePrevious = useCallback(() => {
    trigger("previous")
    setCurrentIndex(currentIndex - 1)
  }, [trigger, setCurrentIndex, currentIndex])

  const handleNext = useCallback(() => {
    trigger("next")
    setCurrentIndex(currentIndex + 1)
  }, [trigger, setCurrentIndex, currentIndex])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
      const el = e.target
      if (el instanceof HTMLElement && el.closest("input, textarea, select, [contenteditable=true]")) return
      e.preventDefault()
      if (e.key === "ArrowLeft") handlePrevious()
      else handleNext()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [handlePrevious, handleNext])

  const hasNext = nextIndex <= lastIndex
  const slideLabel = slides.length > 0 ? `${currentIndex + 1} / ${slides.length}` : ""

  return (
    <div className="flex h-full flex-col overflow-hidden bg-black">
      {/* Slide atual */}
      <div className="relative flex min-h-0 flex-[3] p-3 pb-1">
        <SlideImage
          lowResUrl={currentLowRes}
          highResUrl={currentHighRes}
          className="h-full"
          onError={() => setCurrentImageError(true)}
        />
        {slideLabel && (
          <span className="absolute bottom-2 right-4 rounded bg-black/50 px-2 py-0.5 text-xs text-white/70 tabular-nums">
            {slideLabel}
          </span>
        )}
      </div>

      {/* Próximo slide */}
      {hasNext && (
        <div className="relative flex min-h-0 flex-1 px-3 pb-1">
          <SlideImage
            lowResUrl={nextLowRes}
            highResUrl={nextHighRes}
            className="h-full opacity-75"
            onError={() => setNextImageError(true)}
          />
          <span className="absolute top-1 left-4 rounded bg-black/50 px-2 py-0.5 text-xs text-white/50">
            Próximo
          </span>
        </div>
      )}

      {/* Navegação */}
      <div className="flex gap-3 px-4 pb-4 pt-2">
        <Button
          type="button"
          size="lg"
          variant="secondary"
          className="flex-1 text-lg"
          onClick={handlePrevious}
          disabled={currentIndex <= 0}
        >
          <ChevronLeft className="size-6" />
          Anterior
        </Button>
        <Button
          type="button"
          size="lg"
          className="flex-1 text-lg"
          onClick={handleNext}
          disabled={!hasNext}
        >
          Próximo
          <ChevronRight className="size-6" />
        </Button>
      </div>
    </div>
  )
}
