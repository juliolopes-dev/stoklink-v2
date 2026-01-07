import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiPlus, FiEye, FiFilter, FiSearch, FiPackage } from 'react-icons/fi'
import { api } from '../../services/api'
import { StatusBadge } from '../../components/StatusBadge'
import { Tooltip } from '../../components/Tooltip'

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
  dataRecebimento: string
  quantidadeVolumes: number
  status: string
  tipoMovimentacao: string
  transportadora: string | null
  mercadoriaBloqueada: boolean
  filialRecebimento: {
    nome: string
    codigo: string
  } | null
  filialDestino: {
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
  { value: 'VOLUMES_CONFERIDOS', label: 'Volumes Conferidos' },
  { value: 'VOLUMES_DIVERGENTES', label: 'Volumes Divergentes' },
  { value: 'BLOQUEADO', label: 'Bloqueado' },
  { value: 'CONFERIDO_DIVERGENCIA', label: 'Conferido c/ Divergência' },
  { value: 'CONFERIDO_OK', label: 'Conferido OK' },
  { value: 'PENDENTE_TRANSFERENCIA', label: 'Pendente Transferência' },
]

export function NotasFiscais() {
  const [notas, setNotas] = useState<NotaFiscal[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadNotas()
  }, [statusFilter])

  async function loadNotas() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      
      const response = await api.get(`/notas-fiscais?${params.toString()}`)
      setNotas(response.data)
    } catch (error) {
      console.error('Erro ao carregar notas fiscais:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredNotas = notas.filter(nf => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      nf.numero.toLowerCase().includes(search) ||
      nf.fornecedorNome.toLowerCase().includes(search)
    )
  })

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
    <div className="h-[calc(100vh-80px)] flex flex-col">
      <div className="bg-white rounded-xl shadow-sm flex flex-col h-full">
        <div className="p-3 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-gray-800">Notas Fiscais</h1>
            <Link
              to="/notas-fiscais/nova"
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg transition-colors text-sm"
            >
              <FiPlus size={16} />
              Nova NF
            </Link>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por número ou fornecedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-400" size={20} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
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
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="overflow-x-auto overflow-y-auto flex-1">
            <table className="w-full border-collapse table-fixed">
              <thead className="sticky top-0 z-10">
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
                        <p className="text-sm text-gray-500 truncate max-w-[200px]">{nf.fornecedorNome}</p>
                        {nf.dataEmissao && (
                          <p className="text-xs text-blue-600">Emissão: {formatDate(nf.dataEmissao)}</p>
                        )}
                        {nf.fornecedorSecundario && (
                          <p className="text-xs text-purple-500 truncate max-w-[200px]">
                            + {nf.fornecedorSecundario.nome}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div>
                        <p className="text-xs text-gray-900">{nf.filialRecebimento?.nome || 'A definir'}</p>
                        <p className="text-xs text-gray-500">{formatDate(nf.dataRecebimento)}</p>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-1 items-start">
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
                          tooltip={!nf.filialRecebimento ? 'Aguardando conferência de volumes' : undefined}
                          filialRecebimento={nf.filialRecebimento?.nome}
                        />
                        {/* 1ª Conferência - Receber na filial */}
                        {!nf.filialRecebimento && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Conferir volumes
                          </span>
                        )}
                        {/* 2ª Conferência - Receber no Destino */}
                        {nf.status === 'AGUARDANDO_CONFERENCIA_DESTINO' && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            Conf. destino
                          </span>
                        )}
                        {/* Conferência de Itens */}
                        {nf.filialRecebimento && ['VOLUMES_CONFERIDOS', 'PENDENTE_TRANSFERENCIA'].includes(nf.status) && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Conferir itens
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
          </div>
        )}
      </div>
    </div>
  )
}
