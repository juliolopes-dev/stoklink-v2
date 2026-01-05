import { prisma } from '../lib/prisma.js'

interface CreateDivergenciaInput {
  notaFiscalId: string
  itemNotaFiscalId?: string
  tipo: string
  descricao: string
  quantidadeEsperada?: number
  quantidadeRecebida?: number
}

interface ResolverDivergenciaInput {
  id: string
  observacoesResolucao?: string
}

export class DivergenciaService {
  async findByNotaFiscal(notaFiscalId: string) {
    return prisma.divergencia.findMany({
      where: { notaFiscalId },
      include: {
        itemNotaFiscal: {
          select: {
            id: true,
            codigoProduto: true,
            descricao: true,
            quantidadeNota: true,
            quantidadeConferida: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  async findAll(filters?: { resolvida?: boolean; notaFiscalId?: string }) {
    const where: Record<string, unknown> = {}

    if (filters?.resolvida !== undefined) {
      where.resolvida = filters.resolvida
    }

    if (filters?.notaFiscalId) {
      where.notaFiscalId = filters.notaFiscalId
    }

    return prisma.divergencia.findMany({
      where,
      include: {
        notaFiscal: {
          select: {
            id: true,
            numero: true,
            fornecedorNome: true,
            status: true
          }
        },
        itemNotaFiscal: {
          select: {
            id: true,
            codigoProduto: true,
            descricao: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  async findById(id: string) {
    const divergencia = await prisma.divergencia.findUnique({
      where: { id },
      include: {
        notaFiscal: {
          select: {
            id: true,
            numero: true,
            fornecedorNome: true,
            fornecedorCnpj: true,
            status: true
          }
        },
        itemNotaFiscal: {
          select: {
            id: true,
            codigoProduto: true,
            descricao: true,
            quantidadeNota: true,
            quantidadeConferida: true
          }
        }
      }
    })

    if (!divergencia) {
      throw new Error('Divergência não encontrada')
    }

    return divergencia
  }

  async create(input: CreateDivergenciaInput) {
    const notaFiscal = await prisma.notaFiscal.findUnique({
      where: { id: input.notaFiscalId }
    })

    if (!notaFiscal) {
      throw new Error('Nota fiscal não encontrada')
    }

    if (input.itemNotaFiscalId) {
      const item = await prisma.itemNotaFiscal.findUnique({
        where: { id: input.itemNotaFiscalId }
      })

      if (!item) {
        throw new Error('Item da nota fiscal não encontrado')
      }

      if (item.notaFiscalId !== input.notaFiscalId) {
        throw new Error('Item não pertence a esta nota fiscal')
      }
    }

    return prisma.divergencia.create({
      data: {
        notaFiscalId: input.notaFiscalId,
        itemNotaFiscalId: input.itemNotaFiscalId,
        tipo: input.tipo,
        descricao: input.descricao,
        quantidadeEsperada: input.quantidadeEsperada,
        quantidadeRecebida: input.quantidadeRecebida
      },
      include: {
        itemNotaFiscal: {
          select: {
            id: true,
            codigoProduto: true,
            descricao: true
          }
        }
      }
    })
  }

  async resolver(input: ResolverDivergenciaInput) {
    const divergencia = await prisma.divergencia.findUnique({
      where: { id: input.id }
    })

    if (!divergencia) {
      throw new Error('Divergência não encontrada')
    }

    if (divergencia.resolvida) {
      throw new Error('Esta divergência já foi resolvida')
    }

    return prisma.divergencia.update({
      where: { id: input.id },
      data: {
        resolvida: true,
        dataResolucao: new Date(),
        observacoesResolucao: input.observacoesResolucao
      }
    })
  }

  async delete(id: string) {
    const divergencia = await prisma.divergencia.findUnique({
      where: { id }
    })

    if (!divergencia) {
      throw new Error('Divergência não encontrada')
    }

    return prisma.divergencia.delete({
      where: { id }
    })
  }

  async getResumo() {
    const [total, pendentes, resolvidas] = await Promise.all([
      prisma.divergencia.count(),
      prisma.divergencia.count({ where: { resolvida: false } }),
      prisma.divergencia.count({ where: { resolvida: true } })
    ])

    const porTipo = await prisma.divergencia.groupBy({
      by: ['tipo'],
      _count: { tipo: true },
      where: { resolvida: false }
    })

    return {
      total,
      pendentes,
      resolvidas,
      porTipo: porTipo.map((t: { tipo: string; _count: { tipo: number } }) => ({ tipo: t.tipo, quantidade: t._count.tipo }))
    }
  }
}
