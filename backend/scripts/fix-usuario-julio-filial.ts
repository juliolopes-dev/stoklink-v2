import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixUsuarioJulio() {
  console.log('🔧 Associando usuário Julio Lopes à filial PICOS-06...\n')

  try {
    // Buscar filial PICOS-06
    const filial = await prisma.filial.findFirst({
      where: { codigo: '06' }
    })

    if (!filial) {
      console.log('❌ Filial PICOS-06 não encontrada')
      return
    }

    // Atualizar usuário
    await prisma.usuario.update({
      where: { email: 'juliofranlopes18@gmail.com' },
      data: {
        filialId: filial.id
      }
    })

    console.log('✅ Usuário Julio Lopes associado à filial PICOS-06')
    console.log(`   Filial ID: ${filial.id}`)
    console.log(`   Filial: ${filial.nome} (${filial.codigo})`)

  } catch (error) {
    console.error('❌ Erro ao atualizar usuário:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

fixUsuarioJulio()
  .then(() => {
    console.log('\n🎉 Script finalizado!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Falha:', error)
    process.exit(1)
  })
