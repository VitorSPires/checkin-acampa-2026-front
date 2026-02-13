import { useEffect, useRef } from "react"
import type { ProPresenterStageState } from "@/types/propresenter"

const MIN_FONT_SIZE = 16
const MAX_FONT_SIZE = 400
const PADDING_PX = 8

function useFitFontSize(content: string) {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const text = textRef.current
    if (!container || !text) return

    const update = () => {
      const maxH = container.clientHeight - PADDING_PX
      const maxW = container.clientWidth - PADDING_PX
      if (maxH <= 0 || maxW <= 0) return

      text.style.fontSize = `${MAX_FONT_SIZE}px`
      let low = MIN_FONT_SIZE
      let high = MAX_FONT_SIZE
      let best = MIN_FONT_SIZE

      while (low <= high) {
        const mid = Math.round((low + high) / 2)
        text.style.fontSize = `${mid}px`
        const overflow =
          text.scrollHeight > maxH || text.scrollWidth > maxW
        if (overflow) {
          high = mid - 1
        } else {
          best = mid
          low = mid + 1
        }
      }

      text.style.fontSize = `${best}px`
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(container)

    return () => ro.disconnect()
  }, [content])

  return { containerRef, textRef }
}

interface FitTextBlockProps {
  content: string
  color: string
}

function FitTextBlock({ content, color }: FitTextBlockProps) {
  const { containerRef, textRef } = useFitFontSize(content)

  return (
    <div
      ref={containerRef}
      className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pt-4"
    >
      <p
        ref={textRef}
        className="max-w-full font-medium leading-tight"
        style={{
          color,
          fontSize: MAX_FONT_SIZE,
          margin: 0,
        }}
      >
        {content || "\u00a0"}
      </p>
    </div>
  )
}

interface PreviewLouvorProps {
  state: ProPresenterStageState
}

export default function PreviewLouvor({ state }: PreviewLouvorProps) {
  return (
    <div className="m-0 flex h-full max-h-full w-full flex-col overflow-hidden bg-black p-0">
      <FitTextBlock content={state.currentSlideText} color="#ffffff" />
      <FitTextBlock content={state.nextSlideText} color="#b8860b" />
    </div>
  )
}
