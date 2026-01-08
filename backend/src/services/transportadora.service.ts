import { prisma } from '../lib/prisma.js'

function normalizeCnpj(cnpj: string | null | undefined): string | null {
  if (!cnpj) return null
  return cnpj.replace(/[^\d]/g, '')
}

interface CreateTransportadoraInput {
  empresaId: string
  nome: string
  cnpj?: string
  telefone?: string
  email?: string
}

interface UpdateTransportadoraInput {
  nome?: string
  cnpj?: string
  telefone?: string
  email?: string
  ativo?: boolean
}

export const transportadoraService = {
  async findAll(empresaId: string, apenasAtivos = false) {
    return prisma.transportadora.findMany({
      where: { empresaId, ...(apenasAtivos ? { ativo: true } : {}) },
      orderBy: { nome: 'asc' }
    })
  },

  async findById(id: string, empresaId: string) {
    return prisma.transportadora.findFirst({
      where: { id, empresaId }
    })
  },

  async create(data: CreateTransportadoraInput) {
    const cnpjNormalizado = normalizeCnpj(data.cnpj)
    
    const existente = await prisma.transportadora.findFirst({
      where: { nome: data.nome, empresaId: data.empresaId }
    })
    if (existente) {
      throw new Error('Já existe uma transportadora com este nome')
    }

    return prisma.transportadora.create({
      data: {
        empresaId: data.empresaId,
        nome: data.nome,
        cnpj: cnpjNormalizado,
        telefone: data.telefone || null,
        email: data.email || null
      }
    })
  },

  async update(id: string, empresaId: string, data: UpdateTransportadoraInput) {
    const transportadora = await prisma.transportadora.findFirst({
      where: { id, empresaId }
    })
    if (!transportadora) {
      throw new Error('Transportadora não encontrada')
    }

    const cnpjNormalizado = data.cnpj !== undefined ? normalizeCnpj(data.cnpj) : undefined

    if (data.nome && data.nome !== transportadora.nome) {
      const existente = await prisma.transportadora.findFirst({
        where: { nome: data.nome, empresaId }
      })
      if (existente) {
        throw new Error('Já existe uma transportadora com este nome')
      }
    }

    return prisma.transportadora.update({
      where: { id },
      data: {
        ...data,
        cnpj: cnpjNormalizado !== undefined ? cnpjNormalizado : undefined
      }
    })
  },

  async delete(id: string, empresaId: string) {
    const transportadora = await prisma.transportadora.findFirst({
      where: { id, empresaId }
    })

    if (!transportadora) {
      throw new Error('Transportadora não encontrada')
    }

    return prisma.transportadora.delete({
      where: { id }
    })
  }
}
