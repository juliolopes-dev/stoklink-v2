import { useEffect, useState } from 'react'
import { FiBarChart2, FiFilter } from 'react-icons/fi'
import { api } from '../../services/api'

interface Filial {
  id: string
  nome: string
  codigo: string
}

interface NotaFiscalRelatorio {
  id: string
  numero: string
  fornecedorNome: string
  dataRecebimento: string
  status: string
  quantidadeVolumes: number
  valorTotal: number
  filialRecebimento: {
    nome: string
    codigo: string
  }
}

export function Relatorios() {
  const [filiais, setFiliais] = useState<Filial[]>([])
  const [filialSelecionada, setFilialSelecionada] = useState('')
  const [notas, setNotas] = useState<NotaFiscalRelatorio[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadFiliais()
  }, [])

  useEffect(() => {
    if (filialSelecionada) {
      loadRelatorio()
    }
  }, [filialSelecionada])

  async function loadFiliais() {
    try {
      const response = await api.get('/filiais/ativas')
      setFiliais(response.data)
    } catch (error) {
      console.error('Erro ao carregar filiais:', error)
    }
  }

  async function loadRelatorio() {
    setLoading(true)
    try {
      const response = await api.get(`/notas-fiscais/relatorio/filial/${filialSelecionada}`)
      setNotas(response.data)
    } catch (error) {
      console.error('Erro ao carregar relatório:', error)
    } finally {
      setLoading(false)
    }
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const valorTotal = notas.reduce((acc, nf) => acc + nf.valorTotal, 0)
  const volumesTotal = notas.reduce((acc, nf) => acc + nf.quantidadeVolumes, 0)

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] overflow-hidden p-6">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <FiBarChart2 size={24} />
          Relatórios
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-4">
            <FiFilter className="text-gray-400" />
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Selecione a Filial de Recebimento
              </label>
              <select
                value={filialSelecionada}
                onChange={(e) => setFilialSelecionada(e.target.value)}
                className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              >
                <option value="">Selecione uma filial...</option>
                {filiais.map(filial => (
                  <option key={filial.id} value={filial.id}>
                    {filial.nome} ({filial.codigo})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filialSelecionada && notas.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-blue-600 font-medium">Total de NFs</p>
                <p className="text-2xl font-bold text-blue-900">{notas.length}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-sm text-green-600 font-medium">Valor Total</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(valorTotal)}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <p className="text-sm text-purple-600 font-medium">Total de Volumes</p>
                <p className="text-2xl font-bold text-purple-900">{volumesTotal}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : !filialSelecionada ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <FiBarChart2 size={48} className="mb-4" />
              <p>Selecione uma filial para visualizar o relatório</p>
            </div>
          ) : notas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <FiBarChart2 size={48} className="mb-4" />
              <p>Nenhuma nota fiscal encontrada para esta filial</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">NF</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fornecedor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Data Recebimento</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Volumes</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Valor Total</th>
                </tr>
              </thead>
              <tbody>
                {notas.map((nf) => (
                  <tr key={nf.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">NF {nf.numero}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{nf.fornecedorNome}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(nf.dataRecebimento)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        nf.status === 'CONFERIDO_OK' ? 'bg-green-100 text-green-800' :
                        nf.status === 'VOLUMES_CONFERIDOS' ? 'bg-blue-100 text-blue-800' :
                        nf.status === 'CONFERIDO_DIVERGENCIA' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {nf.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">{nf.quantidadeVolumes}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{formatCurrency(nf.valorTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
