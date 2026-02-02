import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiPackage, FiCalendar, FiMapPin, FiUser, FiHash, FiFileText, FiBox, FiEdit2, FiCheck, FiX, FiTrash2 } from 'react-icons/fi'
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
  numero_transferencia: string | null
  total_itens: number | null
  total_quantidade: number | null
  created_at: string | null
  updated_at: string | null
  itens?: PedidoDRPItem[]
}

const statusConfig: Record<string, { label: string; color: string }> = {
  'PENDENTE': { label: 'Pendente', color: 'bg-amber-100 text-amber-700' },
  'EM_PROCESSAMENTO': { label: 'Em Processamento', color: 'bg-blue-100 text-blue-700' },
  'SEPARACAO_FINALIZADA': { label: 'Separação Finalizada', color: 'bg-sky-100 text-sky-700' },
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
  const [editandoTransferencia, setEditandoTransferencia] = useState(false)
  const [numeroTransferencia, setNumeroTransferencia] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    loadPedido()
  }, [id])

  async function loadPedido() {
    if (!id) return
    setLoading(true)
    try {
      const response = await api.get(`/pedidos-drp/${id}`)
      setPedido(response.data)
      setNumeroTransferencia(response.data.numero_transferencia || '')
    } catch (error) {
      console.error('Erro ao carregar pedido DRP:', error)
      navigate('/pedidos-drp')
    } finally {
      setLoading(false)
    }
  }

  async function salvarNumeroTransferencia() {
    if (!id || !pedido) return
    setSalvando(true)
    try {
      await api.put(`/pedidos-drp/${id}`, {
        numero_transferencia: numeroTransferencia || null
      })
      setPedido({ ...pedido, numero_transferencia: numeroTransferencia || null })
      setEditandoTransferencia(false)
    } catch (error) {
      console.error('Erro ao salvar número de transferência:', error)
      alert('Erro ao salvar número de transferência')
    } finally {
      setSalvando(false)
    }
  }

  async function excluirPedido() {
    if (!id || !pedido) return
    const confirmar = window.confirm(`Deseja excluir o Pedido DRP #${pedido.numero_pedido}? Esta ação não pode ser desfeita.`)
    if (!confirmar) return

    setSalvando(true)
    try {
      await api.delete(`/pedidos-drp/${id}`)
      navigate('/pedidos-drp')
    } catch (error) {
      console.error('Erro ao excluir pedido:', error)
      alert('Erro ao excluir pedido')
    } finally {
      setSalvando(false)
    }
  }

  async function alterarStatus(novoStatus: string) {
    if (!id || !pedido) return
    setSalvando(true)
    try {
      await api.put(`/pedidos-drp/${id}`, { status: novoStatus })
      setPedido({ ...pedido, status: novoStatus })
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      alert('Erro ao alterar status')
    } finally {
      setSalvando(false)
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
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FiArrowLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-800">
              Pedido #{pedido.numero_pedido}
            </h1>
            <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            NF Origem: {pedido.numero_nf_origem || '-'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão Excluir */}
          <button
            onClick={excluirPedido}
            disabled={salvando}
            className="h-9 px-3 border border-red-200 text-red-700 hover:bg-red-50 text-sm font-medium rounded-md transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiTrash2 size={16} />
            Excluir
          </button>

          {/* Botão Finalizar Separação */}
          {pedido.status !== 'SEPARACAO_FINALIZADA' && pedido.status !== 'CONCLUIDO' && (
            <button
              onClick={() => alterarStatus('SEPARACAO_FINALIZADA')}
              disabled={salvando}
              className="h-9 px-4 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-md transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiCheck size={16} />
              {salvando ? 'Salvando...' : 'Finalizar Separação'}
            </button>
          )}
        </div>
      </div>

      {/* Grid de informações */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 flex-shrink-0">
        {/* Dados do Pedido */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <FiFileText size={16} className="text-gray-500" />
            Dados do Pedido
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FiHash size={14} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Número do Pedido</p>
                <p className="text-sm font-medium text-gray-900">{pedido.numero_pedido}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FiCalendar size={14} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Data do Pedido</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(pedido.data_pedido)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FiUser size={14} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Usuário</p>
                <p className="text-sm font-medium text-gray-900">{pedido.usuario || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Destino */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <FiMapPin size={16} className="text-gray-500" />
            Destino
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Código Filial</p>
              <p className="text-sm font-medium text-gray-900">{pedido.cod_filial_destino}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Nome Filial</p>
              <p className="text-sm font-medium text-gray-900">{pedido.nome_filial_destino || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Nº Transferência</p>
              {editandoTransferencia ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={numeroTransferencia}
                    onChange={(e) => setNumeroTransferencia(e.target.value)}
                    placeholder="Digite o número"
                    className="h-9 flex-1 px-3 border border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    autoFocus
                  />
                  <button
                    onClick={salvarNumeroTransferencia}
                    disabled={salvando}
                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors disabled:opacity-50"
                    title="Salvar"
                  >
                    <FiCheck size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setNumeroTransferencia(pedido.numero_transferencia || '')
                      setEditandoTransferencia(false)
                    }}
                    disabled={salvando}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                    title="Cancelar"
                  >
                    <FiX size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 flex-1">
                    {pedido.numero_transferencia || '-'}
                  </p>
                  <button
                    onClick={() => setEditandoTransferencia(true)}
                    className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    title="Editar"
                  >
                    <FiEdit2 size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Resumo */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <FiBox size={16} className="text-gray-500" />
            Resumo
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-800">{pedido.total_itens || 0}</p>
              <p className="text-xs text-gray-500">Itens</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-800">
                {pedido.total_quantidade?.toLocaleString('pt-BR') || 0}
              </p>
              <p className="text-xs text-gray-500">Quantidade Total</p>
            </div>
          </div>
          {pedido.observacao && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">Observação</p>
              <p className="text-sm text-gray-700">{pedido.observacao}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabela de Itens */}
      <div className="flex-1 bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <FiPackage size={16} className="text-gray-500" />
            Itens do Pedido ({filteredItens.length})
          </h2>
          <div className="relative max-w-xs">
            <input
              type="text"
              placeholder="Buscar item..."
              value={searchItem}
              onChange={(e) => setSearchItem(e.target.value)}
              className="h-9 w-full pl-9 pr-4 border border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <FiPackage className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          </div>
        </div>

        {filteredItens.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8">
            <FiBox size={48} className="mb-4 text-gray-300" />
            <p className="text-lg font-medium">Nenhum item encontrado</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide w-28">
                    Código
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Descrição
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wide w-28">
                    Quantidade
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wide w-28">
                    Necessidade
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wide w-28">
                    Estoque Filial
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide w-32">
                    Tipo Cálculo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredItens.map((item) => (
                  <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2">
                      <span className="font-mono text-sm text-gray-900">{item.cod_produto}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-sm text-gray-900">{item.descricao_produto || '-'}</span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className="text-sm font-medium text-gray-900">
                        {item.quantidade?.toLocaleString('pt-BR')}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className="text-sm text-gray-600">
                        {item.necessidade_original?.toLocaleString('pt-BR') || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className="text-sm text-gray-600">
                        {item.estoque_filial?.toLocaleString('pt-BR') || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-xs text-gray-500">{item.tipo_calculo || '-'}</span>
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
