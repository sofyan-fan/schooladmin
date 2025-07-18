import { Route, Routes } from 'react-router-dom';
import './App.css';
import DashboardPage from './components/DashboardPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
    </Routes>
  );
}

export default App;
