import { useEffect, useState } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiUser, FiShield } from 'react-icons/fi'
import { api } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { useModal } from '../../contexts/ModalContext'

interface Filial {
  id: string
  nome: string
  codigo: string
}

interface Usuario {
  id: string
  nome: string
  email: string
  perfil: 'ADMIN' | 'GERENTE' | 'CONFERENTE' | 'COMPRAS' | 'FINANCEIRO'
  ativo: boolean
  filial: Filial
}

interface UsuarioForm {
  nome: string
  email: string
  senha: string
  perfil: 'ADMIN' | 'GERENTE' | 'CONFERENTE' | 'COMPRAS' | 'FINANCEIRO'
  filialId: string
}

const initialForm: UsuarioForm = {
  nome: '',
  email: '',
  senha: '',
  perfil: 'CONFERENTE',
  filialId: ''
}

export function Usuarios() {
  const { user } = useAuth()
  const { confirm, alert } = useModal()
  const isAdmin = user?.perfil === 'ADMIN'
  
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [filiais, setFiliais] = useState<Filial[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<UsuarioForm>(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [usuariosRes, filiaisRes] = await Promise.all([
        api.get('/usuarios'),
        api.get('/filiais/ativas')
      ])
      setUsuarios(usuariosRes.data)
      setFiliais(filiaisRes.data)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  function openModal(usuario?: Usuario) {
    if (usuario) {
      setEditingId(usuario.id)
      setForm({
        nome: usuario.nome,
        email: usuario.email,
        senha: '',
        perfil: usuario.perfil,
        filialId: usuario.filial?.id || ''
      })
    } else {
      setEditingId(null)
      setForm(initialForm)
    }
    setError('')
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const payload = editingId 
        ? { ...form, senha: form.senha || undefined }
        : form

      if (editingId) {
        await api.put(`/usuarios/${editingId}`, payload)
      } else {
        if (!form.senha) {
          setError('Senha é obrigatória para novos usuários')
          setSaving(false)
          return
        }
        await api.post('/usuarios', payload)
      }
      setShowModal(false)
      loadData()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      setError(error.response?.data?.error || 'Erro ao salvar usuário')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (id === user?.id) {
      alert('Ação não permitida', 'Você não pode excluir seu próprio usuário', 'error')
      return
    }
    const confirmed = await confirm('Excluir usuário', 'Deseja realmente excluir este usuário?')
    if (!confirmed) return

    try {
      await api.delete(`/usuarios/${id}`)
      loadData()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      alert('Erro', error.response?.data?.error || 'Erro ao excluir usuário', 'error')
    }
  }

  async function handleToggleAtivo(usuario: Usuario) {
    if (usuario.id === user?.id) {
      alert('Ação não permitida', 'Você não pode desativar seu próprio usuário', 'error')
      return
    }
    try {
      await api.put(`/usuarios/${usuario.id}`, { ativo: !usuario.ativo })
      loadData()
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
    }
  }

  const filteredUsuarios = usuarios.filter(u => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      u.nome.toLowerCase().includes(search) ||
      u.email.toLowerCase().includes(search) ||
      u.filial?.nome?.toLowerCase().includes(search)
    )
  })

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FiShield size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Acesso restrito a administradores</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden p-4">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h1 className="text-lg font-semibold text-gray-800">Usuários</h1>
        <button
          onClick={() => openModal()}
          className="h-9 flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 rounded-md text-sm font-medium transition-colors"
        >
          <FiPlus size={16} />
          Novo Usuário
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome, email ou filial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-10 pr-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
        </div>

        {filteredUsuarios.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            Nenhum usuário encontrado
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Usuário</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Filial</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Perfil</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsuarios.map((usuario) => (
                  <tr key={usuario.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <FiUser className="text-primary-600" size={20} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{usuario.nome}</p>
                          {usuario.id === user?.id && (
                            <span className="text-xs text-primary-600">(você)</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {usuario.email}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {usuario.filial?.nome || 'Sem filial'}
                      </span>
                      {usuario.filial && (
                        <span className="ml-2 text-xs text-gray-400 font-mono">
                          ({usuario.filial.codigo})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        usuario.perfil === 'ADMIN'
                          ? 'bg-purple-100 text-purple-800'
                          : usuario.perfil === 'GERENTE'
                          ? 'bg-green-100 text-green-800'
                          : usuario.perfil === 'COMPRAS'
                          ? 'bg-orange-100 text-orange-800'
                          : usuario.perfil === 'FINANCEIRO'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {usuario.perfil === 'ADMIN' ? 'Administrador' : usuario.perfil === 'GERENTE' ? 'Gerente' : usuario.perfil === 'COMPRAS' ? 'Compras' : usuario.perfil === 'FINANCEIRO' ? 'Financeiro' : 'Conferente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleAtivo(usuario)}
                        disabled={usuario.id === user?.id}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          usuario.ativo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        } ${usuario.id === user?.id ? 'cursor-not-allowed opacity-50' : ''}`}
                      >
                        {usuario.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal(usuario)}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(usuario.id)}
                          disabled={usuario.id === user?.id}
                          className={`p-2 hover:bg-red-50 rounded-lg text-red-600 ${
                            usuario.id === user?.id ? 'cursor-not-allowed opacity-50' : ''
                          }`}
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingId ? 'Editar Usuário' : 'Novo Usuário'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha {editingId ? '(deixe em branco para manter)' : '*'}
                </label>
                <input
                  type="password"
                  value={form.senha}
                  onChange={(e) => setForm({ ...form, senha: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  required={!editingId}
                  minLength={6}
                  placeholder={editingId ? '••••••••' : ''}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Perfil *</label>
                  <select
                    value={form.perfil}
                    onChange={(e) => setForm({ ...form, perfil: e.target.value as 'ADMIN' | 'GERENTE' | 'CONFERENTE' | 'COMPRAS' | 'FINANCEIRO' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    required
                  >
                    <option value="CONFERENTE">Conferente</option>
                    <option value="COMPRAS">Compras</option>
                    <option value="FINANCEIRO">Financeiro</option>
                    <option value="GERENTE">Gerente</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Filial *</label>
                  <select
                    value={form.filialId}
                    onChange={(e) => setForm({ ...form, filialId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    required
                  >
                    <option value="">Selecione...</option>
                    {filiais.map((filial) => (
                      <option key={filial.id} value={filial.id}>
                        {filial.nome} ({filial.codigo})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
