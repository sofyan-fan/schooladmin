// contexts/AuthProviderServerjsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import RequestHandler from '../apis/RequestHandler'
import { AuthContext } from './auth'

export const AuthProviderServer = ({ children }) => {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  // on first load, ask the server who we are
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const resp = await RequestHandler.get('profile')
        if (resp.status === 200) {
          setUser(resp.data)    // { id, email, role, ... }
        }
      } catch {
        setUser(null)
      }
    }
    fetchUser()
  }, [])

  const login = async (email, password) => {
    try {
      const resp = await RequestHandler.post('login', { email, password })
      if (resp.status === 200) {
        setUser(resp.data)
        navigate('/dashboard')
        return true
      }
      return false
    } catch (err) {
      console.error('Login error:', err)
      return false
    }
  }

  const register = async (email, password, role) => {
    try {
      const resp = await RequestHandler.post('register', { email, password, role })
      if (resp.status === 201) {
        setUser(resp.data)
        navigate('/dashboard')
        return true
      }
      return false
    } catch (err) {
      console.error('Registration error:', err)
      return false
    }
  }

  const logout = async () => {
    try {
      await RequestHandler.post('logout')
    } catch (err) {
      // even if server fails, clear local state
      console.error('Logout error:', err)
    }
    setUser(null)
    navigate('/login')
  }

  const isAuthenticated = user !== null

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}
