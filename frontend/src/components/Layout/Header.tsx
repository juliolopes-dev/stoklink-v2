import { FiLogOut, FiUser } from 'react-icons/fi'
import { useAuth } from '../../contexts/AuthContext'

export function Header() {
  const { user, signOut } = useAuth()

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Bem-vindo, {user?.nome}
          </h2>
          <p className="text-sm text-gray-500">
            {user?.perfil === 'ADMIN' ? 'Administrador' : 'Conferente'}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-600">
            <FiUser size={20} />
            <span className="text-sm">{user?.email}</span>
          </div>
          
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <FiLogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </header>
  )
}
