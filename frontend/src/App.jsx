import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import CatalogPage from "./pages/CatalogPage";
import OceansXPage from "./pages/OceansXPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/oceans-x" element={<OceansXPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
