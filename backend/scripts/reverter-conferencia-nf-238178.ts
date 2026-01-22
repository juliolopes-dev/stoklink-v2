import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function reverterConferencia() {
  try {
    console.log('🔄 Iniciando reversão da conferência incorreta da NF 238178...')

    const notaFiscalId = 'c13028b6-4786-4227-9dbb-02e2e1c7039c'
    const conferenciaId = '1dffd815-6901-4331-b774-fb6e1a9b6ac5'

    // 1. Buscar dados atuais da NF
    const nf = await prisma.notaFiscal.findUnique({
      where: { id: notaFiscalId },
      select: {
        numero: true,
        status: true,
        fornecedorNome: true,
        filialDestino: { select: { nome: true } }
      }
    })

    if (!nf) {
      console.error('❌ Nota fiscal não encontrada!')
      return
    }

    console.log(`📋 NF ${nf.numero} - ${nf.fornecedorNome}`)
    console.log(`   Status atual: ${nf.status}`)
    console.log(`   Filial destino: ${nf.filialDestino.nome}`)

    // 2. Deletar conferência de volumes incorreta
    await prisma.conferenciaVolume.delete({
      where: { id: conferenciaId }
    })
    console.log('✅ Conferência de volumes deletada')

    // 3. Resetar status da NF para PENDENTE_TRANSFERENCIA
    await prisma.notaFiscal.update({
      where: { id: notaFiscalId },
      data: {
        status: 'PENDENTE_TRANSFERENCIA',
        filialRecebimentoId: null
      }
    })
    console.log('✅ Status resetado para PENDENTE_TRANSFERENCIA')
    console.log('✅ Filial de recebimento limpa')

    // 4. Verificar resultado final
    const nfAtualizada = await prisma.notaFiscal.findUnique({
      where: { id: notaFiscalId },
      select: {
        numero: true,
        status: true,
        filialRecebimento: { select: { nome: true } }
      }
    })

    console.log('\n📊 Resultado final:')
    console.log(`   NF: ${nfAtualizada?.numero}`)
    console.log(`   Status: ${nfAtualizada?.status}`)
    console.log(`   Filial recebimento: ${nfAtualizada?.filialRecebimento?.nome || 'null'}`)
    console.log('\n✅ Reversão concluída com sucesso!')

  } catch (error) {
    console.error('❌ Erro ao reverter conferência:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

reverterConferencia()
