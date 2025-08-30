import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RequestHandler from '../apis/RequestHandler';
import { AuthContext } from './auth';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse user from localStorage', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setToken(null);
      }
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await RequestHandler.post('auth/login', {
        email,
        password,
      });
      const { user: userData, session } = response?.data || {};

      if (response?.status === 200 && userData && session) {
        // Assuming the session object contains the necessary token or session ID
        // If the server uses session cookies, this might be all that's needed
        const token = session.cookie; // Or whatever uniquely identifies the session
        setToken(token);
        setUser(userData);
        localStorage.setItem('token', token); // Storing session identifier
        localStorage.setItem('user', JSON.stringify(userData));
        navigate('/dashboard');
        return true;
      }
      console.error('Login failed:', response);
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (email, password, role, profileData) => {
    try {
      const normalizedRole =
        typeof role === 'string' && role.trim()
          ? role.toLowerCase().trim()
          : null;

      if (!normalizedRole || !email || !password) {
        console.error('Registration error: Missing email/password/role', {
          emailPresent: Boolean(email),
          passwordPresent: Boolean(password),
          role,
        });
        return false;
      }

      const requestData = {
        email,
        password,
        role: normalizedRole,
        ...profileData,
      };

      const response = await RequestHandler.post('auth/register', requestData);

      if (response?.status === 201 && response?.data?.user) {
        // Automatically log in the user after successful registration
        const loginSuccess = await login(email, password);
        return loginSuccess;
      }

      console.error(
        'Registration failed:',
        response?.data?.message || 'Unknown error',
        response
      );
      return false;
    } catch (error) {
      console.error(
        'Registration error:',
        error?.response?.data?.message || error.message
      );
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, login, logout, token, register }}
    >
      {children}
    </AuthContext.Provider>
  );
};
