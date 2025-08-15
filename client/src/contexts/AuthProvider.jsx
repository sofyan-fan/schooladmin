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
      const response = await RequestHandler.post('auth/login', { email, password });
      const { user: userData, accessToken } = response?.data || {};

      if (response?.status === 200 && userData) {
        const tokenValue = accessToken || 'session_active';
        setToken(tokenValue);
        setUser(userData);
        localStorage.setItem('token', tokenValue);
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
        typeof role === 'string' && role.trim() ? role.toLowerCase().trim() : null;

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
        ...(profileData || {}),
      };

      // Debug:
      // console.log('Requesting /auth/register with', requestData);

      const response = await RequestHandler.post('auth/register', requestData);

      if (response?.status === 201 && response?.data?.user) {
        const { accessToken, user: userData } = response.data;
        const tokenValue = accessToken || 'session_active';
        setToken(tokenValue);
        setUser(userData);
        localStorage.setItem('token', tokenValue);
        localStorage.setItem('user', JSON.stringify(userData));
        navigate('/dashboard');
        return true;
      }

      console.error('Registration failed:', response?.data?.message || 'Unknown error', response);
      return false;
    } catch (error) {
      console.error('Registration error:', error?.response?.data?.message || error.message);
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
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, token, register }}>
      {children}
    </AuthContext.Provider>
  );
};
