import { useState, useEffect, useLayoutEffect, useRef } from "react"
import { stageTriggerUrl } from "@/lib/propresenter-ws"
import { presentationThumbnailUrl } from "@/lib/propresenter-api"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export interface PreviewPregacaoPresentationProps {
  ip: string
  presentationUid: string | null
  currentIndex: number
  lastIndex: number
  slides: { notes?: string; text?: string; label?: string }[]
  setCurrentIndex: (i: number) => void
}

/** Placeholder no lugar da imagem do slide (sem texto para não piscar). */
function DefaultSlidePlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={`flex w-full items-center justify-center rounded bg-black ${className ?? ""}`}
      aria-hidden
    />
  )
}

/**
 * Exibe a imagem alvo (thumbnail). Depois da primeira carga, nunca limpa: mantém a última
 * imagem visível e só troca quando a nova terminar de carregar.
 */
function SlideImage({
  srcUrl: targetUrl,
  className,
  onError,
}: {
  srcUrl: string | null
  label: string
  className?: string
  onError: () => void
  imageKey: string
}) {
  const [displayUrl, setDisplayUrl] = useState<string | null>(null)

  const hasTarget = targetUrl != null && targetUrl !== ""
  const urlToShow = displayUrl ?? targetUrl ?? null
  const isNewUrl = hasTarget && displayUrl !== targetUrl

  if (!urlToShow) {
    return <DefaultSlidePlaceholder className={className} />
  }

  return (
    <div className={`relative flex w-full items-center justify-center overflow-hidden rounded bg-black ${className ?? ""}`}>
      <img
        src={urlToShow}
        alt=""
        aria-hidden
        className="h-full w-full object-contain"
        decoding="async"
        onLoad={(e) => setDisplayUrl((e.target as HTMLImageElement).currentSrc)}
        onError={onError}
      />
      {isNewUrl && (
        <img
          src={targetUrl}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-contain opacity-0"
          decoding="async"
          onLoad={() => setDisplayUrl(targetUrl)}
          onError={onError}
        />
      )}
    </div>
  )
}

export default function PreviewPregacao({
  ip,
  presentationUid,
  currentIndex,
  lastIndex,
  slides,
  setCurrentIndex,
}: PreviewPregacaoPresentationProps) {
  const [currentImageError, setCurrentImageError] = useState(false)
  const [nextImageError, setNextImageError] = useState(false)
  const notesScrollRef = useRef<HTMLDivElement>(null)
  const savedScrollTopRef = useRef(0)

  useEffect(() => {
    setCurrentImageError(false)
  }, [currentIndex])

  useEffect(() => {
    setNextImageError(false)
  }, [currentIndex])

  useLayoutEffect(() => {
    const el = notesScrollRef.current
    if (el) el.scrollTop = savedScrollTopRef.current
  }, [currentIndex])

  const currentNotes = slides[currentIndex]?.notes ?? "—"
  const currentUrl =
    presentationUid != null && currentIndex >= 0 && currentIndex <= lastIndex
      ? presentationThumbnailUrl(ip, presentationUid, currentIndex)
      : null
  const nextIndex = currentIndex + 1
  const nextUrl =
    presentationUid != null && nextIndex <= lastIndex
      ? presentationThumbnailUrl(ip, presentationUid, nextIndex)
      : null

  const trigger = (action: "next" | "previous") => {
    fetch(stageTriggerUrl(ip, action), { method: "GET" }).catch(() => {})
  }

  const handlePrevious = () => {
    trigger("previous")
    setCurrentIndex(currentIndex - 1)
  }

  const handleNext = () => {
    trigger("next")
    setCurrentIndex(currentIndex + 1)
  }

  const showCurrentImage = currentUrl != null && !currentImageError
  const showNextImage = nextUrl != null && !nextImageError

  return (
    <div className="m-0 flex h-full min-h-screen-safe w-full overflow-hidden bg-black p-0">
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        <div
          ref={notesScrollRef}
          className="flex flex-1 flex-col overflow-y-auto p-4 text-white md:max-w-[50%]"
          onScroll={(e) => {
            savedScrollTopRef.current = (e.target as HTMLDivElement).scrollTop
          }}
        >
          <div className="whitespace-pre-wrap text-base leading-relaxed">
            {currentNotes}
          </div>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:max-w-[50%]">
          <div className="flex w-full flex-1 flex-col items-center justify-center gap-4">
            {showCurrentImage ? (
              <SlideImage
                srcUrl={currentUrl}
                label=""
                className="max-h-[40vh] min-h-[200px]"
                onError={() => setCurrentImageError(true)}
                imageKey={`current-${currentIndex}`}
              />
            ) : (
              <DefaultSlidePlaceholder className="max-h-[40vh] min-h-[200px]" />
            )}
            {showNextImage ? (
              <SlideImage
                srcUrl={nextUrl}
                label=""
                className="max-h-[25vh] min-h-[120px] opacity-90"
                onError={() => setNextImageError(true)}
                imageKey={`next-${nextIndex}`}
              />
            ) : (
              <DefaultSlidePlaceholder className="max-h-[25vh] min-h-[120px] opacity-90" />
            )}
          </div>
          <div className="flex w-full max-w-md gap-4">
            <Button type="button" size="lg" className="flex-1 text-lg" onClick={handlePrevious}>
              <ChevronLeft className="size-6" />
              Anterior
            </Button>
            <Button type="button" size="lg" className="flex-1 text-lg" onClick={handleNext}>
              Próximo
              <ChevronRight className="size-6" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
