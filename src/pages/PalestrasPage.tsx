"use client"

import { ExpandablePalestrasGrid } from "@/components/ExpandablePalestrasGrid"

export default function PalestrasPage() {
  return (
    <div className="flex min-h-screen-safe w-full flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 md:justify-center md:py-12">
        <h2 className="mb-10 w-full max-w-7xl text-center font-sans text-xl font-bold text-neutral-800 dark:text-neutral-200 md:text-4xl lg:text-5xl">
          Palestras do Acampump 2026
        </h2>
        <ExpandablePalestrasGrid />
      </div>
    </div>
  )
}
