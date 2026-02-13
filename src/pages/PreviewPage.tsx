import { useState, useEffect, useCallback, useRef } from "react"
import { Loader2, Maximize2, Settings } from "lucide-react"
import { useProPresenterStage } from "@/lib/propresenter-ws"
import { useProPresenterPresentation } from "@/lib/propresenter-api"
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

const STORAGE_IP = "propresenter_stage_ip"
const STORAGE_TIPO = "preview_tipo"
const STORAGE_PWD = "propresenter_pwd"

export type PreviewTipo = "louvor" | "sermao"

const TAP_WINDOW_MS = 1500
const TAPS_REQUIRED = 3

export default function PreviewPage() {
  const [configOpen, setConfigOpen] = useState(true)
  const [configMandatory, setConfigMandatory] = useState(true)
  const [ip, setIp] = useState("")
  const [tipo, setTipo] = useState<PreviewTipo>("louvor")
  const [pwd, setPwd] = useState("")
  const [formPwd, setFormPwd] = useState("")
  const [formIp, setFormIp] = useState("")
  const [formTipo, setFormTipo] = useState<PreviewTipo>("louvor")
  const [connectionError, setConnectionError] = useState("")

  const threeFingersDownRef = useRef(false)
  const tapCountRef = useRef(0)
  const windowStartRef = useRef(0)

  const { state, status, fvVersion } = useProPresenterStage(ip || null, pwd || null)
  const presentation = useProPresenterPresentation(ip || null, fvVersion)

  useEffect(() => {
    const storedIp = localStorage.getItem(STORAGE_IP)?.trim() ?? ""
    const storedTipo = localStorage.getItem(STORAGE_TIPO) as PreviewTipo | null
    const storedPwd = localStorage.getItem(STORAGE_PWD) ?? ""
    const hasValidTipo = storedTipo === "louvor" || storedTipo === "sermao"
    if (!storedIp || !hasValidTipo || !storedPwd) {
      setConfigMandatory(true)
      setConfigOpen(true)
      setFormIp(storedIp)
      setFormTipo(hasValidTipo ? storedTipo! : "louvor")
      setFormPwd(storedPwd)
      return
    }
    setIp(storedIp)
    setTipo(storedTipo!)
    setPwd(storedPwd)
    setConfigMandatory(false)
  }, [])

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

  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setConnectionError("")
    const ipVal = formIp.trim() || ""
    const tipoVal = formTipo
    const pwdVal = formPwd
    if (!pwdVal) {
      setConnectionError("Informe a senha do ProPresenter.")
      return
    }
    localStorage.setItem(STORAGE_IP, ipVal)
    localStorage.setItem(STORAGE_TIPO, tipoVal)
    localStorage.setItem(STORAGE_PWD, pwdVal)
    setIp(ipVal)
    setTipo(tipoVal)
    setPwd(pwdVal)
    setConfigOpen(false)
    setConfigMandatory(false)
  }

  const handleOpenConfig = useCallback(() => {
    setFormIp(ip)
    setFormTipo(tipo)
    setFormPwd(pwd)
    setConnectionError("")
    setConfigOpen(true)
  }, [ip, tipo, pwd])

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
  const showContent = hasCredentials && status === "connected" && !configOpen

  const toggleFullScreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else if (document.exitFullscreen) {
      document.exitFullscreen()
    }
  }, [])

  if (hasCredentials && status === "connecting") {
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
              presentationUid={presentation.presentationUid}
              currentIndex={presentation.currentIndex}
              lastIndex={presentation.lastIndex}
              slides={presentation.slides}
              setCurrentIndex={presentation.setCurrentIndex}
            />
          )}
          <div className="group fixed bottom-0 right-0 z-50 flex h-24 w-24 items-end justify-end gap-2 p-3">
            <button
              type="button"
              onClick={toggleFullScreen}
              className="flex size-12 items-center justify-center rounded-full bg-white/20 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 hover:bg-white/30"
              aria-label="Tela cheia"
            >
              <Maximize2 className="size-6" />
            </button>
            <button
              type="button"
              onClick={handleOpenConfig}
              className="flex size-12 items-center justify-center rounded-full bg-white/20 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 hover:bg-white/30"
              aria-label="Abrir configurações"
            >
              <Settings className="size-6" />
            </button>
          </div>
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
            {connectionError && (
              <p className="text-sm text-destructive">{connectionError}</p>
            )}
            <Button type="submit" className="w-full">
              Concluir
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
