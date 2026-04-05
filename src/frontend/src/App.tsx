import { Navigate, Route, Routes } from 'react-router-dom';

import { CanvasScreen } from './components/Canvas/CanvasScreen';
import { LandingScreen } from './components/Landing/LandingScreen';
import { TopNav } from './components/Layout/TopNav';

function App() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-canvas text-text1">
      <TopNav />
      <main className="min-h-0 flex-1 overflow-hidden">
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
