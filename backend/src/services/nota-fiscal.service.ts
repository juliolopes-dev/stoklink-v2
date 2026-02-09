import { prisma } from '../lib/prisma.js'
import { XmlParserService } from './xml-parser.service.js'
import { fornecedorService } from './fornecedor.service.js'
import { webhookService } from './webhook.service.js'

type StatusNotaFiscal = 'PENDENTE_TRANSFERENCIA' | 'VOLUMES_CONFERIDOS' | 'VOLUMES_DIVERGENTES' | 'AGUARDANDO_CONFERENCIA_DESTINO' | 'EM_CONFERENCIA' | 'CONFERIDO_OK' | 'CONFERIDO_DIVERGENCIA' | 'BLOQUEADO' | 'SEPARACAO_FINALIZADA'
type TipoMovimentacao = 'NORMAL' | 'DISTRIBUICAO_IMEDIATA'

interface ImportarXmlInput {
  empresaId: string
  xmlContent: string
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
  dataEmissao?: string
  searchTerm?: string
  entradaRp?: boolean
  mercadoriaBloqueada?: boolean
  page?: number
  limit?: number
}

interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
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

    // Verificar filial de destino (obrigatória)
    const filialDestino = await prisma.filial.findUnique({ where: { id: input.filialDestinoId } })
    if (!filialDestino) {
      throw new Error('Filial de destino não encontrada')
    }

    // Status inicial: sempre PENDENTE_TRANSFERENCIA (Em Trânsito)
    // A filial de recebimento será definida na primeira conferência de volumes
    const status: StatusNotaFiscal = 'PENDENTE_TRANSFERENCIA'

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
        tipoMovimentacao: input.tipoMovimentacao as any,
        status,
        filialRecebimentoId: null,
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

    // Verificar filial de destino (obrigatória)
    const filialDestino = await prisma.filial.findUnique({ where: { id: input.filialDestinoId } })
    if (!filialDestino) {
      throw new Error('Filial de destino não encontrada')
    }

    // Status inicial: sempre PENDENTE_TRANSFERENCIA (Em Trânsito)
    // A filial de recebimento será definida na primeira conferência de volumes
    const status: StatusNotaFiscal = 'PENDENTE_TRANSFERENCIA'

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
        tipoMovimentacao: input.tipoMovimentacao as any,
        status,
        filialRecebimentoId: null,
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

  async findAll(filters?: ListNotasFiscaisFilters): Promise<PaginatedResult<any>> {
    const where: Record<string, unknown> = {}
    const page = filters?.page || 1
    const limit = filters?.limit || 50
    const skip = (page - 1) * limit

    if (filters?.status) {
      where.status = filters.status
    }

    // Se houver searchTerm (busca por número), ignorar filtros de filial
    const hasSearchTerm = filters?.searchTerm && filters.searchTerm.trim().length > 0
    
    if (!hasSearchTerm) {
      if (filters?.filialRecebimentoId) {
        where.filialRecebimentoId = filters.filialRecebimentoId
      }

      if (filters?.filialDestinoId) {
        where.filialDestinoId = filters.filialDestinoId
      }
    }

    // Filtro por data de recebimento (range)
    if (filters?.dataInicio || filters?.dataFim) {
      where.dataRecebimento = {}
      if (filters.dataInicio) {
        (where.dataRecebimento as Record<string, Date>).gte = filters.dataInicio
      }
      if (filters.dataFim) {
        (where.dataRecebimento as Record<string, Date>).lte = filters.dataFim
      }
    }

    // Filtro por data de emissão (dia específico)
    if (filters?.dataEmissao) {
      const dataInicio = new Date(filters.dataEmissao + 'T00:00:00.000Z')
      const dataFim = new Date(filters.dataEmissao + 'T23:59:59.999Z')
      where.dataEmissao = {
        gte: dataInicio,
        lte: dataFim
      }
    }

    // Filtro por entrada RP
    if (filters?.entradaRp !== undefined) {
      where.entradaRp = filters.entradaRp
    }

    // Filtro por mercadoria bloqueada
    if (filters?.mercadoriaBloqueada !== undefined) {
      where.mercadoriaBloqueada = filters.mercadoriaBloqueada
    }

    // Busca por número exato ou fornecedor
    if (hasSearchTerm) {
      const search = filters.searchTerm!.trim()
      where.OR = [
        { numero: search },
        { numeroSecundario: search },
        { fornecedorNome: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Executar count e query em paralelo para performance
    const [total, notas] = await Promise.all([
      prisma.notaFiscal.count({ where }),
      prisma.notaFiscal.findMany({
        where,
        include: {
          filialRecebimento: {
            select: { id: true, nome: true, codigo: true }
          },
          filialDestino: {
            select: { id: true, nome: true, codigo: true }
          },
          fornecedor: {
            select: { id: true, nome: true, codigo: true }
          },
          fornecedorSecundario: {
            select: { id: true, nome: true }
          },
          usuarioCadastro: {
            select: { id: true, nome: true }
          },
          conferenciasVolumes: {
            select: { transportadora: true } as any,
            where: { transportadora: { not: null } } as any,
            take: 1,
            orderBy: { dataConferencia: 'asc' } as any
          },
          _count: {
            select: { itens: true, divergencias: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      })
    ])

    const totalPages = Math.ceil(total / limit)

    // Mapear para incluir transportadora no nível da nota
    const data = notas.map((nota: any) => ({
      ...nota,
      transportadora: nota.conferenciasVolumes[0]?.transportadora || null,
      conferenciasVolumes: undefined
    }))

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages
      }
    }
  }

  async findById(id: string) {
    const notaFiscal = await prisma.notaFiscal.findUnique({
      where: { id },
      include: {
        itens: true,
        itensSecundarios: true,
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
          } as any,
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
    console.log(' [UPDATE NF] Dados recebidos:', JSON.stringify(data, null, 2))
    
    const notaFiscal = await prisma.notaFiscal.findUnique({
      where: { id },
      include: { conferenciasVolumes: { orderBy: { dataConferencia: 'asc' } } }
    })

    if (!notaFiscal) {
      throw new Error('Nota fiscal não encontrada')
    }

    console.log(` [UPDATE NF] NF ${notaFiscal.numero} tem ${notaFiscal.conferenciasVolumes.length} conferências`)

    // Se transportadora foi enviada, atualizar na primeira conferência de volumes (recebimento)
    if (data.transportadora !== undefined) {
      const transportadora = data.transportadora as string | null
      console.log(` [UPDATE NF] Transportadora recebida: "${transportadora}"`)
      delete data.transportadora
      
      if (notaFiscal.conferenciasVolumes.length > 0) {
        const conferenciaId = notaFiscal.conferenciasVolumes[0].id
        console.log(` [UPDATE NF] Atualizando conferência ${conferenciaId} com transportadora: "${transportadora}"`)
        console.log(`✅ [UPDATE NF] Atualizando conferência ${conferenciaId} com transportadora: "${transportadora}"`)
        
        const updated = await prisma.conferenciaVolume.update({
          where: { id: conferenciaId },
          data: { transportadora } as any
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


  async conferirTodosItens(notaFiscalId: string, quantidades: Record<string, number>, usuarioId?: string) {
    const notaFiscal = await prisma.notaFiscal.findUnique({
      where: { id: notaFiscalId },
      include: { itens: true }
    })

    if (!notaFiscal) {
      throw new Error('Nota fiscal não encontrada')
    }

    // Verificar se é ADMIN para permitir reconferência
    let isAdmin = false
    if (usuarioId) {
      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: { perfil: true }
      })
      isAdmin = usuario?.perfil === 'ADMIN'
    }

    // Se ADMIN está reconferindo, limpar divergências antigas
    if (isAdmin) {
      await prisma.divergencia.deleteMany({
        where: { notaFiscalId }
      })
    }

    // Atualizar cada item com a quantidade informada
    for (const item of notaFiscal.itens) {
      if (quantidades[item.id] !== undefined && (!item.conferido || isAdmin)) {
        const qtdConferida = quantidades[item.id]
        
        await prisma.itemNotaFiscal.update({
          where: { id: item.id },
          data: {
            quantidadeConferida: qtdConferida,
            conferido: true
          }
        })
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

    // Validar que o usuário pertence à filial de destino (exceto ADMIN que pode tudo)
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { filialId: true, perfil: true }
    })
    
    // ADMIN pode fazer qualquer conferência
    if (usuario?.perfil !== 'ADMIN') {
      if (!usuario?.filialId || usuario.filialId !== notaFiscal.filialDestinoId) {
        throw new Error('Apenas usuários da filial de destino podem realizar a conferência de itens')
      }
    }

    const item = await prisma.itemNotaFiscal.findFirst({
      where: { id: itemId, notaFiscalId }
    })

    if (!item) {
      throw new Error('Item não encontrado')
    }

    // Se ADMIN está reconferindo um item já conferido, limpar divergência antiga desse item
    if (usuario?.perfil === 'ADMIN' && item.conferido) {
      await prisma.divergencia.deleteMany({
        where: { itemNotaFiscalId: itemId }
      })
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

  async delete(id: string) {
    const notaFiscal = await prisma.notaFiscal.findUnique({
      where: { id }
    })

    if (!notaFiscal) {
      throw new Error('Nota fiscal não encontrada')
    }

    // Excluir NF e todos os registros relacionados (cascade)
    await prisma.notaFiscal.delete({
      where: { id }
    })
  }

  async toggleBloqueioMercadoria(id: string, bloqueada: boolean, usuarioId?: string) {
    const notaFiscal = await prisma.notaFiscal.findUnique({
      where: { id }
    })

    if (!notaFiscal) {
      throw new Error('Nota fiscal não encontrada')
    }

    // Impedir desbloqueio se o fluxo não foi concluído
    if (!bloqueada && notaFiscal.status !== 'CONFERIDO_OK' && notaFiscal.status !== 'CONFERIDO_DIVERGENCIA' && notaFiscal.status !== 'SEPARACAO_FINALIZADA') {
      throw new Error('A mercadoria só pode ser desbloqueada após a conclusão de todo o fluxo de conferência')
    }

    const result = await prisma.notaFiscal.update({
      where: { id },
      data: { mercadoriaBloqueada: bloqueada } as any,
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

    // Disparar webhook de bloqueio/liberação de mercadoria
    await webhookService.mercadoriaBloqueadaOuLiberada(id, bloqueada, usuarioId)

    return result
  }

  async confirmarAuditoria(id: string, usuarioId?: string) {
    const notaFiscal = await prisma.notaFiscal.findUnique({
      where: { id }
    })

    if (!notaFiscal) {
      throw new Error('Nota fiscal não encontrada')
    }

    if (notaFiscal.auditoriaRealizada) {
      throw new Error('Auditoria já foi realizada para esta nota fiscal')
    }

    const result = await prisma.notaFiscal.update({
      where: { id },
      data: { 
        auditoriaRealizada: true,
        dataAuditoria: new Date()
      } as any,
      include: {
        fornecedor: true,
        fornecedorSecundario: true,
        filialRecebimento: true,
        filialDestino: true,
        usuarioCadastro: true
      }
    })

    // Disparar webhook de auditoria realizada
    await webhookService.auditoriaRealizada(id, usuarioId)

    return result
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

  async getEstatisticasAvancadas() {
    const notas = await prisma.notaFiscal.findMany({
      include: {
        filialRecebimento: {
          select: { id: true, nome: true, codigo: true }
        },
        filialDestino: {
          select: { id: true, nome: true, codigo: true }
        },
        conferenciasVolumes: {
          select: { createdAt: true, tipo: true }
        }
      }
    })

    // Estatísticas por filial de recebimento
    const filialStats: Record<string, { nome: string, codigo: string, total: number, conferidas: number, tempoMedioHoras: number }> = {}
    
    for (const nf of notas) {
      const filialId = nf.filialRecebimentoId || nf.filialDestinoId
      const filial = nf.filialRecebimento || nf.filialDestino
      
      if (!filialStats[filialId]) {
        filialStats[filialId] = {
          nome: filial.nome,
          codigo: filial.codigo,
          total: 0,
          conferidas: 0,
          tempoMedioHoras: 0
        }
      }
      
      filialStats[filialId].total++
      
      if (nf.status === 'CONFERIDO_OK' || nf.status === 'CONFERIDO_DIVERGENCIA') {
        filialStats[filialId].conferidas++
        
        // Calcular tempo de conferência
        const primeiraConf = nf.conferenciasVolumes.find((c: { tipo: string }) => c.tipo === 'RECEBIMENTO')
        if (primeiraConf && nf.createdAt) {
          const tempoMs = new Date(primeiraConf.createdAt).getTime() - new Date(nf.createdAt).getTime()
          const tempoHoras = tempoMs / (1000 * 60 * 60)
          filialStats[filialId].tempoMedioHoras = 
            (filialStats[filialId].tempoMedioHoras * (filialStats[filialId].conferidas - 1) + tempoHoras) / filialStats[filialId].conferidas
        }
      }
    }

    // Estatísticas por status
    const statusStats: Record<string, number> = {}
    for (const nf of notas) {
      statusStats[nf.status] = (statusStats[nf.status] || 0) + 1
    }

    // Estatísticas gerais
    const totalNotas = notas.length
    const notasConferidas = notas.filter(n => n.status === 'CONFERIDO_OK' || n.status === 'CONFERIDO_DIVERGENCIA').length
    const notasPendentes = notas.filter(n => n.status === 'PENDENTE_TRANSFERENCIA' || n.status === 'AGUARDANDO_CONFERENCIA_DESTINO' || n.status === 'VOLUMES_CONFERIDOS').length

    return {
      geral: {
        totalNotas,
        notasConferidas,
        notasPendentes,
        taxaConferencia: totalNotas > 0 ? Math.round((notasConferidas / totalNotas) * 100) : 0
      },
      porFilial: Object.entries(filialStats).map(([id, stats]) => ({
        filialId: id,
        ...stats,
        tempoMedioHoras: Math.round(stats.tempoMedioHoras * 10) / 10
      })),
      porStatus: Object.entries(statusStats).map(([status, count]) => ({
        status,
        count
      }))
    }
  }
}
