import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import CheckinPage from "@/pages/CheckinPage"
import AdmPage from "@/pages/AdmPage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/checkin" replace />} />
        <Route path="/checkin" element={<CheckinPage />} />
        <Route path="/adm" element={<AdmPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
