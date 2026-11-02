import { Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Runner } from './pages/Runner';
import { Results } from './pages/Results';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/runner" element={<Runner />} />
      <Route path="/results" element={<Results />} />
    </Routes>
  );
}

export default App;
