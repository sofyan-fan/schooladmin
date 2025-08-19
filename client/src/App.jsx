import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { useAuth } from './hooks/useAuth';
import AssessmentsPage from './pages/AssessmentsPage';
import ClassesPage from './pages/ClassesPage';
import ClassLayoutsPage from './pages/ClassLayoutsPage';
import CoursesPage from './pages/CoursesPage';
import DashboardPage from './pages/DashboardPage';
import FinancePage from './pages/FinancePage';
import LoginPage from './pages/LoginPage';
import ModulesPage from './pages/ModulesPage';
import RegisterPage from './pages/RegisterPage';
import RosterPage from './pages/RosterPage';
import SettingsPage from './pages/SettingsPage';
import StudentsPage from './pages/StudentsPage';
import SubjectsPage from './pages/SubjectsPage';
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
      <Route path="/klassen" element={<ClassesPage />} />
      <Route path="/rooster" element={<RosterPage />} />
      <Route path="/toetsen-en-examens" element={<AssessmentsPage />} />
      <Route path="/leerlingen" element={<StudentsPage />} />
      <Route path="/docenten" element={<TeachersPage />} />
      <Route path="/vakken" element={<SubjectsPage />} />
      <Route path="/modules" element={<ModulesPage />} />
      <Route path="/lespakketten" element={<CoursesPage />} />
      <Route path="/onderwijsindeling" element={<ClassLayoutsPage />} />
      <Route path="/financien" element={<FinancePage />} />
      <Route path="/instellingen" element={<SettingsPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" />}
      />
    </Routes>
  );
};

export default App;
