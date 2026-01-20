import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateTiposMovimentacao() {
  console.log('🚀 Iniciando migração de tipos de movimentação...\n')

  try {
    // Passo 1: Adicionar novos valores ao enum
    console.log('📝 Passo 1: Adicionando novos valores ao enum TipoMovimentacao...')
    await prisma.$executeRawUnsafe(`ALTER TYPE "TipoMovimentacao" ADD VALUE IF NOT EXISTS 'NORMAL'`)
    console.log('✅ Valor NORMAL adicionado')
    
    await prisma.$executeRawUnsafe(`ALTER TYPE "TipoMovimentacao" ADD VALUE IF NOT EXISTS 'DISTRIBUICAO_IMEDIATA'`)
    console.log('✅ Valor DISTRIBUICAO_IMEDIATA adicionado\n')

    // Passo 2: Verificar quantos registros serão migrados
    console.log('📊 Passo 2: Verificando registros a serem migrados...')
    const countDiretoIndireto = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count 
      FROM notas_fiscais 
      WHERE tipo_movimentacao IN ('RECEBIMENTO_DIRETO', 'RECEBIMENTO_INDIRETO')
    `
    const countUrgente = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count 
      FROM notas_fiscais 
      WHERE tipo_movimentacao = 'DISTRIBUICAO_URGENTE'
    `
    
    console.log(`   - ${countDiretoIndireto[0].count} NFs (RECEBIMENTO_DIRETO/INDIRETO) → NORMAL`)
    console.log(`   - ${countUrgente[0].count} NFs (DISTRIBUICAO_URGENTE) → DISTRIBUICAO_IMEDIATA\n`)

    // Passo 3: Migrar dados
    console.log('🔄 Passo 3: Migrando dados...')
    const result1 = await prisma.$executeRaw`
      UPDATE notas_fiscais 
      SET tipo_movimentacao = 'NORMAL'::"TipoMovimentacao"
      WHERE tipo_movimentacao IN ('RECEBIMENTO_DIRETO', 'RECEBIMENTO_INDIRETO')
    `
    console.log(`✅ ${result1} registros migrados para NORMAL`)

    const result2 = await prisma.$executeRaw`
      UPDATE notas_fiscais 
      SET tipo_movimentacao = 'DISTRIBUICAO_IMEDIATA'::"TipoMovimentacao"
      WHERE tipo_movimentacao = 'DISTRIBUICAO_URGENTE'
    `
    console.log(`✅ ${result2} registros migrados para DISTRIBUICAO_IMEDIATA\n`)

    // Passo 4: Verificar resultado
    console.log('✔️  Passo 4: Verificando resultado da migração...')
    const distribution = await prisma.$queryRaw<Array<{ tipo_movimentacao: string; count: bigint }>>`
      SELECT tipo_movimentacao, COUNT(*) as count
      FROM notas_fiscais
      GROUP BY tipo_movimentacao
      ORDER BY tipo_movimentacao
    `
    
    console.log('\n📊 Distribuição final de tipos de movimentação:')
    distribution.forEach(row => {
      console.log(`   - ${row.tipo_movimentacao}: ${row.count} registros`)
    })

    console.log('\n✅ Migração concluída com sucesso!')
  } catch (error) {
    console.error('❌ Erro durante a migração:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Executar migração
migrateTiposMovimentacao()
  .then(() => {
    console.log('\n🎉 Script finalizado!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Falha na migração:', error)
    process.exit(1)
  })
