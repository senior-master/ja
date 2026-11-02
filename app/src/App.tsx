import { Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { CbtSetup } from './pages/CbtSetup';
import { PracticeSetup } from './pages/PracticeSetup';
import { Runner } from './pages/Runner';
import { Results } from './pages/Results';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/cbt-setup" element={<CbtSetup />} />
      <Route path="/practice-setup" element={<PracticeSetup />} />
      <Route path="/learning-setup" element={<PracticeSetup />} /> {/* Using Practice for now */}
      <Route path="/runner" element={<Runner />} />
      <Route path="/results" element={<Results />} />
    </Routes>
  );
}

export default App;
