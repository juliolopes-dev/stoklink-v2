import { useEffect, useState } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiPhone, FiMail } from 'react-icons/fi'
import { api } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { useModal } from '../../contexts/ModalContext'
import { StatusBadge } from '../../components/StatusBadge'

interface Fornecedor {
  id: string
  nome: string
  codigo: string | null
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
    notasFiscaisSecundario: number
  }
}

interface FornecedorForm {
  nome: string
  codigo: string
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
  codigo: '',
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
  const [showNfsModal, setShowNfsModal] = useState(false)
  const [selectedFornecedor, setSelectedFornecedor] = useState<Fornecedor | null>(null)
  const [nfsList, setNfsList] = useState<any[]>([])
  const [loadingNfs, setLoadingNfs] = useState(false)

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
        codigo: fornecedor.codigo || '',
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

  async function handleShowNfs(fornecedor: Fornecedor) {
    const totalNfs = fornecedor._count.notasFiscais + fornecedor._count.notasFiscaisSecundario
    if (totalNfs === 0) return

    setSelectedFornecedor(fornecedor)
    setShowNfsModal(true)
    setLoadingNfs(true)

    try {
      const response = await api.get(`/fornecedores/${fornecedor.id}`)
      const codigoFornecedor = response.data.codigo || ''
      const ultimosDigitos = codigoFornecedor.slice(-2) // Pega os 2 últimos dígitos do código
      
      const nfsPrincipais = (response.data.notasFiscais || []).map((nf: any) => {
        // Se tem numeroSecundario, usa ele. Senão, usa o numero original
        const numeroParaReserva = nf.numeroSecundario || nf.numero
        const codigoReserva = ultimosDigitos + numeroParaReserva
        return { ...nf, isSecundaria: false, codigoReserva }
      })
      
      const nfsSecundarias = (response.data.notasFiscaisSecundario || []).map((nf: any) => {
        // Se tem numeroSecundario, usa ele. Senão, usa o numero original
        const numeroParaReserva = nf.numeroSecundario || nf.numero
        const codigoReserva = ultimosDigitos + numeroParaReserva
        return { ...nf, isSecundaria: true, codigoReserva }
      })
      
      // Combinar as duas listas e ordenar por data
      const todasNfs = [...nfsPrincipais, ...nfsSecundarias].sort((a, b) => {
        const dateA = a.dataRecebimento ? new Date(a.dataRecebimento).getTime() : 0
        const dateB = b.dataRecebimento ? new Date(b.dataRecebimento).getTime() : 0
        return dateB - dateA // Mais recente primeiro
      })
      
      setNfsList(todasNfs)
    } catch (error) {
      console.error('Erro ao carregar NFs:', error)
      setNfsList([])
    } finally {
      setLoadingNfs(false)
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-[30%]">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-[8%]">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-[12%]">CNPJ</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-[20%]">Contato</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase w-[8%]">NFs</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase w-[10%]">Status</th>
                  {canManage && (
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase w-[12%]">Ações</th>
                  )}
                </tr>
              </thead>
            </table>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full border-collapse">
                <tbody>
                  {filteredFornecedores.map((fornecedor) => (
                  <tr key={fornecedor.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 w-[30%]">
                      <p className="font-medium text-gray-900">{fornecedor.nome}</p>
                      {fornecedor.cidade && (
                        <p className="text-sm text-gray-500">{fornecedor.cidade}{fornecedor.uf ? ` - ${fornecedor.uf}` : ''}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 w-[8%]">
                      {fornecedor.codigo || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 w-[12%]">
                      {fornecedor.cnpj || '-'}
                    </td>
                    <td className="px-4 py-3 w-[20%]">
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
                    <td className="px-4 py-3 text-center w-[8%]">
                      <button
                        onClick={() => handleShowNfs(fornecedor)}
                        disabled={fornecedor._count.notasFiscais + fornecedor._count.notasFiscaisSecundario === 0}
                        className={`px-2 py-1 rounded text-sm transition-colors ${
                          fornecedor._count.notasFiscais + fornecedor._count.notasFiscaisSecundario > 0
                            ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer'
                            : 'bg-gray-100 text-gray-600 cursor-default'
                        }`}
                      >
                        {fornecedor._count.notasFiscais + fornecedor._count.notasFiscaisSecundario}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center w-[10%]">
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
                      <td className="px-4 py-3 text-right w-[12%]">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                  <input
                    type="text"
                    value={form.codigo}
                    onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    placeholder="Ex: 000001"
                  />
                </div>
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

      {showNfsModal && selectedFornecedor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-800">
                Notas Fiscais - {selectedFornecedor.nome}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Total: {selectedFornecedor._count.notasFiscais + selectedFornecedor._count.notasFiscaisSecundario} nota(s)
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingNfs ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : nfsList.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  Nenhuma nota fiscal encontrada
                </div>
              ) : (
                <div className="space-y-3">
                  {nfsList.map((nf) => (
                    <div
                      key={nf.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">NF {nf.numero}</p>
                          {nf.isSecundaria && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                              Secundária
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          {nf.dataRecebimento && (
                            <p className="text-sm text-gray-500">
                              Recebida em: {new Date(nf.dataRecebimento).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                          {nf.codigoReserva && (
                            <p className="text-sm font-medium text-blue-600">
                              Cód. Reserva: {nf.codigoReserva}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {nf.valorTotal && (
                          <span className="text-sm font-medium text-gray-700">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(nf.valorTotal)}
                          </span>
                        )}
                        <StatusBadge status={nf.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={() => setShowNfsModal(false)}
                className="w-full px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
