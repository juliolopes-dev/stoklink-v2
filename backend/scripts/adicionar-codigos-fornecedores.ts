import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface Mapeamento {
  id: string
  codigo: string
  nomeBanco: string
  nomeCSV: string
  cnpj: string | null
  tipo: 'cnpj' | 'nome'
}

async function main() {
  console.log('='.repeat(80))
  console.log('🔧 ADICIONANDO CÓDIGOS AOS FORNECEDORES')
  console.log('='.repeat(80))

  // Ler mapeamento
  console.log('\n📄 Lendo mapeamento...')
  const mapeamentoPath = path.join(__dirname, '../../mapeamento-codigos.json')
  const mapeamento: Mapeamento[] = JSON.parse(
    fs.readFileSync(mapeamentoPath, 'utf-8')
  )
  console.log(`✅ ${mapeamento.length} fornecedores para atualizar`)

  // 1. Adicionar coluna codigo (se não existir)
  console.log('\n🔨 Verificando coluna "codigo"...')
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE fornecedores 
      ADD COLUMN IF NOT EXISTS codigo TEXT
    `)
    console.log('✅ Coluna "codigo" criada/verificada')
  } catch (error) {
    console.log('⚠️  Coluna já existe ou erro:', error)
  }

  // 2. Criar índice para busca rápida por código
  console.log('\n🔨 Criando índice...')
  try {
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_fornecedores_codigo 
      ON fornecedores(codigo)
    `)
    console.log('✅ Índice criado')
  } catch (error) {
    console.log('⚠️  Índice já existe ou erro:', error)
  }

  // 3. Atualizar códigos
  console.log('\n📝 Atualizando códigos...')
  let sucesso = 0
  let erros = 0
  const errosDetalhes: string[] = []

  for (const item of mapeamento) {
    try {
      await prisma.fornecedor.update({
        where: { id: item.id },
        data: { codigo: item.codigo }
      })
      sucesso++
      
      // Log a cada 100 registros
      if (sucesso % 100 === 0) {
        console.log(`  ✓ ${sucesso}/${mapeamento.length} atualizados...`)
      }
    } catch (error) {
      erros++
      errosDetalhes.push(`[${item.codigo}] ${item.nomeBanco} - Erro: ${error}`)
    }
  }

  // Resultado
  console.log('\n' + '='.repeat(80))
  console.log('📊 RESULTADO')
  console.log('='.repeat(80))
  console.log(`✅ Sucesso: ${sucesso}`)
  console.log(`❌ Erros: ${erros}`)

  if (erros > 0) {
    console.log('\n⚠️  Detalhes dos erros:')
    errosDetalhes.forEach(erro => console.log(`  ${erro}`))
  }

  // Validação
  console.log('\n🔍 Validando...')
  const comCodigo = await prisma.fornecedor.count({
    where: {
      codigo: {
        not: null
      }
    }
  })
  const total = await prisma.fornecedor.count()

  console.log(`✅ Fornecedores com código: ${comCodigo}/${total}`)
  console.log(`📊 Percentual: ${((comCodigo / total) * 100).toFixed(1)}%`)

  // Exemplos
  console.log('\n📋 Exemplos de fornecedores atualizados:')
  const exemplos = await prisma.fornecedor.findMany({
    where: {
      codigo: {
        not: null
      }
    },
    select: {
      codigo: true,
      nome: true,
      cnpj: true
    },
    take: 5,
    orderBy: { codigo: 'asc' }
  })

  exemplos.forEach(ex => {
    console.log(`  [${ex.codigo}] ${ex.nome}`)
    if (ex.cnpj) console.log(`    CNPJ: ${ex.cnpj}`)
  })

  console.log('\n' + '='.repeat(80))
  console.log('✅ Migração concluída!')
  console.log('='.repeat(80))

  await prisma.$disconnect()
}

main()
  .catch((e) => {
    console.error('❌ Erro fatal:', e)
    process.exit(1)
  })
