import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import CheckinPage from "@/pages/CheckinPage"
import AdmPage from "@/pages/AdmPage"
import GuiaPage from "@/pages/GuiaPage"
import PreviewPage from "@/pages/PreviewPage"

/** Local = localhost/127.0.0.1 → preview; publicado (Railway etc.) → checkin */
function getRootRedirectTo(): string {
  if (typeof window === "undefined") return "/checkin"
  const host = window.location.hostname.toLowerCase()
  return host === "localhost" || host === "127.0.0.1" ? "/preview" : "/checkin"
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={getRootRedirectTo()} replace />} />
        <Route path="/checkin" element={<CheckinPage />} />
        <Route path="/adm" element={<AdmPage />} />
        <Route path="/guia" element={<GuiaPage />} />
        <Route path="/preview" element={<PreviewPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
