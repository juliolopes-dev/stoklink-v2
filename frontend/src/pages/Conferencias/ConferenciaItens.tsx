import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiCheck, FiSave } from 'react-icons/fi'
import { api } from '../../services/api'
import { StatusBadge } from '../../components/StatusBadge'

interface Item {
  id: string
  codigoProduto: string
  descricao: string
  unidade: string
  quantidadeNota: number
  quantidadeConferida: number | null
  conferido: boolean
}

interface NotaFiscal {
  id: string
  numero: string
  fornecedorNome: string
  status: string
  mercadoriaBloqueada: boolean
  itens: Item[]
}

interface ItemConferido {
  itemId: string
  quantidadeConferida: number
}

export function ConferenciaItens() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [nota, setNota] = useState<NotaFiscal | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [quantidades, setQuantidades] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadNota()
  }, [id])

  async function loadNota() {
    try {
      const response = await api.get(`/notas-fiscais/${id}`)
      setNota(response.data)
      
      // Inicializar quantidades com valores existentes ou da nota
      const qtds: Record<string, string> = {}
      response.data.itens.forEach((item: Item) => {
        qtds[item.id] = item.quantidadeConferida?.toString() || item.quantidadeNota.toString()
      })
      setQuantidades(qtds)
    } catch (error) {
      console.error('Erro ao carregar nota fiscal:', error)
      navigate('/conferencias')
    } finally {
      setLoading(false)
    }
  }

  function updateQuantidade(itemId: string, value: string) {
    setQuantidades(prev => ({ ...prev, [itemId]: value }))
  }

  async function handleSalvar(finalizar: boolean) {
    if (!nota) return

    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const itensConferidos: ItemConferido[] = nota.itens.map(item => ({
        itemId: item.id,
        quantidadeConferida: parseFloat(quantidades[item.id] || '0')
      }))

      await api.post(`/notas-fiscais/${id}/conferencia-itens`, {
        itensConferidos,
        finalizada: finalizar
      })

      if (finalizar) {
        setSuccess('Conferência finalizada com sucesso!')
        setTimeout(() => navigate('/notas-fiscais'), 1500)
      } else {
        setSuccess('Conferência salva! Você pode continuar depois.')
        loadNota()
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      setError(error.response?.data?.error || 'Erro ao salvar conferência')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!nota) return null

  const totalItens = nota.itens.length
  const itensConferidos = nota.itens.filter(i => i.conferido).length

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden p-3">
      <div className="flex items-center gap-3 mb-3 flex-shrink-0">
        <button
          onClick={() => navigate(`/notas-fiscais/${id}`)}
          className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
        >
          <FiArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <h1 className="text-sm font-semibold text-gray-800">Conferência de Itens</h1>
          <p className="text-xs text-gray-500">NF {nota.numero} - {nota.fornecedorNome}</p>
        </div>
        <StatusBadge status={nota.status} mercadoriaBloqueada={nota.mercadoriaBloqueada} />
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-3 py-2 rounded-md mb-3 text-xs flex-shrink-0">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 px-3 py-2 rounded-md mb-3 text-xs flex-shrink-0">
          {success}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="p-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div>
            <span className="text-xs text-gray-600">Progresso: </span>
            <span className="text-xs font-medium">{itensConferidos} / {totalItens} itens conferidos</span>
          </div>
          <div className="w-36 bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-primary-600 h-1.5 rounded-full transition-all"
              style={{ width: `${(itensConferidos / totalItens) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                <th className="px-2 py-1 text-right text-xs font-medium text-gray-500 uppercase">Qtd NF</th>
                <th className="px-2 py-1 text-center text-xs font-medium text-gray-500 uppercase w-28">Qtd Conferida</th>
                <th className="px-2 py-1 text-center text-xs font-medium text-gray-500 uppercase w-16">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {nota.itens.map((item) => {
                const qtdNota = item.quantidadeNota
                const qtdConf = parseFloat(quantidades[item.id] || '0')
                const divergente = qtdConf !== qtdNota

                return (
                  <tr key={item.id} className={divergente ? 'bg-red-50' : ''}>
                    <td className="px-2 py-1 text-xs font-mono">{item.codigoProduto}</td>
                    <td className="px-2 py-1 text-xs">{item.descricao}</td>
                    <td className="px-2 py-1 text-xs text-right">
                      {item.quantidadeNota} {item.unidade}
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="number"
                        value={quantidades[item.id] || ''}
                        onChange={(e) => updateQuantidade(item.id, e.target.value)}
                        className={`w-full h-7 px-2 text-xs border rounded-md text-center ${
                          divergente ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        step="0.001"
                        min="0"
                      />
                    </td>
                    <td className="px-2 py-1 text-center">
                      {item.conferido ? (
                        <span className="text-green-600"><FiCheck size={14} /></span>
                      ) : (
                        <span className="text-xs text-gray-300">-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-gray-200 flex justify-end gap-2 flex-shrink-0">
          <button
            onClick={() => navigate(`/notas-fiscais/${id}`)}
            className="h-7 px-3 text-xs border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => handleSalvar(false)}
            disabled={saving}
            className="flex items-center gap-1.5 h-7 px-3 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors disabled:opacity-50"
          >
            <FiSave size={12} />
            Salvar Parcial
          </button>
          <button
            onClick={() => handleSalvar(true)}
            disabled={saving}
            className="flex items-center gap-1.5 h-7 px-3 text-xs bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50"
          >
            <FiCheck size={12} />
            Finalizar Conferência
          </button>
        </div>
      </div>
    </div>
  )
}
