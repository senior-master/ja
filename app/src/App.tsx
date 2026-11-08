import { Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { CbtSetup } from './pages/CbtSetup';
import { PracticeSetup } from './pages/PracticeSetup';
import { LearningSetup } from './pages/LearningSetup';
import { Runner } from './pages/Runner';
import { Results } from './pages/Results';
import { Dashboard } from './pages/Dashboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/cbt-setup" element={<CbtSetup />} />
      <Route path="/practice-setup" element={<PracticeSetup />} />
      <Route path="/learning-setup" element={<LearningSetup />} />
      <Route path="/runner" element={<Runner />} />
      <Route path="/results" element={<Results />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

export default App;
