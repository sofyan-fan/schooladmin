import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { useAuth } from './hooks/useAuth';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SubjectsPage from './pages/SubjectsPage';
import CourseModulesPage from './pages/CourseModulesPage';


const App = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/vakken" element={<SubjectsPage />} />
      <Route path="/lespakketten" element={<CourseModulesPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" />}
      />
    </Routes>
  );
};

export default App;
