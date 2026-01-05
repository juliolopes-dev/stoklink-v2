import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiUpload, FiFileText, FiPlus, FiTrash2, FiHelpCircle } from 'react-icons/fi'
import { api } from '../../services/api'

interface Filial {
  id: string
  nome: string
  codigo: string
}

interface ItemForm {
  codigoProduto: string
  descricao: string
  unidade: string
  quantidadeNota: string
  valorUnitario: string
}

interface XmlPreview {
  numero: string
  serie: string | null
  chaveAcesso: string | null
  fornecedorNome: string
  fornecedorCnpj: string | null
  dataEmissao: string | null
  valorTotal: number | null
  quantidadeVolumes: number
  itens: {
    codigoProduto: string
    descricao: string
    unidade: string
    quantidade: number
    valorUnitario: number
    valorTotal: number
  }[]
}

type TabType = 'manual' | 'xml'

export function NovaNotaFiscal() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('manual')
  const [filiais, setFiliais] = useState<Filial[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form manual
  const [numero, setNumero] = useState('')
  const [serie, setSerie] = useState('')
  const [fornecedorNome, setFornecedorNome] = useState('')
  const [fornecedorCnpj, setFornecedorCnpj] = useState('')
  const [quantidadeVolumes, setQuantidadeVolumes] = useState('')
  const [tipoMovimentacao, setTipoMovimentacao] = useState('RECEBIMENTO_DIRETO')
  const [filialRecebimentoId, setFilialRecebimentoId] = useState('')
  const [filialDestinoId, setFilialDestinoId] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [itens, setItens] = useState<ItemForm[]>([])

  // Form XML
  const [xmlFile, setXmlFile] = useState<File | null>(null)
  const [xmlFilialRecebimentoId, setXmlFilialRecebimentoId] = useState('')
  const [xmlFilialDestinoId, setXmlFilialDestinoId] = useState('')
  const [xmlTipoMovimentacao, setXmlTipoMovimentacao] = useState('RECEBIMENTO_DIRETO')
  const [xmlQuantidadeVolumes, setXmlQuantidadeVolumes] = useState('')
  const [xmlPreview, setXmlPreview] = useState<XmlPreview | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [xmlNumeroSecundario, setXmlNumeroSecundario] = useState('')
  const [xmlFornecedorSecundarioId, setXmlFornecedorSecundarioId] = useState('')
  const [fornecedores, setFornecedores] = useState<{ id: string; nome: string }[]>([])

  useEffect(() => {
    loadFiliais()
  }, [])

  async function loadFiliais() {
    try {
      const [filiaisRes, fornecedoresRes] = await Promise.all([
        api.get('/filiais/ativas'),
        api.get('/fornecedores/ativos')
      ])
      setFiliais(filiaisRes.data)
      setFornecedores(fornecedoresRes.data)
      if (filiaisRes.data.length > 0) {
        setFilialRecebimentoId(filiaisRes.data[0].id)
        setFilialDestinoId(filiaisRes.data[0].id)
        // XML: Filial Recebimento começa vazia (A definir)
        setXmlFilialRecebimentoId('')
        setXmlFilialDestinoId(filiaisRes.data[0].id)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  function addItem() {
    setItens([...itens, {
      codigoProduto: '',
      descricao: '',
      unidade: 'UN',
      quantidadeNota: '',
      valorUnitario: ''
    }])
  }

  function removeItem(index: number) {
    setItens(itens.filter((_, i) => i !== index))
  }

  async function handleXmlFileChange(file: File | null) {
    setXmlFile(file)
    setXmlPreview(null)
    
    if (!file) return

    setLoadingPreview(true)
    setError('')
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await api.post('/notas-fiscais/preview-xml', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      setXmlPreview(response.data)
      // Preencher quantidade de volumes do XML se não foi informado
      if (response.data.quantidadeVolumes && !xmlQuantidadeVolumes) {
        setXmlQuantidadeVolumes(response.data.quantidadeVolumes.toString())
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      setError(error.response?.data?.error || 'Erro ao processar XML')
    } finally {
      setLoadingPreview(false)
    }
  }

  function updateItem(index: number, field: keyof ItemForm, value: string) {
    const newItens = [...itens]
    newItens[index][field] = value
    setItens(newItens)
  }

  async function handleSubmitManual(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = {
        numero,
        serie: serie || undefined,
        fornecedorNome,
        fornecedorCnpj: fornecedorCnpj || undefined,
        quantidadeVolumes: parseInt(quantidadeVolumes),
        tipoMovimentacao,
        filialRecebimentoId,
        filialDestinoId,
        observacoes: observacoes || undefined,
        itens: itens.length > 0 ? itens.map(item => ({
          codigoProduto: item.codigoProduto,
          descricao: item.descricao,
          unidade: item.unidade,
          quantidadeNota: parseFloat(item.quantidadeNota),
          valorUnitario: item.valorUnitario ? parseFloat(item.valorUnitario) : undefined
        })) : undefined
      }

      await api.post('/notas-fiscais', data)
      navigate('/notas-fiscais')
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      setError(error.response?.data?.error || 'Erro ao cadastrar nota fiscal')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmitXml(e: React.FormEvent) {
    e.preventDefault()
    if (!xmlFile) {
      setError('Selecione um arquivo XML')
      return
    }

    setError('')
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', xmlFile)
      formData.append('filialRecebimentoId', xmlFilialRecebimentoId)
      formData.append('filialDestinoId', xmlFilialDestinoId)
      formData.append('tipoMovimentacao', xmlTipoMovimentacao)
      if (xmlQuantidadeVolumes) {
        formData.append('quantidadeVolumes', xmlQuantidadeVolumes)
      }
      if (xmlNumeroSecundario) {
        formData.append('numeroSecundario', xmlNumeroSecundario)
      }
      if (xmlFornecedorSecundarioId) {
        formData.append('fornecedorSecundarioId', xmlFornecedorSecundarioId)
      }
      
      await api.post('/notas-fiscais/importar-xml', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      navigate('/notas-fiscais')
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      setError(error.response?.data?.error || 'Erro ao importar XML')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col overflow-hidden">
      <div className="flex items-center gap-4 mb-4 flex-shrink-0">
        <button
          onClick={() => navigate('/notas-fiscais')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FiArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Nova Nota Fiscal</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="border-b border-gray-200 flex-shrink-0">
          <div className="flex">
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'manual'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FiFileText />
              Cadastro Manual
            </button>
            <button
              onClick={() => setActiveTab('xml')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'xml'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FiUpload />
              Importar XML
            </button>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {activeTab === 'manual' ? (
            <form onSubmit={handleSubmitManual} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número da NF *
                  </label>
                  <input
                    type="text"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Série
                  </label>
                  <input
                    type="text"
                    value={serie}
                    onChange={(e) => setSerie(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantidade de Volumes *
                  </label>
                  <input
                    type="number"
                    value={quantidadeVolumes}
                    onChange={(e) => setQuantidadeVolumes(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    required
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Fornecedor *
                  </label>
                  <input
                    type="text"
                    value={fornecedorNome}
                    onChange={(e) => setFornecedorNome(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CNPJ do Fornecedor
                  </label>
                  <input
                    type="text"
                    value={fornecedorCnpj}
                    onChange={(e) => setFornecedorCnpj(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    Tipo de Movimentação *
                    <span className="relative group">
                      <FiHelpCircle size={14} className="text-gray-400 cursor-help" />
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                        <p className="font-semibold mb-2">Tipos de Movimentação:</p>
                        <p className="mb-1"><strong>Recebimento Direto:</strong> Mercadoria vai direto para a filial de destino final.</p>
                        <p className="mb-1"><strong>Recebimento Indireto:</strong> Mercadoria chega no CD e será transferida para outra filial.</p>
                        <p><strong>Distribuição Imediata:</strong> Mercadoria com prioridade de distribuição imediata.</p>
                      </div>
                    </span>
                  </label>
                  <select
                    value={tipoMovimentacao}
                    onChange={(e) => setTipoMovimentacao(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  >
                    <option value="RECEBIMENTO_DIRETO">Recebimento Direto</option>
                    <option value="RECEBIMENTO_INDIRETO">Recebimento Indireto</option>
                    <option value="DISTRIBUICAO_URGENTE">Distribuição Imediata</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filial de Recebimento *
                  </label>
                  <select
                    value={filialRecebimentoId}
                    onChange={(e) => setFilialRecebimentoId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    required
                  >
                    {filiais.map(filial => (
                      <option key={filial.id} value={filial.id}>
                        {filial.nome} ({filial.codigo})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filial de Destino *
                  </label>
                  <select
                    value={filialDestinoId}
                    onChange={(e) => setFilialDestinoId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    required
                  >
                    {filiais.map(filial => (
                      <option key={filial.id} value={filial.id}>
                        {filial.nome} ({filial.codigo})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-800">Itens</h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
                  >
                    <FiPlus />
                    Adicionar Item
                  </button>
                </div>

                {itens.length > 0 && (
                  <div className="space-y-4">
                    {itens.map((item, index) => (
                      <div key={index} className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-4">
                          <input
                            type="text"
                            placeholder="Código"
                            value={item.codigoProduto}
                            onChange={(e) => updateItem(index, 'codigoProduto', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            required
                          />
                          <input
                            type="text"
                            placeholder="Descrição"
                            value={item.descricao}
                            onChange={(e) => updateItem(index, 'descricao', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm md:col-span-2"
                            required
                          />
                          <input
                            type="number"
                            placeholder="Quantidade"
                            value={item.quantidadeNota}
                            onChange={(e) => updateItem(index, 'quantidadeNota', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            required
                            step="0.001"
                          />
                          <input
                            type="text"
                            placeholder="Unidade"
                            value={item.unidade}
                            onChange={(e) => updateItem(index, 'unidade', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            required
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => navigate('/notas-fiscais')}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmitXml} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arquivo XML da NF-e *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    accept=".xml"
                    onChange={(e) => handleXmlFileChange(e.target.files?.[0] || null)}
                    className="hidden"
                    id="xml-file"
                  />
                  <label
                    htmlFor="xml-file"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    {loadingPreview ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2"></div>
                    ) : (
                      <FiUpload size={32} className="text-gray-400 mb-2" />
                    )}
                    {xmlFile ? (
                      <p className="text-primary-600 font-medium">{xmlFile.name}</p>
                    ) : (
                      <>
                        <p className="text-gray-600">Clique para selecionar o arquivo XML</p>
                        <p className="text-sm text-gray-400 mt-1">ou arraste e solte aqui</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {xmlPreview && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <h3 className="font-semibold text-green-800 mb-2 text-sm">✓ Dados extraídos do XML</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Número:</span>
                      <p className="font-medium">{xmlPreview.numero}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Série:</span>
                      <p className="font-medium">{xmlPreview.serie || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Fornecedor:</span>
                      <p className="font-medium">{xmlPreview.fornecedorNome}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">CNPJ:</span>
                      <p className="font-medium">{xmlPreview.fornecedorCnpj || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Valor Total:</span>
                      <p className="font-medium">
                        {xmlPreview.valorTotal 
                          ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(xmlPreview.valorTotal)
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Volumes:</span>
                      <p className="font-medium">{xmlPreview.quantidadeVolumes}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Itens:</span>
                      <p className="font-medium">{xmlPreview.itens.length} produto(s)</p>
                    </div>
                  </div>
                  {xmlPreview.chaveAcesso && (
                    <div className="mt-2 pt-2 border-t border-green-200">
                      <span className="text-gray-500 text-xs">Chave: </span>
                      <span className="font-mono text-xs">{xmlPreview.chaveAcesso}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    Tipo de Movimentação *
                    <span className="relative group">
                      <FiHelpCircle size={14} className="text-gray-400 cursor-help" />
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                        <p className="font-semibold mb-2">Tipos de Movimentação:</p>
                        <p className="mb-1"><strong>Recebimento Direto:</strong> Mercadoria vai direto para a filial de destino final.</p>
                        <p className="mb-1"><strong>Recebimento Indireto:</strong> Mercadoria chega no CD e será transferida para outra filial.</p>
                        <p><strong>Distribuição Imediata:</strong> Mercadoria com prioridade de distribuição imediata.</p>
                      </div>
                    </span>
                  </label>
                  <select
                    value={xmlTipoMovimentacao}
                    onChange={(e) => setXmlTipoMovimentacao(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                  >
                    <option value="RECEBIMENTO_DIRETO">Recebimento Direto</option>
                    <option value="RECEBIMENTO_INDIRETO">Recebimento Indireto</option>
                    <option value="DISTRIBUICAO_URGENTE">Distribuição Imediata</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Volumes
                  </label>
                  <input
                    type="number"
                    value={xmlQuantidadeVolumes}
                    onChange={(e) => setXmlQuantidadeVolumes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                    placeholder="Do XML"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filial Recebimento
                    <span className="text-xs text-gray-500 font-normal ml-1">(opcional)</span>
                  </label>
                  <select
                    value={xmlFilialRecebimentoId}
                    onChange={(e) => setXmlFilialRecebimentoId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                  >
                    <option value="">📦 A definir no recebimento</option>
                    {filiais.map(filial => (
                      <option key={filial.id} value={filial.id}>
                        {filial.nome}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-blue-600 mt-1">
                    💡 Deixe "A definir" para conferir volumes antes de definir a filial
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filial Destino *
                  </label>
                  <select
                    value={xmlFilialDestinoId}
                    onChange={(e) => setXmlFilialDestinoId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                    required
                  >
                    {filiais.map(filial => (
                      <option key={filial.id} value={filial.id}>
                        {filial.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NF Secundária
                  </label>
                  <input
                    type="text"
                    value={xmlNumeroSecundario}
                    onChange={(e) => setXmlNumeroSecundario(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                    placeholder="Número da NF secundária (opcional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fornecedor Secundário
                  </label>
                  <select
                    value={xmlFornecedorSecundarioId}
                    onChange={(e) => setXmlFornecedorSecundarioId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                  >
                    <option value="">Nenhum</option>
                    {fornecedores.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t mt-4">
                <button
                  type="button"
                  onClick={() => navigate('/notas-fiscais')}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !xmlFile}
                  className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Importando...' : 'Importar'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
