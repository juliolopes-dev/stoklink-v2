import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiPackage, FiCheckCircle, FiAlertCircle } from 'react-icons/fi'
import { api } from '../../services/api'
import { StatusBadge } from '../../components/StatusBadge'

interface NotaFiscal {
  id: string
  numero: string
  fornecedorNome: string
  dataRecebimento: string
  quantidadeVolumes: number
  status: string
  filialRecebimentoId: string | null
  filialDestinoId: string
  filialRecebimento: {
    nome: string
    codigo: string
  } | null
  filialDestino: {
    nome: string
    codigo: string
  }
}

export function Conferencias() {
  const [notas, setNotas] = useState<NotaFiscal[]>([])
  const [loading, setLoading] = useState(true)
  const [conferindoId, setConferindoId] = useState<string | null>(null)
  const [volumesRecebidos, setVolumesRecebidos] = useState('')
  const [resultado, setResultado] = useState<{ id: string; sucesso: boolean; mensagem: string } | null>(null)

  useEffect(() => {
    loadNotas()
  }, [])

  async function loadNotas() {
    setLoading(true)
    try {
      const response = await api.get('/notas-fiscais?limit=100')
      // Filtrar apenas NFs que podem ter volumes conferidos
      const nfs = response.data.data || []
      const pendentes = nfs.filter((nf: NotaFiscal) => 
        ['AGUARDANDO_CONFERENCIA', 'PENDENTE_TRANSFERENCIA', 'VOLUMES_DIVERGENTES'].includes(nf.status)
      )
      setNotas(pendentes)
    } catch (error) {
      console.error('Erro ao carregar notas fiscais:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleConferir(nf: NotaFiscal) {
    if (!volumesRecebidos) return

    try {
      const response = await api.post(`/notas-fiscais/${nf.id}/conferencia-volumes`, {
        volumesRecebidos: parseInt(volumesRecebidos)
      })

      const volumesBatendo = response.data.volumesBatendo

      setResultado({
        id: nf.id,
        sucesso: volumesBatendo,
        mensagem: volumesBatendo 
          ? `Volumes conferidos com sucesso! (${volumesRecebidos}/${nf.quantidadeVolumes})`
          : `Divergência detectada! Esperado: ${nf.quantidadeVolumes}, Recebido: ${volumesRecebidos}`
      })

      setConferindoId(null)
      setVolumesRecebidos('')
      
      // Recarregar lista após 2 segundos
      setTimeout(() => {
        setResultado(null)
        loadNotas()
      }, 2000)
    } catch (error) {
      console.error('Erro ao conferir volumes:', error)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden p-3">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h1 className="text-sm font-semibold text-gray-800">Conferência de Volumes</h1>
        <span className="text-xs text-gray-500">{notas.length} NF(s) pendente(s)</span>
      </div>

      {notas.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center flex-1">
          <FiCheckCircle size={36} className="mx-auto text-green-500 mb-3" />
          <h2 className="text-sm font-medium text-gray-800 mb-2">Tudo conferido!</h2>
          <p className="text-xs text-gray-500">Não há notas fiscais pendentes de conferência de volumes.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto space-y-3">
          {notas.map((nf) => (
            <div key={nf.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-3">
              {resultado?.id === nf.id && (
                <div className={`mb-3 p-3 rounded-lg ${resultado.sucesso ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  <div className="flex items-center gap-2 text-xs">
                    {resultado.sucesso ? <FiCheckCircle size={14} /> : <FiAlertCircle size={14} />}
                    {resultado.mensagem}
                  </div>
                </div>
              )}

              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-gray-800">NF {nf.numero}</h3>
                    <StatusBadge status={nf.status} />
                  </div>
                  <p className="text-xs text-gray-600 mb-1">{nf.fornecedorNome}</p>
                  <p className="text-xs text-gray-500">
                    {nf.filialRecebimento ? `Recebido em ${nf.filialRecebimento.nome}` : 'Filial a definir'} • {formatDate(nf.dataRecebimento)}
                  </p>
                  {nf.filialRecebimento && nf.filialRecebimentoId !== nf.filialDestinoId && (
                    <p className="text-xs text-purple-600 mt-1">
                      Destino: {nf.filialDestino.nome}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <div className="mb-3">
                    <p className="text-xs text-gray-500">Volumes Esperados</p>
                    <p className="text-xl font-bold text-gray-800">{nf.quantidadeVolumes}</p>
                  </div>

                  {conferindoId === nf.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={volumesRecebidos}
                        onChange={(e) => setVolumesRecebidos(e.target.value)}
                        placeholder="Qtd"
                        className="w-16 px-2 py-1 border border-gray-300 rounded-md text-center text-xs"
                        autoFocus
                        min="0"
                      />
                      <button
                        onClick={() => handleConferir(nf)}
                        disabled={!volumesRecebidos}
                        className="h-7 px-3 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50 text-xs"
                      >
                        OK
                      </button>
                      <button
                        onClick={() => {
                          setConferindoId(null)
                          setVolumesRecebidos('')
                        }}
                        className="h-7 px-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors text-xs"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setConferindoId(nf.id)
                          setVolumesRecebidos(nf.quantidadeVolumes.toString())
                        }}
                        className="flex items-center gap-1.5 h-7 px-3 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors text-xs"
                      >
                        <FiPackage size={12} />
                        Conferir
                      </button>
                      <Link
                        to={`/notas-fiscais/${nf.id}`}
                        className="h-7 px-3 border border-gray-300 hover:bg-gray-50 rounded-md transition-colors text-xs flex items-center"
                      >
                        Detalhes
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
