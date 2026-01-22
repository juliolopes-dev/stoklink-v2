import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient({
  log: ['error', 'warn']
})

async function main() {
  console.log('🔄 Resetando senha do usuário fagner@gmail.com...')

  try {
    const email = 'fagner@gmail.com'
    const novaSenha = '123456'

    // Verificar se o usuário existe
    const usuario = await prisma.usuario.findUnique({
      where: { email }
    })

    if (!usuario) {
      console.log('❌ Usuário não encontrado')
      return
    }

    console.log(`✅ Usuário encontrado: ${usuario.nome}`)

    // Gerar hash da nova senha
    const senhaHash = await bcrypt.hash(novaSenha, 10)

    // Atualizar senha
    await prisma.usuario.update({
      where: { email },
      data: { senha: senhaHash }
    })

    console.log('✅ Senha resetada com sucesso!')
    console.log(`📧 Email: ${email}`)
    console.log(`🔑 Nova senha: ${novaSenha}`)
    console.log('\n⚠️ IMPORTANTE: Oriente o usuário a alterar esta senha após o primeiro login!')

  } catch (error) {
    console.error('❌ Erro ao resetar senha:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
