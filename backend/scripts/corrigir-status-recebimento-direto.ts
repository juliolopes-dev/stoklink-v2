import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function corrigirStatusRecebimentoDireto() {
  try {
    console.log('🔍 Buscando NFs com recebimento direto e status incorreto...')
    
    // Buscar todas as NFs com status AGUARDANDO_CONFERENCIA que já têm filial de recebimento
    const nfsCandidatas = await prisma.notaFiscal.findMany({
      where: {
        status: 'AGUARDANDO_CONFERENCIA',
        filialRecebimentoId: { not: null }
      },
      include: {
        filialRecebimento: { select: { id: true, nome: true } },
        filialDestino: { select: { id: true, nome: true } },
        conferenciasVolumes: {
          where: { tipo: 'RECEBIMENTO', volumesBatendo: true },
          take: 1
        }
      }
    })

    // Filtrar apenas as que têm recebimento direto (filialRecebimento = filialDestino)
    const nfsParaCorrigir = nfsCandidatas.filter(nf => 
      nf.filialRecebimentoId === nf.filialDestinoId && 
      nf.conferenciasVolumes.length > 0
    )

    console.log(`📦 Encontradas ${nfsParaCorrigir.length} NFs para corrigir`)

    if (nfsParaCorrigir.length === 0) {
      console.log('✅ Nenhuma NF precisa de correção')
      return
    }

    let corrigidas = 0

    // Atualizar cada NF
    for (const nf of nfsParaCorrigir) {
      console.log(`\n📝 Corrigindo NF ${nf.numero}:`)
      console.log(`   Filial: ${nf.filialRecebimento?.nome}`)
      console.log(`   Status atual: ${nf.status}`)
      console.log(`   Novo status: VOLUMES_CONFERIDOS`)

      await prisma.notaFiscal.update({
        where: { id: nf.id },
        data: { status: 'VOLUMES_CONFERIDOS' }
      })

      console.log(`   ✅ Status atualizado!`)
      corrigidas++
    }

    console.log('\n✅ Correção concluída!')
    console.log(`📊 Total de NFs corrigidas: ${corrigidas}`)

  } catch (error) {
    console.error('❌ Erro ao corrigir status:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

corrigirStatusRecebimentoDireto()
