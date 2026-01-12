import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  FiArrowLeft, 
  FiPackage, 
  FiCheckCircle, 
  FiAlertTriangle,
  FiTruck,
  FiFileText,
  FiEdit2,
  FiTrash2
} from 'react-icons/fi'
import { api } from '../../services/api'
import { StatusBadge } from '../../components/StatusBadge'
import { useModal } from '../../contexts/ModalContext'
import { useAuth } from '../../contexts/AuthContext'

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
  tipo: 'RECEBIMENTO' | 'DESTINO'
  volumesRecebidos: number
  volumesEsperados: number
  volumesBatendo: boolean
  transportadora: string | null
  observacoes: string | null
  dataConferencia: string
  usuario: { nome: string }
  filial: {
    id: string
    nome: string
    codigo: string
  } | null
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
  dataRecebimento: string | null
  valorTotal: number | null
  quantidadeVolumes: number
  status: string
  tipoMovimentacao: string
  observacoes: string | null
  mercadoriaBloqueada: boolean
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
  createdAt: string
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
  const { user } = useAuth()
  
  // Verificar se o usuário pode conferir itens (pertence à filial de destino)
  const [nota, setNota] = useState<NotaFiscalDetalhe | null>(null)
  const [loading, setLoading] = useState(true)
  const [conferindoVolumes, setConferindoVolumes] = useState(false)
  const [volumesRecebidos, setVolumesRecebidos] = useState('')
  const [filialRecebimentoId, setFilialRecebimentoId] = useState('')
  const [transportadora, setTransportadora] = useState('')
  const [filiaisDisponiveis, setFiliaisDisponiveis] = useState<FilialOption[]>([])
  const [transportadoras, setTransportadoras] = useState<Array<{ id: string; nome: string }>>([])
  
  // Modal de edição
  const [showEditModal, setShowEditModal] = useState(false)
  const [fornecedores, setFornecedores] = useState<FornecedorOption[]>([])
  const [editForm, setEditForm] = useState({
    numeroSecundario: '',
    fornecedorSecundarioId: '',
    filialRecebimentoId: '',
    filialDestinoId: '',
    transportadora: '',
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
  
  // Modal de item extra
  const [showItemExtraModal, setShowItemExtraModal] = useState(false)
  const [itemExtraForm, setItemExtraForm] = useState({
    codigoProduto: '',
    descricao: '',
    quantidade: '',
    observacoes: ''
  })
  const [savingItemExtra, setSavingItemExtra] = useState(false)

  // Verificar se usuário pode conferir itens (pertence à filial de destino)
  const podeConferirItens = nota && user ? user.filialId === nota.filialDestino.id : false

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

    // Validar transportadora obrigatória
    if (!transportadora || transportadora.trim() === '') {
      alert('Erro', 'Informe a transportadora', 'error')
      return
    }

    try {
      await api.post(`/notas-fiscais/${id}/conferencia-volumes`, {
        volumesRecebidos: parseInt(volumesRecebidos),
        filialRecebimentoId: filialRecebimentoId || undefined,
        transportadora: transportadora.trim()
      })
      setConferindoVolumes(false)
      setFilialRecebimentoId('')
      setTransportadora('')
      loadNota()
    } catch (error) {
      console.error('Erro ao conferir volumes:', error)
    }
  }

  async function iniciarConferenciaVolumes() {
    try {
      const [filiaisRes, transportadorasRes] = await Promise.all([
        api.get('/filiais/ativas'),
        api.get('/transportadoras?ativos=true')
      ])
      setFiliaisDisponiveis(filiaisRes.data)
      setTransportadoras(transportadorasRes.data)
      setFilialRecebimentoId(nota?.filialRecebimento?.id || '')
      setConferindoVolumes(true)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
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
      const [fornecedoresRes, filiaisRes] = await Promise.all([
        api.get('/fornecedores/ativos'),
        api.get('/filiais/ativas')
      ])
      setFornecedores(fornecedoresRes.data)
      setFiliaisDisponiveis(filiaisRes.data)
      
      // Buscar transportadora da primeira conferência (recebimento)
      const primeiraConferencia = nota?.conferenciasVolumes?.[0]
      const transportadoraAtual = primeiraConferencia?.transportadora || ''
      
      setEditForm({
        numeroSecundario: nota?.numeroSecundario || '',
        fornecedorSecundarioId: nota?.fornecedorSecundario?.id || '',
        filialRecebimentoId: nota?.filialRecebimento?.id || '',
        filialDestinoId: nota?.filialDestino?.id || '',
        transportadora: transportadoraAtual,
        observacoes: nota?.observacoes || ''
      })
      setShowEditModal(true)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  async function handleSaveEdit() {
    setSaving(true)
    try {
      const payload = {
        numeroSecundario: editForm.numeroSecundario || null,
        fornecedorSecundarioId: editForm.fornecedorSecundarioId || null,
        filialRecebimentoId: editForm.filialRecebimentoId || null,
        filialDestinoId: editForm.filialDestinoId || null,
        transportadora: editForm.transportadora || null,
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

  async function toggleBloqueioMercadoria(bloqueada: boolean) {
    try {
      await api.patch(`/notas-fiscais/${id}/mercadoria-bloqueada`, { bloqueada })
      loadNota()
    } catch (error: unknown) {
      console.error('Erro ao alterar bloqueio:', error)
      const err = error as { response?: { data?: { error?: string } } }
      alert('Erro', err.response?.data?.error || 'Erro ao alterar bloqueio da mercadoria', 'error')
    }
  }

  async function handleDelete() {
    if (!window.confirm('Tem certeza que deseja excluir esta Nota Fiscal? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      await api.delete(`/notas-fiscais/${id}`)
      navigate('/notas-fiscais')
    } catch (error: unknown) {
      console.error('Erro ao excluir NF:', error)
      const err = error as { response?: { data?: { error?: string } } }
      alert('Erro', err.response?.data?.error || 'Erro ao excluir nota fiscal', 'error')
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
  
  // Verificar se usuário pertence à filial de destino para conferir volumes no destino
  const usuarioPodeConferirDestino = user?.filialId === nota.filialDestino.id

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col overflow-hidden p-6">
      <div className="flex items-center gap-4 mb-3 flex-shrink-0">
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
          {(user?.perfil === 'ADMIN' || user?.perfil === 'COMPRAS') && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
              title="Excluir Nota Fiscal"
            >
              <FiTrash2 size={16} />
              Excluir
            </button>
          )}
          <button
            onClick={openEditModal}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm transition-colors"
          >
            <FiEdit2 size={16} />
            Editar
          </button>
          <button
            onClick={() => toggleBloqueioMercadoria(!nota.mercadoriaBloqueada)}
            disabled={nota.mercadoriaBloqueada && nota.status !== 'CONFERIDO_OK' && nota.status !== 'CONFERIDO_DIVERGENCIA'}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              nota.mercadoriaBloqueada && nota.status !== 'CONFERIDO_OK' && nota.status !== 'CONFERIDO_DIVERGENCIA'
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : nota.mercadoriaBloqueada
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            title={nota.mercadoriaBloqueada && nota.status !== 'CONFERIDO_OK' && nota.status !== 'CONFERIDO_DIVERGENCIA' ? 'A mercadoria só pode ser desbloqueada após a conclusão de todo o fluxo de conferência' : ''}
          >
            {nota.mercadoriaBloqueada ? 'Liberar Mercadoria' : 'Bloquear Mercadoria'}
          </button>
          <StatusBadge 
            status={nota.status} 
            filialRecebimento={nota.filialRecebimento?.nome}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 flex-1 min-h-0 overflow-hidden">
        <div className="lg:col-span-2 flex flex-col gap-3 min-h-0 overflow-hidden">
          <div className="bg-white rounded-xl shadow-sm p-3 flex-shrink-0">
            <h2 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <FiFileText size={16} />
              Dados da Nota Fiscal
            </h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-sm">
              <div>
                <p className="text-xs text-gray-500">Número</p>
                <p className="font-medium text-sm">{nota.numero}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Série</p>
                <p className="font-medium text-sm">{nota.serie || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Valor Total</p>
                <p className="font-medium text-sm">{formatCurrency(nota.valorTotal)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Data Emissão</p>
                <p className="font-medium text-sm">{formatDate(nota.dataEmissao)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Data Recebimento</p>
                <p className="font-medium text-sm">{nota.dataRecebimento ? formatDate(nota.dataRecebimento) : 'Aguardando recebimento'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Cadastrado por</p>
                <p className="font-medium text-sm">{nota.usuarioCadastro.nome}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Data Cadastro</p>
                <p className="font-medium text-sm">{formatDate(nota.createdAt)}</p>
              </div>
              <div className="col-span-3 md:col-span-6">
                <p className="text-xs text-gray-500">Chave de Acesso</p>
                <p className="font-mono text-xs break-all">{nota.chaveAcesso || '-'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-3 flex-1 flex flex-col min-h-0 overflow-hidden">
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
                  <button
                    onClick={() => setShowItemExtraModal(true)}
                    disabled={!podeConferirItens}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      podeConferirItens 
                        ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    title={!podeConferirItens ? 'Apenas usuários da filial de destino podem adicionar itens extras' : 'Registrar item que chegou mas não está na NF'}
                  >
                    <FiAlertTriangle size={14} />
                    Item Extra
                  </button>
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
                      disabled={!podeConferirItens}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                        podeConferirItens 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      title={!podeConferirItens ? 'Apenas usuários da filial de destino podem conferir itens' : ''}
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
                                  disabled={!podeConferirItens}
                                  className={`px-2 py-0.5 rounded text-xs ${
                                    podeConferirItens 
                                      ? 'bg-primary-600 hover:bg-primary-700 text-white' 
                                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  }`}
                                  title={!podeConferirItens ? 'Apenas usuários da filial de destino podem conferir itens' : ''}
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

        <div className="flex flex-col gap-3 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-sm p-3 flex-shrink-0">
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
              {nota.observacoes && (
                <div className="col-span-2 mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Observações da NF</p>
                  <p className="text-sm text-gray-700 italic">{nota.observacoes}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 flex-shrink-0">
            <h2 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <FiCheckCircle size={16} />
              Conferência de Volumes
            </h2>
            
            {nota.conferenciasVolumes.length > 0 ? (
              <div className="space-y-3">
                {nota.conferenciasVolumes.map((conf) => (
                  <div key={conf.id} className={`p-3 rounded-lg border-l-4 text-sm ${
                    conf.volumesBatendo 
                      ? 'bg-green-50 border-green-500' 
                      : 'bg-red-50 border-red-500'
                  }`}>
                    {/* Cabeçalho com tipo e status */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-700 bg-white px-2 py-1 rounded">
                          {conf.tipo === 'RECEBIMENTO' ? '📦 Recebimento' : '🎯 Destino'}
                        </span>
                        <span className={`text-xs font-medium ${conf.volumesBatendo ? 'text-green-700' : 'text-red-700'}`}>
                          {conf.volumesBatendo ? '✓ OK' : '⚠ Divergente'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Volumes */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-medium ${conf.volumesBatendo ? 'text-green-700' : 'text-red-700'}`}>
                        {conf.volumesRecebidos} / {conf.volumesEsperados} volumes
                      </span>
                    </div>
                    
                    {/* Filial */}
                    {conf.filial && (
                      <p className="text-xs text-gray-700 mb-1">
                        📍 {conf.filial.nome} ({conf.filial.codigo})
                      </p>
                    )}
                    
                    {/* Transportadora */}
                    {conf.transportadora && (
                      <p className="text-xs text-blue-600 mb-1 flex items-center gap-1">
                        <FiTruck size={12} /> {conf.transportadora}
                      </p>
                    )}
                    
                    {/* Observações */}
                    {conf.observacoes && (
                      <p className="text-xs text-gray-600 mb-1 italic">
                        💬 {conf.observacoes}
                      </p>
                    )}
                    
                    {/* Usuário e data */}
                    <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
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
                        Transportadora *
                      </label>
                      <select
                        value={transportadora}
                        onChange={(e) => setTransportadora(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                        required
                      >
                        <option value="">Selecione a transportadora</option>
                        {transportadoras.map((t) => (
                          <option key={t.id} value={t.nome}>{t.nome}</option>
                        ))}
                      </select>
                    </div>
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
                        onClick={() => { setConferindoVolumes(false); setFilialRecebimentoId(''); setTransportadora(''); }}
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
                    disabled={!usuarioPodeConferirDestino}
                    className={`w-full py-2 rounded-lg transition-colors text-sm ${
                      usuarioPodeConferirDestino
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    title={!usuarioPodeConferirDestino ? 'Apenas usuários da filial de destino podem conferir volumes no destino' : ''}
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
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Editar Nota Fiscal</h2>
            </div>

            <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Fornecedor Principal
                </label>
                <p className="px-3 py-1.5 bg-gray-100 rounded-lg text-gray-600 text-sm">
                  {nota.fornecedorNome}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Fornecedor Secundário
                </label>
                <select
                  value={editForm.fornecedorSecundarioId}
                  onChange={(e) => setEditForm({ ...editForm, fornecedorSecundarioId: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
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
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Número NF Secundário
                </label>
                <input
                  type="text"
                  value={editForm.numeroSecundario}
                  onChange={(e) => setEditForm({ ...editForm, numeroSecundario: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="Número da NF do fornecedor secundário"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Filial de Recebimento
                </label>
                <select
                  value={editForm.filialRecebimentoId}
                  onChange={(e) => setEditForm({ ...editForm, filialRecebimentoId: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                >
                  <option value="">Nenhuma</option>
                  {filiaisDisponiveis.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.nome} ({f.codigo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Filial de Destino
                </label>
                <select
                  value={editForm.filialDestinoId}
                  onChange={(e) => setEditForm({ ...editForm, filialDestinoId: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                >
                  <option value="">Selecione a filial</option>
                  {filiaisDisponiveis.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.nome} ({f.codigo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Transportadora
                </label>
                <input
                  type="text"
                  value={editForm.transportadora}
                  onChange={(e) => setEditForm({ ...editForm, transportadora: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="Nome da transportadora"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={editForm.observacoes}
                  onChange={(e) => setEditForm({ ...editForm, observacoes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
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

      {/* Modal: Adicionar Item Extra */}
      {showItemExtraModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FiAlertTriangle className="text-orange-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Registrar Item Extra</h3>
                  <p className="text-sm text-gray-500">Item recebido mas não listado na NF</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código do Produto *
                  </label>
                  <input
                    type="text"
                    value={itemExtraForm.codigoProduto}
                    onChange={(e) => setItemExtraForm({ ...itemExtraForm, codigoProduto: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    placeholder="Ex: PROD123"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição do Produto *
                  </label>
                  <input
                    type="text"
                    value={itemExtraForm.descricao}
                    onChange={(e) => setItemExtraForm({ ...itemExtraForm, descricao: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    placeholder="Ex: Cadeira de escritório"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantidade Recebida *
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={itemExtraForm.quantidade}
                    onChange={(e) => setItemExtraForm({ ...itemExtraForm, quantidade: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    placeholder="Ex: 5"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações
                  </label>
                  <textarea
                    value={itemExtraForm.observacoes}
                    onChange={(e) => setItemExtraForm({ ...itemExtraForm, observacoes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    placeholder="Informações adicionais sobre o item extra..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowItemExtraModal(false)
                    setItemExtraForm({ codigoProduto: '', descricao: '', quantidade: '', observacoes: '' })
                  }}
                  disabled={savingItemExtra}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    if (!itemExtraForm.codigoProduto.trim() || !itemExtraForm.descricao.trim() || !itemExtraForm.quantidade) {
                      alert('Atenção', 'Preencha todos os campos obrigatórios')
                      return
                    }

                    setSavingItemExtra(true)
                    try {
                      await api.post('/divergencias', {
                        notaFiscalId: nota.id,
                        tipo: 'ITEM_EXTRA',
                        descricao: `Item Extra: ${itemExtraForm.codigoProduto} - ${itemExtraForm.descricao}${itemExtraForm.observacoes ? ` | Obs: ${itemExtraForm.observacoes}` : ''}`,
                        quantidadeEsperada: 0,
                        quantidadeRecebida: parseFloat(itemExtraForm.quantidade)
                      })

                      alert('Sucesso', 'Item extra registrado como divergência com sucesso!')
                      setShowItemExtraModal(false)
                      setItemExtraForm({ codigoProduto: '', descricao: '', quantidade: '', observacoes: '' })
                      loadNota()
                    } catch (error) {
                      console.error('Erro ao registrar item extra:', error)
                      alert('Erro', 'Erro ao registrar item extra. Tente novamente.')
                    } finally {
                      setSavingItemExtra(false)
                    }
                  }}
                  disabled={savingItemExtra}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {savingItemExtra ? 'Registrando...' : 'Registrar Divergência'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
