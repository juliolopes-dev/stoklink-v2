import { useState } from 'react'
import { FiLogOut, FiUser, FiLock } from 'react-icons/fi'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'

export function Header() {
  const { user, signOut } = useAuth()
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

  const [showAlert, setShowAlert] = useState(true)

  return (
    <>
      {showAlert && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-800">
              <FiLock size={18} />
              <span className="text-sm">
                <strong>Dica de segurança:</strong> Lembre-se de alterar sua senha regularmente. 
                Clique em <strong>"Alterar Senha"</strong> no menu para atualizar.
              </span>
            </div>
            <button
              onClick={() => setShowAlert(false)}
              className="text-amber-600 hover:text-amber-800 text-sm font-medium"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
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
              onClick={openModal}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Alterar senha"
            >
              <FiLock size={20} />
              <span>Alterar Senha</span>
            </button>
            
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
