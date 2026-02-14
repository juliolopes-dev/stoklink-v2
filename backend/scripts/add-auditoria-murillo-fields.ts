import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Adicionando campos de Auditoria Murillo...')

  try {
    // Adicionar colunas auditoria_murillo e data_auditoria_murillo
    await prisma.$executeRawUnsafe(`
      ALTER TABLE notas_fiscais 
      ADD COLUMN IF NOT EXISTS auditoria_murillo BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS data_auditoria_murillo TIMESTAMP
    `)

    console.log('✅ Campos auditoria_murillo e data_auditoria_murillo adicionados com sucesso!')

    // Verificar se as colunas foram criadas
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'notas_fiscais' 
      AND column_name IN ('auditoria_murillo', 'data_auditoria_murillo')
      ORDER BY column_name
    ` as any[]

    console.log('\n📋 Colunas criadas:')
    result.forEach((col: any) => {
      console.log(`  - ${col.column_name}: ${col.data_type} (default: ${col.column_default || 'NULL'})`)
    })

  } catch (error) {
    console.error('❌ Erro ao adicionar campos:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
