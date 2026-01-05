import { prisma } from '../lib/prisma.js'
import bcrypt from 'bcryptjs'

interface LoginInput {
  email: string
  senha: string
}

export class AuthService {
  async login({ email, senha }: LoginInput) {
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: {
        empresa: {
          select: {
            id: true,
            razaoSocial: true,
            nomeFantasia: true
          }
        },
        filial: {
          select: {
            id: true,
            nome: true,
            codigo: true
          }
        }
      }
    })

    if (!usuario) {
      throw new Error('Credenciais inválidas')
    }

    if (!usuario.ativo) {
      throw new Error('Usuário inativo')
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha)

    if (!senhaValida) {
      throw new Error('Credenciais inválidas')
    }

    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      empresaId: usuario.empresaId,
      empresa: usuario.empresa,
      filialId: usuario.filialId,
      filial: usuario.filial
    }
  }

  async changePassword(userId: string, senhaAtual: string, novaSenha: string) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId }
    })

    if (!usuario) {
      throw new Error('Usuário não encontrado')
    }

    const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha)

    if (!senhaValida) {
      throw new Error('Senha atual incorreta')
    }

    const senhaHash = await bcrypt.hash(novaSenha, 10)

    await prisma.usuario.update({
      where: { id: userId },
      data: { senha: senhaHash }
    })

    return { message: 'Senha alterada com sucesso' }
  }

  async getProfile(userId: string) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      include: {
        empresa: {
          select: {
            id: true,
            razaoSocial: true,
            nomeFantasia: true
          }
        },
        filial: {
          select: {
            id: true,
            nome: true,
            codigo: true
          }
        }
      }
    })

    if (!usuario) {
      throw new Error('Usuário não encontrado')
    }

    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      empresaId: usuario.empresaId,
      empresa: usuario.empresa,
      filialId: usuario.filialId,
      filial: usuario.filial
    }
  }
}
