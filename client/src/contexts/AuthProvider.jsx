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

      // Normalize role and map camelCase profile to snake_case expected by backend
      const normalizedRole =
        typeof role === 'string' ? role.toLowerCase().trim() : role;
      const p = profile || {};
      const requestData = {
        email,
        password,
        role: normalizedRole,
        // snake_case fields as expected by Express backend
        first_name: p.first_name ?? p.firstName,
        last_name: p.last_name ?? p.lastName,
        birth_date: p.birth_date ?? p.dateOfBirth,
        gender: p.gender,
        address: p.address,
        postal_code: p.postal_code ?? p.postalCode,
        city: p.city,
        phone: p.phone,
        parent_name: p.parent_name ?? p.parentName,
        parent_email: p.parent_email ?? p.parentEmail,
        lesson_package: p.lesson_package ?? p.course,
        payment_method: p.payment_method ?? p.paymentMethod,
      };

      response = await RequestHandler.post('auth/register', requestData);

      // Success path for session-based backend (201 Created)
      if (response?.status === 201 && response?.data?.user) {
        const { accessToken, user: userData } = response.data;
        const tokenValue =
          typeof accessToken === 'string' ? accessToken : 'session';

        setToken(tokenValue);
        setUser(userData);

        localStorage.setItem('token', tokenValue);
        localStorage.setItem('user', JSON.stringify(userData));

        navigate('/dashboard');
        return true;
      }

      // Backwards compatibility: if API returns token without 201 check
      if (response?.data?.accessToken && response?.data?.user) {
        const { accessToken, user: userData } = response.data;
        setToken(accessToken);
        setUser(userData);
        localStorage.setItem('token', accessToken);
        localStorage.setItem('user', JSON.stringify(userData));
        navigate('/dashboard');
        return true;
      }

      console.error('Registration failed:', response);
      return false;
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
