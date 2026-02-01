import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { 
  FiHome, 
  FiFileText, 
  FiPackage, 
  FiAlertTriangle, 
  FiBarChart2,
  FiTruck,
  FiUsers,
  FiMapPin,
  FiSettings,
  FiBriefcase,
  FiLogOut,
  FiLock,
  FiClock
} from 'react-icons/fi'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'

const menuItems = [
  { path: '/', icon: FiHome, label: 'Dashboard' },
  { path: '/notas-fiscais', icon: FiFileText, label: 'Notas Fiscais' },
  { path: '/pedidos-drp', icon: FiPackage, label: 'Pedidos DRP' },
  // { path: '/conferencias', icon: FiPackage, label: 'Conferências' }, // Desativado temporariamente
  { path: '/divergencias', icon: FiAlertTriangle, label: 'Divergências' },
  // { path: '/relatorios', icon: FiBarChart2, label: 'Relatórios' }, // Desativado temporariamente
  // { path: '/distribuicoes', icon: FiTruck, label: 'Distribuições' }, // Desativado temporariamente
]

const comprasMenuItems = [
  { path: '/fornecedores', icon: FiBriefcase, label: 'Fornecedores' },
  { path: '/transportadoras', icon: FiTruck, label: 'Transportadoras' },
]

const adminMenuItems = [
  { path: '/fornecedores', icon: FiBriefcase, label: 'Fornecedores' },
  { path: '/transportadoras', icon: FiTruck, label: 'Transportadoras' },
  { path: '/filiais', icon: FiMapPin, label: 'Filiais' },
  { path: '/usuarios', icon: FiUsers, label: 'Usuários' },
  { path: '/historico', icon: FiClock, label: 'Histórico' },
  { path: '/configuracoes', icon: FiSettings, label: 'Configurações' },
]

export function Sidebar() {
  const { user, signOut } = useAuth()
  const isAdmin = user?.perfil === 'ADMIN'
  const isCompras = user?.perfil === 'COMPRAS'
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
    <aside className="w-14 hover:w-56 bg-gray-900 min-h-screen flex flex-col transition-all duration-300 group">
      <div className="p-2 border-b border-gray-800 overflow-hidden">
        <h1 className="text-lg font-semibold text-white text-center whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">StokLink</h1>
        <div className="text-lg font-semibold text-white text-center group-hover:hidden">S</div>
      </div>

      <nav className="flex-1 p-2">
        <ul className="space-y-0.5">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200 text-sm ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
                title={item.label}
              >
                <item.icon size={18} className="flex-shrink-0" />
                <span className="whitespace-nowrap overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        {isCompras && (
          <>
            <div className="mt-4 mb-2 overflow-hidden">
              <span className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Cadastros
              </span>
              <div className="border-t border-gray-700 mx-3 group-hover:hidden"></div>
            </div>
            <ul className="space-y-0.5">
              {comprasMenuItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200 text-sm ${
                        isActive
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`
                    }
                    title={item.label}
                  >
                    <item.icon size={18} className="flex-shrink-0" />
                    <span className="whitespace-nowrap overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </>
        )}

        {isAdmin && (
          <>
            <div className="mt-4 mb-2 overflow-hidden">
              <span className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Administração
              </span>
              <div className="border-t border-gray-700 mx-3 group-hover:hidden"></div>
            </div>
            <ul className="space-y-0.5">
              {adminMenuItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200 text-sm ${
                        isActive
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`
                    }
                    title={item.label}
                  >
                    <item.icon size={18} className="flex-shrink-0" />
                    <span className="whitespace-nowrap overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>

      <div className="p-2 border-t border-gray-800 space-y-1 overflow-hidden">
        <div className="text-gray-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <p className="text-white font-medium text-sm whitespace-nowrap truncate">{user?.nome}</p>
          <p className="text-xs whitespace-nowrap">
            {user?.perfil === 'ADMIN' ? 'Administrador' : 
             user?.perfil === 'GERENTE' ? 'Gerente' :
             user?.perfil === 'COMPRAS' ? 'Compras' :
             user?.perfil === 'FINANCEIRO' ? 'Financeiro' : 'Conferente'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openModal}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
            title="Alterar Senha"
          >
            <FiLock size={14} className="flex-shrink-0" />
            <span className="whitespace-nowrap overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300">Senha</span>
          </button>
          <button
            onClick={signOut}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-sm"
            title="Sair"
          >
            <FiLogOut size={14} className="flex-shrink-0" />
            <span className="whitespace-nowrap overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300">Sair</span>
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
