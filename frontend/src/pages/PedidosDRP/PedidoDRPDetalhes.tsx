import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiPackage, FiCalendar, FiMapPin, FiUser, FiHash, FiFileText, FiBox } from 'react-icons/fi'
import { api } from '../../services/api'
import { Loading } from '../../components/Loading'

interface PedidoDRPItem {
  id: number
  pedido_id: number
  cod_produto: string
  descricao_produto: string | null
  quantidade: number
  tipo_calculo: string | null
  necessidade_original: number | null
  estoque_filial: number | null
  created_at: string | null
}

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
  updated_at: string | null
  itens?: PedidoDRPItem[]
}

const statusConfig: Record<string, { label: string; color: string }> = {
  'PENDENTE': { label: 'Pendente', color: 'bg-amber-100 text-amber-700' },
  'EM_PROCESSAMENTO': { label: 'Em Processamento', color: 'bg-blue-100 text-blue-700' },
  'CONCLUIDO': { label: 'Concluído', color: 'bg-emerald-100 text-emerald-700' },
  'CANCELADO': { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function PedidoDRPDetalhes() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [pedido, setPedido] = useState<PedidoDRP | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchItem, setSearchItem] = useState('')

  useEffect(() => {
    loadPedido()
  }, [id])

  async function loadPedido() {
    if (!id) return
    setLoading(true)
    try {
      const response = await api.get(`/pedidos-drp/${id}`)
      setPedido(response.data)
    } catch (error) {
      console.error('Erro ao carregar pedido DRP:', error)
      navigate('/pedidos-drp')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Loading size="lg" text="Carregando pedido DRP..." fullScreen />
  }

  if (!pedido) {
    return null
  }

  const statusInfo = statusConfig[pedido.status || ''] || { 
    label: pedido.status || 'Sem status', 
    color: 'bg-slate-100 text-slate-600' 
  }

  const filteredItens = (pedido.itens || []).filter(item => {
    if (!searchItem.trim()) return true
    const termo = searchItem.toLowerCase()
    return (
      item.cod_produto?.toLowerCase().includes(termo) ||
      item.descricao_produto?.toLowerCase().includes(termo)
    )
  })

  return (
    <div className="h-screen flex flex-col overflow-hidden p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4 flex-shrink-0">
        <button
          onClick={() => navigate('/pedidos-drp')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <FiArrowLeft size={20} className="text-slate-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-slate-800">
              Pedido #{pedido.numero_pedido}
            </h1>
            <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            NF Origem: {pedido.numero_nf_origem || '-'}
          </p>
        </div>
      </div>

      {/* Grid de informações */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 flex-shrink-0">
        {/* Dados do Pedido */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <FiFileText size={16} className="text-slate-500" />
            Dados do Pedido
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FiHash size={14} className="text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Número do Pedido</p>
                <p className="text-sm font-medium text-slate-800">{pedido.numero_pedido}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FiCalendar size={14} className="text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Data do Pedido</p>
                <p className="text-sm font-medium text-slate-800">{formatDate(pedido.data_pedido)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FiUser size={14} className="text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Usuário</p>
                <p className="text-sm font-medium text-slate-800">{pedido.usuario || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Destino */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <FiMapPin size={16} className="text-slate-500" />
            Destino
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-500">Código Filial</p>
              <p className="text-sm font-medium text-slate-800">{pedido.cod_filial_destino}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Nome Filial</p>
              <p className="text-sm font-medium text-slate-800">{pedido.nome_filial_destino || '-'}</p>
            </div>
          </div>
        </div>

        {/* Resumo */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <FiBox size={16} className="text-slate-500" />
            Resumo
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <p className="text-2xl font-bold text-slate-800">{pedido.total_itens || 0}</p>
              <p className="text-xs text-slate-500">Itens</p>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <p className="text-2xl font-bold text-slate-800">
                {pedido.total_quantidade?.toLocaleString('pt-BR') || 0}
              </p>
              <p className="text-xs text-slate-500">Quantidade Total</p>
            </div>
          </div>
          {pedido.observacao && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-500">Observação</p>
              <p className="text-sm text-slate-700">{pedido.observacao}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabela de Itens */}
      <div className="flex-1 bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <FiPackage size={16} className="text-slate-500" />
            Itens do Pedido ({filteredItens.length})
          </h2>
          <div className="relative max-w-xs">
            <input
              type="text"
              placeholder="Buscar item..."
              value={searchItem}
              onChange={(e) => setSearchItem(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
            <FiPackage className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          </div>
        </div>

        {filteredItens.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8">
            <FiBox size={48} className="mb-4 text-slate-300" />
            <p className="text-lg font-medium">Nenhum item encontrado</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-28">
                    Código
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider w-28">
                    Quantidade
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider w-28">
                    Necessidade
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider w-28">
                    Estoque Filial
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-32">
                    Tipo Cálculo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItens.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-slate-800">{item.cod_produto}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-700">{item.descricao_produto || '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-slate-800">
                        {item.quantidade?.toLocaleString('pt-BR')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-slate-600">
                        {item.necessidade_original?.toLocaleString('pt-BR') || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-slate-600">
                        {item.estoque_filial?.toLocaleString('pt-BR') || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-500">{item.tipo_calculo || '-'}</span>
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
