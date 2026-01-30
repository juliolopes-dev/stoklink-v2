import { prisma } from '../src/lib/prisma.js'

/**
 * Script para adicionar o status SEPARACAO_FINALIZADA ao enum StatusNotaFiscal
 */
async function run() {
  console.log('🔄 Adicionando status SEPARACAO_FINALIZADA ao enum StatusNotaFiscal...')
  
  try {
    // Adicionar novo valor ao enum
    await prisma.$executeRawUnsafe(`
      ALTER TYPE "StatusNotaFiscal" ADD VALUE IF NOT EXISTS 'SEPARACAO_FINALIZADA'
    `)
    
    console.log('✅ Status SEPARACAO_FINALIZADA adicionado com sucesso!')
  } catch (error) {
    console.error('❌ Erro ao adicionar status:', error)
  }
  
  await prisma.$disconnect()
}

run()
