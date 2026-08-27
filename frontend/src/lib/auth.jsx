import { createContext, useCallback, useContext, useState } from 'react'
import { api, getToken, setToken } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getToken())
  const [email, setEmail] = useState(null)

  const login = useCallback(async (emailInput, password) => {
    const { access_token } = await api.login(emailInput, password)
    setToken(access_token)
    setTokenState(access_token)
    setEmail(emailInput)
  }, [])

  const register = useCallback(async (emailInput, password) => {
    await api.register(emailInput, password)
    await login(emailInput, password)
  }, [login])

  const logout = useCallback(() => {
    setToken(null)
    setTokenState(null)
    setEmail(null)
  }, [])

  return (
    <AuthContext.Provider value={{ token, email, login, register, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
