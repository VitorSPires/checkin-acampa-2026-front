"use client"

import { useEffect, useId, useRef, useState } from "react"
import { AnimatePresence, LayoutGroup, motion } from "motion/react"
import { useOutsideClick } from "@/hooks/use-outside-click"
import { palestrasCardsData } from "@/data/palestras-cards"
import { X } from "lucide-react"

type CardItem = {
  title: string
  description: string
  src: string
  slug: string
  content: React.ReactNode
  /** Ponto focal: uma propriedade CSS, dois valores (horizontal, vertical). Ex: "center center", "50% 30%" */
  objectPosition?: string
}

type PalestraData = { title: string; body: string }

/** Remove o primeiro parágrafo do HTML que corresponde ao título (evita duplicata). */
function stripTitleFromBody(bodyHtml: string, title: string): string {
  const titleNorm = title.replace(/\s+/g, " ").trim().toUpperCase()
  const firstP = bodyHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/i)
  if (!firstP) return bodyHtml
  const innerText = firstP[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().toUpperCase()
  if (!innerText || !titleNorm || innerText.includes(titleNorm) || titleNorm.includes(innerText)) {
    return bodyHtml.slice(bodyHtml.indexOf("</p>") + 5).trimStart()
  }
  return bodyHtml
}

const cards: CardItem[] = palestrasCardsData.map((card) => ({
  title: card.title,
  description: card.category,
  src: card.src,
  slug: card.slug,
  content: card.content,
  objectPosition: card.objectPosition,
}))

export function ExpandablePalestrasGrid() {
  const [active, setActive] = useState<CardItem | boolean | null>(null)
  const [palestraData, setPalestraData] = useState<PalestraData | null>(null)
  const [loading, setLoading] = useState(false)
  const id = useId()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (active && typeof active === "object") {
      setLoading(true)
      setPalestraData(null)
      fetch(`/palestras/${active.slug}.json`)
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((json: PalestraData) => setPalestraData(json))
        .catch(() => setPalestraData(null))
        .finally(() => setLoading(false))
    }
  }, [active])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setActive(null)
    }
    if (active && typeof active === "object") {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [active])

  useOutsideClick(ref, () => setActive(null))

  return (
    <LayoutGroup>
      <AnimatePresence>
        {active && typeof active === "object" ? (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-100 flex h-full w-full flex-col"
          >
            <div
              className="absolute inset-0 -z-10 bg-black/20"
              aria-hidden
            />
            <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-white dark:bg-neutral-900">
              <div className="absolute right-2 top-2 z-20">
              <motion.button
                key={`button-${active.title}-${id}`}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.05 } }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md dark:bg-neutral-800"
                onClick={() => setActive(null)}
                aria-label="Fechar"
              >
                <X className="h-5 w-5 text-neutral-700 dark:text-neutral-200" />
              </motion.button>
            </div>
            <div ref={ref} className="h-full w-full overflow-y-auto">
              <motion.div
                layoutId={`image-${active.title}-${id}`}
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                transition={{
                  layout: { type: "tween", duration: 0.35, ease: "easeInOut" },
                  opacity: { duration: 0 },
                }}
                className="opacity-100! max-h-[500px] w-full shrink-0 overflow-hidden bg-neutral-100 dark:bg-neutral-800 [&_img]:opacity-100!"
                style={{ aspectRatio: "16/10" }}
              >
                <img
                  src={active.src}
                  alt={active.title}
                  className="h-full max-h-[500px] w-full select-none object-cover"
                  style={{
                    objectPosition: active.objectPosition ?? "center center",
                    ...({ WebkitUserDrag: "none" } as React.CSSProperties),
                  }}
                  draggable={false}
                />
              </motion.div>
              <div className="mx-auto max-w-3xl px-4 py-6 md:py-8">
                <motion.h1
                  layoutId={`title-${active.title}-${id}`}
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    layout: { type: "tween", duration: 0.35, ease: "easeInOut" },
                    opacity: { duration: 0 },
                  }}
                  className="opacity-100! mb-6 text-2xl font-bold text-neutral-800 md:text-3xl dark:text-neutral-200"
                >
                  {(() => {
                    const t = palestraData?.title
                    if (!t || t === "Palestra" || t.length < 5) return active.title
                    return t
                  })()}
                </motion.h1>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35, duration: 0.25, ease: "easeOut" }}
                >
                  {loading ? (
                    <p className="text-muted-foreground">Carregando…</p>
                  ) : palestraData ? (
                    <article
                      className="palestra-body prose prose-neutral dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: stripTitleFromBody(palestraData.body, palestraData.title),
                      }}
                    />
                  ) : (
                    <p className="text-muted-foreground">
                      Não foi possível carregar o conteúdo.
                    </p>
                  )}
                </motion.div>
              </div>
            </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <ul className="mx-auto grid w-full max-w-2xl grid-cols-1 items-start gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <div
            key={card.slug}
            onClick={() => setActive(card)}
            className="flex cursor-pointer flex-col rounded-2xl p-4 transition-colors hover:bg-neutral-100 hover:shadow-sm dark:hover:bg-neutral-700/90 dark:hover:shadow-md"
          >
            <div className="flex w-full flex-col gap-4">
              <motion.div
                layoutId={`image-${card.title}-${id}`}
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                transition={{
                  layout: { type: "tween", duration: 0.35, ease: "easeInOut" },
                  opacity: { duration: 0 },
                }}
                className="opacity-100! overflow-hidden rounded-lg [&_img]:opacity-100!"
              >
                <img
                  width={100}
                  height={100}
                  src={card.src}
                  alt={card.title}
                  className="h-60 w-full select-none rounded-lg object-cover"
                  style={{
                    objectPosition: card.objectPosition ?? "center center",
                    ...({ WebkitUserDrag: "none" } as React.CSSProperties),
                  }}
                  draggable={false}
                />
              </motion.div>
              <div className="flex flex-col items-center justify-center gap-1">
                <motion.h3
                  layoutId={`title-${card.title}-${id}`}
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    layout: { type: "tween", duration: 0.35, ease: "easeInOut" },
                    opacity: { duration: 0 },
                  }}
                  className="opacity-100! text-center text-base font-medium text-neutral-800 md:text-left dark:text-neutral-200"
                >
                  {card.title}
                </motion.h3>
                <p className="text-center text-sm text-neutral-500 md:text-left dark:text-neutral-400">
                  {card.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </ul>
    </LayoutGroup>
  )
}

