import { prisma } from '../lib/prisma.js'

// Remove formatação do CNPJ (pontos, barras, traços)
function normalizeCnpj(cnpj: string | null | undefined): string | null {
  if (!cnpj) return null
  return cnpj.replace(/[^\d]/g, '')
}

interface CreateFornecedorInput {
  empresaId: string
  nome: string
  cnpj?: string
  email?: string
  telefone?: string
  endereco?: string
  cidade?: string
  uf?: string
}

interface UpdateFornecedorInput {
  nome?: string
  cnpj?: string
  email?: string
  telefone?: string
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
            notasFiscais: true,
            notasFiscaisSecundario: true
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
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            numero: true,
            numeroSecundario: true,
            dataRecebimento: true,
            status: true,
            valorTotal: true,
            mercadoriaBloqueada: true
          }
        },
        notasFiscaisSecundario: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            numero: true,
            numeroSecundario: true,
            dataRecebimento: true,
            status: true,
            valorTotal: true,
            mercadoriaBloqueada: true
          }
        },
        _count: {
          select: {
            notasFiscais: true,
            notasFiscaisSecundario: true
          }
        }
      }
    })
  },

  async findByCnpj(cnpj: string, empresaId: string) {
    const cnpjNormalizado = normalizeCnpj(cnpj)
    return prisma.fornecedor.findFirst({
      where: { cnpj: cnpjNormalizado, empresaId }
    })
  },

  async findOrCreate(empresaId: string, nome: string, cnpj?: string) {
    const cnpjNormalizado = normalizeCnpj(cnpj)
    
    // CNPJ é obrigatório para importação de notas fiscais
    if (!cnpjNormalizado) {
      throw new Error(
        `Fornecedor "${nome}" não possui CNPJ no XML. ` +
        `Não é possível importar notas fiscais sem CNPJ do fornecedor.`
      )
    }

    // Busca fornecedor por CNPJ
    const existente = await prisma.fornecedor.findFirst({
      where: { cnpj: cnpjNormalizado, empresaId }
    })

    // Se não encontrou, retorna erro - não cria automaticamente
    if (!existente) {
      throw new Error(
        `Fornecedor não encontrado no banco de dados. ` +
        `CNPJ: ${cnpj} - Nome: ${nome}. ` +
        `Cadastre o fornecedor antes de importar a nota fiscal.`
      )
    }

    return existente
  },

  async create(data: CreateFornecedorInput) {
    const cnpjNormalizado = normalizeCnpj(data.cnpj)
    
    // Verifica se CNPJ já existe na empresa
    if (cnpjNormalizado) {
      const existente = await prisma.fornecedor.findFirst({
        where: { cnpj: cnpjNormalizado, empresaId: data.empresaId }
      })
      if (existente) {
        throw new Error('Já existe um fornecedor com este CNPJ')
      }
    }

    return prisma.fornecedor.create({
      data: {
        empresaId: data.empresaId,
        nome: data.nome,
        cnpj: cnpjNormalizado,
        email: data.email || null,
        telefone: data.telefone || null,
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

    // Normaliza CNPJ se fornecido
    const cnpjNormalizado = data.cnpj !== undefined ? normalizeCnpj(data.cnpj) : undefined

    // Se está alterando CNPJ, verifica se já existe na empresa
    if (cnpjNormalizado && cnpjNormalizado !== fornecedor.cnpj) {
      const existente = await prisma.fornecedor.findFirst({
        where: { cnpj: cnpjNormalizado, empresaId }
      })
      if (existente) {
        throw new Error('Já existe um fornecedor com este CNPJ')
      }
    }

    return prisma.fornecedor.update({
      where: { id },
      data: {
        ...data,
        cnpj: cnpjNormalizado !== undefined ? cnpjNormalizado : undefined
      }
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
