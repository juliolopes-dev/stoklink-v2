import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiPackage, FiSearch, FiEye, FiCalendar, FiMapPin, FiUser, FiHash } from 'react-icons/fi'
import { api } from '../../services/api'
import { Loading } from '../../components/Loading'

interface PedidoDRP {
  id: number
  numero_pedido: string
  numero_nf_origem: string
  cod_filial_destino: string
  nome_filial_destino: string | null
  data_pedido: string | null
  status: string | null
  usuario: string | null
  observacao: string | null
  total_itens: number | null
  total_quantidade: number | null
  created_at: string | null
}

const statusConfig: Record<string, { label: string; color: string }> = {
  'PENDENTE': { label: 'Pendente', color: 'bg-amber-100 text-amber-700' },
  'EM_PROCESSAMENTO': { label: 'Em Processamento', color: 'bg-blue-100 text-blue-700' },
  'CONCLUIDO': { label: 'Concluído', color: 'bg-emerald-100 text-emerald-700' },
  'CANCELADO': { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
}

function formatDateShort(dateString: string | null): string {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export function PedidosDRP() {
  const [pedidos, setPedidos] = useState<PedidoDRP[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [filialFilter, setFilialFilter] = useState('')
  const filiais = [
    { codigo: '00', nome: 'Petrolina' },
    { codigo: '01', nome: 'Juazeiro' },
    { codigo: '02', nome: 'Salgueiro' },
    { codigo: '04', nome: 'Filial 04' },
    { codigo: '05', nome: 'Bonfim' },
    { codigo: '06', nome: 'Picos' }
  ]

  useEffect(() => {
    loadPedidos()
  }, [statusFilter, filialFilter])

  async function loadPedidos() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (filialFilter) params.append('codFilialDestino', filialFilter)
      if (searchTerm) params.append('numeroPedido', searchTerm)

      const response = await api.get(`/pedidos-drp?${params.toString()}`)
      setPedidos(response.data)
    } catch (error) {
      console.error('Erro ao carregar pedidos DRP:', error)
      setPedidos([])
    } finally {
      setLoading(false)
    }
  }

  function handleSearch() {
    loadPedidos()
  }

  const filteredPedidos = pedidos.filter(pedido => {
    if (!searchTerm) return true
    const termo = searchTerm.toLowerCase()
    return (
      pedido.numero_pedido?.toLowerCase().includes(termo) ||
      pedido.numero_nf_origem?.toLowerCase().includes(termo) ||
      pedido.nome_filial_destino?.toLowerCase().includes(termo)
    )
  })

  if (loading) {
    return <Loading size="lg" text="Carregando pedidos DRP..." fullScreen />
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg">
            <FiPackage className="text-slate-600" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Pedidos DRP</h1>
            <p className="text-sm text-slate-500">Gerenciamento de pedidos de distribuição</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">
            {filteredPedidos.length} pedido(s)
          </span>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Busca */}
          <div className="flex-1 max-w-md relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por número do pedido ou NF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          {/* Filtro de Filial */}
          <select
            value={filialFilter}
            onChange={(e) => setFilialFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          >
            <option value="">Todas as filiais</option>
            {filiais.map(f => (
              <option key={f.codigo} value={f.codigo}>
                {f.codigo} - {f.nome}
              </option>
            ))}
          </select>

          {/* Filtro de Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          >
            <option value="">Todos os status</option>
            {Object.entries(statusConfig).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>

          {/* Botão de busca */}
          <button
            onClick={handleSearch}
            className="h-9 px-4 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <FiSearch size={14} />
            Buscar
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="flex-1 bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col">
        {filteredPedidos.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8">
            <FiPackage size={48} className="mb-4 text-slate-300" />
            <p className="text-lg font-medium">Nenhum pedido DRP encontrado</p>
            <p className="text-sm">Os pedidos aparecerão aqui quando forem criados</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Pedido
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      NF Origem
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Filial Destino
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Itens
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Qtd Total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPedidos.map((pedido) => {
                    const statusInfo = statusConfig[pedido.status || ''] || { 
                      label: pedido.status || 'Sem status', 
                      color: 'bg-slate-100 text-slate-600' 
                    }

                    return (
                      <tr key={pedido.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FiHash size={14} className="text-slate-400" />
                            <span className="font-medium text-slate-800">{pedido.numero_pedido}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-slate-600">{pedido.numero_nf_origem || '-'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FiMapPin size={14} className="text-slate-400" />
                            <div>
                              <span className="text-sm font-medium text-slate-700">{pedido.cod_filial_destino}</span>
                              {pedido.nome_filial_destino && (
                                <span className="text-sm text-slate-500"> - {pedido.nome_filial_destino}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FiCalendar size={14} className="text-slate-400" />
                            <span className="text-sm text-slate-600">{formatDateShort(pedido.data_pedido)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FiUser size={14} className="text-slate-400" />
                            <span className="text-sm text-slate-600">{pedido.usuario || '-'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-medium text-slate-700">{pedido.total_itens || 0}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-medium text-slate-700">
                            {pedido.total_quantidade?.toLocaleString('pt-BR') || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to={`/pedidos-drp/${pedido.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 border border-slate-200 hover:border-slate-300 rounded-lg transition-colors"
                          >
                            <FiEye size={14} />
                            Detalhes
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
