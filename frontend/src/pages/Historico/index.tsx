import { useEffect, useState } from 'react'
import { FiClock, FiUser, FiFilter, FiRefreshCw } from 'react-icons/fi'
import { api } from '../../services/api'

interface AuditLog {
  id: string
  entidade: string
  entidadeId: string
  acao: string
  dadosAnteriores: Record<string, unknown> | null
  dadosNovos: Record<string, unknown> | null
  usuarioNome: string | null
  createdAt: string
  usuario: {
    id: string
    nome: string
    email: string
  }
}

const acaoLabels: Record<string, { label: string, color: string }> = {
  'CREATE': { label: 'Criação', color: 'bg-green-100 text-green-800' },
  'UPDATE': { label: 'Atualização', color: 'bg-blue-100 text-blue-800' },
  'DELETE': { label: 'Exclusão', color: 'bg-red-100 text-red-800' },
  'STATUS_CHANGE': { label: 'Alteração Status', color: 'bg-yellow-100 text-yellow-800' },
  'BLOQUEIO': { label: 'Bloqueio', color: 'bg-orange-100 text-orange-800' },
  'DESBLOQUEIO': { label: 'Desbloqueio', color: 'bg-teal-100 text-teal-800' },
  'CONFERENCIA': { label: 'Conferência', color: 'bg-purple-100 text-purple-800' }
}

const entidadeLabels: Record<string, string> = {
  'NotaFiscal': 'Nota Fiscal',
  'Usuario': 'Usuário',
  'Filial': 'Filial',
  'Fornecedor': 'Fornecedor',
  'Divergencia': 'Divergência',
  'ConferenciaVolume': 'Conferência Volume',
  'ConferenciaItem': 'Conferência Item'
}

export function Historico() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [entidadeFilter, setEntidadeFilter] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadLogs()
  }, [entidadeFilter])

  async function loadLogs(showRefresh = false) {
    if (showRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    try {
      const params = new URLSearchParams()
      if (entidadeFilter) params.append('entidade', entidadeFilter)
      
      const response = await api.get(`/audit-logs?${params.toString()}`)
      setLogs(response.data)
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  function formatChanges(dadosAnteriores: Record<string, unknown> | null, dadosNovos: Record<string, unknown> | null) {
    if (!dadosAnteriores && !dadosNovos) return null
    
    const changes: { campo: string, de: string, para: string }[] = []
    
    if (dadosNovos) {
      for (const [key, value] of Object.entries(dadosNovos)) {
        const valorAnterior = dadosAnteriores?.[key]
        if (valorAnterior !== value) {
          changes.push({
            campo: key,
            de: valorAnterior ? String(valorAnterior) : '-',
            para: String(value)
          })
        }
      }
    }
    
    return changes.length > 0 ? changes : null
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden p-3">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h1 className="text-sm font-semibold text-gray-800">Histórico de Alterações</h1>
        <button
          onClick={() => loadLogs(true)}
          disabled={refreshing}
          className="h-7 flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 rounded-md transition-colors text-xs disabled:opacity-50"
          title="Atualizar lista"
        >
          <FiRefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="p-3 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <FiFilter className="text-gray-400" size={14} />
            <select
              value={entidadeFilter}
              onChange={(e) => setEntidadeFilter(e.target.value)}
              className="h-7 border border-gray-300 rounded-md px-2 text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="">Todas as entidades</option>
              <option value="NotaFiscal">Notas Fiscais</option>
              <option value="Usuario">Usuários</option>
              <option value="Filial">Filiais</option>
              <option value="Fornecedor">Fornecedores</option>
              <option value="ConferenciaVolume">Conferências</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <FiClock size={36} className="mb-3" />
              <p className="text-xs">Nenhum registro de alteração encontrado</p>
              <p className="text-xs mt-1">O histórico aparecerá quando houver alterações no sistema</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {logs.map((log) => {
                const acaoInfo = acaoLabels[log.acao] || { label: log.acao, color: 'bg-gray-100 text-gray-800' }
                const changes = formatChanges(log.dadosAnteriores, log.dadosNovos)
                
                return (
                  <div key={log.id} className="p-3 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${acaoInfo.color}`}>
                            {acaoInfo.label}
                          </span>
                          <span className="text-xs font-medium text-gray-900">
                            {entidadeLabels[log.entidade] || log.entidade}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                          <FiUser size={12} />
                          <span>{log.usuario?.nome || log.usuarioNome || 'Sistema'}</span>
                          <span>•</span>
                          <span>{formatDate(log.createdAt)}</span>
                        </div>

                        {changes && changes.length > 0 && (
                          <div className="mt-1 bg-gray-50 rounded-md p-2 text-xs">
                            <p className="text-xs font-medium text-gray-500 mb-1">Alterações:</p>
                            {changes.slice(0, 5).map((change, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 text-gray-600">
                                <span className="font-medium">{change.campo}:</span>
                                <span className="text-red-600 line-through">{change.de}</span>
                                <span>→</span>
                                <span className="text-green-600">{change.para}</span>
                              </div>
                            ))}
                            {changes.length > 5 && (
                              <p className="text-xs text-gray-400 mt-1">+{changes.length - 5} alterações</p>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <span className="text-xs text-gray-400 font-mono">
                        {log.entidadeId.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
