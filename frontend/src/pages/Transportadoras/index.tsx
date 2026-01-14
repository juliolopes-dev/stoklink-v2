import { useEffect, useState } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiPhone, FiMail, FiTruck } from 'react-icons/fi'
import { api } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { useModal } from '../../contexts/ModalContext'

interface Transportadora {
  id: string
  nome: string
  cnpj: string | null
  telefone: string | null
  email: string | null
  ativo: boolean
}

interface TransportadoraForm {
  nome: string
  cnpj: string
  telefone: string
  email: string
}

const initialForm: TransportadoraForm = {
  nome: '',
  cnpj: '',
  telefone: '',
  email: ''
}

export function Transportadoras() {
  const { user } = useAuth()
  const { confirm, alert } = useModal()
  const canManage = user?.perfil === 'ADMIN' || user?.perfil === 'COMPRAS'
  
  const [transportadoras, setTransportadoras] = useState<Transportadora[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<TransportadoraForm>(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadTransportadoras()
  }, [])

  async function loadTransportadoras() {
    setLoading(true)
    try {
      const response = await api.get('/transportadoras')
      setTransportadoras(response.data)
    } catch (error) {
      console.error('Erro ao carregar transportadoras:', error)
    } finally {
      setLoading(false)
    }
  }

  function openModal(transportadora?: Transportadora) {
    if (transportadora) {
      setEditingId(transportadora.id)
      setForm({
        nome: transportadora.nome,
        cnpj: transportadora.cnpj || '',
        telefone: transportadora.telefone || '',
        email: transportadora.email || ''
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
        await api.put(`/transportadoras/${editingId}`, form)
      } else {
        await api.post('/transportadoras', form)
      }
      setShowModal(false)
      loadTransportadoras()
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erro ao salvar transportadora')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string, nome: string) {
    const confirmed = await confirm(
      'Excluir Transportadora',
      `Tem certeza que deseja excluir ${nome}?`
    )
    if (!confirmed) return

    try {
      await api.delete(`/transportadoras/${id}`)
      loadTransportadoras()
    } catch (error: any) {
      await alert('Erro ao excluir', error.response?.data?.error || 'Erro ao excluir transportadora')
    }
  }

  async function toggleStatus(id: string, ativo: boolean) {
    try {
      await api.put(`/transportadoras/${id}`, { ativo: !ativo })
      loadTransportadoras()
    } catch (error) {
      console.error('Erro ao alterar status:', error)
    }
  }

  const filteredTransportadoras = transportadoras.filter(t =>
    t.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.cnpj?.includes(searchTerm)
  )

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FiTruck className="text-primary-600" size={32} />
              Transportadoras
            </h1>
            <p className="text-gray-600 mt-1">Gerencie as transportadoras cadastradas</p>
          </div>
          {canManage && (
            <button
              onClick={() => openModal()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              <FiPlus size={20} />
              Nova Transportadora
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por nome ou CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Carregando...</div>
          ) : filteredTransportadoras.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchTerm ? 'Nenhuma transportadora encontrada' : 'Nenhuma transportadora cadastrada'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CNPJ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contato</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    {canManage && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTransportadoras.map(transportadora => (
                    <tr key={transportadora.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{transportadora.nome}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {transportadora.cnpj || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {transportadora.telefone && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <FiPhone size={14} />
                              {transportadora.telefone}
                            </div>
                          )}
                          {transportadora.email && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <FiMail size={14} />
                              {transportadora.email}
                            </div>
                          )}
                          {!transportadora.telefone && !transportadora.email && '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {canManage ? (
                          <button
                            onClick={() => toggleStatus(transportadora.id, transportadora.ativo)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              transportadora.ativo
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {transportadora.ativo ? 'Ativo' : 'Inativo'}
                          </button>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            transportadora.ativo
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {transportadora.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        )}
                      </td>
                      {canManage && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openModal(transportadora)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <FiEdit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(transportadora.id, transportadora.nome)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Excluir"
                            >
                              <FiTrash2 size={18} />
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
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Editar Transportadora' : 'Nova Transportadora'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={e => setForm({ ...form, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CNPJ
                </label>
                <input
                  type="text"
                  value={form.cnpj}
                  onChange={e => setForm({ ...form, cnpj: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="00.000.000/0000-00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="text"
                  value={form.telefone}
                  onChange={e => setForm({ ...form, telefone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="contato@transportadora.com"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  disabled={saving}
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
