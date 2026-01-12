import { prisma } from '../lib/prisma.js'

interface CreateAuditLogInput {
  entidade: string
  entidadeId: string
  acao: string
  dadosAnteriores?: Record<string, unknown> | null
  dadosNovos?: Record<string, unknown> | null
  usuarioId: string
  usuarioNome?: string
  ipAddress?: string
}

export class AuditLogService {
  async create(input: CreateAuditLogInput) {
    return prisma.auditLog.create({
      data: {
        entidade: input.entidade,
        entidadeId: input.entidadeId,
        acao: input.acao,
        dadosAnteriores: input.dadosAnteriores || undefined,
        dadosNovos: input.dadosNovos || undefined,
        usuarioId: input.usuarioId,
        usuarioNome: input.usuarioNome,
        ipAddress: input.ipAddress
      }
    })
  }

  async findByEntidade(entidade: string, entidadeId: string) {
    return prisma.auditLog.findMany({
      where: {
        entidade,
        entidadeId
      },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  async findAll(filters?: { entidade?: string; usuarioId?: string; dataInicio?: Date; dataFim?: Date }) {
    const where: Record<string, unknown> = {}

    if (filters?.entidade) {
      where.entidade = filters.entidade
    }

    if (filters?.usuarioId) {
      where.usuarioId = filters.usuarioId
    }

    if (filters?.dataInicio || filters?.dataFim) {
      where.createdAt = {}
      if (filters?.dataInicio) {
        (where.createdAt as Record<string, unknown>).gte = filters.dataInicio
      }
      if (filters?.dataFim) {
        (where.createdAt as Record<string, unknown>).lte = filters.dataFim
      }
    }

    return prisma.auditLog.findMany({
      where,
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100
    })
  }

  async getResumo() {
    const logs = await prisma.auditLog.findMany({
      select: {
        entidade: true,
        acao: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 1000
    })

    // Agrupar por entidade
    const porEntidade: Record<string, number> = {}
    const porAcao: Record<string, number> = {}
    const ultimasHoras: Record<string, number> = {}

    const agora = new Date()
    
    for (const log of logs) {
      porEntidade[log.entidade] = (porEntidade[log.entidade] || 0) + 1
      porAcao[log.acao] = (porAcao[log.acao] || 0) + 1
      
      const horasAtras = Math.floor((agora.getTime() - new Date(log.createdAt).getTime()) / (1000 * 60 * 60))
      if (horasAtras < 24) {
        const horaKey = `${horasAtras}h`
        ultimasHoras[horaKey] = (ultimasHoras[horaKey] || 0) + 1
      }
    }

    return {
      total: logs.length,
      porEntidade: Object.entries(porEntidade).map(([entidade, count]) => ({ entidade, count })),
      porAcao: Object.entries(porAcao).map(([acao, count]) => ({ acao, count })),
      ultimasHoras: Object.entries(ultimasHoras).map(([hora, count]) => ({ hora, count }))
    }
  }
}

export const auditLogService = new AuditLogService()
