import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Iniciando migração: Adicionar tabela de itens NF secundária...')

  try {
    // Verificar se a tabela já existe
    const tabelaExiste = await prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'itens_nf_secundaria'
      ) as exists
    `

    if (tabelaExiste[0]?.exists) {
      console.log('⚠️ Tabela itens_nf_secundaria já existe. Pulando criação.')
    } else {
      // Criar tabela de itens da NF secundária
      await prisma.$executeRawUnsafe(`
        CREATE TABLE itens_nf_secundaria (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
          nota_fiscal_id TEXT NOT NULL REFERENCES notas_fiscais(id) ON DELETE CASCADE,
          codigo VARCHAR(50) NOT NULL,
          descricao TEXT NOT NULL,
          quantidade DECIMAL(12, 3) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `)
      console.log('✅ Tabela itens_nf_secundaria criada com sucesso')

      // Criar índice para nota_fiscal_id
      await prisma.$executeRawUnsafe(`
        CREATE INDEX idx_itens_nf_secundaria_nota_fiscal_id ON itens_nf_secundaria(nota_fiscal_id)
      `)
      console.log('✅ Índice criado para nota_fiscal_id')
    }

    // Verificar se a coluna txt_secundario já existe na tabela notas_fiscais
    const colunaExiste = await prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'notas_fiscais' AND column_name = 'txt_secundario'
      ) as exists
    `

    if (colunaExiste[0]?.exists) {
      console.log('⚠️ Coluna txt_secundario já existe. Pulando criação.')
    } else {
      // Adicionar coluna para caminho do TXT na tabela notas_fiscais
      await prisma.$executeRawUnsafe(`
        ALTER TABLE notas_fiscais ADD COLUMN txt_secundario TEXT
      `)
      console.log('✅ Coluna txt_secundario adicionada em notas_fiscais')
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
