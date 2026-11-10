import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import Bosh from "./pages/Bosh";
import Huquqlar from "./pages/Huquqlar";
import Oquvchi from "./pages/Oquvchi";
import Burchlar from "./pages/Burchlar";
import Sinov from "./pages/Sinov";
import Vaziyatlar from "./pages/Vaziyatlar";
import Qidiruv from "./pages/Qidiruv";
import Manbalar from "./pages/Manbalar";
import { AppProviders } from "./context";

export default function App() {
  return (
    <AppProviders>
      <Routes>
        <Route element={<Layout />}>
          <Route path="bosh" element={<Bosh />} />
          <Route path="huquqlar" element={<Huquqlar />} />
          <Route path="oquvchi" element={<Oquvchi />} />
          <Route path="burchlar" element={<Burchlar />} />
          <Route path="sinov" element={<Sinov />} />
          <Route path="vaziyatlar" element={<Vaziyatlar />} />
          <Route path="qidiruv" element={<Qidiruv />} />
          <Route path="manbalar" element={<Manbalar />} />
          {/* deep link: #/modda-50 opens the article drawer (handled in AppProviders) */}
          <Route path="modda-:n" element={<Qidiruv />} />
          <Route path="*" element={<Navigate to="/bosh" replace />} />
        </Route>
      </Routes>
    </AppProviders>
  );
}
