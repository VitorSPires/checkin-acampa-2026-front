/**
 * Dados dos cards da seção Palestras.
 * Imagens em public/palestras/capas/ (nome = slug.webp).
 * objectPosition: uma propriedade CSS com dois valores (horizontal, vertical).
 *   Ex.: "center center" = centro; "50% 30%" = 50% da esquerda, 30% do topo; "top"; "bottom left".
 */
import type { AppleCard } from "@/components/ui/apple-cards-carousel"

export const palestrasCardsData: AppleCard[] = [
  {
    slug: "nao-jogue-fora-os-seus-sonhos",
    category: "Palestra 1 - Sábado de manhã",
    title: "Não jogue fora os seus sonhos",
    src: "/palestras/capas/nao-jogue-fora-os-seus-sonhos.webp",
    objectPosition: "center center",
    content: (
      <p className="text-neutral-600 dark:text-neutral-400">
        Uma reflexão sobre manter vivos os sonhos que Deus coloca no coração.
      </p>
    ),
  },
  {
    slug: "nao-jogue-fora-as-suas-duvidas",
    category: "Palestra 2 - Sábado à noite",
    title: "Não jogue fora as suas dúvidas",
    src: "/palestras/capas/nao-jogue-fora-as-suas-duvidas.webp",
    objectPosition: "center center",
    content: (
      <p className="text-neutral-600 dark:text-neutral-400">
        Como lidar com as dúvidas da fé de forma honesta e madura.
      </p>
    ),
  },
  {
    slug: "nao-jogue-fora-o-seu-tempo",
    category: "Palestra 3 - Domingo de manhã",
    title: "Não jogue fora o seu tempo",
    src: "/palestras/capas/nao-jogue-fora-o-seu-tempo.webp",
    objectPosition: "center center",
    content: (
      <p className="text-neutral-600 dark:text-neutral-400">
        Usando bem o tempo que Deus nos dá.
      </p>
    ),
  },
  {
    slug: "nao-jogue-fora-a-sua-felicidade",
    category: "Palestra 4 - Domingo à noite",
    title: "Não jogue fora a sua felicidade",
    src: "/palestras/capas/nao-jogue-fora-a-sua-felicidade.webp",
    objectPosition: "50% 80%",
    content: (
      <p className="text-neutral-600 dark:text-neutral-400">
        A verdadeira felicidade que vem de Deus.
      </p>
    ),
  },
]
