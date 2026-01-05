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
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(`/notas-fiscais/${id}`)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FiArrowLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">Conferência de Itens</h1>
          <p className="text-gray-500">NF {nota.numero} - {nota.fornecedorNome}</p>
        </div>
        <StatusBadge status={nota.status} />
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg mb-6">
          {success}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <span className="text-gray-600">Progresso: </span>
            <span className="font-medium">{itensConferidos} / {totalItens} itens conferidos</span>
          </div>
          <div className="w-48 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all"
              style={{ width: `${(itensConferidos / totalItens) * 100}%` }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qtd NF</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-32">Qtd Conferida</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-20">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {nota.itens.map((item) => {
                const qtdNota = item.quantidadeNota
                const qtdConf = parseFloat(quantidades[item.id] || '0')
                const divergente = qtdConf !== qtdNota

                return (
                  <tr key={item.id} className={divergente ? 'bg-red-50' : ''}>
                    <td className="px-4 py-3 text-sm font-mono">{item.codigoProduto}</td>
                    <td className="px-4 py-3 text-sm">{item.descricao}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      {item.quantidadeNota} {item.unidade}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={quantidades[item.id] || ''}
                        onChange={(e) => updateQuantidade(item.id, e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg text-center ${
                          divergente ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        step="0.001"
                        min="0"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.conferido ? (
                        <span className="text-green-600"><FiCheck size={20} /></span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end gap-4">
          <button
            onClick={() => navigate(`/notas-fiscais/${id}`)}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => handleSalvar(false)}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <FiSave />
            Salvar Parcial
          </button>
          <button
            onClick={() => handleSalvar(true)}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <FiCheck />
            Finalizar Conferência
          </button>
        </div>
      </div>
    </div>
  )
}
