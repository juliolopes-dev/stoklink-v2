import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('='.repeat(80))
  console.log('🔄 MESCLAR FORNECEDOR DUPLICADO: MHT IND. COM. DE COMP. AUTOM. LTDA')
  console.log('='.repeat(80))

  // IDs dos fornecedores duplicados
  const fornecedorComCnpj = '67644a58-39e7-446a-b78b-e4af9bae816f' // Com CNPJ - MANTER
  const fornecedorSemCnpj = '1b8324bc-4760-4b19-aee3-f297469cc0ed' // Sem CNPJ - EXCLUIR

  console.log('\n📋 Fornecedores identificados:')
  console.log(`  ✅ MANTER: ${fornecedorComCnpj} (com CNPJ: 05974461000189)`)
  console.log(`  ❌ EXCLUIR: ${fornecedorSemCnpj} (sem CNPJ)`)

  // Buscar informações dos fornecedores
  const [fornManter, fornExcluir] = await Promise.all([
    prisma.fornecedor.findUnique({
      where: { id: fornecedorComCnpj },
      include: {
        _count: {
          select: {
            notasFiscais: true,
            notasFiscaisSecundario: true
          }
        }
      }
    }),
    prisma.fornecedor.findUnique({
      where: { id: fornecedorSemCnpj },
      include: {
        _count: {
          select: {
            notasFiscais: true,
            notasFiscaisSecundario: true
          }
        }
      }
    })
  ])

  if (!fornManter || !fornExcluir) {
    console.log('\n❌ Erro: Um ou ambos os fornecedores não foram encontrados')
    return
  }

  console.log('\n📊 Status atual:')
  console.log(`  MANTER: ${fornManter._count.notasFiscais} NFs principais + ${fornManter._count.notasFiscaisSecundario} NFs secundárias`)
  console.log(`  EXCLUIR: ${fornExcluir._count.notasFiscais} NFs principais + ${fornExcluir._count.notasFiscaisSecundario} NFs secundárias`)

  console.log('\n🔄 Iniciando transferência de NFs...')

  // Transferir NFs principais (fornecedor_id)
  if (fornExcluir._count.notasFiscais > 0) {
    const resultPrincipal = await prisma.notaFiscal.updateMany({
      where: { fornecedorId: fornecedorSemCnpj },
      data: { fornecedorId: fornecedorComCnpj }
    })
    console.log(`  ✅ Transferidas ${resultPrincipal.count} NFs principais`)
  } else {
    console.log(`  ℹ️  Nenhuma NF principal para transferir`)
  }

  // Transferir NFs secundárias (fornecedor_secundario_id)
  if (fornExcluir._count.notasFiscaisSecundario > 0) {
    const resultSecundario = await prisma.notaFiscal.updateMany({
      where: { fornecedorSecundarioId: fornecedorSemCnpj },
      data: { fornecedorSecundarioId: fornecedorComCnpj }
    })
    console.log(`  ✅ Transferidas ${resultSecundario.count} NFs secundárias`)
  } else {
    console.log(`  ℹ️  Nenhuma NF secundária para transferir`)
  }

  // Verificar se ainda há alguma referência ao fornecedor a ser excluído
  const nfsRestantes = await prisma.notaFiscal.count({
    where: {
      OR: [
        { fornecedorId: fornecedorSemCnpj },
        { fornecedorSecundarioId: fornecedorSemCnpj }
      ]
    }
  })

  if (nfsRestantes > 0) {
    console.log(`\n⚠️  AVISO: Ainda existem ${nfsRestantes} NFs vinculadas ao fornecedor a ser excluído!`)
    console.log('   Abortando exclusão por segurança.')
    return
  }

  // Excluir fornecedor duplicado
  console.log('\n🗑️  Excluindo fornecedor duplicado...')
  await prisma.fornecedor.delete({
    where: { id: fornecedorSemCnpj }
  })
  console.log('  ✅ Fornecedor excluído com sucesso')

  // Verificar resultado final
  const fornecedorFinal = await prisma.fornecedor.findUnique({
    where: { id: fornecedorComCnpj },
    include: {
      _count: {
        select: {
          notasFiscais: true,
          notasFiscaisSecundario: true
        }
      }
    }
  })

  console.log('\n' + '='.repeat(80))
  console.log('📊 RESULTADO FINAL')
  console.log('='.repeat(80))
  console.log(`Fornecedor: ${fornecedorFinal?.nome}`)
  console.log(`CNPJ: ${fornecedorFinal?.cnpj}`)
  console.log(`Código: ${fornecedorFinal?.codigo}`)
  console.log(`Total de NFs: ${(fornecedorFinal?._count.notasFiscais || 0) + (fornecedorFinal?._count.notasFiscaisSecundario || 0)}`)
  console.log(`  - Principais: ${fornecedorFinal?._count.notasFiscais}`)
  console.log(`  - Secundárias: ${fornecedorFinal?._count.notasFiscaisSecundario}`)

  console.log('\n' + '='.repeat(80))
  console.log('✅ Mesclagem concluída com sucesso!')
  console.log('='.repeat(80))

  await prisma.$disconnect()
}

main()
  .catch((e) => {
    console.error('❌ Erro fatal:', e)
    process.exit(1)
  })
