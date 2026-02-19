import { useParams, Link } from "react-router-dom"
import { useEffect, useState } from "react"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PalestraContent {
  title: string
  body: string
}

export default function PalestraDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [data, setData] = useState<PalestraContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) {
      setLoading(false)
      setError("Slug não informado.")
      return
    }
    setLoading(true)
    setError(null)
    fetch(`/palestras/${slug}.json`)
      .then((res) => {
        if (!res.ok) throw new Error("Palestra não encontrada.")
        return res.json()
      })
      .then((json: PalestraContent) => setData(json))
      .catch(() => setError("Não foi possível carregar a palestra."))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="flex min-h-screen-safe items-center justify-center p-4">
        <p className="text-muted-foreground">Carregando…</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen-safe flex-col items-center justify-center gap-4 p-4">
        <p className="text-destructive">{error ?? "Palestra não encontrada."}</p>
        <Link to="/palestras">
          <Button variant="outline">Voltar às palestras</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen-safe bg-background">
      <div className="mx-auto max-w-3xl px-4 py-6 md:py-10">
        <Link
          to="/palestras"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Voltar às palestras
        </Link>

        <header className="mb-8">
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            {data.title}
          </h1>
        </header>

        <article
          className="palestra-body prose prose-neutral dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: data.body }}
        />
      </div>
    </div>
  )
}
