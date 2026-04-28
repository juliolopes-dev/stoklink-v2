import { useState } from 'react'
import { FiX, FiFileText, FiDownload } from 'react-icons/fi'
import { api } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'

const STATUS_OPTIONS = [
  { value: 'PENDENTE_TRANSFERENCIA', label: 'Em Trânsito' },
  { value: 'AGUARDANDO_CONFERENCIA_DESTINO', label: 'Aguard. Destino' },
  { value: 'VOLUMES_CONFERIDOS', label: 'Volumes Conferidos' },
  { value: 'CONFERIDO_OK', label: 'Processo Finalizado' },
  { value: 'CONFERIDO_DIVERGENCIA', label: 'Conferido c/ Divergência' },
  { value: 'SEPARACAO_FINALIZADA', label: 'Separação Finalizada' },
]

const RP_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'true', label: 'RP-SIM' },
  { value: 'false', label: 'RP-NÃO' },
]

const BLOQUEIO_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'false', label: 'Liberada' },
  { value: 'true', label: 'Bloqueada' },
]

interface Filial {
  id: string
  nome: string
  codigo: string
}

interface Props {
  filiais: Filial[]
  onFechar: () => void
}

export function ModalRelatorioNF({ filiais, onFechar }: Props) {
  const [statusSelecionados, setStatusSelecionados] = useState<string[]>([])
  const [filialId, setFilialId] = useState('')
  const [rp, setRp] = useState('')
  const [bloqueio, setBloqueio] = useState('')
  const [dataEmissao, setDataEmissao] = useState('')
  const [gerando, setGerando] = useState(false)
  const { showSuccess, showError } = useToast()

  function toggleStatus(value: string) {
    setStatusSelecionados(prev =>
      prev.includes(value) ? prev.filter(s => s !== value) : [...prev, value]
    )
  }

  async function handleGerar() {
    setGerando(true)
    try {
      const params = new URLSearchParams()

      // Apenas 1 status por vez (backend aceita um enum)
      if (statusSelecionados.length === 1) {
        params.append('status', statusSelecionados[0])
      }
      if (filialId) params.append('filialDestinoId', filialId)
      if (rp !== '') params.append('entradaRp', rp)
      if (bloqueio !== '') params.append('mercadoriaBloqueada', bloqueio)
      if (dataEmissao) params.append('dataEmissao', dataEmissao)

      const response = await api.get(`/notas-fiscais/exportar?${params.toString()}`, {
        responseType: 'blob'
      })

      const dataAtual = new Date().toISOString().slice(0, 10)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `notas-fiscais-${dataAtual}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      showSuccess('Relatório exportado com sucesso!')
      onFechar()
    } catch (error: any) {
      let mensagem = 'Erro ao exportar relatório'
      try {
        const data = error?.response?.data
        if (data instanceof Blob) {
          const texto = await data.text()
          const json = JSON.parse(texto)
          mensagem = typeof json.error === 'string' ? json.error : mensagem
        } else if (typeof data?.error === 'string') {
          mensagem = data.error
        }
      } catch {
        // mantém mensagem padrão
      }
      showError(mensagem)
    } finally {
      setGerando(false)
    }
  }

  const temFiltro = statusSelecionados.length > 0 || filialId || rp !== '' || bloqueio !== '' || dataEmissao

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onFechar} />

      {/* Modal */}
      <div className="relative bg-white border border-gray-200 rounded-lg w-[440px] flex flex-col shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <FiFileText className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-semibold text-gray-800">Exportar Relatório Excel</span>
          </div>
          <button
            onClick={onFechar}
            className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors"
          >
            <FiX className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Corpo */}
        <div className="px-4 py-4 flex flex-col gap-4">

          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
              Status <span className="normal-case text-gray-400 font-normal">(selecione um ou deixe em branco para todos)</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => toggleStatus(opt.value)}
                  className={`h-7 px-2.5 rounded text-[11px] font-medium border cursor-pointer transition-colors ${
                    statusSelecionados.includes(opt.value)
                      ? 'bg-primary-50 border-primary-400 text-primary-700'
                      : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {statusSelecionados.length > 1 && (
              <span className="text-[10px] text-amber-600">
                Apenas 1 status por relatório. Desmarque os extras.
              </span>
            )}
          </div>

          {/* Filial */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
              Filial Destino <span className="normal-case text-gray-400 font-normal">(opcional)</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setFilialId('')}
                className={`h-7 px-2.5 rounded text-[11px] font-medium border cursor-pointer transition-colors ${
                  filialId === ''
                    ? 'bg-primary-50 border-primary-400 text-primary-700'
                    : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 hover:border-gray-300'
                }`}
              >
                Todas
              </button>
              {filiais.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilialId(f.id)}
                  className={`h-7 px-2.5 rounded text-[11px] font-medium border cursor-pointer transition-colors ${
                    filialId === f.id
                      ? 'bg-primary-50 border-primary-400 text-primary-700'
                      : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 hover:border-gray-300'
                  }`}
                >
                  {f.nome}
                </button>
              ))}
            </div>
          </div>

          {/* RP e Bloqueio lado a lado */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Entrada RP</span>
              <div className="flex h-7 bg-gray-50 border border-gray-200 rounded overflow-hidden">
                {RP_OPTIONS.map((opt, i) => (
                  <button
                    key={opt.value}
                    onClick={() => setRp(opt.value)}
                    className={`flex-1 text-[11px] font-medium transition-colors cursor-pointer ${
                      rp === opt.value
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    } ${i > 0 ? 'border-l border-gray-200' : ''}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Mercadoria</span>
              <div className="flex h-7 bg-gray-50 border border-gray-200 rounded overflow-hidden">
                {BLOQUEIO_OPTIONS.map((opt, i) => (
                  <button
                    key={opt.value}
                    onClick={() => setBloqueio(opt.value)}
                    className={`flex-1 text-[11px] font-medium transition-colors cursor-pointer ${
                      bloqueio === opt.value
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    } ${i > 0 ? 'border-l border-gray-200' : ''}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Data de Emissão */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
              Data de Emissão <span className="normal-case text-gray-400 font-normal">(opcional)</span>
            </span>
            <input
              type="date"
              value={dataEmissao}
              onChange={e => setDataEmissao(e.target.value)}
              className="h-7 bg-gray-50 border border-gray-200 rounded px-2 text-xs text-gray-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors w-40"
            />
          </div>

          {/* Resumo dos filtros */}
          {temFiltro && (
            <div className="bg-gray-50 border border-gray-100 rounded px-3 py-2 text-[10px] text-gray-500 leading-relaxed">
              <span className="font-medium text-gray-600">Filtros ativos: </span>
              {statusSelecionados.length === 1 && <span>Status: <strong className="text-gray-700">{STATUS_OPTIONS.find(s => s.value === statusSelecionados[0])?.label}</strong> · </span>}
              {filialId && <span>Filial: <strong className="text-gray-700">{filiais.find(f => f.id === filialId)?.nome}</strong> · </span>}
              {rp !== '' && <span>RP: <strong className="text-gray-700">{rp === 'true' ? 'RP-SIM' : 'RP-NÃO'}</strong> · </span>}
              {bloqueio !== '' && <span>Mercadoria: <strong className="text-gray-700">{bloqueio === 'true' ? 'Bloqueada' : 'Liberada'}</strong> · </span>}
              {dataEmissao && <span>Emissão: <strong className="text-gray-700">{new Date(dataEmissao + 'T12:00:00').toLocaleDateString('pt-BR')}</strong></span>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[10px] text-gray-400">
            {!temFiltro ? 'Sem filtros = exporta todas as NFs' : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onFechar}
              disabled={gerando}
              className="h-7 px-3 text-xs text-gray-500 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleGerar}
              disabled={gerando || statusSelecionados.length > 1}
              className="h-7 px-4 text-xs font-medium bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {gerando
                ? <><span className="animate-pulse">Gerando...</span></>
                : <><FiDownload className="h-3 w-3" /> Gerar Excel</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
