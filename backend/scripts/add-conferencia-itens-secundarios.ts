import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['error', 'warn']
})

async function main() {
  console.log('🔄 Adicionando campos de conferência na tabela itens_nf_secundaria...')

  try {
    // Verificar se a coluna quantidade_conferida já existe
    const colunaExiste: { exists: boolean }[] = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'itens_nf_secundaria' AND column_name = 'quantidade_conferida'
      ) as exists
    `

    if (colunaExiste[0]?.exists) {
      console.log('⚠️ Colunas de conferência já existem. Pulando migração.')
    } else {
      // Adicionar coluna quantidade_conferida
      await prisma.$executeRawUnsafe(`
        ALTER TABLE itens_nf_secundaria
        ADD COLUMN quantidade_conferida DECIMAL(12, 3) NULL
      `)
      console.log('✅ Coluna quantidade_conferida adicionada')

      // Adicionar coluna conferido
      await prisma.$executeRawUnsafe(`
        ALTER TABLE itens_nf_secundaria
        ADD COLUMN conferido BOOLEAN NOT NULL DEFAULT FALSE
      `)
      console.log('✅ Coluna conferido adicionada')
    }

    console.log('\n✅ Migração concluída com sucesso!')
  } catch (error) {
    console.error('❌ Erro na migração:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
