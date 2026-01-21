import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function adicionarCampoDanfSecundario() {
  try {
    console.log('🔧 Adicionando coluna danfSecundario na tabela NotaFiscal...')
    
    // Executar SQL para adicionar coluna se não existir
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "notas_fiscais" 
      ADD COLUMN IF NOT EXISTS "danf_secundario" TEXT;
    `)
    
    console.log('✅ Coluna danfSecundario adicionada com sucesso!')
    console.log('📋 Tipo: TEXT (caminho do arquivo PDF)')
    
  } catch (error) {
    console.error('❌ Erro ao adicionar coluna:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

adicionarCampoDanfSecundario()
