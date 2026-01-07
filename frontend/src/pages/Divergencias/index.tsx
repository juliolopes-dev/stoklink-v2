import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiAlertTriangle, FiCheck, FiFilter, FiEye } from 'react-icons/fi'
import { api } from '../../services/api'

interface Divergencia {
  id: string
  tipo: string
  descricao: string
  quantidadeEsperada: number | null
  quantidadeRecebida: number | null
  resolvida: boolean
  dataResolucao: string | null
  createdAt: string
  notaFiscal: {
    id: string
    numero: string
    fornecedorNome: string
  }
  itemNotaFiscal: {
    codigoProduto: string
    descricao: string
  } | null
}

interface Resumo {
  total: number
  pendentes: number
  resolvidas: number
  porTipo: { tipo: string; quantidade: number }[]
}

export function Divergencias() {
  const [divergencias, setDivergencias] = useState<Divergencia[]>([])
  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [loading, setLoading] = useState(true)
  const [filtroResolvida, setFiltroResolvida] = useState<string>('')
  const [resolvendoId, setResolvendoId] = useState<string | null>(null)
  const [observacaoResolucao, setObservacaoResolucao] = useState('')

  useEffect(() => {
    loadData()
  }, [filtroResolvida])

  // Recarregar dados quando a página fica visível novamente
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [filtroResolvida])

  async function loadData() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroResolvida) params.append('resolvida', filtroResolvida)

      const [divRes, resumoRes] = await Promise.all([
        api.get(`/divergencias?${params.toString()}`),
        api.get('/divergencias/resumo')
      ])

      setDivergencias(divRes.data)
      setResumo(resumoRes.data)
    } catch (error) {
      console.error('Erro ao carregar divergências:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleResolver(id: string) {
    try {
      await api.put(`/divergencias/${id}/resolver`, {
        observacoesResolucao: observacaoResolucao || undefined
      })
      setResolvendoId(null)
      setObservacaoResolucao('')
      loadData()
    } catch (error) {
      console.error('Erro ao resolver divergência:', error)
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
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
    <div className="flex flex-col h-[calc(100vh-2rem)] overflow-hidden p-6">
      {resumo && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-800">{resumo.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Pendentes</p>
            <p className="text-2xl font-bold text-red-600">{resumo.pendentes}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Resolvidas</p>
            <p className="text-2xl font-bold text-green-600">{resumo.resolvidas}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Por Tipo</p>
            <div className="flex gap-2 mt-1">
              {resumo.porTipo.map(t => (
                <span key={t.tipo} className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {t.tipo}: {t.quantidade}
                </span>
              ))}
              {resumo.porTipo.length === 0 && <span className="text-gray-400">-</span>}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FiAlertTriangle size={20} />
              Divergências
            </h1>
            <div className="flex items-center gap-4">
              <FiFilter className="text-gray-400" />
              <select
                value={filtroResolvida}
                onChange={(e) => setFiltroResolvida(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              >
                <option value="">Todas</option>
                <option value="false">Pendentes</option>
                <option value="true">Resolvidas</option>
              </select>
            </div>
          </div>
        </div>

        {divergencias.length === 0 ? (
          <div className="p-12 text-center">
            <FiAlertTriangle size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Nenhuma divergência encontrada</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {divergencias.map((div) => (
              <div key={div.id} className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        div.tipo === 'SOBRA' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {div.tipo}
                      </span>
                      <span className={`text-xs ${div.resolvida ? 'text-green-600' : 'text-red-600'}`}>
                        {div.resolvida ? 'Resolvida' : 'Pendente'}
                      </span>
                    </div>
                    
                    <p className="text-gray-800 mb-1">{div.descricao}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <Link 
                        to={`/notas-fiscais/${div.notaFiscal.id}`}
                        className="hover:text-primary-600"
                      >
                        NF {div.notaFiscal.numero}
                      </Link>
                      <span>{div.notaFiscal.fornecedorNome}</span>
                      <span>{formatDate(div.createdAt)}</span>
                    </div>

                    {div.quantidadeEsperada !== null && (
                      <p className="text-sm text-gray-500 mt-1">
                        Esperado: {div.quantidadeEsperada} | Recebido: {div.quantidadeRecebida}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!div.resolvida && (
                      resolvendoId === div.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={observacaoResolucao}
                            onChange={(e) => setObservacaoResolucao(e.target.value)}
                            placeholder="Observação (opcional)"
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-48"
                          />
                          <button
                            onClick={() => handleResolver(div.id)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => {
                              setResolvendoId(null)
                              setObservacaoResolucao('')
                            }}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setResolvendoId(div.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
                        >
                          <FiCheck />
                          Resolver
                        </button>
                      )
                    )}
                    <Link
                      to={`/notas-fiscais/${div.notaFiscal.id}`}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <FiEye />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
