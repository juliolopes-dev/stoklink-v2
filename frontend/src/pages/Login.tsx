import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { FiMail, FiLock, FiLogIn } from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'

export function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const successMessage = (location.state as { message?: string })?.message

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signIn(email, senha)
      navigate('/')
    } catch (err) {
      setError('Email ou senha inválidos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-lg shadow-md border border-gray-200 w-full max-w-md p-6">
        <div className="text-center mb-6">
          <img src="/logo.png" alt="StokLink" className="h-24 mx-auto mb-4" />
          <p className="text-sm text-gray-500">Controle de Recebimento de Mercadorias</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {successMessage && (
            <div className="bg-success-50 text-success-700 px-4 py-3 rounded-md text-sm border border-success-200">
              {successMessage}
            </div>
          )}
          {error && (
            <div className="bg-error-50 text-error-700 px-4 py-3 rounded-md text-sm border border-error-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-9 pl-10 pr-3 border border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full h-9 pl-10 pr-3 border border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-9 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <FiLogIn size={16} />
                Entrar
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Não tem uma conta?{' '}
            <Link to="/registro" className="text-primary-600 hover:text-primary-700 font-medium">
              Cadastre sua empresa
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
