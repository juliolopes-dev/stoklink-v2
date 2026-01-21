import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function corrigirConferenciaNF181390() {
  try {
    console.log('🔍 Buscando NF 181390...')
    
    // Buscar a NF
    const nf = await prisma.notaFiscal.findFirst({
      where: { numero: '181390' },
      include: {
        conferenciasVolumes: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!nf) {
      console.log('❌ NF 181390 não encontrada')
      return
    }

    console.log(`\n📦 NF 181390 encontrada:`)
    console.log(`   ID: ${nf.id}`)
    console.log(`   Volumes esperados: ${nf.quantidadeVolumes}`)
    console.log(`   Status atual: ${nf.status}`)

    if (nf.conferenciasVolumes.length > 0) {
      const conferencia = nf.conferenciasVolumes[0]
      console.log(`\n📋 Conferência atual:`)
      console.log(`   Volumes conferidos: ${conferencia.volumesRecebidos}`)
      console.log(`   Volumes batendo: ${conferencia.volumesBatendo}`)
      console.log(`   Data: ${conferencia.createdAt}`)

      // Corrigir conferência
      console.log(`\n🔧 Corrigindo conferência...`)
      console.log(`   Alterando de ${conferencia.volumesRecebidos} para 6 volumes`)
      console.log(`   Marcando volumesBatendo como FALSE (divergência)`)

      await prisma.conferenciaVolume.update({
        where: { id: conferencia.id },
        data: {
          volumesRecebidos: 6,
          volumesBatendo: false
        }
      })

      console.log(`   ✅ Conferência atualizada!`)
    }

    // Atualizar status da NF para VOLUMES_DIVERGENTES
    console.log(`\n🔧 Atualizando status da NF...`)
    console.log(`   Status anterior: ${nf.status}`)
    console.log(`   Novo status: VOLUMES_DIVERGENTES`)

    await prisma.notaFiscal.update({
      where: { id: nf.id },
      data: { status: 'VOLUMES_DIVERGENTES' }
    })

    console.log(`   ✅ Status atualizado!`)

    console.log('\n✅ Correção concluída!')
    console.log('\n📊 Resumo:')
    console.log(`   - Volumes esperados: 8`)
    console.log(`   - Volumes recebidos: 6`)
    console.log(`   - Divergência: -2 volumes`)
    console.log(`   - Status: VOLUMES_DIVERGENTES`)

  } catch (error) {
    console.error('❌ Erro ao corrigir conferência:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

corrigirConferenciaNF181390()
