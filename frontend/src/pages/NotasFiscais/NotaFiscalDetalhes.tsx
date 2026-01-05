import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  FiArrowLeft, 
  FiPackage, 
  FiCheckCircle, 
  FiAlertTriangle,
  FiTruck,
  FiFileText,
  FiEdit2
} from 'react-icons/fi'
import { api } from '../../services/api'
import { StatusBadge } from '../../components/StatusBadge'
import { useModal } from '../../contexts/ModalContext'

interface ItemNF {
  id: string
  codigoProduto: string
  descricao: string
  unidade: string
  quantidadeNota: number
  quantidadeConferida: number | null
  conferido: boolean
}

interface ConferenciaVolume {
  id: string
  volumesEsperados: number
  volumesRecebidos: number
  volumesBatendo: boolean
  dataConferencia: string
  usuario: { nome: string }
}

interface Divergencia {
  id: string
  tipo: string
  descricao: string
  resolvida: boolean
}

interface Fornecedor {
  id: string
  nome: string
  cnpj: string | null
}

interface NotaFiscalDetalhe {
  id: string
  numero: string
  numeroSecundario: string | null
  serie: string | null
  chaveAcesso: string | null
  fornecedorNome: string
  fornecedorCnpj: string | null
  fornecedor: Fornecedor | null
  fornecedorSecundario: Fornecedor | null
  dataEmissao: string | null
  dataRecebimento: string
  valorTotal: number | null
  quantidadeVolumes: number
  status: string
  tipoMovimentacao: string
  observacoes: string | null
  filialRecebimento: {
    id: string
    nome: string
    codigo: string
  } | null
  filialDestino: {
    id: string
    nome: string
    codigo: string
  }
  usuarioCadastro: {
    nome: string
  }
  itens: ItemNF[]
  conferenciasVolumes: ConferenciaVolume[]
  divergencias: Divergencia[]
}

interface FornecedorOption {
  id: string
  nome: string
  cnpj: string | null
}

interface FilialOption {
  id: string
  nome: string
  codigo: string
}

export function NotaFiscalDetalhes() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { alert } = useModal()
  const [nota, setNota] = useState<NotaFiscalDetalhe | null>(null)
  const [loading, setLoading] = useState(true)
  const [conferindoVolumes, setConferindoVolumes] = useState(false)
  const [volumesRecebidos, setVolumesRecebidos] = useState('')
  const [filialRecebimentoId, setFilialRecebimentoId] = useState('')
  const [filiaisDisponiveis, setFiliaisDisponiveis] = useState<FilialOption[]>([])
  
  // Modal de edição
  const [showEditModal, setShowEditModal] = useState(false)
  const [fornecedores, setFornecedores] = useState<FornecedorOption[]>([])
  const [editForm, setEditForm] = useState({
    numeroSecundario: '',
    fornecedorSecundarioId: '',
    observacoes: ''
  })
  const [saving, setSaving] = useState(false)
  
  // Conferência de itens inline
  const [conferindoItemId, setConferindoItemId] = useState<string | null>(null)
  const [quantidadeConferida, setQuantidadeConferida] = useState('')
  
  // Modo de conferência em lote (todos os itens)
  const [modoConferenciaLote, setModoConferenciaLote] = useState(false)
  const [quantidadesLote, setQuantidadesLote] = useState<Record<string, string>>({})
  
  // Pesquisa de itens
  const [pesquisaItem, setPesquisaItem] = useState('')

  useEffect(() => {
    loadNota()
  }, [id])

  async function loadNota() {
    try {
      const response = await api.get(`/notas-fiscais/${id}`)
      setNota(response.data)
      setVolumesRecebidos(response.data.quantidadeVolumes.toString())
    } catch (error) {
      console.error('Erro ao carregar nota fiscal:', error)
      navigate('/notas-fiscais')
    } finally {
      setLoading(false)
    }
  }

  async function handleConferirVolumes() {
    if (!volumesRecebidos) return
    
    // Se não tem filial de recebimento definida, exige seleção
    if (!nota?.filialRecebimento && !filialRecebimentoId) {
      alert('Atenção', 'Selecione a filial de recebimento', 'info')
      return
    }

    try {
      await api.post(`/notas-fiscais/${id}/conferencia-volumes`, {
        volumesRecebidos: parseInt(volumesRecebidos),
        filialRecebimentoId: filialRecebimentoId || undefined
      })
      setConferindoVolumes(false)
      setFilialRecebimentoId('')
      loadNota()
    } catch (error) {
      console.error('Erro ao conferir volumes:', error)
    }
  }

  async function iniciarConferenciaVolumes() {
    try {
      const response = await api.get('/filiais/ativas')
      setFiliaisDisponiveis(response.data)
      setFilialRecebimentoId(nota?.filialRecebimento?.id || '')
      setConferindoVolumes(true)
    } catch (error) {
      console.error('Erro ao carregar filiais:', error)
    }
  }

  async function handleConferirVolumesDestino() {
    if (!volumesRecebidos) return

    try {
      await api.post(`/notas-fiscais/${id}/conferencia-volumes`, {
        volumesRecebidos: parseInt(volumesRecebidos),
        tipo: 'DESTINO'
      })
      setConferindoVolumes(false)
      setVolumesRecebidos('')
      loadNota()
    } catch (error) {
      console.error('Erro ao conferir volumes no destino:', error)
    }
  }

  async function handleConferirItem(itemId: string) {
    if (!quantidadeConferida) return

    try {
      await api.post(`/notas-fiscais/${id}/itens/${itemId}/conferir`, {
        quantidadeConferida: parseFloat(quantidadeConferida)
      })
      setConferindoItemId(null)
      setQuantidadeConferida('')
      loadNota()
    } catch (error) {
      console.error('Erro ao conferir item:', error)
    }
  }

  function iniciarConferenciaItem(item: ItemNF) {
    setConferindoItemId(item.id)
    setQuantidadeConferida(item.quantidadeNota.toString())
  }

  function handleSelecionarTodos() {
    if (!nota) return
    // Preencher quantidades de todos os itens não conferidos com a quantidade da nota
    const quantidades: Record<string, string> = {}
    nota.itens.filter(i => !i.conferido).forEach(item => {
      quantidades[item.id] = item.quantidadeNota.toString()
    })
    setQuantidadesLote(quantidades)
    setModoConferenciaLote(true)
  }

  async function handleConfirmarTodos() {
    try {
      await api.post(`/notas-fiscais/${id}/itens/conferir-todos`, { quantidades: quantidadesLote })
      setModoConferenciaLote(false)
      setQuantidadesLote({})
      loadNota()
    } catch (error) {
      console.error('Erro ao conferir todos os itens:', error)
    }
  }

  function handleCancelarLote() {
    setModoConferenciaLote(false)
    setQuantidadesLote({})
  }

  async function openEditModal() {
    try {
      const response = await api.get('/fornecedores/ativos')
      setFornecedores(response.data)
      setEditForm({
        numeroSecundario: nota?.numeroSecundario || '',
        fornecedorSecundarioId: nota?.fornecedorSecundario?.id || '',
        observacoes: nota?.observacoes || ''
      })
      setShowEditModal(true)
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error)
    }
  }

  async function handleSaveEdit() {
    setSaving(true)
    try {
      const payload = {
        numeroSecundario: editForm.numeroSecundario || null,
        fornecedorSecundarioId: editForm.fornecedorSecundarioId || null,
        observacoes: editForm.observacoes || null
      }
      console.log('Enviando:', payload)
      const response = await api.put(`/notas-fiscais/${id}`, payload)
      console.log('Resposta:', response.data)
      setShowEditModal(false)
      loadNota()
    } catch (error: unknown) {
      console.error('Erro ao salvar:', error)
      const err = error as { response?: { data?: { error?: string } } }
      alert('Erro', err.response?.data?.error || 'Erro ao salvar', 'error')
    } finally {
      setSaving(false)
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  function formatCurrency(value: number | null) {
    if (!value) return '-'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!nota) return null

  const podeConferirVolumes = !nota.filialRecebimento
  const podeConferirVolumesDestino = nota.status === 'AGUARDANDO_CONFERENCIA_DESTINO'

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col overflow-hidden">
      <div className="flex items-center gap-4 mb-4 flex-shrink-0">
        <button
          onClick={() => navigate('/notas-fiscais')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FiArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">NF {nota.numero}</h1>
          <p className="text-gray-500 text-sm">{nota.fornecedorNome}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={openEditModal}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm transition-colors"
          >
            <FiEdit2 size={16} />
            Editar
          </button>
          <StatusBadge status={nota.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
        <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
          <div className="bg-white rounded-xl shadow-sm p-4 flex-shrink-0">
            <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FiFileText size={16} />
              Dados da Nota Fiscal
            </h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">Número</p>
                <p className="font-medium">{nota.numero}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Série</p>
                <p className="font-medium">{nota.serie || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Valor Total</p>
                <p className="font-medium">{formatCurrency(nota.valorTotal)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Data Emissão</p>
                <p className="font-medium">{formatDate(nota.dataEmissao)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Data Recebimento</p>
                <p className="font-medium">{formatDate(nota.dataRecebimento)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Cadastrado por</p>
                <p className="font-medium">{nota.usuarioCadastro.nome}</p>
              </div>
              <div className="col-span-3 md:col-span-6">
                <p className="text-xs text-gray-500">Chave de Acesso</p>
                <p className="font-mono text-xs">{nota.chaveAcesso || '-'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3 flex-shrink-0 gap-3">
              <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2 flex-shrink-0">
                <FiPackage size={16} />
                Itens ({nota.itens.length})
              </h2>
              <div className="flex-1 max-w-xs">
                <input
                  type="text"
                  placeholder="Buscar por código ou descrição..."
                  value={pesquisaItem}
                  onChange={(e) => setPesquisaItem(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
              {nota.itens.length > 0 && ['VOLUMES_CONFERIDOS', 'VOLUMES_DIVERGENTES', 'EM_CONFERENCIA', 'AGUARDANDO_CONFERENCIA', 'PENDENTE_TRANSFERENCIA'].includes(nota.status) && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  {modoConferenciaLote ? (
                    <>
                      <button
                        onClick={handleConfirmarTodos}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs transition-colors"
                      >
                        <FiCheckCircle size={14} />
                        Confirmar Todos
                      </button>
                      <button
                        onClick={handleCancelarLote}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-400 hover:bg-gray-500 text-white rounded-lg text-xs transition-colors"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleSelecionarTodos}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs transition-colors"
                    >
                      Selecionar Todos
                    </button>
                  )}
                </div>
              )}
            </div>
            {nota.itens.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhum item cadastrado</p>
            ) : (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden border border-gray-200 rounded-lg">
                <table className="w-full flex-shrink-0">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-24">Código</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-20">Qtd NF</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-28">Qtd Conf.</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase w-20">Ação</th>
                    </tr>
                  </thead>
                </table>
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full">
                    <tbody className="divide-y divide-gray-200">
                      {nota.itens
                        .filter((item) => {
                          if (!pesquisaItem.trim()) return true
                          const termo = pesquisaItem.toLowerCase()
                          return (
                            item.codigoProduto.toLowerCase().includes(termo) ||
                            item.descricao.toLowerCase().includes(termo)
                          )
                        })
                        .map((item) => {
                        const emLote = modoConferenciaLote && !item.conferido
                        const emEdicaoIndividual = conferindoItemId === item.id
                        
                        return (
                          <tr key={item.id} className={`hover:bg-gray-50 ${emEdicaoIndividual || emLote ? 'bg-blue-50' : ''}`}>
                            <td className="px-3 py-1.5 text-xs w-24">{item.codigoProduto}</td>
                            <td className="px-3 py-1.5 text-xs">{item.descricao}</td>
                            <td className="px-3 py-1.5 text-xs text-right w-20">{item.quantidadeNota} {item.unidade}</td>
                            <td className="px-3 py-1.5 text-xs text-right w-28">
                              {emEdicaoIndividual ? (
                                <input
                                  type="number"
                                  value={quantidadeConferida}
                                  onChange={(e) => setQuantidadeConferida(e.target.value)}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-right text-xs"
                                  autoFocus
                                  min="0"
                                  step="0.01"
                                />
                              ) : emLote ? (
                                <input
                                  type="number"
                                  value={quantidadesLote[item.id] || ''}
                                  onChange={(e) => setQuantidadesLote(prev => ({ ...prev, [item.id]: e.target.value }))}
                                  className="w-20 px-2 py-1 border border-blue-300 rounded text-right text-xs bg-blue-50"
                                  min="0"
                                  step="0.01"
                                />
                              ) : item.conferido ? (
                                <span className={item.quantidadeConferida !== item.quantidadeNota ? 'text-red-600 font-medium' : 'text-green-600'}>
                                  {item.quantidadeConferida} {item.unidade}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="px-3 py-1.5 text-center w-20">
                              {emEdicaoIndividual ? (
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => handleConferirItem(item.id)}
                                    className="p-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
                                    title="Confirmar"
                                  >
                                    <FiCheckCircle size={12} />
                                  </button>
                                  <button
                                    onClick={() => { setConferindoItemId(null); setQuantidadeConferida(''); }}
                                    className="p-1 bg-gray-400 hover:bg-gray-500 text-white rounded text-xs"
                                    title="Cancelar"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : emLote ? (
                                <span className="text-blue-600 text-xs">Em lote</span>
                              ) : item.conferido ? (
                                <span className="text-green-600"><FiCheckCircle size={14} /></span>
                              ) : (
                                <button
                                  onClick={() => iniciarConferenciaItem(item)}
                                  className="px-2 py-0.5 bg-primary-600 hover:bg-primary-700 text-white rounded text-xs"
                                >
                                  Conferir
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-sm p-4 flex-shrink-0">
            <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FiTruck size={16} />
              Movimentação
            </h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">Filial Recebimento</p>
                <p className="font-medium text-sm">{nota.filialRecebimento?.nome || 'A definir'}</p>
                <p className="text-xs text-gray-400">{nota.filialRecebimento?.codigo || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Filial Destino</p>
                <p className="font-medium text-sm">{nota.filialDestino.nome}</p>
                <p className="text-xs text-gray-400">{nota.filialDestino.codigo}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500">Volumes</p>
                <p className="font-medium text-xl">{nota.quantidadeVolumes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 flex-shrink-0">
            <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FiCheckCircle size={16} />
              Conferência de Volumes
            </h2>
            
            {nota.conferenciasVolumes.length > 0 ? (
              <div className="space-y-2">
                {nota.conferenciasVolumes.map((conf) => (
                  <div key={conf.id} className={`p-2 rounded-lg text-sm ${conf.volumesBatendo ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className="flex items-center justify-between">
                      <span className={conf.volumesBatendo ? 'text-green-700' : 'text-red-700'}>
                        {conf.volumesRecebidos} / {conf.volumesEsperados} volumes
                      </span>
                      <span className={`text-xs ${conf.volumesBatendo ? 'text-green-600' : 'text-red-600'}`}>
                        {conf.volumesBatendo ? 'OK' : 'Divergente'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {conf.usuario.nome} - {formatDate(conf.dataConferencia)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-xs mb-3">Nenhuma conferência realizada</p>
            )}

            {/* 1ª Conferência - Recebimento na filial */}
            {podeConferirVolumes && (
              <div className="mt-3">
                {conferindoVolumes ? (
                  <div className="space-y-2">
                    {!nota.filialRecebimento && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Filial de Recebimento *
                        </label>
                        <select
                          value={filialRecebimentoId}
                          onChange={(e) => setFilialRecebimentoId(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                        >
                          <option value="">Selecione a filial</option>
                          {filiaisDisponiveis.map(f => (
                            <option key={f.id} value={f.id}>
                              {f.nome} ({f.codigo})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Volumes Recebidos
                      </label>
                      <input
                        type="number"
                        value={volumesRecebidos}
                        onChange={(e) => setVolumesRecebidos(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                        placeholder="Quantidade de volumes"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleConferirVolumes}
                        className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg transition-colors text-sm"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => { setConferindoVolumes(false); setFilialRecebimentoId(''); }}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg transition-colors text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={iniciarConferenciaVolumes}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg transition-colors text-sm"
                  >
                    📦 Conferir Volumes
                  </button>
                )}
              </div>
            )}

            {/* 2ª Conferência - Chegada no Destino */}
            {podeConferirVolumesDestino && (
              <div className="mt-3">
                {conferindoVolumes ? (
                  <div className="space-y-2">
                    <div className="bg-indigo-50 p-2 rounded-lg">
                      <p className="text-xs text-indigo-700 font-medium">
                        📍 Conferência na filial destino: {nota.filialDestino.nome}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Volumes Recebidos
                      </label>
                      <input
                        type="number"
                        value={volumesRecebidos}
                        onChange={(e) => setVolumesRecebidos(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                        placeholder="Quantidade de volumes"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleConferirVolumesDestino()}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition-colors text-sm"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => setConferindoVolumes(false)}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg transition-colors text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConferindoVolumes(true)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition-colors text-sm"
                  >
                    📦 Conferir Volumes (Destino)
                  </button>
                )}
              </div>
            )}
          </div>

          {nota.divergencias.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-4 flex-shrink-0">
              <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FiAlertTriangle className="text-red-500" size={16} />
                Divergências ({nota.divergencias.length})
              </h2>
              <div className="space-y-2">
                {nota.divergencias.map((div) => (
                  <div key={div.id} className={`p-2 rounded-lg ${div.resolvida ? 'bg-gray-50' : 'bg-red-50'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{div.tipo}</span>
                      <span className={`text-xs ${div.resolvida ? 'text-green-600' : 'text-red-600'}`}>
                        {div.resolvida ? 'Resolvida' : 'Pendente'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{div.descricao}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Editar Nota Fiscal</h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fornecedor Principal
                </label>
                <p className="px-4 py-2 bg-gray-100 rounded-lg text-gray-600">
                  {nota.fornecedorNome}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fornecedor Secundário
                </label>
                <select
                  value={editForm.fornecedorSecundarioId}
                  onChange={(e) => setEditForm({ ...editForm, fornecedorSecundarioId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                >
                  <option value="">Nenhum</option>
                  {fornecedores.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.nome} {f.cnpj ? `(${f.cnpj})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número NF Secundário
                </label>
                <input
                  type="text"
                  value={editForm.numeroSecundario}
                  onChange={(e) => setEditForm({ ...editForm, numeroSecundario: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="Número da NF do fornecedor secundário"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={editForm.observacoes}
                  onChange={(e) => setEditForm({ ...editForm, observacoes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
