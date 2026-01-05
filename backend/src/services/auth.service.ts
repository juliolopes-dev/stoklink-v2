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
