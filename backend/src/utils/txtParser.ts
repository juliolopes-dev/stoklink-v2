/**
 * Parser para arquivos TXT de NF secundária
 * Extrai: Código, Descrição, Quantidade
 */

export interface ItemTxtSecundario {
  codigo: string
  descricao: string
  quantidade: number
}

export function parseTxtSecundario(conteudo: string): ItemTxtSecundario[] {
  const itens: ItemTxtSecundario[] = []
  const linhas = conteudo.split('\n')

  for (const linha of linhas) {
    // Ignorar linhas vazias, cabeçalhos e rodapés
    if (!linha.trim()) continue
    if (linha.includes('Relatório de NF') || linha.includes('TOTAIS') || linha.includes('----')) continue
    if (linha.includes('Data de Emissão') || linha.includes('Data de Entrada')) continue
    if (linha.includes('Resulth Business')) continue
    if (linha.includes('CD BEZERRA')) continue
    if (linha.includes('PRODUTO DESCRIÇÃO')) continue

    // Tentar extrair dados da linha
    // Formato esperado: código no início, seguido de descrição, fornecedor, quantidade, valores...
    // Exemplo: "125899 AMORTECEDOR DIANTEIRO OROCH 15/           MOTORAÇO              3,00          84,46..."
    // Exemplo: "054427 ALAVANCA DE CAMBIO CELTA 04/                       ABD                   4,00          62,75..."
    
    // Regex para encontrar código no início da linha (6 dígitos)
    const matchCodigo = linha.match(/^\s*(\d{6})\s+(.+)/)
    
    if (matchCodigo) {
      const codigo = matchCodigo[1]
      const resto = matchCodigo[2]
      
      // Estratégia mais genérica: procurar por padrão de quantidade (número com vírgula/ponto seguido de espaços e valores)
      // Formato: [FABRICANTE] [ESPAÇOS] [QUANTIDADE] [ESPAÇOS] [VALORES...]
      // A quantidade geralmente aparece após uma sequência de espaços (separador visual entre descrição e dados numéricos)
      
      // Procurar por padrão: palavra em maiúsculas (fabricante) seguida de quantidade
      const matchQuantidade = resto.match(/([A-Z]{2,})\s+(\d+[,.]?\d*)\s+\d/)
      
      if (matchQuantidade) {
        const fabricante = matchQuantidade[1]
        const quantidade = parseFloat(matchQuantidade[2].replace(',', '.'))
        
        // Extrair descrição (texto entre código e fabricante)
        const indexFornecedor = resto.indexOf(fabricante)
        let descricao = ''
        
        if (indexFornecedor > 0) {
          descricao = resto.substring(0, indexFornecedor).trim()
        } else {
          // Tentar pegar os primeiros 50 caracteres como descrição
          descricao = resto.substring(0, 50).trim()
        }
        
        // Limpar descrição de caracteres extras
        descricao = descricao.replace(/\s+/g, ' ').trim()
        
        if (codigo && descricao && quantidade > 0) {
          itens.push({
            codigo,
            descricao,
            quantidade
          })
        }
      }
    }
  }

  return itens
}

/**
 * Valida se o conteúdo do TXT é válido
 */
export function validarTxtSecundario(conteudo: string): { valido: boolean; erro?: string } {
  if (!conteudo || conteudo.trim().length === 0) {
    return { valido: false, erro: 'Arquivo TXT está vazio' }
  }

  const itens = parseTxtSecundario(conteudo)
  
  if (itens.length === 0) {
    return { valido: false, erro: 'Nenhum item foi encontrado no arquivo TXT' }
  }

  return { valido: true }
}
