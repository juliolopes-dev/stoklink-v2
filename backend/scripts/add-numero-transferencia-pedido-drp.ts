import { PrismaClient } from '@prisma/client'

// Prisma Client configurado para o banco BD-BEZERRA
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:banco-dados-bezerra@95.111.255.122:5432/banco-dados-bezerra'
    }
  }
})

async function addNumeroTransferenciaColumn() {
  try {
    console.log('🔧 Iniciando alteração da tabela Pedido_DRP no BD-BEZERRA...')
    
    // Adicionar coluna numero_transferencia usando $executeRawUnsafe (DDL)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE auditoria_integracao."Pedido_DRP"
      ADD COLUMN IF NOT EXISTS numero_transferencia VARCHAR(50)
    `)
    
    console.log('✓ Coluna numero_transferencia adicionada com sucesso!')
    
    // Verificar a estrutura da tabela usando $queryRaw
    const result = await prisma.$queryRaw<Array<{
      column_name: string
      data_type: string
      character_maximum_length: number | null
    }>>`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_schema = 'auditoria_integracao'
        AND table_name = 'Pedido_DRP'
      ORDER BY ordinal_position
    `
    
    console.log('\n📋 Estrutura atual da tabela Pedido_DRP:')
    console.table(result)
    
    console.log('\n✓ Script executado com sucesso!')
    
  } catch (error) {
    console.error('\n✗ Erro ao adicionar coluna:', error)
    throw error
  } finally {
    // Sempre desconectar o Prisma ao final
    await prisma.$disconnect()
  }
}

addNumeroTransferenciaColumn()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('Erro fatal:', error)
    process.exit(1)
  })
