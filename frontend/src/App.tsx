import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import DashboardPage from './pages/DashboardPage';
import EDAPage from './pages/EDAPage';
import ModelPage from './pages/ModelPage';
import UploadPage from './pages/UploadPage';
import WebcamPage from './pages/WebcamPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="eda" element={<EDAPage />} />
          <Route path="model" element={<ModelPage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="webcam" element={<WebcamPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
