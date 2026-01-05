import { prisma } from '../lib/prisma.js'

type StatusNotaFiscal = 'AGUARDANDO_CONFERENCIA' | 'VOLUMES_CONFERIDOS' | 'VOLUMES_DIVERGENTES' | 'BLOQUEADO' | 'CONFERIDO_DIVERGENCIA' | 'CONFERIDO_OK' | 'PENDENTE_TRANSFERENCIA'

interface ConferenciaVolumeInput {
  notaFiscalId: string
  usuarioId: string
  volumesRecebidos: number
  filialRecebimentoId?: string
  observacoes?: string
}

interface ConferenciaItemInput {
  notaFiscalId: string
  usuarioId: string
  itensConferidos: {
    itemId: string
    quantidadeConferida: number
  }[]
  finalizada: boolean
  observacoes?: string
}

export class ConferenciaService {
  // ==================== CONFERÊNCIA DE VOLUMES ====================

  async conferirVolumes(input: ConferenciaVolumeInput) {
    const notaFiscal = await prisma.notaFiscal.findUnique({
      where: { id: input.notaFiscalId }
    })

    if (!notaFiscal) {
      throw new Error('Nota fiscal não encontrada')
    }

    // Verificar se já pode conferir volumes
    if (!['AGUARDANDO_CONFERENCIA', 'PENDENTE_TRANSFERENCIA', 'VOLUMES_DIVERGENTES'].includes(notaFiscal.status)) {
      throw new Error('Esta nota fiscal não está em um status que permita conferência de volumes')
    }

    const volumesEsperados = notaFiscal.quantidadeVolumes
    const volumesBatendo = input.volumesRecebidos === volumesEsperados

    // Criar registro de conferência
    const conferencia = await prisma.conferenciaVolume.create({
      data: {
        notaFiscalId: input.notaFiscalId,
        usuarioId: input.usuarioId,
        volumesEsperados,
        volumesRecebidos: input.volumesRecebidos,
        volumesBatendo,
        observacoes: input.observacoes
      },
      include: {
        usuario: { select: { id: true, nome: true } }
      }
    })

    // Determinar a filial de recebimento efetiva (nova ou existente)
    const filialRecebimentoEfetiva = input.filialRecebimentoId || notaFiscal.filialRecebimentoId
    
    // Atualizar status da nota fiscal
    let novoStatus: StatusNotaFiscal
    
    if (volumesBatendo) {
      // Se filial de recebimento é diferente do destino, mantém pendente transferência
      if (filialRecebimentoEfetiva !== notaFiscal.filialDestinoId) {
        novoStatus = 'PENDENTE_TRANSFERENCIA'
      } else {
        novoStatus = 'VOLUMES_CONFERIDOS'
      }
    } else {
      novoStatus = 'VOLUMES_DIVERGENTES'
    }

    // Atualizar nota fiscal com filial de recebimento (se informada) e novo status
    const updateData: Record<string, unknown> = { status: novoStatus }
    
    if (input.filialRecebimentoId) {
      updateData.filialRecebimentoId = input.filialRecebimentoId
    }
    
    await prisma.notaFiscal.update({
      where: { id: input.notaFiscalId },
      data: updateData
    })

    return {
      conferencia,
      volumesBatendo,
      novoStatus
    }
  }

  async listarConferenciasVolumes(notaFiscalId: string) {
    return prisma.conferenciaVolume.findMany({
      where: { notaFiscalId },
      include: {
        usuario: { select: { id: true, nome: true } }
      },
      orderBy: { dataConferencia: 'desc' }
    })
  }

  // ==================== CONFERÊNCIA DE ITENS ====================

  async conferirItens(input: ConferenciaItemInput) {
    const notaFiscal = await prisma.notaFiscal.findUnique({
      where: { id: input.notaFiscalId },
      include: { itens: true }
    })

    if (!notaFiscal) {
      throw new Error('Nota fiscal não encontrada')
    }

    // Verificar se pode conferir itens
    if (!['VOLUMES_CONFERIDOS', 'VOLUMES_DIVERGENTES', 'BLOQUEADO', 'PENDENTE_TRANSFERENCIA'].includes(notaFiscal.status)) {
      throw new Error('Esta nota fiscal não está em um status que permita conferência de itens')
    }

    // Atualizar quantidades conferidas dos itens
    for (const itemConferido of input.itensConferidos) {
      const itemExiste = notaFiscal.itens.find((i: { id: string }) => i.id === itemConferido.itemId)
      
      if (!itemExiste) {
        throw new Error(`Item ${itemConferido.itemId} não encontrado na nota fiscal`)
      }

      await prisma.itemNotaFiscal.update({
        where: { id: itemConferido.itemId },
        data: {
          quantidadeConferida: itemConferido.quantidadeConferida,
          conferido: true
        }
      })
    }

    // Criar registro de conferência
    const conferencia = await prisma.conferenciaItem.create({
      data: {
        notaFiscalId: input.notaFiscalId,
        usuarioId: input.usuarioId,
        finalizada: input.finalizada,
        observacoes: input.observacoes
      },
      include: {
        usuario: { select: { id: true, nome: true } }
      }
    })

    // Se finalizada, verificar divergências e atualizar status
    if (input.finalizada) {
      const itensAtualizados = await prisma.itemNotaFiscal.findMany({
        where: { notaFiscalId: input.notaFiscalId }
      })

      let temDivergencia = false

      for (const item of itensAtualizados) {
        const qtdNota = Number(item.quantidadeNota)
        const qtdConferida = Number(item.quantidadeConferida || 0)

        if (qtdNota !== qtdConferida) {
          temDivergencia = true
          
          // Criar registro de divergência automaticamente
          await prisma.divergencia.create({
            data: {
              notaFiscalId: input.notaFiscalId,
              itemNotaFiscalId: item.id,
              tipo: qtdConferida < qtdNota ? 'FALTA' : 'SOBRA',
              descricao: `${item.descricao}: esperado ${qtdNota}, recebido ${qtdConferida}`,
              quantidadeEsperada: qtdNota,
              quantidadeRecebida: qtdConferida
            }
          })
        }
      }

      // Atualizar status da nota fiscal
      let novoStatus: StatusNotaFiscal
      
      if (temDivergencia) {
        novoStatus = 'CONFERIDO_DIVERGENCIA'
      } else if (notaFiscal.filialRecebimentoId !== notaFiscal.filialDestinoId) {
        novoStatus = 'PENDENTE_TRANSFERENCIA'
      } else {
        novoStatus = 'CONFERIDO_OK'
      }

      await prisma.notaFiscal.update({
        where: { id: input.notaFiscalId },
        data: { status: novoStatus }
      })

      return {
        conferencia,
        temDivergencia,
        novoStatus
      }
    }

    // Se não finalizada, marca como bloqueado (conferência em andamento)
    await prisma.notaFiscal.update({
      where: { id: input.notaFiscalId },
      data: { status: 'BLOQUEADO' }
    })

    return {
      conferencia,
      temDivergencia: false,
      novoStatus: 'BLOQUEADO' as StatusNotaFiscal
    }
  }

  async listarConferenciasItens(notaFiscalId: string) {
    return prisma.conferenciaItem.findMany({
      where: { notaFiscalId },
      include: {
        usuario: { select: { id: true, nome: true } }
      },
      orderBy: { dataConferencia: 'desc' }
    })
  }
}
