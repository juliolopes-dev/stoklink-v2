import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '../services/api'

interface User {
  id: string
  nome: string
  email: string
  perfil: 'ADMIN' | 'GERENTE' | 'CONFERENTE' | 'COMPRAS' | 'FINANCEIRO'
  filialId: string
  filial: {
    id: string
    nome: string
    codigo: string
  }
}

interface AuthContextData {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: (email: string, senha: string) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext({} as AuthContextData)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Detectar se é um reload da página (F5, Ctrl+R, etc)
    const isPageReload = performance.navigation.type === 1 || 
                         performance.getEntriesByType('navigation')[0]?.type === 'reload'
    
    if (isPageReload) {
      // Limpar sessão ao recarregar
      localStorage.removeItem('@stoklink:token')
      localStorage.removeItem('@stoklink:user')
      setUser(null)
      setIsLoading(false)
      return
    }

    const token = localStorage.getItem('@stoklink:token')
    const storedUser = localStorage.getItem('@stoklink:user')

    if (token && storedUser) {
      setUser(JSON.parse(storedUser))
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }

    setIsLoading(false)
  }, [])

  async function signIn(email: string, senha: string) {
    const response = await api.post('/auth/login', { email, senha })
    
    const { token, usuario } = response.data

    localStorage.setItem('@stoklink:token', token)
    localStorage.setItem('@stoklink:user', JSON.stringify(usuario))

    api.defaults.headers.common['Authorization'] = `Bearer ${token}`

    setUser(usuario)
  }

  function signOut() {
    localStorage.removeItem('@stoklink:token')
    localStorage.removeItem('@stoklink:user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading,
      signIn, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
