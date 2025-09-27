import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RequestHandler from '../apis/RequestHandler';
import { AuthContext } from './auth';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [justRegistered, setJustRegistered] = useState(false);
  const [pendingStudentId, setPendingStudentId] = useState(null);
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

  const login = async (email, password, options) => {
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
        const redirectTo = options?.redirectTo || '/dashboard';
        navigate(redirectTo);
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
        // If the server returned a created profile (student), capture its id
        const createdProfile = response?.data?.user?.data;
        if (createdProfile?.id) {
          setPendingStudentId(createdProfile.id);
          try {
            localStorage.setItem('pendingStudentId', String(createdProfile.id));
          } catch (err) {
            console.warn('Failed to persist pendingStudentId', err);
          }
        }

        // Mark as just registered and automatically log in the user
        setJustRegistered(true);
        const loginSuccess = await login(email, password, {
          redirectTo: '/dashboard',
        });
        if (loginSuccess) {
          // Merge known profile fields into the lightweight session user
          setUser((prev) => {
            const studentIdValue =
              (createdProfile && createdProfile.id) ||
              pendingStudentId ||
              prev?.studentId;
            const merged = {
              ...prev,
              first_name: profileData?.first_name || prev?.first_name,
              firstName: profileData?.first_name || prev?.firstName,
              last_name: profileData?.last_name || prev?.last_name,
              // Attach the student id when available
              studentId: studentIdValue,
            };
            localStorage.setItem('user', JSON.stringify(merged));
            try {
              localStorage.removeItem('pendingStudentId');
            } catch (err) {
              console.warn('Failed to remove pendingStudentId', err);
            }
            return merged;
          });
          // Clear pending id after merging (state)
          setPendingStudentId(null);
        }
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

  // Register a user profile without logging in or navigating
  // Returns the raw API payload so callers can extract created user/profile
  const registerSilently = async (email, password, role, profileData) => {
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
        return { ok: false };
      }

      const requestData = {
        email,
        password,
        role: normalizedRole,
        ...profileData,
      };

      const response = await RequestHandler.post('auth/register', requestData);
      if (response?.status === 201 && response?.data?.user) {
        return { ok: true, data: response.data };
      }
      return { ok: false, error: response?.data?.message || 'Unknown error' };
    } catch (error) {
      return {
        ok: false,
        error: error?.response?.data?.message || error.message,
      };
    }
  };

  const clearJustRegistered = () => setJustRegistered(false);

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
      value={{
        isAuthenticated,
        user,
        login,
        logout,
        token,
        register,
        registerSilently,
        justRegistered,
        clearJustRegistered,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
