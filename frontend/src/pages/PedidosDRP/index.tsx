import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiPackage, FiSearch, FiEye, FiCalendar, FiMapPin, FiUser, FiHash } from 'react-icons/fi'
import { api } from '../../services/api'
import { Loading } from '../../components/Loading'

interface PedidoDRP {
  id: number
  numero_pedido: string
  numero_nf_origem: string
  cod_fornecedor: string | null
  nome_fornecedor: string | null
  cod_filial_destino: string
  nome_filial_destino: string | null
  data_pedido: string | null
  status: string | null
  usuario: string | null
  numero_transferencia: string | null
  observacao: string | null
  total_itens: number | null
  total_quantidade: number | null
  created_at: string | null
}

const statusConfig: Record<string, { label: string; color: string }> = {
  'PENDENTE': { label: 'Pendente', color: 'bg-amber-100 text-amber-700' },
  'EM_PROCESSAMENTO': { label: 'Em Processamento', color: 'bg-blue-100 text-blue-700' },
  'SEPARACAO_INICIADA': { label: 'Separação Iniciada', color: 'bg-indigo-100 text-indigo-700' },
  'SEPARACAO_FINALIZADA': { label: 'Separação Finalizada', color: 'bg-sky-100 text-sky-700' },
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
    <div className="h-screen flex flex-col overflow-hidden p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gray-100 rounded-md">
            <FiPackage className="text-gray-600" size={16} />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-800">Pedidos DRP</h1>
            <p className="text-xs text-gray-500">Gerenciamento de pedidos de distribuição</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {filteredPedidos.length} pedido(s)
          </span>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 mb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          {/* Busca */}
          <div className="flex-1 max-w-md relative">
            <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Buscar por número do pedido ou NF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="h-7 w-full pl-8 pr-2 border border-gray-300 rounded-md text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Filtro de Filial */}
          <select
            value={filialFilter}
            onChange={(e) => setFilialFilter(e.target.value)}
            className="h-7 px-2 border border-gray-300 rounded-md text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
            className="h-7 px-2 border border-gray-300 rounded-md text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
            className="h-7 px-3 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded-md transition-colors flex items-center gap-1.5"
          >
            <FiSearch size={12} />
            Buscar
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="flex-1 bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden flex flex-col">
        {filteredPedidos.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8">
            <FiPackage size={36} className="mb-3 text-gray-300" />
            <p className="text-sm font-medium">Nenhum pedido DRP encontrado</p>
            <p className="text-xs">Os pedidos aparecerão aqui quando forem criados</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Pedido
                    </th>
                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      NF Origem
                    </th>
                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Filial Destino
                    </th>
                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Data
                    </th>
                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Usuário
                    </th>
                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Nº Transferência
                    </th>
                    <th className="px-2 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Itens
                    </th>
                    <th className="px-2 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Qtd Total
                    </th>
                    <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-2 py-1 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPedidos.map((pedido) => {
                    const statusInfo = statusConfig[pedido.status || ''] || { 
                      label: pedido.status || 'Sem status', 
                      color: 'bg-slate-100 text-slate-600' 
                    }

                    return (
                      <tr key={pedido.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                        <td className="px-2 py-1.5">
                          <div className="flex items-center gap-1.5">
                            <FiHash size={12} className="text-gray-400" />
                            <span className="font-medium text-xs text-gray-900">{pedido.numero_pedido}</span>
                          </div>
                        </td>
                        <td className="px-2 py-1.5">
                          <div>
                            <span className="text-xs font-medium text-gray-900">{pedido.numero_nf_origem || '-'}</span>
                            {pedido.nome_fornecedor && (
                              <span className="text-xs text-gray-500"> - {pedido.nome_fornecedor}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-1.5">
                          <div className="flex items-center gap-1.5">
                            <FiMapPin size={12} className="text-gray-400" />
                            <div>
                              <span className="text-xs font-medium text-gray-900">{pedido.cod_filial_destino}</span>
                              {pedido.nome_filial_destino && (
                                <span className="text-xs text-gray-500"> - {pedido.nome_filial_destino}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-1.5">
                          <div className="flex items-center gap-1.5">
                            <FiCalendar size={12} className="text-gray-400" />
                            <span className="text-xs text-gray-900">{formatDateShort(pedido.data_pedido)}</span>
                          </div>
                        </td>
                        <td className="px-2 py-1.5">
                          <div className="flex items-center gap-1.5">
                            <FiUser size={12} className="text-gray-400" />
                            <span className="text-xs text-gray-900">{pedido.usuario || '-'}</span>
                          </div>
                        </td>
                        <td className="px-2 py-1.5">
                          <span className="text-xs text-gray-900">{pedido.numero_transferencia || '-'}</span>
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <span className="text-xs font-medium text-gray-900">{pedido.total_itens || 0}</span>
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <span className="text-xs font-medium text-gray-900">
                            {pedido.total_quantidade?.toLocaleString('pt-BR') || 0}
                          </span>
                        </td>
                        <td className="px-2 py-1.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          <Link
                            to={`/pedidos-drp/${pedido.id}`}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
                          >
                            <FiEye size={12} />
                            Ver
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
