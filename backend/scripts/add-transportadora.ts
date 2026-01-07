import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE conferencias_volumes ADD COLUMN IF NOT EXISTS transportadora VARCHAR(255)')
    console.log('✅ Coluna transportadora adicionada com sucesso!')
  } catch (error) {
    console.error('Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
