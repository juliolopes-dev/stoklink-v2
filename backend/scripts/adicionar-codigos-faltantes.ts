import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Fornecedores que estão no CSV mas não receberam código
const mapeamento = [
  { nome: 'AUTO PECAS PADRE CICERO LTDA', codigo: '000372' },
  { nome: 'BRAZMAX  COMERCIO  DE  PRODUTOS AUTOMOTIVOS LTDA', codigo: '000554' },
  { nome: 'CONNECT SA', codigo: '000514' },
  { nome: 'FRANCINALDO FERREIRA DE ARAUJO', codigo: '000597' },
  { nome: 'JERONYMO DIX-NEUF PECAS E SERVICOS LTDA', codigo: '000416' },
  { nome: 'MARIA GORETTE C SILVA EIRELI', codigo: '000588' },
  { nome: 'MHT IND. COM. DE COMP. AUTOM. LTDA', codigo: '000392' },
  { nome: 'MTF COMERCIO DE ROLAMENTOS LTDA', codigo: '000183' },
  { nome: 'ORBI QUIMICA S/A', codigo: '000470' },
  { nome: 'SOARES GONCALVES COMERCIO E SERVICOS LTD', codigo: '000443' },
  { nome: 'UNIVERSAL AUTOMOTIVE SYSTEMS S/A', codigo: '000287' }
]

async function main() {
  console.log('='.repeat(80))
  console.log('📝 ADICIONANDO CÓDIGOS AOS FORNECEDORES FALTANTES')
  console.log('='.repeat(80))

  let sucesso = 0
  let erros = 0

  for (const item of mapeamento) {
    try {
      // Buscar fornecedor por nome (case insensitive)
      const fornecedores = await prisma.fornecedor.findMany({
        where: {
          nome: {
            equals: item.nome,
            mode: 'insensitive'
          }
        }
      })

      if (fornecedores.length === 0) {
        console.log(`  ⚠️  [${item.codigo}] ${item.nome} - Não encontrado`)
        erros++
        continue
      }

      // Atualizar todos os fornecedores com esse nome
      for (const forn of fornecedores) {
        await prisma.fornecedor.update({
          where: { id: forn.id },
          data: { codigo: item.codigo }
        })
      }

      sucesso += fornecedores.length
      console.log(`  ✅ [${item.codigo}] ${item.nome} (${fornecedores.length} registro(s))`)
    } catch (error) {
      erros++
      console.log(`  ❌ [${item.codigo}] ${item.nome} - Erro: ${error}`)
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log('📊 RESULTADO')
  console.log('='.repeat(80))
  console.log(`✅ Atualizados: ${sucesso}`)
  console.log(`❌ Erros: ${erros}`)

  // Validação final
  const total = await prisma.fornecedor.count()
  const comCodigo = await prisma.fornecedor.count({
    where: { codigo: { not: null } }
  })

  console.log(`\n📊 Total de fornecedores: ${total}`)
  console.log(`📊 Fornecedores com código: ${comCodigo}`)
  console.log(`📊 Percentual: ${((comCodigo / total) * 100).toFixed(1)}%`)

  console.log('\n' + '='.repeat(80))
  console.log('✅ Processo concluído!')
  console.log('='.repeat(80))

  await prisma.$disconnect()
}

main()
  .catch((e) => {
    console.error('❌ Erro fatal:', e)
    process.exit(1)
  })
