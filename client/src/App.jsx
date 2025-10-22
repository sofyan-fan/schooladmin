import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import LayoutWrapper from './components/layout/LayoutWrapper';
import RequireRole from './components/layout/RequireRole';
import { useAuth } from './hooks/useAuth';

import AssessmentsPage from './pages/AssessmentsPage';
import ClassesPage from './pages/ClassesPage';
// import ClassLayoutsPage from './pages/ClassLayoutsPage';
import AbsencePage from './pages/AbsencePage';
import ClassSchedulePage from './pages/ClassSchedulePage';
import ClassroomsPage from './pages/ClassroomsPage';
import CoursesPage from './pages/CoursesPage';
import DashboardPage from './pages/DashboardPage';
import FinancePage from './pages/FinancePage';
import LoginPage from './pages/LoginPage';
import ModulesPage from './pages/ModulesPage';
import QuranLogPage from './pages/QuranLogPage';
import RegisterPage from './pages/RegisterPage';
import ResultsPage from './pages/ResultsPage';
// import WelcomePage from './pages/WelcomePage';
// import RosterPage from './pages/RosterPage';
import RostersPage from './pages/RostersPage';
import SettingsPage from './pages/SettingsPage';
import StudentDetailsPage from './pages/StudentDetailsPage';
import StudentSelfPage from './pages/StudentSelfPage';
import StudentsPage from './pages/StudentsPage';
import SubjectsPage from './pages/SubjectsPage';
import TeachersPage from './pages/TeachersPage';
import TimeRegisterPage from './pages/TimeRegisterPage';
// import StudentDetailsPage from './pages/StudentDetailsPage';
// import { useAuth } from './hooks/useAuth';

// const user_role = useAuth();
// console.log('user_role', user_role);

const App = () => {
  const { isAuthenticated, user } = useAuth();
  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? (
            user?.role?.toLowerCase() === 'student' ? (
              <Navigate to="/mijn-profiel" />
            ) : (
              <Navigate to="/dashboard" />
            )
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
        {/* Common (all authenticated roles) */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/instellingen" element={<SettingsPage />} />
        <Route
          path="/mijn-profiel"
          element={
            <RequireRole allowedRoles={['student']}>
              <StudentSelfPage />
            </RequireRole>
          }
        />
        <Route
          path="/mijn-profiel/leerling/:id"
          element={
            <RequireRole allowedRoles={['student']}>
              <StudentDetailsPage />
            </RequireRole>
          }
        />

        {/* Admin-only */}
        <Route element={<RequireRole allowedRoles={['admin']} />}>
          <Route path="/klassen" element={<ClassesPage />} />
          <Route path="/roosters" element={<RostersPage />} />
          <Route path="/class-schedule" element={<ClassSchedulePage />} />
          <Route path="/vakken" element={<SubjectsPage />} />
          <Route path="/modules" element={<ModulesPage />} />
          <Route path="/lespakketten" element={<CoursesPage />} />
          <Route path="/lokalen" element={<ClassroomsPage />} />
          <Route path="/financien" element={<FinancePage />} />
          <Route path="/leerlingen" element={<StudentsPage />} />
          <Route path="/docenten" element={<TeachersPage />} />
          <Route path="/leerlingen/:id" element={<StudentDetailsPage />} />
        </Route>

        {/* Admin + Teacher */}
        <Route element={<RequireRole allowedRoles={['admin', 'teacher']} />}>
          <Route path="/toetsen-en-examens" element={<AssessmentsPage />} />
          <Route path="/resultaten" element={<ResultsPage />} />
          <Route path="/afwezigheid" element={<AbsencePage />} />
          <Route path="/tijd-registratie" element={<TimeRegisterPage />} />
          <Route path="/quran-log" element={<QuranLogPage />} />
        </Route>

        {/* <Route path="/welcome" element={<WelcomePage />} /> */}
        {/* <Route path="/rooster" element={<RosterPage />} /> */}
        {/* <Route path="/onderwijsindeling" element={<ClassLayoutsPage />} /> */}
      </Route>
    </Routes>
  );
};

export default App;
