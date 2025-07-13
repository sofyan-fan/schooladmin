import { useEffect, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import api from './api/api'; // Import the new api instance
import './App.css';
import DashboardPage from './components/DashboardPage';
import LoginPage from './components/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import RegisterPage from './components/RegisterPage'; // Import RegisterPage

function App() {
  const [error, setError] = useState('');
  const [message, setMessage] = useState(''); // For success messages
  const [loading, setLoading] = useState(true); // Set initial loading to true
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Check for an active session on initial render
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await api.get('/auth/me'); // Check the session
        setUser(response.data.user);
      } catch (err) {
        // No active session or an error
        setUser(null);
      } finally {
        setLoading(false); // Stop loading once session check is complete
      }
    };
    checkSession();
  }, []);

  const handleLogin = async (email, password) => {
    setLoading(true);
    setError('');
    setMessage(''); // Clear message on new action

    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });
      const { user: loggedInUser } = response.data; // Get user from response
      setUser(loggedInUser);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (formData) => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await api.post('/auth/register', formData);
      const { user: registeredUser } = response.data;

      setUser(registeredUser); // Set user state to log them in
      navigate('/'); // Redirect to dashboard
    } catch (err) {
      setError(
        err.response?.data?.message || 'An error occurred during registration'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout'); // Call the logout endpoint
    } catch (err) {
      console.error('Logout failed', err);
    } finally {
      setUser(null);
      navigate('/login');
    }
  };

  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <LoginPage
            handleLogin={handleLogin}
            loading={loading}
            error={error}
          />
        }
      />
      <Route
        path="/register"
        element={
          <RegisterPage
            handleRegister={handleRegister}
            loading={loading}
            error={error}
            message={message}
          />
        }
      />
      <Route element={<ProtectedRoute user={user} />}>
        <Route
          path="/"
          element={<DashboardPage user={user} handleLogout={handleLogout} />}
        />
        {/* Add other protected routes here */}
      </Route>
    </Routes>
  );
}

export default App;
