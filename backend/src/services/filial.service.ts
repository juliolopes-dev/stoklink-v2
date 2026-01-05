import { prisma } from '../lib/prisma.js'

interface CreateFilialInput {
  empresaId: string
  nome: string
  codigo: string
  endereco?: string
  cidade?: string
  uf?: string
  ehCD?: boolean
}

interface UpdateFilialInput {
  nome?: string
  codigo?: string
  endereco?: string
  cidade?: string
  uf?: string
  ehCD?: boolean
  ativo?: boolean
}

export class FilialService {
  async findAll(empresaId: string) {
    return prisma.filial.findMany({
      where: { empresaId },
      include: {
        _count: {
          select: { usuarios: true }
        }
      },
      orderBy: { nome: 'asc' }
    })
  }

  async findAllAtivas(empresaId: string) {
    return prisma.filial.findMany({
      where: { empresaId, ativo: true },
      orderBy: { nome: 'asc' }
    })
  }

  async findById(id: string, empresaId: string) {
    const filial = await prisma.filial.findFirst({
      where: { id, empresaId }
    })

    if (!filial) {
      throw new Error('Filial não encontrada')
    }

    return filial
  }

  async create(data: CreateFilialInput) {
    const existente = await prisma.filial.findFirst({
      where: { empresaId: data.empresaId, codigo: data.codigo }
    })

    if (existente) {
      throw new Error('Já existe uma filial com este código')
    }

    return prisma.filial.create({
      data: {
        empresaId: data.empresaId,
        nome: data.nome,
        codigo: data.codigo,
        endereco: data.endereco,
        cidade: data.cidade,
        uf: data.uf,
        ehCD: data.ehCD ?? false
      }
    })
  }

  async update(id: string, empresaId: string, data: UpdateFilialInput) {
    const filial = await prisma.filial.findFirst({
      where: { id, empresaId }
    })

    if (!filial) {
      throw new Error('Filial não encontrada')
    }

    if (data.codigo && data.codigo !== filial.codigo) {
      const existente = await prisma.filial.findFirst({
        where: { empresaId, codigo: data.codigo }
      })

      if (existente) {
        throw new Error('Já existe uma filial com este código')
      }
    }

    return prisma.filial.update({
      where: { id },
      data
    })
  }

  async delete(id: string, empresaId: string) {
    const filial = await prisma.filial.findFirst({
      where: { id, empresaId },
      include: {
        usuarios: { take: 1 },
        notasRecebidas: { take: 1 },
        notasDestino: { take: 1 }
      }
    })

    if (!filial) {
      throw new Error('Filial não encontrada')
    }

    const temDependencias = 
      filial.usuarios.length > 0 || 
      filial.notasRecebidas.length > 0 || 
      filial.notasDestino.length > 0

    if (temDependencias) {
      return prisma.filial.update({
        where: { id },
        data: { ativo: false }
      })
    }

    return prisma.filial.delete({
      where: { id }
    })
  }
}
