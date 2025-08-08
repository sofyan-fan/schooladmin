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
      // DIT IS VOOR BACK-END API
      /*
      response = await RequestHandler.post('auth/login', {
        username,
        password
      })
      */

      // DIT IS VOOR JSON-SERVER
      const response = await RequestHandler.post('auth/login', {
        email,
        password,
      });
      
      // if (response?.status === 200) {
      //   navigate('/dashboard');
      //   console.log("navigate dashboard");
      //   return true;
      // }
      console.log("response: ", response);
      
      if (response?.data?.session) {
        
        console.log("response: ", response.data);
        const { session, user: userData } = response.data;


        setToken(session);
        console.log("setToken: ", session);
        setUser(userData);



        localStorage.setItem('token', session);
        localStorage.setItem('user', JSON.stringify(userData));

        navigate('/dashboard');
        return true;
      } else {
        console.error('Login failed:', response);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (email, password, role) => {
    try {
      let response;

      // DIT IS VOOR BACK-END API
      response = await RequestHandler.post('auth/register', {
        email,
        password,
        role,
      });

      // DIT IS VOOR JSON-SERVER
      // response = await RequestHandler.post('register', {
      //   name,
      //   email,
      //   password,
      //   role
      // })
      // console.log("response: ", response);

      if (response?.data?.accessToken) {
        const { accessToken, user: userData } = response.data;

        setToken(accessToken);
        // console.log("setToken: ", accessToken);
        setUser(userData);

        localStorage.setItem('token', accessToken);
        console.log("setToken: ", accessToken);
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
