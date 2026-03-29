import { useEffect, useRef, useState, useCallback } from "react"
import type { ProPresenterStageState, ProPresenterAryItem } from "@/types/propresenter"
import { INITIAL_STAGE_STATE } from "@/types/propresenter"

const ZERO_UID = "00000000-0000-0000-0000-000000000000"
const DEFAULT_PORT = "53398"

function getPort(port: string | null | undefined): string {
  const p = String(port ?? "").trim()
  return p || DEFAULT_PORT
}

function uidOk(uid: unknown): uid is string {
  if (typeof uid !== "string") return false
  const s = uid.trim()
  return s.length > 0 && s !== ZERO_UID
}

/** Mensagem acn=fv contém ary[]. Para item acn=cs use uid em stage/image/{uid} (atual). Para acn=ns use uid (próximo). */
function parseFvAry(ary: ProPresenterAryItem[]): Partial<ProPresenterStageState> {
  const out: Partial<ProPresenterStageState> = {}
  for (const item of ary) {
    const txt = (item.txt ?? "").toString()
    if (item.acn === "cs") {
      out.currentSlideUid = uidOk(item.uid) ? item.uid!.trim() : null
      out.currentSlideText = txt
    } else if (item.acn === "csn") {
      out.currentSlideNotes = txt
    } else if (item.acn === "ns") {
      out.nextSlideUid = uidOk(item.uid) ? item.uid!.trim() : null
      out.nextSlideText = txt
    } else if (item.acn === "nsn") {
      out.nextSlideNotes = txt
    }
  }
  return out
}

export interface UseProPresenterStageResult {
  state: ProPresenterStageState
  status: "disconnected" | "connecting" | "connected" | "error"
  error: string | null
  /** Incrementa a cada mensagem fv recebida; usar para sincronizar o índice da presentation. */
  fvVersion: number
}

export function useProPresenterStage(
  ip: string | null,
  pwd: string | null,
  port?: string | null
): UseProPresenterStageResult {
  const [state, setState] = useState<ProPresenterStageState>(INITIAL_STAGE_STATE)
  const [status, setStatus] = useState<UseProPresenterStageResult["status"]>("disconnected")
  const [error, setError] = useState<string | null>(null)
  const [fvVersion, setFvVersion] = useState(0)
  const wsRef = useRef<WebSocket | null>(null)
  /** Só o socket atual deve tratar onclose (evita oscilação ao trocar IP ou no cleanup do efeito). */
  const activeSocketRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttemptRef = useRef(0)
  /** true após onopen desta tentativa — onclose sem abrir era falha de handshake/rede (não desconexão). */
  const openedRef = useRef(false)

  const connect = useCallback(() => {
    if (!ip?.trim() || !pwd?.trim()) {
      setStatus("disconnected")
      return
    }
    const host = ip.trim().replace(/^https?:\/\//i, "").split("/")[0]
    const wsUrl = `ws://${host}:${getPort(port)}/stagedisplay`
    setStatus("connecting")
    setError(null)
    openedRef.current = false

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws
    activeSocketRef.current = ws

    ws.onopen = () => {
      if (activeSocketRef.current !== ws) return
      openedRef.current = true
      reconnectAttemptRef.current = 0
      setStatus("connected")
      setError(null)
      try {
        ws.send(JSON.stringify({ pwd: pwd.trim(), ptl: 610, acn: "ath" }))
      } catch {
        // ignore
      }
    }

    ws.onmessage = (ev: MessageEvent) => {
      try {
        const data = JSON.parse(ev.data) as { acn?: string; ary?: ProPresenterAryItem[] }
        if (data.acn === "sys") return
        if (data.acn === "fv" && Array.isArray(data.ary)) {
          const patch = parseFvAry(data.ary)
          setFvVersion((v) => v + 1)
          setState((prev) => {
            const next = { ...prev, ...patch }
            const uidChanged =
              (patch.currentSlideUid !== undefined && patch.currentSlideUid !== prev.currentSlideUid) ||
              (patch.nextSlideUid !== undefined && patch.nextSlideUid !== prev.nextSlideUid)
            return { ...next, stageUpdateKey: uidChanged ? Date.now() : prev.stageUpdateKey }
          })
        }
      } catch {
        // ignore
      }
    }

    ws.onerror = () => {
      if (activeSocketRef.current !== ws) return
      setError("Erro de conexão")
    }

    ws.onclose = () => {
      if (activeSocketRef.current !== ws) return
      activeSocketRef.current = null
      wsRef.current = null
      const hadOpened = openedRef.current
      openedRef.current = false
      if (!hadOpened) {
        setStatus("error")
        setError((prev) =>
          prev ??
          "Não foi possível conectar ao Stage Display. Confira IP, porta (a da rede no ProPresenter, em geral a \"Porta principal\") e firewall no Mac de projeção."
        )
      } else {
        setStatus("disconnected")
      }
      const attempt = reconnectAttemptRef.current
      reconnectAttemptRef.current = Math.min(attempt + 1, 12)
      const delay = Math.min(1000 * 2 ** attempt, 30_000)
      reconnectRef.current = setTimeout(connect, delay)
    }
  }, [ip, pwd, port])

  useEffect(() => {
    reconnectAttemptRef.current = 0
    connect()
    return () => {
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current)
        reconnectRef.current = null
      }
      const w = wsRef.current
      if (w) {
        activeSocketRef.current = null
        wsRef.current = null
        w.close()
      }
    }
  }, [connect])

  return { state, status, error, fvVersion }
}

export function stageTriggerUrl(ip: string, action: "next" | "previous", port?: string | null): string {
  const host = ip.trim().replace(/^https?:\/\//i, "").split("/")[0]
  return `http://${host}:${getPort(port)}/v1/trigger/${action}`
}

export function stageImageUrl(ip: string, uid: string | null, cacheBust?: number, port?: string | null): string | null {
  if (uid == null || String(uid).trim() === "") return null
  const host = ip.trim().replace(/^https?:\/\//i, "").split("/")[0]
  const base = `http://${host}:${getPort(port)}/stage/image/${uid.trim()}`
  return cacheBust != null ? `${base}?t=${cacheBust}` : base
}
