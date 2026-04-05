import { Navigate, Route, Routes } from 'react-router-dom';

import { CanvasScreen } from './components/Canvas/CanvasScreen';
import { LandingScreen } from './components/Landing/LandingScreen';
import { TopNav } from './components/Layout/TopNav';

function App() {
  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-canvas text-text1">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_18%,transparent_82%,rgba(255,255,255,0.02))]" />
      <TopNav />
      <main className="relative min-h-0 flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<LandingScreen />} />
          <Route path="/canvas" element={<CanvasScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
