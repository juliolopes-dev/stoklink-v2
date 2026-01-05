import { prisma } from '../lib/prisma.js'

interface CreateFornecedorInput {
  empresaId: string
  nome: string
  cnpj?: string
  email?: string
  telefone?: string
  contato?: string
  endereco?: string
  cidade?: string
  uf?: string
}

interface UpdateFornecedorInput {
  nome?: string
  cnpj?: string
  email?: string
  telefone?: string
  contato?: string
  endereco?: string
  cidade?: string
  uf?: string
  ativo?: boolean
}

export const fornecedorService = {
  async findAll(empresaId: string, apenasAtivos = false) {
    return prisma.fornecedor.findMany({
      where: { empresaId, ...(apenasAtivos ? { ativo: true } : {}) },
      orderBy: { nome: 'asc' },
      include: {
        _count: {
          select: {
            notasFiscais: true
          }
        }
      }
    })
  },

  async findById(id: string, empresaId: string) {
    return prisma.fornecedor.findFirst({
      where: { id, empresaId },
      include: {
        notasFiscais: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            numero: true,
            dataRecebimento: true,
            status: true,
            valorTotal: true
          }
        },
        _count: {
          select: {
            notasFiscais: true
          }
        }
      }
    })
  },

  async findByCnpj(cnpj: string, empresaId: string) {
    return prisma.fornecedor.findFirst({
      where: { cnpj, empresaId }
    })
  },

  async findOrCreate(empresaId: string, nome: string, cnpj?: string) {
    // Se tem CNPJ, tenta encontrar por CNPJ
    if (cnpj) {
      const existente = await prisma.fornecedor.findFirst({
        where: { cnpj, empresaId }
      })
      if (existente) return existente
    }

    // Cria novo fornecedor
    return prisma.fornecedor.create({
      data: {
        empresaId,
        nome,
        cnpj: cnpj || null
      }
    })
  },

  async create(data: CreateFornecedorInput) {
    // Verifica se CNPJ já existe na empresa
    if (data.cnpj) {
      const existente = await prisma.fornecedor.findFirst({
        where: { cnpj: data.cnpj, empresaId: data.empresaId }
      })
      if (existente) {
        throw new Error('Já existe um fornecedor com este CNPJ')
      }
    }

    return prisma.fornecedor.create({
      data: {
        empresaId: data.empresaId,
        nome: data.nome,
        cnpj: data.cnpj || null,
        email: data.email || null,
        telefone: data.telefone || null,
        contato: data.contato || null,
        endereco: data.endereco || null,
        cidade: data.cidade || null,
        uf: data.uf || null
      }
    })
  },

  async update(id: string, empresaId: string, data: UpdateFornecedorInput) {
    // Verifica se fornecedor existe na empresa
    const fornecedor = await prisma.fornecedor.findFirst({
      where: { id, empresaId }
    })
    if (!fornecedor) {
      throw new Error('Fornecedor não encontrado')
    }

    // Se está alterando CNPJ, verifica se já existe na empresa
    if (data.cnpj && data.cnpj !== fornecedor.cnpj) {
      const existente = await prisma.fornecedor.findFirst({
        where: { cnpj: data.cnpj, empresaId }
      })
      if (existente) {
        throw new Error('Já existe um fornecedor com este CNPJ')
      }
    }

    return prisma.fornecedor.update({
      where: { id },
      data
    })
  },

  async delete(id: string, empresaId: string) {
    // Verifica se tem NFs vinculadas
    const fornecedor = await prisma.fornecedor.findFirst({
      where: { id, empresaId },
      include: {
        _count: {
          select: { notasFiscais: true }
        }
      }
    })

    if (!fornecedor) {
      throw new Error('Fornecedor não encontrado')
    }

    if (fornecedor._count.notasFiscais > 0) {
      throw new Error('Não é possível excluir fornecedor com notas fiscais vinculadas')
    }

    return prisma.fornecedor.delete({
      where: { id }
    })
  },

  async getResumo(empresaId: string) {
    const [total, ativos, comNFs] = await Promise.all([
      prisma.fornecedor.count({ where: { empresaId } }),
      prisma.fornecedor.count({ where: { empresaId, ativo: true } }),
      prisma.fornecedor.count({
        where: {
          empresaId,
          notasFiscais: { some: {} }
        }
      })
    ])

    return { total, ativos, comNFs }
  }
}
