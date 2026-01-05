import { prisma } from '../lib/prisma.js'
import bcrypt from 'bcryptjs'

type PerfilUsuario = 'ADMIN' | 'GERENTE' | 'CONFERENTE'

interface CreateUsuarioInput {
  empresaId: string
  nome: string
  email: string
  senha: string
  perfil?: PerfilUsuario
  filialId?: string
}

interface UpdateUsuarioInput {
  nome?: string
  email?: string
  senha?: string
  perfil?: PerfilUsuario
  filialId?: string | null
  ativo?: boolean
}

export class UsuarioService {
  async findAll(empresaId: string) {
    return prisma.usuario.findMany({
      where: { empresaId },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
        filialId: true,
        createdAt: true,
        updatedAt: true,
        filial: {
          select: {
            id: true,
            nome: true,
            codigo: true
          }
        }
      },
      orderBy: { nome: 'asc' }
    })
  }

  async findById(id: string, empresaId: string) {
    const usuario = await prisma.usuario.findFirst({
      where: { id, empresaId },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
        filialId: true,
        createdAt: true,
        updatedAt: true,
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

    return usuario
  }

  async create(data: CreateUsuarioInput) {
    const existente = await prisma.usuario.findUnique({
      where: { email: data.email }
    })

    if (existente) {
      throw new Error('Já existe um usuário com este email')
    }

    if (data.filialId) {
      const filial = await prisma.filial.findFirst({
        where: { id: data.filialId, empresaId: data.empresaId }
      })

      if (!filial) {
        throw new Error('Filial não encontrada')
      }
    }

    const senhaHash = await bcrypt.hash(data.senha, 10)

    const usuario = await prisma.usuario.create({
      data: {
        empresaId: data.empresaId,
        nome: data.nome,
        email: data.email,
        senha: senhaHash,
        perfil: data.perfil ?? 'CONFERENTE',
        filialId: data.filialId || null
      },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
        filialId: true,
        createdAt: true,
        filial: {
          select: {
            id: true,
            nome: true,
            codigo: true
          }
        }
      }
    })

    return usuario
  }

  async update(id: string, empresaId: string, data: UpdateUsuarioInput) {
    const usuario = await prisma.usuario.findFirst({
      where: { id, empresaId }
    })

    if (!usuario) {
      throw new Error('Usuário não encontrado')
    }

    if (data.email && data.email !== usuario.email) {
      const existente = await prisma.usuario.findUnique({
        where: { email: data.email }
      })

      if (existente) {
        throw new Error('Já existe um usuário com este email')
      }
    }

    if (data.filialId) {
      const filial = await prisma.filial.findFirst({
        where: { id: data.filialId, empresaId }
      })

      if (!filial) {
        throw new Error('Filial não encontrada')
      }
    }

    const updateData: Record<string, unknown> = { ...data }

    if (data.senha) {
      updateData.senha = await bcrypt.hash(data.senha, 10)
    }

    return prisma.usuario.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
        filialId: true,
        createdAt: true,
        updatedAt: true,
        filial: {
          select: {
            id: true,
            nome: true,
            codigo: true
          }
        }
      }
    })
  }

  async delete(id: string, empresaId: string) {
    const usuario = await prisma.usuario.findFirst({
      where: { id, empresaId },
      include: {
        notasCadastradas: { take: 1 },
        conferenciasVolumes: { take: 1 },
        conferenciasItens: { take: 1 }
      }
    })

    if (!usuario) {
      throw new Error('Usuário não encontrado')
    }

    const temDependencias = 
      usuario.notasCadastradas.length > 0 || 
      usuario.conferenciasVolumes.length > 0 || 
      usuario.conferenciasItens.length > 0

    if (temDependencias) {
      return prisma.usuario.update({
        where: { id },
        data: { ativo: false }
      })
    }

    return prisma.usuario.delete({
      where: { id }
    })
  }
}
