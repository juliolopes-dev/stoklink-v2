import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiTruck, FiFilter, FiSend, FiCheck, FiX, FiEye } from 'react-icons/fi'
import { api } from '../../services/api'
import { useModal } from '../../contexts/ModalContext'

interface Distribuicao {
  id: string
  urgente: boolean
  status: string
  observacoes: string | null
  dataDistribuicao: string | null
  createdAt: string
  notaFiscal: {
    id: string
    numero: string
    fornecedorNome: string
  }
  filialOrigem: {
    nome: string
    codigo: string
  }
  filialDestino: {
    nome: string
    codigo: string
  }
}

interface Resumo {
  total: number
  pendentes: number
  emTransito: number
  entregues: number
  urgentes: number
}

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDENTE: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  EM_TRANSITO: { label: 'Em Trânsito', color: 'bg-blue-100 text-blue-800' },
  ENTREGUE: { label: 'Entregue', color: 'bg-green-100 text-green-800' },
  CANCELADO: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800' }
}

export function Distribuicoes() {
  const { confirm } = useModal()
  const [distribuicoes, setDistribuicoes] = useState<Distribuicao[]>([])
  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroUrgente, setFiltroUrgente] = useState('')

  useEffect(() => {
    loadData()
  }, [filtroStatus, filtroUrgente])

  async function loadData() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroStatus) params.append('status', filtroStatus)
      if (filtroUrgente) params.append('urgente', filtroUrgente)

      const [distRes, resumoRes] = await Promise.all([
        api.get(`/distribuicoes?${params.toString()}`),
        api.get('/distribuicoes/resumo')
      ])

      setDistribuicoes(distRes.data)
      setResumo(resumoRes.data)
    } catch (error) {
      console.error('Erro ao carregar distribuições:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleEnviar(id: string) {
    try {
      await api.post(`/distribuicoes/${id}/enviar`)
      loadData()
    } catch (error) {
      console.error('Erro ao enviar distribuição:', error)
    }
  }

  async function handleReceber(id: string) {
    try {
      await api.post(`/distribuicoes/${id}/receber`)
      loadData()
    } catch (error) {
      console.error('Erro ao confirmar recebimento:', error)
    }
  }

  async function handleCancelar(id: string) {
    const confirmed = await confirm('Cancelar distribuição', 'Deseja realmente cancelar esta distribuição?')
    if (!confirmed) return
    
    try {
      await api.post(`/distribuicoes/${id}/cancelar`, {
        motivo: 'Cancelado pelo usuário'
      })
      loadData()
    } catch (error) {
      console.error('Erro ao cancelar distribuição:', error)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Distribuições</h1>
      </div>

      {resumo && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-800">{resumo.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Pendentes</p>
            <p className="text-2xl font-bold text-yellow-600">{resumo.pendentes}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Em Trânsito</p>
            <p className="text-2xl font-bold text-blue-600">{resumo.emTransito}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Entregues</p>
            <p className="text-2xl font-bold text-green-600">{resumo.entregues}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Urgentes</p>
            <p className="text-2xl font-bold text-red-600">{resumo.urgentes}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <FiFilter className="text-gray-400" />
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="">Todos os status</option>
              <option value="PENDENTE">Pendente</option>
              <option value="EM_TRANSITO">Em Trânsito</option>
              <option value="ENTREGUE">Entregue</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
            <select
              value={filtroUrgente}
              onChange={(e) => setFiltroUrgente(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="">Todas</option>
              <option value="true">Urgentes</option>
              <option value="false">Normais</option>
            </select>
          </div>
        </div>

        {distribuicoes.length === 0 ? (
          <div className="p-12 text-center">
            <FiTruck size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Nenhuma distribuição encontrada</p>
          </div>
        ) : (
          <div>
            {distribuicoes.map((dist) => {
              const config = statusConfig[dist.status] || statusConfig.PENDENTE

              return (
                <div key={dist.id} className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${dist.urgente ? 'bg-red-50' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
                          {config.label}
                        </span>
                        {dist.urgente && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            URGENTE
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-gray-800 mb-2">
                        <span className="font-medium">{dist.filialOrigem.nome}</span>
                        <FiTruck className="text-gray-400" />
                        <span className="font-medium">{dist.filialDestino.nome}</span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <Link
                          to={`/notas-fiscais/${dist.notaFiscal.id}`}
                          className="hover:text-primary-600"
                        >
                          NF {dist.notaFiscal.numero}
                        </Link>
                        <span>{dist.notaFiscal.fornecedorNome}</span>
                        <span>Criado: {formatDate(dist.createdAt)}</span>
                        {dist.dataDistribuicao && (
                          <span>Enviado: {formatDate(dist.dataDistribuicao)}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {dist.status === 'PENDENTE' && (
                        <>
                          <button
                            onClick={() => handleEnviar(dist.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                          >
                            <FiSend />
                            Enviar
                          </button>
                          <button
                            onClick={() => handleCancelar(dist.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm"
                          >
                            <FiX />
                            Cancelar
                          </button>
                        </>
                      )}
                      {dist.status === 'EM_TRANSITO' && (
                        <button
                          onClick={() => handleReceber(dist.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
                        >
                          <FiCheck />
                          Confirmar Recebimento
                        </button>
                      )}
                      <Link
                        to={`/notas-fiscais/${dist.notaFiscal.id}`}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <FiEye />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
