import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "sonner"
import CheckinPage from "@/pages/CheckinPage"
import AdmPage from "@/pages/AdmPage"
import GuiaPage from "@/pages/GuiaPage"
import PreviewPage from "@/pages/PreviewPage"
import PalestrasPage from "@/pages/PalestrasPage"
import PalestraDetailPage from "@/pages/PalestraDetailPage"

/** Local = localhost/127.0.0.1 → preview; publicado (Railway etc.) → checkin */
function getRootRedirectTo(): string {
  if (typeof window === "undefined") return "/checkin"
  const host = window.location.hostname.toLowerCase()
  return host === "localhost" || host === "127.0.0.1" ? "/preview" : "/checkin"
}

/** Indicador de build: em dev mostra "dev"; com ?build=1 mostra "ok" para confirmar que a app carregou a versão atual. */
function BuildIndicator() {
  const isDev = import.meta.env.DEV
  const showFromQuery =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("build") === "1"
  if (!isDev && !showFromQuery) return null
  return (null)
}

function App() {
  return (
    <BrowserRouter>
      <Toaster richColors position="top-center" closeButton duration={4000} />
      <BuildIndicator />
      <Routes>
        <Route path="/" element={<Navigate to={getRootRedirectTo()} replace />} />
        <Route path="/checkin" element={<CheckinPage />} />
        <Route path="/adm" element={<AdmPage />} />
        <Route path="/guia" element={<GuiaPage />} />
        <Route path="/preview" element={<PreviewPage />} />
        <Route path="/palestras" element={<PalestrasPage />} />
        <Route path="/palestras/:slug" element={<PalestraDetailPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
