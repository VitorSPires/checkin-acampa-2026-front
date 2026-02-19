"use client"

import React, { useRef, useState, useCallback, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"

export type AppleCard = {
  src: string
  title: string
  category: string
  content: React.ReactNode
  slug: string
  /** Ponto focal: uma propriedade CSS, dois valores (horizontal, vertical). Ex: "center center", "50% 30%" */
  objectPosition?: string
}

function BlurImage({
  src,
  alt = "Background",
  className,
  ...rest
}: {
  src: string
  alt?: string
  className?: string
  height?: number | string
  width?: number | string
}) {
  const [loaded, setLoaded] = useState(false)
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <img
        src={src}
        alt={alt}
        className={cn(
          "h-full w-full object-cover transition-[filter] duration-500",
          loaded ? "blur-0" : "blur-xl"
        )}
        onLoad={() => setLoaded(true)}
        {...rest}
      />
    </div>
  )
}

/** Card clicável que leva direto para a página da palestra (sem modal). */
export function Card({
  card,
  index: _index,
}: {
  card: AppleCard
  index: number
}) {
  return (
    <Link
      to={`/palestras/${card.slug}`}
      className={cn(
        "group relative flex h-[340px] w-[260px] shrink-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 transition-all duration-300 hover:scale-[1.02] hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700",
        "md:h-[420px] md:w-[320px]",
        "lg:h-[480px] lg:w-[380px]"
      )}
      aria-label={`Ler palestra: ${card.title}`}
    >
      <BlurImage
        src={card.src}
        alt=""
        className="absolute inset-0 h-full w-full"
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
      <div className="relative mt-auto flex flex-col gap-1 p-5 text-left text-white">
        <span className="text-xs font-medium uppercase tracking-wider text-white/90">
          {card.category}
        </span>
        <span className="text-xl font-semibold md:text-2xl">{card.title}</span>
      </div>
    </Link>
  )
}

const SCROLL_STEP = 320

export function Carousel({
  items,
}: {
  items: React.ReactNode[]
  initialScroll?: number
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const startXRef = useRef(0)
  const scrollLeftRef = useRef(0)

  const scroll = useCallback((direction: "left" | "right") => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({
      left: direction === "left" ? -SCROLL_STEP : SCROLL_STEP,
      behavior: "smooth",
    })
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true
      startXRef.current = e.pageX - el.offsetLeft
      scrollLeftRef.current = el.scrollLeft
      el.style.scrollSnapType = "none"
      el.style.cursor = "grabbing"
    }
    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return
      e.preventDefault()
      const x = e.pageX - el.offsetLeft
      const walk = (x - startXRef.current) * 1.2
      el.scrollLeft = scrollLeftRef.current - walk
    }
    const onMouseUp = () => {
      if (!isDraggingRef.current) return
      isDraggingRef.current = false
      el.style.scrollSnapType = ""
      el.style.cursor = "grab"
    }
    const onMouseLeave = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false
        el.style.scrollSnapType = ""
        el.style.cursor = "grab"
      }
    }

    el.style.cursor = "grab"
    el.addEventListener("mousedown", onMouseDown)
    window.addEventListener("mousemove", onMouseMove, { passive: false })
    window.addEventListener("mouseup", onMouseUp)
    el.addEventListener("mouseleave", onMouseLeave)
    return () => {
      el.removeEventListener("mousedown", onMouseDown)
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
      el.removeEventListener("mouseleave", onMouseLeave)
    }
  }, [])

  return (
    <div className="relative w-full">
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto scroll-smooth px-4 py-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:gap-8 md:py-8"
        style={{ scrollPaddingLeft: "1rem" }}
      >
        {items}
      </div>
      <div className="pointer-events-none absolute left-0 top-0 hidden h-full w-24 items-center justify-start bg-linear-to-r from-background to-transparent md:flex" />
      <Button
        type="button"
        variant="outline"
        size="icon-lg"
        className="absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border-neutral-200 bg-white/90 shadow-md pointer-events-auto dark:border-neutral-800 dark:bg-neutral-900/90 md:flex"
        onClick={() => scroll("left")}
        aria-label="Anterior"
      >
        <ChevronLeft className="size-5" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon-lg"
        className="absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border-neutral-200 bg-white/90 shadow-md pointer-events-auto dark:border-neutral-800 dark:bg-neutral-900/90 md:flex"
        onClick={() => scroll("right")}
        aria-label="Próximo"
      >
        <ChevronRight className="size-5" />
      </Button>
      <div className="flex justify-center gap-4 px-4 pb-2 pt-2 md:hidden">
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          className="rounded-full"
          onClick={() => scroll("left")}
          aria-label="Anterior"
        >
          <ChevronLeft className="size-5" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          className="rounded-full"
          onClick={() => scroll("right")}
          aria-label="Próximo"
        >
          <ChevronRight className="size-5" />
        </Button>
      </div>
    </div>
  )
}
