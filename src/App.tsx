import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import CheckinPage from "@/pages/CheckinPage"
import AdmPage from "@/pages/AdmPage"
import GuiaPage from "@/pages/GuiaPage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/checkin" replace />} />
        <Route path="/checkin" element={<CheckinPage />} />
        <Route path="/adm" element={<AdmPage />} />
        <Route path="/guia" element={<GuiaPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
