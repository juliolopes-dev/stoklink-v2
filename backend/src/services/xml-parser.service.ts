import { XMLParser } from 'fast-xml-parser'

interface ItemNFe {
  codigoProduto: string
  descricao: string
  ncm: string | null
  unidade: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
}

interface NFeParsed {
  numero: string
  serie: string | null
  chaveAcesso: string | null
  fornecedorNome: string
  fornecedorCnpj: string | null
  dataEmissao: Date | null
  valorTotal: number | null
  quantidadeVolumes: number
  itens: ItemNFe[]
  xmlOriginal: string
}

export class XmlParserService {
  private parser: XMLParser

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseAttributeValue: true,
      trimValues: true
    })
  }

  parse(xmlContent: string): NFeParsed {
    try {
      const parsed = this.parser.parse(xmlContent)
      
      // Navegar na estrutura do XML de NF-e
      const nfeProc = parsed.nfeProc || parsed.NFe || parsed
      const nfe = nfeProc.NFe || nfeProc
      const infNFe = nfe.infNFe || nfe

      // Dados da identificação
      const ide = infNFe.ide || {}
      const numero = String(ide.nNF || '')
      const serie = ide.serie ? String(ide.serie) : null
      const dataEmissaoStr = ide.dhEmi || ide.dEmi
      const dataEmissao = dataEmissaoStr ? new Date(dataEmissaoStr) : null

      // Chave de acesso
      const chaveAcesso = infNFe['@_Id'] 
        ? String(infNFe['@_Id']).replace('NFe', '') 
        : (nfeProc.protNFe?.infProt?.chNFe ? String(nfeProc.protNFe.infProt.chNFe) : null)

      // Dados do emitente (fornecedor)
      const emit = infNFe.emit || {}
      const fornecedorNome = emit.xNome || emit.xFant || 'Fornecedor não identificado'
      const fornecedorCnpj = emit.CNPJ ? String(emit.CNPJ) : null

      // Dados do total
      const total = infNFe.total?.ICMSTot || {}
      const valorTotal = total.vNF ? parseFloat(total.vNF) : null

      // Dados de transporte (volumes)
      const transp = infNFe.transp || {}
      const vol = transp.vol
      let quantidadeVolumes = 1

      if (vol) {
        if (Array.isArray(vol)) {
          quantidadeVolumes = vol.reduce((acc: number, v: { qVol?: number }) => {
            return acc + (v.qVol || 1)
          }, 0)
        } else {
          quantidadeVolumes = vol.qVol || 1
        }
      }

      // Itens da nota
      const det = infNFe.det || []
      const detArray = Array.isArray(det) ? det : [det]

      const itens: ItemNFe[] = detArray.map((item: Record<string, unknown>) => {
        const prod = item.prod as Record<string, unknown> || {}
        return {
          codigoProduto: String(prod.cProd || ''),
          descricao: String(prod.xProd || 'Produto sem descrição'),
          ncm: prod.NCM ? String(prod.NCM) : null,
          unidade: String(prod.uCom || prod.uTrib || 'UN'),
          quantidade: parseFloat(String(prod.qCom || prod.qTrib || 1)),
          valorUnitario: parseFloat(String(prod.vUnCom || prod.vUnTrib || 0)),
          valorTotal: parseFloat(String(prod.vProd || 0))
        }
      })

      return {
        numero,
        serie,
        chaveAcesso,
        fornecedorNome,
        fornecedorCnpj,
        dataEmissao,
        valorTotal,
        quantidadeVolumes,
        itens,
        xmlOriginal: xmlContent
      }
    } catch (error) {
      throw new Error('Erro ao processar XML da NF-e. Verifique se o arquivo é válido.')
    }
  }
}
