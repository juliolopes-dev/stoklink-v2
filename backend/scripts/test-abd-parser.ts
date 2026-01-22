import fs from 'fs'
import path from 'path'
import { parseTxtSecundario, validarTxtSecundario } from '../src/utils/txtParser.js'

const txtPath = path.join(process.cwd(), '..', 'ABD.txt')

console.log('🔍 Testando parser com arquivo ABD.txt...\n')

const conteudo = fs.readFileSync(txtPath, 'latin1')

console.log('📄 Primeiras 10 linhas do arquivo:')
const linhas = conteudo.split('\n')
linhas.slice(0, 10).forEach((linha, i) => {
  console.log(`${i + 1}: ${linha}`)
})
console.log('\n' + '='.repeat(80) + '\n')

// Validar
const validacao = validarTxtSecundario(conteudo)
console.log('✅ Validação:', validacao)
console.log('')

// Parsear
const itens = parseTxtSecundario(conteudo)
console.log(`📦 Total de itens encontrados: ${itens.length}\n`)

if (itens.length > 0) {
  console.log('🔍 Todos os itens encontrados:')
  itens.forEach((item, index) => {
    console.log(`\n${index + 1}. Código: ${item.codigo}`)
    console.log(`   Descrição: ${item.descricao}`)
    console.log(`   Quantidade: ${item.quantidade}`)
  })
} else {
  console.log('⚠️ Nenhum item foi parseado!')
  console.log('\n🔍 Analisando linhas com código:')
  linhas.forEach((linha, index) => {
    const matchCodigo = linha.match(/^\s*(\d{6})\s+(.+)/)
    if (matchCodigo) {
      console.log(`\nLinha ${index + 1}: "${linha}"`)
      console.log(`  Código: ${matchCodigo[1]}`)
      const resto = matchCodigo[2]
      console.log(`  Resto: "${resto.substring(0, 100)}"`)
      
      const matchQuantidade = resto.match(/([A-Z]{2,})\s+(\d+[,.]?\d*)\s+\d/)
      if (matchQuantidade) {
        console.log(`  ✓ Fabricante: ${matchQuantidade[1]}`)
        console.log(`  ✓ Quantidade: ${matchQuantidade[2]}`)
      } else {
        console.log(`  ✗ Padrão de quantidade não encontrado`)
      }
    }
  })
}
