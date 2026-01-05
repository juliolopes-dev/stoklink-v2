import { useEffect, useState } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiMapPin, FiBox } from 'react-icons/fi'
import { api } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'

interface Filial {
  id: string
  nome: string
  codigo: string
  endereco: string | null
  cidade: string | null
  uf: string | null
  ehCD: boolean
  ativo: boolean
  _count?: {
    usuarios: number
    notasRecebidas: number
    notasDestino: number
  }
}

interface FilialForm {
  nome: string
  codigo: string
  endereco: string
  cidade: string
  uf: string
  ehCD: boolean
}

const initialForm: FilialForm = {
  nome: '',
  codigo: '',
  endereco: '',
  cidade: '',
  uf: '',
  ehCD: false
}

export function Filiais() {
  const { user } = useAuth()
  const isAdmin = user?.perfil === 'ADMIN'
  
  const [filiais, setFiliais] = useState<Filial[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FilialForm>(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadFiliais()
  }, [])

  async function loadFiliais() {
    setLoading(true)
    try {
      const response = await api.get('/filiais')
      setFiliais(response.data)
    } catch (error) {
      console.error('Erro ao carregar filiais:', error)
    } finally {
      setLoading(false)
    }
  }

  function openModal(filial?: Filial) {
    if (filial) {
      setEditingId(filial.id)
      setForm({
        nome: filial.nome,
        codigo: filial.codigo,
        endereco: filial.endereco || '',
        cidade: filial.cidade || '',
        uf: filial.uf || '',
        ehCD: filial.ehCD
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
        await api.put(`/filiais/${editingId}`, form)
      } else {
        await api.post('/filiais', form)
      }
      setShowModal(false)
      loadFiliais()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      setError(error.response?.data?.error || 'Erro ao salvar filial')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente excluir esta filial?')) return

    try {
      await api.delete(`/filiais/${id}`)
      loadFiliais()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      alert(error.response?.data?.error || 'Erro ao excluir filial')
    }
  }

  async function handleToggleAtivo(filial: Filial) {
    try {
      await api.put(`/filiais/${filial.id}`, { ativo: !filial.ativo })
      loadFiliais()
    } catch (error) {
      console.error('Erro ao atualizar filial:', error)
    }
  }

  const filteredFiliais = filiais.filter(f => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      f.nome.toLowerCase().includes(search) ||
      f.codigo.toLowerCase().includes(search) ||
      f.cidade?.toLowerCase().includes(search)
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Filiais</h1>
        {isAdmin && (
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <FiPlus size={20} />
            Nova Filial
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome, código ou cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
        </div>

        {filteredFiliais.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            Nenhuma filial encontrada
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Localização</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Usuários</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                  {isAdmin && (
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Ações</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredFiliais.map((filial) => (
                  <tr key={filial.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {filial.codigo}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{filial.nome}</p>
                    </td>
                    <td className="px-4 py-3">
                      {filial.cidade ? (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <FiMapPin size={14} />
                          {filial.cidade}{filial.uf ? ` - ${filial.uf}` : ''}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {filial.ehCD ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                          <FiBox size={12} />
                          CD
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          Filial
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                        {filial._count?.usuarios || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => isAdmin && handleToggleAtivo(filial)}
                        disabled={!isAdmin}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          filial.ativo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {filial.ativo ? 'Ativa' : 'Inativa'}
                      </button>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openModal(filial)}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                          >
                            <FiEdit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(filial.id)}
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
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingId ? 'Editar Filial' : 'Nova Filial'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
                  <input
                    type="text"
                    value={form.codigo}
                    onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    required
                    placeholder="Ex: CD001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                  <input
                    type="text"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    required
                    placeholder="Ex: Centro de Distribuição"
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

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="ehCD"
                  checked={form.ehCD}
                  onChange={(e) => setForm({ ...form, ehCD: e.target.checked })}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="ehCD" className="text-sm text-gray-700">
                  Esta filial é um Centro de Distribuição (CD)
                </label>
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
