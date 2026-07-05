import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams } from "react-router-dom"
import { Loader2, Maximize2, Settings } from "lucide-react"
import { useProPresenterStage } from "@/lib/propresenter-ws"
import { useProPresenterPresentation } from "@/lib/propresenter-api"
import NoSleep from "nosleep.js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import PreviewLouvor from "@/pages/PreviewLouvor"
import PreviewPregacao from "@/pages/PreviewPregacao"
import { SilentVideoKeepAwake } from "@/lib/SilentVideoKeepAwake"
import { SilentAudioKeepAwake } from "@/lib/SilentAudioKeepAwake"

const STORAGE_IP = "propresenter_stage_ip"
const STORAGE_PORT = "propresenter_stage_port"
const STORAGE_TIPO = "preview_tipo"
const STORAGE_PWD = "propresenter_pwd"

export type PreviewTipo = "louvor" | "sermao"

/** Parâmetros de query: ip, port (opcional), tipo (louvor | sermao), pwd ou senha */
export type PreviewConnectionParams = {
  ip: string
  port: string
  tipo: PreviewTipo
  pwd: string
}

export function parsePreviewConnectionParams(sp: URLSearchParams): PreviewConnectionParams | null {
  const ip = sp.get("ip")?.trim() ?? ""
  const port = sp.get("port")?.trim() ?? ""
  const pwdRaw = sp.get("pwd") ?? sp.get("senha")
  const pwd = pwdRaw != null ? String(pwdRaw) : ""
  const tipoRaw = (sp.get("tipo") ?? sp.get("mode") ?? "").trim().toLowerCase()
  let tipo: PreviewTipo | null = null
  if (tipoRaw === "louvor") tipo = "louvor"
  if (
    tipoRaw === "sermao" ||
    tipoRaw === "sermão" ||
    tipoRaw === "pregacao" ||
    tipoRaw === "pregação"
  ) {
    tipo = "sermao"
  }
  if (!ip || !pwd || !tipo) return null
  return { ip, port, tipo, pwd }
}

/** Query string para /preview (usar com setSearchParams(..., { replace: true })). */
export function previewConnectionToSearchParams(p: PreviewConnectionParams): URLSearchParams {
  const sp = new URLSearchParams()
  sp.set("ip", p.ip)
  if (p.port.trim()) sp.set("port", p.port.trim())
  sp.set("tipo", p.tipo)
  sp.set("pwd", p.pwd)
  return sp
}

function persistPreviewCredentials(p: PreviewConnectionParams) {
  localStorage.setItem(STORAGE_IP, p.ip)
  localStorage.setItem(STORAGE_PORT, p.port)
  localStorage.setItem(STORAGE_TIPO, p.tipo)
  localStorage.setItem(STORAGE_PWD, p.pwd)
}

type PreviewBootstrap = {
  configOpen: boolean
  configMandatory: boolean
  ip: string
  port: string
  tipo: PreviewTipo
  pwd: string
  formIp: string
  formPort: string
  formTipo: PreviewTipo
  formPwd: string
}

function getPreviewBootstrap(): PreviewBootstrap {
  if (typeof window === "undefined") {
    return {
      configOpen: true,
      configMandatory: true,
      ip: "",
      port: "",
      tipo: "louvor",
      pwd: "",
      formIp: "",
      formPort: "",
      formTipo: "louvor",
      formPwd: "",
    }
  }
  const fromUrl = parsePreviewConnectionParams(new URLSearchParams(window.location.search))
  if (fromUrl) {
    persistPreviewCredentials(fromUrl)
    return {
      configOpen: false,
      configMandatory: false,
      ip: fromUrl.ip,
      port: fromUrl.port,
      tipo: fromUrl.tipo,
      pwd: fromUrl.pwd,
      formIp: fromUrl.ip,
      formPort: fromUrl.port,
      formTipo: fromUrl.tipo,
      formPwd: fromUrl.pwd,
    }
  }
  const storedIp = localStorage.getItem(STORAGE_IP)?.trim() ?? ""
  const storedPort = localStorage.getItem(STORAGE_PORT)?.trim() ?? ""
  const storedTipo = localStorage.getItem(STORAGE_TIPO) as PreviewTipo | null
  const storedPwd = localStorage.getItem(STORAGE_PWD) ?? ""
  const hasValidTipo = storedTipo === "louvor" || storedTipo === "sermao"
  if (!storedIp || !hasValidTipo || !storedPwd) {
    return {
      configOpen: true,
      configMandatory: true,
      ip: "",
      port: "",
      tipo: hasValidTipo ? storedTipo! : "louvor",
      pwd: "",
      formIp: storedIp,
      formPort: storedPort,
      formTipo: hasValidTipo ? storedTipo! : "louvor",
      formPwd: storedPwd,
    }
  }
  return {
    configOpen: false,
    configMandatory: false,
    ip: storedIp,
    port: storedPort,
    tipo: storedTipo!,
    pwd: storedPwd,
    formIp: storedIp,
    formPort: storedPort,
    formTipo: storedTipo!,
    formPwd: storedPwd,
  }
}

const TAP_WINDOW_MS = 1500
const TAPS_REQUIRED = 3
const MENU_HIDE_AFTER_MS = 10_000

export default function PreviewPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [initial] = useState(() => getPreviewBootstrap())
  const [configOpen, setConfigOpen] = useState(initial.configOpen)
  const [configMandatory, setConfigMandatory] = useState(initial.configMandatory)
  const [ip, setIp] = useState(initial.ip)
  const [port, setPort] = useState(initial.port)
  const [tipo, setTipo] = useState<PreviewTipo>(initial.tipo)
  const [pwd, setPwd] = useState(initial.pwd)
  const [formPwd, setFormPwd] = useState(initial.formPwd)
  const [formIp, setFormIp] = useState(initial.formIp)
  const [formPort, setFormPort] = useState(initial.formPort)
  const [formTipo, setFormTipo] = useState<PreviewTipo>(initial.formTipo)
  const [connectionError, setConnectionError] = useState("")

  const threeFingersDownRef = useRef(false)
  const tapCountRef = useRef(0)
  const windowStartRef = useRef(0)
  const [menuVisible, setMenuVisible] = useState(false)
  const menuHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { state, status, error: wsError, fvVersion } = useProPresenterStage(
    ip || null,
    pwd || null,
    port || null
  )
  const presentation = useProPresenterPresentation(ip || null, fvVersion, port || null)

  const urlConnectKey = searchParams.toString()
  useEffect(() => {
    if (!urlConnectKey) return
    const parsed = parsePreviewConnectionParams(new URLSearchParams(urlConnectKey))
    if (!parsed) return
    persistPreviewCredentials(parsed)
    setIp(parsed.ip)
    setPort(parsed.port)
    setTipo(parsed.tipo)
    setPwd(parsed.pwd)
    setFormIp(parsed.ip)
    setFormPort(parsed.port)
    setFormTipo(parsed.tipo)
    setFormPwd(parsed.pwd)
    setConfigOpen(false)
    setConfigMandatory(false)
    setConnectionError("")
  }, [urlConnectKey])

  useEffect(() => {
    if (status === "connected") {
      setConfigOpen(false)
      setConnectionError("")
    } else if (status === "error") {
      setConfigOpen(true)
      setConfigMandatory(true)
      setConnectionError("Falha na conexão. Verifique o IP e a senha do ProPresenter.")
    }
  }, [status])

  /** Depois do 1.º connected, mantém o slide visível durante quedas/reconexão do WebSocket. */
  const [lingerDisplay, setLingerDisplay] = useState(false)
  useEffect(() => {
    if (status === "connected") setLingerDisplay(true)
    if (status === "error") setLingerDisplay(false)
  }, [status])
  useEffect(() => {
    setLingerDisplay(false)
  }, [ip, port, pwd, tipo])

  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setConnectionError("")
    const ipVal = formIp.trim() || ""
    const portVal = formPort.trim() || ""
    const tipoVal = formTipo
    const pwdVal = formPwd
    if (!pwdVal) {
      setConnectionError("Informe a senha do ProPresenter.")
      return
    }
    localStorage.setItem(STORAGE_IP, ipVal)
    localStorage.setItem(STORAGE_PORT, portVal)
    localStorage.setItem(STORAGE_TIPO, tipoVal)
    localStorage.setItem(STORAGE_PWD, pwdVal)
    setIp(ipVal)
    setPort(portVal)
    setTipo(tipoVal)
    setPwd(pwdVal)
    setSearchParams(previewConnectionToSearchParams({ ip: ipVal, port: portVal, tipo: tipoVal, pwd: pwdVal }), {
      replace: true,
    })
    setConfigOpen(false)
    setConfigMandatory(false)
    ;(noSleepRef.current ??= new NoSleep()).enable()
  }

  const handleOpenConfig = useCallback(() => {
    setFormIp(ip)
    setFormPort(port)
    setFormTipo(tipo)
    setFormPwd(pwd)
    setConnectionError("")
    setConfigOpen(true)
  }, [ip, port, tipo, pwd])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 3) threeFingersDownRef.current = true
    else threeFingersDownRef.current = false
  }, [])

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 0 && threeFingersDownRef.current) {
        threeFingersDownRef.current = false
        const now = Date.now()
        if (tapCountRef.current === 0) windowStartRef.current = now
        tapCountRef.current += 1
        if (tapCountRef.current >= TAPS_REQUIRED) {
          if (now - windowStartRef.current <= TAP_WINDOW_MS) {
            tapCountRef.current = 0
            handleOpenConfig()
          } else {
            tapCountRef.current = 1
            windowStartRef.current = now
          }
        }
      } else if (e.touches.length !== 3) {
        threeFingersDownRef.current = false
      }
      if (
        e.touches.length === 0 &&
        tapCountRef.current > 0 &&
        Date.now() - windowStartRef.current > TAP_WINDOW_MS
      ) {
        tapCountRef.current = 0
      }
    },
    [handleOpenConfig]
  )

  const hasCredentials = Boolean(ip && tipo && pwd)
  const portOrDefault = port.trim() || "53398"
  const showContent =
    hasCredentials &&
    !configOpen &&
    (status === "connected" || (lingerDisplay && status !== "error"))
  /** Loader só na primeira ligação; reconexões mantêm o conteúdo (evita piscar). */
  const showInitialConnectingLoader =
    hasCredentials && status === "connecting" && !configOpen && !lingerDisplay

  const noSleepRef = useRef<InstanceType<typeof NoSleep> | null>(null)
  useEffect(() => {
    return () => {
      noSleepRef.current?.disable()
      noSleepRef.current = null
    }
  }, [])
  useEffect(() => {
    if (!showContent) noSleepRef.current?.disable()
  }, [showContent])

  const toggleFullScreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else if (document.exitFullscreen) {
      document.exitFullscreen()
    }
  }, [])

  const clearMenuHideTimeout = useCallback(() => {
    if (menuHideTimeoutRef.current != null) {
      clearTimeout(menuHideTimeoutRef.current)
      menuHideTimeoutRef.current = null
    }
  }, [])

  const scheduleMenuHide = useCallback(() => {
    clearMenuHideTimeout()
    menuHideTimeoutRef.current = setTimeout(() => setMenuVisible(false), MENU_HIDE_AFTER_MS)
  }, [clearMenuHideTimeout])

  const showMenu = useCallback(() => {
    setMenuVisible(true)
    scheduleMenuHide()
  }, [scheduleMenuHide])

  const hideMenu = useCallback(() => {
    setMenuVisible(false)
    clearMenuHideTimeout()
  }, [clearMenuHideTimeout])

  useEffect(() => {
    return () => clearMenuHideTimeout()
  }, [clearMenuHideTimeout])

  /* Tela cheia só na 1.ª ligação; com modal aberto não cobre o formulário. */
  if (showInitialConnectingLoader) {
    return (
      <div className="flex min-h-screen-safe w-full items-center justify-center bg-black">
        <Loader2 className="size-10 animate-spin text-white" />
      </div>
    )
  }

  return (
    <>
      {showContent && (
        <div
          className="h-screen-fixed relative w-full overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {tipo === "louvor" ? (
            <PreviewLouvor state={state} />
          ) : (
            <PreviewPregacao
              ip={ip}
              port={portOrDefault}
              presentationUid={presentation.presentationUid}
              currentIndex={presentation.currentIndex}
              lastIndex={presentation.lastIndex}
              slides={presentation.slides}
              setCurrentIndex={presentation.setCurrentIndex}
              currentSlideUid={state.currentSlideUid}
              nextSlideUid={state.nextSlideUid}
            />
          )}
          <div className="fixed top-0 right-0 z-50 flex min-h-[80px] min-w-[140px] items-start justify-end pt-3 pr-3">
            {!menuVisible ? (
              <div
                className="min-h-[44px] min-w-[120px] cursor-pointer rounded-lg"
                role="button"
                tabIndex={0}
                aria-label="Mostrar menu"
                onMouseEnter={showMenu}
                onTouchEnd={(e) => {
                  e.preventDefault()
                  showMenu()
                }}
                onClick={(e) => {
                  e.preventDefault()
                  showMenu()
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    showMenu()
                  }
                }}
              />
            ) : (
              <div
                className="flex gap-2 transition-opacity duration-200 opacity-100"
                onMouseEnter={showMenu}
              >
                <button
                  type="button"
                  onClick={() => {
                    hideMenu()
                    toggleFullScreen()
                  }}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-white/25 p-2.5 text-white backdrop-blur hover:bg-white/40"
                  aria-label="Tela cheia"
                >
                  <Maximize2 className="size-5 shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    hideMenu()
                    handleOpenConfig()
                  }}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-white/25 p-2.5 text-white backdrop-blur hover:bg-white/40"
                  aria-label="Abrir configurações"
                >
                  <Settings className="size-5 shrink-0" />
                </button>
              </div>
            )}
          </div>
          {showContent && (
            <>
              <SilentVideoKeepAwake />
              <SilentAudioKeepAwake />
            </>
          )}
        </div>
      )}

      <Dialog
        open={configOpen}
        onOpenChange={(open) => {
          if (!configMandatory) setConfigOpen(open)
        }}
      >
        <DialogContent
          showCloseButton={!configMandatory}
          onInteractOutside={configMandatory ? (e) => e.preventDefault() : undefined}
          onEscapeKeyDown={configMandatory ? (e) => e.preventDefault() : undefined}
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle>Configuração da tela de retorno</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleConfigSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="preview-ip">IP do ProPresenter</Label>
              <Input
                id="preview-ip"
                type="text"
                placeholder="192.168.30.18"
                value={formIp}
                onChange={(e) => setFormIp(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preview-port">Porta</Label>
              <Input
                id="preview-port"
                type="text"
                inputMode="numeric"
                placeholder="53398"
                value={formPort}
                onChange={(e) => setFormPort(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Use a porta mostrada na rede do ProPresenter (Configurações → Rede). Em geral é a &quot;Porta
                principal&quot; (no exemplo da sua rede remota, 50466) — WebSocket e API HTTP usam a mesma
                porta. Não confunda com outra porta só da secção TCP/IP, se aparecer diferente. O padrão 53398
                do app só serve se for o número que o ProPresenter mostrar. No Mac de projeção, permita essa
                porta no firewall para a LAN.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="preview-pwd">Senha do ProPresenter</Label>
              <Input
                id="preview-pwd"
                type="password"
                value={formPwd}
                onChange={(e) => setFormPwd(e.target.value)}
                placeholder="Senha do Stage Display"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de tela</Label>
              <Select
                value={formTipo}
                onValueChange={(v) => setFormTipo(v as PreviewTipo)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="louvor">Louvor</SelectItem>
                  <SelectItem value="sermao">Sermão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(wsError || connectionError) && (
              <p className="text-sm text-destructive">{wsError || connectionError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Pode abrir com parâmetros na URL para ligar direto (se falhar, este formulário abre):
              <code className="mt-1 block break-all rounded bg-muted px-1.5 py-1 text-[11px]">
                /preview?ip=192.168.10.129&amp;port=50466&amp;tipo=louvor&amp;pwd=123
              </code>
              <span className="mt-1 block">
                <code className="text-[11px]">tipo</code> = <code className="text-[11px]">louvor</code> ou{" "}
                <code className="text-[11px]">sermao</code>. Senha também aceita{" "}
                <code className="text-[11px]">senha=</code>. Use{" "}
                <code className="text-[11px]">encodeURIComponent</code> na senha se tiver caracteres
                especiais.
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Se a tela desligar por inatividade, desative a economia de energia ou aumente o
              tempo de bloqueio nas definições do dispositivo.
            </p>
            <Button type="submit" className="w-full">
              Concluir
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
