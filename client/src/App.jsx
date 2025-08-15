import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { useAuth } from './hooks/useAuth';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SubjectsPage from './pages/SubjectsPage';
import CourseModulesPage from './pages/CourseModulesPage';
import StudentsPage from './pages/StudentsPage';
import TeachersPage from './pages/TeachersPage';
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
      <Route path="/leerlingen" element={<StudentsPage />} />
      <Route path="/docenten" element={<TeachersPage />} />
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
