import { useState, useCallback } from "react"
import { AlertCircle, Loader2, ArrowLeft } from "lucide-react"
import { api, isApiError } from "@/lib/api"
import { cpfForApi, onlyDigits, hasCorrectLength, formatCpfDisplay } from "../lib/cpf"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { CheckinResponse } from "@/types/api"

type Step = "form" | "loading" | "error" | "success"

function firstName(nome: string): string {
  const trimmed = nome.trim()
  const part = trimmed.split(/\s+/)[0]
  return part ?? trimmed
}

function welcomeLabel(sexo: string | null): "Bem-vindo" | "Bem-vinda" {
  if (sexo?.toLowerCase() === "f") return "Bem-vinda"
  return "Bem-vindo"
}

/** Retorna true se a cor de fundo for escura (usar texto claro). */
function isDarkBackground(hex: string): boolean {
  const h = hex.replace(/^#/, "")
  if (h.length !== 6 && h.length !== 3) return true
  const r =
    h.length === 6
      ? parseInt(h.slice(0, 2), 16)
      : parseInt(h[0] + h[0], 16)
  const g =
    h.length === 6
      ? parseInt(h.slice(2, 4), 16)
      : parseInt(h[1] + h[1], 16)
  const b =
    h.length === 6
      ? parseInt(h.slice(4, 6), 16)
      : parseInt(h[2] + h[2], 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance < 0.5
}

export default function CheckinPage() {
  const [cpfRaw, setCpfRaw] = useState("")
  const [step, setStep] = useState<Step>("form")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [successData, setSuccessData] = useState<CheckinResponse | null>(null)
  const [teamColor, setTeamColor] = useState<string>("#1a1a1a")

  const digits = onlyDigits(cpfRaw)
  const filled = hasCorrectLength(digits)
  const valid = filled

  const submit = useCallback(async () => {
    if (!valid) return
    setStep("loading")
    setErrorMessage("")
    try {
      const data = await api.checkin(cpfForApi(cpfRaw))
      setSuccessData(data)
      if (data.nome_time) {
        try {
          const times = await api.getTimes(0, 500)
          const time = times.find((t) => t.nome === data.nome_time)
          if (time?.cor_hex) {
            const hex = time.cor_hex.startsWith("#") ? time.cor_hex : `#${time.cor_hex}`
            setTeamColor(hex)
          }
        } catch {
          // mantém cor padrão
        }
      }
      setStep("success")
    } catch (err) {
      setStep("error")
      setErrorMessage(isApiError(err) ? err.message : "Erro ao processar check-in.")
    }
  }, [cpfRaw, valid])

  const reset = useCallback(() => {
    setStep("form")
    setErrorMessage("")
    setSuccessData(null)
    setCpfRaw("")
  }, [])

  if (step === "success" && successData) {
    const dark = isDarkBackground(teamColor)
    const textClass = dark ? "text-white" : "text-black"
    const btnHover = dark ? "hover:bg-white/20" : "hover:bg-black/10"
    return (
      <div
        className={cn("min-h-screen-safe flex flex-col px-2 py-5 md:px-4 md:py-6", textClass)}
        style={{ backgroundColor: teamColor }}
      >
        <Button
          type="button"
          variant="ghost"
          className={cn("self-start", btnHover)}
          onClick={reset}
        >
          <ArrowLeft className="size-4" />
          Voltar
        </Button>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-1 text-center md:gap-4 md:px-0">
          <p className="text-2xl font-medium">
            {welcomeLabel(successData.sexo)} {firstName(successData.nome)}!
          </p>
          {successData.nome_time && (
            <p className="text-base">
              Você faz parte do time <strong>{successData.nome_time}</strong>.
            </p>
          )}
          {successData.nome_responsavel_time?.trim() && (
            <p className="text-base">
              Fale com <strong>{successData.nome_responsavel_time}</strong> para pegar sua pulseira.
            </p>
          )}
          {successData.nome_onibus != null && successData.nome_onibus.trim() !== "" && (
            <p className="text-base">Seu ônibus é o {successData.nome_onibus}.</p>
          )}
          {successData.nome_pequeno_grupo != null &&
            successData.nome_pequeno_grupo.trim() !== "" && (
              <p className="text-base">
                Seu pequeno grupo é <strong>{successData.nome_pequeno_grupo}</strong>
                {successData.nome_responsavel_pequeno_grupo?.trim()
                  ? ` (Responsável: ${successData.nome_responsavel_pequeno_grupo})`
                  : ""}
                .
              </p>
            )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen-safe flex-col items-center justify-center px-2 py-5 md:px-4 md:py-6">
      <div className="w-full max-w-sm min-w-0 space-y-6 md:space-y-4">
        <h1 className="mb-12 text-center text-xl font-semibold">
          Check-in Acampa 2026
        </h1>
        <div className="space-y-2">
          <Label htmlFor="cpf">
            Informe seu CPF
          </Label>
          <Input
            id="cpf"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="000.000.000-00"
            className="input-no-spinner"
            value={cpfRaw}
            onChange={(e) => setCpfRaw(formatCpfDisplay(e.target.value))}
            disabled={step === "loading"}
          />
        </div>
        <Button
          className="w-full"
          disabled={!valid || step === "loading"}
          onClick={submit}
        >
          {step === "loading" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Enviar"
          )}
        </Button>
      </div>

      <Dialog open={step === "error"} onOpenChange={(open) => !open && setStep("form")}>
        <DialogContent showCloseButton aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="size-5" />
              CPF não encontrado
            </DialogTitle>
          </DialogHeader>
          <p className={cn("text-sm text-muted-foreground", step === "error" && "text-foreground")}>
            {errorMessage}
          </p>
        </DialogContent>
      </Dialog>
    </div>
  )
}
