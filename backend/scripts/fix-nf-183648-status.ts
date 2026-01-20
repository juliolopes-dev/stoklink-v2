import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixNF183648() {
  console.log('🔧 Corrigindo status da NF 183648...\n')

  try {
    // Verificar status atual
    const nf = await prisma.notaFiscal.findFirst({
      where: { numero: '183648' },
      select: {
        id: true,
        numero: true,
        status: true,
        filialRecebimentoId: true,
        filialDestinoId: true
      }
    })

    if (!nf) {
      console.log('❌ NF 183648 não encontrada')
      return
    }

    console.log('📊 Status atual:', nf.status)
    console.log('   Filial recebimento:', nf.filialRecebimentoId)
    console.log('   Filial destino:', nf.filialDestinoId)

    // Atualizar status para AGUARDANDO_CONFERENCIA
    await prisma.notaFiscal.update({
      where: { id: nf.id },
      data: {
        status: 'AGUARDANDO_CONFERENCIA'
      }
    })

    console.log('\n✅ Status atualizado para AGUARDANDO_CONFERENCIA')
    console.log('   Agora é possível conferir os itens da NF 183648')

  } catch (error) {
    console.error('❌ Erro ao corrigir status:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

fixNF183648()
  .then(() => {
    console.log('\n🎉 Script finalizado!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Falha na correção:', error)
    process.exit(1)
  })
