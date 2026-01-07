import { prisma } from '../lib/prisma.js'
import { XmlParserService } from './xml-parser.service.js'
import { fornecedorService } from './fornecedor.service.js'

type StatusNotaFiscal = 'AGUARDANDO_CONFERENCIA' | 'PENDENTE_TRANSFERENCIA' | 'EM_CONFERENCIA' | 'VOLUMES_DIVERGENTES' | 'VOLUMES_CONFERIDOS' | 'BLOQUEADO' | 'CONFERIDO_DIVERGENCIA' | 'CONFERIDO_OK' | 'CONFERIDA' | 'FINALIZADA'
type TipoMovimentacao = 'RECEBIMENTO_DIRETO' | 'RECEBIMENTO_INDIRETO' | 'DISTRIBUICAO_URGENTE'

interface ImportarXmlInput {
  empresaId: string
  xmlContent: string
  filialRecebimentoId?: string
  filialDestinoId: string
  tipoMovimentacao: TipoMovimentacao
  usuarioId: string
  quantidadeVolumes?: number
  observacoes?: string
  numeroSecundario?: string
  fornecedorSecundarioId?: string
}

interface CreateNotaFiscalInput {
  empresaId: string
  numero: string
  serie?: string
  chaveAcesso?: string
  fornecedorNome: string
  fornecedorCnpj?: string
  dataEmissao?: Date
  valorTotal?: number
  quantidadeVolumes: number
  tipoMovimentacao: TipoMovimentacao
  filialRecebimentoId: string
  filialDestinoId: string
  usuarioId: string
  observacoes?: string
  itens?: {
    codigoProduto: string
    descricao: string
    ncm?: string
    unidade: string
    quantidadeNota: number
    valorUnitario?: number
    valorTotal?: number
  }[]
}

interface ListNotasFiscaisFilters {
  status?: StatusNotaFiscal
  filialRecebimentoId?: string
  filialDestinoId?: string
  dataInicio?: Date
  dataFim?: Date
}

export class NotaFiscalService {
  private xmlParser: XmlParserService

  constructor() {
    this.xmlParser = new XmlParserService()
  }

  async previewXml(xmlContent: string) {
    const parsed = this.xmlParser.parse(xmlContent)
    return {
      numero: parsed.numero,
      serie: parsed.serie,
      chaveAcesso: parsed.chaveAcesso,
      fornecedorNome: parsed.fornecedorNome,
      fornecedorCnpj: parsed.fornecedorCnpj,
      dataEmissao: parsed.dataEmissao,
      valorTotal: parsed.valorTotal,
      quantidadeVolumes: parsed.quantidadeVolumes,
      itens: parsed.itens.map(item => ({
        codigoProduto: item.codigoProduto,
        descricao: item.descricao,
        unidade: item.unidade,
        quantidade: item.quantidade,
        valorUnitario: item.valorUnitario,
        valorTotal: item.valorTotal
      }))
    }
  }

  async importarXml(input: ImportarXmlInput) {
    const parsed = this.xmlParser.parse(input.xmlContent)

    // Verificar se já existe NF com mesma chave de acesso
    if (parsed.chaveAcesso) {
      const existente = await prisma.notaFiscal.findUnique({
        where: { chaveAcesso: parsed.chaveAcesso }
      })

      if (existente) {
        throw new Error('Já existe uma nota fiscal com esta chave de acesso')
      }
    }

    // Verificar filial de recebimento (opcional)
    let filialRecebimento = null
    if (input.filialRecebimentoId) {
      filialRecebimento = await prisma.filial.findUnique({ where: { id: input.filialRecebimentoId } })
      if (!filialRecebimento) {
        throw new Error('Filial de recebimento não encontrada')
      }
    }

    // Verificar filial de destino (obrigatória)
    const filialDestino = await prisma.filial.findUnique({ where: { id: input.filialDestinoId } })
    if (!filialDestino) {
      throw new Error('Filial de destino não encontrada')
    }

    // Determinar status inicial
    let status: StatusNotaFiscal = 'AGUARDANDO_CONFERENCIA'
    if (!input.filialRecebimentoId || input.filialRecebimentoId !== input.filialDestinoId) {
      status = 'PENDENTE_TRANSFERENCIA'
    }

    // Criar ou buscar fornecedor
    const fornecedor = await fornecedorService.findOrCreate(
      input.empresaId,
      parsed.fornecedorNome,
      parsed.fornecedorCnpj || undefined
    )

    // Criar nota fiscal com itens
    const notaFiscal = await prisma.notaFiscal.create({
      data: {
        empresaId: input.empresaId,
        numero: parsed.numero,
        serie: parsed.serie,
        chaveAcesso: parsed.chaveAcesso,
        fornecedorNome: parsed.fornecedorNome,
        fornecedorCnpj: parsed.fornecedorCnpj,
        fornecedorId: fornecedor.id,
        dataEmissao: parsed.dataEmissao,
        valorTotal: parsed.valorTotal,
        quantidadeVolumes: input.quantidadeVolumes ?? parsed.quantidadeVolumes,
        tipoMovimentacao: input.tipoMovimentacao,
        status,
        filialRecebimentoId: input.filialRecebimentoId || null,
        filialDestinoId: input.filialDestinoId,
        usuarioCadastroId: input.usuarioId,
        observacoes: input.observacoes,
        numeroSecundario: input.numeroSecundario || null,
        fornecedorSecundarioId: input.fornecedorSecundarioId || null,
        xmlOriginal: parsed.xmlOriginal,
        itens: {
          create: parsed.itens.map(item => ({
            codigoProduto: item.codigoProduto,
            descricao: item.descricao,
            ncm: item.ncm,
            unidade: item.unidade,
            quantidadeNota: item.quantidade,
            valorUnitario: item.valorUnitario,
            valorTotal: item.valorTotal
          }))
        }
      },
      include: {
        itens: true,
        filialRecebimento: true,
        filialDestino: true,
        fornecedor: true,
        fornecedorSecundario: true,
        usuarioCadastro: {
          select: { id: true, nome: true }
        }
      }
    })

    return notaFiscal
  }

  async create(input: CreateNotaFiscalInput) {
    // Verificar se já existe NF com mesma chave de acesso
    if (input.chaveAcesso) {
      const existente = await prisma.notaFiscal.findUnique({
        where: { chaveAcesso: input.chaveAcesso }
      })

      if (existente) {
        throw new Error('Já existe uma nota fiscal com esta chave de acesso')
      }
    }

    // Verificar filiais
    const [filialRecebimento, filialDestino] = await Promise.all([
      prisma.filial.findUnique({ where: { id: input.filialRecebimentoId } }),
      prisma.filial.findUnique({ where: { id: input.filialDestinoId } })
    ])

    if (!filialRecebimento) {
      throw new Error('Filial de recebimento não encontrada')
    }

    if (!filialDestino) {
      throw new Error('Filial de destino não encontrada')
    }

    // Determinar status inicial
    let status: StatusNotaFiscal = 'AGUARDANDO_CONFERENCIA'
    if (input.filialRecebimentoId !== input.filialDestinoId) {
      status = 'PENDENTE_TRANSFERENCIA'
    }

    // Criar ou buscar fornecedor
    const fornecedor = await fornecedorService.findOrCreate(
      input.empresaId,
      input.fornecedorNome,
      input.fornecedorCnpj || undefined
    )

    const notaFiscal = await prisma.notaFiscal.create({
      data: {
        empresaId: input.empresaId,
        numero: input.numero,
        serie: input.serie,
        chaveAcesso: input.chaveAcesso,
        fornecedorNome: input.fornecedorNome,
        fornecedorCnpj: input.fornecedorCnpj,
        fornecedorId: fornecedor.id,
        dataEmissao: input.dataEmissao,
        valorTotal: input.valorTotal,
        quantidadeVolumes: input.quantidadeVolumes,
        tipoMovimentacao: input.tipoMovimentacao,
        status,
        filialRecebimentoId: input.filialRecebimentoId,
        filialDestinoId: input.filialDestinoId,
        usuarioCadastroId: input.usuarioId,
        observacoes: input.observacoes,
        itens: input.itens ? {
          create: input.itens.map(item => ({
            codigoProduto: item.codigoProduto,
            descricao: item.descricao,
            ncm: item.ncm,
            unidade: item.unidade,
            quantidadeNota: item.quantidadeNota,
            valorUnitario: item.valorUnitario,
            valorTotal: item.valorTotal
          }))
        } : undefined
      },
      include: {
        itens: true,
        filialRecebimento: true,
        filialDestino: true,
        fornecedor: true,
        usuarioCadastro: {
          select: { id: true, nome: true }
        }
      }
    })

    return notaFiscal
  }

  async findAll(filters?: ListNotasFiscaisFilters) {
    const where: Record<string, unknown> = {}

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.filialRecebimentoId) {
      where.filialRecebimentoId = filters.filialRecebimentoId
    }

    if (filters?.filialDestinoId) {
      where.filialDestinoId = filters.filialDestinoId
    }

    if (filters?.dataInicio || filters?.dataFim) {
      where.dataRecebimento = {}
      if (filters.dataInicio) {
        (where.dataRecebimento as Record<string, Date>).gte = filters.dataInicio
      }
      if (filters.dataFim) {
        (where.dataRecebimento as Record<string, Date>).lte = filters.dataFim
      }
    }

    const notas = await prisma.notaFiscal.findMany({
      where,
      include: {
        filialRecebimento: {
          select: { id: true, nome: true, codigo: true }
        },
        filialDestino: {
          select: { id: true, nome: true, codigo: true }
        },
        fornecedorSecundario: {
          select: { id: true, nome: true }
        },
        usuarioCadastro: {
          select: { id: true, nome: true }
        },
        conferenciasVolumes: {
          select: { transportadora: true },
          where: { transportadora: { not: null } },
          take: 1,
          orderBy: { dataConferencia: 'asc' }
        },
        _count: {
          select: { itens: true, divergencias: true }
        }
      },
      orderBy: { dataRecebimento: 'desc' }
    })

    // Mapear para incluir transportadora no nível da nota
    return notas.map(nota => ({
      ...nota,
      transportadora: nota.conferenciasVolumes[0]?.transportadora || null,
      conferenciasVolumes: undefined
    }))
  }

  async findById(id: string) {
    const notaFiscal = await prisma.notaFiscal.findUnique({
      where: { id },
      include: {
        itens: true,
        filialRecebimento: true,
        filialDestino: true,
        fornecedor: true,
        fornecedorSecundario: true,
        usuarioCadastro: {
          select: { id: true, nome: true }
        },
        conferenciasVolumes: {
          select: {
            id: true,
            volumesEsperados: true,
            volumesRecebidos: true,
            volumesBatendo: true,
            transportadora: true,
            tipo: true,
            dataConferencia: true,
            usuario: { select: { id: true, nome: true } },
            filial: { select: { id: true, nome: true, codigo: true } }
          },
          orderBy: { dataConferencia: 'desc' }
        },
        conferenciasItens: {
          include: {
            usuario: { select: { id: true, nome: true } }
          },
          orderBy: { dataConferencia: 'desc' }
        },
        divergencias: true,
        distribuicoes: {
          include: {
            filialOrigem: { select: { id: true, nome: true, codigo: true } },
            filialDestino: { select: { id: true, nome: true, codigo: true } }
          }
        }
      }
    })

    if (!notaFiscal) {
      throw new Error('Nota fiscal não encontrada')
    }

    return notaFiscal
  }

  async update(id: string, data: Record<string, unknown>) {
    console.log('📝 [UPDATE NF] Dados recebidos:', JSON.stringify(data, null, 2))
    
    const notaFiscal = await prisma.notaFiscal.findUnique({
      where: { id },
      include: { conferenciasVolumes: { orderBy: { dataConferencia: 'asc' } } }
    })

    if (!notaFiscal) {
      throw new Error('Nota fiscal não encontrada')
    }

    console.log(`📦 [UPDATE NF] NF ${notaFiscal.numero} tem ${notaFiscal.conferenciasVolumes.length} conferências`)

    // Se transportadora foi enviada, atualizar na primeira conferência de volumes (recebimento)
    if (data.transportadora !== undefined) {
      const transportadora = data.transportadora as string | null
      console.log(`🚚 [UPDATE NF] Transportadora recebida: "${transportadora}"`)
      delete data.transportadora
      
      if (notaFiscal.conferenciasVolumes.length > 0) {
        const conferenciaId = notaFiscal.conferenciasVolumes[0].id
        console.log(`✅ [UPDATE NF] Atualizando conferência ${conferenciaId} com transportadora: "${transportadora}"`)
        
        const updated = await prisma.conferenciaVolume.update({
          where: { id: conferenciaId },
          data: { transportadora }
        })
        
        console.log(`✅ [UPDATE NF] Conferência atualizada:`, JSON.stringify(updated, null, 2))
      } else {
        console.log('⚠️ [UPDATE NF] Nenhuma conferência encontrada - transportadora não será salva')
      }
    }

    return prisma.notaFiscal.update({
      where: { id },
      data,
      include: {
        fornecedor: true,
        fornecedorSecundario: true,
        filialRecebimento: true,
        filialDestino: true,
        conferenciasVolumes: {
          orderBy: { dataConferencia: 'asc' },
          include: {
            usuario: { select: { id: true, nome: true } }
          }
        }
      }
    })
  }

  async updateStatus(id: string, status: string) {
    const notaFiscal = await prisma.notaFiscal.findUnique({
      where: { id }
    })

    if (!notaFiscal) {
      throw new Error('Nota fiscal não encontrada')
    }

    return prisma.notaFiscal.update({
      where: { id },
      data: { status: status as any }
    })
  }

  async delete(id: string) {
    const notaFiscal = await prisma.notaFiscal.findUnique({
      where: { id }
    })

    if (!notaFiscal) {
      throw new Error('Nota fiscal não encontrada')
    }

    // Só permite deletar se estiver aguardando conferência
    if (notaFiscal.status !== 'AGUARDANDO_CONFERENCIA') {
      throw new Error('Não é possível excluir uma nota fiscal que já foi conferida')
    }

    return prisma.notaFiscal.delete({
      where: { id }
    })
  }

  async conferirTodosItens(notaFiscalId: string, quantidades: Record<string, number>) {
    const notaFiscal = await prisma.notaFiscal.findUnique({
      where: { id: notaFiscalId },
      include: { itens: true }
    })

    if (!notaFiscal) {
      throw new Error('Nota fiscal não encontrada')
    }

    let temDivergencia = false

    // Atualizar cada item com a quantidade informada
    for (const item of notaFiscal.itens) {
      if (!item.conferido && quantidades[item.id] !== undefined) {
        const qtdConferida = quantidades[item.id]
        
        await prisma.itemNotaFiscal.update({
          where: { id: item.id },
          data: {
            quantidadeConferida: qtdConferida,
            conferido: true
          }
        })

        if (qtdConferida !== Number(item.quantidadeNota)) {
          temDivergencia = true
        }
      }
    }

    // Verificar se todos os itens foram conferidos
    const itensNaoConferidos = await prisma.itemNotaFiscal.count({
      where: { notaFiscalId, conferido: false }
    })

    // Atualizar status da NF e criar divergências
    if (itensNaoConferidos === 0) {
      // Criar divergências para itens com quantidade diferente
      const todosItens = await prisma.itemNotaFiscal.findMany({
        where: { notaFiscalId, conferido: true }
      })
      
      for (const i of todosItens) {
        const qtdNota = Number(i.quantidadeNota)
        const qtdConferida = Number(i.quantidadeConferida || 0)
        
        if (qtdNota !== qtdConferida) {
          // Verificar se já existe divergência para este item
          const divergenciaExistente = await prisma.divergencia.findFirst({
            where: { itemNotaFiscalId: i.id }
          })
          
          if (!divergenciaExistente) {
            await prisma.divergencia.create({
              data: {
                notaFiscalId,
                itemNotaFiscalId: i.id,
                tipo: qtdConferida < qtdNota ? 'FALTA' : 'SOBRA',
                descricao: `${i.descricao}: esperado ${qtdNota}, recebido ${qtdConferida}`,
                quantidadeEsperada: qtdNota,
                quantidadeRecebida: qtdConferida
              }
            })
          }
        }
      }
      
      await prisma.notaFiscal.update({
        where: { id: notaFiscalId },
        data: { status: temDivergencia ? 'CONFERIDO_DIVERGENCIA' : 'CONFERIDO_OK' }
      })
    } else {
      await prisma.notaFiscal.update({
        where: { id: notaFiscalId },
        data: { status: 'EM_CONFERENCIA' as any }
      })
    }

    return { success: true, message: 'Itens conferidos com sucesso' }
  }

  async conferirItem(notaFiscalId: string, itemId: string, quantidadeConferida: number, usuarioId: string) {
    // Buscar nota fiscal para validar filial de destino
    const notaFiscal = await prisma.notaFiscal.findUnique({
      where: { id: notaFiscalId },
      select: { filialDestinoId: true }
    })

    if (!notaFiscal) {
      throw new Error('Nota fiscal não encontrada')
    }

    // Validar que o usuário pertence à filial de destino
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { filialId: true }
    })
    
    if (!usuario?.filialId || usuario.filialId !== notaFiscal.filialDestinoId) {
      throw new Error('Apenas usuários da filial de destino podem realizar a conferência de itens')
    }

    const item = await prisma.itemNotaFiscal.findFirst({
      where: { id: itemId, notaFiscalId }
    })

    if (!item) {
      throw new Error('Item não encontrado')
    }

    // Atualizar item com quantidade conferida
    const itemAtualizado = await prisma.itemNotaFiscal.update({
      where: { id: itemId },
      data: {
        quantidadeConferida,
        conferido: true
      }
    })

    // Verificar se todos os itens foram conferidos
    const itensNaoConferidos = await prisma.itemNotaFiscal.count({
      where: { notaFiscalId, conferido: false }
    })

    // Se todos conferidos, atualizar status da NF e criar divergências
    if (itensNaoConferidos === 0) {
      // Verificar se há divergências e criar registros
      const todosItens = await prisma.itemNotaFiscal.findMany({
        where: { 
          notaFiscalId,
          conferido: true
        }
      })

      let temDivergencia = false
      
      for (const i of todosItens) {
        const qtdNota = Number(i.quantidadeNota)
        const qtdConferida = Number(i.quantidadeConferida || 0)
        
        if (qtdNota !== qtdConferida) {
          temDivergencia = true
          
          // Verificar se já existe divergência para este item
          const divergenciaExistente = await prisma.divergencia.findFirst({
            where: { itemNotaFiscalId: i.id }
          })
          
          if (!divergenciaExistente) {
            await prisma.divergencia.create({
              data: {
                notaFiscalId,
                itemNotaFiscalId: i.id,
                tipo: qtdConferida < qtdNota ? 'FALTA' : 'SOBRA',
                descricao: `${i.descricao}: esperado ${qtdNota}, recebido ${qtdConferida}`,
                quantidadeEsperada: qtdNota,
                quantidadeRecebida: qtdConferida
              }
            })
          }
        }
      }

      await prisma.notaFiscal.update({
        where: { id: notaFiscalId },
        data: { 
          status: temDivergencia ? 'CONFERIDO_DIVERGENCIA' : 'CONFERIDO_OK' 
        }
      })
    } else {
      // Atualizar para EM_CONFERENCIA se ainda não estiver
      await prisma.notaFiscal.update({
        where: { id: notaFiscalId },
        data: { status: 'EM_CONFERENCIA' as any }
      })
    }

    return itemAtualizado
  }

  async toggleBloqueioMercadoria(id: string, bloqueada: boolean) {
    const notaFiscal = await prisma.notaFiscal.findUnique({
      where: { id }
    })

    if (!notaFiscal) {
      throw new Error('Nota fiscal não encontrada')
    }

    return prisma.notaFiscal.update({
      where: { id },
      data: { mercadoriaBloqueada: bloqueada },
      include: {
        fornecedor: true,
        fornecedorSecundario: true,
        filialRecebimento: true,
        filialDestino: true,
        conferenciasVolumes: {
          orderBy: { dataConferencia: 'asc' },
          include: {
            usuario: { select: { id: true, nome: true } }
          }
        }
      }
    })
  }

  async getByFilialRecebimento(filialId: string) {
    return prisma.notaFiscal.findMany({
      where: {
        filialRecebimentoId: filialId
      },
      select: {
        id: true,
        numero: true,
        fornecedorNome: true,
        dataRecebimento: true,
        status: true,
        quantidadeVolumes: true,
        valorTotal: true,
        filialRecebimento: {
          select: {
            nome: true,
            codigo: true
          }
        }
      },
      orderBy: {
        dataRecebimento: 'desc'
      }
    })
  }
}
