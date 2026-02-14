import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { FiPlus, FiEye, FiFilter, FiSearch, FiPackage, FiRefreshCw, FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { api } from '../../services/api'
import { StatusBadge } from '../../components/StatusBadge'
import { Tooltip } from '../../components/Tooltip'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
import { useNotasFiscais } from '../../hooks/useNotasFiscais'

const statusOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'PENDENTE_TRANSFERENCIA', label: 'Em Trânsito' },
  { value: 'CONFERIDO_DIVERGENCIA', label: 'Conferido c/ Divergência' },
  { value: 'VOLUMES_CONFERIDOS', label: 'Volumes Conferidos' },
  { value: 'CONFERIDO_OK', label: 'Processo Finalizado' },
  { value: 'SEPARACAO_FINALIZADA', label: 'Separação Finalizada' },
  { value: 'AGUARDANDO_CONFERENCIA_DESTINO', label: 'Aguard. Destino' },
]

export function NotasFiscais() {
  const [statusFilter, setStatusFilter] = useState('')
  const [rpFilter, setRpFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [updating, setUpdating] = useState(false)
  const [dataFiltro, setDataFiltro] = useState('')
  const [bloqueadaFilter, setBloqueadaFilter] = useState('')
  const [filialDestinoFilter, setFilialDestinoFilter] = useState('')
  const [filiais, setFiliais] = useState<{ id: string; nome: string; codigo: string }[]>([])
  const [page, setPage] = useState(1)
  const dateInputRef = useRef<HTMLInputElement>(null)
  const { showSuccess, showError } = useToast()
  const { user } = useAuth()

  // React Query hook com todos os filtros no backend
  const { data, isLoading, isFetching, refetch } = useNotasFiscais({
    status: statusFilter || undefined,
    searchTerm: searchTerm || undefined,
    dataEmissao: dataFiltro || undefined,
    filialDestinoId: (!searchTerm && filialDestinoFilter) ? filialDestinoFilter : undefined,
    entradaRp: rpFilter === 'SIM' ? 'true' : rpFilter === 'NAO' ? 'false' : undefined,
    mercadoriaBloqueada: bloqueadaFilter === 'SIM' ? 'true' : bloqueadaFilter === 'NAO' ? 'false' : undefined,
    page,
    limit: 50
  })

  const notas = data?.data || []
  const pagination = data?.pagination

  // Pré-selecionar filial do usuário logado
  useEffect(() => {
    if (user?.filial) {
      setFilialDestinoFilter(user.filial.id)
    }
  }, [user])

  useEffect(() => {
    loadFiliais()
  }, [])

  async function loadFiliais() {
    try {
      const response = await api.get('/filiais/ativas')
      setFiliais(response.data)
    } catch (error) {
      console.error('Erro ao carregar filiais:', error)
    }
  }

  // Resetar página quando filtros mudam
  useEffect(() => {
    setPage(1)
  }, [statusFilter, searchTerm, dataFiltro, filialDestinoFilter, rpFilter, bloqueadaFilter])

  async function handleRpChange(nfId: string, value: string) {
    setUpdating(true)
    try {
      await api.put(`/notas-fiscais/${nfId}`, {
        entradaRp: value === 'SIM'
      })
      await refetch()
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
    <div className="flex flex-col h-[calc(100vh-2rem)] p-3 pb-3">
      <div className="bg-white rounded-lg shadow-md border border-gray-200 flex flex-col flex-1 min-h-0 mb-0">
        <div className="p-3 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-sm font-semibold text-gray-800">Notas Fiscais</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="h-7 flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 rounded-md transition-colors text-xs disabled:opacity-50"
                title="Atualizar lista"
              >
                <FiRefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
              </button>
              <Link
                to="/notas-fiscais/nova"
                className="h-7 flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white px-3 rounded-md transition-colors text-xs font-medium"
              >
                <FiPlus size={14} />
                Nova NF
              </Link>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-2">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Buscar por número ou fornecedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-7 pl-8 pr-2 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <FiFilter className="text-gray-400" size={14} />
              <div className="relative">
                <input
                  ref={dateInputRef}
                  type="date"
                  value={dataFiltro}
                  onChange={(e) => setDataFiltro(e.target.value)}
                  className="absolute opacity-0 pointer-events-none"
                />
                <button
                  type="button"
                  onClick={() => dateInputRef.current?.showPicker()}
                  className={`h-7 flex items-center gap-1.5 px-2 border rounded-md text-xs transition-colors ${
                    dataFiltro 
                      ? 'border-primary-500 bg-primary-50 text-primary-700' 
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                  title="Filtrar por data"
                >
                  <FiCalendar size={12} />
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
                value={filialDestinoFilter}
                onChange={(e) => setFilialDestinoFilter(e.target.value)}
                className="h-7 border border-gray-300 rounded-md px-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-xs"
              >
                <option value="">Todas as Filiais</option>
                {filiais.map(filial => (
                  <option key={filial.id} value={filial.id}>
                    {filial.nome}
                  </option>
                ))}
              </select>
              <select
                value={rpFilter}
                onChange={(e) => setRpFilter(e.target.value)}
                className="h-7 border border-gray-300 rounded-md px-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-xs"
              >
                <option value="">Todos RP</option>
                <option value="SIM">RP-SIM</option>
                <option value="NAO">RP-NÃO</option>
              </select>
              <select
                value={bloqueadaFilter}
                onChange={(e) => setBloqueadaFilter(e.target.value)}
                className="h-7 border border-gray-300 rounded-md px-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-xs"
              >
                <option value="">Bloqueio</option>
                <option value="SIM">Bloqueada</option>
                <option value="NAO">Liberada</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-7 border border-gray-300 rounded-md px-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-xs"
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

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : notas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <FiPackage size={48} className="mb-4" />
            <p>Nenhuma nota fiscal encontrada</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <table className="w-full border-collapse table-fixed">
              <thead className="sticky top-0 z-10 bg-gray-50">
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-2 py-1 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[22%]">
                    NF / Fornecedor
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[14%]">
                    Recebimento
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[12%]">
                    Destino
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[12%]">
                    Transportadora
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[6%]">
                    Vol.
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[10%]">
                    Cód. Reserva
                  </th>
                  <th className="px-2 py-1 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider w-[10%]">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {notas.map((nf) => (
                  <tr key={nf.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-2 py-1 max-w-[250px]">
                      <div>
                        <div className="flex items-center gap-1 flex-wrap">
                          <p className="font-medium text-gray-900 text-xs">NF {nf.numero}</p>
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
                          {nf.tipoMovimentacao === 'DISTRIBUICAO_IMEDIATA' && (
                            <span className={`px-2 py-0.5 ${nf.status === 'SEPARACAO_FINALIZADA' ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-gradient-to-r from-orange-600 to-red-600'} text-xs font-bold rounded flex items-center gap-1`}>
                              <span className="animate-bounce">⚡</span>
                              <span className="text-white animate-pulse" style={{ textShadow: '0 0 8px rgba(255,255,255,0.8)' }}>
                                DISTRIBUIÇÃO IMEDIATA
                              </span>
                            </span>
                          )}
                        </div>
                        <Tooltip content={nf.fornecedorNome}>
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">{nf.fornecedorNome}</p>
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
                    <td className="px-2 py-1">
                      <div>
                        <p className="text-xs text-gray-900">{nf.filialRecebimento?.nome || '-'}</p>
                        {nf.dataRecebimento && (
                          <p className="text-xs text-gray-500">{formatDate(nf.dataRecebimento)}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-1">
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
                    <td className="px-2 py-1">
                      <span className="text-xs text-gray-900">{nf.transportadora || '-'}</span>
                    </td>
                    <td className="px-2 py-1">
                      <span className="text-xs text-gray-900">{nf.quantidadeVolumes}</span>
                    </td>
                    <td className="px-2 py-1">
                      {nf.status === 'SEPARACAO_FINALIZADA' ? (
                        <div className="flex flex-col gap-1">
                          <StatusBadge 
                            status="CONFERIDO_OK" 
                            filialRecebimento={nf.filialRecebimento?.nome}
                          />
                          <StatusBadge 
                            status="SEPARACAO_FINALIZADA" 
                          />
                        </div>
                      ) : (
                        <StatusBadge 
                          status={nf.status} 
                          filialRecebimento={nf.filialRecebimento?.nome}
                        />
                      )}
                    </td>
                    <td className="px-2 py-1">
                      {(nf.status === 'CONFERIDO_OK' || nf.status === 'SEPARACAO_FINALIZADA') && nf.fornecedor?.codigo && (
                        <span className="text-xs font-medium text-blue-600">
                          {nf.fornecedor.codigo.slice(-2)}{nf.numeroSecundario || nf.numero}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-1 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {nf.auditoriaRealizada && (
                          <Tooltip content={`Auditoria realizada em ${formatDate(nf.dataAuditoria || '')}`}>
                            <span className="px-1 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded">
                              AUD
                            </span>
                          </Tooltip>
                        )}
                        {nf.auditoriaMurillo && (
                          <Tooltip content={`Auditoria Murillo realizada em ${formatDate(nf.dataAuditoriaMurillo || '')}`}>
                            <span className="px-1 py-0.5 bg-green-600 text-white text-[10px] font-bold rounded">
                              AUD-M
                            </span>
                          </Tooltip>
                        )}
                        {/* Botão 1ª Conferência - Receber na filial */}
                        {!nf.filialRecebimento && (
                          <Link
                            to={`/notas-fiscais/${nf.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs rounded-lg transition-colors"
                          >
                            <FiPackage size={14} />
                            <span>Receber</span>
                          </Link>
                        )}
                        {/* Botão 2ª Conferência - Receber no Destino */}
                        {nf.status === 'AGUARDANDO_CONFERENCIA_DESTINO' && (
                          <Link
                            to={`/notas-fiscais/${nf.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg transition-colors"
                          >
                            <FiPackage size={14} />
                            <span>Conferir</span>
                          </Link>
                        )}
                        {/* Botão Conferência de Itens */}
                        {nf.filialRecebimento && ['VOLUMES_CONFERIDOS', 'PENDENTE_TRANSFERENCIA'].includes(nf.status) && (
                          <Link
                            to={`/notas-fiscais/${nf.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs rounded-lg transition-colors"
                          >
                            <FiPackage size={14} />
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

        {/* Paginação */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-3 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
            <div className="text-sm text-gray-600">
              Mostrando {((page - 1) * pagination.limit) + 1} - {Math.min(page * pagination.limit, pagination.total)} de {pagination.total} notas
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || isFetching}
                className="h-8 px-3 flex items-center gap-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiChevronLeft size={16} />
                Anterior
              </button>
              <span className="text-sm text-gray-600">
                Página {page} de {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={!pagination.hasMore || isFetching}
                className="h-8 px-3 flex items-center gap-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próxima
                <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
