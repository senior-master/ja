import { Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { CbtSetup } from './pages/CbtSetup';
import { PracticeSetup } from './pages/PracticeSetup';
import { LearningSetup } from './pages/LearningSetup';
import { Runner } from './pages/Runner';
import { Results } from './pages/Results';
import { Dashboard } from './pages/Dashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { Leaderboard } from './pages/Leaderboard';
import { ThemeWatcher } from './components/ThemeWatcher';

function App() {
  return (
    <>
      <ThemeWatcher />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cbt-setup" element={<CbtSetup />} />
        <Route path="/practice-setup" element={<PracticeSetup />} />
        <Route path="/learning-setup" element={<LearningSetup />} />
        <Route path="/runner" element={<Runner />} />
        <Route path="/results" element={<Results />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>
    </>
  );
}

export default App;
