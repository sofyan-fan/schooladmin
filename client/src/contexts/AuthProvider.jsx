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
      setUser(JSON.parse(storedUser));
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await RequestHandler.post('auth/login', {
        email,
        password,
      });

      console.log('response: ', response);

      const { user: userData, accessToken, session } = response?.data || {};

      // Treat a 200 with a user payload as success (session-based auth)
      if (response?.status === 200 && userData) {
        // Normalize token to a string for local storage compatibility
        const tokenValue =
          typeof accessToken === 'string'
            ? accessToken
            : typeof session === 'string'
            ? session
            : 'session';

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

  const register = async (email, password, role, profile) => {
    try {
      let response;

      response = await RequestHandler.post('auth/register', {
        email,
        password,
        role,
        profile,
      });

      if (response?.data?.accessToken) {
        const { accessToken, user: userData } = response.data;

        setToken(accessToken);
        setUser(userData);

        localStorage.setItem('token', accessToken);
        console.log('setToken: ', accessToken);
        localStorage.setItem('user', JSON.stringify(userData));

        navigate('/dashboard');

        return true;
      } else {
        console.error('Registration failed:', response);
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
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
