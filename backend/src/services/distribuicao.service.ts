import { prisma } from '../lib/prisma.js'

interface CreateDistribuicaoInput {
  notaFiscalId: string
  filialOrigemId: string
  filialDestinoId: string
  urgente?: boolean
  observacoes?: string
}

interface UpdateDistribuicaoInput {
  status?: string
  observacoes?: string
  dataDistribuicao?: Date
}

export class DistribuicaoService {
  async findByNotaFiscal(notaFiscalId: string) {
    return prisma.distribuicao.findMany({
      where: { notaFiscalId },
      include: {
        filialOrigem: {
          select: { id: true, nome: true, codigo: true }
        },
        filialDestino: {
          select: { id: true, nome: true, codigo: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  async findAll(filters?: { status?: string; urgente?: boolean; filialDestinoId?: string }) {
    const where: Record<string, unknown> = {}

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.urgente !== undefined) {
      where.urgente = filters.urgente
    }

    if (filters?.filialDestinoId) {
      where.filialDestinoId = filters.filialDestinoId
    }

    return prisma.distribuicao.findMany({
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
        filialOrigem: {
          select: { id: true, nome: true, codigo: true }
        },
        filialDestino: {
          select: { id: true, nome: true, codigo: true }
        }
      },
      orderBy: [
        { urgente: 'desc' },
        { createdAt: 'desc' }
      ]
    })
  }

  async findById(id: string) {
    const distribuicao = await prisma.distribuicao.findUnique({
      where: { id },
      include: {
        notaFiscal: {
          select: {
            id: true,
            numero: true,
            fornecedorNome: true,
            status: true,
            quantidadeVolumes: true
          }
        },
        filialOrigem: {
          select: { id: true, nome: true, codigo: true, cidade: true, uf: true }
        },
        filialDestino: {
          select: { id: true, nome: true, codigo: true, cidade: true, uf: true }
        }
      }
    })

    if (!distribuicao) {
      throw new Error('Distribuição não encontrada')
    }

    return distribuicao
  }

  async create(input: CreateDistribuicaoInput) {
    const notaFiscal = await prisma.notaFiscal.findUnique({
      where: { id: input.notaFiscalId }
    })

    if (!notaFiscal) {
      throw new Error('Nota fiscal não encontrada')
    }

    const [filialOrigem, filialDestino] = await Promise.all([
      prisma.filial.findUnique({ where: { id: input.filialOrigemId } }),
      prisma.filial.findUnique({ where: { id: input.filialDestinoId } })
    ])

    if (!filialOrigem) {
      throw new Error('Filial de origem não encontrada')
    }

    if (!filialDestino) {
      throw new Error('Filial de destino não encontrada')
    }

    if (input.filialOrigemId === input.filialDestinoId) {
      throw new Error('Filial de origem e destino não podem ser iguais')
    }

    return prisma.distribuicao.create({
      data: {
        notaFiscalId: input.notaFiscalId,
        filialOrigemId: input.filialOrigemId,
        filialDestinoId: input.filialDestinoId,
        urgente: input.urgente ?? false,
        status: 'PENDENTE',
        observacoes: input.observacoes
      },
      include: {
        filialOrigem: {
          select: { id: true, nome: true, codigo: true }
        },
        filialDestino: {
          select: { id: true, nome: true, codigo: true }
        }
      }
    })
  }

  async update(id: string, input: UpdateDistribuicaoInput) {
    const distribuicao = await prisma.distribuicao.findUnique({
      where: { id }
    })

    if (!distribuicao) {
      throw new Error('Distribuição não encontrada')
    }

    return prisma.distribuicao.update({
      where: { id },
      data: input,
      include: {
        filialOrigem: {
          select: { id: true, nome: true, codigo: true }
        },
        filialDestino: {
          select: { id: true, nome: true, codigo: true }
        }
      }
    })
  }

  async confirmarEnvio(id: string) {
    const distribuicao = await prisma.distribuicao.findUnique({
      where: { id }
    })

    if (!distribuicao) {
      throw new Error('Distribuição não encontrada')
    }

    if (distribuicao.status !== 'PENDENTE') {
      throw new Error('Esta distribuição não está pendente')
    }

    return prisma.distribuicao.update({
      where: { id },
      data: {
        status: 'EM_TRANSITO',
        dataDistribuicao: new Date()
      }
    })
  }

  async confirmarRecebimento(id: string) {
    const distribuicao = await prisma.distribuicao.findUnique({
      where: { id }
    })

    if (!distribuicao) {
      throw new Error('Distribuição não encontrada')
    }

    if (distribuicao.status !== 'EM_TRANSITO') {
      throw new Error('Esta distribuição não está em trânsito')
    }

    return prisma.distribuicao.update({
      where: { id },
      data: {
        status: 'ENTREGUE'
      }
    })
  }

  async cancelar(id: string, motivo?: string) {
    const distribuicao = await prisma.distribuicao.findUnique({
      where: { id }
    })

    if (!distribuicao) {
      throw new Error('Distribuição não encontrada')
    }

    if (distribuicao.status === 'ENTREGUE') {
      throw new Error('Não é possível cancelar uma distribuição já entregue')
    }

    return prisma.distribuicao.update({
      where: { id },
      data: {
        status: 'CANCELADO',
        observacoes: motivo ? `${distribuicao.observacoes || ''}\nMotivo cancelamento: ${motivo}`.trim() : distribuicao.observacoes
      }
    })
  }

  async delete(id: string) {
    const distribuicao = await prisma.distribuicao.findUnique({
      where: { id }
    })

    if (!distribuicao) {
      throw new Error('Distribuição não encontrada')
    }

    if (distribuicao.status !== 'PENDENTE') {
      throw new Error('Só é possível excluir distribuições pendentes')
    }

    return prisma.distribuicao.delete({
      where: { id }
    })
  }

  async getResumo() {
    const [total, pendentes, emTransito, entregues, urgentes] = await Promise.all([
      prisma.distribuicao.count(),
      prisma.distribuicao.count({ where: { status: 'PENDENTE' } }),
      prisma.distribuicao.count({ where: { status: 'EM_TRANSITO' } }),
      prisma.distribuicao.count({ where: { status: 'ENTREGUE' } }),
      prisma.distribuicao.count({ where: { urgente: true, status: { in: ['PENDENTE', 'EM_TRANSITO'] } } })
    ])

    return {
      total,
      pendentes,
      emTransito,
      entregues,
      urgentes
    }
  }
}
