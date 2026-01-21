import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiPlus, FiEye, FiFilter, FiSearch, FiPackage, FiRefreshCw, FiCalendar } from 'react-icons/fi'
import { api } from '../../services/api'
import { StatusBadge } from '../../components/StatusBadge'
import { Tooltip } from '../../components/Tooltip'
import { useToast } from '../../contexts/ToastContext'

interface NotaFiscal {
  id: string
  numero: string
  numeroSecundario: string | null
  serie: string | null
  fornecedorNome: string
  fornecedorSecundario: {
    id: string
    nome: string
  } | null
  dataEmissao: string | null
  dataRecebimento: string | null
  quantidadeVolumes: number
  status: string
  tipoMovimentacao: string
  transportadora: string | null
  mercadoriaBloqueada: boolean
  entradaRp: boolean | null
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
  _count: {
    itens: number
    divergencias: number
  }
}

const statusOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'AGUARDANDO_CONFERENCIA', label: 'Aguardando Conferência' },
  { value: 'AGUARDANDO_CONFERENCIA_DESTINO', label: 'Aguardando Conf. Destino' },
  { value: 'PENDENTE_TRANSFERENCIA', label: 'Em Trânsito' },
  { value: 'VOLUMES_CONFERIDOS', label: 'Volumes Conferidos' },
  { value: 'VOLUMES_DIVERGENTES', label: 'Volumes Divergentes' },
  { value: 'EM_CONFERENCIA', label: 'Em Conferência' },
  { value: 'CONFERIDO_OK', label: 'Conferido OK' },
  { value: 'CONFERIDO_DIVERGENCIA', label: 'Conferido c/ Divergência' },
  { value: 'BLOQUEADO', label: 'Bloqueado' },
]

export function NotasFiscais() {
  const [notas, setNotas] = useState<NotaFiscal[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [rpFilter, setRpFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [updating, setUpdating] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [dataFiltro, setDataFiltro] = useState('')
  const [bloqueadaFilter, setBloqueadaFilter] = useState('')
  const { showSuccess, showError } = useToast()

  useEffect(() => {
    loadNotas()
  }, [statusFilter])

  // Recarregar dados quando a página fica visível novamente
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadNotas()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [statusFilter])

  async function loadNotas(showRefresh = false) {
    if (showRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      
      const response = await api.get(`/notas-fiscais?${params.toString()}`)
      setNotas(response.data)
    } catch (error) {
      console.error('Erro ao carregar notas fiscais:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filteredNotas = notas.filter(nf => {
    // Filtro de busca
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      const matchSearch = nf.numero.toLowerCase().includes(search) ||
        nf.numeroSecundario?.toLowerCase().includes(search) ||
        nf.fornecedorNome.toLowerCase().includes(search) ||
        nf.transportadora?.toLowerCase().includes(search)
      if (!matchSearch) return false
    }
    
    // Filtro RP (Entrada no RP)
    if (rpFilter === 'SIM') {
      if (!nf.entradaRp) return false
    } else if (rpFilter === 'NAO') {
      if (nf.entradaRp) return false
    }

    // Filtro por data
    if (dataFiltro && nf.dataEmissao) {
      const nfDate = new Date(nf.dataEmissao).toISOString().split('T')[0]
      if (nfDate !== dataFiltro) return false
    }

    // Filtro por mercadoria bloqueada
    if (bloqueadaFilter === 'SIM') {
      if (!nf.mercadoriaBloqueada) return false
    } else if (bloqueadaFilter === 'NAO') {
      if (nf.mercadoriaBloqueada) return false
    }
    
    return true
  })

  async function handleRpChange(nfId: string, value: string) {
    setUpdating(true)
    try {
      await api.put(`/notas-fiscais/${nfId}`, {
        entradaRp: value === 'SIM'
      })
      await loadNotas()
      showSuccess('Entrada RP atualizada!')
    } catch (error) {
      console.error('Erro ao atualizar RP:', error)
      showError('Erro ao atualizar entrada RP')
    } finally {
      setUpdating(false)
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] p-4 pb-4">
      <div className="bg-white rounded-lg shadow-md border border-gray-200 flex flex-col flex-1 min-h-0 mb-0">
        <div className="p-3 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-semibold text-gray-800">Notas Fiscais</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadNotas(true)}
                disabled={refreshing}
                className="h-9 flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 rounded-md transition-colors text-sm disabled:opacity-50"
                title="Atualizar lista"
              >
                <FiRefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              </button>
              <Link
                to="/notas-fiscais/nova"
                className="h-9 flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 rounded-md transition-colors text-sm font-medium"
              >
                <FiPlus size={16} />
                Nova NF
              </Link>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por número ou fornecedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-10 pr-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <FiFilter className="text-gray-400" size={18} />
              <div className="relative">
                <input
                  type="date"
                  id="date-filter"
                  value={dataFiltro}
                  onChange={(e) => setDataFiltro(e.target.value)}
                  className="absolute opacity-0 pointer-events-none"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('date-filter')?.click()}
                  className={`h-9 flex items-center gap-2 px-3 border rounded-md text-sm transition-colors ${
                    dataFiltro 
                      ? 'border-primary-500 bg-primary-50 text-primary-700' 
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                  title="Filtrar por data"
                >
                  <FiCalendar size={16} />
                  {dataFiltro ? new Date(dataFiltro + 'T12:00:00').toLocaleDateString('pt-BR') : 'Data'}
                </button>
                {dataFiltro && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDataFiltro('')
                    }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-error-500 hover:bg-error-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
                    title="Limpar filtro"
                  >
                    ×
                  </button>
                )}
              </div>
              <select
                value={rpFilter}
                onChange={(e) => setRpFilter(e.target.value)}
                className="h-9 border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
              >
                <option value="">Todos RP</option>
                <option value="SIM">RP-SIM</option>
                <option value="NAO">RP-NÃO</option>
              </select>
              <select
                value={bloqueadaFilter}
                onChange={(e) => setBloqueadaFilter(e.target.value)}
                className="h-9 border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
              >
                <option value="">Bloqueio</option>
                <option value="SIM">Bloqueada</option>
                <option value="NAO">Liberada</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 border border-gray-300 rounded-md px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredNotas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <FiPackage size={48} className="mb-4" />
            <p>Nenhuma nota fiscal encontrada</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <table className="w-full border-collapse table-fixed">
              <thead className="sticky top-0 z-10 bg-gray-50">
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[22%]">
                    NF / Fornecedor
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[14%]">
                    Recebimento
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[12%]">
                    Destino
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[12%]">
                    Transportadora
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[6%]">
                    Vol.
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider w-[10%]">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredNotas.map((nf) => (
                  <tr key={nf.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2 max-w-[250px]">
                      <div>
                        <div className="flex items-center gap-1 flex-wrap">
                          <p className="font-medium text-gray-900 text-sm">NF {nf.numero}</p>
                          {nf._count.divergencias > 0 && (
                            <Tooltip content={`${nf._count.divergencias} divergência(s) encontrada(s)`}>
                              <span className="flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                                {nf._count.divergencias}
                              </span>
                            </Tooltip>
                          )}
                          {nf.numeroSecundario && (
                            <Tooltip content={nf.fornecedorSecundario ? nf.fornecedorSecundario.nome : 'Fornecedor não informado'}>
                              <span className="text-xs text-purple-600">/ {nf.numeroSecundario}</span>
                            </Tooltip>
                          )}
                          {nf.tipoMovimentacao === 'DISTRIBUICAO_URGENTE' && (
                            <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-md shadow-sm">📦 Distribuição Imediata</span>
                          )}
                          {(nf.tipoMovimentacao === 'RECEBIMENTO_DIRETO' || nf.tipoMovimentacao === 'RECEBIMENTO_INDIRETO') && (
                            <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-md shadow-sm">✓ Fluxo Normal</span>
                          )}
                        </div>
                        <Tooltip content={nf.fornecedorNome}>
                          <p className="text-sm text-gray-500 truncate max-w-[200px]">{nf.fornecedorNome}</p>
                        </Tooltip>
                        {nf.dataEmissao && (
                          <p className="text-xs text-blue-600">Emissão: {formatDate(nf.dataEmissao)}</p>
                        )}
                        {nf.fornecedorSecundario && (
                          <Tooltip content={nf.fornecedorSecundario.nome}>
                            <p className="text-xs text-purple-500 truncate max-w-[200px]">
                              + {nf.fornecedorSecundario.nome}
                            </p>
                          </Tooltip>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div>
                        <p className="text-xs text-gray-900">{nf.filialRecebimento?.nome || '-'}</p>
                        {nf.dataRecebimento && (
                          <p className="text-xs text-gray-500">{formatDate(nf.dataRecebimento)}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-1 items-start">
                        {/* Dropdown RP-SIM / RP-NÃO */}
                        <select
                          value={nf.entradaRp === true ? 'SIM' : nf.entradaRp === false ? 'NAO' : ''}
                          onChange={(e) => handleRpChange(nf.id, e.target.value)}
                          disabled={updating}
                          className={`px-1.5 py-0.5 rounded text-xs font-medium border-0 outline-none cursor-pointer ${
                            nf.entradaRp === true
                              ? 'bg-green-100 text-green-800' 
                              : nf.entradaRp === false
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <option value="">-</option>
                          <option value="SIM">RP-SIM</option>
                          <option value="NAO">RP-NÃO</option>
                        </select>
                        {/* Tag de Bloqueio/Liberação */}
                        {nf.mercadoriaBloqueada ? (
                          <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            Bloqueada
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Liberada
                          </span>
                        )}
                        <p className="text-xs text-gray-900">{nf.filialDestino.nome}</p>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-xs text-gray-900">{nf.transportadora || '-'}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-xs text-gray-900">{nf.quantidadeVolumes}</span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-1 items-start">
                        <StatusBadge 
                          status={nf.status} 
                          filialRecebimento={nf.filialRecebimento?.nome}
                        />
                        
                        {/* NF não chegou ainda - Conferência Pendente */}
                        {nf.status === 'AGUARDANDO_CONFERENCIA' && !nf.filialRecebimento && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Conf. pendente
                          </span>
                        )}
                        
                        {/* NF chegou - Aguardando conferência de volumes */}
                        {nf.status === 'AGUARDANDO_CONFERENCIA' && nf.filialRecebimento && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Conferir volumes
                          </span>
                        )}
                        
                        {/* NF DIRETA - Volumes conferidos, aguardando conferência de itens */}
                        {nf.tipoMovimentacao === 'RECEBIMENTO_DIRETO' && nf.status === 'VOLUMES_CONFERIDOS' && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Conferir itens
                          </span>
                        )}
                        
                        {/* NF INDIRETA - Em trânsito para filial destino */}
                        {nf.tipoMovimentacao === 'RECEBIMENTO_INDIRETO' && ['VOLUMES_CONFERIDOS', 'PENDENTE_TRANSFERENCIA'].includes(nf.status) && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Aguardando chegada no destino
                          </span>
                        )}
                        
                        {/* NF INDIRETA - Chegou no destino, aguardando conferência */}
                        {nf.status === 'AGUARDANDO_CONFERENCIA_DESTINO' && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            Conferir volumes e itens
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Botão 1ª Conferência - Receber na filial */}
                        {!nf.filialRecebimento && (
                          <Link
                            to={`/notas-fiscais/${nf.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg transition-colors"
                          >
                            <FiPackage size={14} />
                            <span>Receber</span>
                          </Link>
                        )}
                        {/* Botão 2ª Conferência - Receber no Destino */}
                        {nf.status === 'AGUARDANDO_CONFERENCIA_DESTINO' && (
                          <Link
                            to={`/notas-fiscais/${nf.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg transition-colors"
                          >
                            <FiPackage size={12} />
                            <span>Conferir</span>
                          </Link>
                        )}
                        {/* Botão Conferência de Itens */}
                        {nf.filialRecebimento && ['VOLUMES_CONFERIDOS', 'PENDENTE_TRANSFERENCIA'].includes(nf.status) && (
                          <Link
                            to={`/notas-fiscais/${nf.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs rounded-lg transition-colors"
                          >
                            <FiPackage size={12} />
                            <span>Conferir</span>
                          </Link>
                        )}
                        <Link
                          to={`/notas-fiscais/${nf.id}`}
                          className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-800"
                        >
                          <FiEye size={16} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
