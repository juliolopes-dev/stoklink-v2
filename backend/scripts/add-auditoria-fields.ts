import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando migração: adicionar campos de auditoria...')

  try {
    // Adicionar colunas auditoria_realizada e data_auditoria
    await prisma.$executeRawUnsafe(`
      ALTER TABLE notas_fiscais 
      ADD COLUMN IF NOT EXISTS auditoria_realizada BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS data_auditoria TIMESTAMP(3);
    `)

    console.log('✓ Colunas auditoria_realizada e data_auditoria adicionadas com sucesso!')

    // Verificar quantas notas fiscais existem
    const count = await prisma.notaFiscal.count()
    console.log(`✓ Total de notas fiscais no banco: ${count}`)

  } catch (error) {
    console.error('Erro ao executar migração:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .then(() => {
    console.log('Migração concluída com sucesso!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Falha na migração:', error)
    process.exit(1)
  })
