/**
 * Lê os .htm em temp/ e gera um JSON por palestra em public/palestras/<slug>.json.
 * O conteúdo (incluindo notas de rodapé) é mantido exatamente como nos arquivos.
 *
 * Uso: node scripts/extract-palestras.js
 * (rodar a partir da raiz do projeto front)
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import iconv from "iconv-lite"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TEMP_DIR = path.join(__dirname, "..", "temp")
const OUT_DIR = path.join(__dirname, "..", "public", "palestras")

const SLUG_BY_INDEX = [
  "nao-jogue-fora-os-seus-sonhos",
  "nao-jogue-fora-as-suas-duvidas",
  "nao-jogue-fora-o-seu-tempo",
  "nao-jogue-fora-a-sua-felicidade",
]

function slugFromFilename(filename, index) {
  const match = filename.match(/^PALESTRA\s*(\d+)/i)
  if (match) {
    const num = parseInt(match[1], 10)
    if (num >= 1 && num <= SLUG_BY_INDEX.length) return SLUG_BY_INDEX[num - 1]
  }
  const fallback = filename.replace(/\.htm$/i, "").trim()
  return fallback
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "") || "palestra-" + index
}

function extractBody(html) {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  if (bodyMatch) return bodyMatch[1].trim()
  return html
}

const TITLES_BY_SLUG = {
  "nao-jogue-fora-os-seus-sonhos": "Não jogue fora os seus sonhos",
  "nao-jogue-fora-as-suas-duvidas": "Não jogue fora as suas dúvidas",
  "nao-jogue-fora-o-seu-tempo": "Não jogue fora o seu tempo",
  "nao-jogue-fora-a-sua-felicidade": "Não jogue fora a sua felicidade",
}

function isValidTitle(t) {
  const s = t.replace(/\s+/g, " ").trim()
  return s.length >= 10 && !/^\d+$/.test(s)
}

function extractTitle(html, slug) {
  const body = extractBody(html)
  // 16.0pt (palestras 1 e 2)
  let m = body.match(/<p[^>]*>\s*<b>[^<]*<span[^>]*font-size:\s*16\.0pt[^>]*>([^<]+)/i)
  if (m) {
    const t = m[1].replace(/\s+/g, " ").trim()
    if (isValidTitle(t)) return t
  }
  // 14.0pt (palestras 3 e 4) ou primeiro <p align=right> com negrito (título)
  m = body.match(/<p[^>]*align=right[^>]*>\s*<b>[^<]*<span[^>]*font-size:\s*14\.0pt[^>]*>([^<]+)/i)
  if (m) return m[1].replace(/\s+/g, " ").trim()
  m = body.match(/<p[^>]*align=right[^>]*>\s*<b>[^<]*<span[^>]*>([^<]+)/i)
  if (m) {
    const t = m[1].replace(/\s+/g, " ").trim()
    if (t.length > 5) return t
  }
  const h1Match = body.match(/<h1[^>]*>([^<]+)/i)
  if (h1Match) return h1Match[1].replace(/\s+/g, " ").trim()
  return TITLES_BY_SLUG[slug] || "Palestra"
}

/** Marca o primeiro parágrafo de rodapé com class="first-footnote" para um único divisor em CSS. */
function markFirstFootnote(html) {
  let isFirst = true
  return html.replace(
    /<p class=(MsoNormal)([^>]*)>(\s*<a href="#_ftnref\d+" name="_ftn\d+")/gi,
    (match, g1, g2, g3) => {
      if (isFirst) {
        isFirst = false
        return `<p class="${g1} first-footnote"${g2}>${g3}`
      }
      return match
    }
  )
}

function main() {
  if (!fs.existsSync(TEMP_DIR)) {
    console.error("Pasta temp/ não encontrada.")
    process.exit(1)
  }

  const files = fs.readdirSync(TEMP_DIR).filter((f) => f.endsWith(".htm"))
  if (files.length === 0) {
    console.error("Nenhum arquivo .htm encontrado em temp/")
    process.exit(1)
  }

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true })
  }

  files.sort()
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const slug = slugFromFilename(file, i)

    const filePath = path.join(TEMP_DIR, file)
    const buffer = fs.readFileSync(filePath)
    const raw = iconv.decode(buffer, "win1252")

    let bodyHtml = extractBody(raw)
    bodyHtml = markFirstFootnote(bodyHtml)
    const title = extractTitle(raw, slug)

    const json = {
      title,
      body: bodyHtml,
    }

    const outPath = path.join(OUT_DIR, `${slug}.json`)
    fs.writeFileSync(outPath, JSON.stringify(json, null, 0), "utf8")
    console.log("Gerado:", outPath)
  }

  console.log("Concluído.")
}

main()
