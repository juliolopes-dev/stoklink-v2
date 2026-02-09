import { prisma } from '../lib/prisma.js'

type StatusNotaFiscal = 'PENDENTE_TRANSFERENCIA' | 'VOLUMES_CONFERIDOS' | 'VOLUMES_DIVERGENTES' | 'AGUARDANDO_CONFERENCIA_DESTINO' | 'EM_CONFERENCIA' | 'CONFERIDO_OK' | 'CONFERIDO_DIVERGENCIA' | 'BLOQUEADO'
type TipoConferenciaVolume = 'RECEBIMENTO' | 'DESTINO'

interface ConferenciaVolumeInput {
  notaFiscalId: string
  usuarioId: string
  volumesRecebidos: number
  filialRecebimentoId?: string
  tipo?: TipoConferenciaVolume
  transportadora?: string
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

    const tipoConferencia = input.tipo || 'RECEBIMENTO'
    
    // Verificar se já pode conferir volumes baseado no tipo
    if (tipoConferencia === 'RECEBIMENTO') {
      if (!['AGUARDANDO_CONFERENCIA', 'PENDENTE_TRANSFERENCIA', 'VOLUMES_DIVERGENTES'].includes(notaFiscal.status)) {
        throw new Error('Esta nota fiscal não está em um status que permita conferência de volumes no recebimento')
      }
    } else if (tipoConferencia === 'DESTINO') {
      if (!['AGUARDANDO_CONFERENCIA_DESTINO'].includes(notaFiscal.status)) {
        throw new Error('Esta nota fiscal não está aguardando conferência no destino')
      }
      
      // Validar que o usuário pertence à filial de destino (exceto ADMIN que pode tudo)
      const usuario = await prisma.usuario.findUnique({
        where: { id: input.usuarioId },
        select: { filialId: true, nome: true, perfil: true }
      })
      
      // ADMIN pode fazer qualquer conferência
      if (usuario?.perfil !== 'ADMIN') {
        if (!usuario?.filialId || usuario.filialId !== notaFiscal.filialDestinoId) {
          throw new Error('Apenas usuários da filial de destino podem realizar a conferência no destino')
        }
      }
    }

    const volumesEsperados = notaFiscal.quantidadeVolumes
    const volumesBatendo = input.volumesRecebidos === volumesEsperados

    // Determinar filial da conferência
    const filialConferencia = tipoConferencia === 'RECEBIMENTO' 
      ? input.filialRecebimentoId 
      : notaFiscal.filialDestinoId

    // Criar registro de conferência
    const conferencia = await prisma.conferenciaVolume.create({
      data: {
        notaFiscalId: input.notaFiscalId,
        usuarioId: input.usuarioId,
        tipo: tipoConferencia,
        filialId: filialConferencia,
        transportadora: input.transportadora,
        volumesEsperados,
        volumesRecebidos: input.volumesRecebidos,
        volumesBatendo,
        observacoes: input.observacoes
      } as any,
      include: {
        usuario: { select: { id: true, nome: true } },
        filial: { select: { id: true, nome: true, codigo: true } }
      }
    })

    // Determinar novo status baseado no tipo de conferência
    let novoStatus: StatusNotaFiscal
    const updateData: Record<string, unknown> = {}

    if (tipoConferencia === 'RECEBIMENTO') {
      // 1ª Conferência - no CD/filial de recebimento
      const filialRecebimentoEfetiva = input.filialRecebimentoId || notaFiscal.filialRecebimentoId
      
      if (input.filialRecebimentoId) {
        updateData.filialRecebimentoId = input.filialRecebimentoId
      }
      
      if (volumesBatendo) {
        // Se filial de recebimento é diferente do destino, aguarda conferência no destino
        if (filialRecebimentoEfetiva !== notaFiscal.filialDestinoId) {
          novoStatus = 'AGUARDANDO_CONFERENCIA_DESTINO'
        } else {
          // Recebimento direto (mesma filial) - volumes OK, aguardando conferência de itens
          novoStatus = 'VOLUMES_CONFERIDOS'
        }
      } else {
        novoStatus = 'VOLUMES_DIVERGENTES'
      }
    } else {
      // 2ª Conferência - no destino final
      if (volumesBatendo) {
        novoStatus = 'VOLUMES_CONFERIDOS'
      } else {
        novoStatus = 'VOLUMES_DIVERGENTES'
      }
    }

    updateData.status = novoStatus
    
    // Preencher dataRecebimento quando a mercadoria é fisicamente recebida (conferência de volumes)
    if (!notaFiscal.dataRecebimento) {
      updateData.dataRecebimento = new Date()
    }
    
    await prisma.notaFiscal.update({
      where: { id: input.notaFiscalId },
      data: updateData
    })

    return {
      conferencia,
      volumesBatendo,
      novoStatus,
      tipoConferencia
    }
  }

  async listarConferenciasVolumes(notaFiscalId: string) {
    return prisma.conferenciaVolume.findMany({
      where: { notaFiscalId },
      include: {
        usuario: { select: { id: true, nome: true } },
        filial: { select: { id: true, nome: true, codigo: true } }
      },
      orderBy: { dataConferencia: 'desc' }
    })
  }

  async listarTransportadorasUsadas(empresaId: string) {
    const conferencias = await (prisma.conferenciaVolume.findMany as any)({
      where: {
        transportadora: { not: null },
        notaFiscal: { empresaId }
      },
      select: {
        transportadora: true
      },
      distinct: ['transportadora'],
      orderBy: { transportadora: 'asc' }
    })

    return conferencias
      .filter((c: any) => c.transportadora)
      .map((c: any) => c.transportadora as string)
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

    // Validar que o usuário pertence à filial de destino (exceto ADMIN que pode tudo)
    const usuario = await prisma.usuario.findUnique({
      where: { id: input.usuarioId },
      select: { filialId: true, perfil: true }
    })

    // Verificar se pode conferir itens
    const statusPermitidos = ['VOLUMES_CONFERIDOS', 'VOLUMES_DIVERGENTES', 'BLOQUEADO', 'PENDENTE_TRANSFERENCIA']
    const statusFinalizados = ['CONFERIDO_OK', 'CONFERIDO_DIVERGENCIA', 'EM_CONFERENCIA', 'SEPARACAO_FINALIZADA']
    
    if (!statusPermitidos.includes(notaFiscal.status)) {
      // ADMIN pode reconferir mesmo em status finalizados
      if (usuario?.perfil === 'ADMIN' && statusFinalizados.includes(notaFiscal.status)) {
        // Limpar divergências antigas antes de reconferir para evitar duplicatas
        await prisma.divergencia.deleteMany({
          where: { notaFiscalId: input.notaFiscalId }
        })
      } else {
        throw new Error('Esta nota fiscal não está em um status que permita conferência de itens')
      }
    }
    
    // ADMIN pode fazer qualquer conferência
    if (usuario?.perfil !== 'ADMIN') {
      if (!usuario?.filialId || usuario.filialId !== notaFiscal.filialDestinoId) {
        throw new Error('Apenas usuários da filial de destino podem realizar a conferência de itens')
      }
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

  // ==================== CONFERÊNCIA DE ITENS SECUNDÁRIOS ====================

  async conferirItemSecundario(input: {
    notaFiscalId: string
    itemId: string
    quantidadeConferida: number
    usuarioId: string
  }) {
    const item = await prisma.itemNfSecundaria.findFirst({
      where: {
        id: input.itemId,
        notaFiscalId: input.notaFiscalId
      }
    })

    if (!item) {
      throw new Error('Item secundário não encontrado')
    }

    const itemAtualizado = await prisma.itemNfSecundaria.update({
      where: { id: input.itemId },
      data: {
        quantidadeConferida: input.quantidadeConferida,
        conferido: true
      }
    })

    return {
      success: true,
      item: itemAtualizado
    }
  }

  async conferirTodosItensSecundarios(input: {
    notaFiscalId: string
    itensConferidos: { itemId: string; quantidadeConferida: number }[]
    usuarioId: string
  }) {
    const itensAtualizados = []

    for (const itemConf of input.itensConferidos) {
      const itemAtualizado = await prisma.itemNfSecundaria.update({
        where: { id: itemConf.itemId },
        data: {
          quantidadeConferida: itemConf.quantidadeConferida,
          conferido: true
        }
      })
      itensAtualizados.push(itemAtualizado)
    }

    return {
      success: true,
      itensAtualizados: itensAtualizados.length
    }
  }
}
