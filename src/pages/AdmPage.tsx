import { useState, useEffect, useCallback } from "react"
import { Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCpfDisplay, cpfForApi } from "@/lib/cpf"
import type {
  Sistema,
  SistemaUpdate,
  Onibus,
  OnibusCreate,
  Time,
  TimeCreate,
  TimeUpdate,
  PequenoGrupo,
  PequenoGrupoCreate,
  Usuario,
  UsuarioCreate,
  UsuarioUpdate,
  ListarPresentesResponse,
} from "@/types/api"

const ADM_SESSION_KEY = "checkin_adm_until"
const ADM_SESSION_HOURS = 2
const ADM_SESSION_MS = ADM_SESSION_HOURS * 60 * 60 * 1000

function getAdmSessionValid(): boolean {
  if (typeof window === "undefined") return false
  const until = localStorage.getItem(ADM_SESSION_KEY)
  if (!until) return false
  const n = Number(until)
  if (Number.isNaN(n)) return false
  return Date.now() < n
}

function setAdmSession() {
  localStorage.setItem(ADM_SESSION_KEY, String(Date.now() + ADM_SESSION_MS))
}

/** Formata ISO (UTC) para data/hora no fuso local do usuário (pt-BR). */
function formatDateTime(iso: string | null): string {
  if (!iso) return "-"
  try {
    // Se a API enviar sem timezone (ex: "2026-02-10T18:30:00"), trata como UTC para exibir certo no fuso local.
    const utc = /Z|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : iso.replace(/\.\d{3}$/, "") + "Z"
    return new Date(utc).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    })
  } catch {
    return iso
  }
}

export default function AdmPage() {
  const [unlocked, setUnlocked] = useState(getAdmSessionValid)
  const [senha, setSenha] = useState("")
  const [loading, setLoading] = useState(false)
  const [senhaError, setSenhaError] = useState("")

  const handleSenhaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSenhaError("")
    setLoading(true)
    try {
      const sistema = await api.getSistema()
      if (sistema.senha_adm === senha) {
        setAdmSession()
        setUnlocked(true)
      } else {
        setSenhaError("Senha incorreta.")
      }
    } catch {
      setSenhaError("Erro ao validar. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  if (!unlocked) {
    return (
      <div className="flex min-h-screen-safe flex-col items-center justify-center px-2 py-5 md:px-4 md:py-6">
        <form onSubmit={handleSenhaSubmit} className="w-full max-w-sm min-w-0 space-y-5 md:space-y-4">
          <h1 className="mb-12 text-center text-xl font-semibold">
            Administração
          </h1>
          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>
          {senhaError && (
            <p className="text-sm text-destructive">{senhaError}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Entrar"}
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen-safe px-2 pt-5 pb-6 md:px-4 md:pt-6 md:pb-8">
      <div className="mx-auto w-full max-w-4xl">
        <h1 className="mb-6 text-xl font-semibold">Administração</h1>
        <Tabs defaultValue="presentes">
          <TabsList className="flex flex-wrap gap-1">
            <TabsTrigger value="presentes">Lista de presentes</TabsTrigger>
            <TabsTrigger value="corrigir">Corrigir cadastro</TabsTrigger>
            <TabsTrigger value="incompletos">Cadastros incompletos</TabsTrigger>
            <TabsTrigger value="config">Configuração</TabsTrigger>
          </TabsList>
          <TabsContent value="presentes" className="mt-4">
            <PresentesAusentesTab />
          </TabsContent>
          <TabsContent value="corrigir" className="mt-4">
            <CorrigirCadastroTab />
          </TabsContent>
          <TabsContent value="incompletos" className="mt-4">
            <CadastrosIncompletosTab />
          </TabsContent>
          <TabsContent value="config" className="mt-4 space-y-8">
            <ConfiguracaoTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function PresentesAusentesTab() {
  const [data, setData] = useState<ListarPresentesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await api.listarPresentes()
      setData(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) return <p className="text-muted-foreground">Carregando...</p>
  if (error) return <p className="text-destructive">{error}</p>
  if (!data) return null

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-2 font-medium">
          Presentes ({data.quantidade_presentes})
        </h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Data do check-in</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.presentes.map((p, i) => (
              <TableRow key={i}>
                <TableCell>{p.nome}</TableCell>
                <TableCell>{formatDateTime(p.data_checkin)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
      <section>
        <h2 className="mb-2 font-medium">
          Ausentes ({data.quantidade_ausentes})
        </h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.ausentes.map((a, i) => (
              <TableRow key={i}>
                <TableCell>{a.nome}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  )
}

const NONE_VALUE = "__none__"
const DEBOUNCE_MS = 400

function CorrigirCadastroTab() {
  const [searchInput, setSearchInput] = useState("")
  const [searchDebounced, setSearchDebounced] = useState("")
  const [list, setList] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [corrigirOpen, setCorrigirOpen] = useState(false)
  const [corrigirUser, setCorrigirUser] = useState<Usuario | null>(null)
  const [corrigirCpf, setCorrigirCpf] = useState("")
  const [corrigirLoading, setCorrigirLoading] = useState(false)

  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState<UsuarioCreate>({
    nome: "",
    cpf: "",
    sexo: null,
    id_time: null,
    id_onibus: null,
    id_pequeno_grupo: null,
  })
  const [addLoading, setAddLoading] = useState(false)
  const [times, setTimes] = useState<Time[]>([])
  const [onibus, setOnibus] = useState<Onibus[]>([])
  const [pequenosGrupos, setPequenosGrupos] = useState<PequenoGrupo[]>([])

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(searchInput.trim()), DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [searchInput])

  const loadSearch = useCallback(async () => {
    if (!searchDebounced) {
      setList([])
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await api.getUsuarios(0, 500, searchDebounced)
      setList(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao buscar.")
      setList([])
    } finally {
      setLoading(false)
    }
  }, [searchDebounced])

  useEffect(() => {
    loadSearch()
  }, [loadSearch])

  const openCorrigir = (u: Usuario) => {
    setCorrigirUser(u)
    setCorrigirCpf(formatCpfDisplay(u.cpf))
    setCorrigirOpen(true)
  }
  const saveCorrigir = async () => {
    if (!corrigirUser) return
    setCorrigirLoading(true)
    try {
      const updated = await api.updateUsuario(corrigirUser.id, {
        cpf: cpfForApi(corrigirCpf),
      })
      setList((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
      setCorrigirOpen(false)
    } finally {
      setCorrigirLoading(false)
    }
  }

  const loadListsForAdd = useCallback(async () => {
    try {
      const [t, o, pg] = await Promise.all([
        api.getTimes(0, 500),
        api.getOnibusList(0, 500),
        api.getPequenosGrupos(0, 500),
      ])
      setTimes(t)
      setOnibus(o)
      setPequenosGrupos(pg)
    } catch {
      // mantém atuais
    }
  }, [])
  const openAdd = () => {
    loadListsForAdd()
    setAddForm({
      nome: "",
      cpf: "",
      sexo: null,
      id_time: null,
      id_onibus: null,
      id_pequeno_grupo: null,
    })
    setAddOpen(true)
  }
  const saveAdd = async () => {
    setAddLoading(true)
    try {
      const payload: UsuarioCreate = {
        nome: addForm.nome,
        cpf: cpfForApi(addForm.cpf),
        sexo: addForm.sexo || null,
        id_time: addForm.id_time ?? null,
        id_onibus: addForm.id_onibus ?? null,
        id_pequeno_grupo: addForm.id_pequeno_grupo ?? null,
      }
      const created = await api.createUsuario(payload)
      setList((prev) => [...prev, created])
      setAddOpen(false)
      try {
        await api.checkin(created.cpf)
      } catch {
        // já presente ou outro erro – não bloqueia
      }
    } finally {
      setAddLoading(false)
    }
  }

  const addSelectTime = addForm.id_time == null ? NONE_VALUE : String(addForm.id_time)
  const addSelectOnibus = addForm.id_onibus == null ? NONE_VALUE : String(addForm.id_onibus)
  const addSelectPg = addForm.id_pequeno_grupo == null ? NONE_VALUE : String(addForm.id_pequeno_grupo)

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <Label htmlFor="corrigir-busca" className="sr-only">
            Buscar por nome
          </Label>
          <Input
            id="corrigir-busca"
            placeholder="Buscar por nome"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <Button size="sm" onClick={openAdd}>
          Adicionar usuário
        </Button>
      </div>
      {error && <p className="mb-2 text-sm text-destructive">{error}</p>}
      {loading ? (
        <p className="text-muted-foreground">Buscando...</p>
      ) : !searchDebounced ? (
        <p className="text-muted-foreground">Digite o nome do acampante.</p>
      ) : list.length === 0 ? (
        <p className="text-muted-foreground">Nenhum resultado.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead className="w-32"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.nome}</TableCell>
                <TableCell className="font-mono text-sm">{formatCpfDisplay(u.cpf)}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => openCorrigir(u)}>
                    Corrigir CPF
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Dialog open={corrigirOpen} onOpenChange={setCorrigirOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Corrigir CPF</DialogTitle>
          </DialogHeader>
          <p className="text-lg font-semibold text-foreground">
            {corrigirUser?.nome}
          </p>
          <p className="text-sm text-muted-foreground">
            Oriente a pessoa a fazer o check-in após salvar.
          </p>
          <div className="grid gap-2 py-4">
            <Label>CPF</Label>
            <Input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="000.000.000-00"
              className="input-no-spinner font-mono"
              value={corrigirCpf}
              onChange={(e) => setCorrigirCpf(formatCpfDisplay(e.target.value))}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCorrigirOpen(false)} disabled={corrigirLoading}>
              Cancelar
            </Button>
            <Button onClick={saveCorrigir} disabled={corrigirLoading}>
              {corrigirLoading ? <Loader2 className="size-4 animate-spin" /> : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Adicionar usuário</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nome</Label>
              <Input
                value={addForm.nome}
                onChange={(e) => setAddForm((f) => ({ ...f, nome: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>CPF</Label>
              <Input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="000.000.000-00"
                className="input-no-spinner font-mono"
                value={addForm.cpf}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, cpf: formatCpfDisplay(e.target.value) }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Sexo</Label>
              <Select
                value={addForm.sexo ?? ""}
                onValueChange={(v) =>
                  setAddForm((f) => ({ ...f, sexo: v === "" ? null : v }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="m">Masculino</SelectItem>
                  <SelectItem value="f">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Time</Label>
              <Select
                value={addSelectTime}
                onValueChange={(v) =>
                  setAddForm((f) => ({
                    ...f,
                    id_time: v === NONE_VALUE ? null : parseInt(v, 10),
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Nenhum</SelectItem>
                  {times.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Ônibus</Label>
              <Select
                value={addSelectOnibus}
                onValueChange={(v) =>
                  setAddForm((f) => ({
                    ...f,
                    id_onibus: v === NONE_VALUE ? null : parseInt(v, 10),
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Nenhum</SelectItem>
                  {onibus.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Pequeno grupo</Label>
              <Select
                value={addSelectPg}
                onValueChange={(v) =>
                  setAddForm((f) => ({
                    ...f,
                    id_pequeno_grupo: v === NONE_VALUE ? null : parseInt(v, 10),
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Nenhum</SelectItem>
                  {pequenosGrupos.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={addLoading}>
              Cancelar
            </Button>
            <Button onClick={saveAdd} disabled={addLoading}>
              {addLoading ? <Loader2 className="size-4 animate-spin" /> : "Salvar e marcar presente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

type AtribuirMode = "time" | "pg"

function CadastrosIncompletosTab() {
  const [list, setList] = useState<Usuario[]>([])
  const [times, setTimes] = useState<Time[]>([])
  const [onibus, setOnibus] = useState<Onibus[]>([])
  const [pequenosGrupos, setPequenosGrupos] = useState<PequenoGrupo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editing, setEditing] = useState<Usuario | null>(null)
  const [atribuirMode, setAtribuirMode] = useState<AtribuirMode | null>(null)
  const [atribuirTime, setAtribuirTime] = useState<number | null>(null)
  const [atribuirPg, setAtribuirPg] = useState<number | null>(null)
  const [saveLoading, setSaveLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [u, t, o, pg] = await Promise.all([
        api.getUsuarios(0, 500),
        api.getTimes(0, 500),
        api.getOnibusList(0, 500),
        api.getPequenosGrupos(0, 500),
      ])
      setList(u)
      setTimes(t)
      setOnibus(o)
      setPequenosGrupos(pg)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const semTime = list.filter((u) => u.id_time == null)
  const semPg = list.filter((u) => u.id_pequeno_grupo == null)

  const openAtribuirTime = (item: Usuario) => {
    setEditing(item)
    setAtribuirMode("time")
    setAtribuirTime(item.id_time ?? null)
    setAtribuirPg(null)
  }
  const openAtribuirPg = (item: Usuario) => {
    setEditing(item)
    setAtribuirMode("pg")
    setAtribuirTime(null)
    setAtribuirPg(item.id_pequeno_grupo ?? null)
  }
  const closeAtribuir = () => {
    setEditing(null)
    setAtribuirMode(null)
  }
  const saveAtribuir = async () => {
    if (!editing) return
    setSaveLoading(true)
    try {
      const payload: UsuarioUpdate =
        atribuirMode === "time"
          ? { id_time: atribuirTime }
          : { id_pequeno_grupo: atribuirPg }
      const updated = await api.updateUsuario(editing.id, payload)
      setList((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      closeAtribuir()
    } finally {
      setSaveLoading(false)
    }
  }

  const selectTimeValue = atribuirTime == null ? NONE_VALUE : String(atribuirTime)
  const selectPgValue = atribuirPg == null ? NONE_VALUE : String(atribuirPg)

  const nomeOnibus = (id: number | null) =>
    id == null ? "-" : onibus.find((o) => o.id === id)?.nome ?? "-"
  const nomePg = (id: number | null) =>
    id == null ? "-" : pequenosGrupos.find((p) => p.id === id)?.nome ?? "-"
  const nomeTime = (id: number | null) =>
    id == null ? "-" : times.find((t) => t.id === id)?.nome ?? "-"

  if (loading) return <p className="text-muted-foreground">Carregando...</p>
  if (error) return <p className="text-destructive">{error}</p>

  return (
    <div className="space-y-8">
      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 font-medium">Sem time</h2>
        {semTime.length === 0 ? (
          <p className="text-muted-foreground">Nenhum acampante sem time.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Ônibus</TableHead>
                <TableHead>Pequeno grupo</TableHead>
                <TableHead className="w-32"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {semTime.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.nome}</TableCell>
                  <TableCell>{nomeOnibus(u.id_onibus)}</TableCell>
                  <TableCell>{nomePg(u.id_pequeno_grupo)}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => openAtribuirTime(u)}>
                      Atribuir time
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 font-medium">Sem pequeno grupo</h2>
        {semPg.length === 0 ? (
          <p className="text-muted-foreground">Nenhum acampante sem pequeno grupo.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Ônibus</TableHead>
                <TableHead className="w-32"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {semPg.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.nome}</TableCell>
                  <TableCell>{nomeTime(u.id_time)}</TableCell>
                  <TableCell>{nomeOnibus(u.id_onibus)}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => openAtribuirPg(u)}>
                      Atribuir PG
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
      <Dialog open={!!editing} onOpenChange={(open) => !open && closeAtribuir()}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>
              {atribuirMode === "time" ? "Atribuir time" : "Atribuir pequeno grupo"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-lg font-semibold text-foreground">{editing?.nome}</p>
          <div className="grid gap-2 py-4">
            {atribuirMode === "time" && (
              <>
                <Label>Time</Label>
                <Select
                  value={selectTimeValue}
                  onValueChange={(v) =>
                    setAtribuirTime(v === NONE_VALUE ? null : parseInt(v, 10))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Nenhum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>Nenhum</SelectItem>
                    {times.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
            {atribuirMode === "pg" && (
              <>
                <Label>Pequeno grupo</Label>
                <Select
                  value={selectPgValue}
                  onValueChange={(v) =>
                    setAtribuirPg(v === NONE_VALUE ? null : parseInt(v, 10))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Nenhum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>Nenhum</SelectItem>
                    {pequenosGrupos.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeAtribuir}
              disabled={saveLoading}
            >
              Cancelar
            </Button>
            <Button onClick={saveAtribuir} disabled={saveLoading}>
              {saveLoading ? <Loader2 className="size-4 animate-spin" /> : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ConfiguracaoTab() {
  return (
    <>
      <SistemaSection />
      <OnibusSection />
      <TimesSection />
      <PequenoGrupoSection />
      <UsuariosSection />
    </>
  )
}

function SistemaSection() {
  const [sistema, setSistema] = useState<Sistema | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [form, setForm] = useState<Pick<SistemaUpdate, "mensagem_cpf_nao_encontrado">>({
    mensagem_cpf_nao_encontrado: "",
  })

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const s = await api.getSistema()
      setSistema(s)
      setForm({
        mensagem_cpf_nao_encontrado: s.mensagem_cpf_nao_encontrado,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openModal = () => setModalOpen(true)
  const save = async () => {
    setSaveLoading(true)
    try {
      await api.updateSistema(form)
      setModalOpen(false)
      load()
    } finally {
      setSaveLoading(false)
    }
  }

  if (loading) return <p className="text-muted-foreground">Carregando sistema...</p>
  if (error) return <p className="text-destructive">{error}</p>

  return (
    <section className="rounded-lg border bg-card p-4">
      <h2 className="mb-3 font-medium">Sistema</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mensagem CPF não encontrado</TableHead>
            <TableHead className="w-24"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sistema && (
            <TableRow>
              <TableCell>{sistema.mensagem_cpf_nao_encontrado}</TableCell>
              <TableCell>
                <Button variant="outline" size="sm" onClick={openModal}>
                  Editar
                </Button>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Editar mensagem (CPF não encontrado)</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Mensagem CPF não encontrado</Label>
              <Input
                value={form.mensagem_cpf_nao_encontrado ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    mensagem_cpf_nao_encontrado: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={saveLoading}
            >
              Cancelar
            </Button>
            <Button onClick={save} disabled={saveLoading}>
              {saveLoading ? <Loader2 className="size-4 animate-spin" /> : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

function OnibusSection() {
  const [list, setList] = useState<Onibus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Onibus | null>(null)
  const [form, setForm] = useState<OnibusCreate>({ nome: "" })
  const [saveLoading, setSaveLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Onibus | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await api.getOnibusList(0, 500)
      setList(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm({ nome: "" })
    setModalOpen(true)
  }
  const openEdit = (item: Onibus) => {
    setEditing(item)
    setForm({ nome: item.nome })
    setModalOpen(true)
  }
  const save = async () => {
    setSaveLoading(true)
    try {
      if (editing) {
        const updated = await api.updateOnibus(editing.id, { nome: form.nome })
        setList((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
      } else {
        const created = await api.createOnibus(form)
        setList((prev) => [...prev, created])
      }
      setModalOpen(false)
    } finally {
      setSaveLoading(false)
    }
  }
  const confirmDelete = (item: Onibus) => setDeleteTarget(item)
  const doDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await api.deleteOnibus(deleteTarget.id)
      setDeleteTarget(null)
      load()
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading) return <p className="text-muted-foreground">Carregando ônibus...</p>
  if (error) return <p className="text-destructive">{error}</p>

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-medium">Ônibus</h2>
        <Button size="sm" onClick={openCreate}>
          Novo
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead className="w-32"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((o) => (
            <TableRow key={o.id}>
              <TableCell>{o.nome}</TableCell>
              <TableCell className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(o)}>
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => confirmDelete(o)}
                >
                  Excluir
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar ônibus" : "Novo ônibus"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nome</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ nome: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saveLoading}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={saveLoading}>
              {saveLoading ? <Loader2 className="size-4 animate-spin" /> : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ônibus?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir &quot;{deleteTarget?.nome}&quot;? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={doDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? <Loader2 className="size-4 animate-spin" /> : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}

function TimesSection() {
  const [list, setList] = useState<Time[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Time | null>(null)
  const [form, setForm] = useState<TimeCreate>({
    nome: "",
    cor_hex: "#000000",
    nome_responsavel: "",
  })
  const [saveLoading, setSaveLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Time | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await api.getTimes(0, 500)
      setList(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm({ nome: "", cor_hex: "#000000", nome_responsavel: "" })
    setModalOpen(true)
  }
  const openEdit = (item: Time) => {
    setEditing(item)
    setForm({
      nome: item.nome,
      cor_hex: item.cor_hex.startsWith("#") ? item.cor_hex : `#${item.cor_hex}`,
      nome_responsavel: item.nome_responsavel ?? "",
    })
    setModalOpen(true)
  }
  const save = async () => {
    setSaveLoading(true)
    try {
      const payload: TimeCreate | TimeUpdate = {
        nome: form.nome,
        cor_hex: form.cor_hex.replace(/^#/, ""),
        nome_responsavel: form.nome_responsavel || null,
      }
      if (editing) {
        const updated = await api.updateTime(editing.id, payload)
        setList((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
      } else {
        const created = await api.createTime(payload as TimeCreate)
        setList((prev) => [...prev, created])
      }
      setModalOpen(false)
    } finally {
      setSaveLoading(false)
    }
  }
  const confirmDelete = (item: Time) => setDeleteTarget(item)
  const doDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await api.deleteTime(deleteTarget.id)
      setDeleteTarget(null)
      load()
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading) return <p className="text-muted-foreground">Carregando times...</p>
  if (error) return <p className="text-destructive">{error}</p>

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-medium">Times</h2>
        <Button size="sm" onClick={openCreate}>
          Novo
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Cor</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead className="w-32"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((t) => (
            <TableRow key={t.id}>
              <TableCell>{t.nome}</TableCell>
              <TableCell>
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block size-6 shrink-0 rounded border border-input"
                    style={{ backgroundColor: t.cor_hex.startsWith("#") ? t.cor_hex : `#${t.cor_hex}` }}
                  />
                  <span className="font-mono text-sm">
                    {t.cor_hex.startsWith("#") ? t.cor_hex : `#${t.cor_hex}`}
                  </span>
                </span>
              </TableCell>
              <TableCell>{t.nome_responsavel ?? "-"}</TableCell>
              <TableCell className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(t)}>
                  Editar
                </Button>
                <Button variant="destructive" size="sm" onClick={() => confirmDelete(t)}>
                  Excluir
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar time" : "Novo time"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nome</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Cor</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={form.cor_hex}
                  onChange={(e) => setForm((f) => ({ ...f, cor_hex: e.target.value }))}
                  className="h-10 w-14 shrink-0 cursor-pointer p-1"
                />
                <Input
                  value={form.cor_hex}
                  onChange={(e) => setForm((f) => ({ ...f, cor_hex: e.target.value }))}
                  className="font-mono"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Nome responsável</Label>
              <Input
                value={form.nome_responsavel ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nome_responsavel: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saveLoading}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={saveLoading}>
              {saveLoading ? <Loader2 className="size-4 animate-spin" /> : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir time?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir &quot;{deleteTarget?.nome}&quot;? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={doDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? <Loader2 className="size-4 animate-spin" /> : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}

function PequenoGrupoSection() {
  const [list, setList] = useState<PequenoGrupo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PequenoGrupo | null>(null)
  const [form, setForm] = useState<PequenoGrupoCreate>({
    nome: "",
    nome_responsavel: null,
  })
  const [saveLoading, setSaveLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<PequenoGrupo | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await api.getPequenosGrupos(0, 500)
      setList(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm({ nome: "", nome_responsavel: null })
    setModalOpen(true)
  }
  const openEdit = (item: PequenoGrupo) => {
    setEditing(item)
    setForm({ nome: item.nome, nome_responsavel: item.nome_responsavel ?? null })
    setModalOpen(true)
  }
  const save = async () => {
    setSaveLoading(true)
    try {
      if (editing) {
        const updated = await api.updatePequenoGrupo(editing.id, {
          nome: form.nome,
          nome_responsavel: form.nome_responsavel ?? null,
        })
        setList((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      } else {
        const created = await api.createPequenoGrupo(form)
        setList((prev) => [...prev, created])
      }
      setModalOpen(false)
    } finally {
      setSaveLoading(false)
    }
  }
  const confirmDelete = (item: PequenoGrupo) => setDeleteTarget(item)
  const doDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await api.deletePequenoGrupo(deleteTarget.id)
      setDeleteTarget(null)
      load()
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading) return <p className="text-muted-foreground">Carregando pequenos grupos...</p>
  if (error) return <p className="text-destructive">{error}</p>

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-medium">Pequeno grupo</h2>
        <Button size="sm" onClick={openCreate}>
          Novo
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead className="w-32"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.nome}</TableCell>
              <TableCell>{p.nome_responsavel ?? "-"}</TableCell>
              <TableCell className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => confirmDelete(p)}
                >
                  Excluir
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar pequeno grupo" : "Novo pequeno grupo"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nome</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Nome do responsável</Label>
              <Input
                value={form.nome_responsavel ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    nome_responsavel: e.target.value.trim() || null,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saveLoading}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={saveLoading}>
              {saveLoading ? <Loader2 className="size-4 animate-spin" /> : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pequeno grupo?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir &quot;{deleteTarget?.nome}&quot;? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={doDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? <Loader2 className="size-4 animate-spin" /> : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}

function UsuariosSection() {
  const [list, setList] = useState<Usuario[]>([])
  const [times, setTimes] = useState<Time[]>([])
  const [onibus, setOnibus] = useState<Onibus[]>([])
  const [pequenosGrupos, setPequenosGrupos] = useState<PequenoGrupo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Usuario | null>(null)
  const [form, setForm] = useState<UsuarioCreate>({
    nome: "",
    cpf: "",
    sexo: null,
    id_time: null,
    id_onibus: null,
    id_pequeno_grupo: null,
  })
  const [saveLoading, setSaveLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Usuario | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [u, t, o, pg] = await Promise.all([
        api.getUsuarios(0, 500),
        api.getTimes(0, 500),
        api.getOnibusList(0, 500),
        api.getPequenosGrupos(0, 500),
      ])
      setList(u)
      setTimes(t)
      setOnibus(o)
      setPequenosGrupos(pg)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar.")
    } finally {
      setLoading(false)
    }
  }, [])

  const loadTimesOnibusPequenosGrupos = useCallback(async () => {
    try {
      const [t, o, pg] = await Promise.all([
        api.getTimes(0, 500),
        api.getOnibusList(0, 500),
        api.getPequenosGrupos(0, 500),
      ])
      setTimes(t)
      setOnibus(o)
      setPequenosGrupos(pg)
    } catch {
      // mantém listas atuais em caso de erro
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    loadTimesOnibusPequenosGrupos()
    setEditing(null)
    setForm({
      nome: "",
      cpf: "",
      sexo: null,
      id_time: null,
      id_onibus: null,
      id_pequeno_grupo: null,
    })
    setModalOpen(true)
  }
  const openEdit = (item: Usuario) => {
    loadTimesOnibusPequenosGrupos()
    setEditing(item)
    setForm({
      nome: item.nome,
      cpf: formatCpfDisplay(item.cpf),
      sexo: item.sexo ?? null,
      id_time: item.id_time ?? null,
      id_onibus: item.id_onibus ?? null,
      id_pequeno_grupo: item.id_pequeno_grupo ?? null,
    })
    setModalOpen(true)
  }
  const save = async () => {
    setSaveLoading(true)
    try {
      const payload: UsuarioCreate | UsuarioUpdate = {
        nome: form.nome,
        cpf: cpfForApi(form.cpf),
        sexo: form.sexo || null,
        id_time: form.id_time ?? null,
        id_onibus: form.id_onibus ?? null,
        id_pequeno_grupo: form.id_pequeno_grupo ?? null,
      }
      if (editing) {
        const updated = await api.updateUsuario(editing.id, payload)
        setList((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      } else {
        const created = await api.createUsuario(payload as UsuarioCreate)
        setList((prev) => [...prev, created])
      }
      setModalOpen(false)
    } finally {
      setSaveLoading(false)
    }
  }
  const confirmDelete = (item: Usuario) => setDeleteTarget(item)
  const doDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await api.deleteUsuario(deleteTarget.id)
      setList((prev) => prev.filter((u) => u.id !== deleteTarget.id))
      setDeleteTarget(null)
    } finally {
      setDeleteLoading(false)
    }
  }


  const NONE_VALUE = "__none__"
  const selectTimeValue = form.id_time == null ? NONE_VALUE : String(form.id_time)
  const selectOnibusValue = form.id_onibus == null ? NONE_VALUE : String(form.id_onibus)
  const selectPequenoGrupoValue =
    form.id_pequeno_grupo == null ? NONE_VALUE : String(form.id_pequeno_grupo)

  if (loading) return <p className="text-muted-foreground">Carregando Acampantes...</p>
  if (error) return <p className="text-destructive">{error}</p>

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-medium">Acampantes</h2>
        <Button size="sm" onClick={openCreate}>
          Novo
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>CPF</TableHead>
            <TableHead>Sexo</TableHead>
            <TableHead>Check-in</TableHead>
            <TableHead className="w-32"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((u) => (
            <TableRow key={u.id}>
              <TableCell>{u.nome}</TableCell>
              <TableCell>{u.cpf}</TableCell>
              <TableCell>{u.sexo ?? "-"}</TableCell>
              <TableCell>{formatDateTime(u.datahora_checkin)}</TableCell>
              <TableCell className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(u)}>
                  Editar
                </Button>
                <Button variant="destructive" size="sm" onClick={() => confirmDelete(u)}>
                  Excluir
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar usuário" : "Novo usuário"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nome</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>CPF</Label>
              <Input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="000.000.000-00"
                className="input-no-spinner font-mono"
                value={form.cpf}
                onChange={(e) => setForm((f) => ({ ...f, cpf: formatCpfDisplay(e.target.value) }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Sexo</Label>
              <Select
                value={form.sexo ?? ""}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, sexo: v === "" ? null : v }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="m">Masculino</SelectItem>
                  <SelectItem value="f">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Time</Label>
              <Select
                value={selectTimeValue}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    id_time: v === NONE_VALUE ? null : parseInt(v, 10),
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Nenhum</SelectItem>
                  {times.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Ônibus</Label>
              <Select
                value={selectOnibusValue}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    id_onibus: v === NONE_VALUE ? null : parseInt(v, 10),
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Nenhum</SelectItem>
                  {onibus.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Pequeno grupo</Label>
              <Select
                value={selectPequenoGrupoValue}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    id_pequeno_grupo: v === NONE_VALUE ? null : parseInt(v, 10),
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Nenhum</SelectItem>
                  {pequenosGrupos.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saveLoading}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={saveLoading}>
              {saveLoading ? <Loader2 className="size-4 animate-spin" /> : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir &quot;{deleteTarget?.nome}&quot;? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={doDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? <Loader2 className="size-4 animate-spin" /> : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
