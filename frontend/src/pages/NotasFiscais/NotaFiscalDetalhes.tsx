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
  FiTrash2,
  FiDownload
} from 'react-icons/fi'
import { api } from '../../services/api'
import { StatusBadge } from '../../components/StatusBadge'
import { Loading } from '../../components/Loading'
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

interface ItemNFSecundaria {
  id: string
  codigo: string
  descricao: string
  quantidade: number
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
  danfSecundario: string | null
  auditoriaRealizada: boolean
  dataAuditoria: string | null
  auditoriaMurillo: boolean
  dataAuditoriaMurillo: string | null
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
  itensSecundarios: ItemNFSecundaria[]
  txtSecundario: string | null
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

  // Estados de loading para ações
  const [loadingConferencia, setLoadingConferencia] = useState(false)
  const [loadingItem, setLoadingItem] = useState(false)
  const [loadingAuditoria, setLoadingAuditoria] = useState(false)
  const [loadingBloqueio, setLoadingBloqueio] = useState(false)
  const [loadingDelete, setLoadingDelete] = useState(false)

  // Modal de edição
  const [showEditModal, setShowEditModal] = useState(false)
  const [fornecedores, setFornecedores] = useState<FornecedorOption[]>([])
  const [editForm, setEditForm] = useState({
    numeroSecundario: '',
    fornecedorSecundarioId: '',
    filialRecebimentoId: '',
    filialDestinoId: '',
    tipoMovimentacao: '',
    transportadora: '',
    quantidadeVolumes: '',
    observacoes: ''
  })
  const [saving, setSaving] = useState(false)
  const [transportadoraSearch, setTransportadoraSearch] = useState('')
  const [showTransportadoraDropdown, setShowTransportadoraDropdown] = useState(false)

  // Upload de DANF secundário
  const [uploadingDanf, setUploadingDanf] = useState(false)
  const [danfFile, setDanfFile] = useState<File | null>(null)

  // Buscar itens secundários do BD-BEZERRA
  const [loadingBuscarItens, setLoadingBuscarItens] = useState(false)
  const [showFilialModal, setShowFilialModal] = useState(false)
  const [filialSelecionada, setFilialSelecionada] = useState('')

  // Separação Finalizada (Distribuição Imediata)
  const [loadingSeparacao, setLoadingSeparacao] = useState(false)
  const [showConfirmSeparacao, setShowConfirmSeparacao] = useState(false)

  // Auditoria Murillo
  const [loadingAuditoriaMurillo, setLoadingAuditoriaMurillo] = useState(false)

  // Opções de filiais do BD-BEZERRA
  const filiaisBezerra = [
    { codigo: '00', nome: 'Petrolina' },
    { codigo: '01', nome: 'Juazeiro' },
    { codigo: '02', nome: 'Salgueiro' },
    { codigo: '04', nome: 'Filial 04' },
    { codigo: '05', nome: 'Bonfim' },
    { codigo: '06', nome: 'Picos' }
  ]

  // Conferência de itens inline
  const [conferindoItemId, setConferindoItemId] = useState<string | null>(null)
  const [quantidadeConferida, setQuantidadeConferida] = useState('')

  // Modo de conferência em lote (todos os itens)
  const [modoConferenciaLote, setModoConferenciaLote] = useState(false)
  const [quantidadesLote, setQuantidadesLote] = useState<Record<string, string>>({})

  // Pesquisa de itens
  const [pesquisaItem, setPesquisaItem] = useState('')

  // Toggle para alternar entre itens originais e secundários
  const [mostrarItensSecundarios, setMostrarItensSecundarios] = useState(false)

  // Conferência de itens secundários
  const [conferindoItemSecundarioId, setConferindoItemSecundarioId] = useState<string | null>(null)
  const [quantidadeConferidaSecundario, setQuantidadeConferidaSecundario] = useState('')
  const [modoConferenciaLoteSecundario, setModoConferenciaLoteSecundario] = useState(false)
  const [quantidadesLoteSecundario, setQuantidadesLoteSecundario] = useState<Record<string, string>>({})

  // Modal de item extra
  const [showItemExtraModal, setShowItemExtraModal] = useState(false)
  const [itemExtraForm, setItemExtraForm] = useState({
    codigoProduto: '',
    descricao: '',
    quantidade: '',
    observacoes: ''
  })
  const [savingItemExtra, setSavingItemExtra] = useState(false)

  // Verificar se usuário pode conferir itens (pertence à filial de destino ou é ADMIN)
  const podeConferirItens = nota && user ? (user.perfil === 'ADMIN' || user.filialId === nota.filialDestino.id) : false

  // Verificar se usuário pode liberar mercadoria (ADMIN ou COMPRAS)
  const podeLiberarMercadoria = user ? (user.perfil === 'ADMIN' || user.perfil === 'COMPRAS') : false

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

    setLoadingConferencia(true)
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
    } finally {
      setLoadingConferencia(false)
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

    setLoadingConferencia(true)
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
    } finally {
      setLoadingConferencia(false)
    }
  }

  async function handleConferirItem(itemId: string) {
    if (!quantidadeConferida) return

    setLoadingItem(true)
    try {
      await api.post(`/notas-fiscais/${id}/itens/${itemId}/conferir`, {
        quantidadeConferida: parseFloat(quantidadeConferida)
      })
      setConferindoItemId(null)
      setQuantidadeConferida('')
      loadNota()
    } catch (error) {
      console.error('Erro ao conferir item:', error)
    } finally {
      setLoadingItem(false)
    }
  }

  function iniciarConferenciaItem(item: ItemNF) {
    setConferindoItemId(item.id)
    setQuantidadeConferida(item.quantidadeNota.toString())
  }

  function handleSelecionarTodos() {
    if (!nota) return
    const quantidades: Record<string, string> = {}
    // ADMIN pode reconferir todos os itens (inclusive já conferidos)
    const itensParaConferir = user?.perfil === 'ADMIN'
      ? nota.itens
      : nota.itens.filter(i => !i.conferido)
    itensParaConferir.forEach(item => {
      quantidades[item.id] = item.quantidadeNota.toString()
    })
    setQuantidadesLote(quantidades)
    setModoConferenciaLote(true)
  }

  async function handleConfirmarTodos() {
    setLoadingItem(true)
    try {
      await api.post(`/notas-fiscais/${id}/itens/conferir-todos`, { quantidades: quantidadesLote })
      setModoConferenciaLote(false)
      setQuantidadesLote({})
      loadNota()
    } catch (error) {
      console.error('Erro ao conferir todos os itens:', error)
    } finally {
      setLoadingItem(false)
    }
  }

  function handleCancelarLote() {
    setModoConferenciaLote(false)
    setQuantidadesLote({})
  }

  // ==================== CONFERÊNCIA DE ITENS SECUNDÁRIOS ====================

  function iniciarConferenciaItemSecundario(item: ItemNFSecundaria) {
    setConferindoItemSecundarioId(item.id)
    setQuantidadeConferidaSecundario(Number(item.quantidade).toString())
  }

  async function handleConferirItemSecundario(itemId: string) {
    setLoadingItem(true)
    try {
      await api.post(`/notas-fiscais/${id}/conferir-item-secundario/${itemId}`, {
        quantidadeConferida: parseFloat(quantidadeConferidaSecundario)
      })
      setConferindoItemSecundarioId(null)
      setQuantidadeConferidaSecundario('')
      loadNota()
    } catch (error) {
      console.error('Erro ao conferir item secundário:', error)
    } finally {
      setLoadingItem(false)
    }
  }

  function handleSelecionarTodosSecundarios() {
    if (!nota || !nota.itensSecundarios) return
    const quantidades: Record<string, string> = {}
    nota.itensSecundarios.filter(i => !i.conferido).forEach(item => {
      quantidades[item.id] = Number(item.quantidade).toString()
    })
    setQuantidadesLoteSecundario(quantidades)
    setModoConferenciaLoteSecundario(true)
  }

  async function handleConfirmarTodosSecundarios() {
    setLoadingItem(true)
    try {
      const itensConferidos = Object.entries(quantidadesLoteSecundario).map(([itemId, qtd]) => ({
        itemId,
        quantidadeConferida: parseFloat(qtd)
      }))
      await api.post(`/notas-fiscais/${id}/conferir-todos-itens-secundarios`, { itensConferidos })
      setModoConferenciaLoteSecundario(false)
      setQuantidadesLoteSecundario({})
      loadNota()
    } catch (error) {
      console.error('Erro ao conferir todos os itens secundários:', error)
    } finally {
      setLoadingItem(false)
    }
  }

  function handleCancelarLoteSecundario() {
    setModoConferenciaLoteSecundario(false)
    setQuantidadesLoteSecundario({})
  }

  async function abrirModalEdicao() {
    try {
      const [fornecedoresRes, filiaisRes, transportadorasRes] = await Promise.all([
        api.get('/fornecedores/ativos'),
        api.get('/filiais/ativas'),
        api.get('/transportadoras?ativos=true')
      ])
      setFornecedores(fornecedoresRes.data)
      setFiliaisDisponiveis(filiaisRes.data)
      setTransportadoras(transportadorasRes.data)

      // Buscar transportadora da primeira conferência (recebimento)
      const primeiraConferencia = nota?.conferenciasVolumes?.[0]
      const transportadoraAtual = primeiraConferencia?.transportadora || ''

      setEditForm({
        numeroSecundario: nota?.numeroSecundario || '',
        fornecedorSecundarioId: nota?.fornecedorSecundario?.id || '',
        filialRecebimentoId: nota?.filialRecebimento?.id || '',
        filialDestinoId: nota?.filialDestino?.id || '',
        tipoMovimentacao: nota?.tipoMovimentacao || '',
        transportadora: transportadoraAtual,
        quantidadeVolumes: nota?.quantidadeVolumes.toString() || '',
        observacoes: nota?.observacoes || ''
      })
      setTransportadoraSearch(transportadoraAtual)
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
        tipoMovimentacao: editForm.tipoMovimentacao || null,
        transportadora: editForm.transportadora || null,
        quantidadeVolumes: editForm.quantidadeVolumes ? parseInt(editForm.quantidadeVolumes) : null,
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

  async function handleUploadDanf() {
    if (!danfFile) return

    setUploadingDanf(true)
    try {
      const formData = new FormData()
      formData.append('file', danfFile)

      await api.post(`/notas-fiscais/${id}/upload-danf-secundario`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      setDanfFile(null)
      loadNota()
      alert('Sucesso', 'DANF secundário enviado com sucesso', 'success')
    } catch (error) {
      console.error('Erro ao fazer upload do DANF:', error)
      const err = error as { response?: { data?: { error?: string } } }
      alert('Erro', err.response?.data?.error || 'Erro ao fazer upload do DANF', 'error')
    } finally {
      setUploadingDanf(false)
    }
  }

  async function handleDeleteDanf() {
    if (!window.confirm('Tem certeza que deseja remover o DANF secundário?')) {
      return
    }

    try {
      await api.delete(`/notas-fiscais/${id}/danf-secundario`)
      loadNota()
      alert('Sucesso', 'DANF secundário removido com sucesso', 'success')
    } catch (error) {
      console.error('Erro ao deletar DANF:', error)
      alert('Erro', 'Erro ao remover DANF secundário', 'error')
    }
  }

  function handleViewDanf() {
    if (nota?.danfSecundario) {
      const url = `${import.meta.env.VITE_API_URL}/${nota.danfSecundario}`
      window.open(url, '_blank')
    }
  }

  function handleAbrirModalFilial() {
    if (!nota?.numeroSecundario) {
      alert('Erro', 'Esta NF não possui número secundário cadastrado', 'error')
      return
    }
    setFilialSelecionada('')
    setShowFilialModal(true)
  }

  async function handleBuscarItensSecundarios() {
    if (!filialSelecionada) {
      alert('Erro', 'Selecione uma filial', 'error')
      return
    }

    setShowFilialModal(false)
    setLoadingBuscarItens(true)
    try {
      const response = await api.post(`/notas-fiscais/${id}/buscar-itens-secundarios`, {
        codFilial: filialSelecionada
      })
      alert('Sucesso', response.data.message, 'success')
      loadNota()
    } catch (error) {
      console.error('Erro ao buscar itens secundários:', error)
      const err = error as { response?: { data?: { error?: string } } }
      alert('Erro', err.response?.data?.error || 'Erro ao buscar itens secundários', 'error')
    } finally {
      setLoadingBuscarItens(false)
    }
  }

  async function toggleBloqueioMercadoria(bloqueada: boolean) {
    setLoadingBloqueio(true)
    try {
      await api.patch(`/notas-fiscais/${id}/mercadoria-bloqueada`, { bloqueada })
      loadNota()
    } catch (error) {
      console.error('Erro ao alterar bloqueio:', error)
      const err = error as { response?: { data?: { error?: string } } }
      const message = err.response?.data?.error || 'Erro ao alterar bloqueio da mercadoria'
      alert('Erro', message, 'error')
    } finally {
      setLoadingBloqueio(false)
    }
  }

  async function handleConfirmarSeparacao() {
    setShowConfirmSeparacao(false)
    setLoadingSeparacao(true)
    try {
      await api.patch(`/notas-fiscais/${id}/separacao-finalizada`)
      alert('Sucesso', 'Separação marcada como finalizada!', 'success')
      setShowEditModal(false)
      loadNota()
    } catch (error) {
      console.error('Erro ao finalizar separação:', error)
      const err = error as { response?: { data?: { error?: string } } }
      alert('Erro', err.response?.data?.error || 'Erro ao finalizar separação', 'error')
    } finally {
      setLoadingSeparacao(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Tem certeza que deseja excluir esta Nota Fiscal? Esta ação não pode ser desfeita.')) {
      return
    }

    setLoadingDelete(true)
    try {
      await api.delete(`/notas-fiscais/${id}`)
      navigate('/notas-fiscais')
    } catch (error) {
      console.error('Erro ao excluir nota fiscal:', error)
      alert('Erro', 'Erro ao excluir nota fiscal', 'error')
    } finally {
      setLoadingDelete(false)
    }
  }

  async function handleConfirmarAuditoria() {
    if (!window.confirm('Confirmar que a auditoria desta nota fiscal foi realizada?')) {
      return
    }

    setLoadingAuditoria(true)
    try {
      await api.patch(`/notas-fiscais/${id}/auditoria`)
      alert('Sucesso', 'Auditoria confirmada com sucesso!', 'success')
      loadNota()
    } catch (error) {
      console.error('Erro ao confirmar auditoria:', error)
      const err = error as { response?: { data?: { error?: string } } }
      alert('Erro', err.response?.data?.error || 'Erro ao confirmar auditoria', 'error')
    } finally {
      setLoadingAuditoria(false)
    }
  }

  async function handleConfirmarAuditoriaMurillo() {
    if (!window.confirm('Confirmar que a Auditoria Murillo desta nota fiscal foi realizada?')) {
      return
    }

    setLoadingAuditoriaMurillo(true)
    try {
      await api.patch(`/notas-fiscais/${id}/auditoria-murillo`)
      alert('Sucesso', 'Auditoria Murillo confirmada com sucesso!', 'success')
      loadNota()
    } catch (error) {
      console.error('Erro ao confirmar auditoria Murillo:', error)
      const err = error as { response?: { data?: { error?: string } } }
      alert('Erro', err.response?.data?.error || 'Erro ao confirmar auditoria Murillo', 'error')
    } finally {
      setLoadingAuditoriaMurillo(false)
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
    return <Loading size="lg" text="Carregando nota fiscal..." fullScreen />
  }

  if (!nota) return null

  // Pode conferir volumes se está em trânsito (PENDENTE_TRANSFERENCIA) e ainda não tem filial de recebimento
  const podeConferirVolumes = nota.status === 'PENDENTE_TRANSFERENCIA' && !nota.filialRecebimento
  const podeConferirVolumesDestino = nota.status === 'AGUARDANDO_CONFERENCIA_DESTINO'

  // Verificar se usuário pertence à filial de destino para conferir volumes no destino
  const usuarioPodeConferirDestino = user?.filialId === nota.filialDestino.id

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col overflow-hidden p-6">
      <div className="flex items-center gap-4 mb-3 flex-shrink-0">
        <button
          onClick={() => navigate('/notas-fiscais')}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          <FiArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-gray-800">
            NF {nota.numero}
            {nota.numeroSecundario && (
              <span className="text-purple-600"> / {nota.numeroSecundario}</span>
            )}
          </h1>
          <p className="text-gray-500 text-xs">
            {nota.fornecedorNome}
            {nota.fornecedorSecundario && (
              <span className="text-purple-600"> / {nota.fornecedorSecundario.nome}</span>
            )}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* Botões primários */}
          <div className="flex items-center gap-2">
            {nota.danfSecundario && (
              <button
                onClick={handleViewDanf}
                className="h-8 flex items-center gap-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-medium transition-colors shadow-sm"
                title="Visualizar DANF Secundário"
              >
                <FiFileText size={14} />
                DANF Secundário
              </button>
            )}
            <button
              onClick={abrirModalEdicao}
              className="h-8 flex items-center gap-1.5 px-3 border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 rounded text-xs font-medium transition-colors"
            >
              <FiEdit2 size={14} />
              Editar
            </button>
            {!nota.auditoriaRealizada && (user?.perfil === 'ADMIN' || user?.perfil === 'COMPRAS') && (
              <button
                onClick={handleConfirmarAuditoria}
                disabled={loadingAuditoria}
                className="h-8 flex items-center gap-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
                title="Confirmar que a auditoria foi realizada"
              >
                <FiCheckCircle size={14} />
                {loadingAuditoria ? 'Confirmando...' : 'Confirmar Auditoria'}
              </button>
            )}
            {!nota.auditoriaMurillo && user?.nome?.toLowerCase().includes('murillo') && (
              <button
                onClick={handleConfirmarAuditoriaMurillo}
                disabled={loadingAuditoriaMurillo}
                className="h-8 flex items-center gap-1.5 px-3 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
                title="Confirmar que a Auditoria Murillo foi realizada"
              >
                <FiCheckCircle size={14} />
                {loadingAuditoriaMurillo ? 'Confirmando...' : 'Auditoria Murillo'}
              </button>
            )}
          </div>

          {/* Separador */}
          <div className="w-px h-6 bg-slate-200" />

          {/* Ações de status */}
          <div className="flex items-center gap-2">
            {podeLiberarMercadoria && (
              <button
                onClick={() => toggleBloqueioMercadoria(!nota.mercadoriaBloqueada)}
                disabled={nota.mercadoriaBloqueada && nota.status !== 'CONFERIDO_OK' && nota.status !== 'CONFERIDO_DIVERGENCIA' && nota.status !== 'SEPARACAO_FINALIZADA'}
                className={`h-8 flex items-center gap-1.5 px-3 rounded text-xs font-medium transition-colors shadow-sm ${nota.mercadoriaBloqueada && nota.status !== 'CONFERIDO_OK' && nota.status !== 'CONFERIDO_DIVERGENCIA' && nota.status !== 'SEPARACAO_FINALIZADA'
                  ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                  : nota.mercadoriaBloqueada
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                title={nota.mercadoriaBloqueada && nota.status !== 'CONFERIDO_OK' && nota.status !== 'CONFERIDO_DIVERGENCIA' && nota.status !== 'SEPARACAO_FINALIZADA' ? 'A mercadoria só pode ser desbloqueada após a conclusão de todo o fluxo de conferência' : ''}
              >
                {nota.mercadoriaBloqueada ? 'Liberar Mercadoria' : 'Bloquear Mercadoria'}
              </button>
            )}
            {nota.status === 'SEPARACAO_FINALIZADA' ? (
              <div className="flex flex-col gap-1">
                <StatusBadge status="CONFERIDO_OK" />
                <StatusBadge status="SEPARACAO_FINALIZADA" />
              </div>
            ) : (
              <StatusBadge
                status={nota.status}
                filialRecebimento={nota.filialRecebimento?.nome}
              />
            )}
          </div>

          {/* Separador */}
          <div className="w-px h-6 bg-slate-200" />

          {/* Ação destrutiva */}
          {(user?.perfil === 'ADMIN' || user?.perfil === 'COMPRAS') && (
            <button
              onClick={handleDelete}
              className="h-8 flex items-center gap-1.5 px-3 border border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600 rounded text-xs font-medium transition-colors"
              title="Excluir Nota Fiscal"
            >
              <FiTrash2 size={14} />
              Excluir
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 flex-1 min-h-0 overflow-hidden">
        <div className="lg:col-span-2 flex flex-col gap-3 min-h-0 overflow-hidden">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 flex-shrink-0">
            <h2 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <FiFileText size={16} />
              Dados da Nota Fiscal
            </h2>
            <div className="grid grid-cols-4 md:grid-cols-7 gap-2 text-sm">
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
              <div className="col-span-4 md:col-span-7">
                <p className="text-xs text-gray-500">Chave de Acesso</p>
                <p className="font-mono text-xs break-all">{nota.chaveAcesso || '-'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center justify-between mb-3 flex-shrink-0 gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2 flex-shrink-0">
                  <FiPackage size={16} />
                  Itens ({mostrarItensSecundarios ? (nota.itensSecundarios?.length || 0) : nota.itens.length})
                </h2>
                {nota.itensSecundarios && nota.itensSecundarios.length > 0 && (
                  <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                    <button
                      onClick={() => setMostrarItensSecundarios(false)}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${!mostrarItensSecundarios
                        ? 'bg-white text-primary-700 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      NF Original
                    </button>
                    <button
                      onClick={() => setMostrarItensSecundarios(true)}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${mostrarItensSecundarios
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      NF Secundária ({nota.itensSecundarios.length})
                    </button>
                  </div>
                )}
              </div>
              <div className="flex-1 max-w-xs">
                <input
                  type="text"
                  placeholder="Buscar por código ou descrição..."
                  value={pesquisaItem}
                  onChange={(e) => setPesquisaItem(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
              {/* Botão para buscar itens secundários do BD-BEZERRA - apenas para ADMIN e COMPRAS */}
              {nota.numeroSecundario && (user?.perfil === 'ADMIN' || user?.perfil === 'COMPRAS') && (
                <button
                  onClick={handleAbrirModalFilial}
                  disabled={loadingBuscarItens}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Buscar itens da NF secundária no sistema legado"
                >
                  {loadingBuscarItens ? (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <FiDownload size={14} />
                  )}
                  {loadingBuscarItens ? 'Buscando...' : 'Buscar Itens Secundários'}
                </button>
              )}
              {(['VOLUMES_CONFERIDOS', 'VOLUMES_DIVERGENTES', 'EM_CONFERENCIA', 'AGUARDANDO_CONFERENCIA', 'PENDENTE_TRANSFERENCIA'].includes(nota.status) || (user?.perfil === 'ADMIN' && ['CONFERIDO_OK', 'CONFERIDO_DIVERGENCIA', 'SEPARACAO_FINALIZADA'].includes(nota.status))) && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!mostrarItensSecundarios && (
                    <button
                      onClick={() => setShowItemExtraModal(true)}
                      disabled={!podeConferirItens}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${podeConferirItens
                        ? 'bg-orange-600 hover:bg-orange-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      title={!podeConferirItens ? 'Apenas usuários da filial de destino podem adicionar itens extras' : 'Registrar item que chegou mas não está na NF'}
                    >
                      <FiAlertTriangle size={14} />
                      Item Extra
                    </button>
                  )}
                  {mostrarItensSecundarios ? (
                    /* Botões para itens secundários */
                    modoConferenciaLoteSecundario ? (
                      <>
                        <button
                          onClick={handleConfirmarTodosSecundarios}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs transition-colors"
                        >
                          <FiCheckCircle size={14} />
                          Confirmar Todos
                        </button>
                        <button
                          onClick={handleCancelarLoteSecundario}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-400 hover:bg-gray-500 text-white rounded-lg text-xs transition-colors"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleSelecionarTodosSecundarios}
                        disabled={!podeConferirItens}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${podeConferirItens
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        title={!podeConferirItens ? 'Apenas usuários da filial de destino podem conferir itens' : ''}
                      >
                        Selecionar Todos
                      </button>
                    )
                  ) : (
                    /* Botões para itens originais */
                    modoConferenciaLote ? (
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
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${podeConferirItens
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        title={!podeConferirItens ? 'Apenas usuários da filial de destino podem conferir itens' : ''}
                      >
                        Selecionar Todos
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
            {mostrarItensSecundarios ? (
              /* Tabela de itens da NF Secundária com conferência */
              nota.itensSecundarios && nota.itensSecundarios.length > 0 ? (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden border border-blue-200 rounded-lg bg-blue-50/30">
                  <table className="w-full flex-shrink-0">
                    <thead className="bg-blue-100">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-blue-700 uppercase w-24">Código</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-blue-700 uppercase">Descrição</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-blue-700 uppercase w-20">Qtd NF</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-blue-700 uppercase w-28">Qtd Conf.</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-blue-700 uppercase w-20">Ação</th>
                      </tr>
                    </thead>
                  </table>
                  <div className="flex-1 overflow-y-auto">
                    <table className="w-full">
                      <tbody className="divide-y divide-blue-100">
                        {nota.itensSecundarios
                          .filter((item) => {
                            if (!pesquisaItem.trim()) return true
                            const termo = pesquisaItem.toLowerCase()
                            return (
                              item.codigo.toLowerCase().includes(termo) ||
                              item.descricao.toLowerCase().includes(termo)
                            )
                          })
                          .map((item) => {
                            const emEdicaoSecundario = conferindoItemSecundarioId === item.id
                            const emLoteSecundario = modoConferenciaLoteSecundario && !item.conferido

                            return (
                              <tr key={item.id} className={`hover:bg-blue-50 ${emEdicaoSecundario || emLoteSecundario ? 'bg-blue-100' : ''}`}>
                                <td className="px-3 py-1.5 text-xs w-24 font-mono">{item.codigo}</td>
                                <td className="px-3 py-1.5 text-xs">{item.descricao}</td>
                                <td className="px-3 py-1.5 text-xs text-right w-20">{Number(item.quantidade)}</td>
                                <td className="px-3 py-1.5 text-xs text-right w-28">
                                  {emEdicaoSecundario ? (
                                    <input
                                      type="number"
                                      value={quantidadeConferidaSecundario}
                                      onChange={(e) => setQuantidadeConferidaSecundario(e.target.value)}
                                      className="w-20 px-2 py-1 border border-blue-300 rounded text-right text-xs"
                                      autoFocus
                                      min="0"
                                      step="0.01"
                                    />
                                  ) : emLoteSecundario ? (
                                    <input
                                      type="number"
                                      value={quantidadesLoteSecundario[item.id] || ''}
                                      onChange={(e) => setQuantidadesLoteSecundario(prev => ({ ...prev, [item.id]: e.target.value }))}
                                      className="w-20 px-2 py-1 border border-blue-300 rounded text-right text-xs bg-blue-50"
                                      min="0"
                                      step="0.01"
                                    />
                                  ) : item.conferido ? (
                                    <span className={Number(item.quantidadeConferida) !== Number(item.quantidade) ? 'text-red-600 font-medium' : 'text-green-600'}>
                                      {item.quantidadeConferida}
                                    </span>
                                  ) : '-'}
                                </td>
                                <td className="px-3 py-1.5 text-center w-20">
                                  {emEdicaoSecundario ? (
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        onClick={() => handleConferirItemSecundario(item.id)}
                                        className="p-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
                                        title="Confirmar"
                                      >
                                        <FiCheckCircle size={12} />
                                      </button>
                                      <button
                                        onClick={() => { setConferindoItemSecundarioId(null); setQuantidadeConferidaSecundario(''); }}
                                        className="p-1 bg-gray-400 hover:bg-gray-500 text-white rounded text-xs"
                                        title="Cancelar"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ) : emLoteSecundario ? (
                                    <span className="text-blue-600 text-xs">Em lote</span>
                                  ) : item.conferido ? (
                                    <span className="text-green-600"><FiCheckCircle size={14} /></span>
                                  ) : (
                                    <button
                                      onClick={() => iniciarConferenciaItemSecundario(item)}
                                      disabled={!podeConferirItens}
                                      className={`px-2 py-0.5 rounded text-xs ${podeConferirItens
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
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
              ) : (
                <p className="text-gray-500 text-center py-8">Nenhum item secundário cadastrado</p>
              )
            ) : nota.itens.length === 0 ? (
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
                          const emLote = modoConferenciaLote && (!item.conferido || (user?.perfil === 'ADMIN' && quantidadesLote[item.id] !== undefined))
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
                                  user?.perfil === 'ADMIN' ? (
                                    <button
                                      onClick={() => iniciarConferenciaItem(item)}
                                      className="px-2 py-0.5 rounded text-xs bg-amber-500 hover:bg-amber-600 text-white"
                                      title="Reconferir item (ADMIN)"
                                    >
                                      Reconferir
                                    </button>
                                  ) : (
                                    <span className="text-green-600"><FiCheckCircle size={14} /></span>
                                  )
                                ) : (
                                  <button
                                    onClick={() => iniciarConferenciaItem(item)}
                                    disabled={!podeConferirItens}
                                    className={`px-2 py-0.5 rounded text-xs ${podeConferirItens
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
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 flex-shrink-0">
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

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 flex-shrink-0">
            <h2 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <FiCheckCircle size={16} />
              Conferência de Volumes
            </h2>

            {nota.conferenciasVolumes.length > 0 ? (
              <div className="space-y-3">
                {nota.conferenciasVolumes.map((conf) => (
                  <div key={conf.id} className={`p-3 rounded-lg border-l-4 text-sm ${conf.volumesBatendo
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
                    className={`w-full py-2 rounded-lg transition-colors text-sm ${usuarioPodeConferirDestino
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
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 flex-shrink-0">
              <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FiAlertTriangle className="text-error-500" size={16} />
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4">
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
                  Tipo de Movimentação *
                </label>
                <select
                  value={editForm.tipoMovimentacao}
                  onChange={(e) => setEditForm({ ...editForm, tipoMovimentacao: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  required
                >
                  <option value="">Selecione o tipo</option>
                  <option value="NORMAL">Normal</option>
                  <option value="URGENCIA">Urgência</option>
                  <option value="DISTRIBUICAO_IMEDIATA">Distribuição Imediata</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Transportadora
                  </label>
                  <input
                    type="text"
                    value={transportadoraSearch}
                    onChange={(e) => {
                      setTransportadoraSearch(e.target.value)
                      setEditForm({ ...editForm, transportadora: e.target.value })
                      setShowTransportadoraDropdown(true)
                    }}
                    onFocus={() => setShowTransportadoraDropdown(true)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    placeholder="Digite para buscar"
                  />
                  {showTransportadoraDropdown && transportadoras.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {transportadoras
                        .filter(t => t.nome.toLowerCase().includes(transportadoraSearch.toLowerCase()))
                        .map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              setTransportadoraSearch(t.nome)
                              setEditForm({ ...editForm, transportadora: t.nome })
                              setShowTransportadoraDropdown(false)
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors"
                          >
                            {t.nome}
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Qtd. Volumes
                  </label>
                  <input
                    type="number"
                    value={editForm.quantidadeVolumes}
                    onChange={(e) => setEditForm({ ...editForm, quantidadeVolumes: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
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

              {/* Upload de DANF Secundário */}
              <div className="border-t pt-3">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  DANF da NF Secundária
                </label>

                {nota?.danfSecundario ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleViewDanf}
                      className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg transition-colors"
                    >
                      <FiFileText size={14} />
                      Ver DANF Atual
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteDanf}
                      className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors"
                    >
                      <FiTrash2 size={14} />
                      Remover
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setDanfFile(e.target.files?.[0] || null)}
                      className="w-full text-sm border border-gray-300 rounded-lg file:mr-4 file:py-1.5 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                    />
                    {danfFile && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">
                          {danfFile.name} ({(danfFile.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                        <button
                          type="button"
                          onClick={handleUploadDanf}
                          disabled={uploadingDanf}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
                        >
                          {uploadingDanf ? 'Enviando...' : 'Enviar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDanfFile(null)}
                          className="px-3 py-1 bg-gray-400 hover:bg-gray-500 text-white text-xs rounded-lg transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Botão Separação Finalizada - apenas para Distribuição Imediata com status Processo Finalizado */}
              {nota.tipoMovimentacao === 'DISTRIBUICAO_IMEDIATA' && nota.status === 'CONFERIDO_OK' && (
                <div className="border-t pt-3">
                  <button
                    type="button"
                    onClick={() => setShowConfirmSeparacao(true)}
                    disabled={loadingSeparacao}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingSeparacao ? (
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <FiCheckCircle size={18} />
                    )}
                    {loadingSeparacao ? 'Finalizando...' : 'Marcar Separação como Finalizada'}
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-1">
                    Clique para indicar que a separação dos itens foi concluída
                  </p>
                </div>
              )}

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

      {/* Modal de seleção de filial para buscar itens secundários */}
      {showFilialModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Selecione a Filial de Origem
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                De qual filial deseja buscar os itens da NF secundária <strong>{nota.numeroSecundario}</strong>?
              </p>

              <div className="space-y-2">
                {filiaisBezerra.map((filial) => (
                  <label
                    key={filial.codigo}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${filialSelecionada === filial.codigo
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                      }`}
                  >
                    <input
                      type="radio"
                      name="filialBezerra"
                      value={filial.codigo}
                      checked={filialSelecionada === filial.codigo}
                      onChange={(e) => setFilialSelecionada(e.target.value)}
                      className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      {filial.codigo} - {filial.nome}
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowFilialModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleBuscarItensSecundarios}
                  disabled={!filialSelecionada}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Buscar Itens
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação: Separação Finalizada */}
      {showConfirmSeparacao && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <FiCheckCircle className="text-emerald-600" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Confirmar Separação Finalizada
                </h3>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                Confirma que a separação dos itens foi finalizada?
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirmSeparacao(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmarSeparacao}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Fullscreen para ações assíncronas */}
      {(loadingConferencia || loadingItem || loadingBloqueio || loadingDelete || saving) && (
        <Loading
          size="lg"
          text={
            loadingConferencia ? 'Processando conferência...' :
              loadingItem ? 'Conferindo itens...' :
                loadingBloqueio ? 'Alterando bloqueio...' :
                  loadingDelete ? 'Excluindo nota fiscal...' :
                    saving ? 'Salvando alterações...' :
                      'Processando...'
          }
          fullScreen
        />
      )}
    </div>
  )
}
