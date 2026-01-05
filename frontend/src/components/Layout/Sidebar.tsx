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
  FiBriefcase
} from 'react-icons/fi'
import { useAuth } from '../../contexts/AuthContext'

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
  const { user } = useAuth()
  const isAdmin = user?.perfil === 'ADMIN'

  return (
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

      <div className="p-4 border-t border-gray-800">
        <div className="text-gray-400 text-sm">
          <p className="text-white font-medium">{user?.filial?.nome}</p>
          <p className="text-xs">{user?.filial?.codigo}</p>
        </div>
      </div>
    </aside>
  )
}
