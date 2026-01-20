import { useEffect, useState } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiPhone, FiMail } from 'react-icons/fi'
import { api } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { useModal } from '../../contexts/ModalContext'

interface Fornecedor {
  id: string
  nome: string
  cnpj: string | null
  email: string | null
  telefone: string | null
  contato: string | null
  endereco: string | null
  cidade: string | null
  uf: string | null
  ativo: boolean
  _count: {
    notasFiscais: number
  }
}

interface FornecedorForm {
  nome: string
  cnpj: string
  email: string
  telefone: string
  contato: string
  endereco: string
  cidade: string
  uf: string
}

const initialForm: FornecedorForm = {
  nome: '',
  cnpj: '',
  email: '',
  telefone: '',
  contato: '',
  endereco: '',
  cidade: '',
  uf: ''
}

export function Fornecedores() {
  const { user } = useAuth()
  const { confirm, alert } = useModal()
  const canManage = user?.perfil === 'ADMIN' || user?.perfil === 'COMPRAS'
  
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FornecedorForm>(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadFornecedores()
  }, [])

  async function loadFornecedores() {
    setLoading(true)
    try {
      const response = await api.get('/fornecedores')
      setFornecedores(response.data)
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error)
    } finally {
      setLoading(false)
    }
  }

  function openModal(fornecedor?: Fornecedor) {
    if (fornecedor) {
      setEditingId(fornecedor.id)
      setForm({
        nome: fornecedor.nome,
        cnpj: fornecedor.cnpj || '',
        email: fornecedor.email || '',
        telefone: fornecedor.telefone || '',
        contato: fornecedor.contato || '',
        endereco: fornecedor.endereco || '',
        cidade: fornecedor.cidade || '',
        uf: fornecedor.uf || ''
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
      if (editingId) {
        await api.put(`/fornecedores/${editingId}`, form)
      } else {
        await api.post('/fornecedores', form)
      }
      setShowModal(false)
      loadFornecedores()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      setError(error.response?.data?.error || 'Erro ao salvar fornecedor')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    const confirmed = await confirm('Excluir fornecedor', 'Deseja realmente excluir este fornecedor?')
    if (!confirmed) return

    try {
      await api.delete(`/fornecedores/${id}`)
      loadFornecedores()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      alert('Erro', error.response?.data?.error || 'Erro ao excluir fornecedor', 'error')
    }
  }

  async function handleToggleAtivo(fornecedor: Fornecedor) {
    try {
      await api.put(`/fornecedores/${fornecedor.id}`, { ativo: !fornecedor.ativo })
      loadFornecedores()
    } catch (error) {
      console.error('Erro ao atualizar fornecedor:', error)
    }
  }

  const filteredFornecedores = fornecedores.filter(f => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      f.nome.toLowerCase().includes(search) ||
      f.cnpj?.toLowerCase().includes(search) ||
      f.email?.toLowerCase().includes(search)
    )
  })

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
        <h1 className="text-lg font-semibold text-gray-800">Fornecedores</h1>
        {canManage && (
          <button
            onClick={() => openModal()}
            className="h-9 flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 rounded-md text-sm font-medium transition-colors"
          >
            <FiPlus size={16} />
            Novo Fornecedor
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome, CNPJ ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-10 pr-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
        </div>

        {filteredFornecedores.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            Nenhum fornecedor encontrado
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <table className="w-full border-collapse flex-shrink-0">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">CNPJ</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contato</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">NFs</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                  {canManage && (
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Ações</th>
                  )}
                </tr>
              </thead>
            </table>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full border-collapse">
                <tbody>
                  {filteredFornecedores.map((fornecedor) => (
                  <tr key={fornecedor.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{fornecedor.nome}</p>
                      {fornecedor.cidade && (
                        <p className="text-sm text-gray-500">{fornecedor.cidade}{fornecedor.uf ? ` - ${fornecedor.uf}` : ''}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {fornecedor.cnpj || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {fornecedor.email && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <FiMail size={14} />
                            {fornecedor.email}
                          </div>
                        )}
                        {fornecedor.telefone && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <FiPhone size={14} />
                            {fornecedor.telefone}
                          </div>
                        )}
                        {!fornecedor.email && !fornecedor.telefone && (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                        {fornecedor._count.notasFiscais}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => canManage && handleToggleAtivo(fornecedor)}
                        disabled={!canManage}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          fornecedor.ativo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {fornecedor.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    {canManage && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openModal(fornecedor)}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                          >
                            <FiEdit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(fornecedor.id)}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingId ? 'Editar Fornecedor' : 'Novo Fornecedor'}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                  <input
                    type="text"
                    value={form.cnpj}
                    onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contato</label>
                  <input
                    type="text"
                    value={form.contato}
                    onChange={(e) => setForm({ ...form, contato: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                <input
                  type="text"
                  value={form.endereco}
                  onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={form.cidade}
                    onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
                  <input
                    type="text"
                    value={form.uf}
                    onChange={(e) => setForm({ ...form, uf: e.target.value.toUpperCase() })}
                    maxLength={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
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
