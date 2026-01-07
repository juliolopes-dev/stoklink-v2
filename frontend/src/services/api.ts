import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Controle de versão da aplicação
let appVersion: string | null = null

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@stoklink:token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor para tratar erros e verificar versão
api.interceptors.response.use(
  (response) => {
    // Verificar versão da aplicação
    const serverVersion = response.headers['x-app-version']
    if (serverVersion) {
      if (appVersion === null) {
        // Primeira requisição - guardar versão
        appVersion = serverVersion
      } else if (appVersion !== serverVersion) {
        // Versão mudou - recarregar página sem cache
        console.log(`Nova versão detectada: ${appVersion} -> ${serverVersion}`)
        appVersion = serverVersion
        
        // Pequeno delay para garantir que a resposta atual seja processada
        setTimeout(() => {
          // Forçar reload sem cache adicionando timestamp na URL
          window.location.href = window.location.pathname + '?v=' + Date.now()
        }, 500)
      }
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('@stoklink:token')
      localStorage.removeItem('@stoklink:user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export { api }
