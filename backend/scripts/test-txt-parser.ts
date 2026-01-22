import fs from 'fs'
import path from 'path'
import { parseTxtSecundario, validarTxtSecundario } from '../src/utils/txtParser.js'

// Ler o arquivo TXT de exemplo que você forneceu
const txtPath = path.join(process.cwd(), '..', 'NF 112158 - MOTORAÇO')

console.log('🔍 Testando parser de TXT...\n')
console.log(`📁 Arquivo: ${txtPath}\n`)

try {
  if (!fs.existsSync(txtPath)) {
    console.log('❌ Arquivo não encontrado. Testando com conteúdo de exemplo...\n')
    
    // Conteúdo de exemplo baseado na imagem que você mostrou
    const conteudoExemplo = `   118292 AMORTECEDOR TRASEIRO FOX 09/ MAP164/MOTORACO       MOTORAÇO             35,00          68,06    2.382,10   0,00   0,00   0,00      68,06        74,66
   125924 AMORTECEDOR TRASEIRO KA 1.0/1.3/1.6 97/07          MOTORAÇO              4,00          86,87      347,48   0,00   0,00   0,00       0,00        95,29
   122358 AMORTECEDOR DIANTEIRO LD PUNTO 07/                 MOTORAÇO              4,00         170,53      682,12   0,00   0,00   0,00     170,53       187,06`
    
    testarParser(conteudoExemplo)
  } else {
    const conteudo = fs.readFileSync(txtPath, 'latin1')
    testarParser(conteudo)
  }
} catch (error) {
  console.error('❌ Erro ao ler arquivo:', error)
}

function testarParser(conteudo: string) {
  console.log('📄 Conteúdo do arquivo (primeiras 500 caracteres):')
  console.log(conteudo.substring(0, 500))
  console.log('\n' + '='.repeat(80) + '\n')
  
  // Validar
  const validacao = validarTxtSecundario(conteudo)
  console.log('✅ Validação:', validacao)
  console.log('')
  
  // Parsear
  const itens = parseTxtSecundario(conteudo)
  console.log(`📦 Total de itens encontrados: ${itens.length}\n`)
  
  if (itens.length > 0) {
    console.log('🔍 Primeiros 5 itens:')
    itens.slice(0, 5).forEach((item, index) => {
      console.log(`\n${index + 1}. Código: ${item.codigo}`)
      console.log(`   Descrição: ${item.descricao}`)
      console.log(`   Quantidade: ${item.quantidade}`)
    })
  } else {
    console.log('⚠️ Nenhum item foi parseado!')
    console.log('\n🔍 Analisando linhas do arquivo:')
    const linhas = conteudo.split('\n')
    linhas.slice(0, 10).forEach((linha, index) => {
      if (linha.trim()) {
        console.log(`\nLinha ${index + 1}: "${linha}"`)
        const matchCodigo = linha.match(/^\s*(\d{6})\s+(.+)/)
        if (matchCodigo) {
          console.log(`  ✓ Código encontrado: ${matchCodigo[1]}`)
          const resto = matchCodigo[2]
          const matchQuantidade = resto.match(/(?:MOTORAÇO|ALLEN|MOTORACO)\s+(\d+[,.]?\d*)\s+/)
          if (matchQuantidade) {
            console.log(`  ✓ Quantidade encontrada: ${matchQuantidade[1]}`)
          } else {
            console.log(`  ✗ Quantidade NÃO encontrada`)
            console.log(`  Resto da linha: "${resto.substring(0, 100)}"`)
          }
        } else {
          console.log(`  ✗ Código NÃO encontrado`)
        }
      }
    })
  }
}
