import { useEffect, useState } from 'react'
import { FiBarChart2, FiFilter, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi'
import { api } from '../../services/api'

// Página de relatórios por filial de recebimento
interface Filial {
  id: string
  nome: string
  codigo: string
}

interface NotaFiscalRelatorio {
  id: string
  numero: string
  fornecedorNome: string
  dataRecebimento: string
  status: string
  quantidadeVolumes: number
  valorTotal: number
  filialRecebimento: {
    nome: string
    codigo: string
  }
}

interface EstatisticasAvancadas {
  geral: {
    totalNotas: number
    notasConferidas: number
    notasPendentes: number
    taxaConferencia: number
  }
  porFilial: Array<{
    filialId: string
    nome: string
    codigo: string
    total: number
    conferidas: number
    tempoMedioHoras: number
  }>
  porStatus: Array<{
    status: string
    count: number
  }>
}

export function Relatorios() {
  const [filiais, setFiliais] = useState<Filial[]>([])
  const [filialSelecionada, setFilialSelecionada] = useState('')
  const [notas, setNotas] = useState<NotaFiscalRelatorio[]>([])
  const [loading, setLoading] = useState(false)
  const [estatisticas, setEstatisticas] = useState<EstatisticasAvancadas | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [activeTab, setActiveTab] = useState<'filial' | 'estatisticas'>('estatisticas')

  useEffect(() => {
    loadFiliais()
    loadEstatisticas()
  }, [])

  useEffect(() => {
    if (filialSelecionada) {
      loadRelatorio()
    }
  }, [filialSelecionada])

  async function loadFiliais() {
    try {
      const response = await api.get('/filiais/ativas')
      setFiliais(response.data)
    } catch (error) {
      console.error('Erro ao carregar filiais:', error)
    }
  }

  async function loadEstatisticas() {
    setLoadingStats(true)
    try {
      const response = await api.get('/notas-fiscais/estatisticas/avancadas')
      setEstatisticas(response.data)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  async function loadRelatorio() {
    setLoading(true)
    try {
      const response = await api.get(`/notas-fiscais/relatorio/filial/${filialSelecionada}`)
      setNotas(response.data)
    } catch (error) {
      console.error('Erro ao carregar relatório:', error)
    } finally {
      setLoading(false)
    }
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const valorTotal = notas.reduce((acc, nf) => acc + (nf.valorTotal || 0), 0)
  const volumesTotal = notas.reduce((acc, nf) => acc + (nf.quantidadeVolumes || 0), 0)

  const statusLabels: Record<string, string> = {
    'AGUARDANDO_CONFERENCIA': 'Aguardando Conferência',
    'AGUARDANDO_CONFERENCIA_DESTINO': 'Aguard. Conf. Destino',
    'VOLUMES_CONFERIDOS': 'Volumes Conferidos',
    'VOLUMES_DIVERGENTES': 'Volumes Divergentes',
    'PENDENTE_TRANSFERENCIA': 'Em Trânsito',
    'EM_CONFERENCIA': 'Em Conferência',
    'CONFERIDO_OK': 'Conferido OK',
    'CONFERIDO_DIVERGENCIA': 'Conferido c/ Divergência',
    'BLOQUEADO': 'Bloqueado'
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden p-3">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h1 className="text-sm font-semibold text-gray-800">Relatórios</h1>
      </div>

      {/* Abas */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setActiveTab('estatisticas')}
          className={`h-7 px-3 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'estatisticas'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Estatísticas Avançadas
        </button>
        <button
          onClick={() => setActiveTab('filial')}
          className={`h-7 px-3 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'filial'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Por Filial
        </button>
      </div>

      {/* Aba Estatísticas Avançadas */}
      {activeTab === 'estatisticas' && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 flex-1 flex flex-col min-h-0 overflow-hidden">
          {loadingStats ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : estatisticas ? (
            <div className="p-4 overflow-y-auto">
              {/* Cards Gerais */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <FiBarChart2 className="text-blue-600" size={14} />
                    <p className="text-xs text-blue-600 font-medium">Total de NFs</p>
                  </div>
                  <p className="text-xl font-bold text-blue-900">{estatisticas.geral.totalNotas}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <FiCheckCircle className="text-green-600" size={14} />
                    <p className="text-xs text-green-600 font-medium">Conferidas</p>
                  </div>
                  <p className="text-xl font-bold text-green-900">{estatisticas.geral.notasConferidas}</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <FiAlertCircle className="text-yellow-600" size={14} />
                    <p className="text-xs text-yellow-600 font-medium">Pendentes</p>
                  </div>
                  <p className="text-xl font-bold text-yellow-900">{estatisticas.geral.notasPendentes}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <FiCheckCircle className="text-purple-600" size={14} />
                    <p className="text-xs text-purple-600 font-medium">Taxa Conferência</p>
                  </div>
                  <p className="text-xl font-bold text-purple-900">{estatisticas.geral.taxaConferencia}%</p>
                </div>
              </div>

              {/* Estatísticas por Filial */}
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                  <FiClock size={14} />
                  Desempenho por Filial
                </h2>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-2 py-1 text-left text-xs font-semibold text-gray-600 uppercase">Filial</th>
                        <th className="px-2 py-1 text-center text-xs font-semibold text-gray-600 uppercase">Total NFs</th>
                        <th className="px-2 py-1 text-center text-xs font-semibold text-gray-600 uppercase">Conferidas</th>
                        <th className="px-2 py-1 text-center text-xs font-semibold text-gray-600 uppercase">Taxa</th>
                        <th className="px-2 py-1 text-center text-xs font-semibold text-gray-600 uppercase">Tempo Médio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estatisticas.porFilial.map((filial) => (
                        <tr key={filial.filialId} className="border-b border-gray-100 hover:bg-white">
                          <td className="px-2 py-1 text-xs font-medium text-gray-900">
                            {filial.nome} <span className="text-gray-500">({filial.codigo})</span>
                          </td>
                          <td className="px-2 py-1 text-xs text-center text-gray-900">{filial.total}</td>
                          <td className="px-2 py-1 text-xs text-center text-green-600 font-medium">{filial.conferidas}</td>
                          <td className="px-2 py-1 text-xs text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              filial.total > 0 && (filial.conferidas / filial.total) >= 0.8
                                ? 'bg-green-100 text-green-800'
                                : filial.total > 0 && (filial.conferidas / filial.total) >= 0.5
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {filial.total > 0 ? Math.round((filial.conferidas / filial.total) * 100) : 0}%
                            </span>
                          </td>
                          <td className="px-2 py-1 text-xs text-center text-gray-600">
                            {filial.tempoMedioHoras > 0 ? `${filial.tempoMedioHoras}h` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Estatísticas por Status */}
              <div>
                <h2 className="text-sm font-semibold text-gray-800 mb-2">📋 Distribuição por Status</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {estatisticas.porStatus.map((item) => (
                    <div key={item.status} className="bg-gray-50 rounded-md p-2 text-center">
                      <p className="text-lg font-bold text-gray-800">{item.count}</p>
                      <p className="text-xs text-gray-600">{statusLabels[item.status] || item.status}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <FiBarChart2 size={36} className="mb-3" />
              <p className="text-xs">Erro ao carregar estatísticas</p>
            </div>
          )}
        </div>
      )}

      {/* Aba Por Filial */}
      {activeTab === 'filial' && (
        <div className="bg-white rounded-lg shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="p-3 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-400" size={14} />
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Selecione a Filial de Recebimento
                </label>
                <select
                  value={filialSelecionada}
                  onChange={(e) => setFilialSelecionada(e.target.value)}
                  className="w-full max-w-md h-7 px-2 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                >
                  <option value="">Selecione uma filial...</option>
                  {filiais.map(filial => (
                    <option key={filial.id} value={filial.id}>
                      {filial.nome} ({filial.codigo})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filialSelecionada && notas.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                <div className="bg-blue-50 rounded-md p-2">
                  <p className="text-xs text-blue-600 font-medium">Total de NFs</p>
                  <p className="text-lg font-bold text-blue-900">{notas.length}</p>
                </div>
                <div className="bg-green-50 rounded-md p-2">
                  <p className="text-xs text-green-600 font-medium">Valor Total</p>
                  <p className="text-lg font-bold text-green-900">{formatCurrency(valorTotal)}</p>
                </div>
                <div className="bg-purple-50 rounded-md p-2">
                  <p className="text-xs text-purple-600 font-medium">Total de Volumes</p>
                  <p className="text-lg font-bold text-purple-900">{volumesTotal}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : !filialSelecionada ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <FiBarChart2 size={36} className="mb-3" />
                <p className="text-xs">Selecione uma filial para visualizar o relatório</p>
              </div>
            ) : notas.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <FiBarChart2 size={36} className="mb-3" />
                <p className="text-xs">Nenhuma nota fiscal encontrada para esta filial</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="sticky top-0 z-10 bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="px-2 py-1 text-left text-xs font-semibold text-gray-600 uppercase">NF</th>
                    <th className="px-2 py-1 text-left text-xs font-semibold text-gray-600 uppercase">Fornecedor</th>
                    <th className="px-2 py-1 text-left text-xs font-semibold text-gray-600 uppercase">Data Recebimento</th>
                    <th className="px-2 py-1 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-2 py-1 text-right text-xs font-semibold text-gray-600 uppercase">Volumes</th>
                    <th className="px-2 py-1 text-right text-xs font-semibold text-gray-600 uppercase">Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  {notas.map((nf) => (
                    <tr key={nf.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-2 py-1 text-xs font-medium text-gray-900">NF {nf.numero}</td>
                      <td className="px-2 py-1 text-xs text-gray-600">{nf.fornecedorNome}</td>
                      <td className="px-2 py-1 text-xs text-gray-600">{formatDate(nf.dataRecebimento)}</td>
                      <td className="px-2 py-1 text-xs">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          nf.status === 'CONFERIDO_OK' ? 'bg-green-100 text-green-800' :
                          nf.status === 'VOLUMES_CONFERIDOS' ? 'bg-blue-100 text-blue-800' :
                          nf.status === 'CONFERIDO_DIVERGENCIA' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {statusLabels[nf.status] || nf.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-2 py-1 text-xs text-right text-gray-900">{nf.quantidadeVolumes}</td>
                      <td className="px-2 py-1 text-xs text-right font-medium text-gray-900">{formatCurrency(nf.valorTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
