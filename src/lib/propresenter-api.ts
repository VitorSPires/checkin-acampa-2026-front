import { useEffect, useState, useCallback } from "react"

function getHost(ip: string): string {
  return ip.trim().replace(/^https?:\/\//i, "").split("/")[0]
}

const BASE = (ip: string) => `http://${getHost(ip)}:53398`

/** Slide da API presentation (groups[].slides[]). */
export interface ProPresenterPresentationSlide {
  enabled?: boolean
  notes?: string
  text?: string
  label?: string
  size?: { width?: number; height?: number }
}

/** Resposta de GET /v1/presentation/active */
export interface ProPresenterActiveResponse {
  presentation?: {
    id?: { uuid?: string; name?: string; index?: number }
    groups?: Array<{
      name?: string
      uuid?: string
      slides?: ProPresenterPresentationSlide[]
    }>
  }
}

/** Resposta de GET /v1/presentation/slide_index */
export interface ProPresenterSlideIndexResponse {
  presentation_index?: {
    index?: number
    presentation_id?: { uuid?: string; name?: string; index?: number }
  }
}

export function presentationActiveUrl(ip: string): string {
  return `${BASE(ip)}/v1/presentation/active`
}

export function presentationSlideIndexUrl(ip: string): string {
  return `${BASE(ip)}/v1/presentation/slide_index`
}

export function presentationThumbnailUrl(
  ip: string,
  presentationUid: string,
  index: number
): string {
  return `${BASE(ip)}/v1/presentation/${presentationUid}/thumbnail/${index}`
}

/** Lista plana de slides (notes, text, label) para uso por índice. */
export type PresentationSlideInfo = Pick<
  ProPresenterPresentationSlide,
  "notes" | "text" | "label"
>

export type PresentationStatus = "idle" | "loading" | "ready" | "error"

export interface UseProPresenterPresentationResult {
  presentationUid: string | null
  currentIndex: number
  lastIndex: number
  slides: PresentationSlideInfo[]
  status: PresentationStatus
  error: string | null
  setCurrentIndex: (i: number) => void
  refetch: () => void
}

function flattenSlides(res: ProPresenterActiveResponse): PresentationSlideInfo[] {
  const groups = res.presentation?.groups ?? []
  const out: PresentationSlideInfo[] = []
  for (const g of groups) {
    const list = g.slides ?? []
    for (const s of list) {
      out.push({
        notes: s.notes ?? "",
        text: s.text ?? "",
        label: s.label ?? "",
      })
    }
  }
  return out
}

function getLastIndex(slides: PresentationSlideInfo[]): number {
  if (slides.length === 0) return -1
  return slides.length - 1
}

/**
 * @param ip - IP do ProPresenter
 * @param syncTrigger - Quando muda (ex.: fvVersion do WebSocket), refaz fetch de active + slide_index para sincronizar o índice com o ProPresenter
 */
export function useProPresenterPresentation(
  ip: string | null,
  syncTrigger?: number
): UseProPresenterPresentationResult {
  const [presentationUid, setPresentationUid] = useState<string | null>(null)
  const [currentIndex, setCurrentIndexState] = useState(0)
  const [lastIndex, setLastIndex] = useState(-1)
  const [slides, setSlides] = useState<PresentationSlideInfo[]>([])
  const [status, setStatus] = useState<PresentationStatus>("idle")
  const [error, setError] = useState<string | null>(null)

  const fetchPresentation = useCallback(async () => {
    if (!ip?.trim()) return
    const host = getHost(ip)
    const base = `http://${host}:53398`
    setStatus("loading")
    setError(null)
    try {
      const [activeRes, indexRes] = await Promise.all([
        fetch(`${base}/v1/presentation/active`).then((r) => {
          if (!r.ok) throw new Error("Falha ao carregar apresentação")
          return r.json() as Promise<ProPresenterActiveResponse>
        }),
        fetch(`${base}/v1/presentation/slide_index`).then((r) => {
          if (!r.ok) throw new Error("Falha ao carregar índice do slide")
          return r.json() as Promise<ProPresenterSlideIndexResponse>
        }),
      ])
      const flat = flattenSlides(activeRes)
      const uid =
        activeRes.presentation?.id?.uuid ??
        indexRes.presentation_index?.presentation_id?.uuid ??
        null
      const idx = indexRes.presentation_index?.index ?? 0
      const last = getLastIndex(flat)
      setSlides(flat)
      setLastIndex(last)
      setPresentationUid(uid)
      setCurrentIndexState(typeof idx === "number" ? idx : 0)
      setStatus("ready")
    } catch (e) {
      setStatus("error")
      setError(e instanceof Error ? e.message : "Erro ao carregar presentation")
    }
  }, [ip])

  useEffect(() => {
    if (!ip?.trim()) {
      setStatus("idle")
      return
    }
    fetchPresentation()
  }, [ip, fetchPresentation])

  useEffect(() => {
    if (syncTrigger != null && syncTrigger > 0 && ip?.trim()) {
      fetchPresentation()
    }
  }, [syncTrigger])

  const setCurrentIndex = useCallback(
    (i: number) => {
      setCurrentIndexState((_prev) => {
        const next = i
        if (next < 0 || next > lastIndex) {
          fetchPresentation()
        }
        return next
      })
    },
    [lastIndex, fetchPresentation]
  )

  return {
    presentationUid,
    currentIndex,
    lastIndex,
    slides,
    status,
    error,
    setCurrentIndex,
    refetch: fetchPresentation,
  }
}
