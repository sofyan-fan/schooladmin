import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import LayoutWrapper from './components/layout/LayoutWrapper';
import { useAuth } from './hooks/useAuth';

import AssessmentsPage from './pages/AssessmentsPage';
import ClassesPage from './pages/ClassesPage';
// import ClassLayoutsPage from './pages/ClassLayoutsPage';
import ClassroomsPage from './pages/ClassroomsPage';
import CoursesPage from './pages/CoursesPage';
import DashboardPage from './pages/DashboardPage';
import FinancePage from './pages/FinancePage';
import LoginPage from './pages/LoginPage';
import ModulesPage from './pages/ModulesPage';
import RegisterPage from './pages/RegisterPage';
import RosterPage from './pages/RosterPage';
import RostersPage from './pages/RostersPage';
import SettingsPage from './pages/SettingsPage';
import StudentsPage from './pages/StudentsPage';
import SubjectsPage from './pages/SubjectsPage';
import TeachersPage from './pages/TeachersPage';
import ResultsPage from './pages/ResultsPage';
import TimeRegisterPage from './pages/TimeRegisterPage';
// import { useAuth } from './hooks/useAuth';

// const user_role = useAuth();
// console.log('user_role', user_role);

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
      <Route path="/register" element={<RegisterPage />} />

      <Route
        element={isAuthenticated ? <LayoutWrapper /> : <Navigate to="/login" />}
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/klassen" element={<ClassesPage />} />
        <Route path="/rooster" element={<RosterPage />} />
        <Route path="/roosters" element={<RostersPage />} />
        <Route path="/toetsen-en-examens" element={<AssessmentsPage />} />
        <Route path="/resultaten" element={<ResultsPage />} />
        <Route path="/leerlingen" element={<StudentsPage />} />
        <Route path="/docenten" element={<TeachersPage />} />
        <Route path="/vakken" element={<SubjectsPage />} />
        <Route path="/modules" element={<ModulesPage />} />
        <Route path="/lespakketten" element={<CoursesPage />} />
        <Route path="/lokalen" element={<ClassroomsPage />} />
        <Route path="/tijd-registratie" element={<TimeRegisterPage />} />
        {/* <Route path="/onderwijsindeling" element={<ClassLayoutsPage />} /> */}
        <Route path="/financien" element={<FinancePage />} />
        <Route path="/instellingen" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
};

export default App;
