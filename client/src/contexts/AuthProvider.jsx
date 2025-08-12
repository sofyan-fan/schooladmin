import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RequestHandler from '../apis/RequestHandler';
import { AuthContext } from './auth';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const navigate = useNavigate();

  useEffect(() => {
    // On initial load, try to re-hydrate the user state from localStorage
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        // Clear corrupted data
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

      const { user: userData, accessToken } = response?.data || {};

      // A successful login should return a 200 status and user data
      if (response?.status === 200 && userData) {
        const tokenValue = accessToken || 'session_active'; // Use token or a placeholder

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

  /**
   * Registers a new user and their associated profile (Student or Teacher).
   * @param {string} email - The email for the user account (typically parent's email).
   * @param {string} password - The password for the user account.
   * @param {string} role - The role ('student' or 'teacher').
   * @param {object} profileData - An object containing profile details with snake_case keys.
   */
  const register = async (email, password, role, profileData) => {
    try {
      // The `profileData` from RegisterPage is already in the correct snake_case format.
      // We can directly combine it with the main account details.
      const requestData = {
        email, // For the main User account
        password,
        role: role.toLowerCase().trim(),
        ...profileData, // Spread all other student/profile fields
      };
      
      // The backend 'auth/register' endpoint will handle creating the User
      // and the associated Student/Teacher record from this single payload.
      const response = await RequestHandler.post('auth/register', requestData);

      // A successful registration should return a 201 (Created) status
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
    // We can also make a call to the backend to invalidate the session/token if needed
    // RequestHandler.post('auth/logout'); 
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