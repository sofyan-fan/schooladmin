import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import RequestHandler from '../apis/RequestHandler'
import { AuthContext } from './auth'

export const AuthProvider = ({ children }) => {
  const [user, setUser]     = useState(null)
  const [token, setToken]   = useState(localStorage.getItem('token'))
  const navigate            = useNavigate()

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (token && storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [token])

  const login = async (username, password) => {
    try {
      let response

      // DIT IS VOOR BACK-END API
      /*
      response = await RequestHandler.post('auth/login', {
        username,
        password
      })
      */

      // DIT IS VOOR JSON-SERVER
      response = await RequestHandler.post('login', {
        email: username,
        password
      })

      if (response?.data?.accessToken) {
        const { accessToken, ...userData } = response.data
        setToken(accessToken)
        setUser(userData)
        localStorage.setItem('token', accessToken)
        localStorage.setItem('user', JSON.stringify(userData))
        navigate('/dashboard')
        return true
      } else {
        console.error('Login failed:', response)
        return false
      }
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const register = async (username, password, role) => {
    try {
      let response

      // DIT IS VOOR BACK-END API
      /*
      response = await RequestHandler.post('auth/register', {
        username,
        password,
        role
      })
      */

      // DIT IS VOOR JSON-SERVER
      response = await RequestHandler.post('register', {
        email: username,
        password,
        role
      })

      if (response?.data?.accessToken) {
        const { accessToken, ...userData } = response.data
        setToken(accessToken)
        setUser(userData)
        localStorage.setItem('token', accessToken)
        localStorage.setItem('user', JSON.stringify(userData))
        navigate('/dashboard')
        return true
      } else {
        console.error('Registration failed:', response)
        return false
      }
    } catch (error) {
      console.error('Registration error:', error)
      return false
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const isAuthenticated = !!token

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, login, logout, token, register }}
    >
      {children}
    </AuthContext.Provider>
  )
}
