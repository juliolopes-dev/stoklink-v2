import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import multipart from '@fastify/multipart'
import { NotaFiscalService } from '../services/nota-fiscal.service.js'
import { authMiddleware } from '../middlewares/auth.js'

const notaFiscalService = new NotaFiscalService()

const importarXmlSchema = z.object({
  filialRecebimentoId: z.string().uuid('ID da filial de recebimento inválido').optional().or(z.literal('')),
  filialDestinoId: z.string().uuid('ID da filial de destino inválido'),
  tipoMovimentacao: z.enum(['RECEBIMENTO_DIRETO', 'RECEBIMENTO_INDIRETO', 'DISTRIBUICAO_URGENTE']),
  quantidadeVolumes: z.coerce.number().int().positive().optional(),
  observacoes: z.string().optional(),
  numeroSecundario: z.string().optional(),
  fornecedorSecundarioId: z.string().uuid('ID do fornecedor secundário inválido').optional().or(z.literal(''))
})

const createNotaFiscalSchema = z.object({
  numero: z.string().min(1, 'Número é obrigatório'),
  serie: z.string().optional(),
  chaveAcesso: z.string().optional(),
  fornecedorNome: z.string().min(1, 'Nome do fornecedor é obrigatório'),
  fornecedorCnpj: z.string().optional(),
  dataEmissao: z.coerce.date().optional(),
  valorTotal: z.coerce.number().optional(),
  quantidadeVolumes: z.coerce.number().int().positive(),
  tipoMovimentacao: z.enum(['RECEBIMENTO_DIRETO', 'RECEBIMENTO_INDIRETO', 'DISTRIBUICAO_URGENTE']),
  filialRecebimentoId: z.string().uuid('ID da filial de recebimento inválido').optional().or(z.literal('')),
  filialDestinoId: z.string().uuid('ID da filial de destino inválido'),
  observacoes: z.string().optional(),
  itens: z.array(z.object({
    codigoProduto: z.string().min(1),
    descricao: z.string().min(1),
    ncm: z.string().optional(),
    unidade: z.string().min(1),
    quantidadeNota: z.coerce.number().positive(),
    valorUnitario: z.coerce.number().optional(),
    valorTotal: z.coerce.number().optional()
  })).min(1, 'É obrigatório incluir pelo menos um item na nota fiscal')
})

const listFiltersSchema = z.object({
  status: z.enum([
    'AGUARDANDO_CONFERENCIA',
    'VOLUMES_CONFERIDOS',
    'VOLUMES_DIVERGENTES',
    'BLOQUEADO',
    'CONFERIDO_DIVERGENCIA',
    'CONFERIDO_OK',
    'PENDENTE_TRANSFERENCIA'
  ]).optional(),
  filialRecebimentoId: z.string().uuid().optional(),
  filialDestinoId: z.string().uuid().optional(),
  dataInicio: z.coerce.date().optional(),
  dataFim: z.coerce.date().optional()
})

const idParamSchema = z.object({
  id: z.string().uuid('ID inválido')
})

export async function notaFiscalRoutes(app: FastifyInstance) {
  // Registrar plugin multipart para upload de arquivos
  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB
    }
  })

  // Preview XML (extrai dados sem salvar)
  app.post('/notas-fiscais/preview-xml', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const data = await request.file()
      
      if (!data) {
        return reply.status(400).send({ error: 'Arquivo XML é obrigatório' })
      }

      const xmlBuffer = await data.toBuffer()
      const xmlContent = xmlBuffer.toString('utf-8')

      const preview = await notaFiscalService.previewXml(xmlContent)
      return reply.send(preview)
    } catch (error) {
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao processar XML' })
    }
  })

  // Importar XML
  app.post('/notas-fiscais/importar-xml', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const data = await request.file()
      
      if (!data) {
        return reply.status(400).send({ error: 'Arquivo XML é obrigatório' })
      }

      const xmlBuffer = await data.toBuffer()
      const xmlContent = xmlBuffer.toString('utf-8')

      // Pegar campos do formulário
      const fields: Record<string, string> = {}
      for (const [key, value] of Object.entries(data.fields)) {
        if (value && typeof value === 'object' && 'value' in value) {
          fields[key] = (value as { value: string }).value
        }
      }
      
      const params = importarXmlSchema.parse(fields)

      const notaFiscal = await notaFiscalService.importarXml({
        empresaId: request.user.empresaId,
        xmlContent,
        filialRecebimentoId: params.filialRecebimentoId || undefined,
        filialDestinoId: params.filialDestinoId,
        tipoMovimentacao: params.tipoMovimentacao,
        usuarioId: request.user.id,
        quantidadeVolumes: params.quantidadeVolumes,
        observacoes: params.observacoes,
        numeroSecundario: params.numeroSecundario || undefined,
        fornecedorSecundarioId: params.fornecedorSecundarioId || undefined
      })

      return reply.status(201).send(notaFiscal)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao importar XML' })
    }
  })

  // Criar manualmente
  app.post('/notas-fiscais', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const data = createNotaFiscalSchema.parse(request.body)

      const notaFiscal = await notaFiscalService.create({
        ...data,
        filialRecebimentoId: data.filialRecebimentoId || undefined,
        empresaId: request.user.empresaId,
        usuarioId: request.user.id
      })

      return reply.status(201).send(notaFiscal)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao criar nota fiscal' })
    }
  })

  // Listar todas
  app.get('/notas-fiscais', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const filters = listFiltersSchema.parse(request.query)
      const notasFiscais = await notaFiscalService.findAll(filters)
      return reply.send(notasFiscais)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      return reply.status(500).send({ error: 'Erro ao buscar notas fiscais' })
    }
  })

  // Buscar por ID
  app.get('/notas-fiscais/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const { id } = idParamSchema.parse(request.params)
      const notaFiscal = await notaFiscalService.findById(id)
      return reply.send(notaFiscal)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(404).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao buscar nota fiscal' })
    }
  })

  // Editar NF (segundo fornecedor, número secundário, observações)
  app.put('/notas-fiscais/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const { id } = idParamSchema.parse(request.params)
      
      const bodySchema = z.object({
        numero: z.string().optional().nullable(),
        numeroSecundario: z.string().optional().nullable(),
        fornecedorSecundarioId: z.string().uuid().optional().nullable(),
        filialRecebimentoId: z.string().uuid().optional().nullable(),
        filialDestinoId: z.string().uuid().optional().nullable(),
        transportadora: z.string().optional().nullable(),
        observacoes: z.string().optional().nullable(),
        entradaRp: z.boolean().optional().nullable()
      })

      const body = bodySchema.parse(request.body)
      
      // Preparar dados para atualização
      const data: Record<string, unknown> = {}
      
      if (body.numero !== undefined) data.numero = body.numero || null
      if (body.numeroSecundario !== undefined) data.numeroSecundario = body.numeroSecundario || null
      if (body.fornecedorSecundarioId !== undefined) data.fornecedorSecundarioId = body.fornecedorSecundarioId
      if (body.filialRecebimentoId !== undefined) data.filialRecebimentoId = body.filialRecebimentoId
      if (body.filialDestinoId !== undefined) data.filialDestinoId = body.filialDestinoId
      if (body.transportadora !== undefined) data.transportadora = body.transportadora || null
      if (body.observacoes !== undefined) data.observacoes = body.observacoes || null
      if (body.entradaRp !== undefined) data.entradaRp = body.entradaRp
      const notaFiscal = await notaFiscalService.update(id, data)
      return reply.send(notaFiscal)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao atualizar nota fiscal' })
    }
  })

  // Excluir NF (apenas ADMIN)
  app.delete('/notas-fiscais/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      // Verificar se é ADMIN
      if (request.user.perfil !== 'ADMIN') {
        return reply.status(403).send({ error: 'Apenas administradores podem excluir notas fiscais' })
      }

      const { id } = idParamSchema.parse(request.params)
      await notaFiscalService.delete(id)
      return reply.status(204).send()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao excluir nota fiscal' })
    }
  })

  // Liberar/Bloquear mercadoria
  app.patch('/notas-fiscais/:id/mercadoria-bloqueada', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const { id } = idParamSchema.parse(request.params)
      
      const bodySchema = z.object({
        bloqueada: z.boolean()
      })
      const { bloqueada } = bodySchema.parse(request.body)
      
      const notaFiscal = await notaFiscalService.toggleBloqueioMercadoria(id, bloqueada)
      return reply.send(notaFiscal)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao alterar bloqueio da mercadoria' })
    }
  })

  // Conferir todos os itens de uma vez
  app.post('/notas-fiscais/:id/itens/conferir-todos', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const { id } = idParamSchema.parse(request.params)
      
      const bodySchema = z.object({
        quantidades: z.record(z.string(), z.coerce.number().min(0))
      })
      const { quantidades } = bodySchema.parse(request.body)
      
      const result = await notaFiscalService.conferirTodosItens(id, quantidades)
      return reply.send(result)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao conferir itens' })
    }
  })

  // Conferir item individual
  app.post('/notas-fiscais/:id/itens/:itemId/conferir', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const paramsSchema = z.object({
        id: z.string().uuid(),
        itemId: z.string().uuid()
      })
      const { id, itemId } = paramsSchema.parse(request.params)
      
      const bodySchema = z.object({
        quantidadeConferida: z.coerce.number().min(0)
      })
      const { quantidadeConferida } = bodySchema.parse(request.body)
      
      const item = await notaFiscalService.conferirItem(id, itemId, quantidadeConferida, request.user.id)
      return reply.send(item)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao conferir item' })
    }
  })

  // Relatório por filial de recebimento
  app.get('/notas-fiscais/relatorio/filial/:filialId', { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const paramsSchema = z.object({
        filialId: z.string().uuid()
      })
      const { filialId } = paramsSchema.parse(request.params)
      const notas = await notaFiscalService.getByFilialRecebimento(filialId)
      return reply.send(notas)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      return reply.status(500).send({ error: 'Erro ao buscar relatório' })
    }
  })
}
