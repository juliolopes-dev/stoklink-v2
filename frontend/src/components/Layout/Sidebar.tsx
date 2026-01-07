import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { 
  FiHome, 
  FiFileText, 
  FiPackage, 
  FiAlertTriangle, 
  // FiTruck, // Desativado temporariamente
  FiUsers,
  FiMapPin,
  FiSettings,
  FiBriefcase,
  FiLogOut,
  FiLock
} from 'react-icons/fi'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'

const menuItems = [
  { path: '/', icon: FiHome, label: 'Dashboard' },
  { path: '/notas-fiscais', icon: FiFileText, label: 'Notas Fiscais' },
  { path: '/conferencias', icon: FiPackage, label: 'Conferências' },
  { path: '/divergencias', icon: FiAlertTriangle, label: 'Divergências' },
  // { path: '/distribuicoes', icon: FiTruck, label: 'Distribuições' }, // Desativado temporariamente
]

const adminMenuItems = [
  { path: '/fornecedores', icon: FiBriefcase, label: 'Fornecedores' },
  { path: '/filiais', icon: FiMapPin, label: 'Filiais' },
  { path: '/usuarios', icon: FiUsers, label: 'Usuários' },
  { path: '/configuracoes', icon: FiSettings, label: 'Configurações' },
]

export function Sidebar() {
  const { user, signOut } = useAuth()
  const isAdmin = user?.perfil === 'ADMIN'
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (novaSenha !== confirmarSenha) {
      setError('As senhas não coincidem')
      return
    }

    if (novaSenha.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres')
      return
    }

    setLoading(true)
    try {
      await api.put('/auth/change-password', { senhaAtual, novaSenha })
      setSuccess('Senha alterada com sucesso!')
      setSenhaAtual('')
      setNovaSenha('')
      setConfirmarSenha('')
      setTimeout(() => {
        setShowPasswordModal(false)
        setSuccess('')
      }, 2000)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      setError(error.response?.data?.error || 'Erro ao alterar senha')
    } finally {
      setLoading(false)
    }
  }

  function openModal() {
    setSenhaAtual('')
    setNovaSenha('')
    setConfirmarSenha('')
    setError('')
    setSuccess('')
    setShowPasswordModal(true)
  }

  return (
    <>
    <aside className="w-64 bg-gray-900 min-h-screen flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-white">StokLink</h1>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        {isAdmin && (
          <>
            <div className="mt-8 mb-4">
              <span className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Administração
              </span>
            </div>
            <ul className="space-y-1">
              {adminMenuItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`
                    }
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-gray-800 space-y-3">
        <div className="text-gray-400 text-xs">
          <p className="text-white font-medium text-sm">{user?.nome}</p>
          <p className="text-xs">{user?.perfil === 'ADMIN' ? 'Administrador' : 'Conferente'}</p>
          <p className="text-xs truncate">{user?.email}</p>
          <p className="text-xs mt-2 text-gray-500">{user?.filial?.nome} ({user?.filial?.codigo})</p>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <FiLock size={14} />
            <span>Alterar Senha</span>
          </button>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <FiLogOut size={14} />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </aside>

    {showPasswordModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Alterar Senha</h2>
          </div>

          <form onSubmit={handleChangePassword} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha Atual *</label>
              <input
                type="password"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha *</label>
              <input
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nova Senha *</label>
              <input
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                required
                minLength={6}
              />
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  )
}
